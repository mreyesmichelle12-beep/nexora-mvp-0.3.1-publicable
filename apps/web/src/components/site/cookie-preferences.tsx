"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ConsentForm } from "./consent-form";
import { saveConsent } from "./cookie-banner";
import { readConsentFromCookieHeader, REJECT_NON_ESSENTIAL, type Consent, type ConsentChoice } from "@/lib/consent";

/** Permite ver, cambiar y RETIRAR el consentimiento en cualquier momento. */
export function CookiePreferences({ analyticsAvailable }: { analyticsAvailable: boolean }) {
  const [current, setCurrent] = useState<Consent | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setCurrent(readConsentFromCookieHeader(document.cookie)); }, []);
  if (current === undefined) return <p className="muted" role="status">Cargando tus preferencias…</p>;

  const onSave = (c: ConsentChoice) => { saveConsent(c); setCurrent(readConsentFromCookieHeader(document.cookie)); setSaved(true); };
  const initial = current ? { analytics: current.analytics, preferences: current.preferences } : REJECT_NON_ESSENTIAL;
  return (
    <div className="stack">
      <p className="muted">{current ? `Tu elección actual: analíticas ${current.analytics ? "aceptadas" : "rechazadas"}, preferencias ${current.preferences ? "aceptadas" : "rechazadas"}.` : "Aún no has elegido. Mientras tanto, solo se usa la cookie necesaria."}</p>
      <ConsentForm key={String(current?.ts)} initial={initial} analyticsAvailable={analyticsAvailable} onSave={onSave} saveLabel="Guardar mi elección" />
      <div aria-live="polite">{saved && <p className="form-status form-status--ok"><CheckCircle2 aria-hidden="true" size={20} />Guardamos tu elección. Puedes cambiarla cuando quieras.</p>}</div>
    </div>
  );
}
