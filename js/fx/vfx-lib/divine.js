/* 신성: 후광·빛기둥·마법진·깃털·청염 등 15종. 기본 색은 옅은 하늘빛. */
import { f2, hexA, clamp, at, seq, centered, svgUrl, DEEP, PALE, SCREEN, msk, ringG, turn, spike, glowSvg } from "../vfx-util.js";

const pol = (r, a) => [100 + r*Math.cos(a), 100 + r*Math.sin(a)];
const pt = ([x, y]) => `${f2(x)} ${f2(y)}`;
const circ = (r, cx = 100, cy = 100) => `<circle cx='${f2(cx)}' cy='${f2(cy)}' r='${f2(r)}'/>`;
const line = (a, b, o) => `<path d='M${pt(a)}L${pt(b)}'${o ? ` opacity='${o}'` : ""}/>`;

// 메타트론 큐브: 생명의 열매 13개 원과 모든 중심을 잇는 선
function metatron(col){
  const R = 14, c = [[100, 100]];
  for(const d of [2*R, 4*R]) for(let k = 0; k < 6; k++) c.push(pol(d, k*Math.PI/3 - Math.PI/2));
  let s = c.map(([x, y]) => circ(R, x, y)).join("");
  for(let i = 0; i < c.length; i++) for(let j = i + 1; j < c.length; j++) s += line(c[i], c[j], .55);
  s += circ(4*R + R + 6) + circ(4*R + R + 12);
  return glowSvg("0 0 200 200", col, s, .8, 1.8);
}
// 마법진 바깥 고리: 이중 원 사이에 룬 문자를 새긴다
function sigilOuter(r, col){
  let s = circ(96) + circ(84) + circ(80);
  for(let k = 0; k < 24; k++){
    const a = k / 24 * Math.PI*2, [x, y] = pol(90, a), q = r(), u = 3.2;
    const rot = (dx, dy) => [x + dx*Math.cos(a + Math.PI/2) - dy*Math.sin(a + Math.PI/2), y + dx*Math.sin(a + Math.PI/2) + dy*Math.cos(a + Math.PI/2)];
    const g = q < .25 ? [[[0, -u], [0, u]], [[0, -u], [u, -u/3]]] : q < .5 ? [[[-u, -u], [u, u]], [[u, -u], [-u, u]]] : q < .75 ? [[[-u, u], [0, -u]], [[0, -u], [u, u]], [[-u/2, 0], [u/2, 0]]] : [[[0, -u], [0, u]], [[-u, 0], [u, -u]]];
    s += g.map(([p, q2]) => line(rot(...p), rot(...q2))).join("");
  }
  return glowSvg("0 0 200 200", col, s, 1, 1.8);
}
// 마법진 안쪽: 육망성과 꼭짓점의 작은 원
function sigilInner(col){
  const tri = o => `<path d='M${[0, 1, 2].map(k => pt(pol(72, o + k*2*Math.PI/3))).join("L")}Z'/>`;
  let s = tri(-Math.PI/2) + tri(Math.PI/2) + circ(72) + circ(40) + circ(14);
  for(let k = 0; k < 6; k++) s += circ(6, ...pol(72, -Math.PI/2 + k*Math.PI/3));
  return glowSvg("0 0 200 200", col, s, 1, 1.8);
}
const RUNES = ["M10 3V17M10 3L15 8", "M5 4L15 16M15 4L5 16", "M5 16L10 4L15 16M7 11H13", "M10 3V17M5 8L15 4", "M5 5H15L5 15H15", "M10 3L15 10L10 17L5 10Z"];
const runeSvg = (d, col) => glowSvg("0 0 20 20", col, `<path d='${d}'/>`, 1.8, .9);

