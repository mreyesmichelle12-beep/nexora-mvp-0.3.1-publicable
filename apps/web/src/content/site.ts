/**
 * Fuente única de contenido público de NEXORA (basada en el Documento Maestro de Contenido y las indicaciones del equipo).
 * REGLAS: sin estadísticas inventadas · sin alianzas, premios, inversiones ni testimonios · sin precios, materiales ni
 * disponibilidad de productos · sólo es `null` / "pendiente" lo que el equipo todavía no ha entregado.
 */

export const PRODUCT_STATUS = "NEXORA está en etapa de prototipo. Lo que ves aquí describe cómo está diseñada la plataforma; las funciones se habilitan por fases y varias dependen de integraciones externas todavía pendientes.";

/* ───────────── Navegación ───────────── */
export interface NavLink { label: string; href: string }

/** Menú principal plano, tal como lo definió el equipo. */
export const NAV: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Plataforma", href: "/plataforma" },
  { label: "Funciones", href: "/funciones" },
  { label: "Para estudiantes", href: "/estudiantes" },
  { label: "Para docentes", href: "/docentes" },
  { label: "Productos", href: "/productos" },
  { label: "Impacto social", href: "/impacto-social" },
  { label: "Planes", href: "/planes" },
  { label: "FAQ", href: "/faq" },
  { label: "Contacto", href: "/contacto" },
];

export const AUTH_LINKS = {
  login: { label: "Iniciar sesión", href: "/iniciar-sesion" },
  register: { label: "Registrarme", href: "/registro" },
  demo: { label: "Probar demo", href: "/demo" },
} as const;

export const FOOTER_COLUMNS: Array<{ title: string; links: NavLink[] }> = [
  { title: "Plataforma", links: [
    { label: "Smart Match", href: "/funciones#smart-match" },
    { label: "Study Rooms", href: "/funciones#study-rooms" },
    { label: "Biblioteca", href: "/funciones#biblioteca" },
    { label: "NEXORA AI", href: "/funciones#nexora-ai" },
    { label: "Planes", href: "/planes" },
  ] },
  { title: "Comunidad", links: [
    { label: "Estudiantes", href: "/estudiantes" },
    { label: "Docentes", href: "/docentes" },
    { label: "Mentores", href: "/docentes#mentores" },
    { label: "Conferencias", href: "/docentes#conferencias" },
  ] },
  { title: "Nosotros", links: [
    { label: "Historia", href: "/historia" },
    { label: "Equipo", href: "/equipo" },
    { label: "Productos", href: "/productos" },
    { label: "Impacto social", href: "/impacto-social" },
  ] },
  { title: "Ayuda", links: [
    { label: "FAQ", href: "/faq" },
    { label: "Contacto", href: "/contacto" },
  ] },
  { title: "Legal", links: [
    { label: "Privacidad", href: "/privacidad" },
    { label: "Términos", href: "/terminos" },
    { label: "Aviso legal", href: "/aviso-legal" },
    { label: "Cookies", href: "/cookies" },
  ] },
];

/* ───────────── Identidad ───────────── */
export const TAGLINE = "Conecta. Aprende. Evoluciona.";
export const HERO_TEXT = "Una plataforma web que conecta estudiantes, docentes y oportunidades de aprendizaje dentro de un mismo ecosistema.";
export const WHAT_IS = "NEXORA es un ecosistema educativo híbrido, principalmente digital, que busca conectar estudiantes universitarios con personas, herramientas y oportunidades de aprendizaje.";
export const SCOPE = "La propuesta inicial está enfocada en estudiantes universitarios de El Salvador, comenzando con la Universidad Don Bosco.";
export const FACILITATES = "NEXORA busca facilitar la colaboración académica, la formación de grupos de estudio y el acceso a herramientas que permitan organizar mejor el aprendizaje.";
export const WEB_NOT_APP = "NEXORA es una plataforma web: la experiencia principal está pensada para computadora y laptop, y se adapta a tablet y móvil desde el navegador.";
export const NAME_CONCEPT = { nexo: "Nexo", hora: "Hora", text: "El nombre combina las ideas de “Nexo” y “Hora”: conexión entre personas y sincronización del tiempo. Se relaciona con encontrar personas que comparten materias y horarios compatibles." };

