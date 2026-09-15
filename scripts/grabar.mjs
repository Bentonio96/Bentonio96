/**
 * Graba cada sitio mientras se usa y lo guarda como WebP animado.
 *
 *   npm run grabar              (todos)
 *   npm run grabar -- turnera   (solo los que empiezan así)
 *
 * GitHub no deja incrustar una página en un README: ni iframes, ni
 * JavaScript, ni videos que se reproduzcan solos. Lo más cercano es una
 * imagen animada de la página de verdad en uso, así que eso es lo que se
 * hace: el Chrome instalado abre el sitio, un cursor visible recorre un
 * guion (clics, hover, escribir, scroll) y cada fotograma que pinta el
 * navegador se guarda. Después se arma el WebP con sharp, sin ffmpeg.
 *
 * Los fotogramas llegan por el screencast de Chrome (CDP), que manda uno
 * cada vez que la página se repinta, con su marca de tiempo. Se remuestrean
 * a FPS fijos y los repetidos se funden en un solo fotograma más largo.
 *
 * Los guiones buscan los elementos por su texto o aria-label. Si un sitio
 * cambia y un paso falla, se avisa y la grabación sigue con el siguiente.
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";
import sharp from "sharp";
import opentype from "opentype.js";
import { proyectos } from "./datos.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const VIEWPORT = { width: 1280, height: 800 };
const ANCHO = 720;
const BARRA = 28;
const FPS = 12;

/* ============================================================
   CURSOR
   Headless no dibuja el puntero, así que se inyecta uno que sigue los
   eventos reales del mouse, con un anillo violeta en cada clic. Va
   colgado de <html> y se repone si la hidratación lo borra.
   ============================================================ */

function cursor() {
  const poner = () => {
    if (document.getElementById("__cursor")) return;
    const c = document.createElement("div");
    c.id = "__cursor";
    c.innerHTML =
      '<svg width="30" height="30" viewBox="0 0 30 30"><path d="M5 3l19 11-8.4 1.8-3.8 8.2z" fill="#fff" stroke="#0E1117" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, {
      position: "fixed",
      left: "0",
      top: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
      transform: window.__pos || "translate(-100px,-100px)",
      filter: "drop-shadow(0 2px 4px rgba(0,0,0,.45))",
    });
    document.documentElement.appendChild(c);
  };
  addEventListener(
    "mousemove",
    (e) => {
      window.__pos = `translate(${e.clientX - 5}px,${e.clientY - 3}px)`;
      poner();
      document.getElementById("__cursor").style.transform = window.__pos;
    },
    true,
  );
  addEventListener(
    "mousedown",
    (e) => {
      const o = document.createElement("div");
      Object.assign(o.style, {
        position: "fixed",
        left: `${e.clientX - 20}px`,
        top: `${e.clientY - 20}px`,
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: "3px solid #6C5CFF",
        zIndex: "2147483646",
        pointerEvents: "none",
        transition: "transform .5s ease-out, opacity .5s ease-out",
      });
      document.documentElement.appendChild(o);
      requestAnimationFrame(() => {
        o.style.transform = "scale(1.9)";
        o.style.opacity = "0";
      });
      setTimeout(() => o.remove(), 650);
    },
    true,
  );
  setInterval(poner, 400);
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", poner);
  else poner();
}

/* ============================================================
   ACCIONES
   ============================================================ */

