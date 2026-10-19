import { createRoot } from "react-dom/client";
import type { ComponentType } from "react";
import Home from "@/app/(public)/page";
import Nosotros from "@/app/(public)/nosotros/page";
import Plataforma from "@/app/(public)/plataforma/page";
import Funciones from "@/app/(public)/funciones/page";
import Estudiantes from "@/app/(public)/estudiantes/page";
import Docentes from "@/app/(public)/docentes/page";
import Productos from "@/app/(public)/productos/page";
import Impacto from "@/app/(public)/impacto-social/page";
import Planes from "@/app/(public)/planes/page";
import Faq from "@/app/(public)/faq/page";
import Privacidad from "@/app/(public)/privacidad/page";
import Terminos from "@/app/(public)/terminos/page";
import Aviso from "@/app/(public)/aviso-legal/page";
import Cookies from "@/app/(public)/cookies/page";
import Demo from "@/app/(public)/demo/page";
import Login from "@/app/(public)/iniciar-sesion/page";
import Registro from "@/app/(public)/registro/page";
import NotFound from "@/app/not-found";
import ErrorPage from "@/app/error";
import { PageHero, PageLd, Section } from "@/components/site/blocks";
import { ContactView } from "@/components/site/contact-view";
import { CookieBanner } from "@/components/site/cookie-banner";
import { AnalyticsLoader } from "@/components/site/analytics-loader";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { readPublicConfig } from "@/lib/public-config";

// La página real de contacto es async (searchParams); aquí se replica su cuerpo con los mismos componentes.
function Contacto() {
  const asunto = new URLSearchParams(location.search).get("asunto") ?? undefined;
  return (<><PageLd path="/contacto" name="Contacto" description="x" /><PageHero title="Contacto" lead="Cuéntanos tu consulta, idea o propuesta de colaboración." crumb="Contacto" /><Section labelledBy="formulario"><ContactView config={readPublicConfig(process.env)} initialSubject={asunto} /></Section></>);
}
function Boom(): never { throw new Error("fallo de prueba con datos internos secretos"); }
import { Component, type ReactNode } from "react";
class Boundary extends Component<{ children: ReactNode }, { err: (Error & { digest?: string }) | null }> {
  state = { err: null as (Error & { digest?: string }) | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() { return this.state.err ? <ErrorPage error={Object.assign(new Error("x"), { digest: "abc123" })} reset={() => this.setState({ err: null })} /> : this.props.children; }
}

const ROUTES: Record<string, ComponentType> = {
  "/": Home, "/nosotros": Nosotros, "/plataforma": Plataforma, "/funciones": Funciones, "/estudiantes": Estudiantes,
  "/docentes": Docentes, "/productos": Productos, "/impacto-social": Impacto, "/planes": Planes, "/faq": Faq,
  "/contacto": Contacto, "/privacidad": Privacidad, "/terminos": Terminos, "/aviso-legal": Aviso, "/cookies": Cookies,
  "/demo": Demo, "/iniciar-sesion": Login, "/registro": Registro,
};

function App() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  const config = readPublicConfig(process.env);
  if (path === "/__error") return <Boundary><Boom /></Boundary>;
  const Page = ROUTES[path];
  if (!Page) return <NotFound />;
  return (<>
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <Header />
    <main id="contenido" tabIndex={-1}><Page /></main>
    <Footer config={config} />
    <CookieBanner analyticsConfigured={Boolean(config.analytics)} />
    {config.analytics && <AnalyticsLoader domain={config.analytics.domain} />}
  </>);
}
createRoot(document.getElementById("root")!).render(<App />);
