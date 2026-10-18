/* 오른쪽 패널: 선택한 요소의 속성 (CSS 기준) · 페이지 설정 */
import { TYPES, FONTS, state, geo, view, $, esc, r3, get, descendants, snapshot, pushHistory, commit, autosave, toast } from "../core/state.js";
import { SHAPES, SHAPE_CATEGORIES } from "../shapes/shapes.js";
import { ORNAMENTS, ORNAMENT_CATEGORIES } from "../shapes/ornaments.js";
import { renderCanvas, refreshNodes, computeLayout, parentRect, len } from "./canvas.js";
import { group, ungroup, align, distribute } from "./edit.js";
import { icon } from "./icons.js";
import { PRESETS, PRESET, EASINGS, newAnim, normAnim, endTime, DEFAULT_KEYS } from "../fx/presets.js";
import { parseColor, fmtColor } from "../core/color.js";
import { EFFECTS, EFFECT, newFx, normFx, GL_PARAMS } from "../fx/vfx.js";
import { glHost } from "../gl/host.js";
import { STYLE_KITS, kitAllowed } from "../core/styles.js";
import { MODES, TRIGGERS, TRIGGER, ACTIONS, ACTION, newAction, modeSupport } from "../core/interact.js";

// 애니메이션 한 개의 설정 카드. 입력의 data-anim으로 몇 번째 애니메이션인지 구분한다.
function animCard(raw, i){
  const a = normAnim(raw), p = PRESET[a.preset], A = `data-anim="${i}"`;
  const id = k => `a${i}-${k}`;
  const num = (k, v, step, extra="") => `<input type="number" id="${id(k)}" data-prop="${k}" data-kind="num" ${A} step="${step}" value="${v}" ${extra}>`;
  const sld = (k, v, min, max, step) => slider(id(k), k, v, min, max, step, A);
  const sel = (k, v, opts, extra="") => `<select id="${id(k)}" data-prop="${k}" data-kind="enum" ${A} ${extra}>${opts.map(([val, lab]) => `<option value="${esc(val)}"${String(val)===String(v)?" selected":""}>${esc(lab)}</option>`).join("")}</select>`;
  const presetOpts = PRESETS.map(x => [x.id, `${x.cat} · ${x.name}`]);
  return `<div class="anim-card">
    <div class="anim-head"><b>${esc(p.name)}</b><small>${esc(p.cat)}</small><button type="button" class="ib" data-anim-del="${i}" title="이 애니메이션 삭제" aria-label="이 애니메이션 삭제">${icon("close")}</button></div>
    ${row("효과", sel("preset", a.preset, presetOpts, 'data-rerender="1"'))}
    ${row("지속 (ms)", num("duration", a.duration, 50, 'min="1"'))}
    ${row("지연 (ms)", num("delay", a.delay, 50, 'min="0"'))}
    ${row("반복 (0=무한)", num("iterations", a.iterations, 1, 'min="0"'))}
    ${row("방향", sel("direction", a.direction, [["normal","정방향"],["reverse","역방향"],["alternate","왕복"],["alternate-reverse","역왕복"]]))}
    ${row("시작 → 끝", `<span class="ro">${a.delay}ms → ${isFinite(endTime(a)) ? Math.round(endTime(a)) + "ms" : "무한 반복"}</span>`)}
    ${row("이징", sel("easing", a.easing, EASINGS.some(([v]) => v === a.easing) ? EASINGS : EASINGS.concat([[a.easing, "직접: " + a.easing]]), 'data-rerender="1"'))}
    ${row("이징 직접", `<input type="text" id="${id("ease")}" data-prop="easing" data-kind="easing" ${A} value="${esc(a.easing)}" placeholder="cubic-bezier(.2,.8,.2,1)" spellcheck="false">`)}
    ${row("강도", sld("intensity", a.intensity, 0, 3, 0.05))}
    ${row("속도", sld("speed", a.speed, 0.1, 5, 0.05))}
    ${p.keys ? keysTable(a, i) : ""}
    ${row("시작·끝 상태", sel("fill", a.fill, [["none","원래 상태"],["both","시작 전·끝난 뒤 유지"],["backwards","시작 전 첫 상태"],["forwards","끝난 뒤 마지막 상태"]]))}
    ${p.color ? row("색", `<input type="color" id="${id("color")}-c" data-prop="color" data-kind="color" ${A} value="${a.color}"><input type="text" id="${id("color")}" data-prop="color" data-kind="color" ${A} value="${a.color}" spellcheck="false">`) : ""}
  </div>`;
}

