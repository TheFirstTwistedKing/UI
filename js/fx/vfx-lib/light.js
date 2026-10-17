/* 빛: 반사광 14종 + 글로우·조명 22종 */
import { f2, hexA, clamp, STEP, flicker, at, seq, centered } from "../vfx-util.js";

// 반사광: 요소 3배 크기의 레이어에 띠를 그리고 방향대로 지나가게 한다
const SHINE_DIRS = [
  ["LR", "왼쪽→오른쪽", 90, [-40, 0], [40, 0]],
  ["RL", "오른쪽→왼쪽", 90, [40, 0], [-40, 0]],
  ["TB", "위→아래", 180, [0, -40], [0, 40]],
  ["Diag", "대각선↘", 135, [-34, -34], [34, 34]],
  ["DiagUp", "대각선↗", 45, [-34, 34], [34, -34]]
];
const SHINE_STYLES = [
  ["Soft", "부드러운 반사", (col, I) => `transparent 42%,${hexA(col,.45*Math.min(I,1.6))} 50%,transparent 58%`],
  ["Twin", "이중 반사", (col, I) => `transparent 45%,${hexA(col,.75*Math.min(I,1.3))} 46%,transparent 47.5%,transparent 49.5%,${hexA(col,.5*Math.min(I,1.6))} 50.5%,transparent 51.5%`],
  ["Glare", "눈부신 반사", (col, I) => `transparent 35%,${hexA(col,.12*I)} 44%,${hexA(col,.8*Math.min(I,1.2))} 50%,${hexA(col,.12*I)} 56%,transparent 65%`]
];

