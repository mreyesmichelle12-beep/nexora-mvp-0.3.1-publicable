import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { AUTH_LINKS } from "@/content/site";

export function CtaBand({ title = "Conoce NEXORA desde adentro", text = "Explora la plataforma con datos ficticios, sin crear una cuenta." }: { title?: string; text?: string }) {
  return (
    <section className="section cta-band" aria-labelledby="cta-titulo">
      <div className="container cta-band__inner">
        <h2 id="cta-titulo">{title}</h2>
        <p>{text}</p>
        <div className="actions">
          <Link href={AUTH_LINKS.demo.href} className={buttonClass("primary", "lg")}>Probar demo</Link>
          <Link href="/contacto" className={buttonClass("secondary", "lg")}>Escríbenos</Link>
        </div>
      </div>
    </section>
  );
}
