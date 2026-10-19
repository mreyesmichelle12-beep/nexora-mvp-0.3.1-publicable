import { Check } from "lucide-react";

/**
 * "Nexo + Hora": dos disponibilidades semanales y los bloques donde coinciden.
 * Es una ilustración con datos ficticios y así se declara. El estado de cada celda se comunica
 * con color Y con símbolo, y el conjunto tiene una descripción textual.
 */
type Cell = "" | "a" | "b" | "both";
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
const SLOTS = ["8:00", "10:00", "14:00", "16:00"];
const GRID: Cell[][] = [
  ["a", "", "b", "", "a"],
  ["both", "a", "", "b", ""],
  ["", "both", "a", "both", "b"],
  ["b", "", "both", "a", ""],
];

export function AvailVisual() {
  const matches = GRID.flat().filter((c) => c === "both").length;
  return (
    <figure className="avail" style={{ margin: 0 }}>
      <div className="avail__head">
        <figcaption className="avail__title">Horarios que coinciden</figcaption>
        <span className="badge">Ilustración · datos ficticios</span>
      </div>
      <div
        role="img"
        aria-label={`Cuadrícula semanal de lunes a viernes con ${matches} bloques en los que dos estudiantes ficticios tienen disponibilidad al mismo tiempo.`}
        className="avail__grid"
      >
        <span aria-hidden="true" />
        {DAYS.map((d) => <span key={d} aria-hidden="true" className="avail__day">{d}</span>)}
        {GRID.map((row, r) => (
          <FragmentRow key={SLOTS[r]} label={SLOTS[r]!} row={row} />
        ))}
      </div>
      <ul className="avail__legend" aria-label="Leyenda">
        <li><span className="avail__key avail__cell--a" aria-hidden="true" style={{ boxShadow: "inset 0 0 0 1px rgba(91,47,196,.25)" }} />Tu disponibilidad</li>
        <li><span className="avail__key avail__cell--b" aria-hidden="true" />Disponibilidad de otra persona</li>
        <li><span className="avail__key avail__cell--both" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>Coinciden</li>
      </ul>
      <div className="avail__score">
        <span>Compatibilidad estimada</span>
        <strong>92 %</strong>
        <span className="avail__note">Ejemplo ilustrativo de Smart Match.</span>
      </div>
    </figure>
  );
}

function FragmentRow({ label, row }: { label: string; row: Cell[] }) {
  return (
    <>
      <span aria-hidden="true" className="avail__time">{label}</span>
      {row.map((c, i) => (
        <span key={i} aria-hidden="true" className={`avail__cell${c ? ` avail__cell--${c}` : ""}`}>
          {c === "both" && <Check size={16} strokeWidth={3} />}
        </span>
      ))}
    </>
  );
}
