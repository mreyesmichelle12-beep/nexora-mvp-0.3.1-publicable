import { AtSign, Mail, MessageSquareText } from "lucide-react";
import { Pending } from "./blocks";
import { ContactForm } from "./contact-form";
import type { PublicConfig } from "@/lib/public-config";

export function ContactView({ config, initialSubject }: { config: Pick<PublicConfig, "contactEmail" | "instagramUrl" | "instagramUsername">; initialSubject?: string }) {
  return (
    <div className="contact-layout">
      <div>
        <h2 id="formulario" style={{ marginBottom: "1.25rem" }}>Escríbenos</h2>
        <ContactForm initialSubject={initialSubject} />
      </div>
      <aside aria-labelledby="canales" className="stack" style={{ ["--stack" as string]: "1.25rem" }}>
        <h2 id="canales">Otros canales</h2>
        {config.contactEmail ? (
          <div className="channel"><Mail aria-hidden="true" size={22} /><div><strong>Correo</strong><a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></div></div>
        ) : (
          <Pending what="Correo oficial">se mostrará aquí cuando se configure CONTACT_EMAIL.</Pending>
        )}
        {config.instagramUrl ? (
          <div className="channel"><AtSign aria-hidden="true" size={22} /><div><strong>Instagram</strong>
            <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer">{config.instagramUsername ? `@${config.instagramUsername}` : "Ver perfil"}<span className="sr-only"> (se abre en una pestaña nueva)</span></a></div></div>
        ) : (
          <Pending what="Instagram oficial">se mostrará aquí cuando se configure INSTAGRAM_URL.</Pending>
        )}
        <div className="channel"><MessageSquareText aria-hidden="true" size={22} /><div><strong>Formulario</strong><span className="val">El camino más directo: tu mensaje queda registrado para el equipo.</span></div></div>
      </aside>
    </div>
  );
}
