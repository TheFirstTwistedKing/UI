/* VFX 정의에서 함께 쓰는 도구 (vfx.js와 vfx-lib/*.js) */

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const f2 = v => +(+v).toFixed(2);
export const hexA = (hex, a) => { const h = hex.replace("#",""); const [r,g,b] = [0,2,4].map(i => parseInt(h.substr(i,2),16) || 0); return `rgba(${r},${g},${b},${f2(clamp(a,0,1))})`; };
export function rng(seed){
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const STEP = "steps(1, end)";
// 깜빡이는 구간 목록 [[시작, 끝], ...]을 계단식 키프레임으로 바꾼다
export const flicker = (wins, on, off) => {
  const k = [{offset:0, ...off, easing:STEP}];
  for(const [a, b] of wins){ k.push({offset:f2(a), ...on, easing:STEP}, {offset:f2(b), ...off, easing:STEP}); }
  k.push({offset:1, ...off});
  return k;
};
// first를 주면 첫 구간이 그 시점에 시작한다 (편집 화면 정지 장면에 보이도록)
export const windows = (rnd, n, len, first) => {
  const w = []; let t = first ?? rnd() * .2;
  for(let i = 0; i < n && t < .95; i++){ const l = len * (.5 + rnd()); w.push([t, Math.min(.99, t + l)]); t += l + .02 + rnd() * (.9 / n); }
  return w;
};
export const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.6 -.35'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
// SVG 문자열을 CSS 배경 이미지로 (SVG 안 속성은 작은따옴표를 쓴다)
export const svgUrl = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
// 테두리 두께 g만 남기는 마스크 (안쪽을 비운다)
export const ringMask = g => `padding:${f2(g)}px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude`;
// 요소 가운데에 놓는 정사각형 (너비 기준 s%). 위치는 translate 속성으로 맞추고 transform은 애니메이션에 남겨 둔다.
export const centered = s => `left:50%;top:50%;width:${f2(s)}%;aspect-ratio:1;translate:-50% -50%`;
// % 좌표 위치 키프레임 값
export const at = (x, y) => ({left:`${f2(x)}%`, top:`${f2(y)}%`});
// 0~1 사이 값 목록을 고르게 나눈 offset 키프레임으로
export const seq = (vals, fn) => vals.map((v, i) => ({offset:f2(i / (vals.length - 1)), ...fn(v, i)}));
// 사각형 둘레를 따라 도는 경로 (왼쪽 위에서 시계 방향). 요소 비율에 맞춰 각 변에 걸리는 시간을 나눈다.
export function perimeter(w, h, inset = 0){
  const W = Math.max(1, w), H = Math.max(1, h), P = 2 * (W + H), a = W / P, b = (W + H) / P, c = (2 * W + H) / P, o = inset, e = 100 - inset;
  return [[0, o, o], [a, e, o], [b, e, e], [c, o, e], [1, o, o]].map(([t, x, y]) => ({offset:f2(t), ...at(x, y)}));
}
// 원뿔 그라디언트 회전용 각도 사용자 속성. 편집기는 CSS.registerProperty로, 내보내기는 @property로 등록한다.
export const ANGLE = "--vfx-a";
export const ANGLE_RULE = `@property ${ANGLE}{syntax:"<angle>";inherits:false;initial-value:0deg}`;
export function registerAngle(){ try{ CSS.registerProperty({name:ANGLE, syntax:"<angle>", inherits:false, initialValue:"0deg"}); }catch(e){} }