function acciones(p) {
  let pos = { x: VIEWPORT.width * 0.62, y: VIEWPORT.height * 0.72 };
  const esperar = (ms) => p.waitForTimeout(ms);
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  // Los movimientos se miden con el reloj y no contando pasos: cada
  // llamada al navegador tarda lo suyo, y con pasos fijos un gesto de
  // 750 ms terminaba durando el doble y la demo, casi 30 segundos.
  async function moverA(x, y, ms = 750) {
    const desde = { ...pos };
    const t0 = Date.now();
    for (;;) {
      const k = Math.min(1, (Date.now() - t0) / ms);
      const e = suave(k);
      await p.mouse.move(desde.x + (x - desde.x) * e, desde.y + (y - desde.y) * e);
      if (k === 1) break;
    }
    pos = { x, y };
  }

  /** Rueda del mouse repartida en el tiempo, para que el scroll se vea. */
  async function rueda(dy, ms = 1200) {
    const t0 = Date.now();
    let hecho = 0;
    for (;;) {
      const k = Math.min(1, (Date.now() - t0) / ms);
      const objetivo = dy * suave(k);
      await p.mouse.wheel(0, objetivo - hecho);
      hecho = objetivo;
      if (k === 1) break;
      await esperar(20);
    }
  }

  /** Trae el elemento al tercio superior de la pantalla con la rueda. */
  async function aVista(loc) {
    const caja = await loc.boundingBox();
    if (!caja) throw new Error("sin caja");
    const objetivo = VIEWPORT.height * 0.35;
    if (caja.y < 60 || caja.y + caja.height > VIEWPORT.height - 40) {
      await rueda(caja.y - objetivo, 1100);
      await esperar(500);
    }
  }

  async function sobre(loc, ms = 750, dx = 0.5, dy = 0.5) {
    // Hay sitios con una copia oculta del mismo control (la versión móvil):
    // se toma la primera que se ve.
    const el = loc.filter({ visible: true }).first();
    await el.waitFor({ state: "visible", timeout: 8000 });
    await aVista(el);
    const caja = await el.boundingBox();
    await moverA(caja.x + caja.width * dx, caja.y + caja.height * dy, ms);
  }

  async function clic(loc, ms) {
    await sobre(loc, ms);
    await p.mouse.down();
    await esperar(90);
    await p.mouse.up();
  }

  async function escribir(texto, retraso = 110) {
    await p.keyboard.type(texto, { delay: retraso });
  }

  /** Un paso que falla no corta la grabación. */
  async function paso(nombre, fn) {
    try {
      await fn();
    } catch (e) {
      console.warn(`\n  ⚠ paso "${nombre}" falló: ${e.message.split("\n")[0]}`);
    }
  }

  return { esperar, moverA, rueda, sobre, clic, escribir, paso };
}

/* ============================================================
   GUIONES — uno por proyecto, entre 9 y 12 segundos
   ============================================================ */

