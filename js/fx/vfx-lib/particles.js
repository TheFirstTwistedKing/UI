/* 파티클: 모양 10종 × 움직임 9종.
   입자 하나가 레이어 하나다. 위치는 left/top %로 움직여 요소 크기가 바뀌어도 같은 경로를 따른다. */
import { f2, hexA, at } from "../vfx-util.js";

// [id, 이름, 기본 색, 크기 배율, 모양 CSS(크기 s, 색)]
const SHAPES = [
  ["Dot", "빛 입자", "#ffe2a0", 1.6, (s, col) => `border-radius:50%;background:radial-gradient(circle,#fff 0 18%,${col} 42%,transparent 70%)`],
  ["Square", "네모", "#7df9ff", 1, (s, col) => `background:${col}`],
  ["Diamond", "다이아몬드", "#9fd8ff", 1.2, (s, col) => `background:${col};clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%)`],
  ["Ring", "고리", "#e9d8a6", 1.5, (s, col) => `border-radius:50%;border:${f2(Math.max(1, s/6))}px solid ${col}`],
  ["Plus", "십자", "#b6ff9e", 1.3, (s, col) => `background:linear-gradient(${col},${col}) center/100% 26% no-repeat,linear-gradient(${col},${col}) center/26% 100% no-repeat`],
  ["Star", "별", "#fff2b0", 1.7, (s, col) => `background:${col};clip-path:polygon(50% 0%,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0% 50%,39% 39%)`],
  ["Tri", "삼각형", "#ff9ec7", 1.3, (s, col) => `background:${col};clip-path:polygon(50% 0%,100% 100%,0% 100%)`],
  ["Hex", "육각형", "#c9a2ff", 1.3, (s, col) => `background:${col};clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0% 50%)`],
  ["Heart", "하트", "#ff5c8a", 1.6, (s, col) => `background:${col};clip-path:polygon(50% 92%,8% 52%,2% 30%,12% 10%,30% 6%,50% 22%,70% 6%,88% 10%,98% 30%,92% 52%)`],
  ["Bubble", "거품", "#8fd3ff", 2, (s, col) => `border-radius:50%;border:1px solid ${hexA(col,.85)};background:radial-gradient(circle at 32% 30%,rgba(255,255,255,.75) 0 12%,${hexA(col,.18)} 40%,transparent 70%)`]
];

