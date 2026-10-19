import { BookOpen, Camera, CheckCircle2, FileText, Mic, MonitorUp, Search, Sparkles, MessageSquare } from "lucide-react";

/** Ilustraciones de producto. NO son capturas de la plataforma real: usan datos ficticios y así se declaran. */
const Caption = ({ title, text }: { title: string; text: string }) => (
  <figcaption><strong>{title}</strong><span>{text}</span><span className="badge" style={{ justifySelf: "start" }}>Ilustración · datos ficticios</span></figcaption>
);

export function MockStudyRoom() {
  return (
    <figure className="mock">
      <div className="mock__window" role="img" aria-label="Ilustración de una Study Room: participantes, temporizador de 25 minutos, pizarra y controles.">
        <div className="mock__bar" aria-hidden="true"><span>Study Room · Matemática</span><span className="mock__tag">4 participantes</span></div>
        <div className="avatars" aria-hidden="true"><span>A</span><span>B</span><span>C</span><span>D</span></div>
        <div className="mock__timer" aria-hidden="true"><span>Sesión de enfoque</span><strong>25:00</strong></div>
        <svg className="mock__board" viewBox="0 0 300 88" aria-hidden="true" preserveAspectRatio="none"><path d="M14 60 C 50 10, 80 80, 120 36 S 190 70, 230 24" fill="none" stroke="#5B2FC4" strokeWidth="3" strokeLinecap="round" /><path d="M40 78 H 150" stroke="#1280EA" strokeWidth="3" strokeLinecap="round" /><circle cx="250" cy="58" r="16" fill="none" stroke="#0A2744" strokeWidth="3" /></svg>
        <div className="mock__tools" aria-hidden="true"><span><Mic size={16} /></span><span><Camera size={16} /></span><span><MonitorUp size={16} /></span><span><MessageSquare size={16} /></span></div>
      </div>
      <Caption title="Study Rooms" text="Estudia en espacios colaborativos con temporizador, pizarra y chat." />
    </figure>
  );
}

export function MockLibrary() {
  return (
    <figure className="mock">
      <div className="mock__window" role="img" aria-label="Ilustración de la biblioteca académica: búsqueda, categorías y una lista de archivos.">
        <div className="mock__bar" aria-hidden="true"><span><BookOpen size={16} style={{ verticalAlign: "-3px" }} /> Biblioteca</span></div>
        <div className="mock__search" aria-hidden="true"><Search size={16} />Buscar por materia o tema</div>
        <div className="chips" aria-hidden="true"><span className="on">Apuntes</span><span>Guías</span><span>Presentaciones</span><span>Ejercicios</span></div>
        <ul className="files" aria-hidden="true">
          <li><FileText size={18} />Resumen de la unidad<small>Apuntes</small></li>
          <li><FileText size={18} />Guía de ejercicios<small>Ejercicios</small></li>
          <li><FileText size={18} />Presentación de repaso<small>Presentaciones</small></li>
        </ul>
      </div>
      <Caption title="Biblioteca" text="Busca, guarda y comparte recursos académicos organizados." />
    </figure>
  );
}

export function MockAI() {
  return (
    <figure className="mock">
      <div className="mock__window" role="img" aria-label="Ilustración de NEXORA AI: el asistente responde con una pregunta guía y propone una ruta de estudio.">
        <div className="mock__bar" aria-hidden="true"><span><Sparkles size={16} style={{ verticalAlign: "-3px" }} /> NEXORA AI</span></div>
        <p className="bubble bubble--user" aria-hidden="true">No sé por dónde empezar con este problema.</p>
        <p className="bubble bubble--ai" aria-hidden="true">Vamos paso a paso: ¿qué datos te da el enunciado y qué te piden encontrar?</p>
        <ul className="route" aria-hidden="true"><li><CheckCircle2 size={16} />Identificar los datos</li><li><CheckCircle2 size={16} />Elegir un método</li><li><CheckCircle2 size={16} />Practicar con preguntas</li></ul>
      </div>
      <Caption title="NEXORA AI" text="Un asistente que guía con preguntas; no hace la tarea por ti." />
    </figure>
  );
}
