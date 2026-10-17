/* 오른쪽 패널: 선택한 요소의 속성 (CSS 기준) · 페이지 설정 */
import { TYPES, FONTS, state, geo, view, $, esc, r3, get, descendants, snapshot, pushHistory, commit, autosave, toast } from "../core/state.js";
import { renderCanvas, refreshNodes, computeLayout, parentRect, len } from "./canvas.js";
import { group, ungroup, align, distribute } from "./edit.js";
import { icon } from "./icons.js";
import { PRESETS, PRESET, EASINGS, newAnim, normAnim } from "../fx/presets.js";

// 애니메이션 한 개의 설정 카드. 입력의 data-anim으로 몇 번째 애니메이션인지 구분한다.
function animCard(raw, i){
  const a = normAnim(raw), p = PRESET[a.preset], A = `data-anim="${i}"`;
  const id = k => `a${i}-${k}`;
  const num = (k, v, step, extra="") => `<input type="number" id="${id(k)}" data-prop="${k}" data-kind="num" ${A} step="${step}" value="${v}" ${extra}>`;
  const sel = (k, v, opts, extra="") => `<select id="${id(k)}" data-prop="${k}" data-kind="enum" ${A} ${extra}>${opts.map(([val, lab]) => `<option value="${esc(val)}"${String(val)===String(v)?" selected":""}>${esc(lab)}</option>`).join("")}</select>`;
  const presetOpts = PRESETS.map(x => [x.id, `${x.cat} · ${x.name}`]);
  return `<div class="anim-card">
    <div class="anim-head"><b>${esc(p.name)}</b><small>${esc(p.cat)}</small><button type="button" class="ib" data-anim-del="${i}" title="이 애니메이션 삭제" aria-label="이 애니메이션 삭제">${icon("close")}</button></div>
    ${row("효과", sel("preset", a.preset, presetOpts, 'data-rerender="1"'))}
    ${row("지속 (ms)", num("duration", a.duration, 50, 'min="1"'))}
    ${row("지연 (ms)", num("delay", a.delay, 50, 'min="0"'))}
    ${row("반복 (0=무한)", num("iterations", a.iterations, 1, 'min="0"'))}
    ${row("방향", sel("direction", a.direction, [["normal","정방향"],["reverse","역방향"],["alternate","왕복"],["alternate-reverse","역왕복"]]))}
    ${row("이징", sel("easing", a.easing, EASINGS.some(([v]) => v === a.easing) ? EASINGS : EASINGS.concat([[a.easing, a.easing]])))}
    ${row("강도", num("intensity", a.intensity, 0.1, 'min="0" max="3"'))}
    ${row("속도", num("speed", a.speed, 0.25, 'min="0.1" max="5"'))}
    ${row("시작·끝 상태", sel("fill", a.fill, [["none","원래 상태"],["both","시작 전·끝난 뒤 유지"],["backwards","시작 전 첫 상태"],["forwards","끝난 뒤 마지막 상태"]]))}
    ${p.color ? row("색", `<input type="color" id="${id("color")}-c" data-prop="color" data-kind="color" ${A} value="${a.color}"><input type="text" id="${id("color")}" data-prop="color" data-kind="color" ${A} value="${a.color}" spellcheck="false">`) : ""}
  </div>`;
}

// 접힌 섹션 제목 목록 (브라우저에 기억)
const COLLAPSE_KEY = "uiforge.web.collapsed";
let collapsed;
try{ collapsed = new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || []); }catch(e){ collapsed = new Set(); }
const secKey = h3 => h3.firstChild ? h3.firstChild.textContent.trim() : "";
function decorateSections(el){
  el.querySelectorAll(".sec > h3").forEach(h3 => {
    const k = secKey(h3); h3.dataset.key = k;
    h3.insertAdjacentHTML("afterbegin", icon("chevron", "ic cv"));
    h3.setAttribute("role", "button"); h3.tabIndex = 0;
    const on = collapsed.has(k);
    h3.parentElement.classList.toggle("collapsed", on); h3.setAttribute("aria-expanded", !on);
  });
}
function toggleSection(h3){
  const k = h3.dataset.key, on = !collapsed.has(k);
  on ? collapsed.add(k) : collapsed.delete(k);
  h3.parentElement.classList.toggle("collapsed", on); h3.setAttribute("aria-expanded", !on);
  try{ localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...collapsed])); }catch(e){}
}

