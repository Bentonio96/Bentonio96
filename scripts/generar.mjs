/**
 * Genera los SVG animados de assets/ y los dos README a partir de datos.mjs.
 *
 *   npm run generar
 *
 * Por qué SVG y por qué así:
 *
 * GitHub limpia el HTML de los README: no hay JavaScript ni CSS propio. Lo
 * único que se anima es una imagen, y un SVG cargado como <img> sí ejecuta
 * sus animaciones CSS. Tampoco puede pedir fuentes externas, así que el
 * texto se convierte a trazados con opentype.js: se ve igual en cualquier
 * sistema, con las mismas Bebas Neue e Inter Tight del portafolio.
 *
 * Cada imagen sale en dos versiones, clara y oscura, y el README las elige
 * con <picture> según el tema de GitHub. Los colores son los tokens de
 * "Obsidiana" (globals.css del portafolio), y la tinta oscura #0E1117 es
 * casi idéntica al fondo oscuro de GitHub (#0D1117): el titular queda
 * impreso sobre la página, sin caja alrededor.
 *
 * Reglas de movimiento, heredadas del sitio:
 *   • Una sola entrada orquestada: el nombre. Lo demás es más discreto.
 *   • La curva es la de salida del sitio, cubic-bezier(0.16, 1, 0.3, 1).
 *   • Todo tiene su estado final como estado por defecto. Con
 *     prefers-reduced-motion se quitan las animaciones y la imagen queda
 *     completa y quieta.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import { perfil, proyectos, stack } from "./datos.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(RAIZ, "assets");
mkdirSync(ASSETS, { recursive: true });

function cargarFuente(ruta) {
  const b = readFileSync(join(RAIZ, "node_modules", ruta));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}

const bebas = cargarFuente("@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff");
const interLigera = cargarFuente("@fontsource/inter-tight/files/inter-tight-latin-300-normal.woff");
const interNormal = cargarFuente("@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff");

/* ============================================================
   TOKENS — copiados de globals.css del portafolio
   ============================================================ */

const TEMAS = {
  light: {
    texto: "#0E1117",
    atenuado: "#414A58",
    tenue: "#555E6C",
    borde: "#E0E3E9",
    bordeFuerte: "#C6CDD8",
    acento: "#4335C9",
    vivo: "#6C5CFF",
  },
  dark: {
    texto: "#F1F3F7",
    atenuado: "#AFB7C4",
    tenue: "#8B94A3",
    borde: "#232A36",
    bordeFuerte: "#3A4353",
    acento: "#A79BFF",
    vivo: "#6C5CFF",
  },
};

const ANCHO = 840;
const SALIDA = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ============================================================
   TIPOGRAFÍA A TRAZADOS
   ============================================================ */

const r2 = (n) => Math.round(n * 100) / 100;

/** Caja de un texto a un tamaño dado, con el origen en la línea base. */
function caja(fuente, texto, tam) {
  return fuente.getPath(texto, 0, 0, tam).getBoundingBox();
}

/**
 * Coloca cada glifo por separado para poder animarlos uno a uno. Respeta
 * el kerning de la fuente. Devuelve los trazados y dónde termina el texto.
 */
function glifos(fuente, texto, x, y, tam) {
  const escala = tam / fuente.unitsPerEm;
  const lista = fuente.stringToGlyphs(texto);
  const salida = [];
  let cursor = x;
  lista.forEach((g, i) => {
    const d = g.getPath(cursor, y, tam).toPathData(2);
    if (d) salida.push(d);
    cursor += g.advanceWidth * escala;
    if (i < lista.length - 1) cursor += fuente.getKerningValue(g, lista[i + 1]) * escala;
  });
  return { trazados: salida, fin: cursor };
}

const trazado = (fuente, texto, x, y, tam) => fuente.getPath(texto, x, y, tam).toPathData(2);

/* ============================================================
   ESQUELETO SVG
   ============================================================ */

const CSS_BASE = `
.a { animation-fill-mode: both; animation-timing-function: ${SALIDA}; }
.caja { transform-box: fill-box; }
@keyframes trazar { from { stroke-dashoffset: 1; } }
@keyframes crecer-x { from { transform: scaleX(0); } }
@keyframes crecer-y { from { transform: scaleY(0); } }
@keyframes aparecer { from { transform: scale(0); } }
@keyframes titilar { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
@keyframes onda { from { transform: scale(1); opacity: 0.9; } to { transform: scale(5); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}`;

