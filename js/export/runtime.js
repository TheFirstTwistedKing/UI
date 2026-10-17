/* 인터랙션 모드 실행 코드. 내보낸 HTML 안에 그대로 들어가 동작한다 (편집기 모듈에 의존하지 않는다).
   cfg = {modes:[모드…], acts:[{s:요소 선택자, on:트리거, v:트리거 값, do:동작, t:대상 선택자, a:동작 값}], disp:{선택자:원래 display}}
   지원하지 않는 입력(음성 인식 등)은 화면에 표시한 뒤 글자 입력으로 대신한다. */
function uiRuntime(cfg){
  "use strict";
  const on = m => cfg.modes.indexOf(m) >= 0, $ = s => document.querySelector(s);
  const page = $(".page") || document.body, acts = cfg.acts.filter(x => $(x.s));
  const shown = el => getComputedStyle(el).display !== "none";
  const DO = {
    show(t){ const sel = cfg.sel.get(t); t.style.setProperty("display", cfg.disp[sel] || "block", "important"); t.animate([{opacity:0}, {opacity:1}], {duration:220, easing:"ease-out"}); },
    hide(t){ t.style.setProperty("display", "none", "important"); },
    toggle(t){ shown(t) ? DO.hide(t) : DO.show(t); },
    play(t){ t.getAnimations({subtree:true}).forEach(a => { a.cancel(); a.play(); }); },
    goto(t){ t.scrollIntoView({behavior:"smooth", block:"center"}); },
    link(t, a){ if(/^(https?:|mailto:|#)/.test(a)) a[0] === "#" ? (location.hash = a) : window.open(a, "_blank", "noopener"); },
    text(t, a){ const n = [...t.childNodes].find(c => c.nodeType === 3); n ? n.nodeValue = a : t.prepend(a); },
    say(t, a){ if("speechSynthesis" in window){ const u = new SpeechSynthesisUtterance(a); u.lang = "ko-KR"; speechSynthesis.cancel(); speechSynthesis.speak(u); } else note("이 브라우저는 음성 출력을 지원하지 않습니다: " + a); },
    morph(t){ t.animate([{borderRadius:getComputedStyle(t).borderRadius}, {borderRadius:"42% 58% 63% 37% / 41% 44% 56% 59%"}, {borderRadius:"58% 42% 38% 62% / 55% 38% 62% 45%"}, {borderRadius:getComputedStyle(t).borderRadius}], {duration:1400, easing:"ease-in-out"}); },
  };
  cfg.sel = new Map();
  Object.keys(cfg.disp).forEach(s => { const el = $(s); if(el) cfg.sel.set(el, s); });
  function run(x){ const t = x.t ? $(x.t) : $(x.s); if(t && DO[x.do]) DO[x.do](t, x.a || ""); }
  const fire = (trig, el, val) => acts.forEach(x => { if(x.on === trig && (!el || $(x.s) === el) && (val === undefined || match(x.v, val))) run(x); });
  const match = (want, got) => { want = String(want || "").trim().toLowerCase(); got = String(got || "").trim().toLowerCase(); return want && (got === want || got.indexOf(want) >= 0); };

  // 안내 막대: 시뮬레이션 중인 입력, 명령 결과 등을 보여 준다
  const bar = document.createElement("div");
  bar.className = "ui-bar"; bar.setAttribute("role", "status");
  const css = document.createElement("style");
  css.textContent = ".ui-bar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;width:min(560px,calc(100% - 24px));z-index:2147483000;font:13px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#eaf7ff;pointer-events:none}"
    + ".ui-bar>*{pointer-events:auto;background:rgba(9,15,28,.88);border:1px solid #263954;border-radius:8px;padding:7px 10px;backdrop-filter:blur(8px)}"
    + ".ui-bar input{width:100%;background:transparent;border:0;color:inherit;font:inherit;outline:none}"
    + ".ui-bar label{display:flex;gap:8px;align-items:center}.ui-bar b{color:#73e2ec;font-weight:500;white-space:nowrap}.ui-bar small{color:#94adc4}"
    + ".ui-bar button{background:#0111f3;color:#fff;border:0;border-radius:6px;padding:5px 10px;font:inherit;cursor:pointer}"
    + "[data-ui-focus]:focus-visible{outline:2px solid #73e2ec;outline-offset:3px}";
  document.head.appendChild(css);
  let noteEl = null, noteT = 0;
  function note(msg){
    if(!noteEl){ noteEl = document.createElement("div"); bar.appendChild(noteEl); }
    noteEl.textContent = msg; noteEl.hidden = false; clearTimeout(noteT); noteT = setTimeout(() => noteEl.hidden = true, 3500);
  }
  function inputRow(label, ph, hint, fn){
    const l = document.createElement("label");
    l.innerHTML = "<b></b><input type='text' autocomplete='off' spellcheck='false'>" + (hint ? "<small></small>" : "");
    l.querySelector("b").textContent = label; const inp = l.querySelector("input"); inp.placeholder = ph;
    if(hint) l.querySelector("small").textContent = hint;
    inp.addEventListener("keydown", e => { if(e.key === "Enter" && inp.value.trim()){ fn(inp.value.trim()); inp.value = ""; } });
    bar.appendChild(l); return inp;
  }

  // GUI: 누르기 · 마우스 올리기
  if(on("gui")){
    acts.forEach(x => { const el = $(x.s); if(x.on === "click") el.style.cursor = "pointer"; });
    page.addEventListener("click", e => acts.forEach(x => { if(x.on === "click" && e.target.closest(x.s)) run(x); }));
    acts.filter(x => x.on === "hover").forEach(x => $(x.s).addEventListener("pointerenter", () => run(x)));
  }
  // CLI: 명령줄에서 명령어를 입력하면 맞는 동작 실행. help는 명령 목록
  if(on("cli")){
    const cmds = acts.filter(x => x.on === "command");
    inputRow(">", "명령 입력 (help: 명령 목록)", "", v => {
      if(v.toLowerCase() === "help"){ note("명령: " + ([...new Set(cmds.map(x => x.v))].join(", ") || "없음")); return; }
      const hit = cmds.filter(x => x.v && v.toLowerCase() === String(x.v).toLowerCase());
      hit.length ? hit.forEach(run) : note("알 수 없는 명령: " + v);
    });
  }
  // TUI: 키보드만으로 조작. 동작이 있는 요소에 초점이 가고, 화살표로 이동, Enter/Space로 실행, 지정 키로 바로 실행
  if(on("tui")){
    const focusables = [...new Set(acts.filter(x => x.on === "click" || x.on === "key").map(x => $(x.s)))];
    focusables.forEach(el => { el.tabIndex = 0; el.setAttribute("data-ui-focus", ""); if(!el.getAttribute("role")) el.setAttribute("role", "button"); });
    document.addEventListener("keydown", e => {
      if(/INPUT|TEXTAREA/.test(e.target.tagName)) return;
      const i = focusables.indexOf(document.activeElement);
      if((e.key === "Enter" || e.key === " ") && i >= 0){ e.preventDefault(); acts.forEach(x => { if(x.on === "click" && $(x.s) === focusables[i]) run(x); }); return; }
      if(/^Arrow/.test(e.key) && focusables.length){ e.preventDefault(); const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1; focusables[(i + d + focusables.length) % focusables.length].focus(); return; }
      acts.forEach(x => { if(x.on === "key" && String(x.v).toLowerCase() === e.key.toLowerCase()) run(x); });
    });
  }
  // NUI: 밀기(스와이프) · 길게 누르기 · 두 번 누르기. 터치가 없으면 마우스로 같은 동작을 한다
  if(on("nui")){
    const els = [...new Set(acts.filter(x => /^swipe|^long|^double/.test(x.on)).map(x => $(x.s)))];
    els.forEach(el => {
      let sx = 0, sy = 0, st = 0, lp = 0, down = false;
      if(acts.some(x => x.on.startsWith("swipe") && $(x.s) === el)) el.style.touchAction = "none";
      el.addEventListener("pointerdown", e => { down = true; sx = e.clientX; sy = e.clientY; st = Date.now(); lp = setTimeout(() => { down = false; fire("longpress", el); }, 600); });
      el.addEventListener("pointermove", e => { if(down && Math.hypot(e.clientX - sx, e.clientY - sy) > 12) clearTimeout(lp); });
      el.addEventListener("pointerup", e => {
        clearTimeout(lp); if(!down) return; down = false;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if(Date.now() - st < 800 && Math.max(Math.abs(dx), Math.abs(dy)) > 50) fire(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "swipe-right" : "swipe-left") : (dy > 0 ? "swipe-down" : "swipe-up"), el);
      });
      el.addEventListener("pointercancel", () => { down = false; clearTimeout(lp); });
      el.addEventListener("dblclick", () => fire("doubletap", el));
    });
    if(!("ontouchstart" in window) && els.length) note("터치가 없는 환경입니다. 마우스로 끌기·길게 누르기·두 번 누르기를 대신 씁니다.");
  }
  // AUI: 음성 명령. 음성 인식이 없으면 글자 입력으로 대신한다 (시뮬레이션이라고 표시)
  if(on("aui")){
    const voice = acts.filter(x => x.on === "voice"), hear = t => { const hit = voice.filter(x => match(x.v, t)); hit.length ? hit.forEach(run) : note("인식한 말: " + t); };
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(SR){
      const box = document.createElement("label"), btn = document.createElement("button");
      box.innerHTML = "<b>음성</b><small>버튼을 누르고 말하세요</small>"; btn.type = "button"; btn.textContent = "듣기"; box.appendChild(btn); bar.appendChild(box);
      let rec = null;
      btn.onclick = () => {
        if(rec){ rec.stop(); return; }
        rec = new SR(); rec.lang = "ko-KR"; rec.interimResults = false;
        rec.onresult = e => hear(e.results[e.results.length - 1][0].transcript);
        rec.onerror = e => note("음성 인식 오류: " + e.error);
        rec.onend = () => { rec = null; btn.textContent = "듣기"; };
        rec.start(); btn.textContent = "멈춤";
      };
    } else inputRow("음성", "말할 내용을 글자로 입력", "시뮬레이션: 이 브라우저는 음성 인식을 지원하지 않습니다", hear);
  }
  // OUI: 포인터가 가까이 오거나 멀어지면 반응하는 유기적 인터페이스
  if(on("oui")){
    const near = acts.filter(x => x.on === "near" || x.on === "far"), inside = new Map();
    if(near.length) document.addEventListener("pointermove", e => near.forEach(x => {
      const el = $(x.s), r = el.getBoundingClientRect(), R = +x.v || 120;
      const d = Math.hypot(Math.max(r.left - e.clientX, 0, e.clientX - r.right), Math.max(r.top - e.clientY, 0, e.clientY - r.bottom));
      const was = inside.get(x), now = d <= R; inside.set(x, now);
      if(now !== !!was && ((now && x.on === "near") || (!now && was && x.on === "far"))) run(x);
    }), {passive:true});
  }
  if(bar.childNodes.length || on("cli") || on("aui") || on("nui")) document.body.appendChild(bar);
  window.uiRuntime = {run:(trig, sel, val) => fire(trig, sel ? $(sel) : null, val)};
}
export const RUNTIME_SRC = uiRuntime.toString();
