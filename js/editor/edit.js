/* 편집 명령: 그룹화 · 그룹 해제 · 복사/잘라내기/붙여넣기 · 정렬 · 간격 맞추기 */
import { TYPES, state, geo, get, newId, node, descendants, topSel, commit, uniqueName, toast, r3 } from "../core/state.js";
import { computeLayout, parentRect, moveBy } from "./canvas.js";

// 요소의 현재 화면 위치를 새 부모 기준 px 좌표로 고정한다 (회전은 그대로 둔다)
function pinPx(n, npr){
  const r = geo.L[n.id];
  Object.assign(n.props, {x:Math.round(r.x - npr.x), xu:"px", y:Math.round(r.y - npr.y), yu:"px", w:Math.round(r.w), wu:"px", h:Math.round(r.h), hu:"px"});
}
const bounds = rs => {
  const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y));
  return {x, y, w:Math.max(...rs.map(r => r.x + r.w)) - x, h:Math.max(...rs.map(r => r.y + r.h)) - y};
};

export function group(){
  const roots = topSel();
  if(!roots.length) return;
  const parent = roots[0].parent;
  if(roots.some(n => n.parent !== parent)){ toast("같은 부모 안의 요소만 묶을 수 있습니다"); return; }
  computeLayout();
  const pr = parentRect(roots[0]), b = bounds(roots.map(n => geo.L[n.id]));
  const g = node("group", parent, {name:uniqueName("그룹"), x:Math.round(b.x - pr.x), y:Math.round(b.y - pr.y), w:Math.round(b.w), h:Math.round(b.h)});
  commit(() => {
    const arr = state.project.nodes, at = Math.min(...roots.map(n => arr.indexOf(n)));
    const ordered = arr.filter(n => roots.includes(n));
    ordered.forEach(n => { pinPx(n, b); n.parent = g.id; arr.splice(arr.indexOf(n), 1); });
    arr.splice(at, 0, g, ...ordered);
    state.sel = g.id; state.sels = [g.id];
  });
}

export function ungroup(){
  const groups = topSel().filter(n => n.type === "group");
  if(!groups.length){ toast("그룹을 선택하세요"); return; }
  computeLayout();
  commit(() => {
    const arr = state.project.nodes, freed = [];
    for(const g of groups){
      const npr = parentRect(g);
      const kids = arr.filter(n => n.parent === g.id);
      kids.forEach(k => { pinPx(k, npr); k.parent = g.parent; arr.splice(arr.indexOf(k), 1); });
      arr.splice(arr.indexOf(g), 1, ...kids);
      freed.push(...kids.map(k => k.id));
    }
    state.sels = freed; state.sel = freed[freed.length-1] || null;
  });
}

/* ---------- 클립보드 (편집기 내부) ---------- */
let clip = null;
export function copy(){
  const roots = topSel(); if(!roots.length) return false;
  const ids = new Set(); roots.forEach(n => { ids.add(n.id); descendants(n.id).forEach(d => ids.add(d)); });
  clip = {roots:roots.map(n => n.id), nodes:JSON.parse(JSON.stringify(state.project.nodes.filter(n => ids.has(n.id))))};
  toast(`${roots.length}개 복사했습니다`);
  return true;
}
export function cut(){
  const roots = topSel(); if(!copy()) return;
  const kill = new Set(); roots.forEach(n => { kill.add(n.id); descendants(n.id).forEach(d => kill.add(d)); });
  commit(() => { state.project.nodes = state.project.nodes.filter(x => !kill.has(x.id)); state.sel = null; state.sels = []; });
}
export function paste(){
  if(!clip){ toast("복사한 요소가 없습니다"); return; }
  const sel = get(state.sel);
  const target = sel ? (TYPES[sel.type].container && !clip.roots.includes(sel.id) ? sel.id : sel.parent) : null;
  const map = {}; clip.nodes.forEach(n => map[n.id] = newId());
  const copies = clip.nodes.map(n => ({id:map[n.id], type:n.type, parent: clip.roots.includes(n.id) ? target : map[n.parent], props: JSON.parse(JSON.stringify(n.props))}));
  const newRoots = clip.roots.map(id => map[id]);
  copies.filter(c => newRoots.includes(c.id)).forEach(c => { if(c.props.xu === "px") c.props.x += 16; if(c.props.yu === "px") c.props.y += 16; });
  commit(() => { state.project.nodes.push(...copies); state.sels = newRoots; state.sel = newRoots[newRoots.length-1]; });
}

/* ---------- 정렬 · 간격 ---------- */
// 2개 이상: 선택 영역 기준 정렬. 1개: 부모 기준 정렬.
export function align(mode){
  const items = topSel(); if(!items.length) return;
  computeLayout();
  const rs = items.map(n => geo.L[n.id]);
  const b = items.length > 1 ? bounds(rs) : parentRect(items[0]);
  commit(() => items.forEach((n, i) => {
    const r = rs[i];
    const dx = mode === "left" ? b.x - r.x : mode === "hcenter" ? b.x + b.w/2 - (r.x + r.w/2) : mode === "right" ? b.x + b.w - (r.x + r.w) : 0;
    const dy = mode === "top" ? b.y - r.y : mode === "vcenter" ? b.y + b.h/2 - (r.y + r.h/2) : mode === "bottom" ? b.y + b.h - (r.y + r.h) : 0;
    moveBy(n, dx, dy);
  }));
}
// 3개 이상: 첫 요소와 마지막 요소 사이에서 간격을 같게 한다
export function distribute(axis){
  const items = topSel(); if(items.length < 3){ toast("3개 이상 선택하세요"); return; }
  computeLayout();
  const P = axis === "h" ? ["x","w"] : ["y","h"];
  const list = items.map(n => ({n, r:geo.L[n.id]})).sort((a,b) => a.r[P[0]] - b.r[P[0]]);
  const first = list[0].r, last = list[list.length-1].r;
  const total = last[P[0]] + last[P[1]] - first[P[0]], used = list.reduce((s, it) => s + it.r[P[1]], 0);
  const gap = (total - used) / (list.length - 1);
  commit(() => {
    let pos = first[P[0]];
    for(const it of list){
      const d = r3(pos - it.r[P[0]]);
      moveBy(it.n, axis === "h" ? d : 0, axis === "h" ? 0 : d);
      pos += it.r[P[1]] + gap;
    }
  });
}
