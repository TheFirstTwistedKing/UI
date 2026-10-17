/* 왼쪽 패널 '도형' 탭: 도형 목록에서 눌러 새 도형 요소를 넣는다 */
import { state, $, esc, commit, node, uniqueName, toast } from "../core/state.js";
import { SHAPES, SHAPE_CATEGORIES, SHAPE } from "../shapes/shapes.js";
import { insertParent } from "./tree.js";

export function initShapes(){
  const lib = $("shapeLib");
  let h = "";
  for(const cat of SHAPE_CATEGORIES){
    const items = SHAPES.filter(s => s.cat === cat);
    h += `<div class="lib-cat" data-cat="${cat}">${cat} <small>${items.length}</small></div>`;
    h += items.map(s => `<button type="button" class="lib-item shape" data-item="${s.id}" title="${esc(s.name)} 넣기"><span class="sw"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${s.d}"${s.evenodd ? ' fill-rule="evenodd"' : ""}/></svg></span><span class="nm">${esc(s.name)}</span></button>`).join("");
  }
  lib.innerHTML = h;
  $("shapeCount").textContent = SHAPES.length + "종";
  $("shapeHint").textContent = "누르면 새 도형을 넣습니다. 넣은 도형의 모양·색·선은 오른쪽 속성에서 바꿀 수 있습니다.";
  lib.addEventListener("click", e => {
    const b = e.target.closest(".lib-item"); if(!b) return;
    const s = SHAPE[b.dataset.item], parent = insertParent();
    const siblings = state.project.nodes.filter(n => n.parent === parent).length;
    const x = node("shape", parent, {name:uniqueName(s.name), shape:s.id, x:40 + siblings*16, y:40 + siblings*16});
    commit(() => { state.project.nodes.push(x); state.sel = x.id; state.sels = [x.id]; });
    toast(`'${s.name}' 도형을 넣었습니다`);
  });
  $("shapeSearch").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase(), seen = {};
    lib.querySelectorAll(".lib-item").forEach(b => { const s = SHAPE[b.dataset.item], hit = !q || s.name.includes(q) || s.cat.includes(q) || s.id.toLowerCase().includes(q); b.hidden = !hit; if(hit) seen[s.cat] = 1; });
    lib.querySelectorAll(".lib-cat").forEach(c => c.hidden = !seen[c.dataset.cat]);
  });
}
