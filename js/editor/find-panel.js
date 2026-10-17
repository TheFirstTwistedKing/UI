/* 에셋 검색 탭: 도형·장식·구성 요소·애니메이션·VFX 라이브러리를 한 번에 찾는다.
   결과를 누르면 그 라이브러리 탭을 열고, 검색어를 채운 뒤 해당 항목을 반짝여 보여 준다 (넣기·적용은 그 탭에서). */
import { $, esc, view } from "../core/state.js";
import { iconRef } from "./icons.js";
import { SHAPES } from "../shapes/shapes.js";
import { ORNAMENTS } from "../shapes/ornaments.js";
import { COMPONENTS } from "../components/components.js";
import { PRESETS } from "../fx/presets.js";
import { EFFECTS } from "../fx/vfx.js";

const KINDS = [
  {key:"shape", label:"도형", items:SHAPES, lib:"shapeLib", search:"shapeSearch"},
  {key:"ornament", label:"장식", items:ORNAMENTS, lib:"decoLib", search:"decoSearch"},
  {key:"component", label:"구성 요소", items:COMPONENTS, lib:"cmpLib", search:"cmpSearch"},
  {key:"motion", label:"애니메이션", items:PRESETS, lib:"animLib", search:"animSearch"},
  {key:"fx", label:"VFX", items:EFFECTS, lib:"fxLib", search:"fxSearch"},
];
const LIMIT = 150;
let kind = "all", all = null;

function index(){
  all = [];
  for(const k of KINDS) for(const it of k.items)
    all.push({k, id:it.id, name:it.name, cat:it.cat, hay:`${it.name} ${it.cat} ${it.id} ${k.label}`.toLowerCase()});
  return all;
}

function render(){
  const q = $("findSearch").value.trim().toLowerCase(), list = $("findList");
  const pool = (all || index()).filter(r => kind === "all" || r.k.key === kind);
  if(!q){
    $("findCount").textContent = pool.length + "개";
    list.innerHTML = `<p class="hint">이름·분류·종류로 찾습니다. 예: 홀로, 글리치, 버튼, 별</p>`;
    return;
  }
  const words = q.split(/\s+/), hits = pool.filter(r => words.every(w => r.hay.includes(w)));
  $("findCount").textContent = hits.length + "개";
  list.innerHTML = hits.slice(0, LIMIT).map((r, i) =>
    `<button class="find-row" type="button" data-i="${i}">${iconRef(r.k.key)}<span class="nm">${esc(r.name)}</span><small>${esc(r.k.label)} · ${esc(r.cat)}</small></button>`).join("")
    + (hits.length > LIMIT ? `<p class="find-more">${hits.length - LIMIT}개 더 있습니다. 검색어를 더 적어 보세요.</p>` : "")
    + (hits.length ? "" : `<p class="hint">찾는 에셋이 없습니다.</p>`);
  list._hits = hits;
}

// 탭의 목록은 처음 보일 때 만들어지므로, 항목이 생길 때까지 기다렸다가 찾는다
function reveal(r){
  view.showView(r.k.key);
  const inp = $(r.k.search), lib = $(r.k.lib);
  inp.value = r.name;
  let tries = 0;
  (function wait(){
    const b = lib.querySelector(`.lib-item[data-item="${CSS.escape(r.id)}"]`);
    if(!b){ if(++tries < 90) requestAnimationFrame(wait); return; }
    inp.dispatchEvent(new Event("input"));
    b.scrollIntoView({block:"center"});
    b.classList.remove("flash"); void b.offsetWidth; b.classList.add("flash");
    setTimeout(() => b.classList.remove("flash"), 2600);
  })();
}

export function initFind(){
  $("findFilter").innerHTML = [{key:"all", label:"전체"}, ...KINDS].map(k =>
    `<button type="button" data-k="${k.key}" aria-pressed="${k.key === kind}">${k.label}</button>`).join("");
  $("findFilter").addEventListener("click", e => {
    const b = e.target.closest("[data-k]"); if(!b) return;
    kind = b.dataset.k;
    $("findFilter").querySelectorAll("[data-k]").forEach(x => x.setAttribute("aria-pressed", x === b));
    render();
  });
  $("findSearch").addEventListener("input", render);
  $("findList").addEventListener("click", e => {
    const b = e.target.closest(".find-row"), hits = $("findList")._hits;
    if(b && hits) reveal(hits[+b.dataset.i]);
  });
  render();
}
