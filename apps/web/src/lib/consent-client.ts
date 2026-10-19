import { consentCookieString, readConsentFromCookieHeader, type Consent, type ConsentChoice } from "./consent.ts";

export const CONSENT_EVENT = "nexora:consent";

export function getStoredConsent(): Consent | null {
  return readConsentFromCookieHeader(document.cookie);
}

/** Guarda la elección en una cookie de primera parte y avisa a otros componentes (banner ↔ página de cookies). */
export function saveConsent(choice: ConsentChoice): void {
  document.cookie = consentCookieString(choice, location.protocol === "https:");
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}
