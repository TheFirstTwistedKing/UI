/* 아트보드 렌더링 · 선택 오버레이 · 드래그 이동/크기 조절 */
import { TYPES, state, geo, view, $, esc, r3, get, rgba, baseTransform, kidsMap, descendants, isLocked, topSel, select, snapshot, pushHistory, autosave, renderAll } from "../core/state.js";
import { shapeMarkup } from "../shapes/shapes.js";
import { ornamentMarkup } from "../shapes/ornaments.js";
import { boxLook } from "../core/styles.js";

let elMap = {}, ovEl = null;

/* ---------- 레이아웃 계산 (px / % → 아트보드 픽셀) ---------- */
export const len = (v, u, dim) => u === "%" ? v/100*dim : v;
export function computeLayout(){
  const W = +state.device, H = state.project.page.height;
  geo.root = {x:0, y:0, w:W, h:H};
  geo.L = {}; geo.I = {};
  const km = kidsMap();
  (function walk(pid, pr){
    for(const n of km[pid]||[]){
      const p = n.props;
      const w = len(p.w, p.wu, pr.w), h = len(p.h, p.hu, pr.h);
      const r = {x:pr.x + len(p.x, p.xu, pr.w), y:pr.y + len(p.y, p.yu, pr.h), w, h};
      // 자식은 CSS처럼 테두리 안쪽(padding box)을 기준으로 배치된다
      const b = p.borderWidth > 0 ? p.borderWidth : 0;
      const inner = b ? {x:r.x + b, y:r.y + b, w:Math.max(0, w - 2*b), h:Math.max(0, h - 2*b)} : r;
      geo.L[n.id] = r; geo.I[n.id] = inner;
      walk(n.id, inner);
    }
  })("_", geo.root);
}
export const parentRect = n => n.parent ? geo.I[n.parent] : geo.root;

/* ---------- 렌더 ---------- */
export function renderCanvas(){
  computeLayout();
  const W = geo.root.w, H = geo.root.h;
  const stage = $("stage"), scr = $("screen"), shot = $("shot");
  if(state.zoom === "fit"){
    const cs = getComputedStyle(stage);
    const aw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    geo.scale = Math.max(0.05, Math.min(aw/W, ah/H));
  } else geo.scale = +state.zoom;
  shot.style.width = W*geo.scale + "px"; shot.style.height = H*geo.scale + "px";
  scr.style.width = W + "px"; scr.style.height = H + "px";
  scr.style.transform = `scale(${geo.scale})`;
  scr.style.background = state.project.page.bg;
  scr.innerHTML = "";
  const km = kidsMap();
  elMap = {};
  (function build(pid, parentEl, pr){
    for(const n of km[pid]||[]){
      const el = document.createElement("div");
      el.dataset.id = n.id; elMap[n.id] = el;
      paint(el, n, pr);
      parentEl.appendChild(el);
      build(n.id, el, geo.I[n.id]);
    }
  })("_", scr, geo.root);
  ovEl = document.createElement("div"); ovEl.className = "ov"; ovEl.innerHTML = overlayHTML();
  scr.appendChild(ovEl);
  view.anim();
}
export const elementFor = id => elMap[id] || null;
// 아트보드 배율만 다시 맞춘다 (요소는 그대로 두고 크기·선택 표시만 갱신)
function fitStage(){
  if(state.zoom !== "fit" || !geo.root.w) return;
  const stage = $("stage"), cs = getComputedStyle(stage), W = geo.root.w, H = geo.root.h;
  const aw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const ah = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const k = Math.max(0.05, Math.min(aw/W, ah/H));
  if(Math.abs(k - geo.scale) < 1e-4) return;
  geo.scale = k;
  $("shot").style.width = W*k + "px"; $("shot").style.height = H*k + "px";
  $("screen").style.transform = `scale(${k})`;
  if(ovEl) ovEl.innerHTML = overlayHTML();
}

// 지정한 요소와 그 자손만 다시 칠한다 (드래그·속성 입력 중 전체 DOM 재생성 방지)
export function refreshNodes(ids){
  computeLayout();
  const all = new Set();
  for(const id of ids){ all.add(id); descendants(id).forEach(d => all.add(d)); }
  for(const id of all){ const n = get(id), el = elMap[id]; if(!n || !el){ renderCanvas(); return; } paint(el, n, parentRect(n)); }
  if(ovEl) ovEl.innerHTML = overlayHTML();
  view.anim();
}

