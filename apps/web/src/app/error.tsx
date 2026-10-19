"use client";
import { Button } from "@/components/ui/button";
import { StateBlock } from "@/components/ui/state-block";

/** Frontera de error: nunca muestra el mensaje ni el stack al usuario. `digest` sirve para buscarlo en logs. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="contenido" className="center-page">
      <StateBlock
        kind="error"
        title="Algo salió mal de nuestro lado"
        description={`No pudimos cargar esta página. Inténtalo de nuevo; si persiste, escríbenos desde Contacto${error.digest ? ` e indica el código ${error.digest}` : ""}.`}
        action={<Button onClick={reset}>Reintentar</Button>}
      />
    </main>
  );
}
