import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { AvailVisual } from "@/components/site/avail-visual";
import { CtaBand } from "@/components/site/cta-band";
import { FeatureIcon } from "@/components/site/icon-map";
import { JsonLd } from "@/components/site/json-ld";
import { MockAI, MockLibrary, MockStudyRoom } from "@/components/site/mocks";
import { Section } from "@/components/site/section";
import { TeamGrid } from "@/components/site/team-grid";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { AUDIENCES, AUTH_LINKS, FACILITATES, FAQ, FEATURES, FLOW, HERO_TEXT, HISTORY_STEPS, HOME_FEATURE_IDS, IMPACT_SLOGAN, IMPACT_TITLE, NAME_CONCEPT, PLANS, PLAN_PRO_PRICE, PRODUCTS_INTRO, PROBLEMS, PROBLEM_STATEMENT, PURPOSE, SCOPE, SMART_MATCH_INPUTS, SMART_MATCH_WEIGHTS, TAGLINE, WEB_NOT_APP, WHAT_IS } from "@/content/site";
import { meta, pageLd, publicConfig } from "@/lib/page-meta";
import { SITE_NAME, organizationLd, websiteLd } from "@/lib/seo";

const DESC = "NEXORA es una plataforma web que conecta estudiantes, docentes y oportunidades de aprendizaje. Diseñada inicialmente para estudiantes universitarios de El Salvador.";
export const metadata = { ...meta({ title: `${SITE_NAME} — ${TAGLINE}`, description: DESC, path: "/" }), title: { absolute: `${SITE_NAME} — ${TAGLINE}` } };

const More = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="link-more">{children}<ChevronRight aria-hidden="true" size={18} /></Link>
);

