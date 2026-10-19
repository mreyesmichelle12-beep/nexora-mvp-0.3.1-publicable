import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Página no encontrada", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main id="contenido" className="center-page">
      <Logo width={160} />
      <p className="center-page__code" aria-hidden="true">404</p>
      <h1>Esta conexión no existe.</h1>
      <p>El enlace que seguiste no lleva a ninguna página de NEXORA. Puede que haya cambiado o que la dirección tenga un error.</p>
      <div className="actions actions--center">
        <Link href="/" className={buttonClass("primary")}>Volver al inicio</Link>
        <Link href="/plataforma" className={buttonClass("secondary")}>Explorar NEXORA</Link>
      </div>
    </main>
  );
}
