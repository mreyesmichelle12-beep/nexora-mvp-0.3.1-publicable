import { Illustrative } from "./blocks";
import { Icon } from "./icons";

/**
 * "Nexo + Hora": dos disponibilidades semanales (A y B) y las franjas donde coinciden.
 * Es una ilustración con datos ficticios, declarada como tal. Cada celda lleva letra/icono:
 * el significado no depende del color.
 */
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
const SLOTS = ["Mañana", "Mediodía", "Tarde"];
type Cell = "A" | "B" | "AB" | "";
const GRID: Cell[][] = [
  ["A", "AB", "", "AB", "B"],
  ["", "A", "AB", "B", ""],
  ["AB", "", "B", "A", "AB"],
];
const OVERLAPS = GRID.flat().filter((c) => c === "AB").length;

export function HeroVisual() {
  return (
    <figure className="hero-visual card" aria-labelledby="hv-title">
      <div className="hero-visual__top">
        <figcaption id="hv-title"><strong>Horarios que coinciden</strong></figcaption>
        <Illustrative />
      </div>
      <div className="avail" role="img" aria-label={`Ilustración: dos estudiantes ficticios comparten ${OVERLAPS} franjas libres a la semana.`}>
        <span className="avail__corner" />
        {DAYS.map((d) => <span key={d} className="avail__day" aria-hidden="true">{d}</span>)}
        {GRID.map((row, r) => (
          <div key={SLOTS[r]} className="avail__row" aria-hidden="true">
            <span className="avail__slot">{SLOTS[r]}</span>
            {row.map((c, i) => (
              <span key={i} className={`avail__cell avail__cell--${c || "none"}`}>{c === "AB" ? <Icon name="check" size={16} /> : c}</span>
            ))}
          </div>
        ))}
      </div>
      <ul className="legend">
        <li><span className="avail__cell avail__cell--A">A</span> Estudiante A</li>
        <li><span className="avail__cell avail__cell--B">B</span> Estudiante B</li>
        <li><span className="avail__cell avail__cell--AB"><Icon name="check" size={14} /></span> Coinciden</li>
      </ul>
      <div className="match-meter">
        <div className="match-meter__label"><span>Compatibilidad estimada</span><strong>92%</strong></div>
        <div className="match-meter__bar" aria-hidden="true"><span style={{ width: "92%" }} /></div>
      </div>
    </figure>
  );
}