// 직접 만든 애니메이션의 키프레임 표: 시점(%) · 위치 X/Y(px) · 배율 · 회전(deg) · 불투명도(0~1)
function keysTable(a, i){
  const keys = a.keys && a.keys.length ? a.keys : DEFAULT_KEYS();
  const cell = (j, k, v, step, extra = "") => `<input type="number" data-prop="${k}" data-kind="num" data-anim="${i}" data-key="${j}" step="${step}" value="${v}" aria-label="${k}" ${extra}>`;
  return `<div class="keys"><div class="keys-h"><span>%</span><span>X</span><span>Y</span><span>배율</span><span>회전</span><span>투명</span><span></span></div>
    ${keys.map((k, j) => `<div class="keys-r">${cell(j, "o", k.o, 1, 'min="0" max="100"')}${cell(j, "x", k.x, 1)}${cell(j, "y", k.y, 1)}${cell(j, "s", k.s, 0.05, 'min="0"')}${cell(j, "r", k.r, 1)}${cell(j, "op", k.op, 0.05, 'min="0" max="1"')}
      <button type="button" class="ib" data-key-del="${j}" data-anim="${i}" title="키프레임 삭제" aria-label="키프레임 삭제"${keys.length <= 2 ? " disabled" : ""}>${icon("close")}</button></div>`).join("")}
    <div class="conv" style="padding:4px 0 0"><button class="btn" type="button" data-cmd="addKey" data-anim="${i}">${icon("plus")}키프레임 추가</button></div>
  </div>`;
}

// VFX 한 개의 설정 카드. 입력의 data-fx로 몇 번째 효과인지 구분한다.
function fxCard(raw, i){
  const f = normFx(raw), e = EFFECT[f.effect], A = `data-fx="${i}"`;
  const id = k => `v${i}-${k}`;
  const num = (k, v, step, extra="") => `<input type="number" id="${id(k)}" data-prop="${k}" data-kind="num" ${A} step="${step}" value="${v}" ${extra}>`;
  const sld = (k, v, min, max, step) => slider(id(k), k, v, min, max, step, A);
  const opts = EFFECTS.map(x => `<option value="${x.id}"${x.id === f.effect ? " selected" : ""}>${esc(x.cat)} · ${esc(x.name)}</option>`).join("");
  return `<div class="anim-card fx-card">
    <div class="anim-head"><b>${esc(e.name)}</b><small>${esc(e.cat)}</small><button type="button" class="ib" data-fx-del="${i}" title="이 효과 삭제" aria-label="이 효과 삭제">${icon("close")}</button></div>
    ${row("효과", `<select id="${id("effect")}" data-prop="effect" data-kind="enum" ${A} data-rerender="1">${opts}</select>`)}
    ${row("지속 (ms)", num("duration", f.duration, 50, 'min="1"'))}
    ${row("지연 (ms)", num("delay", f.delay, 50, 'min="0"'))}
    ${row("반복 (0=무한)", num("iterations", f.iterations, 1, 'min="0"'))}
    ${row("강도", sld("intensity", f.intensity, 0, 3, 0.05))}
    ${row("속도", sld("speed", f.speed, 0.1, 5, 0.05))}
    ${e.density ? row("밀도", sld("density", f.density, 0, 4, 0.05)) : ""}
    ${e.color ? row(e.cat === "파괴" ? "색 (채우기 없을 때)" : e.color2 ? "색 (시작)" : "색", colorPair("color", f.color)) : ""}
    ${e.color2 ? row("색 (변화)", colorPair("color2", f.color2 || f.color)) : ""}
    ${e.gl ? glParamsSec(e, f, i) : ""}
    ${e.density || e.gl?.particles || e.cat === "글리치" || e.cat === "파괴" || e.id === "staticNoise" ? row("배치", `<button class="btn" type="button" data-cmd="reseed" data-fx="${i}">무작위 다시 배치</button>`) : ""}
  </div>`;
  function colorPair(k, v){ return `<input type="color" id="${id(k)}-c" data-prop="${k}" data-kind="color" ${A} value="${v}"><input type="text" id="${id(k)}" data-prop="${k}" data-kind="color" ${A} value="${v}" spellcheck="false">`; }
}

