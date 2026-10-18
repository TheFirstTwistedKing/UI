/* 진입점: 모듈 초기화 · 단축키 · 시작 상태 */
import { DEVICES, state, geo, store, validProject, blankProject, renderAll, select, undo, redo, savePrefs } from "./core/state.js";
import { initCanvas, nudge, zoomTo } from "./editor/canvas.js";
import { group, ungroup, copy, cut, paste } from "./editor/edit.js";
import { initTree, showTree, duplicate, removeSel } from "./editor/tree.js";
import { initImages, pasteImages } from "./editor/images.js";
import { initProps } from "./editor/props.js";
import { initToolbar, closeModals, modalOpen } from "./editor/toolbar.js";
import { mountIcons } from "./editor/icons.js";
import { initTimeline } from "./editor/timeline.js";
import { initMotion } from "./editor/motion.js";
import { initShapes } from "./editor/shapes-panel.js";
import { initComponents } from "./editor/components-panel.js";
import { initFind } from "./editor/find-panel.js";
import { attach, refreshPreview, bindElements, toggle as togglePlay, stop as stopPlay } from "./fx/engine.js";
import { elementFor } from "./editor/canvas.js";
import { view } from "./core/state.js";

/* ---------- 패널 셸: 왼쪽 탭, 타임라인, 패널 접기·크기 조절 ---------- */
const UI_KEY = "uiforge.web.ui";
let ui = {view:"layers", timeline:true, lcol:false, rcol:false, lw:0, rw:0, tlh:0};
try{ Object.assign(ui, JSON.parse(localStorage.getItem(UI_KEY)) || {}); }catch(e){}
const saveUI = () => { try{ localStorage.setItem(UI_KEY, JSON.stringify(ui)); }catch(e){} };
function showView(v){
  if(v !== ui.view) view.leaveMotion();
  ui.view = v;
  document.querySelectorAll(".rail [data-view]").forEach(b => b.setAttribute("aria-selected", b.dataset.view === v));
  document.querySelectorAll(".lpanel .view").forEach(s => s.hidden = s.dataset.view !== v);
  if(v === "layers") showTree();
}
function setTimeline(open){
  ui.timeline = open;
  document.getElementById("timeline").classList.toggle("collapsed", !open);
  document.getElementById("tlToggle").setAttribute("aria-expanded", open);
}
// 접기와 크기 조절은 데스크톱 배치에서만 쓴다 (좁은 화면은 패널을 세로로 쌓는다)
const DESK = matchMedia("(min-width:901px)");
const app = () => document.querySelector(".app");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function setPane(key, on){
  ui[key] = on;
  app().classList.toggle(key, on);
  document.getElementById(key === "lcol" ? "paneLeft" : "paneRight").setAttribute("aria-pressed", !on);
}
function applySizes(){
  if(ui.lw) app().style.setProperty("--lw", ui.lw + "px");
  if(ui.rw) app().style.setProperty("--rw", ui.rw + "px");
  if(ui.tlh) document.getElementById("tlTrack").style.setProperty("--tlh", ui.tlh + "px");
}
function initResizers(){
  document.querySelectorAll(".rsz").forEach(h => {
    const k = h.dataset.rsz;
    h.addEventListener("pointerdown", e => {
      if(e.button !== 0) return;
      e.preventDefault(); h.setPointerCapture(e.pointerId);
      const r = app().getBoundingClientRect(), tr = document.getElementById("tlTrack").getBoundingClientRect();
      app().classList.add("resizing", k === "time" ? "rr" : "cr"); h.classList.add("on");
      const move = ev => {
        if(k === "left") ui.lw = clamp(Math.round(ev.clientX - r.left), 200, 520);
        else if(k === "right") ui.rw = clamp(Math.round(r.right - ev.clientX), 240, 560);
        else ui.tlh = clamp(Math.round(ev.clientY - tr.top), 60, Math.round(innerHeight * .5));
        applySizes();
      };
      const up = () => { h.removeEventListener("pointermove", move); app().classList.remove("resizing", "rr", "cr"); h.classList.remove("on"); saveUI(); };
      h.addEventListener("pointermove", move);
      h.addEventListener("pointerup", up, {once:true}); h.addEventListener("pointercancel", up, {once:true});
    });
    h.addEventListener("dblclick", () => { if(k === "time") setTimeline(false); else setPane(k === "left" ? "lcol" : "rcol", true); saveUI(); });
  });
}
function initShell(){
  mountIcons();
  if(!document.querySelector(`.rail [data-view="${ui.view}"]`)) ui.view = "layers";
  showView(ui.view); setTimeline(ui.timeline);
  setPane("lcol", !!ui.lcol); setPane("rcol", !!ui.rcol); applySizes(); initResizers();
  // 탭을 누르면 그 탭을 연다. 이미 열린 탭을 다시 누르면 왼쪽 패널을 접거나 편다.
  document.querySelector(".rail").addEventListener("click", e => {
    const b = e.target.closest("[data-view]"); if(!b) return;
    if(b.dataset.view !== ui.view){ showView(b.dataset.view); if(ui.lcol) setPane("lcol", false); }
    else if(DESK.matches) setPane("lcol", !ui.lcol);
    saveUI();
  });
  document.getElementById("paneLeft").onclick = () => { setPane("lcol", !ui.lcol); saveUI(); };
  document.getElementById("paneRight").onclick = () => { setPane("rcol", !ui.rcol); saveUI(); };
  document.getElementById("tlToggle").onclick = () => { setTimeline(!ui.timeline); saveUI(); };
  // 타임라인 높이가 바뀌면 아트보드 맞춤 배율도 다시 계산된다 (canvas의 ResizeObserver)
}

