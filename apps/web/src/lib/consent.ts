/** Consentimiento de cookies. La cookie del consentimiento es "necesaria": sólo recuerda tu elección. */
export const CONSENT_COOKIE = "nexora_consent";
export const CONSENT_VERSION = 1; // súbela cuando cambien las categorías o la política: reaparece el banner
export const CONSENT_MAX_AGE_S = 180 * 24 * 60 * 60;

export interface Consent {
  v: number;
  analytics: boolean;
  preferences: boolean;
  ts: number;
}
export type ConsentChoice = Pick<Consent, "analytics" | "preferences">;

export const ACCEPT_ALL: ConsentChoice = { analytics: true, preferences: true };
export const REJECT_NON_ESSENTIAL: ConsentChoice = { analytics: false, preferences: false };

export function parseConsent(raw: string | null | undefined): Consent | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(decodeURIComponent(raw)) as Partial<Consent>;
    if (o.v !== CONSENT_VERSION) return null;
    if (typeof o.analytics !== "boolean" || typeof o.preferences !== "boolean" || typeof o.ts !== "number") return null;
    return { v: o.v, analytics: o.analytics, preferences: o.preferences, ts: o.ts };
  } catch {
    return null;
  }
}

export function serializeConsent(choice: ConsentChoice, now: number = Date.now()): string {
  const c: Consent = { v: CONSENT_VERSION, analytics: choice.analytics, preferences: choice.preferences, ts: now };
  return encodeURIComponent(JSON.stringify(c));
}

export function consentCookieString(choice: ConsentChoice, secure: boolean, now: number = Date.now()): string {
  return `${CONSENT_COOKIE}=${serializeConsent(choice, now)}; Max-Age=${CONSENT_MAX_AGE_S}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Lee la cookie del consentimiento desde document.cookie. */
export function readConsentFromCookieHeader(header: string | null | undefined): Consent | null {
  if (!header) return null;
  const part = header.split(/;\s*/).find((p) => p.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(part?.slice(CONSENT_COOKIE.length + 1));
}
