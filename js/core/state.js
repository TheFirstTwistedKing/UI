/* 문서 모델 · 선택 · 히스토리 · 저장. 화면 그리기는 view에 등록된 함수가 맡는다. */

export const TYPES = {
  rect:   {label:"사각형", abbr:"Rc", container:true},
  ellipse:{label:"원",     abbr:"El"},
  shape:  {label:"도형",   abbr:"Sh", shape:true},
  deco:   {label:"장식",   abbr:"Dc", deco:true},
  text:   {label:"텍스트", abbr:"Tx", text:true},
  image:  {label:"이미지", abbr:"Im", image:true},
  group:  {label:"그룹",   abbr:"Gr", container:true}
};
export const FONTS = ['"IBM Plex Sans KR"', '"Noto Sans KR"', "Montserrat", "Inter", '"JetBrains Mono"', "Orbitron", "Cinzel", '"Noto Serif KR"', "system-ui", "serif"];
export const DEVICES = {"1440":"데스크톱 1440", "1024":"태블릿 가로 1024", "768":"태블릿 768", "390":"모바일 390"};
const LS_CUR = "uiforge.web.current", LS_SLOTS = "uiforge.web.slots", LS_PREF = "uiforge.web.prefs";

/* ---------- 상태 ---------- */
let uid = 0;
export const newId = () => "n" + Date.now().toString(36) + (uid++).toString(36);
export const state = { project:null, sel:null, sels:[], snap:true, device:"1440", zoom:"fit", multiTap:false };
// 레이아웃 결과(아트보드 픽셀 좌표)와 화면 배율. canvas가 채운다.
export const geo = { L:{}, I:{}, root:{x:0,y:0,w:0,h:0}, scale:1 };
// 각 편집기 모듈이 자기 렌더 함수를 여기에 등록한다 (모듈 간 순환 의존 방지)
export const view = { canvas(){}, tree(){}, props(){}, status(){}, toolbar(){}, hint(){}, anim(){}, timeline(){}, clock(){}, showView(){}, leaveMotion(){} };
export function renderAll(){ view.toolbar(); view.canvas(); view.tree(); view.props(); view.status(); view.hint(); view.timeline(); }

export function makeProps(type){
  const t = TYPES[type];
  const p = {name:t.label, x:40, y:40, xu:"px", yu:"px", w:240, h:140, wu:"px", hu:"px",
    rotation:0, opacity:1, visible:true, locked:false,
    fill:"#1c1c1f", fillAlpha:1, radius:0,
    borderWidth:0, borderStyle:"solid", borderColor:"#e9d8a6",
    shadowOn:false, shadowX:0, shadowY:8, shadowBlur:24, shadowSpread:0, shadowColor:"#000000", shadowAlpha:0.5,
    clip:false, anims:[], fx:[]};
  if(type === "ellipse") Object.assign(p, {w:160, h:160});
  if(t.shape) Object.assign(p, {w:160, h:160, shape:"star5", fill:"#e9d8a6"});
  if(t.deco) Object.assign(p, {w:320, h:24, deco:"lineDiamond", fill:"#e9d8a6", lineWidth:1.5});
  if(type === "group") Object.assign(p, {w:400, h:280, fillAlpha:0});
  if(t.text) Object.assign(p, {w:320, h:60, fillAlpha:0, text:"텍스트", color:"#ffffff", font:FONTS[0], fontSize:24, fontWeight:500,
    lineHeight:1.3, letterSpacing:0, align:"left", valign:"top"});
  if(t.image) Object.assign(p, {w:320, h:200, src:"", fit:"cover"});
  return p;
}
export function node(type, parent, over){ const p = makeProps(type); Object.assign(p, over||{}); return {id:newId(), type, parent, props:p}; }
export const defaultPage = () => ({height:900, bg:"#0b0b0d"});
export function blankProject(){ return {name:"새 UI", page:defaultPage(), nodes:[]}; }
export function sampleProject(){
  const n = [], add = (type, parent, o) => { const x = node(type, parent, o); n.push(x); return x; };
  const card = add("rect", null, {name:"Hero", x:10, xu:"%", y:120, w:80, wu:"%", h:420, fill:"#111114", radius:20, borderWidth:1, borderColor:"#e9d8a6",
    shadowOn:true, shadowY:24, shadowBlur:60, shadowColor:"#000000", shadowAlpha:0.6});
  add("text", card.id, {name:"Eyebrow", x:56, y:64, w:400, h:24, text:"RASYANCUT · SYSTEM", color:"#e9d8a6", font:'"JetBrains Mono"', fontSize:14, letterSpacing:3});
  add("text", card.id, {name:"Title", x:56, y:104, w:80, wu:"%", h:140, text:"보이는 모든 것을\n직접 설계하세요", fontSize:52, fontWeight:700, lineHeight:1.2});
  const btn = add("rect", card.id, {name:"Button", x:56, y:300, w:180, h:52, fill:"#e9d8a6", radius:26});
  add("text", btn.id, {name:"Label", x:0, y:0, w:100, wu:"%", h:100, hu:"%", text:"시작하기", color:"#000000", fontSize:17, fontWeight:600, align:"center", valign:"center"});
  add("ellipse", card.id, {name:"Orb", x:72, xu:"%", y:90, w:220, h:220, fillAlpha:0, borderWidth:1, borderColor:"#e9d8a6", borderStyle:"dashed"});
  return {name:"예시 · 히어로 섹션", page:defaultPage(), nodes:n};
}

