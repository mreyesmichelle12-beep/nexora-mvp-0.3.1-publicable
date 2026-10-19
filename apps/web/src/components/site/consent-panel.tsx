"use client";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { getStoredConsent, saveConsent } from "@/lib/consent-client";
import { ACCEPT_ALL, REJECT_NON_ESSENTIAL } from "@/lib/consent";

/** Panel de preferencias. Lo usan el banner y la página /cookies (retirar el consentimiento es tan fácil como darlo). */
export function ConsentPanel({ analyticsConfigured, onSaved, compact = false }: { analyticsConfigured: boolean; onSaved?: () => void; compact?: boolean }) {
  const uid = useId();
  const [analytics, setAnalytics] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { const c = getStoredConsent(); if (c) { setAnalytics(c.analytics); setPreferences(c.preferences); } }, []);

  const commit = (choice: { analytics: boolean; preferences: boolean }) => { saveConsent(choice); setSaved(true); onSaved?.(); };

  return (
    <div className="consent-panel">
      <fieldset>
        <legend className="sr-only">Categorías de cookies</legend>
        <div className="consent-row">
          <input id={`${uid}-nec`} type="checkbox" checked readOnly disabled aria-describedby={`${uid}-nec-d`} />
          <div><label htmlFor={`${uid}-nec`}>Necesarias</label><p id={`${uid}-nec-d`}>Siempre activas. Recuerdan tu elección de cookies y, cuando existan cuentas, mantienen tu sesión.</p></div>
        </div>
        <div className="consent-row">
          <input id={`${uid}-ana`} type="checkbox" checked={analytics} onChange={(e) => { setAnalytics(e.target.checked); setSaved(false); }} aria-describedby={`${uid}-ana-d`} disabled={!analyticsConfigured} />
          <div><label htmlFor={`${uid}-ana`}>Analíticas</label>
            <p id={`${uid}-ana-d`}>{analyticsConfigured ? "Nos ayudan a entender qué páginas se visitan. Solo se cargan si las aceptas." : "Hoy NEXORA no usa analítica, por lo que no hay nada que activar."}</p></div>
        </div>
        <div className="consent-row">
          <input id={`${uid}-pre`} type="checkbox" checked={preferences} onChange={(e) => { setPreferences(e.target.checked); setSaved(false); }} aria-describedby={`${uid}-pre-d`} />
          <div><label htmlFor={`${uid}-pre`}>Preferencias</label><p id={`${uid}-pre-d`}>Hoy NEXORA no guarda preferencias en cookies. La categoría existe para cuando se habiliten (por ejemplo, ajustes de visualización).</p></div>
        </div>
      </fieldset>
      <div className="actions">
        <Button onClick={() => commit({ analytics: analyticsConfigured && analytics, preferences })}>Guardar preferencias</Button>
        {!compact && <>
          <Button variant="secondary" onClick={() => commit(REJECT_NON_ESSENTIAL)}>Rechazar no esenciales</Button>
          <Button variant="secondary" onClick={() => commit({ ...ACCEPT_ALL, analytics: analyticsConfigured })}>Aceptar todas</Button>
        </>}
      </div>
      <p role="status" className="consent-status">{saved ? "Preferencias guardadas. Se aplican en la siguiente página que visites." : ""}</p>
    </div>
  );
}
