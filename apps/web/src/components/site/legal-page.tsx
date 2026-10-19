import { Notice, PageHero, PageLd, Pending, Section } from "./blocks";
import { LEGAL_DRAFT_NOTICE, type LegalDoc } from "@/content/legal";

export function LegalPage({ doc, path, description }: { doc: LegalDoc; path: string; description: string }) {
  return (
    <>
      <PageLd path={path} name={doc.title} description={description} />
      <PageHero title={doc.title} lead={doc.lead} crumb={doc.title} />
      <Section labelledBy="legal-t">
        <h2 id="legal-t" className="sr-only">Contenido del documento</h2>
        <div className="legal">
          <Notice>{LEGAL_DRAFT_NOTICE}</Notice>
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`}>
              <h2 id={`${s.id}-t`}>{s.title}</h2>
              {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
              {s.list && <ul>{s.list.map((i) => <li key={i}>{i}</li>)}</ul>}
              {s.pending && <Pending what="Dato pendiente">{s.pending}</Pending>}
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
