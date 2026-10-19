import { computeMatch } from "../../../packages/match-engine/src/index.ts";

const grouped = (rows, key, val) => { const m = new Map(); for (const r of rows) { if (!m.has(r[key])) m.set(r[key], []); m.get(r[key]).push(val(r)); } return m; };
const json = (s) => { try { return JSON.parse(s); } catch { return []; } };

export function matchProfile(subjects, slots, profile) {
  return {
    subjectsEnrolled: subjects.filter((s) => s.relation === "ENROLLED").map((s) => s.id),
    subjectsStruggling: subjects.filter((s) => s.relation === "STRUGGLING").map((s) => s.id),
    slots, interests: profile.interests ?? [], studyStyles: profile.study_styles ?? [], skills: null, modality: profile.modality ?? null,
  };
}

/** Smart Match con datos reales de la base: sólo compara dentro de la misma universidad y del mismo "mundo" (demo con demo, real con real). */
export function getMatches(S, bundle, limit = 30) {
  const me = matchProfile(bundle.subjects, bundle.slots, bundle.profile);
  const blocked = S.blockedIds(bundle.user.id); // nunca se sugiere a quien bloqueaste o te bloqueó
  const cands = S.candidates(bundle.user.id, bundle.student.university_id, !!bundle.user.is_demo).filter((c) => !blocked.has(c.id));
  const ids = cands.map((c) => c.id);
  const subs = grouped(S.subjectsOf(ids), "user_id", (r) => ({ id: r.subject_id, relation: r.relation }));
  const slots = grouped(S.slotsOf(ids), "user_id", (r) => r.slot);
  const out = [];
  for (const c of cands) {
    const prof = matchProfile(subs.get(c.id) ?? [], slots.get(c.id) ?? [], { interests: json(c.interests), study_styles: json(c.study_styles), modality: c.modality });
    const r = computeMatch(me, prof);
    if (r.score > 0) out.push({ ...r, id: c.id, first: c.first_name, last: c.last_name, career: c.career, cycle: c.cycle, modality: c.modality, isDemo: !!c.is_demo });
  }
  return out.sort((a, b) => b.score - a.score || a.first.localeCompare(b.first)).slice(0, limit);
}
