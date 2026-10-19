import { LegalPage } from "@/components/site/legal";
import { CookiePreferences } from "@/components/site/cookie-preferences";
import { meta, publicConfig } from "@/lib/page-meta";

const T = "Política y preferencias de cookies", D = "Qué cookies usa NEXORA, para qué sirven y cómo aceptar, rechazar o cambiar tu consentimiento en cualquier momento.";
export const metadata = meta({ title: T, description: D, path: "/cookies" });

export default function Page() {
  const analytics = publicConfig.analytics;
  return (
    <LegalPage title={T} path="/cookies" description={D}>
      <h2>Tus preferencias</h2>
      <CookiePreferences analyticsAvailable={Boolean(analytics)} />
      <h2>Qué cookies usamos</h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Tabla de cookies (desplazable)">
        <table>
          <caption className="sr-only">Cookies de NEXORA</caption>
          <thead><tr><th scope="col">Cookie</th><th scope="col">Categoría</th><th scope="col">Para qué sirve</th><th scope="col">Duración</th><th scope="col">Estado</th></tr></thead>
          <tbody>
            <tr><th scope="row">nexora_consent</th><td>Necesaria</td><td>Recuerda tu elección sobre cookies.</td><td>180 días</td><td>En uso</td></tr>
            <tr><th scope="row">nexora_session</th><td>Necesaria</td><td>Mantiene tu sesión iniciada.</td><td>Hasta 14 días sin actividad</td><td>Aún no se emite: no hay cuentas</td></tr>
            <tr><th scope="row">Analítica</th><td>Analítica</td><td>Medir visitas y uso del sitio, de forma agregada.</td><td>—</td><td>{analytics ? "Configurada: solo se carga si la aceptas" : "No hay ninguna activa"}</td></tr>
          </tbody>
        </table>
      </div>
      <p>No cargamos cookies analíticas ni de preferencias antes de que las aceptes. Si retiras tu consentimiento, dejaremos de cargarlas.</p>
      <h2>Cómo cambiar tu elección</h2>
      <p>Usa el formulario de esta página en cualquier momento. También puedes borrar las cookies desde la configuración de tu navegador.</p>
    </LegalPage>
  );
}
