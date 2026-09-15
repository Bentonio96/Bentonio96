/**
 * Genera el encabezado animado y los dos README a partir de datos.mjs.
 *
 *   npm run generar
 *
 * Las capturas de los proyectos no salen de aquí: las toma capturar.mjs
 * (npm run capturar). Este script solo las enlaza.
 *
 * Por qué el encabezado es un SVG:
 *
 * GitHub limpia el HTML de los README: no hay JavaScript ni CSS propio. Lo
 * único que se anima es una imagen, y un SVG cargado como <img> sí ejecuta
 * sus animaciones CSS. Tampoco puede pedir fuentes externas, así que el
 * texto se convierte a trazados con opentype.js: se ve igual en cualquier
 * sistema, con las mismas Bebas Neue e Inter Tight del portafolio.
 *
 * Sale en versión clara y oscura, y el README las elige con <picture>
 * según el tema de GitHub. Los colores son los tokens de "Obsidiana"
 * (globals.css del portafolio). Con prefers-reduced-motion se quitan las
 * animaciones y el encabezado queda completo y quieto.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import { perfil, proyectos, stack } from "./datos.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

function cargarFuente(ruta) {
  const b = readFileSync(join(RAIZ, "node_modules", ruta));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}

const bebas = cargarFuente("@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff");
const interLigera = cargarFuente("@fontsource/inter-tight/files/inter-tight-latin-300-normal.woff");

const TEMAS = {
  light: { texto: "#0E1117", atenuado: "#414A58", bordeFuerte: "#C6CDD8", acento: "#4335C9" },
  dark: { texto: "#F1F3F7", atenuado: "#AFB7C4", bordeFuerte: "#3A4353", acento: "#A79BFF" },
};

const ANCHO = 840;
const SALIDA = "cubic-bezier(0.16, 1, 0.3, 1)";
const r2 = (n) => Math.round(n * 100) / 100;

const caja = (fuente, texto, tam) => fuente.getPath(texto, 0, 0, tam).getBoundingBox();
const trazado = (fuente, texto, x, y, tam) => fuente.getPath(texto, x, y, tam).toPathData(2);

/** Un trazado por glifo, para animarlos uno a uno. Respeta el kerning. */
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
  return salida;
}

const anim = (nombre, dur, retraso, extra = "") =>
  `animation-name:${nombre};animation-duration:${dur}s;animation-delay:${r2(retraso)}s;${extra}`;

/* ============================================================
   ENCABEZADO
   Nombre en la condensada a la mitad del ancho y el lema a su derecha,
   apoyado en la misma línea base. Primero fue un cartel a todo el ancho,
   pero en escritorio tapaba la pantalla antes del primer párrafo.

   Cada letra entra girando sobre su canto inferior, como en el hero del
   sitio. SVG no tiene perspectiva real, pero un giro en X sin perspectiva
   es exactamente un scaleY(cos θ): se ve igual.
   ============================================================ */

function encabezado(tema, idioma) {
  const c = TEMAS[tema];
  const nombre = perfil.nombre.toUpperCase();
  const completo = `${nombre} ${perfil.apellido.toUpperCase()}`;

  const ref = caja(bebas, completo, 100);
  const tam = (100 * ANCHO * 0.5) / (ref.x2 - ref.x1);
  const cj = caja(bebas, completo, tam);
  const base = -cj.y1 + 2; // lo que sube la tilde de la Í

  let i = 0;
  const letras = glifos(bebas, completo, -cj.x1, base, tam)
    .map((d, n) => {
      // El espacio no tiene trazado: los primeros glifos son el nombre.
      const color = n < [...nombre].length ? c.texto : c.acento;
      return `<path class="a caja letra" fill="${color}" style="${anim("voltear", 1.2, 0.15 + i++ * 0.04)}" d="${d}"/>`;
    })
    .join("\n");

  // Lema en dos líneas, la última sobre la base del nombre. Cada línea
  // recorta sus palabras, que suben desde debajo.
  const inicio = cj.x2 - cj.x1 + tam * 0.22;
  const lineas = perfil.lema[idioma];
  let tamLema = 21;
  while (inicio + Math.max(...lineas.map((l) => caja(interLigera, l, tamLema).x2)) > ANCHO - 2) tamLema -= 0.5;
  const interlineado = tamLema * 1.3;

  let palabra = 0;
  const lema = lineas
    .map((texto, n) => {
      const y = base - (lineas.length - 1 - n) * interlineado;
      let x = inicio;
      const palabras = texto
        .split(" ")
        .map((p) => {
          const d = trazado(interLigera, p, x, y, tamLema);
          x += interLigera.getAdvanceWidth(`${p} `, tamLema);
          return `<path class="a caja" fill="${c.atenuado}" style="${anim("subir", 1, 0.6 + palabra++ * 0.05)}" d="${d}"/>`;
        })
        .join("");
      return `<clipPath id="l${n}"><rect x="${r2(inicio - 4)}" y="${r2(y - tamLema - 4)}" width="${ANCHO}" height="${r2(tamLema * 1.45)}"/></clipPath><g clip-path="url(#l${n})">${palabras}</g>`;
    })
    .join("\n");

  const yRegla = base + 18;
  const titulo = `${perfil.nombre} ${perfil.apellido}. ${lineas.join(" ")}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${r2(yRegla + 1)}" viewBox="0 0 ${ANCHO} ${r2(yRegla + 1)}" role="img" aria-label="${titulo}">
<title>${titulo}</title>
<style>
.a { animation-fill-mode: both; animation-timing-function: ${SALIDA}; }
.caja { transform-box: fill-box; }
.letra { transform-origin: 50% 100%; }
@keyframes voltear { from { transform: translateY(${r2(tam * 0.3)}px) scaleY(0); } }
@keyframes subir { from { transform: translateY(${r2(tamLema * 1.2)}px); } }
@keyframes crecer-x { from { transform: scaleX(0); } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
${letras}
${lema}
<rect class="a caja" x="0" y="${r2(yRegla)}" width="${ANCHO}" height="1" fill="${c.bordeFuerte}" style="${anim("crecer-x", 1.6, 0.9, "transform-origin:0 0;")}"/>
</svg>
`;
}

