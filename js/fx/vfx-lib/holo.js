/* 홀로그램: 스캔라인·격자·HUD·데이터 표현 45종 */
import { f2, hexA, clamp, STEP, flicker, windows, at, seq, centered, svgUrl, ringMask, NOISE } from "../vfx-util.js";

export function holoEffects(def){
  const H = (id, name, o, make) => def("홀로그램", id, name, {color:true, clip:true, poster:.4, ...o, d:{duration:3000, iterations:0, color:"#7df9ff", ...o.d}}, make);
  const line = (col, a) => hexA(col, a);

  /* 스캔라인 변형 */
  H("scanUp", "스캔라인 상승", {}, c => ({layers:[
    {css:`inset:0;background:repeating-linear-gradient(to bottom,${line(c.color,.2*c.I)} 0 1px,transparent 1px 4px)`, kf:[{backgroundPosition:"0px 32px"}, {backgroundPosition:"0px 0px"}], easing:"linear"},
    {css:`left:0;right:0;top:0;height:18%;background:linear-gradient(to top,transparent,${line(c.color,.3*c.I)} 50%,transparent)`, kf:[{offset:0, transform:"translateY(560%)"}, {offset:.7, transform:"translateY(-100%)"}, {offset:1, transform:"translateY(-100%)"}], easing:"ease-in-out"}]}));
  H("scanFine", "촘촘한 스캔라인", {d:{duration:1500}}, c => ({layers:[{css:`inset:0;background:repeating-linear-gradient(to bottom,${line(c.color,.18*c.I)} 0 1px,transparent 1px 2px)`, kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"0px 8px"}], easing:"linear"}]}));
  H("scanCoarse", "굵은 스캔라인", {d:{duration:4000}}, c => ({layers:[{css:`inset:0;background:repeating-linear-gradient(to bottom,${line(c.color,.22*c.I)} 0 3px,transparent 3px 10px)`, kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"0px 40px"}], easing:"linear"}]}));
  H("scanRGB", "RGB 스캔라인", {d:{duration:2000}}, c => ({layers:[{css:`inset:0;opacity:${f2(clamp(.35*c.I,0,1))};mix-blend-mode:screen;background:repeating-linear-gradient(to bottom,rgba(255,40,80,.6) 0 1px,rgba(40,255,140,.6) 1px 2px,rgba(60,120,255,.6) 2px 3px,transparent 3px 6px)`, kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"0px 24px"}], easing:"linear"}]}));
  H("scanInterlace", "인터레이스", {d:{duration:200}}, c => ({layers:[{css:`inset:0;background:repeating-linear-gradient(to bottom,${line(c.color,.22*c.I)} 0 1px,transparent 1px 3px)`,
    kf:[{offset:0, easing:STEP, backgroundPosition:"0px 0px"}, {offset:.5, easing:STEP, backgroundPosition:"0px 1px"}, {offset:1, backgroundPosition:"0px 0px"}]}]}));
  H("scanRoll", "롤링 밴드", {d:{duration:3500}}, c => ({layers:[{css:`left:0;right:0;top:0;height:30%;background:linear-gradient(to bottom,transparent,${line(c.color,.18*c.I)} 40%,${line("#ffffff",.12*c.I)} 50%,${line(c.color,.18*c.I)} 60%,transparent)`,
    kf:[{transform:"translateY(-100%)"}, {transform:"translateY(340%)"}], easing:"linear"}]}));

  /* 격자 */
  H("dotGrid", "점 격자", {}, c => ({layers:[{css:`inset:0;background:radial-gradient(circle,${line(c.color,.55*c.I)} 1px,transparent 1.6px);background-size:12px 12px`,
    kf:seq([.4, 1, .4], v => ({opacity:v, backgroundPosition:`0px ${f2(v*6)}px`})), easing:"ease-in-out"}]}));
  H("floorGrid", "원근 바닥 격자", {d:{duration:1600, color:"#ff4fd8"}}, c => ({layers:[{css:`left:-50%;right:-50%;bottom:0;height:70%;transform-origin:50% 100%;transform:perspective(220px) rotateX(62deg);background-image:linear-gradient(${line(c.color,.6*c.I)} 1px,transparent 1px),linear-gradient(90deg,${line(c.color,.6*c.I)} 1px,transparent 1px);background-size:28px 28px;-webkit-mask-image:linear-gradient(to top,#000 30%,transparent);mask-image:linear-gradient(to top,#000 30%,transparent)`,
    kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"0px 28px"}], easing:"linear"}]}));
  H("radialGrid", "방사형 격자", {d:{duration:20000}}, c => ({layers:[{css:`${centered(170)};border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 18px,${line(c.color,.4*c.I)} 18px 19px),repeating-conic-gradient(${line(c.color,.3*c.I)} 0deg 1deg,transparent 1deg 15deg);-webkit-mask-image:radial-gradient(closest-side,#000 60%,transparent);mask-image:radial-gradient(closest-side,#000 60%,transparent)`,
    kf:[{transform:"rotate(0deg)"}, {transform:"rotate(360deg)"}], easing:"linear"}]}));
  H("isoGrid", "등각 격자", {d:{duration:3000}}, c => ({layers:[{css:`inset:0;background-image:repeating-linear-gradient(60deg,${line(c.color,.35*c.I)} 0 1px,transparent 1px 18px),repeating-linear-gradient(-60deg,${line(c.color,.35*c.I)} 0 1px,transparent 1px 18px)`,
    kf:[{backgroundPosition:"0px 0px, 0px 0px"}, {backgroundPosition:"0px 36px, 0px 36px"}], easing:"linear"}]}));
  H("interference", "간섭 무늬", {d:{duration:2600}}, c => ({layers:[{css:`inset:0;opacity:${f2(clamp(.5*c.I,0,1))};background:repeating-radial-gradient(circle at 50% 50%,transparent 0 6px,${line(c.color,.5)} 7px,transparent 8px)`,
    kf:seq([12, 18, 12], v => ({backgroundSize:`${v*10}% ${v*10}%`, backgroundPosition:"50% 50%"})), easing:"ease-in-out"}]}));
  H("hexPattern", "육각 패턴", {d:{duration:6000}}, c => ({layers:[{css:`inset:0;opacity:${f2(clamp(.5*c.I,0,1))};background-image:${svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='28' height='48'><path d='M14 0l14 8v16l-14 8L0 24V8zM14 32l14 8v16M14 32L0 40v16' fill='none' stroke='${c.color}' stroke-width='1'/></svg>`)};background-size:28px 48px`,
    kf:seq([0, 1], v => ({backgroundPosition:`0px ${v*48}px`})), easing:"linear"}]}));
  H("pixelLCD", "LCD 화소", {d:{duration:900}}, c => ({layers:[{css:`inset:0;mix-blend-mode:overlay;opacity:${f2(clamp(.6*c.I,0,1))};background:repeating-linear-gradient(90deg,rgba(255,0,0,.5) 0 1px,rgba(0,255,0,.5) 1px 2px,rgba(0,80,255,.5) 2px 3px)`,
    kf:seq([1, .7, 1], v => ({opacity:f2(v*clamp(.6*c.I,0,1))})), easing:"ease-in-out"}]}));
  H("depthGrid", "깊이 격자", {d:{duration:4000}}, c => ({layers:[[14, .35, 1], [28, .25, .5], [56, .15, .25]].map(([s, a, sp]) => ({
    css:`inset:0;background-image:linear-gradient(${line(c.color,a*c.I)} 1px,transparent 1px),linear-gradient(90deg,${line(c.color,a*c.I)} 1px,transparent 1px);background-size:${s}px ${s}px`,
    kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:`${s}px ${s}px`}], dur:1 / sp, easing:"linear"}))}));

  /* HUD */
  const corner = (x, y, s, col, w) => `${x ? "right" : "left"}:4%;${y ? "bottom" : "top"}:4%;width:${s}%;height:${s}%;border:${w}px solid ${col};border-${x ? "left" : "right"}:0;border-${y ? "top" : "bottom"}:0`;
  H("cornerBrackets", "모서리 괄호", {clip:false}, c => ({layers:[[0,0],[1,0],[1,1],[0,1]].map(([x, y]) => ({css:corner(x, y, 14, c.color, Math.max(1, 2*c.I)),
    kf:seq([0, 1, 0], v => ({opacity:f2(.5 + .5*v), transform:`translate(${f2((x ? 1 : -1) * 6 * v)}px, ${f2((y ? 1 : -1) * 6 * v)}px)`})), easing:"ease-in-out"}))}));
  H("targetLock", "조준 고정", {clip:false, d:{duration:2000, color:"#ff5c5c"}, poster:.6}, c => ({layers:[[0,0],[1,0],[1,1],[0,1]].map(([x, y]) => ({css:corner(x, y, 18, c.color, Math.max(1, 2*c.I)),
    kf:[{offset:0, opacity:0, transform:`translate(${(x ? 1 : -1) * 30}px, ${(y ? 1 : -1) * 30}px)`}, {offset:.35, opacity:1, transform:"translate(0px, 0px)"}, {offset:.45, opacity:0, easing:STEP}, {offset:.5, opacity:1, easing:STEP}, {offset:.55, opacity:0, easing:STEP}, {offset:.6, opacity:1}, {offset:1, opacity:1, transform:"translate(0px, 0px)"}], easing:"ease-out"}))}));
  H("reticle", "조준선", {d:{duration:8000}}, c => ({layers:[{css:`${centered(50)};border-radius:50%;border:1px solid ${line(c.color,.8)};background:linear-gradient(${line(c.color,.7)},${line(c.color,.7)}) center/1px 100% no-repeat,linear-gradient(90deg,${line(c.color,.7)},${line(c.color,.7)}) center/100% 1px no-repeat;-webkit-mask:radial-gradient(circle,transparent 18%,#000 19%);mask:radial-gradient(circle,transparent 18%,#000 19%)`,
    kf:[{transform:`rotate(0deg) scale(${f2(.9 + .1*c.I)})`}, {transform:`rotate(360deg) scale(${f2(.9 + .1*c.I)})`}], easing:"linear"}]}));
  H("radar", "레이더", {d:{duration:3000, color:"#3dff8a"}}, c => ({layers:[
    {css:`${centered(110)};border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 14%,${line(c.color,.35)} 14.5% 15%)`, kf:null},
    {css:`${centered(110)};border-radius:50%;background:conic-gradient(from 0deg,${line(c.color,.55*Math.min(c.I,1.6))},transparent 70deg)`, kf:[{transform:"rotate(0deg)"}, {transform:"rotate(360deg)"}], easing:"linear"}]}));
  H("scanBox", "스캔 상자", {}, c => ({layers:[
    ...[[0,0],[1,0],[1,1],[0,1]].map(([x, y]) => ({css:corner(x, y, 10, c.color, 2), kf:null})),
    {css:`left:4%;right:4%;top:4%;height:2px;background:${c.color};box-shadow:0 0 ${f2(8*c.I)}px ${c.color}`, kf:seq([4, 96, 4], v => ({top:`${v}%`})), easing:"ease-in-out"}]}));
  H("rulerTicks", "눈금자", {d:{duration:4000}}, c => ({layers:[
    {css:`left:0;right:0;top:0;height:8px;background:repeating-linear-gradient(90deg,${line(c.color,.7)} 0 1px,transparent 1px 10px)`, kf:null},
    {css:`left:0;top:0;bottom:0;width:8px;background:repeating-linear-gradient(to bottom,${line(c.color,.7)} 0 1px,transparent 1px 10px)`, kf:null},
    {css:`left:0;top:0;width:2px;height:14px;background:${c.color};box-shadow:0 0 6px ${c.color}`, kf:seq([0, 100, 0], v => ({left:`${v}%`})), easing:"ease-in-out"}]}));
  H("progressRing", "진행 고리", {d:{duration:2400}}, c => ({layers:[{css:`${centered(36)};border-radius:50%;background:${line(c.color,.15)};-webkit-mask:radial-gradient(circle,transparent 60%,#000 61%);mask:radial-gradient(circle,transparent 60%,#000 61%)`, kf:null},
    {css:`${centered(36)};border-radius:50%;background:conic-gradient(${c.color} 0 25%,transparent 0);-webkit-mask:radial-gradient(circle,transparent 60%,#000 61%);mask:radial-gradient(circle,transparent 60%,#000 61%)`,
    kf:[{transform:"rotate(0deg)"}, {transform:"rotate(720deg)"}], easing:"linear"}]}));
  H("loadBar", "로딩 막대", {d:{duration:2200}}, c => ({layers:[
    {css:`left:8%;right:8%;bottom:8%;height:4px;background:${line(c.color,.2)}`, kf:null},
    {css:`left:8%;bottom:8%;height:4px;width:0%;background:${c.color};box-shadow:0 0 ${f2(8*c.I)}px ${c.color}`, kf:[{offset:0, width:"0%"}, {offset:.85, width:"84%"}, {offset:1, width:"84%"}], easing:"ease-in-out"}]}));
  H("signalBars", "신호 막대", {d:{duration:1600}}, c => ({layers:[0, 1, 2, 3].map(i => ({css:`right:${6 + (3 - i)*5}%;bottom:8%;width:3.5%;height:${8 + i*7}%;background:${c.color}`,
    kf:[{offset:0, opacity:.15, easing:STEP}, {offset:f2(.15 + i*.15), opacity:1, easing:STEP}, {offset:.85, opacity:.15}, {offset:1, opacity:.15}]}))}));
  H("spectrum", "스펙트럼 막대", {d:{duration:1200, color:"#3dc5ff"}}, c => ({layers:Array.from({length:14}, (_, i) => ({
    css:`left:${f2(4 + i*6.6)}%;bottom:0;width:4.6%;height:60%;transform-origin:50% 100%;background:linear-gradient(to top,${c.color},${line(c.color,.2)})`,
    kf:seq([.1, .3 + c.rnd()*.7, .15 + c.rnd()*.5, .5 + c.rnd()*.5, .1], v => ({transform:`scaleY(${f2(v*Math.min(1, .5 + .5*c.I))})`})), easing:"ease-in-out", dur:.6 + c.rnd()*.4}))}));
  H("waveform", "파형", {d:{duration:1800}}, c => ({layers:[{css:`left:0;right:0;top:35%;height:30%;background-image:${svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40'><path d='M0 20 Q15 0 30 20 T60 20 T90 20 T120 20' fill='none' stroke='${c.color}' stroke-width='2'/></svg>`)};background-size:120px 100%;background-repeat:repeat-x;filter:drop-shadow(0 0 ${f2(4*c.I)}px ${c.color})`,
    kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"120px 0px"}], easing:"linear"}]}));

  /* 데이터 */
  H("dataRain", "데이터 비", {density:true, d:{duration:2600, color:"#3dff8a"}, tail:true, poster:1.2}, c => ({layers:Array.from({length:Math.round(10 + 8*c.D)}, () => ({
    css:`left:${f2(c.rnd()*96)}%;top:0;width:1.6%;height:45%;background:repeating-linear-gradient(to bottom,${line(c.color,.9)} 0 3px,transparent 3px 7px);-webkit-mask-image:linear-gradient(to bottom,transparent,#000);mask-image:linear-gradient(to bottom,transparent,#000);opacity:0`,
    kf:[{offset:0, opacity:1, transform:"translateY(-100%)"}, {offset:1, opacity:1, transform:"translateY(230%)"}], at:c.rnd(), dur:.5 + c.rnd()*.5, easing:"linear"}))}));
  H("binaryBlink", "이진 점멸", {density:true, d:{duration:1400}}, c => ({layers:Array.from({length:Math.round(14 + 10*c.D)}, () => ({
    css:`left:${f2(c.rnd()*94)}%;top:${f2(c.rnd()*92)}%;width:${c.rnd() < .5 ? 4 : 10}px;height:6px;background:${line(c.color,.8)}`,
    kf:flicker(windows(c.rnd, 3, .12, .05), {opacity:1}, {opacity:.1})}))}));
  H("terminalScroll", "터미널 스크롤", {d:{duration:4000, color:"#3dff8a"}}, c => ({layers:Array.from({length:10}, (_, i) => ({
    css:`left:6%;top:${4 + i*10}%;height:4%;width:${f2(20 + c.rnd()*60)}%;border-radius:2px;background:${line(c.color,.55)}`,
    kf:[{transform:"translateY(0%)"}, {transform:"translateY(-250%)"}], easing:STEP.replace("1", "4"), dur:1}))}));
  H("circuit", "회로 흐름", {d:{duration:2000, color:"#e9d8a6"}}, c => ({layers:[{css:`inset:0;opacity:${f2(clamp(.7*c.I,0,1))};background-image:${svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path d='M0 20h30l10 10v30h40M20 0v10l10 10M80 50H55l-5-5V0M0 70h15l10-10' fill='none' stroke='${c.color}' stroke-width='1' stroke-dasharray='4 6'/><circle cx='40' cy='60' r='2' fill='${c.color}'/><circle cx='50' cy='45' r='2' fill='${c.color}'/></svg>`)};background-size:80px 80px`,
    kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"80px 0px"}], easing:"linear"}]}));
  H("wireframe", "와이어프레임", {d:{duration:5000}}, c => ({layers:[{css:`inset:0;background-image:repeating-linear-gradient(45deg,${line(c.color,.22*c.I)} 0 1px,transparent 1px 16px),repeating-linear-gradient(-45deg,${line(c.color,.22*c.I)} 0 1px,transparent 1px 16px);border:1px solid ${line(c.color,.6)}`,
    kf:[{backgroundPosition:"0px 0px, 0px 0px"}, {backgroundPosition:"22.6px 0px, -22.6px 0px"}], easing:"linear"}]}));
  H("dataRings", "데이터 링", {clip:false, d:{duration:9000}}, c => ({layers:[[70, 1, "dashed"], [56, -1.6, "dotted"], [42, 2.4, "dashed"]].map(([s, sp, st]) => ({
    css:`${centered(s)};border-radius:50%;border:${f2(Math.max(1, 1.5*c.I))}px ${st} ${line(c.color,.7)}`, kf:[{transform:"rotate(0deg)"}, {transform:`rotate(${360*Math.sign(sp)}deg)`}], dur:1 / Math.abs(sp), easing:"linear"}))}));
  H("orbitRings3D", "3D 궤도 고리", {clip:false, d:{duration:6000}}, c => ({layers:[0, 60, 120].map(r => ({css:`${centered(80)};border-radius:50%;border:1px solid ${line(c.color,.65)}`,
    kf:[{transform:`rotate(${r}deg) perspective(400px) rotateX(70deg) rotateZ(0deg)`}, {transform:`rotate(${r}deg) perspective(400px) rotateX(70deg) rotateZ(360deg)`}], easing:"linear"}))}));
  H("glyphBlocks", "기호 블록", {density:true, d:{duration:2400}}, c => ({layers:Array.from({length:Math.round(8 + 6*c.D)}, () => {
    const g = ["0% 0%,100% 0%,100% 30%,30% 30%,30% 100%,0% 100%", "0% 0%,100% 0%,100% 100%,70% 100%,70% 30%,0% 30%", "40% 0%,60% 0%,60% 100%,40% 100%", "0% 40%,100% 40%,100% 60%,0% 60%"][Math.floor(c.rnd()*4)];
    return {css:`left:${f2(c.rnd()*90)}%;top:${f2(c.rnd()*88)}%;width:10px;height:10px;background:${line(c.color,.85)};clip-path:polygon(${g})`, kf:flicker(windows(c.rnd, 2, .2, .1), {opacity:1}, {opacity:0})};
  })}));

  /* 빛·표면 */
  H("iridescent", "무지갯빛 필름", {d:{duration:5000}}, c => ({layers:[{css:`${centered(180)};mix-blend-mode:overlay;opacity:${f2(clamp(.6*c.I,0,1))};background:conic-gradient(#ff3d3d,#ffd23d,#3dff8a,#3dc5ff,#a83dff,#ff3d3d)`,
    kf:[{transform:"rotate(0deg)"}, {transform:"rotate(360deg)"}], easing:"linear"}]}));
  H("prismEdges", "프리즘 가장자리", {d:{duration:2000}}, c => ({layers:[{css:"inset:0;border-radius:inherit",
    kf:seq([2, 4, 2], v => ({boxShadow:`inset ${f2(v*c.I)}px 0 0 rgba(255,40,80,.55),inset ${f2(-v*c.I)}px 0 0 rgba(40,220,255,.55)`})), easing:"ease-in-out"}]}));
  H("holoNoise", "홀로그램 잡음", {d:{duration:600}}, c => ({layers:[
    {css:`inset:0;background-image:${NOISE};opacity:${f2(clamp(.18*c.I,0,1))};mix-blend-mode:screen`, kf:[0, 1, 2, 3].map(i => ({offset:f2(i/3), easing:STEP, backgroundPosition:`${Math.round(c.rnd()*140)}px ${Math.round(c.rnd()*140)}px`}))},
    {css:`inset:0;background:${line(c.color,.12*c.I)};mix-blend-mode:screen`, kf:seq([1, .5, 1], v => ({opacity:v}))}]}));
  H("edgeTrace", "가장자리 추적", {d:{duration:2400}}, c => ({layers:[
    {css:`inset:0;border-radius:inherit;box-shadow:inset 0 0 ${f2(10*c.I)}px ${line(c.color,.45)}`, kf:seq([.5, 1, .5], v => ({opacity:v})), easing:"ease-in-out"},
    {css:`left:0;right:0;top:0;height:1px;background:${c.color};box-shadow:0 0 6px ${c.color}`, kf:seq([0, 100, 0], v => ({top:`${v}%`})), easing:"linear"}]}));
  H("fogVolume", "홀로그램 안개", {d:{duration:8000}}, c => ({layers:[0, 1].map(i => ({css:`left:-50%;right:-50%;top:${20 + i*30}%;height:40%;border-radius:50%;filter:blur(16px);background:radial-gradient(closest-side,${line(c.color,.3*Math.min(c.I,1.6))},transparent)`,
    kf:[{transform:"translateX(-15%)"}, {transform:"translateX(15%)"}], at:i * .5, easing:"ease-in-out"}))}));
  H("projector", "투사 빛기둥", {clip:false, d:{duration:2000}}, c => ({layers:[
    {css:`left:10%;right:10%;bottom:-40%;height:140%;clip-path:polygon(35% 100%,65% 100%,100% 0%,0% 0%);background:linear-gradient(to top,${line(c.color,.45*Math.min(c.I,1.6))},transparent 85%);mix-blend-mode:screen`, kf:seq([.6, 1, .75, 1, .6], v => ({opacity:v}))},
    {css:`left:30%;right:30%;bottom:-42%;height:8%;border-radius:50%;background:radial-gradient(closest-side,${c.color},transparent);filter:blur(3px)`, kf:null}]}));
  H("hologramBase", "홀로그램 받침대", {clip:false}, c => ({layers:[
    {css:`left:-5%;right:-5%;bottom:-14%;height:18%;border-radius:50%;border:1px solid ${line(c.color,.8)};background:radial-gradient(closest-side,${line(c.color,.35*c.I)},transparent)`, kf:seq([.6, 1, .6], v => ({opacity:v})), easing:"ease-in-out"},
    {css:`left:5%;right:5%;bottom:-8%;height:10%;border-radius:50%;border:1px dashed ${line(c.color,.6)}`, kf:[{transform:"rotate(0deg)"}, {transform:"rotate(360deg)"}], easing:"linear"}]}));
  H("cardTilt", "홀로 카드 기울기", {d:{duration:5000, color:"#ffffff"}}, c => ({layers:[{css:`inset:-50%;mix-blend-mode:overlay;background:linear-gradient(115deg,transparent 40%,${line(c.color,.5*Math.min(c.I,1.5))} 50%,transparent 60%)`,
    kf:seq([-12, 12, -12], v => ({transform:`translateX(${f2(v)}%)`})), easing:"ease-in-out"}],
    self:{kf:seq([[6, -8], [-6, 8], [6, -8]], ([x, y]) => ({transform:c.T(`perspective(800px) rotateX(${f2(x*c.I)}deg) rotateY(${f2(y*c.I)}deg)`)})), easing:"ease-in-out"}}));
  H("chromaDrift", "색수차 흐름", {d:{duration:4000}}, c => ({layers:[], self:{easing:"ease-in-out", kf:seq([1, -1, 1], v => ({filter:`drop-shadow(${f2(v*1.5*c.I)}px 0 0 rgba(255,0,90,.55)) drop-shadow(${f2(-v*1.5*c.I)}px 0 0 rgba(0,220,255,.55))`}))}}));
  H("holoAppear", "홀로그램 투사 등장", {poster:null, d:{duration:1400, iterations:1}}, c => ({layers:[{css:`left:0;right:0;top:0;height:2px;background:${c.color};box-shadow:0 0 10px ${c.color};opacity:0`,
    kf:[{offset:0, top:"0%", opacity:1}, {offset:.9, top:"100%", opacity:1}, {offset:1, top:"100%", opacity:0}], easing:"ease-out"}],
    self:{fill:"backwards", easing:"ease-out", kf:[{offset:0, clipPath:"inset(0% 0% 100% 0%)", opacity:c.op*.6, filter:"brightness(1.8)"}, {offset:.9, clipPath:"inset(0% 0% 0% 0%)", opacity:c.op, filter:"brightness(1.2)"}, {offset:1, clipPath:"inset(0% 0% 0% 0%)", opacity:c.op, filter:"brightness(1)"}]}}));
  H("holoVanish", "홀로그램 투사 소멸", {poster:null, d:{duration:1400, iterations:1}}, c => ({layers:[{css:`left:0;right:0;bottom:0;height:2px;background:${c.color};box-shadow:0 0 10px ${c.color};opacity:0`,
    kf:[{offset:0, bottom:"0%", opacity:1}, {offset:.9, bottom:"100%", opacity:1}, {offset:1, bottom:"100%", opacity:0}], easing:"ease-in"}],
    self:{fill:"forwards", easing:"ease-in", kf:[{offset:0, clipPath:"inset(0% 0% 0% 0%)", opacity:c.op, filter:"brightness(1)"}, {offset:.9, clipPath:"inset(0% 0% 100% 0%)", opacity:c.op*.6, filter:"brightness(1.8)"}, {offset:1, clipPath:"inset(0% 0% 100% 0%)", opacity:0, filter:"brightness(1.8)"}]}}));
  H("holoFlickerSelf", "홀로그램 불안정", {d:{duration:2600}}, c => ({layers:[{css:`inset:0;background:repeating-linear-gradient(to bottom,${line(c.color,.15*c.I)} 0 1px,transparent 1px 3px)`, kf:null}],
    self:{kf:[[0,1,0],[.2,1,0],[.21,.5,2],[.24,1,0],[.6,1,0],[.61,.3,-3],[.63,.9,1],[.66,1,0],[1,1,0]].map(([o, a, s]) => ({offset:o, easing:STEP, opacity:f2(c.op*a), transform:c.T(`skewX(${f2(s*c.I)}deg)`)}))}}));
}