function svg({ alto, titulo, css = "", cuerpo }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${r2(alto)}" viewBox="0 0 ${ANCHO} ${r2(alto)}" role="img" aria-label="${titulo}">
<title>${titulo}</title>
<style>${CSS_BASE}${css}
</style>
${cuerpo}
</svg>
`;
}

/** Atajo para style="animation: …" con retraso en segundos. */
const anim = (nombre, dur, retraso, extra = "") =>
  `animation-name:${nombre};animation-duration:${dur}s;animation-delay:${r2(retraso)}s;${extra}`;

/* ============================================================
   ENCABEZADO
   Nombre a todo el ancho, en dos líneas de cartel. Cada letra entra
   girando sobre su canto inferior, como en el hero del sitio. SVG no
   tiene perspectiva real, pero un giro en X sin perspectiva es
   exactamente un scaleY(cos θ): se ve igual.
   ============================================================ */

function encabezado(tema, idioma) {
  const c = TEMAS[tema];
  const linea1 = perfil.nombre.toUpperCase();
  const linea2 = perfil.apellido.toUpperCase();

  // Tamaño tal que la primera línea ocupe el ancho completo.
  const ref = caja(bebas, linea1, 100);
  const tam = Math.floor((100 * ANCHO) / (ref.x2 - ref.x1));
  const c1 = caja(bebas, linea1, tam);
  const c2 = caja(bebas, linea2, tam);

  const base1 = -c1.y1 + 4;
  // La tilde de la Ñ sube sobre la altura de mayúsculas: la segunda línea
  // se separa lo justo para que no toque la primera.
  const base2 = base1 + Math.max(tam * 0.86, -c2.y1 + tam * 0.07);

  const n1 = glifos(bebas, linea1, -c1.x1, base1, tam);
  const n2 = glifos(bebas, linea2, -c2.x1, base2, tam);

  let i = 0;
  const letra = (d, color) =>
    `<path class="a caja letra" fill="${color}" style="${anim("voltear", 1.2, 0.15 + i++ * 0.045)}" d="${d}"/>`;
  const nombre = [
    ...n1.trazados.map((d) => letra(d, c.texto)),
    ...n2.trazados.map((d) => letra(d, c.acento)),
  ].join("\n");

  // Lema: a la derecha del apellido, con la última línea sobre su base.
  const inicioLema = c2.x2 - c2.x1 + tam * 0.09;
  const lineas = perfil.lema[idioma];
  let tamLema = 31;
  const anchoMax = () => Math.max(...lineas.map((l) => caja(interLigera, l, tamLema).x2));
  while (inicioLema + anchoMax() > ANCHO - 2) tamLema -= 0.5;
  const interlineado = tamLema * 1.3;

  let palabra = 0;
  const lema = lineas
    .map((texto, n) => {
      const base = base2 - (lineas.length - 1 - n) * interlineado;
      const arriba = base - tamLema;
      // Cada línea recorta a sus palabras: suben desde debajo de la línea.
      const recorte = `<clipPath id="l${n}"><rect x="${r2(inicioLema - 4)}" y="${r2(arriba - 4)}" width="${r2(ANCHO)}" height="${r2(tamLema * 1.45)}"/></clipPath>`;
      let x = inicioLema;
      const palabras = texto.split(" ").map((p) => {
        const d = trazado(interLigera, p, x, base, tamLema);
        x += interLigera.getAdvanceWidth(p + " ", tamLema);
        return `<path class="a caja" fill="${c.atenuado}" style="${anim("subir", 1, 0.75 + palabra++ * 0.05)}" d="${d}"/>`;
      });
      return `${recorte}<g clip-path="url(#l${n})">${palabras.join("")}</g>`;
    })
    .join("\n");

  const yRegla = base2 + 30;
  const regla = `<rect class="a caja" x="0" y="${r2(yRegla)}" width="${ANCHO}" height="1" fill="${c.bordeFuerte}" style="${anim("crecer-x", 1.6, 1.05, "transform-origin:0 0;")}"/>`;

  const css = `
.letra { transform-origin: 50% 100%; }
@keyframes voltear { from { transform: translateY(${r2(tam * 0.3)}px) scaleY(0); } }
@keyframes subir { from { transform: translateY(${r2(tamLema * 1.2)}px); } }`;

  return svg({
    alto: yRegla + 2,
    titulo: `${perfil.nombre} ${perfil.apellido}. ${lineas.join(" ")}`,
    css,
    cuerpo: `${nombre}\n${lema}\n${regla}`,
  });
}

/* ============================================================
   MOTIVOS
   Un dibujo por proyecto, en una caja de 170 × 96, a la derecha de
   cada franja. Líneas en gris y un solo elemento violeta. Se dibujan
   una vez; solo lo que en el tema está "vivo" (el cielo, un sismógrafo)
   sigue moviéndose, y muy despacio.
   ============================================================ */

/** Generador pseudoaleatorio con semilla: el dibujo sale igual cada vez. */
function azar(semilla) {
  let s = semilla;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const linea = (pts) => "M" + pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join("L");

const MOTIVOS = {
  /** La Cruz del Sur con los Punteros (α y β Centauri), como se ve desde Chile. */
  "cruz-del-sur"(c, t0) {
    const estrellas = [
      // [x, y, radio, color]
      [92, 8, 2.6, c.texto], // Gacrux
      [102, 88, 3.4, c.vivo], // Acrux, la más brillante
      [60, 42, 2.9, c.texto], // Mimosa
      [132, 36, 2.1, c.texto], // δ Crucis
      [117, 62, 1.5, c.texto], // ε Crucis
      [10, 70, 2.9, c.texto], // α Centauri
      [32, 58, 2.3, c.texto], // β Centauri
    ];
    const tenues = [[22, 12], [48, 88], [152, 14], [164, 78], [76, 72], [144, 92], [4, 36], [160, 50]];
    const trazos = [
      [[92, 8], [102, 88]],
      [[60, 42], [132, 36]],
    ]
      .map(
        (p, n) =>
          `<path class="a" pathLength="1" fill="none" stroke="${c.bordeFuerte}" stroke-width="1" stroke-dasharray="1.01 2" d="${linea(p)}" style="${anim("trazar", 1.4, t0 + 0.5 + n * 0.25)}"/>`,
      )
      .join("");
    const brillantes = estrellas
      .map(
        ([x, y, r, color], n) =>
          `<circle class="a caja" cx="${x}" cy="${y}" r="${r}" fill="${color}" style="transform-origin:center;animation:aparecer 0.7s ${SALIDA} ${r2(t0 + n * 0.08)}s both, titilar ${4 + (n % 3)}s ease-in-out ${r2(t0 + 2 + n * 0.7)}s infinite"/>`,
      )
      .join("");
    const fondo = tenues
      .map(
        ([x, y], n) =>
          `<circle cx="${x}" cy="${y}" r="0.9" fill="${c.tenue}" style="animation:titilar ${3 + (n % 4)}s ease-in-out ${r2(n * 0.6)}s infinite"/>`,
      )
      .join("");
    return trazos + fondo + brillantes;
  },

  /** Un sismograma: ruido de fondo, el sismo, y la pluma que sigue escribiendo. */
  sismograma(c, t0) {
    const rnd = azar(11);
    const pts = [];
    for (let x = 0; x <= 150; x += 1.5) {
      let y = 48 + (rnd() - 0.5) * 3;
      if (x >= 50) {
        const amp = 40 * Math.exp(-(x - 50) / 24);
        y += amp * Math.sin((x - 50) * 1.7) * (0.55 + 0.45 * rnd());
      }
      pts.push([x, Math.min(92, Math.max(4, y))]);
    }
    const [px, py] = pts.at(-1);
    return `<path class="a" pathLength="1" fill="none" stroke="${c.tenue}" stroke-width="1.25" stroke-linejoin="round" stroke-dasharray="1.01 2" d="${linea(pts)}" style="${anim("trazar", 2.2, t0, "animation-timing-function:cubic-bezier(0.4,0,0.6,1);")}"/>
<circle class="caja" cx="${px + 6}" cy="${py}" r="3" fill="none" stroke="${c.vivo}" stroke-width="1" style="transform-origin:center;opacity:0;animation:onda 2.8s ease-out ${r2(t0 + 2.3)}s infinite"/>
<circle class="a caja" cx="${px + 6}" cy="${py}" r="3" fill="${c.vivo}" style="transform-origin:center;${anim("aparecer", 0.6, t0 + 2.1)}"/>`;
  },

  /** Dos series que se publican con distinta frecuencia: escalones y diaria. */
  series(c, t0) {
    const rnd = azar(5);
    let escalones = "M0 72";
    let y = 72;
    for (let x = 17; x <= 170; x += 17) {
      escalones += `H${x}V${r2((y -= 3 + rnd() * 3))}`;
    }
    const diaria = [];
    let v = 74;
    for (let x = 0; x <= 170; x += 2) {
      v += (rnd() - 0.56) * 5;
      v = Math.min(84, Math.max(12, v));
      diaria.push([x, v]);
    }
    return `<rect class="a caja" x="0" y="92" width="170" height="1" fill="${c.bordeFuerte}" style="transform-origin:0 0;${anim("crecer-x", 1.2, t0)}"/>
<path fill="none" stroke="${c.borde}" stroke-width="1" stroke-dasharray="3 3" d="M0 50H170"/>
<path class="a" pathLength="1" fill="none" stroke="${c.tenue}" stroke-width="1.25" stroke-dasharray="1.01 2" d="${escalones}" style="${anim("trazar", 1.8, t0 + 0.2)}"/>
<path class="a" pathLength="1" fill="none" stroke="${c.vivo}" stroke-width="1.5" stroke-linejoin="round" stroke-dasharray="1.01 2" d="${linea(diaria)}" style="${anim("trazar", 2, t0 + 0.6)}"/>`;
  },

  /** Histograma de incidentes: el crítico en violeta. */
  incidentes(c, t0) {
    const altos = [22, 34, 28, 46, 38, 78, 54, 30, 42, 26, 18];
    const critico = altos.indexOf(Math.max(...altos));
    const barras = altos
      .map(
        (h, n) =>
          `<rect class="a caja" x="${n * 15 + 5}" y="${92 - h}" width="9" height="${h}" fill="${n === critico ? c.vivo : c.bordeFuerte}" style="transform-origin:50% 100%;${anim("crecer-y", 1.1, t0 + n * 0.06)}"/>`,
      )
      .join("");
    return `${barras}<rect class="a caja" x="0" y="92" width="170" height="1" fill="${c.tenue}" style="transform-origin:0 0;${anim("crecer-x", 1, t0)}"/>`;
  },

  /** Una semana de agenda: turnos tomados y uno que se reserva al final. */
  agenda(c, t0) {
    const tomados = ["0,1", "1,0", "1,2", "2,3", "3,1", "4,0", "4,2", "0,3"];
    const nuevo = "2,1";
    const celdas = [];
    const llenos = [];
    for (let col = 0; col < 5; col++) {
      for (let fila = 0; fila < 4; fila++) {
        const x = col * 33 + 3;
        const y = fila * 21 + 6;
        celdas.push(`<rect x="${x + 0.5}" y="${y + 0.5}" width="26" height="14" fill="none" stroke="${c.borde}"/>`);
        const k = `${col},${fila}`;
        if (tomados.includes(k) || k === nuevo) {
          const retraso = k === nuevo ? t0 + 1.5 : t0 + 0.2 + col * 0.12 + fila * 0.05;
          llenos.push(
            `<rect class="a caja" x="${x}" y="${y}" width="27" height="15" fill="${k === nuevo ? c.vivo : c.bordeFuerte}" style="transform-origin:center;${anim("aparecer", 0.7, retraso)}"/>`,
          );
        }
      }
    }
    return celdas.join("") + llenos.join("");
  },

  /** El anillo de Lighthouse cerrándose en 100. */
  lighthouse(c, t0) {
    const cx = 132;
    const cy = 48;
    const r = 34;
    const cifra = caja(interNormal, "100", 22);
    const x = cx - (cifra.x2 - cifra.x1) / 2 - cifra.x1;
    const y = cy - (cifra.y1 + cifra.y2) / 2;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c.borde}" stroke-width="3"/>
<circle class="a" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c.vivo}" stroke-width="3" pathLength="1" stroke-dasharray="1.01 2" transform="rotate(-90 ${cx} ${cy})" style="${anim("trazar", 1.8, t0)}"/>
<path fill="${c.texto}" d="${trazado(interNormal, "100", x, y, 22)}"/>`;
  },
};

