"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConsentForm } from "./consent-form";
import { ACCEPT_ALL, REJECT_NON_ESSENTIAL, consentCookieString, readConsentFromCookieHeader, type ConsentChoice } from "@/lib/consent";

export const CONSENT_EVENT = "nexora:consent";

/** Guarda la elección y avisa al resto de la app (p. ej. al cargador de analítica). */
export function saveConsent(choice: ConsentChoice) {
  document.cookie = consentCookieString(choice, window.location.protocol === "https:");
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

export function CookieBanner({ analyticsAvailable }: { analyticsAvailable: boolean }) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"summary" | "config">("summary");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { setVisible(readConsentFromCookieHeader(document.cookie) === null); }, []);
  useEffect(() => { if (mode === "config") headingRef.current?.focus(); }, [mode]);

  if (!visible) return null;
  const choose = (c: ConsentChoice) => { saveConsent(c); setVisible(false); };

  return (
    <div className="cookie" role="region" aria-label="Preferencias de cookies">
      <div className="cookie__card">
        <h2 tabIndex={-1} ref={headingRef}>{mode === "summary" ? "Tu privacidad en NEXORA" : "Configurar cookies"}</h2>
        {mode === "summary" ? (
          <>
            <p>Usamos una cookie necesaria para recordar tu elección. Las cookies analíticas y de preferencias solo se activan si las aceptas. Puedes cambiarlo cuando quieras en la <Link href="/cookies">política de cookies</Link>.</p>
            <div className="cookie__actions">
              <Button variant="secondary" onClick={() => choose(REJECT_NON_ESSENTIAL)}>Rechazar</Button>
              <Button variant="secondary" onClick={() => setMode("config")}>Configurar</Button>
              <Button variant="secondary" onClick={() => choose(ACCEPT_ALL)}>Aceptar todas</Button>
            </div>
          </>
        ) : (
          <>
            <ConsentForm initial={REJECT_NON_ESSENTIAL} analyticsAvailable={analyticsAvailable} onSave={choose} />
            <div><Button variant="ghost" size="sm" onClick={() => setMode("summary")}>Volver</Button></div>
          </>
        )}
      </div>
    </div>
  );
}
