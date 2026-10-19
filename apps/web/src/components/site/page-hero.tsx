import type { ReactNode } from "react";
import { Info } from "lucide-react";

export function PageHero({ title, lead, actions, note }: { title: string; lead?: ReactNode; actions?: ReactNode; note?: ReactNode }) {
  return (
    <div className="page-hero">
      <div className="container page-hero__inner">
        <h1>{title}</h1>
        {lead && <p className="page-hero__lead">{lead}</p>}
        {note && (
          <p className="status-note">
            <Info aria-hidden="true" size={18} />
            <span>{note}</span>
          </p>
        )}
        {actions && <div className="actions">{actions}</div>}
      </div>
    </div>
  );
}
