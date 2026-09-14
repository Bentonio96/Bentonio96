/**
 * ─────────────────────────────────────────────────────────────
 *  ÚNICO ARCHIVO QUE HAY QUE EDITAR PARA CAMBIAR EL PERFIL.
 * ─────────────────────────────────────────────────────────────
 *
 * Después de editar, corre `npm run generar`: rehace los SVG de assets/
 * y los dos README. No edites README.md a mano, se sobrescribe.
 *
 * Los textos van en inglés y español. El README.md que muestra GitHub es
 * el inglés; el español vive en README.es.md y se enlazan entre sí.
 */

export const perfil = {
  usuario: "Bentonio96",
  nombre: "Benjamín",
  apellido: "Peña",
  sitio: "https://benjamin-pena.vercel.app",
  linkedin: "https://www.linkedin.com/in/benjam%C3%ADn-pe%C3%B1a",
  cv: "https://benjamin-pena.vercel.app/CV-Benjamin-Pena.pdf",
  email: "benja.diaz.2911@gmail.com",
  // Va en una línea bajo el nombre; se guarda partido por si vuelve a ir en dos.
  lema: {
    en: ["Frontend developer and", "data analyst in Santiago, Chile."],
    es: ["Desarrollador frontend y", "analista de datos en Santiago, Chile."],
  },
  intro: {
    en: [
      "I'm finishing Computer Engineering at Universidad Andrés Bello (graduating November 2026). I build interfaces that are fast, accessible and pleasant to use, and lately most of them are about Chile: its sky, its earthquakes and its economy.",
      "Before that I spent a year and a half at CMPC, first building Power BI reports as a data analyst and then designing and launching the internal portal for the IT/OT cybersecurity operations team. Right now I'm writing my thesis on metaheuristics for combinatorial optimization and taking on freelance frontend work.",
      "I'm open to full-time and freelance roles.",
    ],
    es: [
      "Estoy terminando Ingeniería Civil en Informática en la Universidad Andrés Bello (egreso en noviembre de 2026). Construyo interfaces rápidas, accesibles y agradables de usar, y últimamente casi todas son sobre Chile: su cielo, sus sismos y su economía.",
      "Antes pasé un año y medio en CMPC, primero como analista de datos haciendo reportes en Power BI y después diseñando y poniendo en marcha el portal interno del área de ciberseguridad TI/OT. Ahora estoy con mi tesis sobre metaheurísticas para optimización combinatoria y tomo proyectos freelance de frontend.",
      "Estoy disponible para trabajo full-time y freelance.",
    ],
  },
};

/**
 * `motivo` elige el dibujo animado de la franja (ver MOTIVOS en generar.mjs).
 * El orden de este arreglo es el orden en el perfil.
 */
