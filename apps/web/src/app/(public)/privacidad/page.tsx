import Link from "next/link";
import { LegalPage, ResponsibleEntity } from "@/components/site/legal";
import { Pending } from "@/components/site/pending";
import { STUDENT_PROFILE_FIELDS } from "@/content/site";
import { meta } from "@/lib/page-meta";

const T = "Política de privacidad", D = "Cómo NEXORA trata los datos personales: qué se recopila, para qué, tus derechos y cómo ejercerlos.";
export const metadata = meta({ title: T, description: D, path: "/privacidad" });

export default function Page() {
  return (
    <LegalPage title={T} path="/privacidad" description={D}>
      <h2>1. Responsable</h2>
      <ResponsibleEntity />
      <h2>2. Qué datos tratamos hoy</h2>
      <p>NEXORA está en etapa de prototipo y las cuentas aún no están habilitadas. Por eso, actualmente tratamos solo:</p>
      <ul>
        <li><strong>Formulario de contacto:</strong> tu nombre, correo, motivo y mensaje, que usamos únicamente para responderte. También guardamos un identificador técnico derivado de tu dirección IP (no la IP en claro) para limitar el spam.</li>
        <li><strong>Cookies:</strong> una cookie necesaria que recuerda tu elección. Ver <Link href="/cookies">política de cookies</Link>.</li>
      </ul>
      <h2>3. Qué datos se pedirán cuando existan cuentas</h2>
      <p>Aplicamos el principio de minimización: solo lo necesario para conectar a estudiantes.</p>
      <ul>{STUDENT_PROFILE_FIELDS.map((f) => <li key={f}>{f}</li>)}</ul>
      <p>No solicitamos tu edad exacta. A docentes, mentores y conferencistas se les puede pedir además un correo institucional o profesional para verificar su rol.</p>
      <h2>4. Para qué los usamos</h2>
      <ul>
        <li>Crear y mantener tu cuenta y tu perfil académico.</li>
        <li>Calcular coincidencias de compatibilidad (Smart Match) mediante un algoritmo ponderado.</li>
        <li>Permitir conexiones, mensajes, Study Rooms y recursos.</li>
        <li>Moderar contenido y atender reportes.</li>
        <li>Seguridad, prevención de abuso y mejora del servicio.</li>
      </ul>
      <h2>5. Quién ve tu información</h2>
      <p>Tú configuras la visibilidad de tu perfil y si apareces como conexión presente antes de entrar a una sesión. No mostramos datos personales innecesarios a otras personas.</p>
      <h2>6. NEXORA AI</h2>
      <p>No está previsto guardar el historial de tus conversaciones con el asistente. Se registra únicamente un contador de uso para aplicar límites.</p>
      <h2>7. Tus derechos</h2>
      <p>Podrás solicitar acceso, corrección, eliminación y exportación de tus datos, y retirar tu consentimiento cuando se haya basado en él. Mientras no existan cuentas, escríbenos desde <Link href="/contacto">Contacto</Link>.</p>
      <h2>8. Conservación</h2>
      <Pending>Plazos de conservación por categoría de datos</Pending>
      <h2>9. Proveedores y transferencias</h2>
      <Pending>Lista de proveedores (alojamiento, correo, video, almacenamiento, IA, pagos) y su ubicación, cuando se contraten</Pending>
      <h2>10. Normativa aplicable</h2>
      <p>Diseñamos NEXORA considerando la normativa aplicable en El Salvador. La referencia legal exacta se confirmará con asesoría profesional.</p>
      <h2>11. Cambios</h2>
      <p>Si cambiamos esta política, publicaremos la nueva versión en esta página y, cuando corresponda, te lo notificaremos.</p>
    </LegalPage>
  );
}
