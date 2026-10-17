/* 날씨·자연 25종 */
import { f2, hexA, clamp, STEP, flicker, at, seq, svgUrl, NOISE } from "../vfx-util.js";

export function weatherEffects(def){
  const W = (id, name, o, make) => def("날씨·자연", id, name, {color:true, clip:true, poster:1.4, tail:true, density:true, ...o, d:{duration:2000, iterations:0, color:"#cfe3ff", ...o.d}}, make);
  const many = (c, base, fn) => Array.from({length:Math.round(base * (.5 + .5*c.D))}, (_, i) => fn(i));

  // 빗줄기: 기울어진 선이 위에서 아래로 (dx: 바람으로 옆으로 밀리는 정도 %)
  const rain = (id, name, base, dur, len, dx, alpha) => W(id, name, {d:{duration:dur}}, c => ({layers:many(c, base, () => {
    const x = c.rnd()*120 - 10, ang = Math.atan2(dx, 100) * 180 / Math.PI;
    return {css:`left:0;top:0;width:1px;height:${f2(len*(.7 + c.rnd()*.6))}px;background:linear-gradient(to bottom,transparent,${hexA(c.color,alpha)});transform:rotate(${f2(-ang)}deg);opacity:0`,
      kf:[{...at(x, -10), opacity:1}, {...at(x + dx*c.I, 110), opacity:1}], at:c.rnd(), dur:.7 + c.rnd()*.3, easing:"linear"};
  })}));
  rain("rain", "비", 26, 900, 18, -8, .7);
  rain("heavyRain", "폭우", 46, 550, 26, -16, .85);
  rain("drizzle", "이슬비", 14, 1600, 9, -3, .5);
  rain("sleet", "진눈깨비", 22, 1200, 6, -10, .9);

  const flake = (id, name, base, dur, size, sway, wind, col) => W(id, name, {d:{duration:dur, color:col}}, c => ({layers:many(c, base, () => {
    const x = c.rnd()*110 - 5, s = f2(size*(.5 + c.rnd()));
    return {css:`left:0;top:0;width:${s}px;height:${s}px;border-radius:50%;background:${hexA(c.color,.9)};opacity:0`,
      kf:[0, .25, .5, .75, 1].map((t, k) => ({offset:t, ...at(x + Math.sin(k*1.6)*sway + wind*t*c.I, -5 + 110*t), opacity:k === 4 ? 0 : 1})), at:c.rnd(), dur:.6 + c.rnd()*.4, easing:"linear"};
  })}));
  flake("snow", "눈", 24, 6000, 4, 4, 6, "#ffffff");
  flake("blizzard", "눈보라", 44, 1800, 3, 2, 60, "#ffffff");
  flake("ashFall", "재 날림", 18, 7000, 3, 6, 10, "#9a9a9a");
  W("hail", "우박", {d:{duration:900, color:"#e8f4ff"}}, c => ({layers:many(c, 16, () => { const x = c.rnd()*100, s = f2(3 + c.rnd()*3);
    return {css:`left:0;top:0;width:${s}px;height:${s}px;border-radius:30%;background:${c.color};opacity:0`,
      kf:[{offset:0, ...at(x, -5), opacity:1, easing:"cubic-bezier(.5,0,1,1)"}, {offset:.8, ...at(x, 96), opacity:1, easing:"ease-out"}, {offset:.9, ...at(x + 3, 88), opacity:1, easing:"ease-in"}, {offset:1, ...at(x + 5, 96), opacity:0}], at:c.rnd(), dur:.8 + c.rnd()*.2, easing:"linear"}; })}));

  // 잎·꽃잎: 흔들리며 회전하며 떨어진다
  const leaf = (id, name, col, shape, base) => W(id, name, {d:{duration:5000, color:col}}, c => ({layers:many(c, base, () => { const x = c.rnd()*100, s = f2(8 + c.rnd()*7);
    return {css:`left:0;top:0;width:${s}px;height:${f2(s*.6)}px;background:${c.color};${shape};opacity:0`,
      kf:[0, .25, .5, .75, 1].map((t, k) => ({offset:t, ...at(x + Math.sin(k*1.7)*10 + 10*t*c.I, -5 + 110*t), opacity:k === 4 ? 0 : .95, transform:`rotate(${k*90}deg) rotateX(${k*70}deg)`})), at:c.rnd(), dur:.6 + c.rnd()*.4, easing:"ease-in-out"}; })}));
  leaf("leaves", "낙엽", "#d9822b", "border-radius:0 100% 0 100%", 10);
  leaf("petals", "꽃잎", "#ffb7d0", "border-radius:100% 0 100% 0 / 60% 0 100% 40%", 14);

  W("fireflies", "반딧불", {d:{duration:6000, color:"#d8ff6a"}, poster:.5, tail:false}, c => ({layers:many(c, 12, () => { const pts = Array.from({length:5}, () => [5 + c.rnd()*90, 5 + c.rnd()*90]); pts.push(pts[0]);
    return {css:`left:0;top:0;width:5px;height:5px;translate:-50% -50%;border-radius:50%;background:${c.color};box-shadow:0 0 8px 2px ${hexA(c.color,.7)}`,
      kf:pts.map(([x, y], k) => ({offset:f2(k / 5), ...at(x, y), opacity:[.2, 1, .4, 1, .3, .2][k]})), easing:"ease-in-out", dur:.8 + c.rnd()*.4}; })}));
  W("smoke", "연기", {clip:false, d:{duration:4000, color:"#9aa0a6"}}, c => ({layers:many(c, 8, () => { const x = 30 + c.rnd()*40;
    return {css:`left:0;top:0;width:40%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;filter:blur(10px);background:radial-gradient(closest-side,${hexA(c.color,.55*Math.min(c.I,1.5))},transparent);opacity:0`,
      kf:[{...at(x, 90), opacity:0, transform:"scale(.4)"}, {...at(x + 5, 40), opacity:1, transform:"scale(.9)"}, {...at(x + 15, -20), opacity:0, transform:"scale(1.6)"}], at:c.rnd(), dur:.8 + c.rnd()*.2, easing:"ease-out"}; })}));
  W("steam", "김", {clip:false, d:{duration:2800, color:"#ffffff"}}, c => ({layers:many(c, 6, () => { const x = 25 + c.rnd()*50;
    return {css:`left:0;top:0;width:6%;height:40%;translate:-50% -100%;border-radius:50%;filter:blur(5px);background:linear-gradient(to top,${hexA(c.color,.5*Math.min(c.I,1.5))},transparent);opacity:0`,
      kf:[{...at(x, 30), opacity:0, transform:"skewX(0deg) scaleY(.5)"}, {...at(x - 3, 10), opacity:.9, transform:"skewX(10deg) scaleY(1)"}, {...at(x + 4, -15), opacity:0, transform:"skewX(-12deg) scaleY(1.3)"}], at:c.rnd(), dur:.8 + c.rnd()*.2, easing:"ease-out"}; })}));
  W("fog", "안개 흐름", {density:false, tail:false, poster:.3, d:{duration:12000, color:"#d8dde3"}}, c => ({layers:[20, 50, 75].map((y, i) => ({
    css:`left:-60%;right:-60%;top:${y - 20}%;height:45%;border-radius:50%;filter:blur(14px);background:radial-gradient(closest-side,${hexA(c.color,.4*Math.min(c.I,1.6))},transparent)`,
    kf:[{transform:`translateX(${i % 2 ? 20 : -20}%)`}, {transform:`translateX(${i % 2 ? -20 : 20}%)`}], easing:"ease-in-out", at:i * .3}))}));
  W("mist", "피어오르는 안개", {density:false, d:{duration:5000, color:"#e6ecf2"}}, c => ({layers:[0, 1, 2, 3].map(i => ({css:`left:${i*25 - 10}%;width:45%;bottom:-20%;height:50%;border-radius:50%;filter:blur(12px);background:radial-gradient(closest-side,${hexA(c.color,.45*Math.min(c.I,1.5))},transparent);opacity:0`,
    kf:[{opacity:0, transform:"translateY(0%) scale(.8)"}, {opacity:1, transform:"translateY(-60%) scale(1)"}, {opacity:0, transform:"translateY(-120%) scale(1.3)"}], at:i / 4, easing:"ease-out"}))}));
  W("storm", "뇌우", {density:false, tail:false, poster:.06, d:{duration:3200, color:"#dfe9ff"}}, c => ({layers:[
    {css:`inset:0;background:${hexA(c.color,.55*Math.min(c.I,1.5))}`, kf:flicker([[.04, .07], [.1, .13]], {opacity:1}, {opacity:0})},
    {css:`left:40%;width:20%;top:0;bottom:20%;background:#fff;clip-path:polygon(50% 0%,30% 45%,48% 45%,25% 100%,70% 38%,52% 38%,68% 0%);filter:drop-shadow(0 0 6px ${c.color})`, kf:flicker([[.04, .1]], {opacity:1}, {opacity:0})}]}));
  W("sunRays", "햇살", {density:false, tail:false, poster:.5, d:{duration:6000, color:"#fff1b8"}}, c => ({layers:[{css:`left:-60%;top:-60%;width:200%;height:200%;background:repeating-conic-gradient(from 90deg at 0% 0%,${hexA(c.color,.25*c.I)} 0deg 3deg,transparent 3deg 9deg);-webkit-mask-image:radial-gradient(circle at 0% 0%,#000,transparent 70%);mask-image:radial-gradient(circle at 0% 0%,#000,transparent 70%);mix-blend-mode:screen;transform-origin:0% 0%`,
    kf:seq([-3, 3, -3], v => ({transform:`rotate(${v}deg)`, opacity:f2(.7 + Math.abs(v)/10)})), easing:"ease-in-out"}]}));
  W("rainbow", "무지개", {density:false, tail:false, poster:.5, color:false, d:{duration:6000}}, c => ({layers:[{css:`left:-10%;right:-10%;top:20%;height:160%;border-radius:50%;background:radial-gradient(closest-side,transparent 70%,rgba(255,60,60,.5) 72%,rgba(255,160,40,.5) 75%,rgba(255,240,60,.5) 78%,rgba(60,220,90,.5) 81%,rgba(60,140,255,.5) 84%,rgba(140,70,255,.5) 87%,transparent 89%);filter:blur(1px)`,
    kf:seq([0, clamp(c.I, 0, 1), clamp(c.I, 0, 1), 0], v => ({opacity:f2(v)})), easing:"ease-in-out"}]}));
  W("ripples", "물결 동그라미", {d:{duration:2400, color:"#bfe6ff"}}, c => ({layers:many(c, 6, () => { const x = 10 + c.rnd()*80, y = 20 + c.rnd()*70;
    return {css:`left:${f2(x)}%;top:${f2(y)}%;width:30%;aspect-ratio:2;translate:-50% -50%;border-radius:50%;border:1px solid ${hexA(c.color,.8)};opacity:0`,
      kf:[{opacity:1, transform:"scale(.05)"}, {opacity:0, transform:`scale(${f2(.6 + .4*c.I)})`}], at:c.rnd(), dur:.7, easing:"ease-out"}; })}));
  W("waves", "파도", {density:false, tail:false, poster:.3, d:{duration:3000, color:"#3db5ff"}}, c => ({layers:[[.55, 1, 0], [.35, -1, 8]].map(([a, d, off]) => ({
    css:`left:0;right:0;bottom:${off}%;height:24%;background-image:${svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='30' preserveAspectRatio='none'><path d='M0 15 Q30 0 60 15 T120 15 V30 H0Z' fill='${hexA(c.color, a)}'/></svg>`)};background-size:120px 100%;background-repeat:repeat-x`,
    kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:`${d*120}px 0px`}], easing:"linear"}))}));
  W("clouds", "구름 흐름", {density:false, tail:false, poster:.4, d:{duration:16000, color:"#ffffff"}}, c => ({layers:[[15, 40], [45, 30], [70, 45]].map(([y, w], i) => ({
    css:`left:0;top:${y}%;width:${w}%;aspect-ratio:2.6;translate:-50% 0;border-radius:50%;filter:blur(6px);background:radial-gradient(closest-side,${hexA(c.color,.6*Math.min(c.I,1.4))},transparent)`,
    kf:[{left:"-30%"}, {left:"130%"}], at:i / 3, dur:1 + i*.2, easing:"linear"}))}));
  W("nightSky", "밤하늘", {d:{duration:3000, color:"#ffffff"}, poster:.5}, c => ({layers:[
    ...many(c, 28, () => ({css:`left:${f2(c.rnd()*100)}%;top:${f2(c.rnd()*100)}%;width:${f2(1 + c.rnd()*1.5)}px;aspect-ratio:1;border-radius:50%;background:${c.color}`, kf:seq([.2, 1, .2], v => ({opacity:v})), at:c.rnd(), dur:.5 + c.rnd()*.5, easing:"ease-in-out"})),
    {css:`left:0;top:0;width:18%;height:1.5px;background:linear-gradient(90deg,transparent,#fff);transform:rotate(25deg);opacity:0`, kf:[{offset:0, ...at(-20, 5), opacity:0}, {offset:.7, ...at(-20, 5), opacity:0}, {offset:.72, opacity:1}, {offset:.85, ...at(70, 45), opacity:0}, {offset:1, ...at(70, 45), opacity:0}], easing:"linear"}]}));
  W("shootingStars", "별똥별", {d:{duration:2200, color:"#fff4d0"}}, c => ({layers:many(c, 5, () => { const x = c.rnd()*60, y = c.rnd()*40;
    return {css:`left:0;top:0;width:${f2(14 + 10*c.I)}%;height:2px;background:linear-gradient(90deg,transparent,${c.color});box-shadow:0 0 6px ${c.color};transform:rotate(30deg);opacity:0`,
      kf:[{offset:0, ...at(x, y), opacity:0}, {offset:.1, opacity:1}, {offset:.5, ...at(x + 45, y + 26), opacity:0}, {offset:1, ...at(x + 45, y + 26), opacity:0}], at:c.rnd(), easing:"ease-in"}; })}));
  W("dustStorm", "모래 바람", {density:false, tail:false, poster:.3, d:{duration:900, color:"#d9b37a"}}, c => ({layers:[
    {css:`inset:0;background:${hexA(c.color,.25*c.I)}`, kf:seq([.6, 1, .6], v => ({opacity:v}))},
    {css:`inset:0;background-image:${NOISE};opacity:${f2(clamp(.35*c.I,0,1))};mix-blend-mode:overlay`, kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"-140px 20px"}], easing:"linear"},
    {css:`inset:0;background:repeating-linear-gradient(170deg,transparent 0 8px,${hexA(c.color,.35)} 8px 9px);background-size:200% 200%`, kf:[{backgroundPosition:"0% 0%"}, {backgroundPosition:"-60px 10px"}], easing:"linear"}]}));
  W("drips", "물방울 떨어짐", {clip:false, d:{duration:2400, color:"#7fd0ff"}}, c => ({layers:many(c, 6, () => { const x = 5 + c.rnd()*90;
    return {css:`left:${f2(x)}%;top:0;width:6px;height:9px;translate:-50% -50%;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;background:${c.color};opacity:0`,
      kf:[{offset:0, top:"100%", opacity:0, transform:"scale(.2)"}, {offset:.5, top:"100%", opacity:1, transform:"scale(1)", easing:"cubic-bezier(.5,0,1,1)"}, {offset:1, top:`${f2(150 + 60*c.I)}%`, opacity:0, transform:"scale(1)"}], at:c.rnd(), dur:.8, easing:"ease-in"}; })}));
}
