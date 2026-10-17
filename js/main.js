/* 진입점: 모듈 초기화 · 단축키 · 시작 상태 */
import { DEVICES, state, geo, store, validProject, blankProject, renderAll, select, undo, redo, savePrefs } from "./core/state.js";
import { initCanvas, nudge, zoomTo } from "./editor/canvas.js";
import { group, ungroup, copy, cut, paste } from "./editor/edit.js";
import { initTree, duplicate, removeSel } from "./editor/tree.js";
import { initProps } from "./editor/props.js";
import { initToolbar, closeModals, modalOpen } from "./editor/toolbar.js";
import { mountIcons } from "./editor/icons.js";

/* ---------- 패널 셸: 왼쪽 탭, 하단 타임라인 ---------- */
const UI_KEY = "uiforge.web.ui";
let ui = {view:"layers", timeline:true};
try{ Object.assign(ui, JSON.parse(localStorage.getItem(UI_KEY)) || {}); }catch(e){}
const saveUI = () => { try{ localStorage.setItem(UI_KEY, JSON.stringify(ui)); }catch(e){} };
function showView(v){
  ui.view = v;
  document.querySelectorAll(".rail [data-view]").forEach(b => b.setAttribute("aria-selected", b.dataset.view === v));
  document.querySelectorAll(".lpanel .view").forEach(s => s.hidden = s.dataset.view !== v);
}
function setTimeline(open){
  ui.timeline = open;
  document.getElementById("timeline").classList.toggle("collapsed", !open);
  document.getElementById("tlToggle").setAttribute("aria-expanded", open);
}
function renderRuler(){
  // 0~5초 눈금. 1초마다 굵은 눈금과 숫자.
  let h = "";
  for(let i = 0; i <= 50; i++){ const x = i*2; h += `<i class="${i%10?"":"major"}" style="left:${x}%"></i>`; if(i%10 === 0 && i < 50) h += `<b style="left:${x}%">${i/10}s</b>`; }
  document.getElementById("ruler").innerHTML = h;
}
function initShell(){
  mountIcons();
  if(!document.querySelector(`.rail [data-view="${ui.view}"]`)) ui.view = "layers";
  showView(ui.view); setTimeline(ui.timeline); renderRuler();
  document.querySelector(".rail").addEventListener("click", e => { const b = e.target.closest("[data-view]"); if(b && b.dataset.view !== ui.view){ showView(b.dataset.view); saveUI(); } });
  document.getElementById("tlToggle").onclick = () => { setTimeline(!ui.timeline); saveUI(); };
  // 타임라인 높이가 바뀌면 아트보드 맞춤 배율도 다시 계산된다 (canvas의 ResizeObserver)
}

window.addEventListener("keydown", e => {
  if(e.key === "Escape"){ if(!modalOpen()) select(null); closeModals(); return; }
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
  if(mod && k === "v"){ e.preventDefault(); paste(); return; }
  if(mod && (k === "=" || k === "+")){ e.preventDefault(); zoomTo(geo.scale * 1.25); return; }
  if(mod && k === "-"){ e.preventDefault(); zoomTo(geo.scale / 1.25); return; }
  if(mod && k === "0"){ e.preventDefault(); state.zoom = "fit"; savePrefs(); renderAll(); return; }
  if(mod && k === "a"){ e.preventDefault(); state.sels = state.project.nodes.map(n => n.id); state.sel = state.sels[state.sels.length-1] || null; renderAll(); return; }
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
initShell(); initToolbar(); initCanvas(); initTree(); initProps();
renderAll();
