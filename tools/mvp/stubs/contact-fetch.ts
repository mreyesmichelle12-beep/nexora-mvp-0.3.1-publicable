import type { ContactState } from "@/lib/contact-validation";

/** En el MVP la "acción de servidor" del formulario de contacto es un POST real a /api/contact (validación, límite de envíos y SQLite en el servidor). */
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  try {
    const body = new URLSearchParams();
    formData.forEach((v, k) => { if (typeof v === "string") body.append(k, v); });
    const res = await fetch("/api/contact", { method: "POST", body, credentials: "same-origin", headers: { Accept: "application/json" } });
    return (await res.json()) as ContactState;
  } catch {
    return { status: "error", message: "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo." };
  }
}
