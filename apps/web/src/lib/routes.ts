/** Registro único de rutas públicas. Alimenta sitemap, pruebas de enlaces y metadatos. */
export interface RouteInfo {
  path: string;
  title: string;
  /** Aparece en el sitemap y puede indexarse (cuando el sitio esté marcado como indexable). */
  indexable: boolean;
  priority: number;
}

export const PUBLIC_ROUTES: readonly RouteInfo[] = [
  { path: "/", title: "Inicio", indexable: true, priority: 1 },
  { path: "/nosotros", title: "Nosotros", indexable: true, priority: 0.8 },
  { path: "/historia", title: "Historia", indexable: true, priority: 0.7 },
  { path: "/equipo", title: "Equipo", indexable: true, priority: 0.7 },
  { path: "/plataforma", title: "Plataforma", indexable: true, priority: 0.9 },
  { path: "/funciones", title: "Funciones", indexable: true, priority: 0.9 },
  { path: "/estudiantes", title: "Para estudiantes", indexable: true, priority: 0.8 },
  { path: "/docentes", title: "Para docentes, mentores y conferencistas", indexable: true, priority: 0.8 },
  { path: "/productos", title: "Productos", indexable: true, priority: 0.6 },
  { path: "/impacto-social", title: "Impacto social", indexable: true, priority: 0.7 },
  { path: "/planes", title: "Planes", indexable: true, priority: 0.7 },
  { path: "/faq", title: "Preguntas frecuentes", indexable: true, priority: 0.7 },
  { path: "/contacto", title: "Contacto", indexable: true, priority: 0.6 },
  { path: "/privacidad", title: "Política de privacidad", indexable: true, priority: 0.3 },
  { path: "/terminos", title: "Términos y condiciones", indexable: true, priority: 0.3 },
  { path: "/aviso-legal", title: "Aviso legal", indexable: true, priority: 0.3 },
  { path: "/cookies", title: "Política y preferencias de cookies", indexable: true, priority: 0.3 },
  // Páginas provisionales: existen para que ningún enlace quede roto, pero no se indexan.
  { path: "/iniciar-sesion", title: "Iniciar sesión", indexable: false, priority: 0 },
  { path: "/registro", title: "Registrarme", indexable: false, priority: 0 },
  { path: "/demo", title: "Probar demo", indexable: false, priority: 0 },
];

export const ROUTE_PATHS: ReadonlySet<string> = new Set(PUBLIC_ROUTES.map((r) => r.path));
