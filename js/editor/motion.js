/* 왼쪽 패널 '애니메이션'·'VFX' 탭: 항목 목록 · 견본 미리보기 · 선택 요소에 적용 */
import { state, view, $, esc, get, commit, toast } from "../core/state.js";
import { PRESETS, CATEGORIES, newAnim } from "../fx/presets.js";
import { EFFECTS, VFX_CATEGORIES, newFx } from "../fx/vfx.js";
import { setPreview, swatch, setFxPreview, fxSwatch } from "../fx/engine.js";

// 같은 구조의 라이브러리 패널을 만든다. cfg: 요소 id 접두어, 항목, 분류, 미리보기·견본·적용 함수
function library(cfg){
  const lib = $(cfg.ids.lib), byId = Object.fromEntries(cfg.items.map(x => [x.id, x]));
  let active = null;
  let h = "";
  for(const cat of cfg.cats){
    const items = cfg.items.filter(p => p.cat === cat); if(!items.length) continue;
    h += `<div class="lib-cat">${cat} <small>${items.length}</small></div>`;
    h += items.map(p => `<button type="button" class="lib-item${cfg.cls ? " " + cfg.cls : ""}" data-item="${p.id}" aria-pressed="false"><span class="sw"><i></i></span><span class="nm">${esc(p.name)}</span></button>`).join("");
  }
  lib.innerHTML = h;
  $(cfg.ids.count).textContent = cfg.items.length + "종";
  const sw = id => lib.querySelector(`[data-item="${id}"] .sw i`);
  function updateFoot(){
    const n = state.sels.length;
    $(cfg.ids.apply).disabled = !active || !n;
    $(cfg.ids.hint).textContent = !active ? "항목에 마우스를 올리면 견본이 움직입니다. 눌러서 고르면 선택한 요소에서 미리 재생됩니다."
      : !n ? `${byId[active].name} · 캔버스에서 적용할 요소를 선택하세요.`
      : `${byId[active].name} · 선택한 ${n}개 요소에서 미리 재생 중`;
  }
  function setActive(id){
    if(active){ const prev = lib.querySelector(`[data-item="${active}"]`); if(prev){ prev.setAttribute("aria-pressed", "false"); cfg.swatch(sw(active), null); } }
    active = id;
    if(id){ lib.querySelector(`[data-item="${id}"]`).setAttribute("aria-pressed", "true"); cfg.swatch(sw(id), id); }
    cfg.preview(id); updateFoot();
  }
  function apply(){
    const ids = state.sels.filter(id => get(id)); if(!active || !ids.length) return;
    const name = byId[active].name, id = active;
    setActive(null);
    commit(() => ids.forEach(i => cfg.add(get(i).props, id)));
    toast(`${ids.length}개 요소에 '${name}'을 적용했습니다`);
  }
  // 견본은 마우스를 올린 항목 하나와 고른 항목만 재생한다 (목록 전체를 동시에 돌리지 않는다)
  lib.addEventListener("pointerover", e => { const b = e.target.closest(".lib-item"); if(b && b.dataset.item !== active && !b.contains(e.relatedTarget)) cfg.swatch(sw(b.dataset.item), b.dataset.item); });
  lib.addEventListener("pointerout", e => { const b = e.target.closest(".lib-item"); if(b && !b.contains(e.relatedTarget) && b.dataset.item !== active) cfg.swatch(sw(b.dataset.item), null); });
  lib.addEventListener("click", e => { const b = e.target.closest(".lib-item"); if(b) setActive(b.dataset.item === active ? null : b.dataset.item); });
  lib.addEventListener("dblclick", e => { const b = e.target.closest(".lib-item"); if(b){ setActive(b.dataset.item); apply(); } });
  $(cfg.ids.apply).onclick = apply;
  updateFoot();
  return {updateFoot, leave(){ if(active) setActive(null); }};
}

export function initMotion(){
  const libs = [
    library({ids:{lib:"animLib", count:"animCount", hint:"libHint", apply:"libApply"}, items:PRESETS, cats:CATEGORIES,
      preview:setPreview, swatch, add:(p, id) => (p.anims ||= []).push(newAnim(id))}),
    library({ids:{lib:"fxLib", count:"fxCount", hint:"fxHint", apply:"fxApply"}, items:EFFECTS, cats:VFX_CATEGORIES, cls:"fx",
      preview:setFxPreview, swatch:fxSwatch, add:(p, id) => (p.fx ||= []).push(newFx(id))})
  ];
  const prevHint = view.hint;
  view.hint = () => { prevHint(); libs.forEach(l => l.updateFoot()); };
  view.leaveMotion = () => libs.forEach(l => l.leave());
}