const GUIONES = {
  async portafolio(p, a) {
    await a.esperar(2600); // el nombre entra letra a letra
    await a.paso("ir a proyectos", async () => {
      await a.clic(p.locator('header a[href="#proyectos"]'));
      await a.esperar(1900);
    });
    await a.paso("apuntar un proyecto", async () => {
      await a.sobre(p.locator(".fila-proyecto .captura-proyecto"), 800, 0.4, 0.45);
      await a.esperar(500);
      await a.moverA(...(await centro(p.locator(".fila-proyecto .captura-proyecto").first(), 0.7, 0.6)), 900);
      await a.esperar(700);
    });
    await a.paso("cambiar tema", async () => {
      await a.clic(p.locator('header button[aria-label*="light" i], header button[aria-label*="claro" i]'));
      await a.esperar(1800);
    });
  },

  async atacama(p, a, idioma) {
    await a.esperar(2200);
    if (idioma === "en") {
      await a.paso("cambiar a inglés", async () => {
        await a.clic(p.locator("button", { hasText: /^\s*EN/ }));
        await a.esperar(900);
      });
    }
    await a.moverA(900, 520, 600);
    for (let i = 0; i < 4; i++) {
      await a.rueda(700, 1500);
      await a.esperar(700);
    }
  },

  async epicentro(p, a) {
    await a.esperar(2200); // mapa y puntos
    await a.paso("recorrer el listado", async () => {
      const filas = p.locator('a[href^="/sismo/"]');
      for (let i = 0; i < 4; i++) {
        await a.sobre(filas.nth(i), 550, 0.35, 0.5);
        await a.esperar(650);
      }
    });
    await a.paso("acercar el mapa", async () => {
      await a.clic(p.locator(".maplibregl-ctrl-zoom-in"));
      await a.esperar(700);
      await p.mouse.down();
      await p.mouse.up();
      await a.esperar(900);
    });
    await a.paso("arrastrar el mapa", async () => {
      const canvas = p.locator("canvas").first();
      const [x, y] = await centro(canvas, 0.55, 0.5);
      await a.moverA(x, y, 700);
      await p.mouse.down();
      await a.moverA(x - 160, y + 90, 900);
      await p.mouse.up();
      await a.esperar(1200);
    });
  },

  async barometro(p, a) {
    await a.esperar(1400);
    await a.paso("escribir un monto", async () => {
      // El campo del monto no declara type: se busca por descarte.
      await a.clic(p.locator('main input:not([type="date"]):not([type="hidden"]):not([type="radio"])'));
      await p.keyboard.press("Control+A");
      await a.escribir("250000");
      await a.esperar(1300);
    });
    await a.paso("invertir unidades", async () => {
      await a.clic(p.getByRole("button", { name: /Invertir unidades/ }));
      await a.esperar(1500);
    });
    await a.paso("otra moneda", async () => {
      const destino = p.locator("select").nth(1);
      await a.sobre(destino, 700);
      await destino.selectOption({ label: /USD|Dólar/i }).catch(() => destino.selectOption({ index: 3 }));
      await a.esperar(1600);
    });
  },

  async centinela(p, a) {
    await a.esperar(1800);
    await a.paso("recorrer el gráfico", async () => {
      await a.moverA(120, 360, 700);
      await a.moverA(470, 350, 2000);
      await a.esperar(400);
    });
    await a.paso("filtrar críticos", async () => {
      await a.clic(p.getByRole("button", { name: /incidentes críticos/ }));
      await a.esperar(1500);
    });
    await a.paso("buscar", async () => {
      await a.clic(p.locator('input[type="search"]'));
      await a.escribir("phishing");
      await a.esperar(1600);
    });
  },

  async turnera(p, a) {
    await a.esperar(1800);
    await a.paso("elegir profesional", async () => {
      await a.clic(p.getByRole("button", { name: "Dr. Vidal" }));
      await a.esperar(600);
    });
    await a.paso("elegir día", async () => {
      await a.clic(p.getByRole("button", { name: /jueves 27/ }), 600);
      await a.esperar(600);
    });
    await a.paso("elegir hora", async () => {
      await a.clic(p.getByRole("button", { name: /^12:00$/ }), 600);
      await a.esperar(700);
    });
    await a.paso("confirmar", async () => {
      await a.clic(p.getByRole("button", { name: /^Confirmar .+/ }), 700);
      await a.esperar(2000);
    });
  },
};

async function centro(loc, dx = 0.5, dy = 0.5) {
  const c = await loc.boundingBox();
  return [c.x + c.width * dx, c.y + c.height * dy];
}

/* ============================================================
   BARRA DE NAVEGADOR
   Se pega arriba de cada fotograma: puntos, y la dirección en la misma
   Inter Tight del perfil, convertida a trazados.
   ============================================================ */

const inter = (() => {
  const b = readFileSync(join(RAIZ, "node_modules/@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff"));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
})();

