import { NextResponse } from "next/server";

/** Comprobación de vida para el despliegue. No expone versión, entorno ni configuración. */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
