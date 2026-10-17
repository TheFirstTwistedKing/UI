/* 애니메이션 프리셋. 각 프리셋은 강도(I)와 요소 정보(c)를 받아 키프레임을 만든다.
   - transform은 요소의 기본 회전을 앞에 붙여(T) 애니메이션 중에도 회전이 유지되게 한다.
   - opacity는 요소의 기본 불투명도(c.op)를 기준으로 한다.
   - 키프레임 일부에만 offset을 줄 때는 모든 키프레임에 offset을 준다 (CSS 변환 단순화). */

const EASE = { out:"cubic-bezier(.16,1,.3,1)", back:"cubic-bezier(.34,1.56,.64,1)", inout:"ease-in-out", in:"cubic-bezier(.5,0,.75,0)" };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hexA = (hex, a) => { const h = hex.replace("#",""); const [r,g,b] = [0,2,4].map(i => parseInt(h.substr(i,2),16) || 0); return `rgba(${r},${g},${b},${a})`; };

import { extraPresets } from "./anim-library.js";
import { baseTransform } from "../core/state.js";

export const CATEGORIES = ["직접 만들기", "등장", "퇴장", "강조", "이동", "회전", "크기", "변형", "페이드", "글로우", "색·필터", "진동", "파동", "궤도", "디지털 전환", "홀로그램", "글리치"];