const AL = {
  left:'<path d="M2 1v14M5 4h8v3H5zM5 9h5v3H5z"/>', hcenter:'<path d="M8 1v14M3 4h10v3H3zM5 9h6v3H5z"/>', right:'<path d="M14 1v14M3 4h8v3H3zM6 9h5v3H6z"/>',
  top:'<path d="M1 2h14M4 5v8h3V5zM9 5v5h3V5z"/>', vcenter:'<path d="M1 8h14M4 3v10h3V3zM9 5v6h3V5z"/>', bottom:'<path d="M1 14h14M4 3v8h3V3zM9 6v5h3V6z"/>',
  dh:'<path d="M1 2v12M15 2v12M5 5h2v6H5zM9 5h2v6H9z"/>', dv:'<path d="M2 1h12M2 15h12M5 5h6v2H5zM5 9h6v2H5z"/>'
};
const alBtn = (k, title) => `<button type="button" class="ib" data-al="${k}" title="${title}" aria-label="${title}"><svg viewBox="0 0 16 16">${AL[k]}</svg></button>`;
function arrangeSec(multi){
  return `<div class="sec"><h3>정렬 <small style="text-transform:none;letter-spacing:0">${multi ? "선택 영역 기준" : "부모 기준"}</small></h3>
    <div class="alignbar">${alBtn("left","왼쪽 맞춤")}${alBtn("hcenter","가로 가운데")}${alBtn("right","오른쪽 맞춤")}${alBtn("top","위쪽 맞춤")}${alBtn("vcenter","세로 가운데")}${alBtn("bottom","아래쪽 맞춤")}
    ${multi ? alBtn("dh","가로 간격 같게") + alBtn("dv","세로 간격 같게") : ""}</div>
    <div class="conv"><button class="btn" type="button" data-cmd="group">그룹으로 묶기 <small>Ctrl+G</small></button>${get(state.sel)?.type === "group" && !multi ? `<button class="btn" type="button" data-cmd="ungroup">그룹 해제 <small>Ctrl+Shift+G</small></button>` : ""}</div>
  </div>`;
}

