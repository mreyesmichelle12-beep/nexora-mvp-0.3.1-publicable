import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Section({ id, tone, title, lead, children, className }: { id?: string; tone?: "mist" | "ink"; title?: string; lead?: ReactNode; children: ReactNode; className?: string }) {
  const headingId = id ? `${id}-titulo` : undefined;
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={cn("section", tone && `section--${tone}`, tone === "ink" && "on-dark", className)}>
      <div className="container">
        {title && (
          <header className="section__head">
            <h2 id={headingId}>{title}</h2>
            {lead && <p>{lead}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
