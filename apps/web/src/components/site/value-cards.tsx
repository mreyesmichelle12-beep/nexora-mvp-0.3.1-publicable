import { Handshake, Lightbulb, ShieldCheck, type LucideIcon } from "lucide-react";
import { VALUES, type ValueIcon } from "@/content/site";

const ICONS: Record<ValueIcon, LucideIcon> = { ShieldCheck, Handshake, Lightbulb };

export function ValueCards() {
  return (
    <ul className="values">
      {VALUES.map((v) => { const Icon = ICONS[v.icon]; return (
        <li key={v.id} className="value"><span className="value__icon"><Icon aria-hidden="true" size={24} /></span><h3>{v.title}</h3><p>{v.text}</p></li>
      ); })}
    </ul>
  );
}