/* ============================================================
   FRANJA DE PROYECTO
   El nombre en la condensada, quieto. Encima, una regla capilar que se
   dibuja de izquierda a derecha (las "trazo-superior" del sitio), y a la
   derecha el motivo. Cada franja arranca un poco después que la anterior:
   como GitHub carga todas las imágenes juntas, se leen en cascada.
   ============================================================ */

const ALTO_FRANJA = 132;

function franja(p, indice, tema, idioma) {
  const c = TEMAS[tema];
  const t0 = 1.25 + indice * 0.2;
  const texto = p.nombre[idioma].toUpperCase();
  const tam = 84;
  const cj = caja(bebas, texto, tam);
  const base = 108;

  return svg({
    alto: ALTO_FRANJA,
    titulo: p.nombre[idioma],
    cuerpo: `<rect class="a caja" x="0" y="0" width="${ANCHO}" height="1" fill="${c.bordeFuerte}" style="transform-origin:0 0;${anim("crecer-x", 1.4, t0 - 0.3)}"/>
<path fill="${c.texto}" d="${trazado(bebas, texto, -cj.x1, base, tam)}"/>
<g transform="translate(${ANCHO - 170} 22)">${MOTIVOS[p.motivo](c, t0)}</g>`,
  });
}

/* ============================================================
   README
   ============================================================ */