// 변형(회전·배율)과 섞기 모드: 모든 유형에 공통
function common(s, p){
  const bt = baseTransform(p); if(bt) s.transform = bt;
  if(p.blend && p.blend !== "normal") s.mixBlendMode = p.blend;
}
export const textGlow = p => `0 0 ${p.glowBlur}px ${rgba(p.glowColor, p.glowAlpha)}`;
function paint(d, n, pr){
  const p = n.props, t = TYPES[n.type], r = geo.L[n.id];
  d.className = "el" + (p.visible ? "" : " hid") + (p.locked ? " lock" : "");
  for(const ch of [...d.children]) if(!ch.classList.contains("el")) ch.remove();
  d.style.cssText = "";
  const s = d.style;
  s.left = (r.x - pr.x) + "px"; s.top = (r.y - pr.y) + "px";
  s.width = Math.max(0,r.w) + "px"; s.height = Math.max(0,r.h) + "px";
  if(t.shape || t.deco){
    // 도형·장식은 SVG가 채우기·선·그림자를 맡고, 상자 자체는 투명하게 둔다
    d.insertAdjacentHTML("afterbegin", t.shape ? shapeMarkup(p) : ornamentMarkup(p));
    if(p.opacity < 1) s.opacity = p.opacity;
    common(s, p);
    if(p.clip) s.overflow = "hidden";
    return;
  }
  // 채우기·모서리·테두리·그림자는 디자인 스타일 키트까지 합쳐서 계산한다 (내보내기와 같은 함수)
  for(const [k, v] of Object.entries(boxLook(n))) s.setProperty(k, v);
  if(p.opacity < 1) s.opacity = p.opacity;
  common(s, p);
  if(t.text && p.glowOn) s.textShadow = textGlow(p);
  if(p.clip) s.overflow = "hidden";
  if(t.text){
    const x = document.createElement("div"); x.className = "tx";
    x.textContent = p.text;
    const ts = x.style;
    ts.fontFamily = `${p.font}, "IBM Plex Sans KR", sans-serif`; ts.fontWeight = p.fontWeight;
    ts.fontSize = p.fontSize + "px"; ts.lineHeight = p.lineHeight; ts.letterSpacing = p.letterSpacing + "px";
    ts.color = p.color; ts.textAlign = p.align;
    ts.justifyContent = {top:"flex-start", center:"center", bottom:"flex-end"}[p.valign];
    d.prepend(x);
  }
  if(t.image){
    if(p.src){ const im = document.createElement("img"); im.className = "img"; im.alt = ""; im.draggable = false; im.src = p.src; im.style.objectFit = p.fit; d.prepend(im); }
    else { const ph = document.createElement("div"); ph.className = "imgph"; ph.textContent = "이미지 · 파일을 끌어 놓기"; ph.style.fontSize = Math.max(10, 11/geo.scale) + "px"; d.prepend(ph); }
  }
}

const boxStyle = (r, rot) => `left:${r.x}px;top:${r.y}px;width:${Math.max(0,r.w)}px;height:${Math.max(0,r.h)}px${rot?`;transform:rotate(${rot}deg)`:""}`;
// 배율을 적용한 화면상 상자 (가운데 기준으로 커지고 줄어든다)
const visBox = (r, p) => { const sx = Math.abs(p.scaleX ?? 1), sy = Math.abs(p.scaleY ?? 1); return {x:r.x + r.w*(1-sx)/2, y:r.y + r.h*(1-sy)/2, w:r.w*sx, h:r.h*sy}; };
function overlayHTML(){
  const n = get(state.sel); if(!n) return "";
  const p = n.props, r = visBox(geo.L[n.id], p), pr = parentRect(n);
  const k = 1/geo.scale, hs = 9*k, multi = state.sels.length > 1;
  let h = multi || !n.parent ? "" : `<div class="pbox" style="left:${pr.x}px;top:${pr.y}px;width:${pr.w}px;height:${pr.h}px;border-width:${k}px"></div>`;
  for(const id of state.sels){
    const o = get(id); if(!o || id === n.id) continue;
    h += `<div class="selbox sub" style="${boxStyle(visBox(geo.L[id], o.props), o.props.rotation)};border-width:${1.5*k}px"></div>`;
  }
  h += `<div class="selbox" style="${boxStyle(r, p.rotation)};border-width:${1.5*k}px"></div>`;
  if(!multi && !isLocked(n)){
    // 핸들은 요소와 같이 회전하는 래퍼 안에 둔다
    const pts = {nw:[0,0],n:[.5,0],ne:[1,0],e:[1,.5],se:[1,1],s:[.5,1],sw:[0,1],w:[0,.5]};
    const cur = ["ns","nesw","ew","nwse"], ang = {n:0,ne:1,e:2,se:3,s:0,sw:1,w:2,nw:3};
    const rs = Math.round(((p.rotation % 180) + 180) % 180 / 45);
    h += `<div class="hwrap" style="${boxStyle(r, p.rotation)}">`;
    for(const key in pts){
      const [fx,fy] = pts[key];
      h += `<div class="hd" data-h="${key}" style="left:${fx*r.w-hs/2}px;top:${fy*r.h-hs/2}px;width:${hs}px;height:${hs}px;border-width:${k}px;cursor:${cur[(ang[key]+rs)%4]}-resize"></div>`;
    }
    h += `</div>`;
  }
  const label = multi ? `${state.sels.length}개 선택` : `${esc(p.name)} · ${Math.round(r.w)}×${Math.round(r.h)}${isLocked(n) ? " · 잠김" : ""}`;
  h += `<div class="tag" style="left:${r.x}px;top:${r.y - 20*k}px;font-size:${11*k}px">${label}</div>`;
  return h;
}

