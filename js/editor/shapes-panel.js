/* 왼쪽 패널 '도형'·'장식' 탭: 목록에서 눌러 새 요소를 넣는다 */
import { state, $, esc, commit, node, uniqueName, toast, onFirstShow } from "../core/state.js";
import { SHAPES, SHAPE_CATEGORIES } from "../shapes/shapes.js";
import { ORNAMENTS, ORNAMENT_CATEGORIES, ORN_CSS } from "../shapes/ornaments.js";
import { insertParent } from "./tree.js";

// cfg: 요소 id 접두어, 항목, 분류, 견본 SVG, 넣을 요소 속성
function insertLibrary(cfg){
  const lib = $(cfg.pre + "Lib"), byId = Object.fromEntries(cfg.items.map(x => [x.id, x]));
  onFirstShow(lib, () => {
    let h = "";
    for(const cat of cfg.cats){
      const items = cfg.items.filter(s => s.cat === cat);
      h += `<div class="lib-cat" data-cat="${cat}">${cat} <small>${items.length}</small></div>`;
      h += items.map(s => `<button type="button" class="lib-item ${cfg.cls}" data-item="${s.id}" title="${esc(s.name)} 넣기"><span class="sw">${cfg.thumb(s)}</span><span class="nm">${esc(s.name)}</span></button>`).join("");
    }
    lib.innerHTML = h;
  });
  $(cfg.pre + "Count").textContent = cfg.items.length + "종";
  $(cfg.pre + "Hint").textContent = cfg.hint;
  lib.addEventListener("click", e => {
    const b = e.target.closest(".lib-item"); if(!b) return;
    const s = byId[b.dataset.item], parent = insertParent();
    const siblings = state.project.nodes.filter(n => n.parent === parent).length;
    const x = node(cfg.type, parent, {name:uniqueName(s.name), x:40 + siblings*16, y:40 + siblings*16, ...cfg.props(s)});
    commit(() => { state.project.nodes.push(x); state.sel = x.id; state.sels = [x.id]; });
    toast(`'${s.name}'을 넣었습니다`);
  });
  $(cfg.pre + "Search").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase(), seen = {};
    lib.querySelectorAll(".lib-item").forEach(b => { const s = byId[b.dataset.item], hit = !q || s.name.includes(q) || s.cat.toLowerCase().includes(q) || s.id.toLowerCase().includes(q); b.hidden = !hit; if(hit) seen[s.cat] = 1; });
    lib.querySelectorAll(".lib-cat").forEach(c => c.hidden = !seen[c.dataset.cat]);
  });
}

export function initShapes(){
  document.head.insertAdjacentHTML("beforeend", `<style id="ornCSS">${ORN_CSS}</style>`);
  insertLibrary({pre:"shape", type:"shape", cls:"shape", items:SHAPES, cats:SHAPE_CATEGORIES,
    hint:"누르면 새 도형을 넣습니다. 넣은 도형의 모양·색·선은 오른쪽 속성에서 바꿀 수 있습니다.",
    thumb:s => `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${s.d}"${s.evenodd ? ' fill-rule="evenodd"' : ""}/></svg>`,
    props:s => ({shape:s.id})});
  insertLibrary({pre:"deco", type:"deco", cls:"shape orn-i", items:ORNAMENTS, cats:ORNAMENT_CATEGORIES,
    hint:"누르면 새 장식을 넣습니다. 색·선 두께·모양은 오른쪽 속성에서 바꿀 수 있습니다.",
    thumb:o => { const k = Math.min(36 / o.size[0], 36 / o.size[1]);
      return `<svg viewBox="0 0 ${o.vb[0]} ${o.vb[1]}" preserveAspectRatio="none" aria-hidden="true" style="width:${Math.round(o.size[0] * k)}px;height:${Math.max(4, Math.round(o.size[1] * k))}px${o.clip ? ";overflow:hidden" : ""}">${o.svg}</svg>`; },
    props:o => ({deco:o.id, w:o.size[0], h:o.size[1], ...(o.color ? {fill:o.color} : {})})});
}
