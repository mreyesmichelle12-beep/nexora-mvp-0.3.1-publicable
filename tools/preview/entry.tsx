
import { createRoot } from "react-dom/client";
import P0, * as M0 from "@/app/(public)/page";
import P1, * as M1 from "@/app/(public)/aviso-legal/page";
import P2, * as M2 from "@/app/(public)/contacto/page";
import P3, * as M3 from "@/app/(public)/cookies/page";
import P4, * as M4 from "@/app/(public)/demo/page";
import P5, * as M5 from "@/app/(public)/docentes/page";
import P6, * as M6 from "@/app/(public)/equipo/page";
import P7, * as M7 from "@/app/(public)/estudiantes/page";
import P8, * as M8 from "@/app/(public)/faq/page";
import P9, * as M9 from "@/app/(public)/funciones/page";
import P10, * as M10 from "@/app/(public)/historia/page";
import P11, * as M11 from "@/app/(public)/impacto-social/page";
import P12, * as M12 from "@/app/(public)/iniciar-sesion/page";
import P13, * as M13 from "@/app/(public)/nosotros/page";
import P14, * as M14 from "@/app/(public)/planes/page";
import P15, * as M15 from "@/app/(public)/plataforma/page";
import P16, * as M16 from "@/app/(public)/privacidad/page";
import P17, * as M17 from "@/app/(public)/productos/page";
import P18, * as M18 from "@/app/(public)/registro/page";
import P19, * as M19 from "@/app/(public)/terminos/page";
import PublicLayout from "@/app/(public)/layout";
import NotFound from "@/app/not-found";
import GlobalError from "@/app/error";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
const ROUTES: Record<string, { Page: any; metadata: any }> = {
  "/": { Page: P0, metadata: (M0 as any).metadata },
  "/aviso-legal": { Page: P1, metadata: (M1 as any).metadata },
  "/contacto": { Page: P2, metadata: (M2 as any).metadata },
  "/cookies": { Page: P3, metadata: (M3 as any).metadata },
  "/demo": { Page: P4, metadata: (M4 as any).metadata },
  "/docentes": { Page: P5, metadata: (M5 as any).metadata },
  "/equipo": { Page: P6, metadata: (M6 as any).metadata },
  "/estudiantes": { Page: P7, metadata: (M7 as any).metadata },
  "/faq": { Page: P8, metadata: (M8 as any).metadata },
  "/funciones": { Page: P9, metadata: (M9 as any).metadata },
  "/historia": { Page: P10, metadata: (M10 as any).metadata },
  "/impacto-social": { Page: P11, metadata: (M11 as any).metadata },
  "/iniciar-sesion": { Page: P12, metadata: (M12 as any).metadata },
  "/nosotros": { Page: P13, metadata: (M13 as any).metadata },
  "/planes": { Page: P14, metadata: (M14 as any).metadata },
  "/plataforma": { Page: P15, metadata: (M15 as any).metadata },
  "/privacidad": { Page: P16, metadata: (M16 as any).metadata },
  "/productos": { Page: P17, metadata: (M17 as any).metadata },
  "/registro": { Page: P18, metadata: (M18 as any).metadata },
  "/terminos": { Page: P19, metadata: (M19 as any).metadata },
};
(window as any).__ROUTES = Object.fromEntries(Object.entries(ROUTES).map(([k, v]) => [k, v.metadata]));
(window as any).__SITEMAP = sitemap();
(window as any).__ROBOTS = robots();
async function main() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const root = createRoot(document.getElementById("root")!);
  document.documentElement.dataset.route = path;
  if (path === "/__error") { document.documentElement.dataset.status = "error"; root.render(<GlobalError error={Object.assign(new Error("secreto interno"), { digest: "abc123" })} reset={() => {}} />); return; }
  const hit = ROUTES[path];
  if (!hit) { document.documentElement.dataset.status = "404"; document.title = "Página no encontrada"; root.render(<NotFound />); return; }
  document.documentElement.dataset.status = "200";
  const t = hit.metadata?.title; document.title = typeof t === "string" ? t + " · NEXORA" : t?.absolute ?? "NEXORA";
  const tree = await hit.Page({});
  root.render(<><a href="#contenido" className="skip-link">Saltar al contenido</a><PublicLayout>{tree}</PublicLayout></>);
}
main();
