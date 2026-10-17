/* 색 표기 변환: HEX(#rrggbb, #rgb) · rgb(r, g, b) · hsl(h, s%, l%) 를 읽어 #rrggbb로 저장하고, 원하는 표기로 보여 준다.
   투명도는 각 속성의 '불투명도' 값이 따로 맡는다. */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hex = c => "#" + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

function hsl2rgb(h, s, l){
  h = ((h % 360) + 360) % 360 / 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  if(!s) return [l * 255, l * 255, l * 255];
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1/6 ? p + (q - p) * 6 * t : t < 1/2 ? q : t < 2/3 ? p + (q - p) * (2/3 - t) * 6 : p; };
  return [f(h + 1/3) * 255, f(h) * 255, f(h - 1/3) * 255];
}
function rgb2hsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if(!d) return [0, 0, l * 100];
  const s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

// 입력 문자열 → "#rrggbb" (알아볼 수 없으면 null)
export function parseColor(str){
  const v = String(str).trim().toLowerCase();
  let m;
  if((m = v.match(/^#?([0-9a-f]{6})$/))) return "#" + m[1];
  if((m = v.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/))) return "#" + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
  const nums = (v.match(/-?\d*\.?\d+/g) || []).map(Number);
  if(/^hsla?\(/.test(v) && nums.length >= 3) return hex(hsl2rgb(nums[0], nums[1], nums[2]));
  if((/^rgba?\(/.test(v) || /^\d/.test(v)) && nums.length >= 3) return hex(nums.slice(0, 3));
  return null;
}
// "#rrggbb" → 지정한 표기
export function fmtColor(h, fmt){
  const c = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) || 0);
  if(fmt === "rgb") return `rgb(${c.join(", ")})`;
  if(fmt === "hsl"){ const [H, S, L] = rgb2hsl(...c); return `hsl(${Math.round(H)}, ${Math.round(S)}%, ${Math.round(L)}%)`; }
  return h;
}
