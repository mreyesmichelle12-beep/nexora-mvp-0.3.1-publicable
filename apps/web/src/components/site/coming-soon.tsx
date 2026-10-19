import Link from "next/link";
import { Info } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

/** Página honesta para funciones que aún no existen: no hay formularios falsos ni accesos simulados. */
export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <div className="center-page" style={{ minHeight: "60dvh" }}>
      <Info aria-hidden="true" size={36} color="#5B2FC4" />
      <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}>{title}</h1>
      <p>{text}</p>
      <div className="actions actions--center">
        <Link href="/" className={buttonClass("primary")}>Volver al inicio</Link>
        <Link href="/plataforma" className={buttonClass("secondary")}>Conocer la plataforma</Link>
      </div>
    </div>
  );
}
