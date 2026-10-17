/* 에너지: 고리·전기·플라스마·빔·오라 43종 */
import { f2, hexA, clamp, STEP, flicker, windows, at, seq, centered, svgUrl, ringMask, perimeter } from "../vfx-util.js";

// 번개 모양 다각형: (x0,y0)에서 (x1,y1)까지 지그재그, 두께 w(%)
function bolt(rnd, x0, y0, x1, y1, n, w, jit){
  const pts = [];
  for(let i = 0; i <= n; i++){ const t = i / n, j = i === 0 || i === n ? 0 : (rnd() - .5) * jit; pts.push([x0 + (x1 - x0)*t + j, y0 + (y1 - y0)*t + j*.4]); }
  const L = pts.map(([x, y]) => `${f2(x - w/2)}% ${f2(y)}%`), R = pts.slice().reverse().map(([x, y]) => `${f2(x + w/2)}% ${f2(y)}%`);
  return `polygon(${L.concat(R).join(",")})`;
}

// 가로 번개: 두께를 세로 방향으로 준다
function boltH(rnd, x0, y0, x1, y1, n, w, jit){
  const pts = [];
  for(let i = 0; i <= n; i++){ const t = i / n, j = i === 0 || i === n ? 0 : (rnd() - .5) * jit; pts.push([x0 + (x1 - x0)*t, y0 + (y1 - y0)*t + j]); }
  const T = pts.map(([x, y]) => `${f2(x)}% ${f2(y - w/2)}%`), B = pts.slice().reverse().map(([x, y]) => `${f2(x)}% ${f2(y + w/2)}%`);
  return `polygon(${T.concat(B).join(",")})`;
}

