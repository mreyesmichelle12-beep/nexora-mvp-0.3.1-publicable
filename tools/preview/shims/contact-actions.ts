// Sustituto de la Server Action SOLO para el arnés: ejecuta la lógica REAL de contact-service
// con dependencias en memoria (sin base de datos ni red). Los "guardados" quedan en window.__SAVED__.
import { handleContact } from "@/lib/contact-service";
import type { ContactState } from "@/lib/contact-validation";
import { MemoryStore, RULES, rateLimit } from "@/lib/security/rate-limit";

const store = new MemoryStore();
export async function submitContact(_prev: ContactState, fd: FormData): Promise<ContactState> {
  return handleContact(Object.fromEntries(fd.entries()), {
    clientKey: "harness",
    dbConfigured: true,
    rateLimit: (k) => rateLimit(store, RULES.contact, k),
    save: async (d) => { const w = window as unknown as { __SAVED__?: unknown[] }; (w.__SAVED__ ??= []).push(d); },
  });
}
