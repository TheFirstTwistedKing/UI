/* 왼쪽 패널 '애니메이션' 탭: 프리셋 목록 · 견본 미리보기 · 선택 요소에 적용 */
import { state, view, $, esc, get, commit, toast } from "../core/state.js";
import { PRESETS, CATEGORIES, PRESET, newAnim } from "../fx/presets.js";
import { setPreview, swatch } from "../fx/engine.js";

let active = null;

function renderLib(){
  let h = "";
  for(const cat of CATEGORIES){
    const items = PRESETS.filter(p => p.cat === cat); if(!items.length) continue;
    h += `<div class="lib-cat">${cat}</div>`;
    h += items.map(p => `<button type="button" class="lib-item" data-preset="${p.id}" aria-pressed="false"><span class="sw"><i></i></span><span class="nm">${esc(p.name)}</span></button>`).join("");
  }
  $("animLib").innerHTML = h;
  $("animCount").textContent = PRESETS.length + "종";
}
function updateFoot(){
  const n = state.sels.length;
  $("libApply").disabled = !active || !n;
  $("libHint").textContent = !active ? "항목에 마우스를 올리면 견본이 움직입니다. 눌러서 고르면 선택한 요소에서 미리 재생됩니다."
    : !n ? `${PRESET[active].name} · 캔버스에서 적용할 요소를 선택하세요.`
    : `${PRESET[active].name} · 선택한 ${n}개 요소에서 미리 재생 중`;
}
function setActive(id){
  if(active){ const prev = $("animLib").querySelector(`[data-preset="${active}"]`); if(prev){ prev.setAttribute("aria-pressed", "false"); swatch(prev.querySelector(".sw i"), null); } }
  active = id;
  if(id){ const b = $("animLib").querySelector(`[data-preset="${id}"]`); b.setAttribute("aria-pressed", "true"); swatch(b.querySelector(".sw i"), id); }
  setPreview(id); updateFoot();
}
function apply(){
  const ids = state.sels.filter(id => get(id)); if(!active || !ids.length) return;
  const name = PRESET[active].name, id = active;
  setActive(null);
  commit(() => ids.forEach(i => { const n = get(i); (n.props.anims ||= []).push(newAnim(id)); }));
  toast(`${ids.length}개 요소에 '${name}'을 적용했습니다`);
}

export function initMotion(){
  renderLib(); updateFoot();
  const lib = $("animLib");
  // 견본은 마우스를 올린 항목 하나와 고른 항목만 재생한다 (목록 전체를 동시에 돌리지 않는다)
  lib.addEventListener("pointerover", e => { const b = e.target.closest(".lib-item"); if(b && b.dataset.preset !== active) swatch(b.querySelector(".sw i"), b.dataset.preset); });
  lib.addEventListener("pointerout", e => { const b = e.target.closest(".lib-item"); if(b && !b.contains(e.relatedTarget) && b.dataset.preset !== active) swatch(b.querySelector(".sw i"), null); });
  lib.addEventListener("click", e => { const b = e.target.closest(".lib-item"); if(b) setActive(b.dataset.preset === active ? null : b.dataset.preset); });
  lib.addEventListener("dblclick", e => { const b = e.target.closest(".lib-item"); if(b){ setActive(b.dataset.preset); apply(); } });
  $("libApply").onclick = apply;
  const prevHint = view.hint;
  view.hint = () => { prevHint(); updateFoot(); };
  view.leaveMotion = () => { if(active) setActive(null); };
}
