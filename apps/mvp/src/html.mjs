// Plantillas HTML con escape automático: todo valor interpolado se escapa salvo que sea HTML ya marcado con `html`/`raw`.
const MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => MAP[c]);
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);
const render = (v) => (v instanceof Raw ? v.s : Array.isArray(v) ? v.map(render).join("") : v == null || v === false ? "" : esc(v));
export function html(strings, ...vals) { let out = strings[0]; for (let i = 0; i < vals.length; i++) out += render(vals[i]) + strings[i + 1]; return new Raw(out); }
export const str = (r) => (r instanceof Raw ? r.s : esc(r));

/** Campo de formulario con el mismo marcado accesible del sitio (label asociado, ayuda y error enlazados). */
export function field({ id, name = id, label, type = "text", value = "", error, hint, required = false, attrs = {}, list, options }) {
  const hintId = hint && !error ? `${id}-hint` : null, errId = error ? `${id}-err` : null;
  const describedby = [hintId, errId].filter(Boolean).join(" ");
  const common = html`id="${id}" name="${name}" class="field__control" ${required ? raw("required") : ""} ${error ? raw('aria-invalid="true"') : ""} ${describedby ? raw(`aria-describedby="${describedby}"`) : ""}`;
  const extra = raw(Object.entries(attrs).map(([k, v]) => (v === true ? ` ${esc(k)}` : ` ${esc(k)}="${esc(v)}"`)).join(""));
  const control = options
    ? html`<select ${common}>${options.map((o) => html`<option value="${o.value}" ${String(o.value) === String(value) ? raw("selected") : ""}>${o.label}</option>`)}</select>`
    : type === "textarea" ? html`<textarea ${common}${extra}>${value}</textarea>`
    : html`<input type="${type}" value="${value}" ${list ? raw(`list="${esc(list)}"`) : ""} ${common}${extra}>`;
  return html`<div class="field"><label for="${id}" class="field__label">${label}<span class="field__opt">${required ? "(obligatorio)" : "(opcional)"}</span></label>${control}${hintId ? html`<p id="${hintId}" class="field__hint">${hint}</p>` : ""}${errId ? html`<p id="${errId}" class="field__error"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><span>${error}</span></p>` : ""}</div>`;
}