export const PURPOSE = "Conectar personas alrededor del aprendizaje y facilitar que los estudiantes encuentren compañeros compatibles en materias, horarios, intereses y preferencias de estudio.";

export const VALUE_PROPS = [
  "Conecta a estudiantes que comparten materias.",
  "Considera horarios compatibles.",
  "Considera intereses.",
  "Considera necesidades académicas.",
  "Considera preferencias de estudio.",
  "Permite complementar habilidades.",
];
export const NOT_LIST = ["Una red social genérica", "Un repositorio estático", "Una aplicación de citas"];
export const VALUE_PROP_CLOSING = "La propuesta busca crear conexiones académicas relevantes y facilitar grupos de estudio.";

export const PROBLEM_STATEMENT = "Puede resultar difícil encontrar compañeros que cursen las mismas materias, tengan horarios compatibles y compartan intereses o preferencias de estudio.";
export const PROBLEMS = [
  "Dificultad para encontrar compañeros con horarios compatibles.",
  "Aislamiento académico.",
  "Dificultad para organizar grupos de estudio.",
  "Recursos de estudio dispersos.",
  "Falta de espacios especializados para la colaboración universitaria.",
];
export const EVOLUTION = ["Problema", "Idea", "NEXORA", "Conexión", "Colaboración", "Aprendizaje"];

export const MISSION = "Conectar a estudiantes universitarios con personas, herramientas y oportunidades de aprendizaje mediante un ecosistema seguro, eficiente y orientado a la colaboración.";
export const VISION = "Convertirse en un ecosistema educativo digital y de apoyo estudiantil de referencia en El Salvador.";

export type ValueIcon = "ShieldCheck" | "Handshake" | "Lightbulb";
export const VALUES: Array<{ id: string; title: string; text: string; icon: ValueIcon }> = [
  { id: "seguridad", title: "Seguridad", text: "Proteger la experiencia, información y confianza de los usuarios.", icon: "ShieldCheck" },
  { id: "colaboracion", title: "Colaboración", text: "Facilitar conexiones y aprendizaje entre personas.", icon: "Handshake" },
  { id: "innovacion", title: "Innovación aplicada", text: "Utilizar tecnología para resolver necesidades reales del entorno académico.", icon: "Lightbulb" },
];

/* ───────────── Historia ───────────── */
/** Redacción general, sin fechas ni acontecimientos no documentados. */
export const HISTORY_STEPS: Array<{ id: string; title: string; text: string }> = [
  { id: "problema", title: "Problema", text: "En la vida universitaria puede resultar difícil encontrar compañeros que cursen las mismas materias, tengan horarios compatibles y compartan intereses o preferencias de estudio." },
  { id: "necesidad", title: "Necesidad de conexión académica", text: "De ese problema surge la necesidad de conectar a los estudiantes alrededor de materias concretas, disponibilidad y necesidades académicas, y de facilitar la formación de grupos de estudio." },
  { id: "idea", title: "Idea", text: "La idea es una plataforma web donde los estudiantes encuentren compañeros compatibles y cuenten con herramientas para organizar su aprendizaje. Su nombre une “Nexo” y “Hora”: conexión y sincronización del tiempo." },
  { id: "desarrollo", title: "Desarrollo de NEXORA", text: "El equipo fundador desarrolló la propuesta: definió la experiencia de estudiantes, docentes y mentores, las funciones del ecosistema y los principios de seguridad y privacidad que la guían." },
  { id: "propuesta", title: "Propuesta de plataforma", text: "La propuesta integra Smart Match, Study Rooms, una biblioteca académica, NEXORA AI, conexiones, mensajería, calendario y seguimiento del progreso, además de espacios para docentes, mentores y anfitriones de conferencias." },
  { id: "prototipo", title: "Prototipo", text: "Hoy NEXORA se presenta como un prototipo: una web que muestra cómo funcionará la plataforma. Las funciones se habilitan por fases." },
  { id: "proyeccion", title: "Proyección futura", text: "Se parte de la comunidad de la Universidad Don Bosco con un catálogo académico administrable, lo que permitiría ampliar la propuesta a otras comunidades universitarias más adelante." },
];
export const HISTORY_NOTE = "Este relato es general. La cronología detallada del origen se agregará cuando el equipo la confirme.";

