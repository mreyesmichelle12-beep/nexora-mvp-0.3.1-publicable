"use client";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { StateBlock } from "@/components/ui/state-block";
import { SelectField, TextAreaField, TextField } from "@/components/ui/text-field";
import { submitContact } from "@/app/(public)/contacto/actions";
import { CONTACT_SUBJECTS, LIMITS, validateContact, type ContactErrors, type ContactField, type ContactState } from "@/lib/contact-validation";

const INITIAL: ContactState = { status: "idle" };
const LABELS: Record<ContactField, string> = { name: "Nombre", email: "Correo", subject: "Motivo", message: "Mensaje" };

export function ContactForm({ initialSubject }: { initialSubject?: string }) {
  const [state, formAction, pending] = useActionState(submitContact, INITIAL);
  const [clientErrors, setClientErrors] = useState<ContactErrors>({});
  const summary = useRef<HTMLDivElement>(null);

  const serverErrors = state.status === "error" ? state.errors ?? {} : {};
  const errors: ContactErrors = { ...serverErrors, ...clientErrors };
  const entries = Object.entries(errors) as Array<[ContactField, string]>;
  const values = state.status === "error" ? state.values ?? {} : {};
  const formMessage = state.status === "error" && !entries.length ? state.message : "";

  // Lleva el foco al resumen de errores para que lectores de pantalla y teclado lo encuentren.
  useEffect(() => { if (entries.length || formMessage) summary.current?.focus(); }, [entries.length, formMessage, state]);

  // Validación en el navegador (rápida). La del servidor es la que cuenta.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const r = validateContact(Object.fromEntries(new FormData(e.currentTarget).entries()));
    if (!r.ok && !r.spam) { e.preventDefault(); setClientErrors(r.errors); } else setClientErrors({});
  }

  if (state.status === "success") {
    return <StateBlock kind="success" title="Mensaje enviado" description={state.message} />;
  }

  const defaultSubject = values.subject ?? (CONTACT_SUBJECTS.some((s) => s.value === initialSubject) ? initialSubject : "");

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="contact-form" aria-describedby={entries.length || formMessage ? "form-errors" : undefined}>
      {(entries.length > 0 || formMessage) && (
        <div id="form-errors" ref={summary} tabIndex={-1} role="alert" className="form-errors">
          <strong>{formMessage ? "No se pudo enviar" : "Corrige estos campos para enviar:"}</strong>
          {formMessage ? <p>{formMessage}</p> : <ul>{entries.map(([k, m]) => <li key={k}>{LABELS[k]}: {m}</li>)}</ul>}
        </div>
      )}
      <TextField label="Nombre" name="name" autoComplete="name" required maxLength={LIMITS.nameMax} defaultValue={values.name} error={errors.name} />
      <TextField label="Correo" name="email" type="email" autoComplete="email" required defaultValue={values.email} error={errors.email} hint="Solo lo usaremos para responderte." />
      <SelectField label="Motivo" name="subject" required defaultValue={defaultSubject} error={errors.subject}>
        <option value="" disabled>Elige un motivo</option>
        {CONTACT_SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </SelectField>
      <TextAreaField label="Mensaje" name="message" required minLength={LIMITS.messageMin} maxLength={LIMITS.messageMax} defaultValue={values.message} error={errors.message} hint={`Entre ${LIMITS.messageMin} y ${LIMITS.messageMax} caracteres.`} />
      {/* Trampa para bots: invisible para personas y fuera del orden de tabulación. */}
      <div className="hp" aria-hidden="true"><label>No rellenar este campo<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <Button type="submit" size="lg" loading={pending} loadingLabel="Enviando…">Enviar mensaje</Button>
    </form>
  );
}