/* ---------- 저장소 (실패해도 동작) ---------- */
export function lsGet(k){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } }
export function lsSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
export const store = { lastSaved:null, slots:() => lsGet(LS_SLOTS) || {}, setSlots:s => lsSet(LS_SLOTS, s), prefs:() => lsGet(LS_PREF), current:() => lsGet(LS_CUR) };
export function autosave(){ if(lsSet(LS_CUR, state.project)) store.lastSaved = new Date(); view.status(); }
export function savePrefs(){ lsSet(LS_PREF, {snap:state.snap, device:state.device, zoom:state.zoom}); }

/* ---------- 유틸 ---------- */
export const $ = id => document.getElementById(id);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const r3 = v => Math.round(v*1000)/1000;
export const get = id => state.project.nodes.find(n => n.id === id) || null;
export function rgba(hex, a){ const h = hex.replace("#",""); const [r,g,b] = [0,2,4].map(i => parseInt(h.substr(i,2),16) || 0); return `rgba(${r},${g},${b},${Math.max(0,Math.min(1,a))})`; }
export function kidsMap(){ const m = {}; for(const n of state.project.nodes){ (m[n.parent||"_"] ||= []).push(n); } return m; }
export function descendants(id){ const km = kidsMap(), out = []; (function w(p){ for(const c of km[p]||[]){ out.push(c.id); w(c.id); } })(id); return out; }
export function isLocked(n){ for(let x = n; x; x = get(x.parent)) if(x.props.locked) return true; return false; }
// 선택된 것 중 조상이 함께 선택되지 않은 요소들 (이동·삭제·복제 대상)
export function topSel(){
  const set = new Set(state.sels);
  return state.sels.map(get).filter(n => { if(!n) return false; for(let p = get(n.parent); p; p = get(p.parent)) if(set.has(p.id)) return false; return true; });
}
export function pruneSel(){ state.sels = state.sels.filter(id => get(id)); if(!get(state.sel)) state.sel = state.sels[state.sels.length-1] || null; }
export function uniqueName(base){ const used = new Set(state.project.nodes.map(n => n.props.name)); if(!used.has(base)) return base; let i = 2; while(used.has(base+" "+i)) i++; return base+" "+i; }
export function toast(msg){ const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 1600); }

/* ---------- 선택 ---------- */
export function select(id, toggle){
  if(toggle && id){
    if(state.sels.includes(id)){ state.sels = state.sels.filter(x => x !== id); state.sel = state.sels[state.sels.length-1] || null; }
    else { state.sels.push(id); state.sel = id; }
  } else { state.sel = id; state.sels = id ? [id] : []; }
  view.canvas(); view.tree(); view.props(); view.status(); view.hint(); view.timeline();
}

/* ---------- 히스토리 ---------- */
let undoStack = [], redoStack = [];
export const history = { canUndo:() => undoStack.length > 0, canRedo:() => redoStack.length > 0 };
export const snapshot = () => JSON.stringify(state.project);
export function pushHistory(before){ if(before === snapshot()) return; undoStack.push(before); if(undoStack.length > 120) undoStack.shift(); redoStack = []; view.toolbar(); }
export function commit(fn){ const b = snapshot(); fn(); pushHistory(b); renderAll(); autosave(); }
export function undo(){ if(!undoStack.length) return; redoStack.push(snapshot()); state.project = JSON.parse(undoStack.pop()); pruneSel(); renderAll(); autosave(); }
export function redo(){ if(!redoStack.length) return; undoStack.push(snapshot()); state.project = JSON.parse(redoStack.pop()); pruneSel(); renderAll(); autosave(); }
export function openProject(p){ const b = snapshot(); state.project = p; state.sel = null; state.sels = []; pushHistory(b); renderAll(); autosave(); }

export function validProject(o){
  const p = o && o.project ? o.project : o;
  if(!p || !Array.isArray(p.nodes)) return null;
  for(const n of p.nodes){ if(!TYPES[n.type] || !n.props) return null; n.props = Object.assign(makeProps(n.type), n.props); }
  p.page = Object.assign(defaultPage(), p.page);
  p.name = p.name || "가져온 UI";
  return p;
}
