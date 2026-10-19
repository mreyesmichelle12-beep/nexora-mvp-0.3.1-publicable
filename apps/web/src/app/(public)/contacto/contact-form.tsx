"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/text-field";
import { CONTACT_SUBJECTS, LIMITS, validateContact, type ContactErrors, type ContactState } from "@/lib/contact-validation";
import { submitContact } from "./actions";

const IDLE: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, IDLE);
  const [clientErrors, setClientErrors] = useState<ContactErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const errors: ContactErrors = { ...(state.status === "error" ? state.errors : {}), ...clientErrors };
  const values = state.status === "error" ? state.values : undefined;

  // Asunto precargado desde ?asunto=... (sólo valores de la lista; cualquier otro se ignora)
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("asunto");
    const field = formRef.current?.elements.namedItem("subject");
    if (wanted && field instanceof HTMLSelectElement && CONTACT_SUBJECTS.some((s) => s.value === wanted)) field.value = wanted;
  }, []);

  // Tras un resultado, mueve el foco al aviso para que lectores de pantalla lo anuncien
  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.focus();
    if (state.status === "success") { formRef.current?.reset(); setClientErrors({}); }
  }, [state]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const r = validateContact(Object.fromEntries(fd.entries()));
    if (!r.ok && !r.spam) {
      e.preventDefault();
      setClientErrors(r.errors);
      const first = (["name", "email", "subject", "message"] as const).find((k) => r.errors[k]);
      if (first) e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    } else {
      setClientErrors({});
    }
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="contact-form" aria-describedby="contact-status">
      <div id="contact-status" ref={statusRef} tabIndex={-1} aria-live="polite">
        {state.status === "success" && <p className="form-status form-status--ok" role="status"><CheckCircle2 aria-hidden="true" size={20} />{state.message}</p>}
        {state.status === "error" && <p className="form-status form-status--error" role="alert"><AlertCircle aria-hidden="true" size={20} />{state.message}</p>}
      </div>

      <TextField label="Nombre" name="name" required autoComplete="name" maxLength={LIMITS.nameMax} defaultValue={values?.name} error={errors.name} />
      <TextField label="Correo" name="email" type="email" required autoComplete="email" inputMode="email" defaultValue={values?.email} error={errors.email} hint="Solo lo usamos para responderte." />
      <SelectField label="Motivo" name="subject" required defaultValue={values?.subject ?? "general"} error={errors.subject}>
        {CONTACT_SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </SelectField>
      <TextAreaField label="Mensaje" name="message" required maxLength={LIMITS.messageMax} defaultValue={values?.message} error={errors.message} hint={`Entre ${LIMITS.messageMin} y ${LIMITS.messageMax} caracteres.`} />

      {/* Anti-spam (honeypot): invisible para personas y lectores de pantalla; los bots suelen rellenarlo. */}
      <div className="hp" aria-hidden="true">
        <label>No rellenes este campo<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div><Button type="submit" size="lg" loading={pending} loadingLabel="Enviando…">Enviar mensaje</Button></div>
    </form>
  );
}