export const PRESETS = [
  {id:"fadeIn", name:"페이드 인", cat:"등장", d:{duration:600, easing:"ease-out", iterations:1, fill:"both"},
    kf:(I,c) => [{opacity:0}, {opacity:c.op}]},
  {id:"riseIn", name:"떠오르며 등장", cat:"등장", d:{duration:700, easing:EASE.out, iterations:1, fill:"both"},
    kf:(I,c) => [{opacity:0, transform:c.T(`translateY(${40*I}px)`)}, {opacity:c.op, transform:c.T("translateY(0px)")}]},
  {id:"zoomIn", name:"확대 등장", cat:"등장", d:{duration:600, easing:EASE.back, iterations:1, fill:"both"},
    kf:(I,c) => [{opacity:0, transform:c.T(`scale(${clamp(1 - .4*I, 0, 1)})`)}, {opacity:c.op, transform:c.T("scale(1)")}]},
  {id:"flipIn", name:"뒤집으며 등장", cat:"등장", d:{duration:800, easing:EASE.out, iterations:1, fill:"both"},
    kf:(I,c) => [{opacity:0, transform:c.T(`perspective(600px) rotateX(${clamp(90*I, 0, 180)}deg)`)}, {opacity:c.op, transform:c.T("perspective(600px) rotateX(0deg)")}]},
  {id:"blurIn", name:"초점 맞추며 등장", cat:"등장", d:{duration:700, easing:"ease-out", iterations:1, fill:"both"},
    kf:(I,c) => [{opacity:0, filter:`blur(${12*I}px)`, transform:c.T(`scale(${1 + .06*I})`)}, {opacity:c.op, filter:"blur(0px)", transform:c.T("scale(1)")}]},
  {id:"fadeOut", name:"페이드 아웃", cat:"퇴장", d:{duration:600, easing:"ease-in", iterations:1, fill:"both"},
    kf:(I,c) => [{opacity:c.op}, {opacity:0}]},
  {id:"sinkOut", name:"가라앉으며 퇴장", cat:"퇴장", d:{duration:600, easing:EASE.in, iterations:1, fill:"both"},
    kf:(I,c) => [{opacity:c.op, transform:c.T("translateY(0px)")}, {opacity:0, transform:c.T(`translateY(${40*I}px)`)}]},
  {id:"zoomOut", name:"축소 퇴장", cat:"퇴장", d:{duration:500, easing:EASE.in, iterations:1, fill:"both"},
    kf:(I,c) => [{opacity:c.op, transform:c.T("scale(1)")}, {opacity:0, transform:c.T(`scale(${clamp(1 - .4*I, 0, 1)})`)}]},
  {id:"float", name:"부유", cat:"이동", d:{duration:3000, easing:EASE.inout, iterations:0},
    kf:(I,c) => [{transform:c.T("translateY(0px)")}, {transform:c.T(`translateY(${-10*I}px)`)}, {transform:c.T("translateY(0px)")}]},
  {id:"drift", name:"좌우 표류", cat:"이동", d:{duration:2600, easing:EASE.inout, iterations:0, direction:"alternate"},
    kf:(I,c) => [{transform:c.T(`translateX(${-12*I}px)`)}, {transform:c.T(`translateX(${12*I}px)`)}]},
  {id:"spin", name:"회전", cat:"회전", d:{duration:2000, easing:"linear", iterations:0},
    kf:(I,c) => [{transform:c.T("rotate(0deg)")}, {transform:c.T(`rotate(${360*Math.max(1, Math.round(I))}deg)`)}]},
  {id:"swing", name:"진자", cat:"회전", d:{duration:1200, easing:EASE.inout, iterations:0, direction:"alternate"},
    kf:(I,c) => [{transformOrigin:"50% 0%", transform:c.T(`rotate(${15*I}deg)`)}, {transformOrigin:"50% 0%", transform:c.T(`rotate(${-15*I}deg)`)}]},
  {id:"pulse", name:"펄스", cat:"크기", d:{duration:1400, easing:EASE.inout, iterations:0},
    kf:(I,c) => [{transform:c.T("scale(1)")}, {transform:c.T(`scale(${1 + .08*I})`)}, {transform:c.T("scale(1)")}]},
  {id:"heartbeat", name:"심장 박동", cat:"크기", d:{duration:1300, easing:"ease-in-out", iterations:0},
    kf:(I,c) => [[0,1],[.14,1+.15*I],[.28,1],[.42,1+.15*I],[.7,1],[1,1]].map(([o,s]) => ({offset:o, transform:c.T(`scale(${s})`)}))},
  {id:"jelly", name:"젤리", cat:"변형", d:{duration:900, easing:"ease-out", iterations:1},
    kf:(I,c) => [[0,1,1],[.3,1+.25*I,1-.25*I],[.4,1-.25*I,1+.25*I],[.5,1+.15*I,1-.15*I],[.65,1-.05*I,1+.05*I],[.75,1+.05*I,1-.05*I],[1,1,1]]
      .map(([o,x,y]) => ({offset:o, transform:c.T(`scale(${x}, ${y})`)}))},
  {id:"skewWobble", name:"기울기 흔들림", cat:"변형", d:{duration:1000, easing:"ease-in-out", iterations:1},
    kf:(I,c) => [0,-12,10,-6,3,0].map(v => ({transform:c.T(`skewX(${v*I}deg)`)}))},
  {id:"blink", name:"깜빡임", cat:"페이드", d:{duration:1000, easing:"ease-in-out", iterations:0},
    kf:(I,c) => [{opacity:c.op}, {opacity:c.op * clamp(1 - .85*I, 0, 1)}, {opacity:c.op}]},
  {id:"glowPulse", name:"글로우 펄스", cat:"글로우", color:true, d:{duration:1800, easing:EASE.inout, iterations:0},
    kf:(I,c) => [{filter:`drop-shadow(0 0 0px ${hexA(c.color,.9)})`}, {filter:`drop-shadow(0 0 ${16*I}px ${hexA(c.color,.9)})`}, {filter:`drop-shadow(0 0 0px ${hexA(c.color,.9)})`}]},
  {id:"shake", name:"흔들기", cat:"진동", d:{duration:600, easing:"ease-in-out", iterations:1},
    kf:(I,c) => [0,-8,8,-6,6,-3,3,0].map(v => ({transform:c.T(`translateX(${v*I}px)`)}))},
  {id:"vibrate", name:"미세 진동", cat:"진동", d:{duration:300, easing:"linear", iterations:0},
    kf:(I,c) => [[0,0],[-2,1],[2,-1],[-1,-2],[1,2],[-2,-1],[2,1],[0,0]].map(([x,y]) => ({transform:c.T(`translate(${x*I}px, ${y*I}px)`)}))},
  {id:"ripple", name:"파동", cat:"파동", color:true, d:{duration:1600, easing:"ease-out", iterations:0},
    kf:(I,c) => [{boxShadow:`0 0 0 0px ${hexA(c.color,.55)}`}, {boxShadow:`0 0 0 ${24*I}px ${hexA(c.color,0)}`}]},
  {id:"orbit", name:"궤도", cat:"궤도", d:{duration:3000, easing:"linear", iterations:0},
    kf:(I,c) => Array.from({length:9}, (_, i) => ({transform:c.T(`rotate(${i*45}deg) translateX(${24*I}px) rotate(${-i*45}deg)`)}))},
  {id:"scanIn", name:"스캔 등장", cat:"디지털 전환", d:{duration:800, easing:EASE.out, iterations:1, fill:"both"},
    kf:(I,c) => [{clipPath:"inset(0% 0% 100% 0%)", filter:`brightness(${1 + 1.5*I})`}, {clipPath:"inset(0% 0% 0% 0%)", filter:"brightness(1)"}]},
  {id:"wipeIn", name:"와이프 등장", cat:"디지털 전환", d:{duration:700, easing:EASE.out, iterations:1, fill:"both"},
    kf:(I,c) => [{clipPath:"inset(0% 100% 0% 0%)"}, {clipPath:"inset(0% 0% 0% 0%)"}]},
  {id:"holoFlicker", name:"홀로그램 깜빡임", cat:"홀로그램", d:{duration:2400, easing:"linear", iterations:0},
    kf:(I,c) => [[0,1,0,0],[.06,.4,20,2],[.08,1,0,0],[.5,.85,0,0],[.52,.3,-25,-2],[.55,.95,10,1],[.57,1,0,0],[1,1,0,0]].map(([o,a,h,k]) =>
      ({offset:o, opacity:c.op * clamp(1 - (1-a)*I, 0, 1), filter:`hue-rotate(${h*I}deg) brightness(${1 + (1-a)*.6*I})`, transform:c.T(`skewX(${k*I}deg)`)}))},
  {id:"glitch", name:"글리치", cat:"글리치", d:{duration:900, easing:"linear", iterations:0},
    kf:(I,c) => [[0,0,0,"inset(0% 0% 0% 0%)",0],[.1,-6,1,"inset(10% 0% 60% 0%)",40],[.18,5,-1,"inset(55% 0% 20% 0%)",-30],[.26,0,0,"inset(0% 0% 0% 0%)",0],
      [.62,3,0,"inset(30% 0% 45% 0%)",20],[.68,-4,1,"inset(70% 0% 5% 0%)",-20],[.74,0,0,"inset(0% 0% 0% 0%)",0],[1,0,0,"inset(0% 0% 0% 0%)",0]]
      .map(([o,x,y,clip,h]) => ({offset:o, easing:"steps(1, end)", transform:c.T(`translate(${x*I}px, ${y*I}px)`), clipPath:clip, filter:`hue-rotate(${h*I}deg)`}))}
];
PRESETS.push(...extraPresets(EASE, clamp, hexA));
/* 직접 만들기: 사용자가 키프레임(위치·배율·회전·불투명도)을 하나씩 정한다. 키프레임은 애니메이션 설정의 keys에 저장된다. */
export const DEFAULT_KEYS = () => [{o:0, x:0, y:0, s:1, r:0, op:0}, {o:100, x:0, y:0, s:1, r:0, op:1}];
PRESETS.unshift({id:"custom", name:"키프레임 직접 만들기", cat:"직접 만들기", keys:true, d:{duration:1200, easing:"ease-in-out", iterations:1, fill:"both"},
  kf:(I, c) => [...(c.keys && c.keys.length >= 2 ? c.keys : DEFAULT_KEYS())].sort((a, b) => a.o - b.o).map(k => ({
    offset:clamp(k.o, 0, 100) / 100, opacity:clamp(c.op * k.op, 0, 1),
    transform:c.T(`translate(${k.x * I}px, ${k.y * I}px) rotate(${k.r * I}deg) scale(${1 + (k.s - 1) * I})`)}))});