export function lightEffects(def){
  for(const [did, dname, ang, from, to] of SHINE_DIRS)
    for(const [sid, sname, stops] of SHINE_STYLES){
      if(did === "LR" && sid === "Soft") continue; // 기본 '빛 반사'와 같은 모양
      def("빛", "shine" + sid + did, `${sname} ${dname}`, {clip:true, color:true, poster:.3, d:{duration:2600, iterations:0, color:"#ffffff"}},
        c => ({layers:[{css:`inset:-100%;background:linear-gradient(${ang}deg,${stops(c.color, c.I)});mix-blend-mode:screen`,
          kf:[{offset:0, transform:`translate(${from[0]}%, ${from[1]}%)`}, {offset:.6, transform:`translate(${to[0]}%, ${to[1]}%)`}, {offset:1, transform:`translate(${to[0]}%, ${to[1]}%)`}], easing:"ease-in-out"}]}));
    }

  const L = (id, name, o, make) => def("빛", id, name, {color:true, poster:.4, ...o, d:{duration:2400, iterations:0, color:"#e9d8a6", ...o.d}}, make);
  L("innerGlow", "안쪽 빛", {}, c => ({layers:[{css:"inset:0;border-radius:inherit",
    kf:seq([0, 1, 0], v => ({boxShadow:`inset 0 0 ${f2(4 + 26*c.I*v)}px ${hexA(c.color, .2 + .6*v)}`})), easing:"ease-in-out"}]}));
  L("doubleNeon", "이중 네온", {d:{color:"#ff4fd8"}}, c => ({layers:[
    {css:`inset:-4px;border-radius:inherit;border:2px solid ${c.color};box-shadow:0 0 ${f2(10*c.I)}px ${hexA(c.color,.8)}`, kf:seq([1,.6,1], v => ({opacity:v})), easing:"ease-in-out"},
    {css:`inset:-12px;border-radius:inherit;border:1px solid ${hexA(c.color,.7)};box-shadow:0 0 ${f2(14*c.I)}px ${hexA(c.color,.5)}`, kf:seq([.4,1,.4], v => ({opacity:v})), easing:"ease-in-out"}]}));
  L("neonBuzz", "지직이는 네온", {d:{color:"#5ce1ff", duration:3000}, poster:.05}, c => ({layers:[{css:`inset:0;border-radius:inherit;box-shadow:0 0 ${f2(4*c.I)}px ${c.color},0 0 ${f2(18*c.I)}px ${hexA(c.color,.7)},inset 0 0 ${f2(8*c.I)}px ${hexA(c.color,.5)}`,
    kf:[[0,1],[.62,1],[.63,.2],[.66,1],[.68,.1],[.72,1],[.9,1],[.91,.4],[.93,1],[1,1]].map(([o, v]) => ({offset:o, opacity:v, easing:STEP}))}]}));
  L("halo", "후광", {d:{duration:3600}}, c => ({layers:[{css:`inset:-30%;border-radius:50%;background:radial-gradient(closest-side,transparent 55%,${hexA(c.color,.35*c.I)} 72%,transparent)`,
    kf:seq([.9, 1.08, .9], v => ({transform:`scale(${v})`, opacity:f2(.5 + (v - .9)*2.5)})), easing:"ease-in-out"}]}));
  for(const [id, name, css] of [
    ["rimTop", "윗변 빛", (c) => `left:0;right:0;top:0;height:35%;background:linear-gradient(to bottom,${hexA(c.color,.6*c.I)},transparent);border-radius:inherit`],
    ["rimBottom", "아랫변 빛", (c) => `left:0;right:0;bottom:0;height:35%;background:linear-gradient(to top,${hexA(c.color,.6*c.I)},transparent);border-radius:inherit`],
    ["rimSides", "양옆 빛", (c) => `inset:0;background:linear-gradient(90deg,${hexA(c.color,.5*c.I)},transparent 25%,transparent 75%,${hexA(c.color,.5*c.I)});border-radius:inherit`]])
    L(id, name, {clip:true}, c => ({layers:[{css:css(c), kf:seq([.5, 1, .5], v => ({opacity:v})), easing:"ease-in-out"}]}));
  L("cornerGlints", "모서리 반짝", {d:{duration:2400, color:"#ffffff"}, poster:.1}, c => ({layers:[[0,0],[100,0],[100,100],[0,100]].map(([x, y], i) => ({
    css:`left:${x}%;top:${y}%;width:${f2(14*c.I)}px;height:${f2(14*c.I)}px;translate:-50% -50%;background:${c.color};clip-path:polygon(50% 0%,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0% 50%,42% 42%);filter:drop-shadow(0 0 4px ${hexA(c.color,.9)});opacity:0`,
    kf:[{offset:0, opacity:0, transform:"scale(0) rotate(0deg)"}, {offset:.12, opacity:1, transform:"scale(1) rotate(45deg)"}, {offset:.25, opacity:0, transform:"scale(0) rotate(90deg)"}, {offset:1, opacity:0, transform:"scale(0) rotate(90deg)"}],
    at:i / 4, easing:"ease-in-out"}))}));
  // 스포트라이트: 둥근 빛이 경로를 따라 움직인다
  const SPOT = [
    ["spotCircle", "스포트라이트 원형", t => [50 + Math.cos(t*Math.PI*2)*30, 50 + Math.sin(t*Math.PI*2)*30], 9],
    ["spotSweepH", "스포트라이트 좌우", t => [10 + 80*(.5 - .5*Math.cos(t*Math.PI*2)), 50], 9],
    ["spotSweepV", "스포트라이트 상하", t => [50, 10 + 80*(.5 - .5*Math.cos(t*Math.PI*2))], 9],
    ["spotEight", "스포트라이트 8자", t => [50 + Math.sin(t*Math.PI*2)*35, 50 + Math.sin(t*Math.PI*4)*20], 17]];
  for(const [id, name, path, n] of SPOT)
    L(id, name, {clip:true, d:{duration:5000, color:"#fff4d6"}}, c => ({layers:[{css:`inset:-100%;mix-blend-mode:screen;background:radial-gradient(circle at 50% 50%,${hexA(c.color,.55*Math.min(c.I,1.5))},${hexA(c.color,.12)} 12%,transparent 20%)`,
      kf:Array.from({length:n}, (_, k) => { const [x, y] = path(k / (n - 1)); return {offset:f2(k / (n - 1)), transform:`translate(${f2((x - 50) / 3)}%, ${f2((y - 50) / 3)}%)`}; }), easing:"linear"}]}));
  L("lightLeak", "빛 번짐", {clip:true, d:{duration:7000, color:"#ff8a3d"}}, c => ({layers:[[20, 30, c.color], [75, 65, "#ff3d8a"], [55, 15, "#ffd23d"]].map(([x, y, col], i) => ({
    css:`inset:-60%;mix-blend-mode:screen;background:radial-gradient(circle at 50% 50%,${hexA(col,.45*Math.min(c.I,1.5))},transparent 22%)`,
    kf:seq([0, 1, 2, 0], k => { const a = (k + i) * 2.1; return {transform:`translate(${f2((x - 50)/2.2 + Math.cos(a)*6)}%, ${f2((y - 50)/2.2 + Math.sin(a)*6)}%)`}; }), easing:"ease-in-out"}))}));
  L("godRays", "빛줄기", {clip:true, d:{duration:6000, color:"#fff1c4"}}, c => ({layers:[{css:`left:-50%;right:-50%;top:-120%;height:220%;transform-origin:50% 0%;background:repeating-conic-gradient(from 160deg at 50% 0%,${hexA(c.color,.22*c.I)} 0deg 4deg,transparent 4deg 11deg);-webkit-mask-image:linear-gradient(to bottom,#000 40%,transparent 95%);mask-image:linear-gradient(to bottom,#000 40%,transparent 95%);mix-blend-mode:screen`,
    kf:seq([-6, 6, -6], v => ({transform:`rotate(${f2(v)}deg)`, opacity:f2(.6 + Math.abs(v)/15)})), easing:"ease-in-out"}]}));
  L("sunburst", "햇살 회전", {clip:true, d:{duration:12000, color:"#ffd27a"}}, c => ({layers:[{css:`${centered(260)};border-radius:50%;background:repeating-conic-gradient(${hexA(c.color,.25*c.I)} 0deg 6deg,transparent 6deg 15deg);-webkit-mask-image:radial-gradient(closest-side,#000,transparent);mask-image:radial-gradient(closest-side,#000,transparent)`,
    kf:[{transform:"rotate(0deg)"}, {transform:"rotate(360deg)"}], easing:"linear"}]}));
  L("lensFlare", "렌즈 플레어", {d:{duration:4000, color:"#a8d8ff"}, poster:.5}, c => ({layers:[[0, 26, .5], [.35, 10, .35], [.55, 16, .25], [.75, 6, .5], [1, 34, .2]].map(([t, s, a]) => ({
    css:`left:0;top:0;width:${f2(s*c.I)}px;height:${f2(s*c.I)}px;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,${hexA(c.color,a)},${hexA(c.color,a*.3)} 60%,transparent 72%);mix-blend-mode:screen`,
    kf:seq([0, 1, 0], v => { const p = .15 + .7*v, q = t * (1 - p) + (1 - t) * p; return {...at(15 + q*70, 15 + q*70), opacity:1}; }), easing:"ease-in-out"}))}));
  L("sparkleCorner", "모서리 큰 별빛", {d:{duration:2600, color:"#ffffff"}, poster:.5}, c => ({layers:[{css:`right:6%;top:6%;width:${f2(26*c.I)}px;height:${f2(26*c.I)}px;translate:50% -50%;background:${c.color};clip-path:polygon(50% 0%,56% 44%,100% 50%,56% 56%,50% 100%,44% 56%,0% 50%,44% 44%);filter:drop-shadow(0 0 6px ${hexA(c.color,.9)})`,
    kf:seq([0, 1, .6, 1, 0], v => ({opacity:v, transform:`scale(${f2(.2 + v*.8)}) rotate(${f2(v*90)}deg)`})), easing:"ease-in-out"}]}));
  L("aurora", "오로라", {clip:true, d:{duration:8000, color:"#39ffb0"}}, c => ({layers:[[c.color, 0], ["#4f7dff", 1], ["#c54fff", 2]].map(([col, i]) => ({
    css:`left:-50%;right:-50%;top:${10 + i*12}%;height:45%;filter:blur(18px);mix-blend-mode:screen;border-radius:50%;background:linear-gradient(90deg,transparent,${hexA(col,.45*Math.min(c.I,1.5))},transparent)`,
    kf:seq([0, 1, 0], v => ({transform:`translateX(${f2((v - .5) * (i % 2 ? -30 : 30))}%) skewX(${f2((v - .5)*20)}deg)`, opacity:f2(.5 + .5*v)})), at:i * .2, easing:"ease-in-out"}))}));
  L("caustics", "물결 빛무늬", {clip:true, d:{duration:5000, color:"#7fe8ff"}}, c => ({layers:[1, -1].map(s => ({
    css:`inset:0;mix-blend-mode:screen;opacity:${f2(.5*Math.min(c.I,1.6))};background:repeating-radial-gradient(circle at ${s > 0 ? 30 : 70}% 40%,transparent 0 9px,${hexA(c.color,.5)} 10px 11px,transparent 12px 22px);background-size:140% 140%`,
    kf:[{backgroundPosition:"0% 0%"}, {backgroundPosition:`${s*30}% ${-s*20}%`}], easing:"linear"}))}));
  L("underGlow", "바닥 빛", {d:{duration:3000, color:"#5ce1ff"}}, c => ({layers:[{css:`left:5%;right:5%;bottom:-28%;height:40%;border-radius:50%;filter:blur(10px);background:radial-gradient(closest-side,${hexA(c.color,.7*Math.min(c.I,1.4))},transparent)`,
    kf:seq([.7, 1, .7], v => ({opacity:v, transform:`scaleX(${v})`})), easing:"ease-in-out"}]}));
  L("strobe", "섬광", {clip:true, d:{duration:1200, color:"#ffffff"}, poster:.05}, c => ({layers:[{css:`inset:0;border-radius:inherit;background:${hexA(c.color,.7*Math.min(c.I,1.4))};opacity:0`,
    kf:flicker([[0,.06],[.14,.2]], {opacity:1}, {opacity:0})}]}));
  L("edgeShimmer", "윗변 빛 흐름", {d:{duration:2200, color:"#ffffff"}}, c => ({layers:[{css:`left:0;top:-1px;width:30%;height:2px;background:linear-gradient(90deg,transparent,${c.color},transparent);filter:drop-shadow(0 0 ${f2(4*c.I)}px ${hexA(c.color,.9)})`,
    kf:[{offset:0, left:"-30%"}, {offset:.7, left:"100%"}, {offset:1, left:"100%"}], easing:"ease-in-out"}]}));
  L("prismStreak", "프리즘 줄기", {clip:true, d:{duration:3200}}, c => ({layers:[{css:`left:-20%;right:-20%;top:45%;height:${f2(6*c.I)}px;filter:blur(1px);mix-blend-mode:screen;background:linear-gradient(90deg,transparent,#ff3d3d,#ffd23d,#3dff8a,#3dc5ff,#a83dff,transparent)`,
    kf:seq([0, 1, 0], v => ({opacity:f2(.3 + .7*v), transform:`translateY(${f2((v - .5)*40)}px) scaleX(${f2(.8 + .3*v)})`})), easing:"ease-in-out"}]}));
  L("glowHueShift", "색이 바뀌는 글로우", {d:{duration:4000, color:"#ff4f4f"}}, c => ({layers:[{css:`inset:0;border-radius:inherit;box-shadow:0 0 ${f2(16*c.I)}px ${f2(2*c.I)}px ${hexA(c.color,.8)}`,
    kf:[{filter:"hue-rotate(0deg)"}, {filter:"hue-rotate(360deg)"}], easing:"linear"}]}));
}
