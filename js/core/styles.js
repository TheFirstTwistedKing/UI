/* 디자인 스타일 키트: 요소의 원래 속성(채우기·모서리·테두리·그림자)은 그대로 두고, 그 위에 스타일을 덧입혀 상자 모양을 계산한다.
   여러 키트를 함께 켤 수 있고, 켠 순서와 상관없이 항상 아래 목록 순서대로 겹친다. 키트를 끄면 원래 모양으로 돌아간다.
   편집기 화면(canvas.paint)과 내보내기(export rules)가 같은 함수를 쓴다. */
import { rgba } from "./state.js";

export const STYLE_KITS = [
  {id:"flat", name:"플랫", desc:"그림자와 입체감을 빼고 단색 면만 남깁니다."},
  {id:"material", name:"머티리얼", desc:"작은 모서리와 두 겹의 부드러운 그림자로 떠 있는 종이처럼 보이게 합니다."},
  {id:"skeuo", name:"스큐어모피즘", desc:"위는 밝고 아래는 어두운 광택, 안쪽 하이라이트, 진한 테두리로 실물 버튼처럼 만듭니다."},
  {id:"neumorph", name:"뉴모피즘", desc:"면 색에서 밝은 그림자와 어두운 그림자를 뽑아 바탕에서 튀어나온 것처럼 만듭니다."},
  {id:"glass", name:"글래스모피즘", desc:"반투명한 면, 뒤 배경 흐림, 얇은 빛 테두리로 유리판처럼 만듭니다."},
  {id:"brutal", name:"네오 브루탈리즘", desc:"굵은 검은 테두리와 흐림 없는 단단한 그림자를 씌웁니다."},
];
export const KIT_ORDER = STYLE_KITS.map(k => k.id);
// 키트를 적용할 수 있는 유형: 상자 모양이 있는 요소 (도형·장식은 SVG가 모양을 맡아 제외)
export const kitAllowed = t => !t.shape && !t.deco;

const hex2 = h => { const s = h.replace("#", ""); return [0, 2, 4].map(i => parseInt(s.substr(i, 2), 16) || 0); };
const toHex = c => "#" + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const mix = (h, to, t) => { const a = hex2(h), b = hex2(to); return toHex(a.map((v, i) => v + (b[i] - v) * t)); };
const num = v => String(+(+v).toFixed(3));

/* 상자 모양 계산. 돌려주는 값은 CSS 속성 이름(kebab) → 값. 값이 없는 속성은 빠진다. */
export function boxLook(n){
  const p = n.props, ellipse = n.type === "ellipse", kits = new Set(p.styleKits || []);
  let color = p.fillAlpha > 0 ? (p.fillAlpha >= 1 ? p.fill : rgba(p.fill, p.fillAlpha)) : null;
  let radius = ellipse ? "50%" : p.radius > 0 ? num(p.radius) + "px" : null;
  let border = p.borderWidth > 0 ? `${num(p.borderWidth)}px ${p.borderStyle} ${p.borderColor}` : null;
  let shadows = p.shadowOn ? [`${num(p.shadowX)}px ${num(p.shadowY)}px ${num(p.shadowBlur)}px ${num(p.shadowSpread)}px ${rgba(p.shadowColor, p.shadowAlpha)}`] : [];
  const images = [];
  let backdrop = null;
  const minRadius = r => { if(!ellipse && (!radius || parseFloat(radius) < r)) radius = r + "px"; };

  for(const k of KIT_ORDER){
    if(!kits.has(k)) continue;
    if(k === "flat"){ shadows = []; images.length = 0; }
    if(k === "material"){
      minRadius(4);
      shadows.push("0 1px 3px rgba(0,0,0,.3)", "0 4px 12px rgba(0,0,0,.22)");
    }
    if(k === "skeuo"){
      images.push("linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,0) 48%,rgba(0,0,0,.2))");
      shadows.push("inset 0 1px 0 rgba(255,255,255,.35)", "inset 0 -2px 4px rgba(0,0,0,.25)", "0 2px 5px rgba(0,0,0,.45)");
      if(!border) border = `1px solid ${mix(p.fill, "#000000", .45)}`;
    }
    if(k === "neumorph"){
      minRadius(16);
      color = p.fill;
      shadows.push(`8px 8px 18px ${rgba(mix(p.fill, "#000000", .55), .7)}`, `-8px -8px 18px ${rgba(mix(p.fill, "#ffffff", .16), .55)}`);
    }
    if(k === "glass"){
      color = rgba(p.fill, Math.min(p.fillAlpha || .16, .16));
      images.push("linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,.03))");
      backdrop = "blur(14px) saturate(140%)";
      if(!border) border = "1px solid rgba(255,255,255,.24)";
      shadows.push("0 8px 32px rgba(0,0,0,.35)");
    }
    if(k === "brutal"){
      border = "3px solid #000000";
      shadows = shadows.filter(s => s.startsWith("inset")).concat("6px 6px 0 0 #000000");
    }
  }
  // 글로우: 키트와 상관없이 마지막에 더한다 (텍스트는 글자 그림자로 따로 처리)
  if(p.glowOn && n.type !== "text") shadows.push(`0 0 ${num(p.glowBlur)}px ${num(p.glowSpread)}px ${rgba(p.glowColor, p.glowAlpha)}`);
  const out = {};
  if(images.length) out.background = images.join(",") + (color ? "," + color : "");
  else if(color) out.background = color;
  if(radius) out["border-radius"] = radius;
  if(border) out.border = border;
  if(shadows.length) out["box-shadow"] = shadows.join(",");
  if(backdrop){ out["backdrop-filter"] = backdrop; out["-webkit-backdrop-filter"] = backdrop; }
  return out;
}