export const PRESET = Object.fromEntries(PRESETS.map(p => [p.id, p]));

export function newAnim(id){
  const p = PRESET[id];
  return Object.assign({preset:id, duration:1000, delay:0, iterations:1, direction:"normal", easing:"ease", intensity:1, speed:1, fill:"none", color:"#e9d8a6"}, p.d, p.keys ? {keys:DEFAULT_KEYS()} : {});
}
// 저장된 값에 빠진 항목을 채운다
export const normAnim = a => Object.assign(newAnim(PRESET[a.preset] ? a.preset : "fadeIn"), a, PRESET[a.preset] ? {} : {preset:"fadeIn"});

// 요소 속성과 애니메이션 설정으로 키프레임과 타이밍을 만든다 (편집기와 내보내기가 함께 쓴다)
export function build(props, a){
  a = normAnim(a);
  const bt = baseTransform(props);
  const c = {op:props.opacity ?? 1, color:a.color, keys:a.keys, T:s => (bt ? bt + " " : "") + s};
  const speed = a.speed > 0 ? a.speed : 1;
  return {
    keyframes: PRESET[a.preset].kf(Math.max(0, +a.intensity || 0), c),
    timing: {duration:Math.max(1, a.duration / speed), delay:Math.max(0, a.delay), iterations:a.iterations > 0 ? a.iterations : Infinity,
      direction:a.direction, easing:a.easing, fill:a.fill}
  };
}
// 한 애니메이션이 끝나는 시점(ms). 무한 반복이면 Infinity.
export function endTime(a){
  a = normAnim(a);
  return a.iterations > 0 ? a.delay + a.duration / (a.speed || 1) * a.iterations : Infinity;
}
export const EASINGS = [["linear","linear"],["ease","ease"],["ease-in","ease-in"],["ease-out","ease-out"],["ease-in-out","ease-in-out"],
  [EASE.out,"부드럽게 감속"],[EASE.back,"튕기며 멈춤"],[EASE.in,"가속"],["steps(6, end)","계단 6단"]];
