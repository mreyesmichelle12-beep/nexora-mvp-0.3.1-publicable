import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "./lib/security/csp.ts";

/** Origen de una URL de entorno, o undefined si no está configurada / es inválida. */
function originOf(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV !== "production";

  const connectOrigins = [process.env.LIVEKIT_URL, process.env.REALTIME_URL, process.env.STORAGE_PUBLIC_ORIGIN]
    .map(originOf)
    .filter((o): o is string => Boolean(o));
  const imgOrigins = [originOf(process.env.STORAGE_PUBLIC_ORIGIN)].filter((o): o is string => Boolean(o));
  // Plausible sólo se permite en la CSP si está configurado (el script además exige consentimiento en el cliente).
  if (process.env.ANALYTICS_PROVIDER === "plausible" && process.env.PLAUSIBLE_DOMAIN) connectOrigins.push("https://plausible.io");

  // La analítica (Plausible) sólo se autoriza en la CSP si está configurada; el script igualmente exige consentimiento.
  const analyticsOn = process.env.ANALYTICS_PROVIDER === "plausible" && Boolean(process.env.PLAUSIBLE_DOMAIN);
  const analyticsOrigins = analyticsOn ? ["https://plausible.io"] : [];

  const csp = buildCsp({ nonce, isDev, connectOrigins: [...connectOrigins, ...analyticsOrigins], imgOrigins, scriptOrigins: analyticsOrigins });

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp); // Next lee esto para poner el nonce en sus scripts

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|brand/|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