/* ───────────── Equipo ───────────── */
export const TEAM_DEFAULT_ROLE = "Equipo fundador";
export interface TeamMember { slug: string; name: string; photo: string; role: string | null; bio: string | null }
/**
 * Orden de la lista del equipo. Las fotos se asignaron según el orden de los pies de foto del PDF entregado
 * (cada pie precede a su foto). Para corregir una asignación, basta con cambiar `photo` aquí.
 * `role` y `bio` son null hasta que el equipo los confirme: se muestra "Equipo fundador" y un campo editable.
 */
export const TEAM: TeamMember[] = [
  { slug: "krissia", name: "Krissia Raquel Argueta Calona", photo: "/team/krissia.webp", role: null, bio: null },
  { slug: "marjorie", name: "Marjorie Nicole Flores Chávez", photo: "/team/marjorie.webp", role: null, bio: null },
  { slug: "ana-gabriela", name: "Ana Gabriela Torres García", photo: "/team/ana-gabriela.webp", role: null, bio: null },
  { slug: "guillermo", name: "Guillermo Emanuel Valladares Aguilar", photo: "/team/guillermo.webp", role: null, bio: null },
  { slug: "michelle", name: "Michelle Alexandra Elias Reyes", photo: "/team/michelle.webp", role: null, bio: null },
];

/* ───────────── Plataforma y funciones ───────────── */
export const FLOW = [
  { title: "Registro", text: "Creas tu cuenta con los datos mínimos necesarios, por la ruta de estudiante o de docente, mentor o conferencista." },
  { title: "Perfil académico", text: "Indicas universidad, carrera y ciclo o nivel." },
  { title: "Materias y disponibilidad", text: "Eliges tus materias, las que se te dificultan y los horarios en que puedes estudiar." },
  { title: "Smart Match", text: "Ves estudiantes compatibles, con una compatibilidad estimada y el detalle de por qué." },
  { title: "Conexiones", text: "Envías y recibes solicitudes; tú decides con quién conectar." },
  { title: "Study Rooms", text: "Estudian juntos en espacios colaborativos por materia o sesión." },
  { title: "Recursos", text: "Consultas y compartes apuntes, guías y ejercicios en la biblioteca académica." },
  { title: "Progreso", text: "Das seguimiento a tus objetivos, sesiones y racha de estudio." },
];

export type IconName = "Network" | "Video" | "BookOpen" | "Sparkles" | "Users" | "MessageSquare" | "CalendarDays" | "Wrench" | "TrendingUp";
export interface Feature { id: string; name: string; icon: IconName; summary: string; bullets: string[] }

export const SMART_MATCH_WEIGHTS = [
  { factor: "Materias", pct: 35 },
  { factor: "Horarios", pct: 25 },
  { factor: "Intereses", pct: 15 },
  { factor: "Preferencias de estudio", pct: 10 },
  { factor: "Habilidades", pct: 10 },
  { factor: "Modalidad", pct: 5 },
] as const;
export const SMART_MATCH_INPUTS = ["Materias", "Materias difíciles", "Horarios disponibles", "Carrera", "Ciclo o nivel", "Intereses", "Preferencias de estudio", "Habilidades", "Modalidad preferida"];

