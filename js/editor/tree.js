/* 왼쪽 패널: 요소 삽입 · 레이어 트리 */
import { TYPES, state, view, $, esc, get, kidsMap, descendants, isLocked, topSel, select, commit, newId, node, uniqueName } from "../core/state.js";
import { icon } from "./icons.js";

// 선택한 요소가 컨테이너면 그 안에, 아니면 같은 부모에 삽입한다
function insertParent(){
  const n = get(state.sel);
  if(!n) return null;
  return TYPES[n.type].container ? n.id : n.parent;
}
function renderInsert(){
  $("insert").innerHTML = Object.keys(TYPES).map(k => `<button type="button" data-type="${k}" title="${TYPES[k].label} 넣기" aria-label="${TYPES[k].label} 넣기">${icon(k)}<span>${TYPES[k].label}</span></button>`).join("");
}
function updateInsertHint(){
  const pid = insertParent(), p = get(pid);
  $("insHint").innerHTML = p ? `<b style="color:var(--accent)">${esc(p.props.name)}</b> 안에 삽입됩니다.` : `페이지 바로 아래에 삽입됩니다.`;
}

function renderTree(){
  const km = kidsMap();
  let h = `<div class="node${state.sel?"":" on"}" data-id="">${icon("page","ic ty")}<span class="nm">페이지</span></div>`;
  (function w(pid, depth){
    for(const n of km[pid]||[]){
      const p = n.props;
      h += `<div class="node${state.sels.includes(n.id)?" on":""}${p.visible?"":" off"}${isLocked(n)?" lk":""}" data-id="${n.id}" style="padding-left:${8+depth*14}px">${icon(n.type,"ic ty")}<span class="nm">${esc(p.name)}</span>`
        + `<button type="button" class="tg${p.locked?" set":""}" data-tg="locked" title="${p.locked?"잠금 해제":"잠금"}" aria-label="${p.locked?"잠금 해제":"잠금"}">${icon(p.locked?"lock":"unlock")}</button>`
        + `<button type="button" class="tg${p.visible?"":" set"}" data-tg="visible" title="${p.visible?"숨기기":"보이기"}" aria-label="${p.visible?"숨기기":"보이기"}">${icon(p.visible?"eye":"eyeOff")}</button></div>`;
      w(n.id, depth+1);
    }
  })("_", 1);
  $("tree").innerHTML = h;
  $("count").textContent = state.project.nodes.length + "개";
  const has = !!state.sel, one = state.sels.length <= 1;
  ["dupBtn","delBtn"].forEach(id => $(id).disabled = !has);
  ["upBtn","downBtn"].forEach(id => $(id).disabled = !has || !one);
}

// 같은 부모 안에서 순서를 바꾼다. 목록 아래쪽(배열 뒤쪽)이 화면에서 위에 그려진다.
function moveSibling(dir){
  const n = get(state.sel); if(!n) return;
  const arr = state.project.nodes;
  const sibs = arr.filter(x => x.parent === n.parent);
  const i = sibs.indexOf(n), j = i + dir;
  if(j < 0 || j >= sibs.length) return;
  commit(() => { const a = arr.indexOf(n), b = arr.indexOf(sibs[j]); arr[a] = sibs[j]; arr[b] = n; });
}
export function duplicate(){
  const roots = topSel(); if(!roots.length) return;
  commit(() => {
    const newSel = [];
    for(const n of roots){
      const ids = [n.id, ...descendants(n.id)], map = {};
      ids.forEach(id => map[id] = newId());
      const copies = ids.map(id => { const o = get(id); return {id:map[id], type:o.type, parent: id===n.id ? o.parent : map[o.parent], props: JSON.parse(JSON.stringify(o.props))}; });
      const cp = copies[0].props;
      if(cp.xu === "px") cp.x += 16; if(cp.yu === "px") cp.y += 16;
      const arr = state.project.nodes, last = Math.max(...ids.map(id => arr.findIndex(x => x.id === id)));
      arr.splice(last+1, 0, ...copies); newSel.push(copies[0].id);
    }
    state.sels = newSel; state.sel = newSel[newSel.length-1];
  });
}
export function removeSel(){
  const roots = topSel(); if(!roots.length) return;
  const kill = new Set(); roots.forEach(n => { kill.add(n.id); descendants(n.id).forEach(d => kill.add(d)); });
  const next = roots.length === 1 ? roots[0].parent : null;
  commit(() => { state.project.nodes = state.project.nodes.filter(x => !kill.has(x.id)); state.sel = next; state.sels = next ? [next] : []; });
}

export function initTree(){
  view.tree = renderTree; view.hint = updateInsertHint;
  renderInsert();
  $("insert").addEventListener("click", e => {
    const b = e.target.closest("[data-type]"); if(!b) return;
    const type = b.dataset.type, parent = insertParent();
    const siblings = state.project.nodes.filter(n => n.parent === parent).length;
    const x = node(type, parent, {name: uniqueName(TYPES[type].label), x: 40 + siblings*16, y: 40 + siblings*16});
    commit(() => { state.project.nodes.push(x); state.sel = x.id; state.sels = [x.id]; });
  });
  $("tree").addEventListener("click", e => {
    const r = e.target.closest(".node"); if(!r) return;
    const tg = e.target.closest("[data-tg]"), n = get(r.dataset.id);
    if(tg && n){ const k = tg.dataset.tg; commit(() => n.props[k] = !n.props[k]); return; }
    select(r.dataset.id || null, (e.shiftKey || e.ctrlKey || e.metaKey || state.multiTap) && !!r.dataset.id);
  });
  $("upBtn").onclick = () => moveSibling(-1);
  $("downBtn").onclick = () => moveSibling(1);
  $("dupBtn").onclick = duplicate;
  $("delBtn").onclick = removeSel;
}
