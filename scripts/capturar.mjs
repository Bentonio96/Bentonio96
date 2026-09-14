/**
 * Captura cada sitio de datos.mjs para las ventanas del perfil.
 *
 *   npm run capturar      (después, npm run generar)
 *
 * Usa el Chrome instalado en el equipo a través de playwright-core, sin
 * descargar navegadores. Las capturas quedan en capturas/, fuera de git:
 * generar.mjs las incrusta dentro de los SVG, que son lo que se publica.
 *
 * Decisiones:
 *   • Viewport de escritorio (1280 × 800) y página completa recortada a
 *     tres pantallas: la ventana del perfil la recorre con scroll.
 *   • prefers-reduced-motion activado. Los sitios muestran todo en su
 *     lugar final, sin entradas a medio animar ni secciones esperando el
 *     scroll. Atacama y el portafolio tienen versión reducida real.
 *   • Tema oscuro, que es el de casi todos los proyectos por defecto.
 *   • Antes de capturar se recorre la página de a una pantalla para que
 *     carguen las imágenes diferidas y los mapas.
 */

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { proyectos } from "./datos.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAPTURAS = join(RAIZ, "capturas");
mkdirSync(CAPTURAS, { recursive: true });

const VIEWPORT = { width: 1280, height: 800 };
const ALTO_MAXIMO = VIEWPORT.height * 3;
/** Ancho final: la ventana mide 840 y se ve nítida en pantallas 1.25×. */
const ANCHO_FINAL = 1040;

/** Lista de [archivo, url]: el portafolio se captura en cada idioma. */
function objetivos() {
  return proyectos.flatMap((p) =>
    p.captura
      ? Object.entries(p.captura).map(([idioma, url]) => [`${p.slug}-${idioma}`, url])
      : [[p.slug, p.demo]],
  );
}

const soloEstos = process.argv.slice(2);
const navegador = await chromium.launch({ channel: "chrome" });
const contexto = await navegador.newContext({
  viewport: VIEWPORT,
  colorScheme: "dark",
  reducedMotion: "reduce",
});

for (const [nombre, url] of objetivos()) {
  if (soloEstos.length && !soloEstos.some((s) => nombre.startsWith(s))) continue;
  const pagina = await contexto.newPage();
  process.stdout.write(`${nombre} ← ${url} … `);
  await pagina.goto(url, { waitUntil: "networkidle", timeout: 60_000 });

  const alto = await pagina.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < Math.min(alto, ALTO_MAXIMO); y += VIEWPORT.height) {
    await pagina.mouse.wheel(0, VIEWPORT.height);
    await pagina.waitForTimeout(350);
  }
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForLoadState("networkidle");
  await pagina.waitForTimeout(2500);

  const png = await pagina.screenshot({
    fullPage: true,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: Math.min(alto, ALTO_MAXIMO) },
  });
  const salida = join(CAPTURAS, `${nombre}.jpg`);
  const info = await sharp(png)
    .resize({ width: ANCHO_FINAL })
    .jpeg({ quality: 70, mozjpeg: true })
    .toFile(salida);
  console.log(`${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB`);
  await pagina.close();
}

await navegador.close();