export const FEATURES: Feature[] = [
  { id: "smart-match", name: "Smart Match", icon: "Network",
    summary: "Encuentra estudiantes compatibles considerando materias, horarios, intereses, preferencias y habilidades.",
    bullets: ["Sugiere estudiantes compatibles; es la función central de NEXORA.", "Muestra una “compatibilidad estimada” y el detalle por factor.", "No recomienda usuarios bloqueados, eliminados ni restringidos."] },
  { id: "study-rooms", name: "Study Rooms", icon: "Video",
    summary: "Espacios colaborativos para estudiar y trabajar en conjunto, organizados por materia o sesión.",
    bullets: ["Antes de entrar puedes ver la cantidad aproximada de participantes y, si la privacidad lo permite, qué conexiones tuyas están presentes.", "Dentro: participantes, chat, reacciones, pizarra colaborativa, temporizador, configuración y salida.", "Cámara, micrófono y pantalla compartida requieren infraestructura de video."] },
  { id: "biblioteca", name: "Biblioteca", icon: "BookOpen",
    summary: "Organización de recursos académicos en un solo lugar.",
    bullets: ["Apuntes, guías, presentaciones, ejercicios, exámenes y documentos.", "Buscar, filtrar, subir, guardar, consultar, descargar cuando corresponda y reportar.", "Los archivos se validan por tipo y tamaño, se almacenan de forma segura y pasan por moderación."] },
  { id: "nexora-ai", name: "NEXORA AI", icon: "Sparkles",
    summary: "Asistente que guía el aprendizaje: tu asistente para aprender, no para sustituir tu aprendizaje.",
    bullets: ["Explica conceptos, hace preguntas guía y organiza temas.", "Crea rutas de estudio y da retroalimentación.", "Detecta temas que conviene reforzar y convierte tus apuntes en preguntas de práctica."] },
  { id: "conexiones", name: "Conexiones", icon: "Users",
    summary: "Red académica para construir tu círculo de estudio.",
    bullets: ["Enviar solicitud, aceptar, rechazar, eliminar una conexión, bloquear y reportar.", "La interacción es académica y profesional.", "Los perfiles aplican minimización de datos y privacidad configurable."] },
  { id: "mensajeria", name: "Mensajería", icon: "MessageSquare",
    summary: "Comunicación entre conexiones para coordinar el estudio.",
    bullets: ["Conversaciones entre conexiones aceptadas, con fecha, hora y estado de lectura.", "Bloqueo y reporte disponibles.", "Controles contra spam y abuso."] },
  { id: "calendario", name: "Calendario", icon: "CalendarDays",
    summary: "Organización académica en una sola vista.",
    bullets: ["Clases, Study Rooms, conferencias, sesiones de estudio y objetivos.", "Vistas mensual, semanal y diaria."] },
  { id: "habilidades", name: "Habilidades", icon: "Wrench",
    summary: "Perfil de habilidades con niveles.",
    bullets: ["Cada habilidad tiene un nivel: básico, intermedio o avanzado.", "Puedes agregar o quitar habilidades cuando quieras.", "Permiten complementar habilidades entre estudiantes."] },
  { id: "progreso", name: "Progreso", icon: "TrendingUp",
    summary: "Objetivos, sesiones y racha de estudio.",
    bullets: ["Racha diaria, objetivos, sesiones completadas, progreso semanal e historial.", "Los recordatorios se pueden controlar o desactivar; evitamos mecanismos manipulativos."] },
];

/** Qué incluye una Study Room y de qué depende cada capacidad (nada se presenta como activo si no lo está). */
export const STUDY_ROOM_CAPS: Array<{ name: string; depends: string | null }> = [
  { name: "Cámara y micrófono", depends: "Proveedor de video (WebRTC)" },
  { name: "Compartir pantalla", depends: "Proveedor de video (WebRTC)" },
  { name: "Participantes presentes", depends: "Servicio en tiempo real" },
  { name: "Chat", depends: "Servicio en tiempo real" },
  { name: "Reacciones", depends: "Servicio en tiempo real" },
  { name: "Pizarra colaborativa", depends: "Servicio en tiempo real" },
  { name: "Temporizador compartido", depends: "Servicio en tiempo real" },
  { name: "Configuración y salir", depends: null },
];