let pasteT = 0;
window.addEventListener("paste", e => {
  const tg = e.target.tagName;
  if(tg === "INPUT" || tg === "TEXTAREA" || modalOpen()) return;
  clearTimeout(pasteT);
  if(!pasteImages(e)){ e.preventDefault(); paste(); }
});
window.addEventListener("keydown", e => {
  if(e.key === "Escape"){ if(!modalOpen()){ view.leaveMotion(); select(null); } closeModals(); return; }
  const tg = e.target.tagName;
  if(tg === "INPUT" || tg === "TEXTAREA" || tg === "SELECT") return;
  if(modalOpen()) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if(mod && k === "z"){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if(mod && k === "y"){ e.preventDefault(); redo(); return; }
  if(mod && k === "d"){ e.preventDefault(); duplicate(); return; }
  if(mod && k === "g"){ e.preventDefault(); e.shiftKey ? ungroup() : group(); return; }
  if(mod && k === "c"){ if(state.sel){ e.preventDefault(); copy(); } return; }
  if(mod && k === "x"){ if(state.sel){ e.preventDefault(); cut(); } return; }
  // 붙여넣기는 paste 이벤트에서 처리한다 (클립보드의 이미지를 읽으려면). 이벤트가 오지 않는 브라우저를 위해 잠시 뒤 요소 붙여넣기
  if(mod && k === "v"){ clearTimeout(pasteT); pasteT = setTimeout(paste, 80); return; }
  if(mod && (k === "=" || k === "+")){ e.preventDefault(); zoomTo(geo.scale * 1.25); return; }
  if(mod && k === "-"){ e.preventDefault(); zoomTo(geo.scale / 1.25); return; }
  if(mod && k === "0"){ e.preventDefault(); state.zoom = "fit"; savePrefs(); renderAll(); return; }
  if(mod && k === "a"){ e.preventDefault(); state.sels = state.project.nodes.map(n => n.id); state.sel = state.sels[state.sels.length-1] || null; renderAll(); return; }
  // 재생 제어: Enter 재생/일시정지, Shift+Enter 정지 (스페이스는 화면 이동에 쓴다)
  if(k === "enter" && !mod){ e.preventDefault(); e.shiftKey ? stopPlay() : togglePlay(); return; }
  if(k === "delete" || k === "backspace"){ if(state.sel){ e.preventDefault(); removeSel(); } return; }
  const dirs = {arrowleft:[-1,0], arrowright:[1,0], arrowup:[0,-1], arrowdown:[0,1]};
  if(dirs[k] && state.sel){ e.preventDefault(); const st = e.shiftKey ? 10 : 1; nudge(dirs[k][0]*st, dirs[k][1]*st); }
});

const prefs = store.prefs();
if(prefs){
  if(typeof prefs.snap === "boolean") state.snap = prefs.snap;
  if(DEVICES[prefs.device]) state.device = prefs.device;
  if(prefs.zoom === "fit" || (+prefs.zoom >= 0.1 && +prefs.zoom <= 4)) state.zoom = String(prefs.zoom);
}
// 첫 실행은 빈 캔버스. 이전에 작업하던 프로젝트가 있으면 이어서 연다.
state.project = validProject(store.current()) || blankProject();
bindElements(elementFor); view.anim = attach; view.preview = refreshPreview;
view.showView = v => { showView(v); if(ui.lcol) setPane("lcol", false); saveUI(); };
initShell(); initToolbar(); initCanvas(); initTree(); initImages(); initProps(); initTimeline(); initMotion(); initShapes(); initComponents(); initFind();
renderAll();
