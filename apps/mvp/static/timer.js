/* Temporizador de estudio de NEXORA (MVP 0.3). JavaScript propio, sin dependencias.
   Corre en el navegador: el tiempo se mide con la hora del sistema (sobrevive a recargar la página) y al terminar
   se guarda la sesión con un POST real a /app/progreso/sesiones. El tiempo es AUTODECLARADO. */
(function () {
  "use strict";
  var root = document.getElementById("timer");
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var disp = $("[data-display]"), msg = $("[data-msg]"), startBtn = $("[data-start]"), pauseBtn = $("[data-pause]"), resetBtn = $("[data-reset]"), saveBtn = $("[data-save]"), customIn = $("[data-custom]"), goalSel = $("[data-goal]");
  var presets = root.querySelectorAll('input[name="preset"]');
  var KEY = "nexora_timer_v1";
  var st = load() || { state: "idle", totalMin: 25, remaining: 25 * 60000, endAt: 0, saved: false };

  function load() { try { var o = JSON.parse(localStorage.getItem(KEY)); return o && typeof o.totalMin === "number" ? o : null; } catch (e) { return null; } }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function clamp(n) { n = Math.floor(Number(n)); return isNaN(n) ? 25 : Math.max(1, Math.min(180, n)); }
  function fmt(ms) { var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60); return (m < 10 ? "0" : "") + m + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
  function say(t, bad) { msg.textContent = t; msg.className = "timer__msg" + (bad ? " timer__msg--bad" : ""); }
  function left() { return st.state === "running" ? st.endAt - Date.now() : st.remaining; }
  function elapsedMin() { return Math.floor((st.totalMin * 60000 - left()) / 60000); }

  function render() {
    var l = left();
    disp.textContent = fmt(l);
    document.title = st.state === "running" ? fmt(l) + " · NEXORA" : "Progreso · NEXORA";
    startBtn.hidden = st.state === "running";
    startBtn.textContent = st.state === "paused" ? "Reanudar" : "Iniciar";
    pauseBtn.hidden = st.state !== "running";
    saveBtn.hidden = !((st.state === "paused" || st.state === "running") && elapsedMin() >= 1) || st.saved;
    root.dataset.state = st.state;
    for (var i = 0; i < presets.length; i++) presets[i].disabled = st.state === "running" || st.state === "paused";
    customIn.disabled = st.state === "running" || st.state === "paused";
  }

  function post(minutes) {
    var body = "minutes=" + encodeURIComponent(minutes) + (goalSel && goalSel.value ? "&goal_id=" + encodeURIComponent(goalSel.value) : "");
    return fetch("/app/progreso/sesiones", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: body })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
  }
  function save(minutes, thenReset) {
    if (minutes < 1) return;
    say("Guardando tu sesión…");
    post(minutes).then(function (res) {
      if (res.ok) { st.saved = true; say("Sesión guardada: " + minutes + " min de estudio. Actualiza la página para ver tu progreso."); if (thenReset) reset(true); else { persist(); render(); } }
      else say(res.j && res.j.error ? res.j.error : "No se pudo guardar la sesión.", true);
    }).catch(function () { say("Sin conexión con el servidor. Pulsa “Guardar sesión” para reintentar.", true); st.state = "done"; saveBtn.hidden = false; persist(); render(); });
  }
  function finish() {
    st.state = "done"; st.remaining = 0; persist(); render();
    say("¡Terminaste! Guardando tu sesión de " + st.totalMin + " min…");
    save(st.totalMin, false);
  }
  function reset(keepMsg) {
    st.state = "idle"; st.saved = false; st.remaining = st.totalMin * 60000; st.endAt = 0; persist(); render();
    if (!keepMsg) say("");
  }
  function setPreset() {
    var v = root.querySelector('input[name="preset"]:checked').value;
    st.totalMin = v === "custom" ? clamp(customIn.value) : Number(v);
    if (v === "custom") customIn.value = st.totalMin;
    st.remaining = st.totalMin * 60000; persist(); render();
  }

  startBtn.addEventListener("click", function () { if (st.state === "idle" || st.state === "done") { st.saved = false; st.remaining = st.totalMin * 60000; } st.endAt = Date.now() + st.remaining; st.state = "running"; say("Temporizador en marcha."); persist(); render(); });
  pauseBtn.addEventListener("click", function () { st.remaining = Math.max(0, st.endAt - Date.now()); st.state = "paused"; say("En pausa."); persist(); render(); });
  resetBtn.addEventListener("click", function () { reset(false); });
  saveBtn.addEventListener("click", function () { save(st.state === "done" ? st.totalMin : Math.min(180, elapsedMin()), st.state !== "done"); });
  for (var i = 0; i < presets.length; i++) presets[i].addEventListener("change", setPreset);
  customIn.addEventListener("input", function () { root.querySelector('input[value="custom"]').checked = true; setPreset(); });

  // Estado inicial: reflejar el preset guardado
  var match = root.querySelector('input[name="preset"][value="' + st.totalMin + '"]');
  if (match) match.checked = true; else { root.querySelector('input[value="custom"]').checked = true; customIn.value = st.totalMin; }
  if (st.state === "running" && st.endAt <= Date.now()) { finish(); } else { render(); }
  setInterval(function () { if (st.state === "running") { if (st.endAt <= Date.now()) finish(); else render(); } }, 250);
})();