export const LIBRARY_CATEGORIES = ["Apuntes", "Guías", "Presentaciones", "Ejercicios", "Exámenes", "Documentos"];
export const LIBRARY_ACTIONS = ["Buscar", "Filtrar", "Subir", "Guardar", "Consultar", "Descargar (cuando corresponda)", "Reportar"];
export const AI_CAN = ["Explicar conceptos", "Hacer preguntas guía", "Organizar temas", "Crear rutas de estudio", "Dar retroalimentación", "Detectar temas para reforzar", "Convertir apuntes en preguntas de práctica"];
export const AI_TAGLINE = "Tu asistente para aprender, no para sustituir tu aprendizaje.";

/** Integraciones externas necesarias para que cada capacidad sea real. Ninguna está configurada todavía. */
export const INTEGRATIONS_PENDING = [
  { name: "Correo y verificación", needed: "Proveedor de correo transaccional" },
  { name: "Inicio de sesión con Google", needed: "Credenciales OAuth" },
  { name: "Biblioteca de archivos", needed: "Almacenamiento seguro de archivos" },
  { name: "Cámara, micrófono y pantalla", needed: "Proveedor de video (WebRTC)" },
  { name: "Pizarra, chat y temporizador compartidos", needed: "Servicio en tiempo real" },
  { name: "NEXORA AI", needed: "Proveedor de IA y su clave" },
  { name: "Plan Pro", needed: "Proveedor de pagos" },
  { name: "Analítica", needed: "Proveedor de analítica (con consentimiento)" },
];

/** Resumen corto para la portada. */
export const HOME_FEATURE_IDS = ["smart-match", "study-rooms", "biblioteca", "nexora-ai", "conexiones"] as const;

/* ───────────── Públicos ───────────── */
export const AUDIENCES = [
  { id: "estudiantes", title: "Estudiantes", text: "Encuentra compañeros, organiza sesiones y aprende colaborativamente.", href: "/estudiantes" },
  { id: "mentores", title: "Docentes y mentores", text: "Crea espacios académicos, comparte conocimientos y acompaña estudiantes.", href: "/docentes" },
  { id: "conferencistas", title: "Conferencistas", text: "Organiza conferencias y actividades académicas.", href: "/docentes#conferencias" },
];

export const STUDENT_PROFILE_FIELDS = ["Nombre y apellido", "Fotografía (opcional)", "Correo", "Contraseña", "Universidad, carrera y ciclo o nivel", "Materias actuales", "Materias que se te dificultan", "Horarios disponibles", "Intereses", "Preferencias de estudio", "Modalidad preferida", "Habilidades"];

export const STUDENT_EXPERIENCE = [
  { id: "registro", title: "Registro", text: "Te registras con el correo institucional cuando corresponda y solo con los datos útiles. No pedimos tu edad exacta." },
  { id: "perfil", title: "Perfil académico", text: "Universidad, carrera, ciclo o nivel, intereses y habilidades. Tú decides qué se ve y quién lo ve." },
  { id: "materias", title: "Materias y materias difíciles", text: "Marcas lo que cursas y lo que se te dificulta, para encontrar a quien te apoye y a quien tú puedas apoyar." },
  { id: "horarios", title: "Horarios e intereses", text: "Indicas cuándo puedes estudiar y cómo te gusta hacerlo: en línea, presencial o mixto." },
  { id: "smart-match", title: "Smart Match", text: "Una lista de estudiantes compatibles, con compatibilidad estimada y el desglose de por qué." },
  { id: "conexiones", title: "Conexiones", text: "Envías solicitudes y construyes tu red académica. Puedes bloquear o reportar." },
  { id: "study-rooms", title: "Study Rooms", text: "Estudias en espacios colaborativos con personas de tu red." },
  { id: "biblioteca", title: "Biblioteca", text: "Buscas, guardas y compartes apuntes, guías y ejercicios." },
  { id: "ia", title: "NEXORA AI", text: "Te guía con preguntas, explicaciones y rutas de estudio, sin hacer el trabajo por ti." },
  { id: "calendario", title: "Calendario", text: "Tus clases, Study Rooms, conferencias y sesiones de estudio en una sola vista." },
  { id: "progreso", title: "Progreso", text: "Objetivos, sesiones completadas y racha opcional para ver tu constancia." },
];