// 움직임: (난수, 강도, 순번, 개수) → {kf, at(시작 시차 0~1), dur(주기 배율), easing}
const MOTIONS = [
  ["Rise", "상승", 2600, 10, (r, I) => { const x = 5 + r()*90, dx = (r() - .5)*20*I;
    return {kf:[{offset:0, ...at(x, 104), opacity:0, transform:"scale(.6) rotate(0deg)"}, {offset:.15, opacity:1}, {offset:1, ...at(x + dx, -4), opacity:0, transform:`scale(1) rotate(${Math.round((r() - .5)*360)}deg)`}],
      at:r(), dur:.6 + r()*.4, easing:"cubic-bezier(.3,.5,.5,1)"}; }],
  ["Fall", "낙하", 2800, 10, (r, I) => { const x = 5 + r()*90, dx = (r() - .5)*16*I;
    return {kf:[{offset:0, ...at(x, -4), opacity:0, transform:"rotate(0deg)"}, {offset:.12, opacity:1}, {offset:.88, opacity:1}, {offset:1, ...at(x + dx, 104), opacity:0, transform:`rotate(${Math.round((r() - .5)*540)}deg)`}],
      at:r(), dur:.6 + r()*.4, easing:"cubic-bezier(.45,0,.75,.6)"}; }],
  ["Wind", "바람", 2400, 10, (r, I) => { const y = 5 + r()*90, dy = 6*I;
    return {kf:[{offset:0, ...at(-4, y), opacity:0, transform:"rotate(0deg)"}, {offset:.1, opacity:1}, {offset:.5, ...at(48, y - dy)}, {offset:.9, opacity:1}, {offset:1, ...at(104, y + dy*.5), opacity:0, transform:`rotate(${Math.round(180 + r()*360)}deg)`}],
      at:r(), dur:.5 + r()*.5, easing:"linear"}; }],
  ["Burst", "폭발", 1500, 12, (r, I, i, n) => { const a = (i / n + r()*.08) * Math.PI * 2, d = (30 + r()*30) * I;
    return {kf:[{offset:0, ...at(50, 50), opacity:1, transform:"scale(1.2)"}, {offset:1, ...at(50 + Math.cos(a)*d, 50 + Math.sin(a)*d), opacity:0, transform:"scale(.2)"}],
      at:r()*.12, dur:.75 + r()*.25, easing:"cubic-bezier(.1,.7,.3,1)"}; }],
  ["Implode", "수렴", 1700, 12, (r, I, i, n) => { const a = (i / n + r()*.08) * Math.PI * 2, d = (40 + r()*25) * I;
    return {kf:[{offset:0, ...at(50 + Math.cos(a)*d, 50 + Math.sin(a)*d), opacity:0, transform:"scale(1)"}, {offset:.25, opacity:1}, {offset:1, ...at(50, 50), opacity:0, transform:"scale(.2)"}],
      at:r()*.6, dur:.6 + r()*.3, easing:"cubic-bezier(.55,0,.85,.35)"}; }],
  ["Orbit", "공전", 4200, 6, (r, I, i, n) => { const p = i / n * Math.PI * 2, rx = 45 + 10*I*r(), ry = 35 + 10*I*r();
    return {kf:Array.from({length:13}, (_, k) => { const a = p + k / 12 * Math.PI * 2; return {offset:f2(k / 12), ...at(50 + Math.cos(a)*rx, 50 + Math.sin(a)*ry), opacity:.95, transform:`rotate(${k*30}deg)`}; }),
      at:0, dur:1, easing:"linear"}; }],
  ["Fountain", "분수", 2000, 10, (r, I) => { const dx = (r() - .5)*30*I, top = 25 - r()*20*I;
    return {kf:[{offset:0, ...at(50, 104), opacity:0, easing:"cubic-bezier(.2,.6,.4,1)", transform:"rotate(0deg)"}, {offset:.08, opacity:1}, {offset:.45, ...at(50 + dx, top), easing:"cubic-bezier(.6,0,.8,.4)"},
      {offset:.92, opacity:1}, {offset:1, ...at(50 + 2.2*dx, 104), opacity:0, transform:`rotate(${Math.round((r() - .5)*400)}deg)`}], at:r(), dur:.7 + r()*.3, easing:"linear"}; }],
  ["Twinkle", "반짝", 2200, 9, (r, I) => { const x = 5 + r()*90, y = 5 + r()*90;
    return {kf:[{offset:0, ...at(x, y), opacity:0, transform:"scale(0) rotate(0deg)"}, {offset:.5, ...at(x, y), opacity:1, transform:`scale(${f2(.8 + .5*I)}) rotate(45deg)`}, {offset:1, ...at(x, y), opacity:0, transform:"scale(0) rotate(90deg)"}],
      at:r(), dur:.35 + r()*.3, easing:"ease-in-out"}; }],
  ["Spiral", "소용돌이", 2600, 10, (r, I, i, n) => { const p = i / n * Math.PI * 2;
    return {kf:Array.from({length:9}, (_, k) => { const t = k / 8, a = p + t * Math.PI * 3, d = (48 - 46*t) * (.6 + .4*I);
      return {offset:f2(t), ...at(50 + Math.cos(a)*d, 50 + Math.sin(a)*d), opacity:k === 0 || k === 8 ? 0 : 1, transform:`scale(${f2(1 - .7*t)})`}; }),
      at:r(), dur:.7 + r()*.3, easing:"linear"}; }]
];

export function particleEffects(def){
  for(const [mid, mname, dur, base, motion] of MOTIONS)
    for(const [sid, sname, col, mul, shape] of SHAPES){
      if(mid === "Spiral" && sid === "Bubble") continue;
      def("파티클", "p" + sid + mid, `${sname} ${mname}`, {color:true, density:true, tail:mid !== "Orbit", poster:mid === "Orbit" ? .3 : 1.5, d:{duration:dur, iterations:0, color:col}},
        c => { const n = Math.round(base * (.6 + .4*c.D)); return {layers:Array.from({length:n}, (_, i) => {
          const s = f2((3 + c.rnd()*4) * mul * (.7 + .3*c.I)), m = motion(c.rnd, c.I, i, n);
          return {css:`left:0;top:0;width:${s}px;height:${s}px;margin:${-s/2}px 0 0 ${-s/2}px;opacity:0;${shape(s, c.color)}`, kf:m.kf, at:m.at, dur:m.dur, easing:m.easing};
        })}; });
    }
}