/* ---------- 드래그 / 크기 조절 ---------- */
// 픽셀 이동량 d를 단위(px/%)에 맞춰 값 v에 더한다. 스냅은 px 4단위, % 0.5단위.
export function shiftVal(v, u, d, dim){
  if(u === "%"){ const nv = v + d/(dim||1)*100; return state.snap ? Math.round(nv*2)/2 : r3(nv); }
  const nv = v + d; return state.snap ? Math.round(nv/4)*4 : Math.round(nv);
}
const minSize = (v, u, dim) => Math.max(u === "%" ? 100/(dim||1) : 1, v);
function dragSession(e, onMove, nodes){
  nodes = nodes.filter(n => n && !isLocked(n)); if(!nodes.length) return;
  e.preventDefault();
  const before = snapshot(), sx = e.clientX, sy = e.clientY;
  const items = nodes.map(n => ({n, P0:{...n.props}, pr:parentRect(n)}));
  let moved = false;
  const mv = ev => {
    const dx = (ev.clientX - sx)/geo.scale, dy = (ev.clientY - sy)/geo.scale;
    if(!moved && Math.hypot(ev.clientX-sx, ev.clientY-sy) < 3) return;
    moved = true;
    for(const it of items) onMove(it.n.props, dx, dy, it.P0, it.pr);
    refreshNodes(items.map(it => it.n.id)); view.status();
  };
  const up = () => {
    window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    if(moved){ pushHistory(before); view.props(); autosave(); }
  };
  window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
}
function moveFn(p, dx, dy, P0, pr){
  if(dx) p.x = shiftVal(P0.x, p.xu, dx, pr.w);
  if(dy) p.y = shiftVal(P0.y, p.yu, dy, pr.h);
}
function resizeFn(hd){
  return (p, dx, dy, P0, pr) => {
    // 화면 이동량을 요소의 회전 좌표계로 바꾼 뒤, 반대편 변이 화면에서 고정되도록 중심 이동량을 다시 화면 좌표로 돌린다
    const t = (p.rotation||0) * Math.PI/180, cos = Math.cos(t), sin = Math.sin(t);
    const lx = dx*cos + dy*sin, ly = -dx*sin + dy*cos;
    const ex = hd.includes("e") ? 1 : hd.includes("w") ? -1 : 0, ey = hd.includes("s") ? 1 : hd.includes("n") ? -1 : 0;
    const dw = ex*lx, dh = ey*ly, cx = ex*dw/2, cy = ey*dh/2;
    const mx = cx*cos - cy*sin - dw/2, my = cx*sin + cy*cos - dh/2;
    if(dw) p.w = minSize(shiftVal(P0.w, p.wu, dw, pr.w), p.wu, pr.w);
    if(dh) p.h = minSize(shiftVal(P0.h, p.hu, dh, pr.h), p.hu, pr.h);
    p.x = shiftVal(P0.x, p.xu, mx, pr.w); p.y = shiftVal(P0.y, p.yu, my, pr.h);
  };
}
// 픽셀 이동량을 요소의 단위에 맞춰 정확히 더한다 (스냅 없음)
export function moveBy(n, dx, dy){
  const p = n.props, pr = parentRect(n);
  if(dx) p.x = p.xu === "%" ? r3(p.x + dx/pr.w*100) : r3(p.x + dx);
  if(dy) p.y = p.yu === "%" ? r3(p.y + dy/pr.h*100) : r3(p.y + dy);
}
export function nudge(dx, dy){
  const movers = topSel().filter(n => !isLocked(n)); if(!movers.length) return;
  const b = snapshot();
  computeLayout();
  movers.forEach(n => moveBy(n, dx, dy));
  pushHistory(b); renderAll(); autosave();
}

