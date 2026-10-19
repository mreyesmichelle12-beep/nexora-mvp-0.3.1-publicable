"use client";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ConsentChoice } from "@/lib/consent";

/** Formulario de categorías. Lo usan el banner (Configurar) y la página /cookies (cambiar o retirar el consentimiento). */
export function ConsentForm({ initial, analyticsAvailable, onSave, saveLabel = "Guardar preferencias" }: { initial: ConsentChoice; analyticsAvailable: boolean; onSave: (c: ConsentChoice) => void; saveLabel?: string }) {
  const [choice, setChoice] = useState<ConsentChoice>(initial);
  const base = useId();
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(choice); }} className="consent-list">
      <div className="consent-item">
        <input type="checkbox" id={`${base}-n`} checked disabled aria-describedby={`${base}-n-d`} />
        <label htmlFor={`${base}-n`}>Necesarias (siempre activas)</label>
        <p id={`${base}-n-d`} className="muted">Recuerdan tu elección sobre cookies. Cuando existan cuentas, también mantendrán tu sesión iniciada.</p>
      </div>
      <div className="consent-item">
        <input type="checkbox" id={`${base}-a`} checked={choice.analytics} onChange={(e) => setChoice({ ...choice, analytics: e.target.checked })} aria-describedby={`${base}-a-d`} />
        <label htmlFor={`${base}-a`}>Analíticas</label>
        <p id={`${base}-a-d`} className="muted">{analyticsAvailable ? "Nos ayudan a entender cómo se usa el sitio. Solo se cargan si las aceptas." : "Hoy este sitio no usa cookies analíticas. Tu elección queda guardada por si se activan más adelante."}</p>
      </div>
      <div className="consent-item">
        <input type="checkbox" id={`${base}-p`} checked={choice.preferences} onChange={(e) => setChoice({ ...choice, preferences: e.target.checked })} aria-describedby={`${base}-p-d`} />
        <label htmlFor={`${base}-p`}>Preferencias</label>
        <p id={`${base}-p-d`} className="muted">Hoy no guardamos preferencias en cookies. La categoría existe para cuando se habiliten (por ejemplo, ajustes de la interfaz).</p>
      </div>
      <div><Button type="submit">{saveLabel}</Button></div>
    </form>
  );
}
