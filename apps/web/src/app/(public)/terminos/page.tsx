import Link from "next/link";
import { LegalPage, ResponsibleEntity } from "@/components/site/legal";
import { Pending } from "@/components/site/pending";
import { meta } from "@/lib/page-meta";

const T = "Términos y condiciones", D = "Reglas de uso de NEXORA: cuentas, conducta, contenido académico, NEXORA AI, planes y responsabilidades.";
export const metadata = meta({ title: T, description: D, path: "/terminos" });

export default function Page() {
  return (
    <LegalPage title={T} path="/terminos" description={D}>
      <h2>1. Quién ofrece NEXORA</h2>
      <ResponsibleEntity />
      <h2>2. Estado del servicio</h2>
      <p>NEXORA es una plataforma web educativa en etapa de prototipo. Las funciones descritas en este sitio se habilitan por fases y pueden cambiar.</p>
      <h2>3. Cuentas</h2>
      <ul>
        <li>Debes proporcionar información veraz y mantener segura tu contraseña.</li>
        <li>Los roles de docente, mentor o conferencista requieren verificación. Presentarse falsamente con uno de esos roles puede causar la suspensión de la cuenta.</li>
      </ul>
      <h2>4. Conducta</h2>
      <ul>
        <li>NEXORA es un espacio académico y profesional. No se permite acoso, spam, suplantación ni uso con fines de citas.</li>
        <li>Puedes bloquear y reportar a otras personas. Podemos suspender cuentas que incumplan estas reglas.</li>
      </ul>
      <h2>5. Contenido y biblioteca</h2>
      <ul>
        <li>Eres responsable de lo que subes y de contar con derecho a compartirlo.</li>
        <li>Los archivos se validan y pasan por moderación; podemos rechazar o retirar contenido.</li>
        <li>No subas material protegido sin autorización ni exámenes obtenidos de forma indebida.</li>
      </ul>
      <h2>6. NEXORA AI</h2>
      <p>El asistente guía el aprendizaje y puede equivocarse. No sustituye a tus docentes ni debe usarse para entregar trabajos como propios si tu institución lo prohíbe.</p>
      <h2>7. Planes y pagos</h2>
      <p>Habrá un plan Free y un plan Pro. Las condiciones de precio, cobro y cancelación se publicarán antes de habilitar pagos. Hoy no se realiza ningún cobro.</p>
      <h2>8. Propiedad intelectual</h2>
      <p>La marca y el logo de NEXORA pertenecen a sus titulares. Tú conservas los derechos sobre tu contenido y nos concedes el permiso necesario para mostrarlo dentro de la plataforma.</p>
      <h2>9. Limitación de responsabilidad</h2>
      <Pending>Redacción definitiva a cargo de asesoría legal</Pending>
      <h2>10. Ley aplicable y jurisdicción</h2>
      <Pending>Por definir con asesoría legal</Pending>
      <h2>11. Contacto</h2>
      <p>Escríbenos desde <Link href="/contacto">Contacto</Link>.</p>
    </LegalPage>
  );
}