// WebGL 효과의 세부 값: 그 효과가 쓰는 값만 슬라이더로 보인다 (data-sub="p"로 f.p 안에 저장)
function glParamsSec(e, f, i){
  const ok = glHost().ok;
  return `<div class="gl-params">${e.params.map(k => { const [name, min, max, step] = GL_PARAMS[k]; return row(name, slider(`v${i}-p-${k}`, k, f.p[k], min, max, step, `data-fx="${i}" data-sub="p"`)); }).join("")}</div>
    <p class="note">${ok ? "WebGL2로 그립니다. 품질은 타임라인 위 '미리보기·높음·최고'에서 바꿉니다." : "이 브라우저는 WebGL2를 지원하지 않아 효과 색의 은은한 빛으로 대신 표시합니다. 내보낸 페이지도 WebGL2가 없는 브라우저에서는 같은 대체 그림을 보여 줍니다."}</p>`;
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

// 디자인 스타일: 키트를 켜고 끄는 칩. 원래 속성은 바뀌지 않으므로 끄면 원래 모양으로 돌아간다.
function kitSec(n, multi){
  const on = new Set(n.props.styleKits || []), hasKids = descendants(n.id).length > 0;
  return `<div class="sec"><h3>디자인 스타일 <small style="text-transform:none;letter-spacing:0">${on.size ? on.size + "개 사용" : "없음"}</small></h3>
    <div class="kits" role="group" aria-label="디자인 스타일">${STYLE_KITS.map(k => `<button type="button" data-kit="${k.id}" aria-pressed="${on.has(k.id)}" title="${esc(k.desc)}">${esc(k.name)}</button>`).join("")}</div>
    ${on.size ? `<p class="note">${STYLE_KITS.filter(k => on.has(k.id)).map(k => `<b>${esc(k.name)}</b> ${esc(k.desc)}`).join("<br>")}</p>` : ""}
    <p class="note">여러 개를 함께 켤 수 있습니다. 채우기·테두리·그림자 값과 내용은 그대로 두고 위에 덧입히므로, 끄면 원래 모양으로 돌아갑니다.${multi ? " 선택한 요소 전체에 적용됩니다." : ""}</p>
    ${hasKids ? `<div class="conv"><button class="btn" type="button" data-cmd="kitsDown">하위 요소에도 같은 스타일</button></div><p class="note">면이나 테두리가 있는 하위 요소에만 적용합니다 (글자만 있는 요소는 그대로).</p>` : ""}
  </div>`;
}

// 페이지의 인터랙션 모드: 켜고 끄는 칩과, 지금 브라우저에서의 지원 상태
function modeSec(){
  const on = new Set(state.project.page.modes || ["gui"]);
  return `<div class="sec"><h3>인터랙션 모드 <small style="text-transform:none;letter-spacing:0">${on.size}개 사용</small></h3>
    <div class="kits" role="group" aria-label="인터랙션 모드">${MODES.map(m => `<button type="button" data-mode="${m.id}" aria-pressed="${on.has(m.id)}" title="${esc(m.desc)}">${m.name}</button>`).join("")}</div>
    <div class="modes">${MODES.filter(m => on.has(m.id)).map(m => { const s = modeSupport(m.id);
      return `<div class="mode-row"><b>${m.name}</b><span>${esc(m.desc)}</span><em class="${s.ok ? "ok" : "sim"}">${esc(s.label)}</em></div>`; }).join("")}</div>
    <p class="note">여러 모드를 함께 켤 수 있습니다. 요소를 고르고 '인터랙션'에서 동작을 추가하면 내보낸 페이지(미리보기)에서 작동합니다. 지원 상태는 지금 이 브라우저 기준이며, 지원하지 않는 입력은 내보낸 페이지에서 시뮬레이션으로 표시됩니다.</p>
  </div>`;
}
// 요소의 동작 목록: 트리거(켠 모드의 것만) → 동작 → 대상 → 값
function actCard(x, i, n){
  const modes = state.project.page.modes || ["gui"], A = `data-act="${i}"`, tr = TRIGGER[x.on], ac = ACTION[x.do] || ACTIONS[0];
  const trig = MODES.filter(m => modes.includes(m.id) || (tr && tr.mode === m.id)).map(m => `<optgroup label="${m.name}${modes.includes(m.id) ? "" : " (꺼진 모드)"}">${TRIGGERS.filter(t => t.mode === m.id).map(t => `<option value="${t.id}"${t.id === x.on ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</optgroup>`).join("");
  const targets = [`<option value="">이 요소</option>`].concat(state.project.nodes.filter(m => m.id !== n.id).map(m => `<option value="${m.id}"${m.id === x.t ? " selected" : ""}>${esc(m.props.name)}</option>`)).join("");
  const off = tr && !modes.includes(tr.mode);
  return `<div class="anim-card act-card">
    <div class="anim-head"><b>${esc(tr ? tr.name : x.on)}</b><small>${tr ? MODES.find(m => m.id === tr.mode).name : ""}${off ? " · 꺼진 모드라 작동 안 함" : ""}</small><button type="button" class="ib" data-act-del="${i}" title="이 동작 삭제" aria-label="이 동작 삭제">${icon("close")}</button></div>
    ${row("언제", `<select id="x${i}-on" data-prop="on" data-kind="enum" ${A} data-rerender="1">${trig}</select>`)}
    ${tr && tr.v ? row(tr.v, `<input type="text" id="x${i}-v" data-prop="v" data-kind="text" ${A} value="${esc(x.v)}" placeholder="${esc(tr.ph)}">`) : ""}
    ${row("무엇을", `<select id="x${i}-do" data-prop="do" data-kind="enum" ${A} data-rerender="1">${ACTIONS.map(a => `<option value="${a.id}"${a.id === x.do ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</select>`)}
    ${ac.t ? row("대상", `<select id="x${i}-t" data-prop="t" data-kind="enum" ${A}>${targets}</select>`) : ""}
    ${ac.a ? row("값", `<input type="text" id="x${i}-a" data-prop="a" data-kind="text" ${A} value="${esc(x.a)}" placeholder="${esc(ac.a)}">`) : ""}
  </div>`;
}

const BLENDS = [["normal","보통"],["multiply","곱하기"],["screen","스크린"],["overlay","오버레이"],["darken","어둡게"],["lighten","밝게"],["color-dodge","색 닷지"],["color-burn","색 번"],
  ["hard-light","하드 라이트"],["soft-light","소프트 라이트"],["difference","차이"],["exclusion","제외"],["hue","색조"],["saturation","채도"],["color","색상"],["luminosity","광도"]];
// 슬라이더 + 숫자 입력 한 쌍. 슬라이더는 범위 안에서, 숫자 입력은 범위 밖 값도 받는다.
// 숫자 입력은 0 이상 범위면 최솟값을, 0~1 범위(불투명도 등)면 최댓값도 지킨다.
function slider(id, k, v, min, max, step, attrs = ""){
  const lim = (min >= 0 ? ` min="${min}"` : "") + (max === 1 ? ` max="1"` : "");
  return `<div class="rng"><input type="range" id="${id}-r" data-prop="${k}" data-kind="num" ${attrs} min="${min}" max="${max}" step="${step}" value="${v}" aria-label="${k} 슬라이더"><input type="number" id="${id}" data-prop="${k}" data-kind="num" ${attrs} step="${step}" value="${r3(v)}"${lim}></div>`;
}
const sldI = (p, v, min, max, step) => slider(`p-${p}`, p, v, min, max, step);
// 색 표기 (HEX · RGB · HSL): 어떤 표기로 입력해도 되고, 보여 줄 표기는 브라우저에 기억한다
const CFMT_KEY = "uiforge.web.colorfmt";
let cfmt = "hex";
try{ cfmt = localStorage.getItem(CFMT_KEY) || "hex"; }catch(e){}

const row = (label, ctl) => `<div class="row"><label>${label}</label><div class="ctl">${ctl}</div></div>`;
const numI = (p, v, step, extra="") => `<input type="number" id="p-${p}" data-prop="${p}" data-kind="num" step="${step}" value="${v}" ${extra}>`;
const txtI = (p, v) => `<input type="text" id="p-${p}" data-prop="${p}" data-kind="text" value="${esc(v)}">`;
const colI = (p, v) => `<input type="color" id="p-${p}-c" data-prop="${p}" data-kind="color" value="${v}"><input type="text" id="p-${p}" data-prop="${p}" data-kind="color" value="${fmtColor(v, cfmt)}" spellcheck="false" title="HEX · rgb() · hsl() 어느 표기든 입력할 수 있습니다">`;
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
    ${modeSec()}
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
    ${row("쌓는 순서", `<div class="zbar">${[["back","맨 뒤로"],["backward","뒤로"],["forward","앞으로"],["front","맨 앞으로"]].map(([k, l]) => `<button class="btn" type="button" data-z="${k}">${l}</button>`).join("")}</div>`)}
  </div>
  <div class="sec"><h3>위치 · 크기 · 변형</h3>
    ${row("X", unitI("x", p.x, p.xu))}
    ${row("Y", unitI("y", p.y, p.yu))}
    ${row("너비", unitI("w", p.w, p.wu))}
    ${row("높이", unitI("h", p.h, p.hu))}
    ${row("회전 (deg)", sldI("rotation", p.rotation, -180, 180, 1))}
    ${row("배율 X", sldI("scaleX", p.scaleX ?? 1, 0.05, 4, 0.01))}
    ${row("배율 Y", sldI("scaleY", p.scaleY ?? 1, 0.05, 4, 0.01))}
    ${row("불투명도", sldI("opacity", p.opacity, 0, 1, 0.01))}
    ${row("섞기 모드", enumI("blend", p.blend || "normal", BLENDS))}
    ${row("부모 안 배치", `<div class="grid9">${g9}</div>`)}
  </div>
  ${t.shape ? `<div class="sec"><h3>도형</h3>
    ${row("모양", `<select id="p-shape" data-prop="shape" data-kind="enum">${SHAPE_CATEGORIES.map(c => `<optgroup label="${c}">${SHAPES.filter(s => s.cat === c).map(s => `<option value="${s.id}"${s.id === p.shape ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</optgroup>`).join("")}</select>`)}
    <p class="note">왼쪽 '도형' 탭에서 모양을 골라 새로 넣을 수도 있습니다.</p>
  </div>` : ""}
  ${t.deco ? `<div class="sec"><h3>장식</h3>
    ${row("모양", `<select id="p-deco" data-prop="deco" data-kind="enum">${ORNAMENT_CATEGORIES.map(c => `<optgroup label="${c}">${ORNAMENTS.filter(o => o.cat === c).map(o => `<option value="${o.id}"${o.id === p.deco ? " selected" : ""}>${esc(o.name)}</option>`).join("")}</optgroup>`).join("")}</select>`)}
    ${row("선 두께 (px)", sldI("lineWidth", p.lineWidth, 0.5, 12, 0.1))}
  </div>` : ""}
  <div class="sec"><h3>${t.deco ? "색" : "채우기"}</h3>
    ${row("색", colI("fill", p.fill))}
    ${row("불투명도", sldI("fillAlpha", p.fillAlpha, 0, 1, 0.01))}
    ${row("색 표기", `<div class="seg" role="group">${[["hex","HEX"],["rgb","RGB"],["hsl","HSL"]].map(([v, l]) => `<button type="button" data-cfmt="${v}" aria-pressed="${cfmt === v}">${l}</button>`).join("")}</div>`)}
  </div>
  ${t.deco ? "" : `<div class="sec"><h3>${t.shape ? "선" : "모서리 · 테두리"}</h3>
    ${n.type === "ellipse" || t.shape ? "" : row("모서리 (px)", sldI("radius", p.radius, 0, 200, 1))}
    ${row("두께 (px)", slider("p-borderWidth", "borderWidth", p.borderWidth, 0, 20, 0.5, 'data-rerender="1"'))}
    ${p.borderWidth > 0 ? row("스타일", enumI("borderStyle", p.borderStyle, [["solid","실선"],["dashed","파선"],["dotted","점선"]].concat(t.shape ? [] : [["double","이중선"]]))) + row("색", colI("borderColor", p.borderColor)) : ""}
  </div>`}
  <div class="sec"><h3>그림자</h3>
    ${row("사용", boolI("shadowOn", p.shadowOn, 'data-rerender="1"'))}
    ${p.shadowOn ? row("X / Y", `<div class="ud">${numI("shadowX", p.shadowX, 1)}${numI("shadowY", p.shadowY, 1)}</div>`)
      + row("흐림", sldI("shadowBlur", p.shadowBlur, 0, 120, 1)) + (t.shape || t.deco ? "" : row("확산", sldI("shadowSpread", p.shadowSpread, -40, 60, 1)))
      + row("색", colI("shadowColor", p.shadowColor)) + row("불투명도", sldI("shadowAlpha", p.shadowAlpha, 0, 1, 0.01)) : ""}
  </div>
  <div class="sec"><h3>글로우</h3>
    ${row("사용", boolI("glowOn", p.glowOn, 'data-rerender="1"'))}
    ${p.glowOn ? row("색", colI("glowColor", p.glowColor)) + row("흐림", sldI("glowBlur", p.glowBlur, 0, 120, 1))
      + (t.text || t.shape || t.deco ? "" : row("확산", sldI("glowSpread", p.glowSpread, -20, 60, 1)))
      + row("불투명도", sldI("glowAlpha", p.glowAlpha, 0, 1, 0.01)) : ""}
    ${p.glowOn ? `<p class="note">${t.text ? "글자 둘레에 빛을 냅니다." : t.shape || t.deco ? "모양 테두리를 따라 빛을 냅니다." : "상자 둘레에 빛을 냅니다."}</p>` : ""}
  </div>`;
  if(kitAllowed(t)) h += kitSec(n, multi);
  if(t.container) h += `<div class="sec"><h3>레이아웃</h3>${row("넘침 자르기", boolI("clip", p.clip))}</div>`;
  if(t.text){
    h += `<div class="sec"><h3>텍스트</h3>
      ${row("내용", `<textarea id="p-text" data-prop="text" data-kind="text" rows="3">${esc(p.text)}</textarea>`)}
      ${row("글꼴", enumI("font", p.font, FONTS.map(f => [f, f.replace(/"/g,"")])))}
      ${row("크기 (px)", sldI("fontSize", p.fontSize, 6, 200, 1))}
      ${row("굵기", enumI("fontWeight", p.fontWeight, [[300,"300 Light"],[400,"400 Regular"],[500,"500 Medium"],[600,"600 SemiBold"],[700,"700 Bold"],[900,"900 Black"]]))}
      ${row("줄 간격", sldI("lineHeight", p.lineHeight, 0.6, 3, 0.05))}
      ${row("자간 (px)", sldI("letterSpacing", p.letterSpacing, -5, 30, 0.5))}
      ${row("색", colI("color", p.color))}
      ${row("가로 정렬", segI("align", p.align, [["left","왼쪽"],["center","가운데"],["right","오른쪽"]]))}
      ${row("세로 정렬", segI("valign", p.valign, [["top","위"],["center","가운데"],["bottom","아래"]]))}
    </div>`;
  }
  h += `<div class="sec"><h3>애니메이션 <small style="text-transform:none;letter-spacing:0">${(p.anims||[]).length}개</small></h3>
    ${(p.anims||[]).map(animCard).join("")}
    <div class="conv"><button class="btn" type="button" data-cmd="addAnim">${icon("plus")}애니메이션 추가</button></div>
    <p class="note">여러 개를 넣으면 같은 속성(예: 위치·크기)은 아래쪽 애니메이션이 우선합니다. 위쪽 타임라인에서 재생해 확인하세요.</p>
  </div>`;
  h += `<div class="sec"><h3>VFX <small style="text-transform:none;letter-spacing:0">${(p.fx||[]).length}개</small></h3>
    ${(p.fx||[]).map(fxCard).join("")}
    <div class="conv"><button class="btn" type="button" data-cmd="addFx">${icon("plus")}VFX 추가</button></div>
    <p class="note">편집 중에는 효과의 한 장면만 멈춰 보입니다. 파괴처럼 요소 자체가 바뀌는 효과는 타임라인에서 재생할 때 나타납니다.</p>
  </div>`;
  h += `<div class="sec"><h3>인터랙션 <small style="text-transform:none;letter-spacing:0">${(p.actions||[]).length}개</small></h3>
    ${(p.actions||[]).map((x, i) => actCard(x, i, n)).join("")}
    <div class="conv"><button class="btn" type="button" data-cmd="addAct">${icon("plus")}동작 추가</button></div>
    <p class="note">켜 둔 인터랙션 모드(${(state.project.page.modes || ["gui"]).map(m => MODES.find(x => x.id === m)?.name).join(", ")})의 트리거를 쓸 수 있습니다. 모드는 빈 곳을 눌러 페이지 설정에서 바꿉니다. 동작은 '미리보기'나 내보낸 HTML에서 작동합니다.</p>
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
  if(scope && t.dataset.key !== undefined){ scope.keys = (scope.keys || DEFAULT_KEYS()).map(k => ({...k})); scope = scope.keys[+t.dataset.key]; if(!scope) return false; }
  if(scope && t.dataset.act !== undefined) scope = scope.actions[+t.dataset.act];
  if(scope && t.dataset.fx !== undefined){ scope.fx[+t.dataset.fx] = normFx(scope.fx[+t.dataset.fx]); scope = scope.fx[+t.dataset.fx]; }
  if(scope && t.dataset.sub) scope = scope[t.dataset.sub] ||= {};
  if(!scope) return false;
  const k = t.dataset.kind, p = t.dataset.prop;
  // 효과를 바꾸면 그 효과의 기본 타이밍으로 맞추고 지연·강도·속도·색은 유지한다
  if(t.dataset.anim !== undefined && p === "preset"){
    const keep = {delay:scope.delay, intensity:scope.intensity, speed:scope.speed, color:scope.color};
    Object.assign(scope, newAnim(t.value), keep); return true;
  }
  // VFX 종류를 바꾸면 그 효과의 기본값으로 맞추고 지연·강도·속도·밀도·배치는 유지한다
  if(t.dataset.fx !== undefined && p === "effect"){
    const keep = {delay:scope.delay, intensity:scope.intensity, speed:scope.speed, density:scope.density, seed:scope.seed};
    Object.assign(scope, newFx(t.value), keep); return true;
  }
  if(k === "num"){
    let v = parseFloat(t.value); if(isNaN(v)) return false;
    if(t.min !== "" && t.type !== "range") v = Math.max(+t.min, v); if(t.max !== "" && t.type !== "range") v = Math.min(+t.max, v);
    scope[p] = v;
    // 같은 칸의 슬라이더와 숫자 입력을 맞춘다
    t.closest(".ctl, .keys-r")?.querySelectorAll(`[data-prop="${p}"][data-kind="num"]`).forEach(o => { if(o !== t) o.value = o.type === "range" ? v : r3(v); });
  } else if(k === "text"){ if(p === "src" && t.value === "(올린 파일)") return false; scope[p] = t.value; }
  else if(k === "color"){
    const v = parseColor(t.value); if(!v) return false;
    scope[p] = v;
    t.closest(".ctl").querySelectorAll(`[data-prop="${p}"][data-kind="color"]`).forEach(o => { if(o !== t) o.value = o.type === "color" ? v : fmtColor(v, cfmt); });
  }
  else if(k === "easing"){ const v = t.value.trim(); if(!v || !CSS.supports("transition-timing-function", v)) return false; scope[p] = v; }
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
    if(applyField(t)){ t.dataset.scope === "page" ? renderCanvas() : refreshNodes([state.sel]); if(["name","visible","locked"].includes(t.dataset.prop)) view.tree(); if(t.dataset.anim !== undefined || t.dataset.fx !== undefined) view.timeline(); view.status(); }
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
    const cf = e.target.closest("[data-cfmt]");
    if(cf){ cfmt = cf.dataset.cfmt; try{ localStorage.setItem(CFMT_KEY, cfmt); }catch(err){} renderProps(); return; }
    const md = e.target.closest("[data-mode]");
    if(md){ commit(() => { const pg = state.project.page, s = new Set(pg.modes || ["gui"]); s.has(md.dataset.mode) ? s.delete(md.dataset.mode) : s.add(md.dataset.mode); pg.modes = MODES.map(m => m.id).filter(m => s.has(m)); }); return; }
    const a = e.target.closest("[data-align]"), sg = e.target.closest("[data-seg]"), al = e.target.closest("[data-al]"), cmd = e.target.closest("[data-cmd]");
    const n = get(state.sel); if(!n) return;
    if(al){ const k = al.dataset.al; k === "dh" ? distribute("h") : k === "dv" ? distribute("v") : align(k); return; }
    const del = e.target.closest("[data-anim-del]");
    if(del){ commit(() => n.props.anims.splice(+del.dataset.animDel, 1)); return; }
    const z = e.target.closest("[data-z]");
    if(z){ zOrder(n, z.dataset.z); return; }
    const kdel = e.target.closest("[data-key-del]");
    if(kdel){ commit(() => { const a = n.props.anims[+kdel.dataset.anim]; if(a && a.keys && a.keys.length > 2) a.keys.splice(+kdel.dataset.keyDel, 1); }); return; }
    const xdel = e.target.closest("[data-act-del]");
    if(xdel){ commit(() => n.props.actions.splice(+xdel.dataset.actDel, 1)); return; }
    const fdel = e.target.closest("[data-fx-del]");
    if(fdel){ commit(() => n.props.fx.splice(+fdel.dataset.fxDel, 1)); return; }
    if(cmd){
      const c = cmd.dataset.cmd;
      if(c === "group") group(); else if(c === "ungroup") ungroup();
      else if(c === "addAnim") view.showView("motion"); else if(c === "addFx") view.showView("fx");
      else if(c === "addKey") commit(() => {
        const a = n.props.anims[+cmd.dataset.anim]; if(!a) return;
        // 마지막 두 키프레임 사이 가운데에 새 키프레임을 넣는다 (값은 앞 키프레임을 따른다)
        const ks = (a.keys || DEFAULT_KEYS()).slice().sort((x, y) => x.o - y.o), last = ks[ks.length - 1], prev = ks[ks.length - 2] || {o:0};
        ks.splice(ks.length - 1, 0, {...prev, o:Math.round((prev.o + last.o) / 2)}); a.keys = ks;
      });
      else if(c === "addAct") commit(() => (n.props.actions ||= []).push(newAction((state.project.page.modes || ["gui"])[0])));
      else if(c === "kitsDown") commit(() => { for(const d of descendants(n.id).map(get)){
        const q = d.props; if(kitAllowed(TYPES[d.type]) && (q.fillAlpha > 0 || q.borderWidth > 0)) q.styleKits = [...(n.props.styleKits || [])];
      } });
      else if(c === "reseed") commit(() => { const f = n.props.fx[+cmd.dataset.fx]; if(f) f.seed = Math.floor(Math.random()*1e9); });
      return;
    }
    if(sg){ commit(() => n.props[sg.dataset.seg] = sg.dataset.val); return; }
    const kit = e.target.closest("[data-kit]");
    if(kit){
      const id = kit.dataset.kit, add = !(n.props.styleKits || []).includes(id);
      commit(() => { for(const s of state.sels.map(get)) if(s && kitAllowed(TYPES[s.type])){
        const ks = new Set(s.props.styleKits || []); add ? ks.add(id) : ks.delete(id); s.props.styleKits = [...ks];
      } });
      return;
    }
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

// 같은 부모 안에서 쌓는 순서를 바꾼다 (배열 뒤쪽이 위에 그려진다)
function zOrder(n, how){
  const arr = state.project.nodes, sibs = arr.filter(x => x.parent === n.parent), i = sibs.indexOf(n);
  const j = Math.max(0, Math.min(sibs.length - 1, how === "back" ? 0 : how === "front" ? sibs.length - 1 : i + (how === "forward" ? 1 : -1)));
  if(j === i) return;
  commit(() => { arr.splice(arr.indexOf(n), 1); const b = arr.indexOf(sibs[j]) + (j > i ? 1 : 0); arr.splice(b, 0, n); });
}

function loadFile(input){
  const f = input.files[0], n = get(state.sel); if(!f || !n) return;
  const rd = new FileReader();
  rd.onload = () => { commit(() => n.props.src = rd.result); toast("이미지를 넣었습니다"); };
  rd.readAsDataURL(f);
}
