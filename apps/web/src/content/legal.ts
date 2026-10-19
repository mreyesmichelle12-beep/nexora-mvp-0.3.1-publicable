/**
 * Textos legales: BORRADORES de diseño. No son asesoría legal y deben ser revisados por un abogado antes de publicarse.
 * Los datos que sólo el titular puede dar (razón social, domicilio, plazos) están marcados como `pending`.
 */
export interface LegalSection { id: string; title: string; paragraphs?: string[]; list?: string[]; pending?: string }
export interface LegalDoc { title: string; lead: string; sections: LegalSection[] }

export const LEGAL_DRAFT_NOTICE = "Borrador sujeto a revisión legal. Aún no es el documento definitivo.";

export const PRIVACY: LegalDoc = {
  title: "Política de privacidad",
  lead: "Cómo está diseñado NEXORA para tratar tus datos personales: solo los necesarios y bajo tu control.",
  sections: [
    { id: "responsable", title: "Responsable", paragraphs: ["Persona o entidad responsable del tratamiento de los datos de NEXORA."], pending: "Nombre o razón social, domicilio y medio de contacto del responsable." },
    { id: "datos", title: "Qué datos tratamos", list: ["Cuenta: nombre, apellido, correo y contraseña (almacenada con hash, nunca en texto).", "Perfil académico: universidad, carrera, ciclo, materias, horarios, intereses, preferencias de estudio, modalidad y habilidades.", "Fotografía de perfil y biografía breve, ambas opcionales.", "Contenido que compartes: archivos de la Biblioteca y mensajes entre conexiones.", "Mensajes enviados desde el formulario de contacto.", "Datos técnicos mínimos para seguridad, como un identificador derivado de la dirección IP que no permite recuperarla."] },
    { id: "finalidad", title: "Para qué los usamos", list: ["Ofrecer la plataforma y calcular la compatibilidad de Smart Match.", "Verificar cuentas de docentes, mentores y conferencistas.", "Mantener la seguridad y moderar contenido y conductas.", "Responder tus consultas.", "Medir el uso del sitio, solo si aceptas las cookies analíticas."] },
    { id: "minimizacion", title: "Minimización de datos", paragraphs: ["NEXORA está diseñada para no pedir lo que no necesita. Por ejemplo, no solicitamos tu edad exacta y no guardamos el historial de tus conversaciones con NEXORA AI."] },
    { id: "terceros", title: "Con quién se comparten", paragraphs: ["Para funcionar, NEXORA se apoyará en proveedores técnicos como alojamiento, correo, video, almacenamiento de archivos, inteligencia artificial y pagos, a medida que se activen. Solo recibirán los datos necesarios para su función.", "El diseño de NEXORA no contempla vender datos personales."], pending: "Lista final de proveedores y su ubicación." },
    { id: "derechos", title: "Tus derechos", list: ["Acceder a tus datos.", "Corregirlos.", "Solicitar su eliminación.", "Exportarlos cuando corresponda.", "Retirar tu consentimiento en cualquier momento.", "Configurar tu privacidad dentro de la plataforma."], paragraphs: ["Mientras no existan estas herramientas dentro de tu cuenta, puedes ejercer tus derechos desde la página de Contacto."] },
    { id: "conservacion", title: "Conservación", paragraphs: ["Conservaremos los datos mientras tengas una cuenta o sean necesarios para fines legítimos."], pending: "Plazos concretos de conservación." },
    { id: "seguridad", title: "Seguridad", paragraphs: ["Aplicamos medidas como contraseñas con hash, sesiones seguras, control de acceso por rol, validación de archivos y registros de auditoría. Ninguna medida garantiza seguridad absoluta."] },
    { id: "normativa", title: "Normativa aplicable", paragraphs: ["NEXORA se diseña considerando la normativa aplicable en El Salvador. Este documento no constituye una garantía de cumplimiento legal y debe ser revisado por asesoría jurídica."] },
    { id: "cambios", title: "Cambios", paragraphs: ["Si cambiamos esta política de forma relevante, lo indicaremos en el sitio."] },
  ],
};

export const TERMS: LegalDoc = {
  title: "Términos y condiciones",
  lead: "Las reglas para usar NEXORA de forma segura y respetuosa.",
  sections: [
    { id: "aceptacion", title: "Aceptación", paragraphs: ["Al crear una cuenta o usar NEXORA aceptas estos términos."] },
    { id: "servicio", title: "El servicio", paragraphs: ["NEXORA es una plataforma web educativa en etapa de prototipo. Sus funciones se habilitan por fases y pueden cambiar."] },
    { id: "cuentas", title: "Cuentas y verificación", list: ["Debes dar información veraz.", "Eres responsable de la seguridad de tu contraseña.", "Los roles de docente, mentor y conferencista requieren verificación aprobada.", "Podemos suspender cuentas que incumplan estos términos."] },
    { id: "conducta", title: "Conducta", paragraphs: ["La interacción en NEXORA es académica y respetuosa."], list: ["No se permite acoso, discriminación ni suplantación de identidad.", "No se permite enviar spam ni contactar de forma insistente a quien no responde.", "Puedes bloquear y reportar a cualquier persona."] },
    { id: "contenido", title: "Contenido y Biblioteca", list: ["Sube solo material que tengas derecho a compartir.", "Los archivos se validan y se moderan antes de publicarse.", "Podemos retirar contenido que infrinja derechos o estas reglas."] },
    { id: "ia", title: "NEXORA AI", paragraphs: ["NEXORA AI es un apoyo para aprender. Puede cometer errores y no sustituye a docentes ni a tu propio estudio. Úsala respetando las reglas de integridad académica de tu institución."] },
    { id: "planes", title: "Planes y pagos", paragraphs: ["Existirá un plan Free y un plan Pro. Por ahora no se procesan pagos. Las condiciones y precios definitivos se publicarán antes de cualquier cobro."] },
    { id: "responsabilidad", title: "Limitación de responsabilidad", pending: "Redacción definitiva, a cargo de asesoría legal." },
    { id: "ley", title: "Ley aplicable y cambios", pending: "Ley y jurisdicción aplicables, y mecanismo de aviso de cambios." },
  ],
};

export const NOTICE: LegalDoc = {
  title: "Aviso legal",
  lead: "Información sobre el titular y el uso de este sitio.",
  sections: [
    { id: "titular", title: "Titular del sitio", pending: "Nombre o razón social, domicilio y medio de contacto del titular." },
    { id: "naturaleza", title: "Naturaleza del proyecto", paragraphs: ["NEXORA es un emprendimiento educativo en etapa de prototipo, diseñado inicialmente para estudiantes universitarios de El Salvador.", "NEXORA no declara alianzas, convenios ni respaldo institucional de ninguna universidad."] },
    { id: "propiedad", title: "Propiedad intelectual", paragraphs: ["El nombre, el logotipo y los contenidos originales de NEXORA pertenecen a su titular. Los contenidos subidos por personas usuarias pertenecen a sus autores."], pending: "Titular de la marca y de los derechos." },
    { id: "contenidos", title: "Contenidos y enlaces", paragraphs: ["Procuramos que la información del sitio sea correcta, pero puede cambiar. No nos hacemos responsables del contenido de sitios externos enlazados."] },
    { id: "contacto", title: "Contacto", paragraphs: ["Puedes escribirnos desde la página de Contacto."] },
  ],
};
