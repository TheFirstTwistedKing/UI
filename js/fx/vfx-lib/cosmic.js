/* 우주·천체: 별하늘·성운·은하·블랙홀·혜성 등 20종. 기본 색은 하늘빛. */
import { f2, hexA, clamp, at, seq, centered, svgUrl, SKY, DEEP, PALE, SCREEN, msk, ringG, span, turn, starBg, spike } from "../vfx-util.js";

// 나선 은하: 로그 나선 팔 두 개를 번지게 그리고, 팔을 따라 별을 뿌린다
function galaxySvg(r, col){
  let arms = "", dots = "";
  const star = (x, y, s, o) => `<circle cx='${f2(x)}' cy='${f2(y)}' r='${f2(s)}' fill='${r() < .7 ? "#fff" : col}' opacity='${f2(o)}'/>`;
  for(let a = 0; a < 2; a++){
    const pts = [];
    for(let k = 0; k <= 48; k++){ const t = k / 48, th = a*Math.PI + t*3.4*Math.PI, rr = 8 + t*84; pts.push(`${f2(100 + Math.cos(th)*rr)} ${f2(100 + Math.sin(th)*rr)}`); }
    arms += `<path d='M${pts.join("L")}'/>`;
    for(let k = 0; k < 80; k++){ const t = r(), th = a*Math.PI + t*3.4*Math.PI + (r() - .5)*.4, rr = 8 + t*84 + (r() - .5)*12; dots += star(100 + Math.cos(th)*rr, 100 + Math.sin(th)*rr, .3 + r()*r()*1.4, .4 + r()*.6); }
  }
  for(let k = 0; k < 40; k++){ const th = r()*Math.PI*2, rr = Math.sqrt(r())*94; dots += star(100 + Math.cos(th)*rr, 100 + Math.sin(th)*rr, .3 + r()*.6, .3 + r()*.5); }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><filter id='b' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='7'/></filter><radialGradient id='c'><stop offset='0' stop-color='#fff'/><stop offset='.3' stop-color='${col}' stop-opacity='.75'/><stop offset='1' stop-color='${col}' stop-opacity='0'/></radialGradient></defs><g fill='none' stroke='${col}' stroke-opacity='.4' stroke-width='16' stroke-linecap='round' filter='url(#b)'>${arms}</g><circle cx='100' cy='100' r='36' fill='url(#c)'/>${dots}</svg>`;
}

export function cosmicEffects(def){
  const C = (id, name, o, make) => def("우주·천체", id, name, {color:true, poster:.4, ...o, d:{duration:4000, iterations:0, color:SKY, ...o.d}}, make);
  const dot = (s, col, glow) => `left:0;top:0;width:${s}px;height:${s}px;translate:-50% -50%;border-radius:50%;background:${col};box-shadow:0 0 ${glow}px ${col};opacity:0`;

  C("cosStarfield", "별이 빛나는 하늘", {clip:true, density:true, d:{duration:5000}}, c => {
    const n = Math.round(34 * (.5 + .5*c.D));
    const layers = [0, 1, 2].map(i => ({css:`inset:0;background:${starBg(c.rnd, n, c.color, c.I)}`, kf:seq([.35, 1, .35], v => ({opacity:v})), at:i / 3, easing:"ease-in-out"}));
    for(let i = 0; i < 4; i++){ const s = f2((12 + c.rnd()*14) * c.I), x = 8 + c.rnd()*84, y = 8 + c.rnd()*84;
      layers.push({css:`left:${f2(x)}%;top:${f2(y)}%;width:${s}px;height:${s}px;translate:-50% -50%;background:${spike(c.color, .95)}`,
        kf:seq([.35, 1, .55, 1, .35], v => ({opacity:v, transform:`scale(${f2(.65 + .35*v)})`})), at:c.rnd()*.5, dur:.6 + c.rnd()*.4, easing:"ease-in-out"}); }
    return {layers};
  });
  C("cosStarDrift", "흐르는 별무리", {clip:true, density:true, d:{duration:24000}}, c => ({layers:[[.6, 1, .55], [1, .5, .8], [1.5, .28, 1]].map(([big, dur, a]) => ({
    css:`left:0;top:0;width:200%;height:100%;opacity:${a};background:${starBg(c.rnd, Math.round(22 * (.5 + .5*c.D)), c.color, c.I, big)};background-size:50% 100%;background-repeat:repeat-x`,
    kf:[{transform:"translateX(0%)"}, {transform:"translateX(-50%)"}], dur, easing:"linear"}))}));
  C("cosFlythrough", "별 사이 비행", {clip:true, density:true, d:{duration:6000}, poster:.9}, c => ({layers:[0, 1, 2].map(i => ({
    css:`inset:0;background:${starBg(c.rnd, Math.round(26 * (.5 + .5*c.D)), c.color, c.I, 1.1)};opacity:0`,
    kf:[{offset:0, opacity:0, transform:"scale(.6)"}, {offset:.3, opacity:1}, {offset:.85, opacity:1}, {offset:1, opacity:0, transform:"scale(2.2)"}], at:i / 3, easing:"cubic-bezier(.5,0,.9,.6)"}))}));
  C("cosWarp", "워프 항속", {clip:true, density:true, d:{duration:1800, color:PALE}, poster:.6}, c => {
    const n = Math.round(26 * (.5 + .5*c.D)), R = Math.hypot(c.w, c.h) / 2;
    const layers = [{css:`${centered(30)};border-radius:50%;background:radial-gradient(closest-side,${hexA("#ffffff",.6)},${hexA(c.color,.35)} 40%,transparent);filter:blur(4px)`,
      kf:seq([.6, 1, .6], v => ({opacity:v, transform:`scale(${f2(.8 + .4*v)})`})), easing:"ease-in-out"}];
    for(let i = 0; i < n; i++){ const a = f2(c.rnd()*360), len = f2(R * (.25 + c.rnd()*.35) * c.I), th = f2(1 + c.rnd()*1.2);
      layers.push({css:`left:50%;top:50%;width:${len}px;height:${th}px;margin-top:${f2(-th/2)}px;transform-origin:0 50%;border-radius:${th}px;background:linear-gradient(90deg,transparent,${hexA(c.color,.5)} 40%,#fff);opacity:0`,
        kf:[{offset:0, opacity:0, transform:`rotate(${a}deg) translateX(${f2(R*.05)}px) scaleX(.05)`}, {offset:.25, opacity:1}, {offset:1, opacity:0, transform:`rotate(${a}deg) translateX(${f2(R*1.05)}px) scaleX(1)`}],
        at:c.rnd(), dur:.5 + c.rnd()*.5, easing:"cubic-bezier(.55,0,1,.6)"}); }
    return {layers};
  });
  C("cosNebula", "성운", {clip:true, d:{duration:16000}}, c => {
    const I = Math.min(c.I, 1.6), blobs = [[c.color, 30, 40, 90, 22], [DEEP, 68, 55, 100, 26], ["#a46bff", 52, 30, 70, 18], ["#3df0ff", 40, 72, 60, 16], [c.color, 80, 25, 50, 14]];
    const layers = blobs.map(([col, x, y, s, b], i) => ({css:`left:${x}%;top:${y}%;width:${s}%;aspect-ratio:1.6;translate:-50% -50%;border-radius:50%;background:radial-gradient(closest-side,${hexA(col,.5*I)},${hexA(col,.16*I)} 55%,transparent);filter:blur(${b}px);${SCREEN}`,
      kf:seq([0, 1, 0], v => { const a = i*1.7 + v*2; return {transform:`translate(${f2(Math.cos(a)*8)}%, ${f2(Math.sin(a)*6)}%) rotate(${f2(i*40 + v*25)}deg) scale(${f2(.9 + .2*v)})`}; }), easing:"ease-in-out"}));
    layers.push({css:`inset:-20%;opacity:${f2(clamp(.6*c.I, 0, 1))};background:radial-gradient(ellipse 60% 16% at 45% 50%,${hexA(PALE,.35)},transparent 70%),radial-gradient(ellipse 40% 9% at 62% 40%,${hexA(c.color,.4)},transparent 70%);filter:blur(6px);${SCREEN}`,
      kf:seq([-8, 8, -8], v => ({transform:`rotate(${v}deg)`})), easing:"ease-in-out"});
    layers.push({css:`inset:0;background:${starBg(c.rnd, 40, c.color, c.I, .8)}`, kf:seq([.6, 1, .6], v => ({opacity:v})), dur:.3, easing:"ease-in-out"});
    return {layers};
  });
  C("cosGalaxy", "나선 은하", {clip:true, d:{duration:60000}}, c => ({layers:[
    {css:`${centered(150)};background:${svgUrl(galaxySvg(c.rnd, c.color))} center/100% 100% no-repeat;opacity:${f2(clamp(.55 + .35*c.I, 0, 1))};${SCREEN}`,
      kf:[{transform:"perspective(900px) rotateX(55deg) rotate(0deg)"}, {transform:"perspective(900px) rotateX(55deg) rotate(-360deg)"}], easing:"linear"},
    {css:`${centered(34)};border-radius:50%;background:radial-gradient(closest-side,${hexA("#ffffff",.75)},${hexA(c.color,.3)} 45%,transparent);filter:blur(5px)`,
      kf:seq([.8, 1, .8], v => ({opacity:v, transform:`scale(${f2(.9 + .15*v)})`})), dur:.08, easing:"ease-in-out"}]}));
  C("cosBlackHole", "블랙홀", {d:{duration:5000, color:"#9fd8ff"}}, c => {
    const diskBg = `repeating-conic-gradient(from 0deg,${hexA(c.color,.85)} 0deg 3deg,${hexA(c.color,.3)} 3deg 7deg,${hexA("#ffffff",.8)} 7deg 8deg,${hexA(c.color,.15)} 8deg 14deg)`;
    const ringM = "radial-gradient(closest-side,transparent 30%,#000 36%,#000 58%,transparent 72%)", front = "linear-gradient(to bottom,transparent 50%,#000 50%)";
    const tilt = a => `perspective(700px) rotateX(74deg) rotate(${a}deg)`;
    // 강착원반: 뒤쪽 절반은 사건의 지평선에 가리고, 앞쪽 절반이 그 위를 지나간다
    const disk = near => ({css:`${centered(130)};border-radius:50%;background:${diskBg};filter:blur(.8px) brightness(${f2(.8 + .3*c.I)});${msk(near ? `${ringM},${front}` : ringM)}${near ? ";-webkit-mask-composite:source-in;mask-composite:intersect" : ""}`,
      kf:[{transform:tilt(0)}, {transform:tilt(360)}], easing:"linear"});
    return {layers:[
      {css:`${centered(110)};border-radius:50%;background:radial-gradient(closest-side,transparent 30%,${hexA(c.color,.35*c.I)} 42%,transparent 75%);filter:blur(10px)`, kf:seq([.8, 1, .8], v => ({opacity:v, transform:`scale(${v})`})), easing:"ease-in-out"},
      disk(false),
      {css:`${centered(58)};border-radius:50%;border:${f2(2 + c.I)}px solid ${hexA("#ffffff",.85)};border-bottom-color:transparent;border-left-color:${hexA(c.color,.45)};border-right-color:${hexA(c.color,.45)};filter:blur(1.5px)`, kf:seq([.7, 1, .7], v => ({opacity:v})), easing:"ease-in-out"},
      {css:`${centered(34)};border-radius:50%;box-shadow:0 0 3px 1px #fff,0 0 12px 3px ${hexA(c.color,.9)},0 0 34px 8px ${hexA(c.color,.4)}`, kf:seq([.85, 1, .85], v => ({opacity:v})), dur:.5, easing:"ease-in-out"},
      {css:`${centered(32)};border-radius:50%;background:radial-gradient(circle,#000 62%,#01030a)`, kf:null},
      disk(true)]};
  });
  C("cosWormhole", "웜홀", {clip:true, d:{duration:3000}, poster:.95}, c => {
    const N = 10, layers = [{css:`${centered(150)};border-radius:50%;background:conic-gradient(${hexA(c.color,0)},${hexA(c.color,.45*c.I)},${hexA(DEEP,.1)},${hexA(c.color,.4*c.I)},${hexA(c.color,0)});${msk("radial-gradient(closest-side,transparent 4%,#000 24%,#000 50%,transparent 70%)")};filter:blur(6px);${SCREEN}`,
      kf:[{transform:"rotate(0deg)"}, {transform:"rotate(360deg)"}], dur:2, easing:"linear"}];
    for(let i = 0; i < N; i++) layers.push({css:`${centered(120)};border-radius:50%;border:${f2(Math.max(1, c.I))}px solid ${hexA(c.color,.75)};border-top-color:${hexA(PALE,.95)};box-shadow:0 0 8px ${hexA(c.color,.5)},inset 0 0 8px ${hexA(c.color,.35)};opacity:0`,
      kf:[{offset:0, opacity:0, transform:"scale(1.2) rotate(0deg) translate(0%, 0%)"}, {offset:.35, opacity:.85}, {offset:1, opacity:0, transform:"scale(.02) rotate(160deg) translate(14%, -10%)"}], at:i / N, easing:"cubic-bezier(.3,0,.9,.6)"});
    layers.push({css:`${centered(16)};border-radius:50%;background:radial-gradient(closest-side,#fff,${hexA(c.color,.7)} 40%,transparent)`, kf:seq([.7, 1, .7], v => ({transform:`scale(${v})`})), easing:"ease-in-out"});
    return {layers};
  });
  C("cosComet", "혜성", {clip:true, d:{duration:5000}, poster:.45}, c => {
    const g = span(c, -15, 25, 115, 70), L = f2(Math.min(c.w, 420) * .45 * c.I);
    const path = [{offset:0, ...at(-15, 25), opacity:0}, {offset:.1, opacity:1}, {offset:.85, opacity:1}, {offset:1, ...at(115, 70), opacity:0}];
    const tail = (len, th, col, a, dAng) => ({css:`left:0;top:0;width:${f2(len)}px;height:${th}px;margin:${f2(-th/2)}px 0 0 ${f2(-len)}px;transform-origin:100% 50%;transform:rotate(${f2(g.ang + dAng)}deg);border-radius:50%;background:linear-gradient(90deg,transparent,${hexA(col,a*.25)} 45%,${hexA(col,a)} 92%,#fff);filter:blur(${f2(th/4)}px);opacity:0`, kf:path, easing:"linear"});
    return {layers:[tail(L, f2(Math.max(4, 10*c.I)), c.color, .45, 4), tail(L*1.3, f2(Math.max(1.5, 3*c.I)), PALE, .85, 0),
      {css:`${dot(f2(16*c.I), "transparent", 0)};background:radial-gradient(circle,#fff 0 18%,${hexA(c.color,.8)} 35%,transparent 70%);box-shadow:none;filter:drop-shadow(0 0 6px ${c.color})`, kf:path, easing:"linear"}]};
  });
  C("cosMeteors", "유성우", {clip:true, density:true, d:{duration:3000, color:PALE}, poster:.5}, c => {
    const n = Math.round(12 * (.5 + .5*c.D)), rad = 32 * Math.PI / 180, layers = [];
    for(let i = 0; i < n; i++){
      const x = -10 + c.rnd()*90, y = -10 + c.rnd()*50, d = 35 + c.rnd()*35, x1 = x + Math.cos(rad)*d, y1 = y + Math.sin(rad)*d * c.w / c.h;
      const len = f2((60 + c.rnd()*90) * c.I), th = f2(1.5 + c.rnd()*1.3), g = span(c, x, y, x1, y1);
      layers.push({css:`left:0;top:0;width:${len}px;height:${th}px;margin:${f2(-th/2)}px 0 0 ${-len}px;transform-origin:100% 50%;transform:rotate(${g.ang}deg);border-radius:${th}px;background:linear-gradient(90deg,transparent,${hexA(c.color,.7)} 65%,#fff);box-shadow:0 0 6px ${hexA(c.color,.8)};opacity:0`,
        kf:[{offset:0, ...at(x, y), opacity:0}, {offset:.08, opacity:1}, {offset:.32, ...at(x1, y1), opacity:0}, {offset:1, ...at(x1, y1), opacity:0}], at:c.rnd(), dur:.6 + c.rnd()*.5, easing:"cubic-bezier(.3,.6,.6,1)"});
    }
    return {layers};
  });
  C("cosPlanet", "고리 행성", {d:{duration:20000, color:"#9fd8ff"}}, c => {
    const ringBg = `radial-gradient(closest-side,transparent 60%,${hexA(c.color,.3)} 61%,${hexA(c.color,.75)} 66%,${hexA(PALE,.45)} 69%,${hexA(c.color,.15)} 71.5%,${hexA(c.color,.6)} 74%,${hexA(c.color,.4)} 84%,transparent 86.5%,${hexA(PALE,.3)} 89%,transparent 93%)`;
    const ringM = "radial-gradient(closest-side,#000 96%,transparent 97%)", front = "linear-gradient(to bottom,transparent 50%,#000 50%)";
    // 고리 뒤쪽은 행성에 가리고, 앞쪽 절반만 행성 위에 다시 그린다
    const ring = near => ({css:`left:50%;top:50%;width:110%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:${ringBg};${msk(near ? `${ringM},${front}` : ringM)}${near ? ";-webkit-mask-composite:source-in;mask-composite:intersect" : ""};filter:blur(.4px);transform:rotate(-16deg) scaleY(.26);opacity:${f2(clamp(.6 + .3*c.I, 0, 1))}`, kf:null});
    return {layers:[ring(false),
      {css:`${centered(50)};border-radius:50%;background:radial-gradient(circle at 34% 30%,#fff 0,${c.color} 22%,${hexA(DEEP,.95)} 58%,#040818 82%);box-shadow:0 0 ${f2(24*c.I)}px ${hexA(c.color,.45)},inset -10px -8px 24px rgba(0,0,10,.85)`, kf:null},
      {css:`${centered(50)};border-radius:50%;background:repeating-linear-gradient(8deg,transparent 0 9%,${hexA("#ffffff",.12)} 9% 11%,transparent 11% 17%,${hexA("#001030",.25)} 17% 21%);background-size:200% 100%;${msk("radial-gradient(circle at 40% 40%,#000 40%,transparent 72%)")}`,
        kf:[{backgroundPosition:"0% 0%"}, {backgroundPosition:"200% 0%"}], easing:"linear"},
      {css:`${centered(54)};border-radius:50%;box-shadow:inset 0 0 0 1px ${hexA(PALE,.4)},0 0 8px 1px ${hexA(c.color,.5)}`, kf:seq([.6, 1, .6], v => ({opacity:v})), dur:.25, easing:"ease-in-out"},
      ring(true)]};
  });
  C("cosOrbits", "궤도 운행", {d:{duration:9000}}, c => {
    const tilt = -14 * Math.PI / 180, sq = .38;
    const layers = [{css:`${centered(14)};border-radius:50%;background:radial-gradient(circle,#fff 0 20%,${c.color} 40%,transparent 72%);filter:drop-shadow(0 0 10px ${c.color})`, kf:seq([.9, 1.1, .9], v => ({transform:`scale(${v})`})), dur:.3, easing:"ease-in-out"}];
    [[24, 1/3, 6], [36, .55, 8], [48, 1, 10]].forEach(([r, dur, s]) => {
      layers.push({css:`${centered(r*2)};border-radius:50%;border:1px solid ${hexA(c.color,.35)};transform:rotate(-14deg) scaleY(${sq})`, kf:null});
      const rx = r / 100 * c.w, ry = rx * sq, p0 = c.rnd() * Math.PI * 2;
      layers.push({css:`left:0;top:0;width:${s}px;height:${s}px;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,${c.color} 45%,${hexA(DEEP,.9)});box-shadow:0 0 8px ${hexA(c.color,.8)}`,
        kf:turn(24, t => { const a = p0 + t*Math.PI*2, ex = Math.cos(a)*rx, ey = Math.sin(a)*ry, z = (Math.sin(a) + 1) / 2;
          return {...at(50 + (ex*Math.cos(tilt) - ey*Math.sin(tilt)) / c.w * 100, 50 + (ex*Math.sin(tilt) + ey*Math.cos(tilt)) / c.h * 100), transform:`scale(${f2(.75 + .35*z)})`, opacity:f2(.65 + .35*z)}; }), dur, easing:"linear"});
    });
    return {layers};
  });
  C("cosSupernova", "초신성", {d:{duration:3600, color:"#a8dcff"}, poster:.12}, c => {
    const layers = [
      {css:`${centered(140)};border-radius:50%;background:radial-gradient(closest-side,${hexA(c.color,.35*c.I)},${hexA(DEEP,.12)} 50%,transparent);filter:blur(8px);opacity:0`, kf:[{offset:0, opacity:0, transform:"scale(.3)"}, {offset:.15, opacity:1}, {offset:.75, opacity:.7}, {offset:1, opacity:0, transform:"scale(1.1)"}], easing:"ease-out"},
      ...[0, .06].map(d => ({css:`${centered(30)};border-radius:50%;border:${f2(Math.max(1, 1.5*c.I))}px solid ${hexA(PALE,.9)};box-shadow:0 0 12px ${c.color},inset 0 0 12px ${hexA(c.color,.6)};opacity:0`,
        kf:[{offset:0, opacity:0, transform:"scale(.2)"}, {offset:.06, opacity:1}, {offset:.65, opacity:0, transform:`scale(${f2(3.5*c.I)})`}, {offset:1, opacity:0, transform:`scale(${f2(3.5*c.I)})`}], at:d, easing:"cubic-bezier(.1,.6,.3,1)"})),
      {css:`${centered(26)};border-radius:50%;background:radial-gradient(closest-side,#fff 0 25%,${c.color} 50%,transparent);opacity:0`,
        kf:[{offset:0, opacity:0, transform:"scale(.2)"}, {offset:.05, opacity:1, transform:`scale(${f2(1.6*c.I)})`}, {offset:.35, opacity:.8, transform:"scale(.8)"}, {offset:1, opacity:.2, transform:"scale(.5)"}], easing:"ease-out"}];
    for(let i = 0; i < 18; i++){ const a = i / 18 * Math.PI * 2 + c.rnd()*.3, d = (28 + c.rnd()*26) * c.I, x = 50 + Math.cos(a)*d, y = 50 + Math.sin(a)*d*c.w/c.h;
      layers.push({css:dot(f2(2 + c.rnd()*3), c.rnd() < .5 ? "#ffffff" : c.color, 6),
        kf:[{offset:0, ...at(50, 50), opacity:0}, {offset:.05, opacity:1}, {offset:.8, ...at(x, y), opacity:0}, {offset:1, ...at(x, y), opacity:0}], easing:"cubic-bezier(.05,.7,.3,1)"}); }
    return {layers};
  });
  C("cosPulsar", "펄서", {clip:true, d:{duration:2400}}, c => {
    const D = f2(Math.hypot(c.w, c.h) * 1.1), bw = f2(Math.max(14, Math.min(c.w, c.h) * .22));
    return {layers:[
      ...[30, -30].map(a => ({css:`${centered(70)};border-radius:50%;border:1px solid ${hexA(c.color,.3)};transform:rotate(${a}deg) scaleY(.32)`, kf:null})),
      {css:`left:50%;top:50%;width:${D}px;height:${bw}px;margin:${f2(-bw/2)}px 0 0 ${f2(-D/2)}px;clip-path:polygon(0 0,50% 46%,100% 0,100% 100%,50% 54%,0 100%);background:linear-gradient(90deg,transparent,${hexA(c.color,.35*c.I)} 25%,${hexA(PALE,.9)} 50%,${hexA(c.color,.35*c.I)} 75%,transparent);filter:blur(2px);${SCREEN}`,
        kf:[{transform:"rotate(0deg)"}, {transform:"rotate(360deg)"}], easing:"linear"},
      {css:`${centered(14)};border-radius:50%;background:radial-gradient(circle,#fff 0 30%,${c.color} 55%,transparent 72%);filter:drop-shadow(0 0 8px ${c.color})`,
        kf:seq([.7, 1.3, .7, 1.3, .7], v => ({transform:`scale(${v})`, opacity:f2(.6 + (v - .7)/1.5)})), easing:"ease-in-out"}]};
  });
  C("cosEclipse", "개기일식 코로나", {d:{duration:7000, color:"#bfe6ff"}}, c => ({layers:[
    ...[0, 1].map(i => ({css:`${centered(100)};border-radius:50%;background:repeating-conic-gradient(from ${i*7}deg,${hexA(c.color,.5*c.I)} 0deg 1deg,transparent 1deg ${i ? 9 : 6}deg);${msk("radial-gradient(closest-side,transparent 38%,#000 41%,transparent 98%)")};filter:blur(${i ? 2.5 : 1}px);${SCREEN}`,
      kf:seq([0, 1, 0], v => ({transform:`rotate(${f2((i ? -1 : 1) * v * 6)}deg) scale(${f2(.96 + .06*v)})`, opacity:f2(.7 + .3*v)})), at:i * .3, easing:"ease-in-out"})),
    {css:`${centered(60)};border-radius:50%;background:radial-gradient(closest-side,transparent 60%,${hexA(PALE,.9)} 66%,${hexA(c.color,.45)} 74%,transparent);filter:blur(1px)`, kf:seq([.85, 1, .85], v => ({opacity:v})), easing:"ease-in-out"},
    {css:`${centered(40)};border-radius:50%;background:radial-gradient(circle at 48% 48%,#020309,#000 70%);box-shadow:0 0 2px 1px ${hexA("#ffffff",.8)}`, kf:null},
    // 다이아몬드 링: 달 가장자리에서 잠깐 터지는 빛
    {css:`left:${f2(50 + 20*Math.cos(-.8))}%;top:calc(50% + ${f2(Math.sin(-.8) * .2 * c.w)}px);width:${f2(44*c.I)}px;height:${f2(44*c.I)}px;translate:-50% -50%;background:${spike("#ffffff", 1)};opacity:0`,
      kf:[{offset:0, opacity:0, transform:"scale(.3)"}, {offset:.42, opacity:0, transform:"scale(.3)"}, {offset:.5, opacity:1, transform:"scale(1.2)"}, {offset:.62, opacity:0, transform:"scale(.6)"}, {offset:1, opacity:0, transform:"scale(.3)"}], easing:"ease-in-out"}]}));
  C("cosStarBirth", "별의 탄생", {d:{duration:4200}, poster:.82}, c => {
    const layers = [];
    for(let i = 0; i < 20; i++){ const a = c.rnd()*Math.PI*2, d = 30 + c.rnd()*25, sw = (c.rnd() - .5)*1.2;
      layers.push({css:dot(f2(1.5 + c.rnd()*2.5), c.rnd() < .6 ? c.color : "#ffffff", 5),
        kf:turn(8, t => { const p = Math.min(1, t / .75), ang = a + sw*p*2, dd = d * (1 - p*.95);
          return {...at(50 + Math.cos(ang)*dd, 50 + Math.sin(ang)*dd*c.w/c.h), opacity:f2(t > .75 ? 0 : p < .2 ? p / .2 : 1)}; }), easing:"ease-in"}); }
    layers.push({css:`${centered(50)};border-radius:50%;background:radial-gradient(closest-side,${hexA(c.color,.4*c.I)},transparent);filter:blur(10px)`,
      kf:[{offset:0, opacity:.2, transform:"scale(1.3)"}, {offset:.75, opacity:.8, transform:"scale(.5)"}, {offset:.82, opacity:1, transform:"scale(.7)"}, {offset:1, opacity:.2, transform:"scale(1.3)"}], easing:"ease-in-out"});
    layers.push({css:`${centered(30)};background:${spike(c.color, 1)};opacity:0`,
      kf:[{offset:0, opacity:0, transform:"scale(.2) rotate(0deg)"}, {offset:.72, opacity:0, transform:"scale(.2) rotate(0deg)"}, {offset:.8, opacity:1, transform:`scale(${f2(1.3*c.I)}) rotate(20deg)`}, {offset:1, opacity:0, transform:"scale(.8) rotate(45deg)"}], easing:"ease-out"});
    return {layers};
  });
  C("cosDust", "우주 먼지", {clip:true, density:true, d:{duration:10000, color:"#b9e3ff"}}, c => ({layers:Array.from({length:Math.round(32 * (.5 + .5*c.D))}, () => {
    const x = c.rnd()*100, y = c.rnd()*100, dx = (c.rnd() - .5)*20, dy = (c.rnd() - .5)*14, s = f2(1.5 + c.rnd()*c.rnd()*6), a = f2(Math.min(1, .7*c.I + .3));
    return {css:`left:0;top:0;width:${s}px;height:${s}px;translate:-50% -50%;border-radius:50%;background:${hexA(c.rnd() < .5 ? "#ffffff" : c.color, .9)};box-shadow:0 0 ${f2(s*2)}px ${hexA(c.color,.6)};filter:blur(${f2(s > 4 ? s*.35 : 0)}px);opacity:0`,
      kf:[{offset:0, ...at(x, y), opacity:0}, {offset:.2, opacity:a}, {offset:.8, opacity:a}, {offset:1, ...at(x + dx, y + dy), opacity:0}], at:c.rnd()*.25, dur:.6 + c.rnd()*.4, easing:"linear"};
  })}));
  C("cosConstellation", "별자리 잇기", {d:{duration:6000}, poster:.8}, c => {
    const n = 7, pts = []; let x = 10 + c.rnd()*6, y = 30 + c.rnd()*40;
    for(let i = 0; i < n; i++){ pts.push([x, y]); x = Math.min(92, x + 76 / (n - 1) * (.85 + c.rnd()*.3)); y = clamp(y + (c.rnd() - .5)*40, 12, 88); }
    const seg = .6 / (n - 1), layers = [];
    for(let i = 0; i < n - 1; i++){ const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], g = span(c, x1, y1, x2, y2), s = f2(.05 + i*seg), e = f2(s + seg), R = `rotate(${g.ang}deg)`;
      layers.push({css:`left:${f2(x1)}%;top:${f2(y1)}%;width:${g.len}px;height:1px;transform-origin:0 50%;background:linear-gradient(90deg,${hexA(c.color,.8)},${hexA(PALE,.6)});box-shadow:0 0 4px ${hexA(c.color,.9)}`,
        kf:[{offset:0, opacity:0, transform:`${R} scaleX(0)`}, {offset:s, opacity:1, transform:`${R} scaleX(0)`}, {offset:e, opacity:1, transform:`${R} scaleX(1)`}, {offset:.86, opacity:1, transform:`${R} scaleX(1)`}, {offset:.96, opacity:0, transform:`${R} scaleX(1)`}, {offset:1, opacity:0, transform:`${R} scaleX(0)`}], easing:"ease-in-out"}); }
    pts.forEach(([x, y], i) => { const s = f2((i % 3 === 0 ? 18 : 11) * c.I), t = f2(.05 + Math.max(0, i - .1)*seg);
      layers.push({css:`left:${f2(x)}%;top:${f2(y)}%;width:${s}px;height:${s}px;translate:-50% -50%;background:${spike(c.color, .95)};opacity:0`,
        kf:[{offset:0, opacity:0, transform:"scale(0)"}, {offset:t, opacity:0, transform:"scale(0)"}, {offset:f2(t + .04), opacity:1, transform:"scale(1.25)"}, {offset:f2(t + .1), opacity:1, transform:"scale(1)"}, {offset:.86, opacity:1, transform:"scale(1)"}, {offset:.96, opacity:0, transform:"scale(.6)"}, {offset:1, opacity:0, transform:"scale(0)"}], easing:"ease-out"}); });
    return {layers};
  });
  C("cosMilkyWay", "은하수", {clip:true, density:true, d:{duration:30000, color:"#bfe2ff"}}, c => ({layers:[
    {css:`inset:-50%;transform:rotate(-24deg);background:linear-gradient(to bottom,transparent 34%,${hexA(c.color,.18*c.I)} 44%,${hexA("#ffffff",.22*c.I)} 50%,${hexA(c.color,.18*c.I)} 56%,transparent 66%);filter:blur(12px)`, kf:seq([.75, 1, .75], v => ({opacity:v})), easing:"ease-in-out"},
    {css:`left:-50%;top:-50%;width:400%;height:200%;transform-origin:25% 50%;background:${starBg(c.rnd, Math.round(70 * (.5 + .5*c.D)), c.color, c.I, .8)};background-size:25% 100%;${msk("linear-gradient(to bottom,transparent 30%,#000 44%,#000 56%,transparent 70%)")}`,
      kf:[{transform:"rotate(-24deg) translateX(0%)"}, {transform:"rotate(-24deg) translateX(-25%)"}], easing:"linear"},
    {css:`inset:-50%;transform:rotate(-24deg);background:radial-gradient(ellipse 50% 3% at 40% 50%,rgba(0,0,8,.55),transparent),radial-gradient(ellipse 30% 2% at 70% 51%,rgba(0,0,8,.45),transparent);filter:blur(3px)`, kf:null}]}));
  C("cosSpikeStars", "회절 별빛", {clip:true, d:{duration:3600, color:"#cfeaff"}}, c => ({layers:Array.from({length:5}, (_, i) => {
    const s = f2((22 + c.rnd()*30) * c.I), x = 10 + c.rnd()*80, y = 10 + c.rnd()*80;
    return {css:`left:${f2(x)}%;top:${f2(y)}%;width:${s}px;height:${s}px;translate:-50% -50%;background:${spike(c.color, .95)},radial-gradient(circle,${hexA(c.color,.25)},transparent 70%)`,
      kf:seq([.55, 1, .7, 1, .55], v => ({opacity:v, transform:`scale(${f2(.75 + .25*v)}) rotate(${f2((v - .55)*8)}deg)`})), at:i / 5, dur:.7 + c.rnd()*.3, easing:"ease-in-out"};
  })}));
  C("cosAurora", "극지 오로라", {clip:true, d:{duration:9000, color:"#6fffd2"}}, c => ({layers:[[c.color, 0, 8], [SKY, 1, 20], ["#9b7bff", 2, 30]].map(([col, i, top]) => ({
    css:`left:-30%;right:-30%;top:${top - 10}%;height:75%;background:repeating-linear-gradient(90deg,transparent 0 1.1%,${hexA(col,.6*Math.min(c.I,1.4))} 1.5% 1.9%,transparent 2.5% 3.6%),linear-gradient(to bottom,${hexA(col,.0)},${hexA(col,.45*Math.min(c.I,1.4))} 30%,${hexA(col,.1)} 80%,transparent);${msk("radial-gradient(ellipse 55% 60% at 50% 35%,#000 30%,transparent 75%)")};filter:blur(${f2(1.5 + i)}px);${SCREEN}`,
    kf:seq([0, 1, 0], v => ({transform:`translateX(${f2((v - .5) * (i % 2 ? -12 : 12))}%) skewX(${f2((v - .5) * 30 + (i - 1) * 8)}deg) scaleY(${f2(.85 + .3*v)})`, opacity:f2(.5 + .5*v)})), at:i * .18, easing:"ease-in-out"}))}));
}
