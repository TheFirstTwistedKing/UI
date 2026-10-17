/* 왼쪽 패널 'UI 구성 요소' 탭: 견본을 보고 눌러서 그룹 하나로 넣는다 */
import { TYPES, state, $, esc, commit, node, uniqueName, toast, onFirstShow } from "../core/state.js";
import { COMPONENTS, COMPONENT_CATEGORIES, COMPONENT } from "../components/components.js";
import { shapeMarkup } from "../shapes/shapes.js";
import { ornamentMarkup } from "../shapes/ornaments.js";
import { newAnim } from "../fx/presets.js";
import { newFx } from "../fx/vfx.js";
import { rules } from "../export/html.js";
import { insertParent } from "./tree.js";

// 트리를 요소 목록으로 바꾼다. 애니메이션·VFX는 id(또는 {effect, ...})로 적어 둔 것을 실제 설정으로 만든다.
function toNodes(tree, parent, out){
  for(const [type, p, kids] of tree){
    const props = {...p};
    if(p.anims) props.anims = p.anims.map(a => typeof a === "string" ? newAnim(a) : Object.assign(newAnim(a.preset), a));
    if(p.fx) props.fx = p.fx.map(f => Object.assign(newFx(f.effect), f));
    const n = node(type, parent, props);
    out.push(n);
    toNodes(kids, n.id, out);
  }
  return out;
}
export function buildComponent(def, parent, x, y){
  const root = node("group", parent, {name:uniqueName(def.name), x, y, w:def.w, h:def.h, fillAlpha:0});
  return [root, ...toNodes(def.kids, root.id, [])];
}

// 견본: 내보내기와 같은 CSS 규칙으로 정적인 모습만 그린다 (애니메이션·VFX 없음)
function thumbHTML(def, W, H){
  const nodes = toNodes(def.kids, "_", []), kids = {};
  nodes.forEach(n => (kids[n.parent] ||= []).push(n));
  const html = pid => (kids[pid] || []).map(n => {
    const t = TYPES[n.type], p = n.props;
    const inner = t.text ? esc(p.text) : t.shape ? shapeMarkup(p) : t.deco ? ornamentMarkup(p) : "";
    return `<div style="${esc(rules(n).join(";"))}">${inner}${html(n.id)}</div>`;
  }).join("");
  const k = Math.min(W / def.w, H / def.h), ox = (W - def.w * k) / 2, oy = (H - def.h * k) / 2;
  return `<div class="stage" style="width:${def.w}px;height:${def.h}px;transform:translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px) scale(${k.toFixed(4)})">${html("_")}</div>`;
}

export function initComponents(){
  const lib = $("cmpLib");
  $("cmpCount").textContent = COMPONENTS.length + "종";
  $("cmpHint").textContent = "누르면 구성 요소를 그룹으로 넣습니다. 그룹 안의 요소는 레이어에서 하나씩 고쳐 쓸 수 있습니다.";
  // 목록과 견본은 탭이 처음 보일 때 만든다 (견본은 목록 폭을 알아야 해서)
  onFirstShow(lib, () => {
    let h = "";
    for(const cat of COMPONENT_CATEGORIES){
      const items = COMPONENTS.filter(c => c.cat === cat);
      h += `<div class="lib-cat" data-cat="${cat}">${cat} <small>${items.length}</small></div>`;
      h += items.map(c => `<button type="button" class="lib-item cmp" data-item="${c.id}" title="${esc(c.name)} 넣기"><span class="sw"></span><span class="nm">${esc(c.name)}</span></button>`).join("");
    }
    lib.innerHTML = h;
    lib.querySelectorAll(".lib-item").forEach(b => { const sw = b.querySelector(".sw"); sw.innerHTML = thumbHTML(COMPONENT[b.dataset.item], sw.clientWidth, sw.clientHeight); });
  });
  lib.addEventListener("click", e => {
    const b = e.target.closest(".lib-item"); if(!b) return;
    const def = COMPONENT[b.dataset.item], parent = insertParent();
    const siblings = state.project.nodes.filter(n => n.parent === parent).length;
    const list = buildComponent(def, parent, 40 + siblings*16, 40 + siblings*16);
    commit(() => { state.project.nodes.push(...list); state.sel = list[0].id; state.sels = [list[0].id]; });
    toast(`'${def.name}'을 넣었습니다`);
  });
  $("cmpSearch").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase(), seen = {};
    lib.querySelectorAll(".lib-item").forEach(b => { const c = COMPONENT[b.dataset.item], hit = !q || c.name.includes(q) || c.cat.includes(q) || c.id.toLowerCase().includes(q); b.hidden = !hit; if(hit) seen[c.cat] = 1; });
    lib.querySelectorAll(".lib-cat").forEach(c => c.hidden = !seen[c.dataset.cat]);
  });
}
