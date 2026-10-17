/* 시스템·버추얼: 부팅·데이터 비·회로·보호막·와이어 구조물 등 15종. 기본 색은 청록빛 하늘색. */
import { f2, hexA, clamp, rng, at, seq, centered, svgUrl, PALE, DEEP, SCREEN, msk, ringG, span, turn, starBg, glowSvg } from "../vfx-util.js";

// 데이터 비 타일: 열마다 밝은 머리 글자와 위로 흐려지는 꼬리
function rainTile(r, col, cols, rows, cw, ch){
  const chars = "0123456789ABCDEF=+*:アイウエオカキクケコサシスセソタチツテト";
  let s = "";
  for(let x = 0; x < cols; x++){
    const head = Math.floor(r()*rows), len = 5 + Math.floor(r()*(rows - 6));
    for(let y = 0; y < rows; y++){
      const d = (head - y + rows) % rows;
      if(d > len) continue;
      s += `<text x='${x*cw + cw/2}' y='${(y + 1)*ch - 2}' fill='${d === 0 ? "#ffffff" : col}' opacity='${d === 0 ? 1 : f2(.85*(1 - d/len) + .08)}'>${chars[Math.floor(r()*chars.length)]}</text>`;
    }
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${cols*cw}' height='${rows*ch}'><g font-family='monospace' font-size='${ch - 2}' text-anchor='middle'>${s}</g></svg>`;
}
// 회로 타일: 격자를 따라 꺾이는 배선과 끝의 패드
function circuitTile(r, col, sw, op){
  let s = "";
  for(let k = 0; k < 9; k++){
    let x = 10 + Math.floor(r()*11)*10, y = 10 + Math.floor(r()*11)*10, dir = Math.floor(r()*4);
    const pts = [[x, y]];
    for(let j = 0, n = 3 + Math.floor(r()*5); j < n; j++){
      if(r() < .4) dir = (dir + (r() < .5 ? 1 : 3)) % 4;
      const L = 10 * (1 + Math.floor(r()*3));
      x = clamp(x + [1, 0, -1, 0][dir]*L, 6, 114); y = clamp(y + [0, 1, 0, -1][dir]*L, 6, 114); pts.push([x, y]);
    }
    const [a, b] = [pts[0], pts[pts.length - 1]];
    s += `<path d='M${pts.map(p => p.join(" ")).join("L")}'/><circle cx='${a[0]}' cy='${a[1]}' r='2.4'/><circle cx='${b[0]}' cy='${b[1]}' r='2.4'/>`;
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g fill='none' stroke='${col}' stroke-width='${sw}' stroke-opacity='${op}' stroke-linejoin='round'>${s}</g></svg>`;
}
const hexTile = (col, sw) => `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='48'><path d='M14 0l14 8v16l-14 8L0 24V8zM14 32l14 8v16M14 32L0 40v16' fill='none' stroke='${col}' stroke-width='${sw}'/></svg>`;
function waveSvg(col){
  const p = Array.from({length:101}, (_, k) => { const x = k*2, u = x / 200 * 2 * Math.PI; return `${x} ${f2(30 + 14*Math.sin(2*u) + 6*Math.sin(5*u + 1) + 3*Math.sin(11*u))}`; }).join("L");
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60' preserveAspectRatio='none'><defs><filter id='g' x='-10%' y='-50%' width='120%' height='200%'><feGaussianBlur stdDeviation='2'/></filter></defs><path d='M${p}' fill='none' stroke='${col}' stroke-width='4' filter='url(#g)'/><path d='M${p}' fill='none' stroke='${col}' stroke-width='1.6'/><path d='M${p}' fill='none' stroke='#fff' stroke-width='.6'/></svg>`;
}

export function systemEffects(def){
  const S = (id, name, o, make) => def("시스템·버추얼", id, name, {color:true, poster:.4, ...o, d:{duration:4000, iterations:0, color:"#62d0ff", ...o.d}}, make);
  const glow = (col, k = 1) => `box-shadow:0 0 ${f2(6*k)}px ${hexA(col,.9)},0 0 ${f2(16*k)}px ${hexA(col,.45)}`;
  const spin = (dir = 1) => [{transform:"rotate(0deg)"}, {transform:`rotate(${dir*360}deg)`}];

  S("sysBoot", "시스템 부팅", {clip:true, d:{duration:4500}, poster:.7}, c => {
    const grid = `linear-gradient(${hexA(c.color,.2*c.I)} 1px,transparent 1px),linear-gradient(90deg,${hexA(c.color,.2*c.I)} 1px,transparent 1px)`;
    const corner = (x, y) => `${x ? "right" : "left"}:5%;${y ? "bottom" : "top"}:6%;width:12%;height:18%;border:${f2(Math.max(1, 2*c.I))}px solid ${c.color};border-${x ? "left" : "right"}:0;border-${y ? "top" : "bottom"}:0;${glow(c.color, .6)};opacity:0`;
    return {layers:[
      {css:`inset:0;background-image:${grid};background-size:24px 24px;opacity:0`, kf:[{offset:0, opacity:0}, {offset:.2, opacity:0}, {offset:.3, opacity:.9}, {offset:.33, opacity:.3}, {offset:.36, opacity:.9}, {offset:.85, opacity:.6}, {offset:1, opacity:0}], easing:"linear"},
      {css:`left:0;right:0;top:0;height:0%;background:linear-gradient(to bottom,${hexA(c.color,.06)},${hexA(c.color,.16)});opacity:0`, kf:[{offset:0, height:"0%", opacity:1}, {offset:.3, height:"100%", opacity:1}, {offset:.9, height:"100%", opacity:.7}, {offset:1, height:"100%", opacity:0}], easing:"ease-in-out"},
      {css:`left:0;right:0;top:0;height:2px;background:#fff;${glow(c.color, 1.4)};opacity:0`, kf:[{offset:0, top:"0%", opacity:1}, {offset:.3, top:"100%", opacity:1}, {offset:.31, top:"100%", opacity:0}, {offset:1, top:"100%", opacity:0}], easing:"ease-in-out"},
      ...[[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => ({css:corner(x, y), kf:[{offset:0, opacity:0, transform:"scale(1.8)"}, {offset:.3, opacity:0, transform:"scale(1.8)"}, {offset:.4, opacity:1, transform:"scale(1)"}, {offset:.9, opacity:1, transform:"scale(1)"}, {offset:1, opacity:0, transform:"scale(1)"}], easing:"cubic-bezier(.2,.8,.3,1)"})),
      ...[0, 1, 2].map(i => ({css:`left:8%;bottom:${12 + i*7}%;height:3px;width:0%;background:linear-gradient(90deg,${c.color},#fff);${glow(c.color, .5)}`,
        kf:[{offset:0, width:"0%", opacity:1}, {offset:f2(.36 + i*.08), width:"0%", opacity:1}, {offset:f2(.56 + i*.1), width:`${40 - i*10}%`, opacity:1}, {offset:.9, width:`${40 - i*10}%`, opacity:1}, {offset:1, width:`${40 - i*10}%`, opacity:0}], easing:"ease-out"})),
      {css:`inset:0;background:${hexA(c.color,.25)};opacity:0`, kf:[{offset:0, opacity:0}, {offset:.86, opacity:0}, {offset:.88, opacity:1}, {offset:.94, opacity:0}, {offset:1, opacity:0}], easing:"linear"}]};
  });
  S("sysDataRain", "데이터 비", {clip:true, d:{duration:4000, color:"#5cf0c8"}}, c => {
    const fade = msk("linear-gradient(to bottom,transparent,#000 15%,#000 85%,transparent)");
    return {layers:[[12, 14, 1, .55], [16, 18, .6, .9]].map(([cw, ch, dur, a]) => {
      const rows = 20, H = rows * ch;
      return {css:`inset:0;opacity:${f2(clamp(a*c.I, 0, 1))};background:${svgUrl(rainTile(c.rnd, c.color, 12, rows, cw, ch))};background-size:${12*cw}px ${H}px;${fade};filter:drop-shadow(0 0 3px ${hexA(c.color,.7)})`,
        kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:`0px ${H}px`}], dur, easing:"linear"};
    })};
  });
  S("sysCircuit", "회로 흐름", {clip:true, d:{duration:3600}}, c => {
    // 어두운 배선과 밝은 배선이 겹치도록 두 타일을 같은 씨앗에서 만든다
    const s0 = Math.floor(c.rnd() * 1e9), mk = (col, sw, op) => svgUrl(circuitTile(rng(s0), col, sw, op));
    const ww = f2(c.w * .45), wh = f2(c.h * .5);
    return {layers:[
      {css:`inset:0;background:${mk(c.color, 1.2, .35 * Math.min(c.I, 2))};background-size:120px 120px`, kf:null},
      {css:`left:0;top:0;bottom:0;width:${ww}px;background:${mk(PALE, 1.6, 1)};background-size:120px 120px;${msk("linear-gradient(90deg,transparent,#000 50%,transparent)")};filter:drop-shadow(0 0 3px ${c.color}) drop-shadow(0 0 6px ${c.color})`,
        kf:[{left:`${-ww}px`, backgroundPosition:`${ww}px 0px`}, {left:`${f2(c.w)}px`, backgroundPosition:`${f2(-c.w)}px 0px`}], easing:"linear"},
      {css:`left:0;right:0;top:0;height:${wh}px;background:${mk(c.color, 1.6, 1)};background-size:120px 120px;${msk("linear-gradient(to bottom,transparent,#000 50%,transparent)")};filter:drop-shadow(0 0 4px ${c.color})`,
        kf:[{top:`${-wh}px`, backgroundPosition:`0px ${wh}px`}, {top:`${f2(c.h)}px`, backgroundPosition:`0px ${f2(-c.h)}px`}], dur:1.6, easing:"linear"}]};
  });
  S("sysHexShield", "육각 보호막", {d:{duration:3200, color:"#7cc8ff"}}, c => {
    const tile = (col, sw) => `background:${svgUrl(hexTile(col, sw))};background-size:22px 38px`;
    return {layers:[
      {css:`inset:-8%;border-radius:50%;${tile(c.color, 1)};${msk("radial-gradient(closest-side,rgba(0,0,0,.12) 40%,#000 92%,transparent 100%)")}`, kf:seq([.45, .75, .45], v => ({opacity:f2(clamp(v*c.I, 0, 1))})), easing:"ease-in-out"},
      {css:`inset:-8%;border-radius:50%;${tile("#ffffff", 1.4)};-webkit-mask:radial-gradient(closest-side,transparent 70%,#000 86%,transparent 100%) center/0% 0% no-repeat;mask:radial-gradient(closest-side,transparent 70%,#000 86%,transparent 100%) center/0% 0% no-repeat;filter:drop-shadow(0 0 4px ${c.color})`,
        kf:[{maskSize:"0% 0%", opacity:1}, {maskSize:"260% 260%", opacity:0}], easing:"cubic-bezier(.2,.6,.4,1)"},
      {css:`inset:-8%;border-radius:50%;box-shadow:inset 0 0 ${f2(18*c.I)}px ${hexA(c.color,.8)},0 0 ${f2(12*c.I)}px ${hexA(c.color,.4)}`, kf:seq([.6, 1, .6], v => ({opacity:v})), easing:"ease-in-out"},
      {css:`left:8%;right:8%;top:-6%;height:40%;border-radius:50%;background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.35),transparent 60%)`, kf:null}]};
  });
  S("sysWireGlobe", "와이어 지구본", {d:{duration:8000}}, c => {
    const R = 64, line = `border:1px solid ${hexA(c.color,.6)}`;
    const layers = [
      {css:`${centered(R)};border-radius:50%;border:${f2(Math.max(1, 1.5*c.I))}px solid ${hexA(c.color,.9)};${glow(c.color, .8)};background:radial-gradient(circle at 40% 35%,${hexA(c.color,.15)},transparent 70%)`, kf:null},
      ...[-60, -30, 0, 30, 60].map(lat => { const k = Math.cos(lat*Math.PI/180), dy = f2(Math.sin(lat*Math.PI/180) * R/200 * c.w), h = f2(R/100 * c.w * k * .18);
        return {css:`left:50%;top:calc(50% + ${dy}px);width:${f2(R*k)}%;height:${h}px;translate:-50% -50%;border-radius:50%;${line}`, kf:null}; })];
    for(let i = 0; i < 6; i++){ const ph = i / 6 * Math.PI;
      layers.push({css:`${centered(R)};border-radius:50%;${line}`, kf:turn(12, t => ({transform:`scaleX(${f2(Math.cos(ph + t*Math.PI))})`, opacity:f2(.45 + .55*Math.abs(Math.sin(ph + t*Math.PI)))})), easing:"linear"}); }
    layers.push({css:`${centered(R)};border-radius:50%;background:linear-gradient(to bottom,transparent 45%,${hexA(c.color,.45)} 50%,transparent 55%) 0 0/100% 300% no-repeat`, kf:[{backgroundPosition:"0% 0%"}, {backgroundPosition:"0% 100%"}], dur:.4, easing:"ease-in-out"});
    return {layers};
  });
  S("sysHorizon", "가상 지평선", {clip:true, d:{duration:1600, color:"#7cc8ff"}}, c => ({layers:[
    {css:`left:0;right:0;top:0;height:62%;background:${starBg(c.rnd, 30, c.color, c.I * .8, .8)}`, kf:null},
    {css:`left:0;right:0;top:32%;height:30%;background:radial-gradient(ellipse 60% 70% at 50% 100%,${hexA(c.color,.5*c.I)},transparent 70%)`, kf:seq([.75, 1, .75], v => ({opacity:v})), dur:3, easing:"ease-in-out"},
    {css:`left:50%;top:62%;width:30%;aspect-ratio:1;translate:-50% -100%;clip-path:inset(0 0 50% 0);border-radius:50%;background:linear-gradient(to bottom,#fff,${c.color} 55%,${DEEP});-webkit-mask:linear-gradient(#000,#000) top/100% 70% no-repeat,repeating-linear-gradient(to bottom,#000 0 6%,transparent 6% 9%);mask:linear-gradient(#000,#000) top/100% 70% no-repeat,repeating-linear-gradient(to bottom,#000 0 6%,transparent 6% 9%);filter:drop-shadow(0 0 12px ${hexA(c.color,.8)})`, kf:null},
    {css:`left:-50%;right:-50%;top:62%;bottom:-20%;transform-origin:50% 0%;transform:perspective(220px) rotateX(60deg);background-image:linear-gradient(${hexA(c.color,.65*c.I)} 1px,transparent 1px),linear-gradient(90deg,${hexA(c.color,.65*c.I)} 1px,transparent 1px);background-size:30px 30px;${msk("linear-gradient(to bottom,transparent,#000 35%)")}`,
      kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"0px 30px"}], easing:"linear"},
    {css:`left:0;right:0;top:62%;height:2px;margin-top:-1px;background:#fff;${glow(c.color, 1.6)}`, kf:null}]}));
  S("sysDataRings", "데이터 고리", {d:{duration:12000}}, c => ({layers:[
    [100, 94, `repeating-conic-gradient(${hexA(c.color,.85)} 0deg 20deg,transparent 20deg 24deg)`, 1, 1],
    [84, 88, `conic-gradient(${hexA(c.color,.8)} 0 35%,transparent 35% 50%,${hexA(PALE,.8)} 50% 62%,transparent 62%)`, .6, -1],
    [68, 80, `repeating-conic-gradient(${hexA(c.color,.9)} 0deg 1deg,transparent 1deg 6deg)`, 1.6, 1],
    [50, 70, `conic-gradient(transparent,${hexA(c.color,.7)})`, .35, 1]].map(([s, inner, bg, dur, dir]) => ({
      css:`${centered(s)};border-radius:50%;background:${bg};${msk(ringG(inner, 100))};filter:drop-shadow(0 0 3px ${hexA(c.color,.9)})`, kf:spin(dir), dur, easing:"linear"})).concat([
    {css:`${centered(8)};border-radius:50%;background:#fff;${glow(c.color, 1.2)}`, kf:seq([.7, 1.2, .7], v => ({transform:`scale(${v})`})), dur:.1, easing:"ease-in-out"}])}));
  S("sysMaterialize", "실체화", {clip:true, density:true, d:{duration:3200}, poster:.75}, c => {
    let cols = Math.round(8 + 4*c.D), rows;
    for(;;){ rows = Math.max(2, Math.round(c.h / (c.w / cols))); if(cols * rows <= 150 || cols <= 3) break; cols--; }
    const layers = [];
    for(let y = 0; y < rows; y++) for(let x = 0; x < cols; x++){ const t = f2(.05 + (x + y) / (cols + rows) * .45 + c.rnd()*.12);
      layers.push({css:`left:${f2(x / cols * 100)}%;top:${f2(y / rows * 100)}%;width:${f2(100 / cols)}%;height:${f2(100 / rows)}%;background:${hexA(c.color,.7)};box-shadow:inset 0 0 0 1px ${hexA(PALE,.8)},0 0 8px ${hexA(c.color,.6)};opacity:0`,
        kf:[{offset:0, opacity:0}, {offset:t, opacity:0}, {offset:f2(t + .04), opacity:f2(clamp(.95*c.I, 0, 1))}, {offset:f2(t + .14), opacity:0}, {offset:1, opacity:0}], easing:"ease-out"}); }
    layers.push({css:`left:0;right:0;top:0;height:2px;background:#fff;${glow(c.color, 1.2)};opacity:0`, kf:[{offset:0, top:"0%", opacity:1}, {offset:.65, top:"100%", opacity:1}, {offset:.66, top:"100%", opacity:0}, {offset:1, top:"100%", opacity:0}], easing:"linear"});
    return {layers};
  });
  S("sysWave", "신호 파형", {clip:true, d:{duration:2400}}, c => ({layers:[
    {css:`inset:0;background-image:linear-gradient(${hexA(c.color,.12)} 1px,transparent 1px),linear-gradient(90deg,${hexA(c.color,.12)} 1px,transparent 1px);background-size:20px 20px`, kf:null},
    {css:`left:0;right:0;top:15%;bottom:15%;opacity:${f2(clamp(.5*c.I, 0, 1))};transform:scaleY(.6);background:${svgUrl(waveSvg(c.color))} 0% 50%/50% 100% repeat-x`, kf:[{backgroundPosition:"0% 50%"}, {backgroundPosition:"-200% 50%"}], dur:1.6, easing:"linear"},
    {css:`left:0;right:0;top:15%;bottom:15%;opacity:${f2(clamp(c.I, 0, 1))};background:${svgUrl(waveSvg(c.color))} 0% 50%/50% 100% repeat-x`, kf:[{backgroundPosition:"0% 50%"}, {backgroundPosition:"-200% 50%"}], easing:"linear"}]}));
  S("sysNetwork", "노드 네트워크", {d:{duration:3000}}, c => {
    const pts = [];
    for(let tries = 0; pts.length < 9 && tries < 200; tries++){ const p = [10 + c.rnd()*80, 12 + c.rnd()*76]; if(pts.every(q => Math.hypot((q[0] - p[0]) * c.w, (q[1] - p[1]) * c.h) > 12 * Math.min(c.w, c.h))) pts.push(p); }
    const edges = new Set();
    pts.forEach((p, i) => pts.map((q, j) => [Math.hypot((q[0] - p[0]) * c.w, (q[1] - p[1]) * c.h), j]).filter(([, j]) => j !== i).sort((a, b) => a[0] - b[0]).slice(0, 2).forEach(([, j]) => edges.add(i < j ? `${i}-${j}` : `${j}-${i}`)));
    const layers = [];
    for(const e of edges){ const [i, j] = e.split("-").map(Number), [a, b] = [pts[i], pts[j]], g = span(c, a[0], a[1], b[0], b[1]);
      layers.push({css:`left:${f2(a[0])}%;top:${f2(a[1])}%;width:${g.len}px;height:1px;transform-origin:0 50%;transform:rotate(${g.ang}deg);background:${hexA(c.color,.4)}`, kf:null});
      layers.push({css:`left:0;top:0;width:5px;height:5px;translate:-50% -50%;border-radius:50%;background:#fff;${glow(c.color, .8)};opacity:0`,
        kf:[{offset:0, ...at(...a), opacity:0}, {offset:.1, opacity:1}, {offset:.9, opacity:1}, {offset:1, ...at(...b), opacity:0}], at:c.rnd(), dur:.4 + c.rnd()*.3, easing:"ease-in-out"}); }
    pts.forEach(([x, y], i) => layers.push({css:`left:${f2(x)}%;top:${f2(y)}%;width:${i ? 9 : 14}px;height:${i ? 9 : 14}px;translate:-50% -50%;border-radius:50%;border:1.5px solid ${c.color};background:radial-gradient(circle,#fff 0 25%,transparent 35%);${glow(c.color, .6)}`,
      kf:seq([1, 1.25, 1], v => ({transform:`scale(${v})`})), at:c.rnd(), dur:.6, easing:"ease-in-out"}));
    return {layers};
  });
  S("sysLaserScan", "레이저 스캔", {clip:true, d:{duration:3200, color:"#5ce1ff"}}, c => {
    const pos = v => ({top:`${f2(v*100)}%`});
    return {layers:[
      {css:`inset:0;background-image:linear-gradient(${hexA(c.color,.5*c.I)} 1px,transparent 1px),linear-gradient(90deg,${hexA(c.color,.5*c.I)} 1px,transparent 1px);background-size:16px 16px;-webkit-mask:linear-gradient(to bottom,transparent,#000 50%,transparent) 0 0/100% 30% no-repeat;mask:linear-gradient(to bottom,transparent,#000 50%,transparent) 0 0/100% 30% no-repeat`,
        kf:seq([0, 1, 0], v => ({maskPosition:`0% ${f2(-21.43 + v*142.86)}%`})), easing:"ease-in-out"},
      {css:`left:0;right:0;top:0;height:24%;translate:0 -50%;background:linear-gradient(to bottom,transparent,${hexA(c.color,.25*c.I)} 50%,transparent)`, kf:seq([0, 1, 0], pos), easing:"ease-in-out"},
      {css:`left:-5%;right:-5%;top:0;height:2px;margin-top:-1px;background:linear-gradient(90deg,transparent,#fff 10%,#fff 90%,transparent);box-shadow:0 0 6px 1px ${c.color},0 0 18px 4px ${hexA(c.color,.5)}`, kf:seq([0, 1, 0], pos), easing:"ease-in-out"}]};
  });
  S("sysTesseract", "테서랙트", {d:{duration:10000}}, c => {
    const cube = (pct, dir, tiltX, a) => { const s = pct / 100 * c.w, z = f2(s / 2), P = f2(Math.max(500, s * 4));
      return [[0, 0], [180, 0], [90, 0], [-90, 0], [0, 90], [0, -90]].map(([fy, fx]) => ({
        css:`${centered(pct)};border:${f2(Math.max(1, 1.5*c.I))}px solid ${hexA(c.color,a)};background:${hexA(c.color,.04)};box-shadow:0 0 8px ${hexA(c.color,.6)},inset 0 0 8px ${hexA(c.color,.35)}`,
        kf:[0, 1].map(t => ({transform:`perspective(${P}px) rotateX(${tiltX}deg) rotateY(${f2(t*360*dir)}deg) rotateY(${fy}deg) rotateX(${fx}deg) translateZ(${z}px)`})), easing:"linear"})); };
    return {layers:[...cube(36, 1, -22, .9), ...cube(18, -1, 28, .75),
      {css:`${centered(10)};border-radius:50%;background:radial-gradient(closest-side,#fff,${hexA(c.color,.6)} 45%,transparent);filter:blur(1px)`, kf:seq([.7, 1.2, .7], v => ({transform:`scale(${v})`})), dur:.2, easing:"ease-in-out"}]};
  });
  S("sysProjector", "홀로 투사", {clip:true, d:{duration:2600}}, c => {
    const layers = [
      {css:`left:0;right:0;bottom:0;height:100%;clip-path:polygon(44% 100%,56% 100%,96% 0%,4% 0%);background:linear-gradient(to top,${hexA(c.color,.55*Math.min(c.I,1.5))},${hexA(c.color,.06)} 85%,transparent),repeating-linear-gradient(to bottom,${hexA(PALE,.12)} 0 1px,transparent 1px 4px);${SCREEN}`,
        kf:seq([1, .85, 1, .6, 1, .9, 1], (v, i) => ({opacity:v, backgroundPosition:`0px 0px, 0px ${-i*8}px`})), easing:"linear"},
      {css:`left:50%;bottom:-4px;width:24%;height:12px;translate:-50% 0;border-radius:50%;background:radial-gradient(closest-side,#fff,${c.color} 50%,transparent);filter:blur(1px)`, kf:seq([.8, 1, .8], v => ({opacity:v, transform:`scaleX(${v})`})), easing:"ease-in-out"},
      {css:`left:4%;right:4%;top:0;height:2px;background:${c.color};${glow(c.color, .8)}`, kf:seq([1, .5, 1, 1, .7, 1], v => ({opacity:v})), easing:"linear"}];
    for(let i = 0; i < 10; i++){ const t = c.rnd(), x0 = 44 + t*12, x1 = 4 + t*92;
      layers.push({css:`left:0;top:0;width:2px;height:2px;border-radius:50%;background:#fff;box-shadow:0 0 4px ${c.color};opacity:0`, kf:[{offset:0, ...at(x0, 100), opacity:0}, {offset:.2, opacity:.9}, {offset:1, ...at(x1, 0), opacity:0}], at:c.rnd(), dur:.6 + c.rnd()*.4, easing:"linear"}); }
    return {layers};
  });
  S("sysDigitalAura", "디지털 오라", {density:true, d:{duration:2400}}, c => {
    const n = Math.round(22 * (.5 + .5*c.D)), layers = [{css:`inset:-3px;border-radius:inherit;box-shadow:0 0 ${f2(10*c.I)}px ${hexA(c.color,.6)},inset 0 0 ${f2(8*c.I)}px ${hexA(c.color,.35)}`, kf:seq([.5, 1, .5], v => ({opacity:v})), easing:"ease-in-out"}];
    for(let i = 0; i < n; i++){ const side = c.rnd(), x = side < .6 ? c.rnd()*100 : side < .8 ? 0 : 100, y = side < .6 ? 100 : 30 + c.rnd()*70, s = f2(3 + c.rnd()*4);
      const dx = (x === 0 ? -1 : x === 100 ? 1 : (c.rnd() - .5)) * (6 + c.rnd()*10), dy = 18 + c.rnd()*30;
      layers.push({css:`left:0;top:0;width:${s}px;height:${s}px;translate:-50% -50%;background:${c.rnd() < .3 ? "#fff" : c.color};${glow(c.color, .5)};opacity:0`,
        kf:[{offset:0, ...at(x, y), opacity:0}, {offset:.15, opacity:1}, {offset:1, ...at(x + dx, y - dy), opacity:0}], at:c.rnd(), dur:.5 + c.rnd()*.5, easing:"steps(7, end)"}); }
    return {layers};
  });
  S("sysArcs", "궤도 HUD 호", {d:{duration:6000}}, c => {
    const arc = (s, inner, deg, dur, dir, a) => ({css:`${centered(s)};border-radius:50%;background:conic-gradient(transparent,${hexA(c.color,a)} ${deg}deg,transparent ${deg}deg);${msk(ringG(inner, 100))};filter:drop-shadow(0 0 4px ${c.color})`, kf:spin(dir), dur, easing:"linear"});
    const layers = [arc(100, 95, 120, 1, 1, .95), arc(86, 92, 200, .7, -1, .8), arc(72, 86, 60, .45, 1, .9),
      {css:`${centered(72)};border-radius:50%;border:1px dashed ${hexA(c.color,.35)}`, kf:null}];
    for(let i = 0; i < 3; i++){ const ph = i / 3 * Math.PI * 2, r = .54 * c.w;
      layers.push({css:`left:0;top:0;width:8px;height:8px;translate:-50% -50%;clip-path:polygon(50% 100%,0 0,100% 0);background:${c.color};filter:drop-shadow(0 0 3px ${c.color})`,
        kf:turn(16, t => { const a = ph + t*Math.PI*2; return {...at(50 + Math.cos(a)*r / c.w * 100, 50 + Math.sin(a)*r / c.h * 100), transform:`rotate(${f2(a*180/Math.PI - 90)}deg)`}; }), dur:1.5, easing:"linear"}); }
    return {layers};
  });
}
