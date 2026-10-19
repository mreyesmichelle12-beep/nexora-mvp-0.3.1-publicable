import Image from "next/image";
import { Pending } from "./pending";
import { PENDING_LABELS, TEAM, TEAM_DEFAULT_ROLE } from "@/content/site";

/** Integrantes reales. Rol y descripción: "Equipo fundador" + campo editable hasta que el equipo los confirme. */
export function TeamGrid({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={`team${compact ? " team--compact" : ""}`}>
      {TEAM.map((m) => (
        <li key={m.slug} className="member">
          <div className="member__photo">
            <Image src={m.photo} alt={`Fotografía de ${m.name}`} width={640} height={800} sizes="(min-width: 900px) 220px, 45vw" loading="lazy" />
          </div>
          <h3>{m.name}</h3>
          <p className="member__role">{m.role ?? TEAM_DEFAULT_ROLE}</p>
          {!compact && (m.bio ? <p className="muted">{m.bio}</p> : <Pending quiet>{PENDING_LABELS.member}</Pending>)}
        </li>
      ))}
    </ul>
  );
}
