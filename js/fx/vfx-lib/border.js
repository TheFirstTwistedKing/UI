/* 테두리 25종: 요소 가장자리를 따라 움직이는 빛·선·점 */
import { f2, hexA, STEP, seq, ringMask, perimeter, ANGLE } from "../vfx-util.js";

export function borderEffects(def){
  const B = (id, name, o, make) => def("테두리", id, name, {color:true, poster:.3, ...o, d:{duration:3000, iterations:0, color:"#e9d8a6", ...o.d}}, make);
  const g = c => Math.max(1.5, 2.5*c.I);
  // 원뿔 그라디언트의 시작 각도(--vfx-a, 등록된 각도 속성)를 돌려 빛이 둘레를 따라 돈다. 테두리 두께만큼만 보이게 마스크한다.
  const runner = (id, name, stops, o = {}) => B(id, name, {d:{duration:2600, ...o.d}, ...o}, c => ({layers:[{css:`inset:${f2(-g(c))}px;border-radius:inherit;${ringMask(g(c))};background:conic-gradient(from var(${ANGLE}),${stops(c)});filter:drop-shadow(0 0 ${f2(4*c.I)}px ${hexA(c.color,.8)})`,
    kf:[{[ANGLE]:"0deg"}, {[ANGLE]:"360deg"}], easing:"linear"}]}));
  runner("borderComet", "테두리 혜성", c => `transparent 0deg,transparent 280deg,${hexA(c.color,.4)} 330deg,${c.color} 358deg,transparent 360deg`);
  runner("borderDualComet", "테두리 쌍혜성", c => `transparent 0deg 130deg,${c.color} 178deg,transparent 180deg 310deg,${c.color} 358deg,transparent 360deg`);
  runner("borderRainbow", "무지개 테두리", c => "#ff3d3d,#ffd23d,#3dff8a,#3dc5ff,#a83dff,#ff3d3d", {color:false, d:{duration:3000}});
  runner("borderSpark", "테두리 불꽃", c => `transparent 0deg 340deg,#fff 357deg,${c.color} 359deg,transparent 360deg`, {d:{duration:1400, color:"#ffcf4f"}});
  B("gradientBorder", "그라디언트 테두리 흐름", {d:{duration:3000, color:"#ff4fd8"}}, c => ({layers:[{css:`inset:${f2(-g(c))}px;border-radius:inherit;${ringMask(g(c))};background:linear-gradient(90deg,${c.color},#4f7dff,#4fffe0,${c.color});background-size:300% 100%`,
    kf:[{backgroundPosition:"0% 0%"}, {backgroundPosition:"100% 0%"}], easing:"linear"}]}));
  B("goldShimmer", "금빛 테두리", {d:{duration:2600, color:"#e9c46a"}}, c => ({layers:[{css:`inset:${f2(-g(c))}px;border-radius:inherit;${ringMask(g(c))};background:linear-gradient(115deg,#7a5a1e,${c.color} 30%,#fff6d0 45%,${c.color} 60%,#7a5a1e);background-size:250% 100%`,
    kf:[{backgroundPosition:"100% 0%"}, {backgroundPosition:"0% 0%"}], easing:"ease-in-out"}]}));
  B("dotChase", "점선 행진", {d:{duration:900, color:"#7df9ff"}}, c => ({layers:[{css:`inset:${f2(-g(c))}px;border-radius:inherit;${ringMask(g(c))};background:radial-gradient(circle,${c.color} 45%,transparent 50%);background-size:${f2(g(c)*3)}px ${f2(g(c)*3)}px`,
    kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:`${f2(g(c)*3)}px ${f2(g(c)*3)}px`}], easing:"linear"}]}));
  B("dashMarch", "대시 행진", {d:{duration:700, color:"#ffffff"}}, c => ({layers:[{css:`inset:${f2(-g(c))}px;border-radius:inherit;${ringMask(g(c))};background:repeating-linear-gradient(90deg,${c.color} 0 8px,transparent 8px 14px),repeating-linear-gradient(0deg,${c.color} 0 8px,transparent 8px 14px)`,
    kf:[{backgroundPosition:"0px 0px, 0px 0px"}, {backgroundPosition:"14px 0px, 0px 14px"}], easing:"linear"}]}));
  B("neonTube", "네온관 테두리", {poster:.05, d:{duration:3200, color:"#ff4fd8"}}, c => ({layers:[{css:`inset:-2px;border-radius:inherit;border:${f2(g(c))}px solid ${c.color};box-shadow:0 0 ${f2(10*c.I)}px ${c.color},inset 0 0 ${f2(8*c.I)}px ${hexA(c.color,.6)}`,
    kf:[[0,1],[.5,1],[.51,.3],[.53,1],[.56,.2],[.6,1],[1,1]].map(([o, v]) => ({offset:o, opacity:v, easing:STEP}))}]}));
  B("glowBreath", "숨쉬는 테두리", {d:{duration:3600}}, c => ({layers:[{css:`inset:-1px;border-radius:inherit;border:1px solid ${c.color}`,
    kf:seq([0, 1, 0], v => ({boxShadow:`0 0 ${f2(2 + 16*c.I*v)}px ${hexA(c.color,.3 + .5*v)}`, opacity:f2(.5 + .5*v)})), easing:"ease-in-out"}]}));
  B("doublePulse", "이중 테두리 맥동", {d:{duration:2000}}, c => ({layers:[[-4, 1], [-10, -1]].map(([o, d]) => ({css:`inset:${o}px;border-radius:inherit;border:1px solid ${c.color}`,
    kf:seq([0, 1, 0], v => ({transform:`scale(${f2(1 + d*.02*v*c.I)})`, opacity:f2(d > 0 ? .5 + .5*v : 1 - .6*v)})), easing:"ease-in-out"}))}));
  B("focusRing", "포커스 링", {d:{duration:1600, color:"#4f9dff"}}, c => ({layers:[{css:`inset:-3px;border-radius:inherit`,
    kf:seq([0, 1, 0], v => ({boxShadow:`0 0 0 ${f2(2 + 2*v*c.I)}px ${hexA(c.color,.85)},0 0 0 ${f2(5 + 4*v*c.I)}px ${hexA(c.color,.25)}`})), easing:"ease-in-out"}]}));
  B("echoOutline", "테두리 잔상", {d:{duration:1600}}, c => ({layers:[0, 1, 2].map(i => ({css:`inset:0;border-radius:inherit;border:1px solid ${c.color};opacity:0`,
    kf:[{offset:0, opacity:0, easing:STEP}, {offset:f2(.15 + i*.15), opacity:f2(.8 - i*.2), transform:`scale(${f2(1 + (i + 1)*.04*c.I)})`, easing:STEP}, {offset:.85, opacity:0}, {offset:1, opacity:0}]}))}));
  B("insetZoom", "안쪽 프레임", {d:{duration:2400}}, c => ({layers:[{css:`inset:8%;border-radius:inherit;border:1px solid ${c.color};opacity:0`,
    kf:[{transform:"scale(1.15)", opacity:0}, {transform:"scale(1)", opacity:1}, {transform:"scale(.92)", opacity:0}], easing:"ease-out"}]}));
  B("drawOn", "테두리 그리기", {poster:null, d:{duration:1600, iterations:1}}, c => { const w = f2(g(c)); return {layers:[
    {css:`left:0;top:0;height:${w}px;width:0%;background:${c.color}`, kf:[{offset:0, width:"0%"}, {offset:.25, width:"100%"}, {offset:1, width:"100%"}], fill:"forwards", easing:"linear"},
    {css:`right:0;top:0;width:${w}px;height:0%;background:${c.color}`, kf:[{offset:0, height:"0%"}, {offset:.25, height:"0%"}, {offset:.5, height:"100%"}, {offset:1, height:"100%"}], fill:"forwards", easing:"linear"},
    {css:`right:0;bottom:0;height:${w}px;width:0%;background:${c.color}`, kf:[{offset:0, width:"0%"}, {offset:.5, width:"0%"}, {offset:.75, width:"100%"}, {offset:1, width:"100%"}], fill:"forwards", easing:"linear"},
    {css:`left:0;bottom:0;width:${w}px;height:0%;background:${c.color}`, kf:[{offset:0, height:"0%"}, {offset:.75, height:"0%"}, {offset:1, height:"100%"}], fill:"forwards", easing:"linear"}]}; });
  B("eraseOff", "테두리 지우기", {poster:0, d:{duration:1600, iterations:1}}, c => { const w = f2(g(c)); return {layers:[
    {css:`left:0;top:0;height:${w}px;width:100%;background:${c.color}`, kf:[{offset:0, width:"100%"}, {offset:.25, width:"0%"}, {offset:1, width:"0%"}], fill:"forwards", easing:"linear"},
    {css:`right:0;top:0;width:${w}px;height:100%;background:${c.color}`, kf:[{offset:0, height:"100%"}, {offset:.25, height:"100%"}, {offset:.5, height:"0%"}, {offset:1, height:"0%"}], fill:"forwards", easing:"linear"},
    {css:`right:0;bottom:0;height:${w}px;width:100%;background:${c.color}`, kf:[{offset:0, width:"100%"}, {offset:.5, width:"100%"}, {offset:.75, width:"0%"}, {offset:1, width:"0%"}], fill:"forwards", easing:"linear"},
    {css:`left:0;bottom:0;width:${w}px;height:100%;background:${c.color}`, kf:[{offset:0, height:"100%"}, {offset:.75, height:"100%"}, {offset:1, height:"0%"}], fill:"forwards", easing:"linear"}]}; });
  B("cornerGrow", "모서리 선 늘어남", {d:{duration:2400}}, c => ({layers:[[0,0],[1,0],[1,1],[0,1]].flatMap(([x, y]) => [
    {css:`${x ? "right" : "left"}:0;${y ? "bottom" : "top"}:0;height:2px;background:${c.color};width:12%`, kf:seq([12, 45, 12], v => ({width:`${f2(v*Math.min(c.I, 1.1))}%`})), easing:"ease-in-out"},
    {css:`${x ? "right" : "left"}:0;${y ? "bottom" : "top"}:0;width:2px;background:${c.color};height:12%`, kf:seq([12, 45, 12], v => ({height:`${f2(v*Math.min(c.I, 1.1))}%`})), easing:"ease-in-out"}])}));
  B("cornerDots", "모서리 점 순환", {d:{duration:1600}}, c => ({layers:[[0,0],[100,0],[100,100],[0,100]].map(([x, y], i) => ({
    css:`left:${x}%;top:${y}%;width:${f2(6*c.I)}px;height:${f2(6*c.I)}px;translate:-50% -50%;border-radius:50%;background:${c.color};box-shadow:0 0 6px ${c.color};opacity:.2`,
    kf:[{offset:0, opacity:.2, transform:"scale(1)"}, {offset:.12, opacity:1, transform:"scale(1.5)"}, {offset:.25, opacity:.2, transform:"scale(1)"}, {offset:1, opacity:.2, transform:"scale(1)"}], at:i / 4, easing:"ease-out"}))}));
  B("cornerGlows", "모서리 빛 교차", {d:{duration:2400}}, c => ({layers:[[0,0],[100,100],[100,0],[0,100]].map(([x, y], i) => ({
    css:`left:${x}%;top:${y}%;width:40%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(closest-side,${hexA(c.color,.6*Math.min(c.I,1.5))},transparent)`,
    kf:seq([.2, 1, .2], v => ({opacity:v})), at:(i % 2) * .5, easing:"ease-in-out"}))}));
  B("pixelChase", "픽셀 테두리 추적", {d:{duration:2400, color:"#3dff8a"}}, c => ({layers:Array.from({length:6}, (_, i) => ({
    css:`left:0;top:0;width:${f2(5*c.I)}px;height:${f2(5*c.I)}px;translate:-50% -50%;background:${c.color};opacity:${f2(1 - i*.15)}`,
    kf:perimeter(c.w, c.h).map(k => ({...k, easing:"steps(6, end)"})), at:-i*.02, easing:"linear"}))}));
  B("scanEdges", "변 따라 스캔", {d:{duration:2400, color:"#7df9ff"}}, c => ({layers:[{css:`left:0;top:0;width:${f2(10*c.I)}px;height:${f2(10*c.I)}px;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,#fff,${c.color} 40%,transparent 70%)`,
    kf:perimeter(c.w, c.h), easing:"linear"}, {css:`inset:0;border-radius:inherit;border:1px solid ${hexA(c.color,.35)}`, kf:null}]}));
  B("circuitBorder", "회로 테두리", {d:{duration:2000, color:"#e9d8a6"}}, c => ({layers:[
    {css:`inset:-1px;border-radius:inherit;border:1px solid ${hexA(c.color,.6)}`, kf:null},
    ...[[0, 30], [0, 70], [100, 40], [30, 0], [70, 100], [100, 80]].map(([x, y], i) => ({css:`left:${x}%;top:${y}%;width:6px;height:6px;translate:-50% -50%;border:1px solid ${c.color};background:#000`,
      kf:[{offset:0, background:"#000000"}, {offset:.1, background:c.color}, {offset:.25, background:"#000000"}, {offset:1, background:"#000000"}], at:i / 6, easing:"linear"}))]}));
  B("ticker", "흐르는 테두리 줄", {d:{duration:1200, color:"#ffffff"}}, c => ({layers:[
    {css:`left:0;right:0;top:-6px;height:3px;background:repeating-linear-gradient(90deg,${hexA(c.color,.7)} 0 20px,transparent 20px 28px,${hexA(c.color,.7)} 28px 32px,transparent 32px 44px)`, kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"44px 0px"}], easing:"linear"},
    {css:`left:0;right:0;bottom:-6px;height:3px;background:repeating-linear-gradient(90deg,${hexA(c.color,.7)} 0 20px,transparent 20px 28px,${hexA(c.color,.7)} 28px 32px,transparent 32px 44px)`, kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"-44px 0px"}], easing:"linear"}]}));
  B("sawEdge", "톱니 테두리", {d:{duration:1000, color:"#ffcf4f"}}, c => ({layers:[{css:`inset:-6px;border-radius:inherit;${ringMask(6)};background:conic-gradient(from -45deg at 50% 100%,${c.color} 90deg,transparent 0) 0 0/12px 6px,conic-gradient(from 135deg at 50% 0%,${c.color} 90deg,transparent 0) 0 100%/12px 6px;background-repeat:repeat-x`,
    kf:[{backgroundPosition:"0px 0px, 0px 100%"}, {backgroundPosition:"12px 0px, -12px 100%"}], easing:"linear"}]}));
  B("frameJitter", "흔들리는 프레임", {d:{duration:500, color:"#ff5c5c"}}, c => ({layers:[{css:`inset:-5px;border-radius:inherit;border:1px solid ${c.color}`,
    kf:Array.from({length:6}, (_, i) => ({offset:f2(i/5), easing:STEP, transform:`translate(${f2((c.rnd() - .5)*4*c.I)}px, ${f2((c.rnd() - .5)*4*c.I)}px)`}))}]}));
}
