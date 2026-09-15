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
 * El orden de este arreglo es el orden en el perfil.
 *
 * La captura de cada uno sale de capturar.mjs (la primera pantalla de
 * `demo`). `urlCaptura` e `idiomasCaptura` son opcionales: sirven para
 * capturar una URL distinta por idioma, como el portafolio en /en y /es.
 */
export const proyectos = [
  {
    slug: "portafolio",
    nombre: { en: "Portfolio", es: "Portafolio" },
    descripcion: {
      en: "My personal site, in two languages and two themes. Lighthouse 100 and zero axe-core violations.",
      es: "Mi sitio personal, en dos idiomas y dos temas. Lighthouse 100 y cero violaciones de axe-core.",
    },
    tecnologias: ["Next.js 15", "TypeScript", "GSAP", "Lenis", "Tailwind CSS"],
    demo: "https://benjamin-pena.vercel.app",
    // Se captura en cada idioma para que coincida con el README.
    idiomasCaptura: ["en", "es"],
    urlCaptura: {
      en: "https://benjamin-pena.vercel.app/en",
      es: "https://benjamin-pena.vercel.app/es",
    },
    repo: "Landing-Page",
  },
  {
    slug: "epicentro",
    nombre: { en: "Epicentro", es: "Epicentro" },
    descripcion: {
      en: "Real-time earthquakes in Chile from USGS data, with a map synced to a fully keyboard-accessible listing.",
      es: "Sismos de Chile en tiempo real con datos del USGS, con un mapa sincronizado a un listado accesible con teclado.",
    },
    tecnologias: ["Next.js 15", "TypeScript", "MapLibre", "Recharts", "Tailwind CSS"],
    demo: "https://epicentro-sigma.vercel.app",
    repo: "Epicentro",
  },
  {
    slug: "turnera",
    nombre: { en: "Turnera", es: "Turnera" },
    descripcion: {
      en: "Product site for a fictional scheduling app for small clinics, with a working booking demo. Lighthouse 99/100/100/100.",
      es: "Sitio de producto para una app ficticia de turnos para clínicas, con demo de reserva funcional. Lighthouse 99/100/100/100.",
    },
    tecnologias: ["React 19", "TypeScript", "Framer Motion", "Vite", "Tailwind CSS"],
    demo: "https://turnera-iota.vercel.app",
    repo: "Turnera",
  },
  {
    slug: "centinela",
    nombre: { en: "Centinela", es: "Centinela" },
    descripcion: {
      en: "Security incident dashboard: what is open, what is critical and what to look at next, on one screen.",
      es: "Dashboard de incidentes de ciberseguridad: qué está abierto, qué es crítico y qué mirar ahora, en una pantalla.",
    },
    tecnologias: ["React 19", "TypeScript", "Recharts", "Vite", "Tailwind CSS"],
    demo: "https://centinela-rho.vercel.app",
    repo: "Centinela",
  },
  {
    slug: "atacama",
    nombre: { en: "Atacama", es: "Atacama" },
    // Para el README en inglés, capturar.mjs cambia el sitio a inglés.
    idiomasCaptura: ["en", "es"],
    descripcion: {
      en: "A scroll-driven visual essay about the Atacama sky, in seven chapters, with a real reduced-motion version.",
      es: "Ensayo visual sobre el cielo de Atacama, contado con scroll en siete capítulos y con versión real para movimiento reducido.",
    },
    tecnologias: ["React 19", "TypeScript", "GSAP ScrollTrigger", "D3", "Tailwind CSS"],
    demo: "https://atacama-puce.vercel.app",
    repo: "Atacama",
  },
  {
    slug: "barometro",
    nombre: { en: "Barómetro", es: "Barómetro" },
    descripcion: {
      en: "Chilean economic indicators that handle series published at different frequencies, plus a CLP/UF/USD converter.",
      es: "Indicadores económicos de Chile que respetan la frecuencia de cada serie, con conversor CLP/UF/USD.",
    },
    tecnologias: ["Next.js 15", "TypeScript", "Recharts", "Tailwind CSS"],
    demo: "https://barometro-hazel.vercel.app",
    repo: "Barometro",
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