/* ============================================================
   README
   Los proyectos van en una grilla de dos columnas: la captura arriba y
   el texto corto debajo. El HTML de la tabla va sin líneas en blanco, o
   GitHub corta el bloque y lo mezcla con Markdown.
   ============================================================ */

const TEXTOS = {
  en: {
    otro: "[Leer en español](README.es.md)",
    sitio: "Portfolio",
    proyectos: "Projects",
    demo: "Live site",
    codigo: "Source code",
    alt: (n) => `Home page of ${n}`,
  },
  es: {
    otro: "[Read in English](README.md)",
    sitio: "Portafolio",
    proyectos: "Proyectos",
    demo: "Ver sitio",
    codigo: "Código",
    alt: (n) => `Página principal de ${n}`,
  },
};

function capturaDe(p, idioma) {
  const nombre = p.idiomasCaptura ? `${p.slug}-${idioma}` : p.slug;
  const ruta = `assets/captura-${nombre}.webp`;
  return existsSync(join(RAIZ, ruta)) ? ruta : null;
}

function celda(p, idioma) {
  const t = TEXTOS[idioma];
  const sitio = p.urlCaptura?.[idioma] ?? p.demo;
  const captura = capturaDe(p, idioma);
  return [
    `<td width="50%" valign="top">`,
    captura ? `<a href="${sitio}"><img src="${captura}" alt="${t.alt(p.nombre[idioma])}" width="100%"></a>` : "",
    `<h3><a href="${sitio}">${p.nombre[idioma]}</a></h3>`,
    `<p>${p.descripcion[idioma]}</p>`,
    `<p>${p.tecnologias.map((x) => `<code>${x}</code>`).join(" ")}</p>`,
    `<p><a href="${sitio}">${t.demo}</a> &nbsp; <a href="https://github.com/${perfil.usuario}/${p.repo}">${t.codigo}</a></p>`,
    `</td>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function readme(idioma) {
  const t = TEXTOS[idioma];
  const sitio = proyectos.find((p) => p.slug === "portafolio")?.urlCaptura?.[idioma] ?? perfil.sitio;

  const filas = [];
  for (let i = 0; i < proyectos.length; i += 2) {
    filas.push(`<tr>\n${proyectos.slice(i, i + 2).map((p) => celda(p, idioma)).join("\n")}\n</tr>`);
  }

  const filasStack = stack
    .map((g) => `| ${g.titulo[idioma]} | ${g.items.map((x) => `\`${x}\``).join(" ")} |`)
    .join("\n");

  return `<!-- Generado por scripts/generar.mjs. Edita scripts/datos.mjs y corre \`npm run generar\`. -->

<a href="${sitio}">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/encabezado-${idioma}-dark.svg">
  <img alt="${perfil.nombre} ${perfil.apellido}. ${perfil.lema[idioma].join(" ")}" src="assets/encabezado-${idioma}-light.svg" width="100%">
</picture>
</a>

${perfil.intro[idioma].join("\n\n")}

**[${t.sitio}](${sitio})** &nbsp;&nbsp; [LinkedIn](${perfil.linkedin}) &nbsp;&nbsp; [CV (PDF)](${perfil.cv}) &nbsp;&nbsp; [${perfil.email}](mailto:${perfil.email}) &nbsp;&nbsp; ${t.otro}

## ${t.proyectos}

<table>
${filas.join("\n")}
</table>

## Stack

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
  }
}
escribir("README.md", readme("en"));
escribir("README.es.md", readme("es"));

const sinCaptura = proyectos.flatMap((p) => ["en", "es"].filter((i) => !capturaDe(p, i)).map((i) => `${p.slug} (${i})`));
console.log(`Listo: ${escritos.length} archivos.`);
if (sinCaptura.length) console.log(`Sin captura: ${sinCaptura.join(", ")}. Corre npm run capturar.`);
