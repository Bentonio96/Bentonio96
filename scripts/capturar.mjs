/**
 * Captura la página principal de cada sitio para el perfil.
 *
 *   npm run capturar              (todos)
 *   npm run capturar -- turnera   (solo los que empiezan así)
 *
 * Usa el Chrome instalado a través de playwright-core, sin descargar
 * navegadores. Cada captura es la primera pantalla del sitio en escritorio
 * (1280 × 800) con una barra de navegador encima, y se guarda en assets/
 * como WebP de 1200 px de ancho: la celda del README mide unos 450 px, así
 * que se ve nítida también en pantallas de alta densidad.
 *
 * Antes hubo grabaciones animadas, pero a ese peso se veían borrosas.
 *
 * Decisiones:
 *   • prefers-reduced-motion activado: los sitios muestran todo en su
 *     lugar final, sin entradas a medio animar.
 *   • Tema oscuro, el de casi todos los proyectos por defecto.
 *   • Se espera a que la red quede quieta y un poco más, para que carguen
 *     los mapas, los gráficos y las fuentes.
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
const ANCHO = 1200;
const BARRA = 44;

/** Pasos previos a la captura, por slug. Reciben la página y el idioma. */
const PREPARAR = {
  // Atacama abre en español; para el README en inglés se cambia de idioma.
  async atacama(p, idioma) {
    if (idioma !== "en") return;
    await p.locator("button", { hasText: /^\s*EN/ }).filter({ visible: true }).first().click();
    await p.waitForTimeout(1200);
  },
};

/* ============================================================
   BARRA DE NAVEGADOR
   Puntos y la dirección del sitio en la Inter Tight del perfil,
   convertida a trazados para no depender de fuentes del sistema.
   ============================================================ */

const inter = (() => {
  const b = readFileSync(join(RAIZ, "node_modules/@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff"));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
})();

function barra(host) {
  const tam = 16;
  const cj = inter.getPath(host, 0, 0, tam).getBoundingBox();
  const x = ANCHO / 2 - (cj.x2 - cj.x1) / 2 - cj.x1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${BARRA}">
<rect width="${ANCHO}" height="${BARRA}" fill="#141922"/>
<rect y="${BARRA - 1}" width="${ANCHO}" height="1" fill="#232A36"/>
${[24, 44, 64].map((cx) => `<circle cx="${cx}" cy="${BARRA / 2}" r="6" fill="#3A4353"/>`).join("")}
<rect x="${ANCHO / 2 - 240}" y="8" width="480" height="28" rx="4" fill="#0E1117" stroke="#232A36"/>
<path fill="#8B94A3" d="${inter.getPath(host, x, 28, tam).toPathData(2)}"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/* ============================================================
   CAPTURA
   ============================================================ */

const soloEstos = process.argv.slice(2);
const navegador = await chromium.launch({ channel: "chrome" });

for (const pr of proyectos) {
  for (const idioma of pr.idiomasCaptura ?? [null]) {
    const nombre = idioma ? `${pr.slug}-${idioma}` : pr.slug;
    if (soloEstos.length && !soloEstos.some((s) => nombre.startsWith(s))) continue;
    const url = pr.urlCaptura?.[idioma] ?? pr.demo;
    process.stdout.write(`${nombre} ← ${url} … `);

    const contexto = await navegador.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    const p = await contexto.newPage();
    try {
      await p.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      await PREPARAR[pr.slug]?.(p, idioma);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(2500);

      const vista = await sharp(await p.screenshot())
        .resize({ width: ANCHO })
        .toBuffer();
      const alto = Math.round((VIEWPORT.height * ANCHO) / VIEWPORT.width);
      const info = await sharp({
        create: { width: ANCHO, height: BARRA + alto, channels: 3, background: "#0E1117" },
      })
        .composite([
          { input: await barra(new URL(url).host), top: 0, left: 0 },
          { input: vista, top: BARRA, left: 0 },
        ])
        .webp({ quality: 88, smartSubsample: true, effort: 6 })
        .toFile(join(RAIZ, "assets", `captura-${nombre}.webp`));
      console.log(`${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB`);
    } catch (e) {
      console.log(`falló: ${e.message.split("\n")[0]}`);
    }
    await contexto.close();
  }
}

await navegador.close();
