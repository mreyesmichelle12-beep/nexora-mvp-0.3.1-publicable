import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Common { label: string; hint?: string; error?: string; required?: boolean; className?: string }

function Shell({ id, label, hint, error, required, className, children }: Common & { id: string; children: (a: { "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={`field ${className ?? ""}`.trim()}>
      <label htmlFor={id} className="field__label">
        {label}
        <span className="field__opt">{required ? "(obligatorio)" : "(opcional)"}</span>
      </label>
      {children({ "aria-invalid": error ? true : undefined, "aria-describedby": [hintId, errId].filter(Boolean).join(" ") || undefined })}
      {hint && !error && <p id={hintId} className="field__hint">{hint}</p>}
      {error && (
        <p id={errId} className="field__error">
          <AlertCircle aria-hidden="true" size={16} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/** Campos accesibles: label asociado, ayuda y error enlazados por aria-describedby; el error no depende sólo del color. */
export function TextField({ label, hint, error, required, className, ...rest }: Common & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) {
  const id = useId();
  return <Shell {...{ id, label, hint, error, required, className }}>{(a) => <input id={id} required={required} className="field__control" {...a} {...rest} />}</Shell>;
}

export function TextAreaField({ label, hint, error, required, className, ...rest }: Common & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  const id = useId();
  return <Shell {...{ id, label, hint, error, required, className }}>{(a) => <textarea id={id} required={required} className="field__control" {...a} {...rest} />}</Shell>;
}

export function SelectField({ label, hint, error, required, className, children, ...rest }: Common & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">) {
  const id = useId();
  return <Shell {...{ id, label, hint, error, required, className }}>{(a) => <select id={id} required={required} className="field__control" {...a} {...rest}>{children}</select>}</Shell>;
}