/* ---------- 확대 · 화면 이동 ---------- */
// 배율을 바꾸되 (cx, cy) 화면 지점 아래의 아트보드 위치가 그대로 있도록 스크롤을 맞춘다
export function zoomTo(z, cx, cy){
  const stage = $("stage"), scr = $("screen");
  z = Math.max(0.1, Math.min(4, z));
  const sr = stage.getBoundingClientRect();
  if(cx === undefined){ cx = sr.left + sr.width/2; cy = sr.top + sr.height/2; }
  const r0 = scr.getBoundingClientRect(), ax = (cx - r0.left)/geo.scale, ay = (cy - r0.top)/geo.scale;
  state.zoom = String(Math.round(z*100)/100);
  renderCanvas();
  const r1 = scr.getBoundingClientRect();
  stage.scrollLeft += r1.left + ax*geo.scale - cx;
  stage.scrollTop += r1.top + ay*geo.scale - cy;
  view.toolbar(); view.status();
}
let spaceHeld = false;
function initPan(){
  const stage = $("stage");
  window.addEventListener("keydown", e => { if(e.code === "Space" && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){ if(!spaceHeld){ spaceHeld = true; stage.classList.add("pan"); } e.preventDefault(); } });
  window.addEventListener("keyup", e => { if(e.code === "Space"){ spaceHeld = false; stage.classList.remove("pan"); } });
  // 스페이스+드래그 또는 가운데 버튼 드래그로 화면 이동
  stage.addEventListener("pointerdown", e => {
    if(!(e.button === 1 || (e.button === 0 && spaceHeld))) return;
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, l0 = stage.scrollLeft, t0 = stage.scrollTop;
    stage.classList.add("panning");
    const mv = ev => { stage.scrollLeft = l0 - (ev.clientX - sx); stage.scrollTop = t0 - (ev.clientY - sy); };
    const up = () => { stage.classList.remove("panning"); window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
  }, true);
  // Ctrl/⌘ + 휠(또는 트랙패드 핀치)로 커서 기준 확대
  stage.addEventListener("wheel", e => {
    if(!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    zoomTo(geo.scale * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  }, {passive:false});
}

export function initCanvas(){
  view.canvas = renderCanvas;
  view.overlay = () => { if(ovEl) ovEl.innerHTML = overlayHTML(); };
  $("screen").addEventListener("pointerdown", e => {
    if(e.button !== 0) return;
    const hd = e.target.closest("[data-h]");
    if(hd){ dragSession(e, resizeFn(hd.dataset.h), [get(state.sel)]); return; }
    const g = e.target.closest(".el");
    const add = e.shiftKey || e.ctrlKey || e.metaKey || state.multiTap;
    if(!g){ if(!add) select(null); return; }
    const id = g.dataset.id;
    if(add){ select(id, true); if(!state.sels.includes(id)) return; }
    else if(!state.sels.includes(id)) select(id);
    else if(state.sel !== id){ state.sel = id; renderAll(); }
    dragSession(e, moveFn, topSel());
  });
  $("stage").addEventListener("pointerdown", e => { if(e.target === $("stage") && e.button === 0) select(null); });
  initPan();
  // 패널 크기를 끄는 동안에는 배율만 바꾸고, 멈춘 뒤 한 번 다시 그린다 (매 프레임 전체 재생성 방지)
  let raf = 0, idle = 0;
  new ResizeObserver(() => {
    if(!raf) raf = requestAnimationFrame(() => { raf = 0; fitStage(); view.status(); });
    clearTimeout(idle); idle = setTimeout(renderCanvas, 180);
  }).observe($("stage"));
  if(document.fonts) document.fonts.ready.then(() => renderCanvas());
}
