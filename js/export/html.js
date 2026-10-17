/* 프로젝트 → 독립 실행 HTML/CSS. 요소는 페이지 컨테이너 안에 절대 위치로 배치하고, 단위(px/%)는 편집기와 같게 유지한다. */
import { TYPES, state, geo, kidsMap } from "../core/state.js";
import { build } from "../fx/presets.js";
import { buildFx, containerCSS } from "../fx/vfx.js";
import { ANGLE, ANGLE_RULE } from "../fx/vfx-util.js";
import { shapeOf, shapeFill, shapeShadow } from "../shapes/shapes.js";
import { ornamentOf, ornColor, ORN_CSS } from "../shapes/ornaments.js";
import { boxLook } from "../core/styles.js";

const escH = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const num = v => String(+(+v).toFixed(3));
const kebab = s => s.replace(/[A-Z]/g, m => "-" + m.toLowerCase());

// 편집기와 같은 키프레임을 CSS @keyframes로 옮긴다. offset이 없으면 고르게 나눈다.
function keyframesCSS(name, kfs){
  const n = kfs.length;
  return `@keyframes ${name}{` + kfs.map((k, i) => {
    const off = k.offset ?? (n === 1 ? 1 : i / (n - 1));
    const decl = Object.entries(k).filter(([p]) => p !== "offset").map(([p, v]) => p === "easing" ? `animation-timing-function:${v}` : `${kebab(p)}:${v}`).join(";");
    return `${+(off*100).toFixed(2)}%{${decl}}`;
  }).join("") + "}";
}
function animations(n, cls){
  const list = n.props.anims || [];
  if(!list.length || !n.props.visible) return {parts:[], blocks:[]};
  const blocks = [], parts = [];
  list.forEach((a, i) => {
    const {keyframes, timing:t} = build(n.props, a), name = `${cls}-a${i+1}`;
    blocks.push(keyframesCSS(name, keyframes));
    parts.push(animDecl(name, t));
  });
  return {parts, blocks};
}

const animDecl = (name, t) => `${name} ${num(t.duration)}ms ${t.easing} ${num(t.delay)}ms ${isFinite(t.iterations) ? t.iterations : "infinite"} ${t.direction} ${t.fill}`;
/* VFX: 요소 안 컨테이너(.cls-v1)와 레이어(.cls-v1-1 …)의 규칙, 요소 자체 애니메이션(self).
   같은 키프레임은 한 번만 내보낸다. box는 편집기에서 계산한 요소 크기 (파편 개수 등 배치에만 쓰인다). */
function effects(n, cls, box){
  const list = n.props.visible ? n.props.fx || [] : [], rules = [], blocks = [], self = [], html = [];
  list.forEach((f, i) => {
    const b = buildFx(n.props, f, box), c = `${cls}-v${i+1}`, seen = new Map();
    rules.push(`.${c}{${containerCSS(n.props, b.clip)}}`, `.${c}>i{position:absolute;display:block}`);
    b.layers.forEach((l, j) => {
      let decl = l.css;
      if(l.keyframes){
        const key = JSON.stringify(l.keyframes);
        if(!seen.has(key)){ seen.set(key, `${c}-k${seen.size + 1}`); blocks.push(keyframesCSS(seen.get(key), l.keyframes)); }
        decl += ";animation:" + animDecl(seen.get(key), l.timing);
      }
      rules.push(`.${c}-${j+1}{${decl}}`);
    });
    if(b.self){ blocks.push(keyframesCSS(`${c}-s`, b.self.keyframes)); self.push(animDecl(`${c}-s`, b.self.timing)); }
    html.push(`<div class="${c}" aria-hidden="true">${b.layers.map((_, j) => `<i class="${c}-${j+1}"></i>`).join("")}</div>`);
  });
  return {rules, blocks, self, html:html.join("")};
}

// 이름에서 CSS 클래스 이름을 만든다. 영문이 없으면 유형+번호를 쓴다.
function classNames(nodes){
  const used = new Set(["page"]), map = {}, count = {};
  for(const n of nodes){
    let base = n.props.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if(!base || /^\d/.test(base)) base = n.type + "-" + (count[n.type] = (count[n.type]||0) + 1);
    let k = base, i = 2;
    while(used.has(k)) k = base + "-" + i++;
    used.add(k); map[n.id] = k;
  }
  return map;
}