export const TEACHER_AREAS = [
  { id: "perfil", title: "Perfil profesional", text: "Presenta tu experiencia y las áreas en las que puedes acompañar." },
  { id: "clases", title: "Mis clases", text: "Crea clases con título, materia, descripción, fecha, hora, duración, capacidad, modalidad y materiales." },
  { id: "study-rooms", title: "Study Rooms", text: "Abre espacios para resolver dudas o trabajar en grupo." },
  { id: "materiales", title: "Materiales", text: "Comparte archivos que pasan por la misma validación y moderación que la biblioteca." },
  { id: "participantes", title: "Participantes", text: "Consulta quiénes participan, respetando la privacidad de cada persona." },
  { id: "calendario", title: "Calendario", text: "Clases, Study Rooms y conferencias en una sola agenda." },
  { id: "mensajes", title: "Mensajes", text: "Comunicación con tus participantes dentro de la plataforma." },
  { id: "conferencias", title: "Conferencias", text: "Organiza actividades académicas y conferencias." },
];

export const VERIFICATION_STEPS = [
  "Te registras por la ruta de docente, mentor o conferencista.",
  "Verificamos tu identidad con correo institucional o profesional.",
  "Si no tienes correo institucional, el equipo administrador revisa tu solicitud de forma manual.",
  "Hasta que se apruebe, tu cuenta no puede crear clases ni conferencias.",
];

export const CONFERENCE_INTRO = "El ecosistema de NEXORA contempla actividades y conferencias académicas, organizadas por docentes, mentores y conferencistas.";
export const CONFERENCE_FIELDS = ["Título", "Tema", "Descripción", "Fecha", "Hora", "Duración", "Capacidad", "Modalidad", "Materiales"];
export const CLASS_FIELDS = ["Título y materia", "Descripción", "Fecha, hora y duración", "Capacidad", "Modalidad", "Materiales"];

/* ───────────── Compromiso ───────────── */
export const COMMITMENT = [
  { id: "educacion", title: "Educación", text: "El aprendizaje es el centro de todo lo que construimos." },
  { id: "innovacion", title: "Innovación", text: "Usamos tecnología con un propósito claro." },
  { id: "colaboracion", title: "Colaboración", text: "Aprender con otras personas amplía lo que se puede lograr." },
  { id: "sostenibilidad", title: "Sostenibilidad", text: "Incorporamos iniciativas responsables en nuestra identidad." },
  { id: "impacto", title: "Impacto", text: "Buscamos aportar a nuestra comunidad más allá de la plataforma." },
];
export const COMMITMENT_QUOTE = "En NEXORA creemos que innovar no consiste únicamente en crear tecnología, sino en utilizarla para generar conexiones, oportunidades y experiencias que aporten a nuestra comunidad.";

/* ───────────── Productos ───────────── */
export const PRODUCTS: Array<{ name: string; photo: string | null }> = [
  { name: "Termos reutilizables", photo: null },
  { name: "Agendas", photo: null },
  { name: "Tote bags", photo: null },
  { name: "Papelería", photo: null },
];
export const PRODUCTS_INTRO = "Como parte de nuestra identidad y compromiso con iniciativas responsables, NEXORA incorpora productos físicos que acompañan la experiencia académica y fortalecen nuestra identidad de marca.";

/* ───────────── Impacto social: Huellas que Transforman ───────────── */
export const IMPACT_TITLE = "Huellas que Transforman";
export const IMPACT_SLOGAN = "De una invitación a una acción real.";
export const IMPACT_SUMMARY = "Iniciativa de responsabilidad social desarrollada por el equipo de NEXORA, orientada al bienestar animal y la participación comunitaria.";