const row = (label, ctl) => `<div class="row"><label>${label}</label><div class="ctl">${ctl}</div></div>`;
const numI = (p, v, step, extra="") => `<input type="number" id="p-${p}" data-prop="${p}" data-kind="num" step="${step}" value="${v}" ${extra}>`;
const txtI = (p, v) => `<input type="text" id="p-${p}" data-prop="${p}" data-kind="text" value="${esc(v)}">`;
const colI = (p, v) => `<input type="color" id="p-${p}-c" data-prop="${p}" data-kind="color" value="${v}"><input type="text" id="p-${p}" data-prop="${p}" data-kind="color" value="${v}" spellcheck="false">`;
const boolI = (p, v, extra="") => `<input type="checkbox" id="p-${p}" data-prop="${p}" data-kind="bool" ${v?"checked":""} ${extra}>`;
const enumI = (p, v, opts) => `<select id="p-${p}" data-prop="${p}" data-kind="enum">${opts.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}"${String(val)===String(v)?" selected":""}>${esc(lab)}</option>`; }).join("")}</select>`;
const alphaI = (p, v) => numI(p, v, 0.05, 'min="0" max="1"');
// 값 + 단위(px/%) 묶음. 단위를 바꾸면 화면상 크기를 유지하도록 값을 환산한다.
const unitI = (p, v, u) => `<div class="uv"><input type="number" id="p-${p}" data-prop="${p}" data-kind="num" step="${u === "%" ? 0.5 : 1}" value="${r3(v)}"><select id="p-${p}u" data-prop="${p}u" data-kind="unit" data-axis="${p}"><option${u==="px"?" selected":""}>px</option><option${u==="%"?" selected":""}>%</option></select></div>`;
const segI = (p, v, opts) => `<div class="seg" role="group">${opts.map(([val, lab]) => `<button type="button" data-seg="${p}" data-val="${val}" aria-pressed="${v===val}">${lab}</button>`).join("")}</div>`;

function renderProps(){
  const el = $("props"), n = get(state.sel);
  if(!n){
    const pg = state.project.page, S = 'data-scope="page"';
    el.innerHTML = `<div class="sec"><h3>페이지</h3>
      ${row("폭", `<span class="ro">${state.device}px · 상단 화면 폭에서 변경</span>`)}
      ${row("높이", `<input type="number" id="pg-height" data-prop="height" data-kind="num" ${S} step="10" min="100" value="${pg.height}">`)}
      ${row("배경색", `<input type="color" id="pg-bg-c" data-prop="bg" data-kind="color" ${S} value="${pg.bg}"><input type="text" id="pg-bg" data-prop="bg" data-kind="color" ${S} value="${pg.bg}" spellcheck="false">`)}
    </div>
    <div class="sec"><h3>사용법</h3>
      <p class="note">왼쪽에서 요소를 삽입하고 캔버스에서 끌어 옮기거나 핸들로 크기를 바꿉니다. 위치와 크기는 px 또는 부모 기준 %로 지정할 수 있습니다.</p>
      <p class="note">단축키 — Delete 삭제 · Ctrl+D 복제 · Ctrl+C / X / V 복사·잘라내기·붙여넣기 · Ctrl+G 그룹 · Ctrl+Shift+G 그룹 해제 · Ctrl+Z / Ctrl+Shift+Z 되돌리기·다시 · 방향키 1px 이동(Shift 10px) · Shift/Ctrl+클릭 다중 선택 · Ctrl+A 전체 선택 · Esc 선택 해제</p>
      <p class="note">화면 — Ctrl+휠 확대·축소 · Ctrl+= / Ctrl+- 확대·축소 · Ctrl+0 화면 맞춤 · 스페이스+드래그 또는 휠 버튼 드래그로 이동. 휴대폰에서는 레이어 아래 '다중' 버튼을 켜면 여러 개를 고를 수 있습니다.</p>
      <p class="note">레이어의 자물쇠로 잠그면 캔버스에서 클릭·이동되지 않습니다. 눈 아이콘은 표시 여부를 바꿉니다.</p>
    </div>`;
    decorateSections(el);
    return;
  }
  const p = n.props, t = TYPES[n.type];
  const excl = new Set([n.id, ...descendants(n.id)]);
  const parents = [`<option value="">페이지</option>`]
    .concat(state.project.nodes.filter(x => !excl.has(x.id) && TYPES[x.type].container).map(x => `<option value="${x.id}"${x.id===n.parent?" selected":""}>${esc(x.props.name)} (${TYPES[x.type].label})</option>`));
  const g9 = [[0,0],[.5,0],[1,0],[0,.5],[.5,.5],[1,.5],[0,1],[.5,1],[1,1]]
    .map(([x,y]) => `<button type="button" data-align="${x},${y}" style="--x:${x};--y:${y}" title="부모 안에서 정렬 ${x}, ${y}"></button>`).join("");
  const multi = state.sels.length > 1;
  let h = (multi ? `<p class="note" style="padding-top:10px">${state.sels.length}개 선택됨 · 아래 속성은 마지막으로 선택한 <b style="color:var(--accent)">${esc(p.name)}</b>에만 적용됩니다. 이동·복제·삭제·정렬은 선택한 전체에 적용됩니다.</p>` : "")
  + arrangeSec(multi)
  + `<div class="sec"><h3>기본 <span class="cls" style="text-transform:none;letter-spacing:0">${t.label}</span></h3>
    ${row("이름", txtI("name", p.name))}
    ${row("부모", `<select id="p-parent" data-prop="parent" data-kind="parent">${parents.join("")}</select>`)}
    ${row("표시", boolI("visible", p.visible))}
    ${row("잠금", boolI("locked", p.locked, 'data-rerender="1"'))}
  </div>
  <div class="sec"><h3>위치 · 크기</h3>
    ${row("X", unitI("x", p.x, p.xu))}
    ${row("Y", unitI("y", p.y, p.yu))}
    ${row("너비", unitI("w", p.w, p.wu))}
    ${row("높이", unitI("h", p.h, p.hu))}
    ${row("회전 (deg)", numI("rotation", p.rotation, 1))}
    ${row("불투명도", alphaI("opacity", p.opacity))}
    ${row("부모 안 배치", `<div class="grid9">${g9}</div>`)}
  </div>
  <div class="sec"><h3>채우기</h3>
    ${row("색", colI("fill", p.fill))}
    ${row("불투명도", alphaI("fillAlpha", p.fillAlpha))}
  </div>
  <div class="sec"><h3>모서리 · 테두리</h3>
    ${n.type === "ellipse" ? "" : row("모서리 (px)", numI("radius", p.radius, 1, 'min="0"'))}
    ${row("두께 (px)", numI("borderWidth", p.borderWidth, 1, 'min="0" data-rerender="1"'))}
    ${p.borderWidth > 0 ? row("스타일", enumI("borderStyle", p.borderStyle, [["solid","실선"],["dashed","파선"],["dotted","점선"],["double","이중선"]])) + row("색", colI("borderColor", p.borderColor)) : ""}
  </div>
  <div class="sec"><h3>그림자</h3>
    ${row("사용", boolI("shadowOn", p.shadowOn, 'data-rerender="1"'))}
    ${p.shadowOn ? row("X / Y", `<div class="ud">${numI("shadowX", p.shadowX, 1)}${numI("shadowY", p.shadowY, 1)}</div>`)
      + row("흐림 / 확산", `<div class="ud">${numI("shadowBlur", p.shadowBlur, 1, 'min="0"')}${numI("shadowSpread", p.shadowSpread, 1)}</div>`)
      + row("색", colI("shadowColor", p.shadowColor)) + row("불투명도", alphaI("shadowAlpha", p.shadowAlpha)) : ""}
  </div>`;
  if(t.container) h += `<div class="sec"><h3>레이아웃</h3>${row("넘침 자르기", boolI("clip", p.clip))}</div>`;
  if(t.text){
    h += `<div class="sec"><h3>텍스트</h3>
      ${row("내용", `<textarea id="p-text" data-prop="text" data-kind="text" rows="3">${esc(p.text)}</textarea>`)}
      ${row("글꼴", enumI("font", p.font, FONTS.map(f => [f, f.replace(/"/g,"")])))}
      ${row("크기 (px)", numI("fontSize", p.fontSize, 1, 'min="1"'))}
      ${row("굵기", enumI("fontWeight", p.fontWeight, [[300,"300 Light"],[400,"400 Regular"],[500,"500 Medium"],[600,"600 SemiBold"],[700,"700 Bold"],[900,"900 Black"]]))}
      ${row("줄 간격", numI("lineHeight", p.lineHeight, 0.05, 'min="0.5"'))}
      ${row("자간 (px)", numI("letterSpacing", p.letterSpacing, 0.5))}
      ${row("색", colI("color", p.color))}
      ${row("가로 정렬", segI("align", p.align, [["left","왼쪽"],["center","가운데"],["right","오른쪽"]]))}
      ${row("세로 정렬", segI("valign", p.valign, [["top","위"],["center","가운데"],["bottom","아래"]]))}
    </div>`;
  }
  h += `<div class="sec"><h3>애니메이션 <small style="text-transform:none;letter-spacing:0">${(p.anims||[]).length}개</small></h3>
    ${(p.anims||[]).map(animCard).join("")}
    <div class="conv"><button class="btn" type="button" data-cmd="addAnim">${icon("plus")}애니메이션 추가</button></div>
    <p class="note">여러 개를 넣으면 같은 속성(예: 위치·크기)은 아래쪽 애니메이션이 우선합니다. 하단 타임라인에서 재생해 확인하세요.</p>
  </div>`;
  if(t.image){
    h += `<div class="sec"><h3>이미지</h3>
      ${row("주소 (URL)", txtI("src", p.src.startsWith("data:") ? "(올린 파일)" : p.src))}
      ${row("파일", `<label class="btn" for="p-file">파일 선택</label><input type="file" id="p-file" accept="image/*" hidden>`)}
      ${row("맞춤", enumI("fit", p.fit, [["cover","채우기 (cover)"],["contain","맞추기 (contain)"],["fill","늘이기 (fill)"]]))}
      <p class="note">올린 파일은 프로젝트 안에 함께 저장됩니다. 큰 이미지는 브라우저 저장 용량을 많이 차지합니다.</p>
    </div>`;
  }
  el.innerHTML = h;
  decorateSections(el);
}

let focusSnap = null;
const propsEl = () => $("props");
function applyField(t){
  const n = get(state.sel);
  let scope = t.dataset.scope === "page" ? state.project.page : n && n.props;
  if(scope && t.dataset.anim !== undefined){ scope.anims[+t.dataset.anim] = normAnim(scope.anims[+t.dataset.anim]); scope = scope.anims[+t.dataset.anim]; }
  if(!scope) return false;
  const k = t.dataset.kind, p = t.dataset.prop;
  // 효과를 바꾸면 그 효과의 기본 타이밍으로 맞추고 지연·강도·속도·색은 유지한다
  if(t.dataset.anim !== undefined && p === "preset"){
    const keep = {delay:scope.delay, intensity:scope.intensity, speed:scope.speed, color:scope.color};
    Object.assign(scope, newAnim(t.value), keep); return true;
  }
  if(k === "num"){
    let v = parseFloat(t.value); if(isNaN(v)) return false;
    if(t.min !== "") v = Math.max(+t.min, v); if(t.max !== "") v = Math.min(+t.max, v);
    scope[p] = v;
  } else if(k === "text"){ if(p === "src" && t.value === "(올린 파일)") return false; scope[p] = t.value; }
  else if(k === "color"){
    let v = t.value.trim(); if(v[0] !== "#") v = "#" + v;
    if(!/^#[0-9a-f]{6}$/i.test(v)) return false;
    scope[p] = v.toLowerCase();
    t.closest(".ctl").querySelectorAll(`[data-prop="${p}"][data-kind="color"]`).forEach(o => { if(o !== t) o.value = v.toLowerCase(); });
  }
  else if(k === "bool"){ scope[p] = t.checked; }
  else if(k === "enum"){ scope[p] = /^\d+$/.test(t.value) ? +t.value : t.value; }
  else if(k === "unit"){
    const ax = t.dataset.axis, nu = t.value; if(scope[p] === nu) return false;
    computeLayout();
    const dim = (ax === "x" || ax === "w") ? parentRect(n).w : parentRect(n).h;
    const px = len(scope[ax], scope[p], dim);
    scope[ax] = nu === "%" ? r3(px/(dim||1)*100) : Math.round(px);
    scope[p] = nu;
  }
  else if(k === "parent"){
    const np = t.value || null; if(np === n.parent) return false;
    // 화면상 위치를 유지하도록 새 부모 기준 px 좌표로 다시 계산한다
    computeLayout();
    const r = geo.L[n.id], npr = np ? geo.I[np] : geo.root;
    const arr = state.project.nodes, ids = [n.id, ...descendants(n.id)], moving = ids.map(get);
    moving.forEach(m => arr.splice(arr.indexOf(m), 1));
    n.parent = np; arr.push(...moving);
    Object.assign(n.props, {x:Math.round(r.x - npr.x), xu:"px", y:Math.round(r.y - npr.y), yu:"px"});
  }
  return true;
}

export function initProps(){
  view.props = renderProps;
  const el = propsEl();
  el.addEventListener("focusin", () => { focusSnap = snapshot(); });
  el.addEventListener("input", e => {
    const t = e.target; if(!t.dataset.prop || t.dataset.kind === "parent" || t.dataset.kind === "unit") return;
    if(applyField(t)){ t.dataset.scope === "page" ? renderCanvas() : refreshNodes([state.sel]); if(["name","visible","locked"].includes(t.dataset.prop)) view.tree(); if(t.dataset.anim !== undefined) view.timeline(); view.status(); }
  });
  el.addEventListener("change", e => {
    const t = e.target;
    if(t.id === "p-file"){ loadFile(t); return; }
    if(!t.dataset.prop) return;
    applyField(t);
    if(focusSnap) pushHistory(focusSnap);
    focusSnap = snapshot();
    renderCanvas(); view.tree(); view.status(); view.timeline(); autosave();
    if(t.dataset.rerender || ["unit","parent"].includes(t.dataset.kind)) renderProps();
  });
  el.addEventListener("keydown", e => { const h3 = e.target.closest(".sec > h3"); if(h3 && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); toggleSection(h3); } });
  el.addEventListener("click", e => {
    const h3 = e.target.closest(".sec > h3"); if(h3){ toggleSection(h3); return; }
    const a = e.target.closest("[data-align]"), sg = e.target.closest("[data-seg]"), al = e.target.closest("[data-al]"), cmd = e.target.closest("[data-cmd]");
    const n = get(state.sel); if(!n) return;
    if(al){ const k = al.dataset.al; k === "dh" ? distribute("h") : k === "dv" ? distribute("v") : align(k); return; }
    const del = e.target.closest("[data-anim-del]");
    if(del){ commit(() => n.props.anims.splice(+del.dataset.animDel, 1)); return; }
    if(cmd){ const c = cmd.dataset.cmd; c === "group" ? group() : c === "ungroup" ? ungroup() : view.showView("motion"); return; }
    if(sg){ commit(() => n.props[sg.dataset.seg] = sg.dataset.val); return; }
    if(a){
      const [fx, fy] = a.dataset.align.split(",").map(Number);
      computeLayout();
      const pr = parentRect(n), r = geo.L[n.id], p = n.props;
      commit(() => {
        const x = (pr.w - r.w)*fx, y = (pr.h - r.h)*fy;
        p.x = p.xu === "%" ? r3(x/pr.w*100) : Math.round(x);
        p.y = p.yu === "%" ? r3(y/pr.h*100) : Math.round(y);
      });
    }
  });
}

function loadFile(input){
  const f = input.files[0], n = get(state.sel); if(!f || !n) return;
  const rd = new FileReader();
  rd.onload = () => { commit(() => n.props.src = rd.result); toast("이미지를 넣었습니다"); };
  rd.readAsDataURL(f);
}