export default function HomePage() {
  const homeFeatures = HOME_FEATURE_IDS.map((id) => FEATURES.find((f) => f.id === id)!);
  return (
    <>
      <JsonLd data={organizationLd(publicConfig)} />
      <JsonLd data={websiteLd(publicConfig)} />
      <JsonLd data={pageLd({ title: SITE_NAME, description: DESC, path: "/" })} />

      <section className="hero" aria-labelledby="hero-titulo">
        <div className="container hero__grid">
          <div className="hero__copy">
            <h1 id="hero-titulo"><span className="sr-only">NEXORA: </span>{TAGLINE}</h1>
            <p className="hero__lead">{HERO_TEXT}</p>
            <div className="actions">
              <Link href="#que-es" className={buttonClass("primary", "lg")}>Explorar NEXORA</Link>
              <Link href={AUTH_LINKS.demo.href} className={buttonClass("secondary", "lg")}>Probar demo</Link>
            </div>
            <p className="hero__scope">{SCOPE}</p>
          </div>
          <AvailVisual />
        </div>
      </section>

      <Section id="que-es" title="¿Qué es NEXORA?" lead={WHAT_IS}>
        <div className="two-col">
          <div className="stack" style={{ ["--stack" as string]: "1rem" }}>
            <p>{FACILITATES}</p>
            <p>{WEB_NOT_APP}</p>
            <More href="/nosotros">Conocer a NEXORA</More>
          </div>
          <div className="stack" style={{ ["--stack" as string]: "1rem" }}>
            <p className="name-concept" aria-label="Nexo más Hora"><span className="part">{NAME_CONCEPT.nexo}</span><span className="plus" aria-hidden="true">+</span><span className="part part--b">{NAME_CONCEPT.hora}</span></p>
            <p className="muted">{NAME_CONCEPT.text}</p>
          </div>
        </div>
        <div className="statement" style={{ marginTop: "2.5rem" }}><h3>Nuestro propósito</h3><p>{PURPOSE}</p></div>
      </Section>

      <Section id="problema" tone="mist" title="El problema que buscamos resolver" lead={PROBLEM_STATEMENT}>
        <ul className="checklist checklist--muted">{PROBLEMS.map((p) => <li key={p}><Check aria-hidden="true" size={18} /><span>{p}</span></li>)}</ul>
      </Section>

      <Section id="como-funciona" title="Cómo funciona" lead="Del registro al seguimiento de tu progreso, en ocho pasos.">
        <ol className="flow">{FLOW.map((s) => <li key={s.title}><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol>
        <More href="/plataforma">Ver la plataforma</More>
      </Section>

      <Section id="funciones" tone="mist" title="Funciones principales" lead="Herramientas para estudiar acompañado y organizar mejor tu aprendizaje.">
        <ul className="feature-list">
          {homeFeatures.map((f) => (
            <li key={f.id} className="feature-row">
              <span className="feature-row__icon"><FeatureIcon name={f.icon} /></span>
              <div><h3>{f.name}</h3><p>{f.summary}</p></div>
              <Link href={`/funciones#${f.id}`} className="link-more feature-row__link" style={{ marginTop: 0 }}>Ver {f.name}<ChevronRight aria-hidden="true" size={18} /></Link>
            </li>
          ))}
        </ul>
        <More href="/funciones">Todas las funciones</More>
      </Section>

      <Section id="smart-match" title="Smart Match: compatibilidad que se explica" lead="Sugiere estudiantes compatibles con un algoritmo de pesos definidos. Muestra una “compatibilidad estimada” y el detalle de cada factor; no es inteligencia artificial.">
        <div className="two-col">
          <ul className="weights" aria-label="Peso de cada factor en Smart Match">
            {SMART_MATCH_WEIGHTS.map((w) => <li key={w.factor}><span>{w.factor}</span><span className="weights__bar" aria-hidden="true"><span style={{ width: `${w.pct}%` }} /></span><span className="weights__pct">{w.pct} %</span></li>)}
          </ul>
          <div className="stack"><h3>Qué toma en cuenta</h3><p className="muted">{SMART_MATCH_INPUTS.join(" · ")}.</p><More href="/funciones#smart-match">Más sobre Smart Match</More></div>
        </div>
      </Section>

      <Section id="espacios" tone="mist" title="Estudiar, compartir y ser guiado" lead="Study Rooms, biblioteca académica y NEXORA AI, pensados para trabajar juntos.">
        <div className="mocks"><MockStudyRoom /><MockLibrary /><MockAI /></div>
      </Section>

      <Section id="comunidad" tone="ink" title="Una comunidad para aprender" lead="NEXORA reúne a quienes estudian, enseñan y organizan actividades académicas.">
        <div className="audiences">
          {AUDIENCES.map((a) => <div key={a.id} className="audience"><h3>{a.title}</h3><p>{a.text}</p><Link href={a.href} className="link-more" style={{ color: "#fff" }}>Conocer más<ChevronRight aria-hidden="true" size={18} /></Link></div>)}
        </div>
      </Section>

      <Section id="historia" title="¿Cómo nació NEXORA?" lead="De un problema real de la vida universitaria a un prototipo de plataforma.">
        <ol className="path" aria-label="Recorrido de NEXORA">{HISTORY_STEPS.map((s) => <li key={s.id}>{s.title}</li>)}</ol>
        <More href="/historia">Leer la historia</More>
      </Section>

      <Section id="equipo" tone="mist" title="Conoce al equipo detrás de NEXORA" lead="Equipo fundador de cinco integrantes.">
        <TeamGrid compact />
        <More href="/equipo">Ver al equipo</More>
      </Section>

      <Section id="ecosistema" title="El ecosistema NEXORA" lead="La plataforma educativa es nuestro producto principal. Otros dos elementos forman parte de nuestra identidad.">
        <div className="ecosystem">
          <div className="eco-main">
            <Badge tone="brand">Producto principal</Badge>
            <h3>Plataforma educativa</h3>
            <p>Smart Match, Study Rooms, biblioteca académica y NEXORA AI en una plataforma web para estudiantes, docentes y mentores.</p>
            <div><Link href="/plataforma" className={buttonClass("on-dark")}>Conocer la plataforma</Link></div>
          </div>
          <div className="eco-side">
            <div className="eco-card"><Badge>Línea secundaria</Badge><h3>Nuestros productos</h3><p>{PRODUCTS_INTRO.split(".")[0]}.</p><More href="/productos">Ver productos</More></div>
            <div className="eco-card"><Badge>Iniciativa de RSE del equipo</Badge><h3>{IMPACT_TITLE}</h3><p>{IMPACT_SLOGAN}</p><More href="/impacto-social">Conocer la iniciativa</More></div>
          </div>
        </div>
      </Section>

      <Section id="planes" tone="mist" title="Planes" lead="Un plan Free con funciones básicas y un plan Pro con funciones adicionales.">
        <div className="two-col">
          <div className="stack" style={{ ["--stack" as string]: ".5rem" }}>
            {PLANS.map((p) => <p key={p.code}><strong>{p.name}:</strong> {p.tagline}.</p>)}
            <p className="muted">Precio previsto del plan Pro: {PLAN_PRO_PRICE.currency}{PLAN_PRO_PRICE.min}–{PLAN_PRO_PRICE.currency}{PLAN_PRO_PRICE.max} {PLAN_PRO_PRICE.period}, por confirmar. Hoy no hay pagos activos.</p>
          </div>
          <div><Link href="/planes" className={buttonClass("secondary")}>Ver planes</Link></div>
        </div>
      </Section>

      <Section id="faq" title="Preguntas frecuentes">
        <div className="faq">{FAQ.slice(0, 3).map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
        <More href="/faq">Ver todas las preguntas</More>
      </Section>

      <Section id="contacto" tone="mist" title="Contacto" lead="¿Dudas, ideas o propuestas de colaboración? Escríbenos por el formulario, por correo o por Instagram.">
        <Link href="/contacto" className={buttonClass("secondary")}>Ir a Contacto</Link>
      </Section>

      <CtaBand />
    </>
  );
}
