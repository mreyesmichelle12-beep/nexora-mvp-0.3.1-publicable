"use server";
import { headers } from "next/headers";
import { validateContact, type ContactState } from "@/lib/contact-validation";
import { RULES, rateLimit } from "@/lib/security/rate-limit";
import { getRateStore } from "@/lib/security/rate-store";
import { hashForLog } from "@/lib/security/tokens";

const OK_MESSAGE = "Recibimos tu mensaje. Quedó registrado y el equipo de NEXORA lo revisará.";

/**
 * Envío del formulario de contacto. Orden deliberado:
 *  1) validar (barato) · 2) descartar spam (honeypot) · 3) limitar envíos VÁLIDOS por IP · 4) guardar.
 * Sólo se informa éxito si el mensaje realmente quedó guardado en la base de datos.
 * Next.js ya verifica el origen de las Server Actions (protección CSRF).
 */
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(formData.entries());
  const v = validateContact(raw);

  if (!v.ok) {
    // Bot (honeypot): se responde igual que a una persona para no darle señales, y NO se guarda nada.
    if (v.spam) return { status: "success", message: OK_MESSAGE };
    return { status: "error", message: "Revisa los campos marcados y vuelve a enviar.", errors: v.errors, values: v.values };
  }

  // IP: sólo es fiable si la app corre detrás de un proxy de confianza que sobrescribe X-Forwarded-For.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
  const pepper = process.env.LOG_PEPPER || "dev-only-pepper-no-usar-en-produccion";
  const ipHash = hashForLog(ip, pepper);

  const rl = await rateLimit(await getRateStore(), RULES.contact, ipHash);
  if (!rl.allowed) {
    const mins = Math.max(1, Math.ceil(rl.retryAfterSeconds / 60));
    return { status: "error", message: `Enviaste varios mensajes seguidos. Inténtalo de nuevo en unos ${mins} minuto${mins === 1 ? "" : "s"}.`, values: v.values };
  }

  if (!process.env.DATABASE_URL) {
    return { status: "error", message: "El formulario no está disponible en este entorno todavía. Intenta más tarde o escríbenos por los canales oficiales de la página.", values: v.values };
  }

  try {
    const { db } = await import("@nexora/db");
    await db.contactMessage.create({ data: { name: v.data.name, email: v.data.email, subject: v.data.subject, message: v.data.message, ipHash } });
    return { status: "success", message: OK_MESSAGE };
  } catch {
    // Sin datos personales en el log.
    console.error("contacto: no se pudo guardar el mensaje");
    return { status: "error", message: "No pudimos guardar tu mensaje por un problema de nuestro lado. Inténtalo de nuevo en unos minutos.", values: v.values };
  }
}