export const proyectos = [
  {
    slug: "atacama",
    nombre: { en: "Atacama", es: "Atacama" },
    motivo: "cruz-del-sur",
    descripcion: {
      en: "A scroll-driven visual essay about the Atacama sky and astronomy in Chile, in seven chapters and two languages. Accessible end to end, with a real reduced-motion version instead of animations simply switched off.",
      es: "Ensayo visual sobre el cielo de Atacama y la astronomía en Chile, contado con scroll en siete capítulos y dos idiomas. Accesible de punta a punta, con una versión real para movimiento reducido y no solo las animaciones apagadas.",
    },
    tecnologias: ["React 19", "TypeScript", "GSAP ScrollTrigger", "D3", "Tailwind CSS"],
    demo: "https://atacama-puce.vercel.app",
    repo: "Atacama",
  },
  {
    slug: "epicentro",
    nombre: { en: "Epicentro", es: "Epicentro" },
    motivo: "sismograma",
    descripcion: {
      en: "Real-time earthquake tracker for Chile using USGS data. A live map synced with a listing that works end to end with a keyboard and a screen reader.",
      es: "Rastreador de sismos en Chile en tiempo real con datos del USGS. Un mapa en vivo sincronizado con un listado que funciona entero con teclado y lector de pantalla.",
    },
    tecnologias: ["Next.js 15", "TypeScript", "MapLibre", "Recharts", "Tailwind CSS"],
    demo: "https://epicentro-sigma.vercel.app",
    repo: "Epicentro",
  },
  {
    slug: "barometro",
    nombre: { en: "Barómetro", es: "Barómetro" },
    motivo: "series",
    descripcion: {
      en: "Chilean economic indicators, built around what most dashboards get wrong: series published at different frequencies. Daily values, history, base-100 comparison and a CLP/UF/UTM/USD/EUR converter, from mindicador.cl.",
      es: "Indicadores económicos de Chile, pensado para lo que la mayoría de los dashboards resuelve mal: series que se publican con distinta frecuencia. Valores del día, histórico, comparación en base 100 y conversor CLP/UF/UTM/USD/EUR, desde mindicador.cl.",
    },
    tecnologias: ["Next.js 15", "TypeScript", "Recharts", "Tailwind CSS"],
    demo: "https://barometro-hazel.vercel.app",
    repo: "Barometro",
  },
  {
    slug: "centinela",
    nombre: { en: "Centinela", es: "Centinela" },
    motivo: "incidentes",
    descripcion: {
      en: "Security incident monitoring dashboard. A single screen where an analyst sees what's open, what's critical and what to look at next.",
      es: "Dashboard de monitoreo de incidentes de ciberseguridad. Una sola pantalla donde el analista ve qué hay abierto, qué es crítico y qué conviene mirar ahora.",
    },
    tecnologias: ["React 19", "TypeScript", "Recharts", "Vite", "Tailwind CSS"],
    demo: "https://centinela-rho.vercel.app",
    repo: "Centinela",
  },
  {
    slug: "turnera",
    nombre: { en: "Turnera", es: "Turnera" },
    motivo: "agenda",
    descripcion: {
      en: "Product site for a fictional appointment-scheduling app for small clinics. The product isn't real; the visual craft and the performance budget are (Lighthouse 99/100/100/100).",
      es: "Sitio de producto para una app ficticia de gestión de turnos en clínicas pequeñas. El producto no existe; el rigor visual y el presupuesto de rendimiento sí (Lighthouse 99/100/100/100).",
    },
    tecnologias: ["React 19", "TypeScript", "Framer Motion", "Vite", "Tailwind CSS"],
    demo: "https://turnera-iota.vercel.app",
    repo: "Turnera",
  },
  {
    slug: "portafolio",
    nombre: { en: "Portfolio", es: "Portafolio" },
    motivo: "lighthouse",
    descripcion: {
      en: "My personal site, in Spanish and English, with light and dark themes. Zero axe-core violations and Lighthouse 100 on desktop.",
      es: "Mi sitio personal, en español e inglés, con tema claro y oscuro. Cero violaciones de axe-core y Lighthouse 100 en escritorio.",
    },
    tecnologias: ["Next.js 15", "TypeScript", "GSAP", "Lenis", "Tailwind CSS"],
    demo: "https://benjamin-pena.vercel.app",
    repo: "Landing-Page",
  },
];

/** Lo mismo que la sección Stack del portafolio, sin la lista completa. */
export const stack = [
  {
    titulo: { en: "Frontend", es: "Frontend" },
    items: ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind CSS", "GSAP", "Framer Motion", "D3"],
  },
  {
    titulo: { en: "Data and back end", es: "Datos y back" },
    items: ["Power BI", "Power Query", "Python", "SQL Server", "Oracle", ".NET"],
  },
  {
    titulo: { en: "Tools", es: "Herramientas" },
    items: ["Figma", "Power Pages", "Power Apps", "Git", "Vercel", "Vite"],
  },
  {
    titulo: { en: "Currently learning", es: "Incorporando" },
    items: ["shadcn/ui", "Zustand", "Storybook", "Vitest"],
  },
];