/** Datos proporcionados por el equipo. NO modificar sin confirmación documental. */
export const IMPACT_DATA = {
  invited: 73,            // "personas encuestadas/invitadas"
  directParticipants: 31,
  dogsInShelter: 102,
  directPurchaseUsd: 64.6,
  estimatedDonationsUsd: 40.0,
  teamMembersTotal: 5,
  teamMembersInFieldDay: 3,
} as const;

export function impactDerived(d: typeof IMPACT_DATA = IMPACT_DATA) {
  return {
    participationPct: Math.round((d.directParticipants / d.invited) * 1000) / 10, // 42.5
    estimatedResourcesUsd: Math.round((d.directPurchaseUsd + d.estimatedDonationsUsd) * 100) / 100, // 104.60
  };
}

/** Los cinco roles del proyecto (gráfico “Cinco roles, un mismo propósito”). */
export const IMPACT_ROLES = [
  { n: 1, title: "Coordinación y Organización", text: "Planificar y coordinar todo el proyecto." },
  { n: 2, title: "Comunicación, Convocatoria y Vinculación", text: "Invitar, comunicar y conectar con participantes y el refugio." },
  { n: 3, title: "Logística y Donaciones", text: "Organizar compras, materiales y donaciones." },
  { n: 4, title: "Documentación y Audiovisual", text: "Grabar, fotografiar y reunir evidencias." },
  { n: 5, title: "Resultados, Evaluación y Análisis", text: "Registrar datos, resultados y aprendizajes." },
];
export const IMPACT_GRAPHIC = { src: "/impact/huellas-roles.webp", width: 1400, height: 933, alt: "Gráfico “Huellas que transforman: de una invitación a una acción real. Cinco roles, un mismo propósito”: coordinación y organización; comunicación, convocatoria y vinculación; logística y donaciones; documentación y audiovisual; resultados, evaluación y análisis." };

export const IMPACT_SECTIONS = [
  { id: "contexto", title: "Contexto" },
  { id: "problematica", title: "Problemática" },
  { id: "objetivos", title: "Objetivos" },
  { id: "planificacion", title: "Planificación" },
  { id: "ejecucion", title: "Ejecución" },
  { id: "participacion", title: "Participación" },
  { id: "resultados", title: "Resultados" },
  { id: "aprendizajes", title: "Aprendizajes y reflexión" },
  { id: "evidencias", title: "Evidencias" },
  { id: "ods", title: "Relación con los ODS" },
] as const;

/* ───────────── Planes ───────────── */
export const PLAN_PRO_PRICE = { min: 3, max: 5, currency: "US$", period: "mensuales", note: "Precio previsto, editable y por confirmar antes del lanzamiento." };
export const PLANS = [
  { code: "FREE", name: "Free", tagline: "Funciones básicas", points: ["Acceso a la plataforma con sus funciones básicas.", "El detalle exacto se confirma antes del lanzamiento."] },
  { code: "PRO", name: "Pro", tagline: "Funciones adicionales", points: ["Todo lo de Free, más funciones adicionales.", "El detalle exacto se confirma antes del lanzamiento."] },
] as const;