export function rules(n){
  const p = n.props, t = TYPES[n.type], r = [];
  r.push("position:absolute", `left:${num(p.x)}${p.xu}`, `top:${num(p.y)}${p.yu}`, `width:${num(p.w)}${p.wu}`, `height:${num(p.h)}${p.hu}`);
  if(!t.shape && !t.deco){ // 도형·장식은 SVG가 채우기·선·그림자를 맡는다 (shapeRules, decoRules)
    for(const [k, v] of Object.entries(boxLook(n))) r.push(`${k}:${v}`); // 디자인 스타일 키트 포함
  }
  if(p.opacity < 1) r.push(`opacity:${num(p.opacity)}`);
  if(p.rotation) r.push(`transform:rotate(${num(p.rotation)}deg)`);
  if(p.clip) r.push("overflow:hidden");
  if(t.text){
    r.push("flex-direction:column", `justify-content:${{top:"flex-start",center:"center",bottom:"flex-end"}[p.valign]}`,
      `font-family:${p.font}, sans-serif`, `font-size:${num(p.fontSize)}px`, `font-weight:${p.fontWeight}`, `line-height:${num(p.lineHeight)}`,
      `color:${p.color}`, `text-align:${p.align}`, "white-space:pre-wrap");
    if(p.letterSpacing) r.push(`letter-spacing:${num(p.letterSpacing)}px`);
  }
  if(!p.visible) r.push("display:none");
  else if(t.text) r.push("display:flex");
  return r;
}

// 도형: SVG를 상자에 꽉 채우고 path에 채우기·선을 준다
function shapeRules(n, cls){
  const p = n.props, f = shapeShadow(p), r = [`.${cls}>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible${f ? `;filter:${f}` : ""}}`];
  const path = [`fill:${shapeFill(p)}`];
  if(p.borderWidth > 0){
    const w = num(p.borderWidth);
    path.push(`stroke:${p.borderColor}`, `stroke-width:${w}px`, "stroke-linejoin:round", "vector-effect:non-scaling-stroke");
    if(p.borderStyle === "dashed") path.push(`stroke-dasharray:${w * 3}px ${w * 2}px`);
    if(p.borderStyle === "dotted") path.push(`stroke-dasharray:0 ${w * 2}px`, "stroke-linecap:round");
  }
  if(shapeOf(p.shape).evenodd) path.push("fill-rule:evenodd");
  r.push(`.${cls}>svg path{${path.join(";")}}`);
  return r;
}
// 장식: 색과 선 두께를 svg에 주고, 선·면 모양은 공용 규칙(ORN_CSS)이 맡는다
function decoRules(n, cls){
  const p = n.props, o = ornamentOf(p.deco), f = shapeShadow(p);
  return [`.${cls}>svg{position:absolute;inset:0;width:100%;height:100%;overflow:${o.clip ? "hidden" : "visible"};color:${ornColor(p)};--sw:${num(p.lineWidth)}px${f ? `;filter:${f}` : ""}}`];
}
const decoHTML = p => { const o = ornamentOf(p.deco); return `<svg viewBox="0 0 ${o.vb[0]} ${o.vb[1]}" preserveAspectRatio="none" aria-hidden="true">${o.svg}</svg>`; };
const shapeHTML = p => `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${shapeOf(p.shape).d}"/></svg>`;