export function divineEffects(def){
  const D = (id, name, o, make) => def("신성", id, name, {color:true, poster:.4, ...o, d:{duration:4000, iterations:0, color:"#a9ddff", ...o.d}}, make);
  const mote = (s, col) => `left:0;top:0;width:${s}px;height:${s}px;translate:-50% -50%;border-radius:50%;background:#fff;box-shadow:0 0 6px ${col},0 0 2px #fff;opacity:0`;
  const spin = (dir = 1) => [{transform:"rotate(0deg)"}, {transform:`rotate(${dir*360}deg)`}];

  D("divHaloRings", "신성한 후광 고리", {d:{duration:20000}}, c => ({layers:[
    {css:`${centered(112)};border-radius:50%;background:radial-gradient(closest-side,transparent 55%,${hexA(c.color,.25*c.I)} 70%,transparent);filter:blur(6px)`, kf:seq([.7, 1, .7], v => ({opacity:v})), dur:.25, easing:"ease-in-out"},
    {css:`${centered(104)};border-radius:50%;border:1px solid ${hexA(PALE,.75)};box-shadow:0 0 8px ${hexA(c.color,.7)},inset 0 0 8px ${hexA(c.color,.5)}`, kf:null},
    {css:`${centered(96)};border-radius:50%;background:repeating-conic-gradient(${hexA(c.color,.9)} 0deg .6deg,transparent .6deg 5deg);${msk(ringG(90, 100))};filter:drop-shadow(0 0 3px ${c.color})`, kf:spin(), easing:"linear"},
    {css:`${centered(86)};border-radius:50%;background:repeating-conic-gradient(${hexA(PALE,.9)} 0deg 2deg,transparent 2deg 30deg);${msk(ringG(92, 100))}`, kf:spin(-1), dur:.6, easing:"linear"},
    {css:`${centered(78)};border-radius:50%;border:${f2(Math.max(1, 1.5*c.I))}px dashed ${hexA(c.color,.5)}`, kf:spin(), dur:1.5, easing:"linear"}]}));
  D("divAngelHalo", "천사의 고리", {d:{duration:3200, color:"#cfeeff"}}, c => {
    const h = f2(c.w*.09), top = -(h + 10), float = seq([0, 1, 0], v => ({transform:`translateY(${f2(-6*v)}px)`, opacity:f2(.8 + .2*v)}));
    return {layers:[
      {css:`left:20%;right:20%;top:${f2(top - h*.25)}px;height:${f2(h*1.5)}px;border-radius:50%;background:radial-gradient(closest-side,transparent 50%,${hexA(c.color,.4*c.I)} 75%,transparent);filter:blur(6px)`, kf:float, easing:"ease-in-out"},
      {css:`left:24%;right:24%;top:${f2(top)}px;height:${h}px;border-radius:50%;border:${f2(Math.max(1.5, 2.5*c.I))}px solid #fff;box-shadow:0 0 6px ${c.color},0 0 18px ${hexA(c.color,.8)},inset 0 0 6px ${c.color}`, kf:float, easing:"ease-in-out"},
      {css:`left:0;top:0;width:${f2(14*c.I)}px;height:${f2(14*c.I)}px;translate:-50% -50%;background:${spike("#ffffff", 1)};opacity:0`,
        kf:turn(10, t => { const a = Math.PI - t*Math.PI; return {...at(50 + 26*Math.cos(a), (top + h/2 + h/2*Math.sin(a)) / c.h * 100), opacity:f2(Math.sin(t*Math.PI))}; }), easing:"linear"}]};
  });
  D("divDescend", "강림하는 빛", {clip:true, d:{duration:6000, color:"#cdeeff"}}, c => {
    const layers = [
      {css:`left:-40%;right:-40%;top:-6%;height:120%;transform-origin:50% 0%;background:repeating-conic-gradient(from 150deg at 50% 0%,${hexA(c.color,.28*c.I)} 0deg 2.5deg,transparent 2.5deg 7deg,${hexA("#ffffff",.18*c.I)} 7deg 8.5deg,transparent 8.5deg 13deg);${msk("linear-gradient(to bottom,#000,transparent 85%)")};filter:blur(3px);${SCREEN}`,
        kf:seq([-3, 3, -3], v => ({transform:`rotate(${v}deg)`, opacity:f2(.7 + .1*Math.abs(v))})), easing:"ease-in-out"},
      {css:`left:20%;right:20%;top:-30%;height:45%;border-radius:50%;background:radial-gradient(closest-side,${hexA("#ffffff",.7*Math.min(c.I,1.3))},${hexA(c.color,.3)} 45%,transparent);filter:blur(10px)`, kf:seq([.75, 1, .75], v => ({opacity:v})), easing:"ease-in-out"}];
    for(let i = 0; i < 16; i++){ const x = 15 + c.rnd()*70;
      layers.push({css:mote(f2(1.5 + c.rnd()*2.5), c.color), kf:turn(6, t => ({...at(x + Math.sin(t*Math.PI*2 + i)*4, 5 + t*90), opacity:f2(Math.sin(t*Math.PI)*.9)})), at:c.rnd(), dur:.6 + c.rnd()*.4, easing:"linear"}); }
    return {layers};
  });
  D("divPillar", "승천의 빛기둥", {d:{duration:3000, color:"#bfe8ff"}}, c => {
    const layers = [
      {css:`left:50%;bottom:0;width:36%;height:160%;translate:-50% 0;transform-origin:50% 100%;background:linear-gradient(90deg,transparent,${hexA(c.color,.4*c.I)} 30%,${hexA("#ffffff",.85)} 50%,${hexA(c.color,.4*c.I)} 70%,transparent);filter:blur(5px);${msk("linear-gradient(to top,#000 50%,transparent)")};${SCREEN}`,
        kf:seq([.75, 1, .85, 1, .75], v => ({transform:`scaleX(${v})`, opacity:v})), easing:"ease-in-out"},
      {css:`left:50%;bottom:0;width:6%;height:170%;translate:-50% 0;background:linear-gradient(to top,#fff,${hexA(c.color,.6)} 60%,transparent);filter:blur(1px)`, kf:seq([.8, 1, .8], v => ({opacity:v})), dur:.5, easing:"ease-in-out"},
      ...[0, .5].map(d => ({css:`left:50%;bottom:0;width:60%;aspect-ratio:1;translate:-50% 50%;border-radius:50%;border:${f2(Math.max(1, 1.5*c.I))}px solid ${hexA(PALE,.8)};box-shadow:0 0 10px ${c.color};opacity:0`,
        kf:[{transform:"scaleY(.22) scale(.2)", opacity:1}, {transform:"scaleY(.22) scale(1.5)", opacity:0}], at:d, easing:"cubic-bezier(.1,.6,.3,1)"}))];
    for(let i = 0; i < 14; i++){ const x = 50 + (c.rnd() - .5)*28;
      layers.push({css:mote(f2(1.5 + c.rnd()*2.5), c.color), kf:[{offset:0, ...at(x, 100), opacity:0}, {offset:.2, opacity:1}, {offset:1, ...at(x + (c.rnd() - .5)*8, -40), opacity:0}], at:c.rnd(), dur:.5 + c.rnd()*.5, easing:"cubic-bezier(.3,0,.7,1)"}); }
    return {layers};
  });
  D("divGyro", "세라핌 고리", {d:{duration:9000}}, c => {
    const P = f2(Math.max(500, c.w*2.4));
    return {layers:[
      {css:`${centered(30)};border-radius:50%;background:radial-gradient(closest-side,#fff 0 12%,${hexA(c.color,.6)} 35%,transparent);filter:blur(2px)`, kf:seq([.8, 1.1, .8], v => ({transform:`scale(${v})`})), dur:.33, easing:"ease-in-out"},
      ...[[72, 0, 1, 1], [62, 60, .8, -1], [52, -60, 1.25, 1]].map(([s, tz, dur, dir]) => ({
        css:`${centered(s)};border-radius:50%;border:${f2(Math.max(1, 2*c.I))}px solid ${hexA(PALE,.85)};box-shadow:0 0 8px ${hexA(c.color,.8)},inset 0 0 8px ${hexA(c.color,.6)};background:radial-gradient(circle at 50% 0%,#fff 0 3%,transparent 6%),radial-gradient(circle at 50% 100%,#fff 0 3%,transparent 6%)`,
        kf:[{transform:`perspective(${P}px) rotateZ(${tz}deg) rotateY(0deg)`}, {transform:`perspective(${P}px) rotateZ(${tz}deg) rotateY(${dir*360}deg)`}], dur, easing:"linear"}))]};
  });
  D("divSacredGeo", "신성 기하학", {d:{duration:40000}}, c => ({layers:[
    {css:`${centered(96)};background:${svgUrl(metatron(c.color))} center/100% 100% no-repeat`, kf:turn(16, t => ({transform:`rotate(${f2(t*360)}deg)`, opacity:f2(clamp((.75 + .25*Math.cos(t*Math.PI*8)) * Math.min(1, .5 + .5*c.I), 0, 1))})), easing:"linear"},
    {css:`${centered(108)};border-radius:50%;background:repeating-conic-gradient(${hexA(c.color,.7)} 0deg .5deg,transparent .5deg 7.5deg);${msk(ringG(94, 100))}`, kf:spin(-1), dur:.5, easing:"linear"}]}));
  D("divRadiance", "광휘", {clip:true, d:{duration:16000, color:"#cfeeff"}}, c => ({layers:[
    {css:`${centered(220)};border-radius:50%;background:repeating-conic-gradient(${hexA(c.color,.32*c.I)} 0deg 1.2deg,transparent 1.2deg 6deg);${msk("radial-gradient(closest-side,#000 5%,transparent 70%)")};${SCREEN}`, kf:spin(), easing:"linear"},
    {css:`${centered(180)};border-radius:50%;background:repeating-conic-gradient(from 3deg,${hexA("#ffffff",.22*c.I)} 0deg .6deg,transparent .6deg 11deg);${msk("radial-gradient(closest-side,#000,transparent 60%)")};${SCREEN}`, kf:spin(-1), dur:.7, easing:"linear"},
    {css:`${centered(50)};border-radius:50%;background:radial-gradient(closest-side,${hexA("#ffffff",.8)},${hexA(c.color,.35)} 45%,transparent);filter:blur(4px)`, kf:seq([.8, 1.1, .8], v => ({transform:`scale(${v})`, opacity:f2(v - .1)})), dur:.2, easing:"ease-in-out"}]}));
  D("divFeathers", "빛의 깃털", {clip:true, density:true, d:{duration:7000, color:"#d6f0ff"}}, c => ({layers:Array.from({length:Math.round(9 * (.5 + .5*c.D))}, () => {
    const x = 8 + c.rnd()*84, ph = c.rnd()*6, off = c.rnd(), base = (c.rnd() - .5)*40, w = f2((6 + c.rnd()*4) * c.I), h = f2(w * 2.8);
    return {css:`left:0;top:0;width:${w}px;height:${h}px;translate:-50% -50%;border-radius:50% 50% 50% 50% / 70% 70% 30% 30%;background:linear-gradient(90deg,transparent 47%,rgba(255,255,255,.95) 48% 52%,transparent 53%),linear-gradient(to bottom,#fff,${hexA(c.color,.85)} 60%,${hexA(c.color,.2)});box-shadow:0 0 8px ${hexA(c.color,.8)};opacity:0`,
      kf:turn(24, t => { const u = (t + off) % 1; return {...at(x + Math.sin(u*Math.PI*3 + ph)*8, -8 + u*116), transform:`rotate(${f2(Math.sin(u*Math.PI*3 + ph)*35 + base)}deg)`, opacity:f2(u < .05 || u > .95 ? 0 : 1)}; }), dur:.6 + c.rnd()*.35, easing:"linear"};
  })}));
  D("divBlessing", "축복의 빛가루", {clip:true, d:{duration:5000, color:"#bfe8ff"}}, c => {
    const n = 14;
    return {layers:Array.from({length:n}, (_, i) => { const s = f2((8 + c.rnd()*8) * c.I), ph = i / n * Math.PI * 2;
      return {css:`left:0;top:0;width:${s}px;height:${s}px;translate:-50% -50%;background:${spike(c.color, .95)};opacity:0`,
        // 위상을 나눠 처음부터 고르게 흩어져 있게 한다 (한 바퀴 끝에서 위로 돌아갈 때는 보이지 않는다)
        kf:turn(24, t => { const u = (t + i / n) % 1, a = ph + u*Math.PI*3, z = (Math.cos(a) + 1) / 2, o = u < .06 || u > .94 ? 0 : (.35 + .65*z) * Math.min(1, Math.sin(u*Math.PI)*3);
          return {...at(50 + Math.sin(a)*38, -5 + u*110), transform:`scale(${f2(.55 + .45*z)}) rotate(${f2(u*180)}deg)`, opacity:f2(o)}; }), easing:"linear"}; })};
  });
  D("divSigil", "마법진", {d:{duration:24000}}, c => ({layers:[
    {css:`${centered(100)};border-radius:50%;background:radial-gradient(closest-side,${hexA(c.color,.18*c.I)},transparent 75%)`, kf:seq([.6, 1, .6], v => ({opacity:v})), dur:.15, easing:"ease-in-out"},
    {css:`${centered(100)};background:${svgUrl(sigilOuter(c.rnd, c.color))} center/100% 100% no-repeat`, kf:spin(), easing:"linear"},
    {css:`${centered(100)};background:${svgUrl(sigilInner(c.color))} center/100% 100% no-repeat`, kf:spin(-1), dur:.6, easing:"linear"}]}));
  D("divSigilFloor", "바닥 마법진", {d:{duration:20000}}, c => {
    const P = f2(Math.max(400, c.w*1.6)), tilt = a => `perspective(${P}px) rotateX(68deg) rotate(${a}deg)`, floor = "left:50%;bottom:-30%;width:120%;aspect-ratio:1;translate:-50% 0";
    const layers = [
      {css:`${floor};background:${svgUrl(sigilOuter(c.rnd, c.color))} center/100% 100% no-repeat`, kf:[{transform:tilt(0)}, {transform:tilt(360)}], easing:"linear"},
      {css:`${floor};background:${svgUrl(sigilInner(c.color))} center/100% 100% no-repeat`, kf:[{transform:tilt(0)}, {transform:tilt(-360)}], dur:.6, easing:"linear"},
      {css:`left:10%;right:10%;bottom:0;height:70%;background:linear-gradient(to top,${hexA(c.color,.3*c.I)},transparent);${msk("linear-gradient(90deg,transparent,#000 30%,#000 70%,transparent)")};${SCREEN}`, kf:seq([.6, 1, .6], v => ({opacity:v})), dur:.15, easing:"ease-in-out"}];
    for(let i = 0; i < 12; i++){ const x = 15 + c.rnd()*70;
      layers.push({css:mote(f2(1.5 + c.rnd()*2), c.color), kf:[{offset:0, ...at(x, 100), opacity:0}, {offset:.2, opacity:1}, {offset:1, ...at(x, 20 + c.rnd()*30), opacity:0}], at:c.rnd()*.1, dur:.12 + c.rnd()*.08, easing:"ease-out"}); }
    return {layers};
  });
  D("divStarCross", "신성한 십자광", {d:{duration:3000, color:"#d6f0ff"}}, c => {
    const m = Math.min(c.w, c.h), streak = (len, th, rot, a) => ({css:`left:50%;top:50%;width:${f2(len)}px;height:${th}px;translate:-50% -50%;border-radius:50%;background:linear-gradient(90deg,transparent,${hexA(c.color,a)} 30%,#fff 50%,${hexA(c.color,a)} 70%,transparent);filter:drop-shadow(0 0 4px ${c.color})`,
      kf:seq([.7, 1, .7], v => ({transform:`rotate(${rot}deg) scaleX(${f2(v)})`, opacity:f2(v)})), easing:"ease-in-out"});
    return {layers:[
      {css:`${centered(40)};border-radius:50%;background:radial-gradient(closest-side,#fff,${hexA(c.color,.4)} 35%,transparent);filter:blur(3px)`, kf:seq([.7, 1.15, .7], v => ({transform:`scale(${v})`})), easing:"ease-in-out"},
      streak(c.w*1.1*c.I, 3, 0, .8), streak(c.h*1.1*c.I, 3, 90, .8), streak(m*.5*c.I, 2, 45, .5), streak(m*.5*c.I, 2, -45, .5)]};
  });
  D("divAura", "신성한 오라", {d:{duration:4200}}, c => ({layers:[[2, 12, c.color, 0], [6, 26, PALE, .33], [12, 46, c.color, .66]].map(([sp, bl, col, a]) => ({
    css:`inset:0;border-radius:inherit;box-shadow:0 0 ${f2(bl*c.I)}px ${f2(sp*c.I)}px ${hexA(col,.45)}`,
    kf:seq([.25, 1, .25], v => ({opacity:v})), at:a, easing:"ease-in-out"}))}));
  D("divOrbitGlyphs", "도는 성문", {d:{duration:12000}}, c => {
    const n = 10, rx = .56 * c.w, ry = Math.min(.3 * c.h + 20, .2 * c.w);
    return {layers:Array.from({length:n}, (_, i) => { const s = f2(19 * Math.max(.6, c.I)), ph = i / n * Math.PI * 2;
      return {css:`left:0;top:0;width:${s}px;height:${s}px;translate:-50% -50%;background:${svgUrl(runeSvg(RUNES[i % RUNES.length], c.color))} center/100% 100% no-repeat`,
        kf:turn(16, t => { const a = ph + t*Math.PI*2, z = (Math.sin(a) + 1) / 2; return {...at(50 + Math.cos(a)*rx / c.w * 100, 50 + Math.sin(a)*ry / c.h * 100), transform:`scale(${f2(.6 + .5*z)})`, opacity:f2(.35 + .65*z)}; }), easing:"linear"}; })};
  });
  D("divBlueFlame", "청염", {density:true, d:{duration:1400, color:"#6fc8ff"}}, c => {
    const n = Math.round(14 * (.5 + .5*c.D)), k = Math.max(.6, Math.min(1.6, c.w / 260));
    const layers = [{css:`left:0;right:0;bottom:-10%;height:30%;border-radius:50%;background:radial-gradient(closest-side,${hexA(c.color,.45*c.I)},${hexA(DEEP,.15)} 60%,transparent);filter:blur(8px)`, kf:seq([.7, 1, .7], v => ({opacity:v})), easing:"ease-in-out"}];
    for(let i = 0; i < n; i++){ const x = 6 + (i + .5) / n * 88 + (c.rnd() - .5)*4, s = f2((14 + c.rnd()*16) * c.I * k), x1 = x + (c.rnd() - .5)*10;
      layers.push({css:`left:0;top:0;width:${s}px;height:${f2(s*1.5)}px;translate:-50% -70%;border-radius:50% 50% 45% 45% / 65% 65% 35% 35%;background:radial-gradient(ellipse 50% 60% at 50% 70%,#fff 0 12%,${hexA(c.color,.85)} 35%,${hexA(DEEP,.4)} 60%,transparent 75%);filter:blur(${f2(s/7)}px);${SCREEN};opacity:0`,
        kf:[{offset:0, ...at(x, 102), opacity:0, transform:"scale(.6) rotate(0deg)"}, {offset:.2, opacity:1, transform:"scale(1) rotate(-6deg)"}, {offset:.6, opacity:.8, transform:`scale(.75) rotate(${f2((c.rnd() - .5)*20)}deg)`}, {offset:1, ...at(x1, 45 + c.rnd()*25), opacity:0, transform:"scale(.2) rotate(8deg)"}],
        at:c.rnd(), dur:.6 + c.rnd()*.4, easing:"ease-out"}); }
    return {layers};
  });
}
