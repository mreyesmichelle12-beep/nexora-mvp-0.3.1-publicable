/**
 * Smart Match (MVP 0.1): algoritmo de compatibilidad ponderado. NO es inteligencia artificial.
 *
 * Pesos definidos por el proyecto: materias 35 · horarios 25 · intereses 15 · preferencias 10 · habilidades 10 · modalidad 5.
 * Un factor sólo se evalúa si AMBAS personas aportaron ese dato; los factores no evaluables se excluyen y el puntaje se
 * normaliza sobre los pesos evaluados (se informa cuánto del peso total se pudo evaluar). Habilidades aún no existen en el MVP.
 * Regla de evidencia: sin al menos una materia en común o un bloque horario en común, el puntaje es 0.
 */
export const ALGORITHM_VERSION = "mvp-0.1";
export const WEIGHTS = { subjects: 35, schedule: 25, interests: 15, studyStyles: 10, skills: 10, modality: 5 } as const;
export type FactorKey = keyof typeof WEIGHTS;
export type Modality = "ONLINE" | "IN_PERSON" | "HYBRID";

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
export const DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
export const SLOT_STARTS = [7, 9, 11, 13, 15, 17, 19] as const; // bloques de 2 horas
/** Clave de bloque: `${día 0-6}-${hora de inicio}` */
export const slotKey = (day: number, start: number) => `${day}-${start}`;
export function isValidSlot(k: string): boolean {
  const m = /^([0-6])-(\d{1,2})$/.exec(k);
  return !!m && (SLOT_STARTS as readonly number[]).includes(Number(m[2]));
}
export function slotLabel(k: string): string {
  const [d, s] = k.split("-").map(Number) as [number, number];
  return `${DAYS_SHORT[d]} ${s}:00–${s + 2}:00`;
}
export const sortSlots = (a: string, b: string) => { const [da, sa] = a.split("-").map(Number) as [number, number]; const [db, sb] = b.split("-").map(Number) as [number, number]; return da - db || sa - sb; };

export interface MatchProfile {
  subjectsEnrolled: string[];
  subjectsStruggling: string[];
  slots: string[];
  interests: string[];
  studyStyles: string[];
  skills?: string[] | null;
  modality: Modality | null;
}
export interface FactorResult { key: FactorKey; weight: number; ratio: number | null }
export interface MatchResult {
  score: number;
  evaluatedWeight: number;
  breakdown: FactorResult[];
  sharedSubjects: string[];
  /** Materias compartidas donde TÚ te dificultas y la otra persona no: puede apoyarte. */
  canHelpYou: string[];
  /** Materias compartidas donde la otra persona se dificulta y tú no: puedes apoyarla. */
  youCanHelp: string[];
  sharedSlots: string[];
}

const norm = (xs: string[]) => [...new Set(xs.map((x) => x.trim().toLowerCase()).filter(Boolean))];
const inter = (a: Iterable<string>, b: Set<string>) => [...a].filter((x) => b.has(x));

function modalityRatio(a: Modality | null, b: Modality | null): number | null {
  if (!a || !b) return null;
  if (a === b) return 1;
  if (a === "HYBRID" || b === "HYBRID") return 0.5;
  return 0;
}

export function computeMatch(me: MatchProfile, other: MatchProfile): MatchResult {
  const sA = new Set([...me.subjectsEnrolled, ...me.subjectsStruggling]);
  const sB = new Set([...other.subjectsEnrolled, ...other.subjectsStruggling]);
  const sharedSubjects = inter(sA, sB);
  const slotsA = new Set(me.slots), slotsB = new Set(other.slots);
  const sharedSlots = inter(slotsA, slotsB).sort(sortSlots);

  const myStruggle = new Set(me.subjectsStruggling), otherStruggle = new Set(other.subjectsStruggling);
  const canHelpYou = sharedSubjects.filter((s) => myStruggle.has(s) && !otherStruggle.has(s));
  const youCanHelp = sharedSubjects.filter((s) => otherStruggle.has(s) && !myStruggle.has(s));

  const jaccard = (x: string[], y: string[]): number | null => {
    const a = new Set(norm(x)), b = new Set(norm(y));
    if (!a.size || !b.size) return null;
    return inter(a, b).length / new Set([...a, ...b]).size;
  };

  const ratios: Record<FactorKey, number | null> = {
    subjects: sA.size && sB.size ? sharedSubjects.length / Math.min(sA.size, sB.size) : null,
    schedule: slotsA.size && slotsB.size ? sharedSlots.length / Math.min(slotsA.size, slotsB.size) : null,
    interests: jaccard(me.interests, other.interests),
    studyStyles: jaccard(me.studyStyles, other.studyStyles),
    skills: me.skills && other.skills ? jaccard(me.skills, other.skills) : null,
    modality: modalityRatio(me.modality, other.modality),
  };

  const breakdown: FactorResult[] = (Object.keys(WEIGHTS) as FactorKey[]).map((key) => ({ key, weight: WEIGHTS[key], ratio: ratios[key] }));
  const evaluated = breakdown.filter((f) => f.ratio !== null);
  const evaluatedWeight = evaluated.reduce((s, f) => s + f.weight, 0);
  const hasEvidence = sharedSubjects.length > 0 || sharedSlots.length > 0;
  const score = hasEvidence && evaluatedWeight > 0 ? Math.round((100 * evaluated.reduce((s, f) => s + f.weight * (f.ratio as number), 0)) / evaluatedWeight) : 0;

  return { score, evaluatedWeight, breakdown, sharedSubjects, canHelpYou, youCanHelp, sharedSlots };
}