// 요소 크기: 편집기가 계산해 둔 값을 쓰고, 없으면 px 값 또는 기본값
const boxOf = n => (geo.L && geo.L[n.id]) || {w:n.props.wu === "px" ? n.props.w : 100, h:n.props.hu === "px" ? n.props.h : 100};
export function exportCSS(){
  const P = state.project, cls = classNames(P.nodes), km = kidsMap();
  const out = [`*,*::before,*::after{box-sizing:border-box}`, `body{margin:0;background:${P.page.bg}}`,
    `.page{position:relative;width:100%;max-width:${state.device}px;height:${num(P.page.height)}px;margin:0 auto;background:${P.page.bg};overflow:hidden}`];
  const frames = [];
  (function w(pid){
    for(const n of km[pid]||[]){
      const an = animations(n, cls[n.id]), fx = effects(n, cls[n.id], boxOf(n)), r = rules(n);
      const parts = [...an.parts, ...fx.self];
      if(parts.length) r.push(`animation:${parts.join(",")}`);
      frames.push(...an.blocks, ...fx.blocks);
      out.push(`/* ${n.props.name.replace(/\*\//g, "")} */\n.${cls[n.id]}{${r.join(";")}}`, ...fx.rules);
      if(TYPES[n.type].shape) out.push(...shapeRules(n, cls[n.id]));
      if(TYPES[n.type].deco) out.push(...decoRules(n, cls[n.id]));
      if(TYPES[n.type].image) out.push(`.${cls[n.id]} img{display:block;width:100%;height:100%;object-fit:${n.props.fit};border-radius:inherit}`);
      w(n.id);
    }
  })("_");
  if(frames.length) out.push(...frames, `@media (prefers-reduced-motion:reduce){.page *{animation:none!important}}`);
  if(P.nodes.some(n => TYPES[n.type].deco)) out.splice(3, 0, ORN_CSS);
  const css = out.join("\n");
  return css.includes(ANGLE) ? ANGLE_RULE + "\n" + css : css;
}

export function exportHTML(){
  const P = state.project, cls = classNames(P.nodes), km = kidsMap(), lines = [];
  (function w(pid, depth){
    const pad = "  ".repeat(depth);
    for(const n of km[pid]||[]){
      const p = n.props, t = TYPES[n.type];
      const inner = t.text ? escH(p.text) : t.image && p.src ? `<img src="${escH(p.src)}" alt="">` : t.shape ? shapeHTML(p) : t.deco ? decoHTML(p) : "";
      const kids = km[n.id], fx = effects(n, cls[n.id], boxOf(n)).html;
      if(kids && kids.length){
        lines.push(`${pad}<div class="${cls[n.id]}">${inner}`);
        w(n.id, depth+1);
        if(fx) lines.push(`${pad}  ${fx}`);
        lines.push(`${pad}</div>`);
      } else lines.push(`${pad}<div class="${cls[n.id]}">${inner}${fx}</div>`);
    }
  })("_", 2);
  return lines.join("\n");
}

// Google Fonts에서 글꼴마다 제공하는 굵기 (없는 굵기를 요청하면 전체 요청이 실패한다)
const FONT_WEIGHTS = {"IBM Plex Sans KR":[300,400,500,600,700], "Noto Sans KR":[300,400,500,700,900], "Montserrat":[300,400,500,600,700,900], "Inter":[300,400,500,600,700,900],
  "JetBrains Mono":[400,500,700], "Orbitron":[400,500,700,900], "Cinzel":[400,600,700], "Noto Serif KR":[400,700]};

// 웹 폰트 링크를 포함한 단독 HTML 문서
export function exportDocument(){
  const P = state.project, used = {};
  for(const n of P.nodes) if(TYPES[n.type].text){ const f = n.props.font.replace(/"/g, ""); if(FONT_WEIGHTS[f]) (used[f] ||= new Set()).add(n.props.fontWeight); }
  // 쓰인 굵기 중 제공되는 것만, 없으면 가장 가까운 굵기로 요청
  const g = Object.keys(used).map(f => {
    const ok = FONT_WEIGHTS[f], ws = [...new Set([...used[f]].map(w => ok.reduce((a,b) => Math.abs(b-w) < Math.abs(a-w) ? b : a)))].sort((a,b) => a-b);
    return "family=" + f.replace(/ /g, "+") + ":wght@" + ws.join(";");
  });
  const link = g.length ? `\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${g.join("&")}&display=swap">` : "";
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escH(P.name)}</title>${link}
<style>
${exportCSS()}
</style>
</head>
<body>
  <div class="page">
${exportHTML()}
  </div>
</body>
</html>
`;
}
