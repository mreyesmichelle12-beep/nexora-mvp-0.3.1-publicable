// DOBLE DE PRUEBA (solo arnés). La acción real vive en src/app/(public)/contacto/actions.ts y requiere servidor + base de datos.
// Aquí se reutiliza la validación REAL del servidor para probar el flujo del formulario en el navegador.
import { validateContact, type ContactState } from "@/lib/contact-validation";
declare global { interface Window { __SUBMITS?: unknown[] } }
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const v = validateContact(Object.fromEntries(formData.entries()));
  (window.__SUBMITS ??= []).push({ ok: v.ok, spam: !v.ok && v.spam });
  await new Promise((r) => setTimeout(r, 400)); // permite observar el estado de carga
  if (!v.ok) return v.spam ? { status: "success", message: "spam-descartado" } : { status: "error", message: "Revisa los campos marcados y vuelve a enviar.", errors: v.errors, values: v.values };
  return { status: "success", message: "Recibimos tu mensaje. Quedó registrado y el equipo de NEXORA lo revisará." };
}