const RAW = "assets";

function imagen(nombreBase, alt, enlace) {
  const pic = `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="${RAW}/${nombreBase}-dark.svg">
  <img alt="${alt}" src="${RAW}/${nombreBase}-light.svg" width="100%">
</picture>`;
  return enlace ? `<a href="${enlace}">\n${pic}\n</a>` : pic;
}

const TEXTOS = {
  en: {
    otro: "[Leer en español](README.es.md)",
    sitio: "Portfolio",
    cv: "CV (PDF)",
    proyectos: "Projects",
    stack: "Stack",
    demo: "Live site",
    codigo: "Source code",
    sitioIdioma: "/en",
  },
  es: {
    otro: "[Read in English](README.md)",
    sitio: "Portafolio",
    cv: "CV (PDF)",
    proyectos: "Proyectos",
    stack: "Stack",
    demo: "Ver sitio",
    codigo: "Código",
    sitioIdioma: "/es",
  },
};

/** Los archivos de la franja solo llevan idioma si el nombre cambia. */
const baseFranja = (p, idioma) =>
  p.nombre.en === p.nombre.es ? `proyecto-${p.slug}` : `proyecto-${p.slug}-${idioma}`;

function readme(idioma) {
  const t = TEXTOS[idioma];
  const sitio = perfil.sitio + t.sitioIdioma;
  const u = perfil.usuario;

  const bloques = proyectos.map((p) => {
    const demo = p.slug === "portafolio" ? sitio : p.demo;
    return `${imagen(baseFranja(p, idioma), p.nombre[idioma], demo)}

${p.descripcion[idioma]}

${p.tecnologias.map((x) => `\`${x}\``).join(" ")}<br>
[${t.demo}](${demo}) &nbsp;&nbsp; [${t.codigo}](https://github.com/${u}/${p.repo})
`;
  });

  const filasStack = stack
    .map((g) => `| ${g.titulo[idioma]} | ${g.items.map((x) => `\`${x}\``).join(" ")} |`)
    .join("\n");

  return `<!-- Generado por scripts/generar.mjs. Edita scripts/datos.mjs y corre \`npm run generar\`. -->

${imagen(`encabezado-${idioma}`, `${perfil.nombre} ${perfil.apellido}. ${perfil.lema[idioma].join(" ")}`, sitio)}

${perfil.intro[idioma].join("\n\n")}

**[${t.sitio}](${sitio})** &nbsp;&nbsp; [LinkedIn](${perfil.linkedin}) &nbsp;&nbsp; [${t.cv}](${perfil.cv}) &nbsp;&nbsp; [${perfil.email}](mailto:${perfil.email}) &nbsp;&nbsp; ${t.otro}

## ${t.proyectos}

${bloques.join("\n")}
## ${t.stack}

| | |
|---|---|
${filasStack}
`;
}

/* ============================================================
   ESCRITURA
   ============================================================ */

const escritos = [];
const escribir = (nombre, contenido) => {
  writeFileSync(join(RAIZ, nombre), contenido);
  escritos.push(nombre);
};

for (const idioma of ["en", "es"]) {
  for (const tema of ["light", "dark"]) {
    escribir(`assets/encabezado-${idioma}-${tema}.svg`, encabezado(tema, idioma));
    proyectos.forEach((p, i) => {
      const base = baseFranja(p, idioma);
      // Las franjas compartidas se escriben una sola vez.
      if (idioma === "es" && base === baseFranja(p, "en")) return;
      escribir(`assets/${base}-${tema}.svg`, franja(p, i, tema, idioma));
    });
  }
}
escribir("README.md", readme("en"));
escribir("README.es.md", readme("es"));

console.log(`Listo: ${escritos.length} archivos.\n  ${escritos.join("\n  ")}`);