async function barra(host) {
  const tam = 10.5;
  const cj = inter.getPath(host, 0, 0, tam).getBoundingBox();
  const x = ANCHO / 2 - (cj.x2 - cj.x1) / 2 - cj.x1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${BARRA}">
<rect width="${ANCHO}" height="${BARRA}" fill="#141922"/>
<rect y="${BARRA - 1}" width="${ANCHO}" height="1" fill="#232A36"/>
${[16, 29, 42].map((cx) => `<circle cx="${cx}" cy="${BARRA / 2}" r="3.8" fill="#3A4353"/>`).join("")}
<rect x="${ANCHO / 2 - 150}" y="5" width="300" height="18" rx="3" fill="#0E1117" stroke="#232A36"/>
<path fill="#8B94A3" d="${inter.getPath(host, x, 18, tam).toPathData(2)}"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/* ============================================================
   GRABACIÓN
   ============================================================ */

async function grabar(contexto, nombre, url, guion, idioma) {
  const p = await contexto.newPage();
  const cdp = await contexto.newCDPSession(p);
  const fotogramas = [];
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    fotogramas.push({ data, t: metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });

  await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await p.waitForLoadState("load").catch(() => {});
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 85,
    maxWidth: VIEWPORT.width,
    maxHeight: VIEWPORT.height,
  });
  await guion(p, acciones(p), idioma);
  await p.waitForTimeout(300);
  await cdp.send("Page.stopScreencast");
  await p.close();

  if (fotogramas.length < 2) throw new Error("sin fotogramas");

  // Remuestreo a FPS fijos; los repetidos alargan el anterior.
  const inicio = fotogramas[0].t;
  const fin = fotogramas.at(-1).t;
  const cuadros = [];
  let j = 0;
  for (let t = inicio; t <= fin + 1e-6; t += 1 / FPS) {
    while (j + 1 < fotogramas.length && fotogramas[j + 1].t <= t) j++;
    if (cuadros.length && cuadros.at(-1).j === j) cuadros.at(-1).ms += 1000 / FPS;
    else cuadros.push({ j, ms: 1000 / FPS });
  }
  cuadros.at(-1).ms += 1200; // pausa antes de repetir

  const tapa = await barra(new URL(url).host);
  const altoVista = Math.round((VIEWPORT.height * ANCHO) / VIEWPORT.width);
  const imagenes = await Promise.all(
    cuadros.map(async ({ j }) => {
      const vista = await sharp(Buffer.from(fotogramas[j].data, "base64"))
        .resize({ width: ANCHO, height: altoVista, fit: "fill" })
        .toBuffer();
      return sharp({
        create: { width: ANCHO, height: BARRA + altoVista, channels: 3, background: "#0E1117" },
      })
        .composite([
          { input: tapa, top: 0, left: 0 },
          { input: vista, top: BARRA, left: 0 },
        ])
        .png()
        .toBuffer();
    }),
  );

  const salida = join(RAIZ, "assets", `demo-${nombre}.webp`);
  const info = await sharp(imagenes, { join: { animated: true } })
    .webp({ loop: 0, delay: cuadros.map((c) => Math.round(c.ms)), quality: 62, effort: 5 })
    .toFile(salida);
  const segundos = cuadros.reduce((s, c) => s + c.ms, 0) / 1000;
  console.log(`${cuadros.length} cuadros, ${segundos.toFixed(1)} s, ${Math.round(info.size / 1024)} KB`);
}

const soloEstos = process.argv.slice(2);
const navegador = await chromium.launch({ channel: "chrome" });

for (const pr of proyectos) {
  const idiomas = pr.idiomasDemo ?? [null];
  for (const idioma of idiomas) {
    const nombre = idioma ? `${pr.slug}-${idioma}` : pr.slug;
    if (soloEstos.length && !soloEstos.some((s) => nombre.startsWith(s))) continue;
    const url = (typeof pr.urlDemo === "string" ? pr.urlDemo : pr.urlDemo?.[idioma ?? "en"]) ?? pr.demo;
    const contexto = await navegador.newContext({ viewport: VIEWPORT, colorScheme: "dark", locale: "es-CL" });
    await contexto.addInitScript(cursor);
    process.stdout.write(`${nombre} ← ${url} … `);
    try {
      await grabar(contexto, nombre, url, GUIONES[pr.slug], idioma ?? "es");
    } catch (e) {
      console.log(`falló: ${e.message}`);
    }
    await contexto.close();
  }
}

await navegador.close();
