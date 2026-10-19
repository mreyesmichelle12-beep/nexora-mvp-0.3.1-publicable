import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "brand" | "ok" | "warn" | "bad";

/** El estado se comunica con texto + icono, nunca sólo con color. */
export function Badge({ tone = "neutral", icon, children, className }: { tone?: BadgeTone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <span className={cn("badge", tone !== "neutral" && `badge--${tone}`, className)}>{icon}{children}</span>;
}
