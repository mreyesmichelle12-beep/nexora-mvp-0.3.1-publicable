import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "on-dark" | "outline-on-dark";
export type ButtonSize = "sm" | "md" | "lg";

/** Clases de botón reutilizables también para enlaces (<Link className={buttonClass(...)}>). */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string): string {
  return cn("btn", `btn--${variant}`, size !== "md" && `btn--${size}`, extra);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra estado de carga y bloquea reenvíos. */
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({ variant = "primary", size = "md", loading = false, loadingLabel, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass(variant, size, className)} {...rest}>
      {loading && <Loader2 aria-hidden="true" className="btn__spinner" />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