/* ───────────── FAQ ───────────── */
export const FAQ: Array<{ q: string; a: string }> = [
  { q: "¿Qué es NEXORA?", a: "NEXORA es una plataforma web y un ecosistema educativo híbrido, principalmente digital, que busca conectar estudiantes universitarios con personas, herramientas y oportunidades de aprendizaje: compañeros compatibles, Study Rooms, una biblioteca académica y un asistente que guía el aprendizaje." },
  { q: "¿Quién puede registrarse?", a: "Habrá dos rutas de registro: una para estudiantes y otra para docentes, mentores y conferencistas. La propuesta inicial está enfocada en estudiantes universitarios de El Salvador, comenzando con la Universidad Don Bosco. El catálogo académico es administrable para poder incorporar otras universidades más adelante. Hoy las cuentas aún no están abiertas: NEXORA está en etapa de prototipo." },
  { q: "¿Necesito correo institucional?", a: "Para estudiantes se utiliza el correo institucional cuando corresponda. Docentes, mentores y conferencistas se verifican con correo institucional o profesional; si no tienen uno, el equipo administrador revisa la solicitud manualmente. Nadie obtiene permisos de docente sin verificación." },
  { q: "¿Cómo funciona Smart Match?", a: "Sugiere estudiantes compatibles según materias, materias difíciles, horarios, carrera, ciclo o nivel, intereses, preferencias de estudio, habilidades y modalidad. Es un algoritmo ponderado (materias 35 %, horarios 25 %, intereses 15 %, preferencias 10 %, habilidades 10 % y modalidad 5 %), no inteligencia artificial, y por eso muestra una “compatibilidad estimada”." },
  { q: "¿Qué son las Study Rooms?", a: "Son espacios colaborativos para estudiar y trabajar en conjunto, organizados por materia o sesión. Incluyen participantes, chat, reacciones, pizarra colaborativa y temporizador; la cámara, el micrófono y la pantalla compartida requieren un proveedor de video que aún está pendiente de integrar." },
  { q: "¿Puedo compartir recursos?", a: "Sí. La biblioteca académica permite subir, buscar, filtrar, guardar, consultar y reportar apuntes, guías, presentaciones, ejercicios, exámenes y documentos. Los archivos se validan por tipo y tamaño, se almacenan de forma segura y pasan por moderación. La subida de archivos requiere un almacenamiento que todavía no está configurado." },
  { q: "¿Qué es NEXORA AI?", a: "Es un asistente educativo limitado: tu asistente para aprender, no para sustituir tu aprendizaje. Explica conceptos, hace preguntas guía, organiza temas, crea rutas de estudio, da retroalimentación, detecta temas para reforzar y convierte apuntes en preguntas de práctica. No está pensado para hacer tus tareas." },
  { q: "¿Puedo utilizar NEXORA como docente o mentor?", a: "Sí. Habrá un espacio diferenciado para docentes, mentores y conferencistas, con clases, Study Rooms, conferencias, participantes, materiales, calendario y mensajes. Su identidad se verifica con correo institucional o profesional, o mediante revisión administrativa." },
  { q: "¿Qué diferencia existe entre Free y Pro?", a: "Free ofrece las funciones básicas y Pro, funciones adicionales. El detalle de cada plan y el precio definitivo se confirmarán antes del lanzamiento; el precio previsto del Pro es de US$3 a US$5 mensuales. Hoy no hay pagos activos." },
  { q: "¿Cómo se protege mi información?", a: "NEXORA se diseña con minimización de datos (por ejemplo, no pedimos tu edad exacta), configuración de privacidad, contraseñas cifradas con hash, sesiones revocables, cookies seguras, validación de entradas y archivos, permisos por rol y registros de auditoría. Los textos legales son borradores pendientes de revisión jurídica." },
  { q: "¿NEXORA es una aplicación móvil?", a: "No. Es una plataforma web: se usa desde el navegador, con una experiencia pensada para computadora y laptop que se adapta a tablet y móvil." },
  { q: "¿NEXORA es una tienda?", a: "No. NEXORA es una plataforma educativa. Los productos físicos son una línea secundaria que forma parte de nuestra identidad y de nuestro compromiso con iniciativas responsables." },
  { q: "¿Qué es Huellas que Transforman?", a: "Es una iniciativa de responsabilidad social desarrollada por el equipo, orientada al bienestar animal y la participación comunitaria. Es independiente de la plataforma educativa." },
];

export const PENDING_LABELS = {
  member: "Rol y descripción por confirmar",
  product: "Fotografía pendiente",
  impact: "Información pendiente del equipo",
  photo: "Fotografía pendiente",
} as const;
