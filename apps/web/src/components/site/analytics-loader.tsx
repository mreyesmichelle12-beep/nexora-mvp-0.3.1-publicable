"use client";
import { useEffect } from "react";
import { CONSENT_EVENT } from "./cookie-banner";
import { readConsentFromCookieHeader } from "@/lib/consent";

const SCRIPT_ID = "nexora-analytics";

/**
 * Carga la analítica SOLO con consentimiento explícito (y solo si hay un proveedor configurado).
 * Si el usuario retira el consentimiento, se elimina el script y se recarga la página para detener el seguimiento.
 */
export function AnalyticsLoader({ domain }: { domain: string }) {
  useEffect(() => {
    const sync = () => {
      const allowed = readConsentFromCookieHeader(document.cookie)?.analytics === true;
      const existing = document.getElementById(SCRIPT_ID);
      if (allowed && !existing) {
        const s = document.createElement("script");
        s.id = SCRIPT_ID;
        s.defer = true;
        s.src = "https://plausible.io/js/script.js";
        s.setAttribute("data-domain", domain);
        document.head.appendChild(s);
      } else if (!allowed && existing) {
        existing.remove();
        window.location.reload();
      }
    };
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, [domain]);
  return null;
}