export function energyEffects(def){
  const E = (id, name, o, make) => def("에너지", id, name, {color:true, poster:.4, ...o, d:{duration:2000, iterations:0, color:"#7aa8ff", ...o.d}}, make);

  /* 고리·파동 */
  E("ringBig", "큰 파동", {d:{duration:2400}}, c => ({layers:[{css:`inset:0;border-radius:inherit;border:${f2(Math.max(1, 3*c.I))}px solid ${c.color};opacity:0`,
    kf:[{transform:"scale(1)", opacity:1}, {transform:`scale(${f2(1 + .8*c.I)})`, opacity:0}], easing:"cubic-bezier(.1,.6,.3,1)"}]}));
  E("ringFast", "잔물결 파동", {d:{duration:1200}}, c => ({layers:[0, .2, .4, .6, .8].map(a => ({css:`inset:0;border-radius:inherit;border:1px solid ${c.color};opacity:0`,
    kf:[{transform:"scale(1)", opacity:.8}, {transform:`scale(${f2(1 + .2*c.I)})`, opacity:0}], at:a, easing:"ease-out"}))}));
  E("ringCircle", "원형 파동", {d:{duration:2200}}, c => ({layers:[0, 1/3, 2/3].map(a => ({css:`${centered(60)};border-radius:50%;border:${f2(Math.max(1, 2*c.I))}px solid ${c.color};box-shadow:0 0 8px ${hexA(c.color,.6)};opacity:0`,
    kf:[{transform:"scale(.2)", opacity:1}, {transform:`scale(${f2(1.4 + .8*c.I)})`, opacity:0}], at:a, easing:"ease-out"}))}));
  E("shockwave", "충격파", {poster:.25, d:{duration:1400, iterations:1}}, c => ({layers:[
    {css:`${centered(40)};border-radius:50%;border:${f2(Math.max(2, 6*c.I))}px solid ${hexA(c.color,.9)};filter:blur(1px);opacity:0`, kf:[{transform:"scale(.1)", opacity:1}, {transform:`scale(${f2(3 + 2*c.I)})`, opacity:0}], easing:"cubic-bezier(.1,.7,.3,1)"},
    {css:`inset:0;border-radius:inherit;background:${hexA("#ffffff",.6)};opacity:0`, kf:[{offset:0, opacity:1}, {offset:.25, opacity:0}, {offset:1, opacity:0}], easing:"ease-out"}]}));
  E("sonar", "소나 핑", {d:{duration:2600, color:"#3dff8a"}}, c => ({layers:[
    {css:`${centered(8)};border-radius:50%;background:${c.color};box-shadow:0 0 8px ${c.color}`, kf:seq([1, .3, 1], v => ({opacity:v}))},
    {css:`${centered(16)};border-radius:50%;border:2px solid ${c.color};opacity:0`, kf:[{offset:0, transform:"scale(.5)", opacity:1}, {offset:.6, transform:`scale(${f2(4 + 3*c.I)})`, opacity:0}, {offset:1, transform:"scale(1)", opacity:0}], easing:"ease-out"}]}));
  E("gravityWell", "중력 우물", {d:{duration:1800, color:"#b07aff"}}, c => ({layers:[0, 1/3, 2/3].map(a => ({css:`${centered(120)};border-radius:50%;border:1px solid ${c.color};opacity:0`,
    kf:[{transform:"scale(1)", opacity:0}, {transform:"scale(.55)", opacity:.8}, {transform:"scale(.05)", opacity:0}], at:a, easing:"ease-in"}))}));

  /* 전기 */
  E("arcs", "전기 아크", {density:true, poster:.12, d:{duration:1200, color:"#9fd8ff"}}, c => ({layers:Array.from({length:Math.round(2 + 2*c.D)}, (_, i) => {
    const y0 = c.rnd()*100, y1 = c.rnd()*100;
    return {css:`inset:0;background:#fff;clip-path:${boltH(c.rnd, c.rnd()*20, y0, 80 + c.rnd()*20, y1, 8, 1.2, 14)};filter:drop-shadow(0 0 3px ${c.color}) drop-shadow(0 0 6px ${c.color})`,
      kf:flicker(windows(c.rnd, 2, .08, i % 2 ? undefined : .1), {opacity:1}, {opacity:0})};
  })}));
  E("lightning", "번개", {clip:false, poster:.06, d:{duration:2400, color:"#cfe6ff"}}, c => ({layers:[
    {css:`left:30%;right:30%;top:-60%;height:110%;background:#fff;clip-path:${bolt(c.rnd, 50, 0, 50, 100, 7, 3, 40)};filter:drop-shadow(0 0 6px ${c.color}) drop-shadow(0 0 14px ${c.color})`, kf:flicker([[.04, .09], [.12, .16]], {opacity:1}, {opacity:0})},
    {css:`inset:0;border-radius:inherit;background:${hexA(c.color,.4*Math.min(c.I,1.5))}`, kf:flicker([[.04, .07], [.12, .14]], {opacity:1}, {opacity:0})}]}));
  E("cornerDischarge", "모서리 방전", {poster:.1, d:{duration:1600, color:"#9fd8ff"}}, c => ({layers:[[0, 0], [100, 0], [100, 100], [0, 100]].map(([x, y], i) => ({
    css:`inset:0;background:#fff;clip-path:${bolt(c.rnd, x, y, x + (50 - x)*.6, y + (50 - y)*.6, 5, 1.2, 10)};filter:drop-shadow(0 0 4px ${c.color})`,
    kf:flicker(windows(c.rnd, 2, .06, i === 0 ? .08 : undefined), {opacity:1}, {opacity:0})}))}));
  E("electricOutline", "전기 윤곽", {poster:.1, d:{duration:900, color:"#9fd8ff"}}, c => ({layers:[{css:"inset:0;border-radius:inherit",
    kf:Array.from({length:7}, (_, i) => { const x = f2((c.rnd() - .5)*3*c.I), y = f2((c.rnd() - .5)*3*c.I);
      return {offset:f2(i/6), easing:STEP, boxShadow:`${x}px ${y}px 0 1px ${c.color},${-x}px ${-y}px ${f2(6*c.I)}px ${hexA(c.color,.7)}`}; })}]}));
  E("teslaField", "자기장 선", {clip:true, d:{duration:2400}}, c => ({layers:[-1, 1].map(s => ({css:`inset:0;opacity:${f2(clamp(.6*c.I,0,1))};background:repeating-radial-gradient(circle at ${s < 0 ? "-10%" : "110%"} 50%,transparent 0 12px,${hexA(c.color,.6)} 13px 14px,transparent 15px 26px)`,
    kf:[{backgroundSize:"100% 100%"}, {backgroundSize:"115% 115%"}], easing:"linear"}))}));

  /* 플라스마 · 오라 */
  E("plasma", "플라스마", {clip:true, d:{duration:5000, color:"#ff4fd8"}}, c => ({layers:[[c.color, 30, 40], ["#4f7dff", 65, 55], ["#4fffe0", 45, 75]].map(([col, x, y], i) => ({
    css:`inset:-50%;mix-blend-mode:screen;filter:blur(8px);background:radial-gradient(circle at 50% 50%,${hexA(col,.6*Math.min(c.I,1.5))},transparent 18%)`,
    kf:seq([0, 1, 2, 3, 0], k => { const a = k * 1.7 + i * 2; return {transform:`translate(${f2((x - 50)/2 + Math.cos(a)*10)}%, ${f2((y - 50)/2 + Math.sin(a)*10)}%) scale(${f2(1 + Math.sin(a)*.2)})`}; }), easing:"ease-in-out"}))}));
  E("aura", "오라", {d:{duration:2600, color:"#ffcf4f"}}, c => ({layers:[{css:`inset:-6%;border-radius:inherit;filter:blur(${f2(6*c.I)}px);background:${hexA(c.color,.35)}`,
    kf:seq([1, 1.06, .98, 1.04, 1], v => ({transform:`scale(${f2(1 + (v - 1)*c.I)})`, opacity:f2(.5 + (v - .98)*6)})), easing:"ease-in-out"}]}));
  E("spikyAura", "기 오라", {d:{duration:600, color:"#ffe14f"}}, c => ({layers:[{css:`inset:-18%;filter:blur(1px) drop-shadow(0 0 6px ${c.color});background:${hexA(c.color,.35*Math.min(c.I,1.6))};clip-path:polygon(${Array.from({length:24}, (_, i) => { const a = i / 24 * Math.PI * 2, r = i % 2 ? 50 : 42; return `${f2(50 + Math.cos(a)*r)}% ${f2(50 + Math.sin(a)*r)}%`; }).join(",")})`,
    kf:seq([1, 1.05, .97, 1.03, 1], (v, i) => ({transform:`scale(${f2(v)}) rotate(${i*4}deg)`, opacity:f2(.6 + (v - .97)*4)})), easing:"linear"}]}));
  E("fireAura", "불꽃 오라", {clip:false, d:{duration:900, color:"#ff7a2f"}, density:true}, c => ({layers:Array.from({length:Math.round(6 + 4*c.D)}, () => ({
    css:`left:${f2(c.rnd()*80)}%;bottom:40%;width:22%;height:70%;border-radius:50% 50% 40% 40%;filter:blur(6px);mix-blend-mode:screen;background:radial-gradient(ellipse at 50% 80%,${hexA("#fff2a0",.8)},${hexA(c.color,.6*Math.min(c.I,1.5))} 40%,transparent 70%);opacity:0`,
    kf:[{opacity:0, transform:"translateY(20%) scale(.6)"}, {opacity:1, transform:"translateY(-10%) scale(1)"}, {opacity:0, transform:"translateY(-40%) scale(.5)"}], at:c.rnd(), dur:.7 + c.rnd()*.4, easing:"ease-out"}))}));
  E("iceAura", "냉기 오라", {d:{duration:3000, color:"#a8e8ff"}}, c => ({layers:[
    {css:`inset:0;border-radius:inherit;box-shadow:inset 0 0 ${f2(18*c.I)}px ${hexA(c.color,.7)},0 0 ${f2(10*c.I)}px ${hexA(c.color,.5)}`, kf:seq([.6, 1, .6], v => ({opacity:v})), easing:"ease-in-out"},
    ...Array.from({length:6}, () => ({css:`left:${f2(c.rnd()*95)}%;top:${f2(c.rnd()*95)}%;width:6px;height:6px;background:#fff;clip-path:polygon(50% 0%,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0% 50%,42% 42%);opacity:0`,
      kf:[{opacity:0, transform:"scale(0)"}, {opacity:1, transform:"scale(1)"}, {opacity:0, transform:"scale(0)"}], at:c.rnd(), dur:.4, easing:"ease-in-out"}))]}));
  E("heatShimmer", "열기 아지랑이", {d:{duration:1400, color:"#ff9a4f"}}, c => ({layers:[{css:`left:-5%;right:-5%;top:-30%;height:40%;filter:blur(6px);background:linear-gradient(to top,${hexA(c.color,.35*c.I)},transparent)`,
    kf:seq([0, 1, 0], v => ({transform:`skewX(${f2((v - .5)*6)}deg) scaleY(${f2(1 + v*.15)})`})), easing:"ease-in-out"}],
    self:{easing:"ease-in-out", kf:seq([0, 1, -1, 0], v => ({transform:c.T(`skewX(${f2(v*.8*c.I)}deg)`)}))}}));

  /* 회전 · 소용돌이 */
  E("conicHalo", "회전 광륜", {d:{duration:2400}}, c => ({layers:[{css:`${centered(130)};border-radius:50%;background:conic-gradient(from 0deg,transparent,${c.color},transparent 40%);-webkit-mask:radial-gradient(closest-side,transparent 82%,#000 84%,#000 94%,transparent 96%);mask:radial-gradient(closest-side,transparent 82%,#000 84%,#000 94%,transparent 96%);filter:drop-shadow(0 0 ${f2(4*c.I)}px ${c.color})`,
    kf:[{transform:"rotate(0deg)"}, {transform:"rotate(360deg)"}], easing:"linear"}]}));
  E("vortex", "소용돌이", {clip:true, d:{duration:3000, color:"#8a7aff"}}, c => ({layers:[{css:`${centered(170)};border-radius:50%;background:repeating-conic-gradient(${hexA(c.color,.45*Math.min(c.I,1.6))} 0deg 10deg,transparent 10deg 30deg);-webkit-mask:radial-gradient(closest-side,transparent 8%,#000 30%,transparent 72%);mask:radial-gradient(closest-side,transparent 8%,#000 30%,transparent 72%)`,
    kf:[{transform:"rotate(0deg) scale(1)"}, {transform:"rotate(-360deg) scale(1)"}], easing:"linear"}]}));
  E("portal", "포털", {d:{duration:4000, color:"#4fffe0"}}, c => ({layers:[
    {css:`${centered(80)};border-radius:50%;background:radial-gradient(closest-side,#000 40%,${hexA(c.color,.25)} 70%,transparent)`, kf:null},
    {css:`${centered(80)};border-radius:50%;background:repeating-conic-gradient(${c.color} 0deg 4deg,transparent 4deg 22deg);-webkit-mask:radial-gradient(closest-side,transparent 62%,#000 66%,transparent 100%);mask:radial-gradient(closest-side,transparent 62%,#000 66%,transparent 100%);filter:drop-shadow(0 0 ${f2(6*c.I)}px ${c.color})`,
      kf:[{transform:"rotate(0deg)"}, {transform:"rotate(360deg)"}], easing:"linear"}]}));
  E("dualRings", "역회전 고리", {d:{duration:5000}}, c => ({layers:[[86, 1], [66, -1]].map(([s, d]) => ({css:`${centered(s)};border-radius:50%;border:${f2(Math.max(1, 2*c.I))}px dashed ${c.color}`,
    kf:[{transform:"rotate(0deg)"}, {transform:`rotate(${d*360}deg)`}], easing:"linear"}))}));
  for(const n of [1, 2, 3])
    E("orbs" + n, `궤도 구슬 ${n}개`, {d:{duration:3000 + n*500, color:"#ffd27a"}}, c => ({layers:Array.from({length:n}, (_, i) => ({
      css:`left:0;top:0;width:${f2(10*c.I)}px;height:${f2(10*c.I)}px;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,#fff 0 25%,${c.color} 55%,transparent 72%);filter:drop-shadow(0 0 6px ${c.color})`,
      kf:Array.from({length:13}, (_, k) => { const a = (k / 12 + i / n) * Math.PI * 2; return {offset:f2(k / 12), ...at(50 + Math.cos(a)*62, 50 + Math.sin(a)*62), transform:`scale(${f2(.75 + .25*Math.sin(a))})`}; }), easing:"linear"}))}));
  E("photonTrail", "광자 궤적", {d:{duration:3000, color:"#ffffff"}}, c => ({layers:[0, .03, .06].map((d, i) => ({
    css:`left:0;top:0;width:${f2((8 - i*2)*c.I)}px;height:${f2((8 - i*2)*c.I)}px;translate:-50% -50%;border-radius:50%;background:${c.color};box-shadow:0 0 8px ${c.color};opacity:${f2(1 - i*.3)}`,
    kf:perimeter(c.w, c.h), at:-d, easing:"linear"}))}));

  /* 빔 · 레이저 */
  E("laserScan", "레이저 스캔", {clip:true, d:{duration:1800, color:"#ff3d3d"}}, c => ({layers:[{css:`left:0;top:0;bottom:0;width:2px;background:${c.color};box-shadow:0 0 ${f2(8*c.I)}px ${f2(2*c.I)}px ${hexA(c.color,.8)}`,
    kf:seq([0, 100, 0], v => ({left:`${v}%`})), easing:"ease-in-out"}]}));
  E("laserGrid", "레이저 격자", {clip:true, d:{duration:2600, color:"#3dff8a"}}, c => ({layers:[
    {css:`left:0;right:0;top:0;height:1px;background:${c.color};box-shadow:0 0 6px ${c.color}`, kf:seq([10, 90, 10], v => ({top:`${v}%`})), easing:"ease-in-out"},
    {css:`left:0;top:0;bottom:0;width:1px;background:${c.color};box-shadow:0 0 6px ${c.color}`, kf:seq([90, 10, 90], v => ({left:`${v}%`})), easing:"ease-in-out", dur:.77}]}));
  E("beamUp", "수직 빔", {clip:false, d:{duration:1600, color:"#4fffe0"}}, c => ({layers:[{css:`left:45%;width:10%;top:-60%;bottom:0;background:linear-gradient(to top,${c.color},${hexA(c.color,.4)} 40%,transparent);filter:blur(2px);mix-blend-mode:screen`,
    kf:seq([.6, 1.4, .6], v => ({transform:`scaleX(${f2(v*Math.min(c.I,1.6))})`, opacity:f2(.5 + v*.35)})), easing:"ease-in-out"}]}));
  E("beamCross", "수평 빔", {clip:false, d:{duration:1600, color:"#ff4fd8"}}, c => ({layers:[{css:`top:45%;height:10%;left:-30%;right:-30%;background:linear-gradient(90deg,transparent,${c.color},transparent);filter:blur(2px);mix-blend-mode:screen`,
    kf:seq([.5, 1.3, .5], v => ({transform:`scaleY(${f2(v*Math.min(c.I,1.6))})`, opacity:f2(.4 + v*.4)})), easing:"ease-in-out"}]}));
  E("speedLines", "속도선", {clip:true, density:true, tail:true, poster:1.3, d:{duration:700, color:"#ffffff"}}, c => ({layers:Array.from({length:Math.round(10 + 8*c.D)}, () => ({
    css:`left:0;top:${f2(c.rnd()*100)}%;width:${f2(20 + c.rnd()*30)}%;height:${f2(1 + c.rnd()*1.5)}px;background:linear-gradient(90deg,transparent,${hexA(c.color,.85)});opacity:0`,
    kf:[{left:"110%", opacity:1}, {left:"-60%", opacity:1}], at:c.rnd(), dur:.6 + c.rnd()*.5, easing:"linear"}))}));
  E("surgeBands", "에너지 물결 띠", {clip:true, d:{duration:1800}}, c => ({layers:[0, .33, .66].map(a => ({css:`left:0;right:0;top:0;height:20%;background:linear-gradient(to bottom,transparent,${hexA(c.color,.4*Math.min(c.I,1.6))},transparent);opacity:0`,
    kf:[{transform:"translateY(500%)", opacity:1}, {transform:"translateY(-100%)", opacity:1}], at:a, easing:"linear"}))}));
  E("drain", "에너지 흡수", {clip:true, d:{duration:2000, color:"#8a7aff"}}, c => ({layers:[0, .5].map(a => ({css:`left:0;right:0;top:0;height:30%;background:linear-gradient(to bottom,transparent,${hexA(c.color,.35*c.I)},transparent);opacity:0`,
    kf:[{transform:"translateY(-100%)", opacity:1}, {transform:"translateY(340%)", opacity:1}], at:a, easing:"ease-in"})), self:{easing:"ease-in-out", kf:seq([1, .75, 1], v => ({filter:`brightness(${f2(1 - (1 - v)*c.I)}) saturate(${f2(v)})`}))}}));
  E("overcharge", "과충전", {d:{duration:900, color:"#ffe14f"}}, c => ({layers:[{css:`inset:-3px;border-radius:inherit;box-shadow:0 0 ${f2(14*c.I)}px ${f2(3*c.I)}px ${hexA(c.color,.85)}`,
    kf:seq([.3, 1, .3], v => ({opacity:v})), easing:"ease-in-out"}], self:{easing:"ease-in-out", kf:seq([1, 1 + .5*c.I, 1], v => ({filter:`brightness(${f2(v)})`}))}}));

  /* 모으기 · 방출 */
  E("converge", "에너지 모음", {d:{duration:1800, color:"#7aa8ff"}, density:true, tail:true, poster:1.4}, c => { const n = Math.round(10 + 6*c.D); return {layers:[
    ...Array.from({length:n}, (_, i) => { const a = i / n * Math.PI * 2, d = 60 + c.rnd()*20;
      return {css:`left:0;top:0;width:4px;height:4px;translate:-50% -50%;border-radius:50%;background:${c.color};box-shadow:0 0 6px ${c.color};opacity:0`,
        kf:[{offset:0, ...at(50 + Math.cos(a)*d, 50 + Math.sin(a)*d), opacity:0}, {offset:.2, opacity:1}, {offset:.85, ...at(50, 50), opacity:1}, {offset:1, ...at(50, 50), opacity:0}], at:c.rnd()*.3, dur:.8, easing:"ease-in"}; }),
    {css:`${centered(30)};border-radius:50%;background:radial-gradient(closest-side,#fff,${c.color} 40%,transparent);opacity:0`, kf:[{offset:0, opacity:0, transform:"scale(.3)"}, {offset:.85, opacity:0, transform:"scale(.3)"}, {offset:.92, opacity:1, transform:`scale(${f2(1 + c.I)})`}, {offset:1, opacity:0, transform:"scale(1.4)"}], easing:"ease-out"}]}; });
  E("discharge", "방전 폭발", {poster:.15, d:{duration:1500, color:"#9fd8ff"}}, c => ({layers:[
    {css:`${centered(40)};border-radius:50%;background:radial-gradient(closest-side,#fff,${c.color} 45%,transparent);opacity:0`, kf:[{offset:0, opacity:1, transform:"scale(.4)"}, {offset:.3, opacity:0, transform:`scale(${f2(1.5 + c.I)})`}, {offset:1, opacity:0}], easing:"ease-out"},
    ...Array.from({length:10}, (_, i) => ({css:`left:50%;top:50%;width:${f2(30 + c.rnd()*25)}%;height:2px;transform-origin:0% 50%;background:linear-gradient(90deg,#fff,${c.color},transparent);opacity:0`,
      kf:[{offset:0, opacity:1, transform:`rotate(${i*36 + Math.round(c.rnd()*20)}deg) scaleX(0)`}, {offset:.35, opacity:1, transform:`rotate(${i*36}deg) scaleX(1)`}, {offset:.5, opacity:0, transform:`rotate(${i*36}deg) scaleX(1.2)`}, {offset:1, opacity:0, transform:`rotate(${i*36}deg) scaleX(1.2)`}], easing:"ease-out"}))]}));
  E("chargeBar", "충전 막대", {d:{duration:2400, color:"#3dff8a"}}, c => ({layers:[
    {css:`left:6%;right:6%;bottom:8%;height:8%;border:1px solid ${hexA(c.color,.7)};border-radius:3px`, kf:null},
    {css:`left:6%;bottom:8%;height:8%;border-radius:3px;background:linear-gradient(90deg,${hexA(c.color,.5)},${c.color});box-shadow:0 0 ${f2(8*c.I)}px ${c.color}`, kf:[{offset:0, width:"0%", opacity:1}, {offset:.8, width:"88%", opacity:1}, {offset:.85, width:"88%", opacity:.2, easing:STEP}, {offset:.9, width:"88%", opacity:1, easing:STEP}, {offset:1, width:"88%", opacity:1}], easing:"ease-in"}]}));
  E("pulseCore", "에너지 핵", {d:{duration:1400, color:"#ff4f7a"}}, c => ({layers:[{css:`${centered(28)};border-radius:50%;background:radial-gradient(closest-side,#fff 0 20%,${c.color} 45%,transparent);filter:drop-shadow(0 0 10px ${c.color})`,
    kf:seq([.85, 1 + .25*c.I, .85], v => ({transform:`scale(${f2(v)})`})), easing:"ease-in-out"}]}));
  E("starburst", "별빛 폭발", {clip:false, d:{duration:1800, color:"#fff2b0"}}, c => ({layers:[{css:`${centered(160)};border-radius:50%;background:repeating-conic-gradient(${hexA(c.color,.7)} 0deg 1.5deg,transparent 1.5deg 12deg);-webkit-mask:radial-gradient(closest-side,#000 10%,transparent 70%);mask:radial-gradient(closest-side,#000 10%,transparent 70%)`,
    kf:seq([.4, 1 + .2*c.I, .4], v => ({transform:`scale(${f2(v)}) rotate(${f2(v*20)}deg)`, opacity:f2(clamp(v, 0, 1))})), easing:"ease-in-out"}]}));
  E("shieldBubble", "보호막", {clip:false, d:{duration:2400, color:"#7aa8ff"}}, c => ({layers:[{css:`inset:-14%;border-radius:50%;background:radial-gradient(closest-side,transparent 70%,${hexA(c.color,.35*c.I)} 92%,${hexA(c.color,.8)} 100%)`,
    kf:[{offset:0, transform:"scale(1)", opacity:.7}, {offset:.1, transform:"scale(1.05)", opacity:1}, {offset:.25, transform:"scale(1)", opacity:.7}, {offset:1, transform:"scale(1)", opacity:.7}], easing:"ease-out"}]}));
  E("hexShield", "육각 보호막", {clip:false, d:{duration:3000, color:"#4fffe0"}}, c => ({layers:[{css:`inset:-12%;border-radius:50%;background-image:${svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='42'><path d='M12 0l12 7v14l-12 7L0 21V7zM12 28l12 7v7M12 28L0 35v7' fill='none' stroke='${c.color}' stroke-width='1.2'/></svg>`)};background-size:24px 42px;-webkit-mask:radial-gradient(closest-side,transparent 55%,#000 95%,transparent 100%);mask:radial-gradient(closest-side,transparent 55%,#000 95%,transparent 100%)`,
    kf:seq([.3, .9 * Math.min(c.I, 1.1), .3], v => ({opacity:f2(v)})), easing:"ease-in-out"}]}));
  E("ecg", "심전도", {clip:true, d:{duration:1600, color:"#3dff8a"}}, c => ({layers:[{css:`left:0;right:0;top:30%;height:40%;background-image:${svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='40'><path d='M0 20h50l6-8 6 8h8l5-18 6 36 5-18h10l6-6 6 6h52' fill='none' stroke='${c.color}' stroke-width='2'/></svg>`)};background-size:160px 100%;background-repeat:repeat-x;filter:drop-shadow(0 0 ${f2(3*c.I)}px ${c.color});-webkit-mask-image:linear-gradient(90deg,transparent,#000 70%,transparent);mask-image:linear-gradient(90deg,transparent,#000 70%,transparent)`,
    kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"-160px 0px"}], easing:"linear"}]}));
  E("quantum", "양자 잔상", {poster:.12, d:{duration:1300, color:"#b07aff"}}, c => ({layers:[0, 1, 2].map(i => ({css:`inset:0;border-radius:inherit;border:1px solid ${hexA(c.color,.8)};opacity:0`,
    kf:flicker(windows(c.rnd, 2, .1, i === 0 ? .1 : undefined), {opacity:1, transform:`translate(${f2((c.rnd() - .5)*16*c.I)}px, ${f2((c.rnd() - .5)*10*c.I)}px)`}, {opacity:0, transform:"translate(0px, 0px)"})}))}));
}
