import { Instagram, Mail } from "lucide-react";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Pending } from "@/components/site/pending";
import { Section } from "@/components/site/section";
import { meta, pageLd, publicConfig } from "@/lib/page-meta";
import { ContactForm } from "./contact-form";

const T = "Contacto", D = "Escríbele al equipo de NEXORA por el formulario de contacto, por correo o por Instagram.";
export const metadata = meta({ title: T, description: D, path: "/contacto" });

export default function ContactoPage() {
  const c = publicConfig;
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/contacto" })} />
      <PageHero title="Contacto" lead="¿Dudas, ideas o propuestas de colaboración? Escríbenos." />
      <Section id="formulario">
        <div className="contact-grid">
          <div>
            <h2 style={{ marginBottom: "1.25rem" }}>Envíanos un mensaje</h2>
            <ContactForm />
          </div>
          <aside aria-labelledby="canales-t" className="channels">
            <h2 id="canales-t" style={{ fontSize: "1.4rem" }}>Otros canales</h2>
            <div className="channel"><Mail aria-hidden="true" size={20} /><div><strong>Correo</strong>{c.contactEmail ? <a href={`mailto:${c.contactEmail}`}>{c.contactEmail}</a> : <Pending>Correo oficial por configurar</Pending>}</div></div>
            <div className="channel"><Instagram aria-hidden="true" size={20} /><div><strong>Instagram</strong>{c.instagramUrl ? <a href={c.instagramUrl} rel="noopener noreferrer" target="_blank">{c.instagramUsername ? `@${c.instagramUsername}` : "Perfil oficial"}<span className="sr-only"> (se abre en una pestaña nueva)</span></a> : <Pending>Cuenta oficial por configurar</Pending>}</div></div>
          </aside>
        </div>
      </Section>
    </>
  );
}
