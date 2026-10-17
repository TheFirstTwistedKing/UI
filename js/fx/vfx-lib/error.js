/* 오류 40종: 경고·시스템 오류·신호 이상·화면 고장 */
import { f2, hexA, clamp, STEP, flicker, windows, at, seq, centered, ringMask, NOISE } from "../vfx-util.js";

export function errorEffects(def){
  const R = (id, name, o, make) => def("오류", id, name, {color:true, clip:true, poster:.1, ...o, d:{duration:1600, iterations:0, color:"#ff2d3d", ...o.d}}, make);
  const shake = (c, n, amp) => Array.from({length:n + 1}, (_, i) => ({offset:f2(i / n), transform:c.T(`translate(${i === 0 || i === n ? 0 : f2((i % 2 ? -1 : 1) * amp * (1 - i/n) * c.I)}px, 0px)`)}));

  /* 경고 표시 */
  R("errorBorderBlink", "오류 테두리 점멸", {clip:false}, c => ({layers:[{css:`inset:-2px;border-radius:inherit;border:${f2(Math.max(1, 2*c.I))}px solid ${c.color};box-shadow:0 0 ${f2(10*c.I)}px ${hexA(c.color,.7)}`,
    kf:flicker([[0, .25], [.5, .75]], {opacity:1}, {opacity:0})}]}));
  R("amberWarn", "주의 경고", {d:{color:"#ffb020", duration:2000}, poster:.5}, c => ({layers:[{css:`inset:0;border-radius:inherit;background:${hexA(c.color,.3*c.I)}`, kf:seq([0, 1, 0], v => ({opacity:v})), easing:"ease-in-out"}]}));
  R("criticalRing", "심각 경보 고리", {clip:false, poster:.3}, c => ({layers:[
    {css:`inset:-3px;border-radius:inherit;border:2px solid ${c.color}`, kf:seq([1, .4, 1], v => ({opacity:v})), easing:"ease-in-out"},
    {css:`inset:-3px;border-radius:inherit;border:2px solid ${c.color};opacity:0`, kf:[{transform:"scale(1)", opacity:.9}, {transform:`scale(${f2(1 + .25*c.I)})`, opacity:0}], easing:"ease-out"}]}));
  R("alertSign", "경고 표지", {poster:.2}, c => ({layers:[
    {css:`${centered(30)};background:${c.color};clip-path:polygon(50% 6%,96% 90%,4% 90%);filter:drop-shadow(0 0 6px ${hexA(c.color,.8)})`, kf:flicker([[0, .5]], {opacity:1}, {opacity:.25})},
    {css:`left:50%;top:50%;width:3%;height:9%;translate:-50% -70%;background:#000;border-radius:2px`, kf:flicker([[0, .5]], {opacity:1}, {opacity:.25})},
    {css:`left:50%;top:50%;width:3%;aspect-ratio:1;translate:-50% 220%;background:#000;border-radius:50%`, kf:flicker([[0, .5]], {opacity:1}, {opacity:.25})}]}));
  R("crossStamp", "X 표시", {poster:.6, d:{duration:1800, iterations:1}}, c => ({layers:[45, -45].map(r => ({css:`${centered(50)};aspect-ratio:auto;height:${f2(8*c.I)}%;background:${c.color};opacity:0`,
    kf:[{offset:0, opacity:0, transform:`rotate(${r}deg) scale(2.2)`}, {offset:.2, opacity:1, transform:`rotate(${r}deg) scale(1)`}, {offset:1, opacity:1, transform:`rotate(${r}deg) scale(1)`}], fill:"forwards", easing:"cubic-bezier(.2,.8,.3,1.2)"}))}));
  R("deniedSign", "금지 표시", {poster:.5, d:{duration:1800}}, c => ({layers:[
    {css:`${centered(34)};border-radius:50%;border:${f2(Math.max(2, 5*c.I))}px solid ${c.color}`, kf:seq([1, 1.06, 1], v => ({transform:`scale(${v})`})), easing:"ease-in-out"},
    {css:`${centered(34)};aspect-ratio:auto;height:${f2(Math.max(2, 5*c.I))}px;background:${c.color};transform:rotate(-45deg)`, kf:seq([1, 1.06, 1], v => ({transform:`rotate(-45deg) scale(${v})`})), easing:"ease-in-out"}]}));
  R("spinnerStuck", "멈춘 로딩", {poster:.3, d:{duration:2400, color:"#ffffff"}}, c => ({layers:[{css:`${centered(16)};border-radius:50%;border:3px solid ${hexA(c.color,.2)};border-top-color:${c.color}`,
    kf:[[0,0],[.3,270],[.32,280],[.7,280],[.72,300],[.74,290],[1,360]].map(([o, r]) => ({offset:o, transform:`rotate(${r}deg)`})), easing:"ease-out"}]}));
  R("progressFail", "진행 실패", {poster:.75, d:{duration:3000}}, c => ({layers:[
    {css:`left:10%;right:10%;top:46%;height:8%;border:1px solid ${hexA("#ffffff",.5)};border-radius:3px`, kf:null},
    {css:`left:10%;top:46%;height:8%;border-radius:3px;width:0%`, kf:[{offset:0, width:"0%", background:"#3dff8a"}, {offset:.55, width:"55%", background:"#3dff8a", easing:STEP}, {offset:.6, width:"55%", background:c.color, easing:STEP}, {offset:.65, width:"55%", background:"#3dff8a", easing:STEP}, {offset:.7, width:"55%", background:c.color}, {offset:1, width:"55%", background:c.color}], easing:"ease-out"}]}));
  R("buffering", "버퍼링 점", {poster:.2, d:{duration:1200, color:"#ffffff"}}, c => ({layers:[0, 1, 2].map(i => ({css:`left:${42 + i*8}%;top:50%;width:${f2(6*c.I)}px;aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:${c.color}`,
    kf:[{offset:0, opacity:.25, transform:"scale(.8)"}, {offset:.2, opacity:1, transform:"scale(1.2)"}, {offset:.4, opacity:.25, transform:"scale(.8)"}, {offset:1, opacity:.25, transform:"scale(.8)"}], at:i * .15, easing:"ease-in-out"}))}));
  R("timeoutPie", "시간 초과", {poster:.6, d:{duration:3000}}, c => ({layers:[{css:`${centered(30)};border-radius:50%;border:2px solid ${c.color};background:conic-gradient(${hexA(c.color,.6)} var(${"--vfx-a"}),transparent 0)`,
    kf:[{"--vfx-a":"0deg"}, {"--vfx-a":"360deg"}], easing:"linear"}]}));

  /* 시스템 화면 */
  R("terminalError", "터미널 오류", {poster:.9, d:{duration:3000}}, c => ({layers:[
    ...Array.from({length:6}, (_, i) => ({css:`left:6%;top:${8 + i*12}%;height:5%;width:${f2(25 + c.rnd()*55)}%;border-radius:2px;background:${i === 5 ? c.color : hexA("#c8d0d8",.7)};opacity:0`,
      kf:[{offset:0, opacity:0, easing:STEP}, {offset:f2(.1 + i*.12), opacity:1, easing:STEP}, {offset:1, opacity:1}]})),
    {css:`left:6%;top:${8 + 6*12}%;width:3%;height:6%;background:${c.color}`, kf:flicker([[0, .1], [.2, .3], [.4, .5], [.6, .7], [.8, .9]], {opacity:1}, {opacity:0})}]}));
  R("blueScreen", "블루스크린", {poster:.5, d:{duration:4000, color:"#1f4fd8"}}, c => ({layers:[
    {css:`inset:0;background:${c.color}`, kf:[{offset:0, opacity:0, easing:STEP}, {offset:.1, opacity:f2(clamp(.92*c.I,0,1)), easing:STEP}, {offset:1, opacity:f2(clamp(.92*c.I,0,1))}]},
    ...[[10, 12, 18], [10, 36, 70], [10, 46, 60], [10, 56, 50], [10, 76, 30]].map(([x, y, w], i) => ({css:`left:${x}%;top:${y}%;width:${w}%;height:${i ? 4 : 14}%;background:rgba(255,255,255,.85);border-radius:2px`,
      kf:[{offset:0, opacity:0, easing:STEP}, {offset:f2(.15 + i*.05), opacity:1, easing:STEP}, {offset:1, opacity:1}]}))]}));
  R("colorBars", "컬러 바", {poster:.3, color:false, d:{duration:2400}}, c => ({layers:[{css:"inset:0;background:linear-gradient(90deg,#c0c0c0 0 14.3%,#c0c000 0 28.6%,#00c0c0 0 42.9%,#00c000 0 57.2%,#c000c0 0 71.5%,#c00000 0 85.8%,#0000c0 0)",
    kf:[[0,1],[.4,1],[.41,.6],[.43,1],[.8,1],[.81,.4],[.82,1],[1,1]].map(([o, v]) => ({offset:o, opacity:f2(v*clamp(c.I,0,1)), easing:STEP}))}]}));
  R("noSignal", "신호 없음", {poster:.3, d:{duration:500, color:"#ffffff"}}, c => ({layers:[
    {css:`inset:0;background-color:#111;background-image:${NOISE};opacity:${f2(clamp(.85*c.I,0,1))}`, kf:Array.from({length:5}, (_, i) => ({offset:f2(i/4), easing:STEP, backgroundPosition:`${Math.round(c.rnd()*140)}px ${Math.round(c.rnd()*140)}px`}))},
    {css:`left:25%;right:25%;top:44%;height:12%;background:#000;border:1px solid ${c.color}`, kf:null},
    {css:`left:30%;right:30%;top:48%;height:4%;background:${c.color}`, kf:seq([1, .3, 1], v => ({opacity:v}))}]}));
  R("deadPixels", "불량 화소", {poster:.3, density:true, d:{duration:3000, color:"#ff2df0"}}, c => ({layers:Array.from({length:Math.round(6 + 6*c.D)}, () => {
    const col = [c.color, "#00ff66", "#ffffff", "#000000"][Math.floor(c.rnd()*4)];
    return {css:`left:${f2(c.rnd()*96)}%;top:${f2(c.rnd()*96)}%;width:${c.rnd() < .7 ? 2 : 4}px;height:${c.rnd() < .7 ? 2 : 4}px;background:${col}`, kf:flicker(windows(c.rnd, 1, .3, .05), {opacity:1}, {opacity:.85})};
  })}));
  R("burnIn", "화면 잔상", {poster:.3, d:{duration:5000, color:"#9aff9a"}}, c => ({layers:[{css:`inset:6%;border-radius:inherit;border:2px solid ${hexA(c.color,.25*c.I)};box-shadow:inset 0 0 0 1px ${hexA(c.color,.1)};translate:6px 4px`,
    kf:seq([.5, .8, .4, .5], v => ({opacity:v})), easing:"ease-in-out"}]}));
  R("bsodLines", "체크섬 행 점멸", {poster:.3, d:{duration:1000, color:"#ffd23d"}}, c => ({layers:Array.from({length:5}, (_, r) => ({
    css:`left:8%;right:8%;top:${15 + r*15}%;height:6%;background:repeating-linear-gradient(90deg,${hexA(c.color,.8)} 0 6px,transparent 6px 9px);background-size:${f2(9 + r*3)}px 100%`,
    kf:Array.from({length:5}, (_, i) => ({offset:f2(i/4), easing:STEP, opacity:i % 2 ? .3 : 1, backgroundPosition:`${Math.round(c.rnd()*40)}px 0px`}))}))}));
  R("memoryLeak", "메모리 누수", {poster:.6, d:{duration:4000, color:"#ff7a2f"}}, c => ({layers:Array.from({length:7}, (_, i) => ({
    css:`left:${8 + i*13}%;top:0;width:6%;height:0%;border-radius:0 0 4px 4px;background:linear-gradient(to bottom,${hexA(c.color,.85)},${hexA(c.color,.3)})`,
    kf:[{height:"0%"}, {height:`${f2(30 + c.rnd()*60)}%`}], easing:"ease-in", dur:.7 + c.rnd()*.3}))}));
  R("stackOverflow", "스택 넘침", {poster:.7, d:{duration:3000, color:"#ffb020"}}, c => ({layers:Array.from({length:8}, (_, i) => ({
    css:`left:20%;right:20%;bottom:${f2(i*11.5)}%;height:10%;background:${i > 5 ? c.color : hexA(c.color,.45)};border:1px solid ${c.color}`,
    kf:[{offset:0, opacity:0, transform:"translateY(-60%)", easing:STEP}, {offset:f2(.08 + i*.1), opacity:1, transform:"translateY(0%)", easing:STEP}, {offset:.95, opacity:1, transform:"translateY(0%)"}, {offset:1, opacity:0, transform:"translateY(0%)"}]}))}));
  R("badSectors", "배드 섹터", {poster:.6, density:true, d:{duration:2400}}, c => ({layers:[
    {css:`inset:0;background-image:linear-gradient(${hexA("#ffffff",.15)} 1px,transparent 1px),linear-gradient(90deg,${hexA("#ffffff",.15)} 1px,transparent 1px);background-size:10% 12.5%`, kf:null},
    ...Array.from({length:Math.round(5 + 4*c.D)}, () => ({css:`left:${Math.floor(c.rnd()*10)*10}%;top:${Math.floor(c.rnd()*8)*12.5}%;width:10%;height:12.5%;background:${hexA(c.color,.7)}`,
      kf:[{offset:0, opacity:0, easing:STEP}, {offset:f2(.1 + c.rnd()*.7), opacity:1, easing:STEP}, {offset:1, opacity:1}]}))]}));
  R("voidHole", "공백 구멍", {poster:.5, d:{duration:3000, color:"#ff2d3d"}}, c => ({layers:[
    {css:`${centered(50)};border-radius:50%;background:radial-gradient(closest-side,#000 55%,${hexA(c.color,.6)} 70%,transparent)`, kf:seq([.3, 1 + .3*c.I, .3], v => ({transform:`scale(${f2(v)})`})), easing:"ease-in-out"},
    {css:`${centered(50)};border-radius:50%;background-image:${NOISE};-webkit-mask:radial-gradient(closest-side,transparent 55%,#000 62%,transparent 75%);mask:radial-gradient(closest-side,transparent 55%,#000 62%,transparent 75%)`,
      kf:seq([.3, 1 + .3*c.I, .3], v => ({transform:`scale(${f2(v)}) rotate(${f2(v*90)}deg)`})), easing:"ease-in-out"}]}));

  /* 신호 이상 */
  R("rollingBlack", "검은 띠 굴러감", {poster:.3, d:{duration:2200, color:"#000000"}}, c => ({layers:[{css:`left:0;right:0;top:0;height:22%;background:linear-gradient(to bottom,transparent,${hexA(c.color,.8*Math.min(c.I,1.2))} 30%,${hexA(c.color,.8*Math.min(c.I,1.2))} 70%,transparent)`,
    kf:[{transform:"translateY(-100%)"}, {transform:"translateY(460%)"}], easing:"linear"}]}));
  R("radioNoise", "전파 간섭", {poster:.3, d:{duration:400, color:"#ffffff"}}, c => ({layers:Array.from({length:6}, () => ({
    css:`left:0;right:0;top:${f2(c.rnd()*100)}%;height:${f2(1 + c.rnd()*2)}px;background:${hexA(c.color,.5 + c.rnd()*.4)}`,
    kf:Array.from({length:4}, (_, i) => ({offset:f2(i/3), easing:STEP, top:`${f2(c.rnd()*100)}%`, opacity:f2(.3 + c.rnd()*.7)}))}))}));
  R("desync", "수평 동기 이탈", {poster:.3, d:{duration:900}}, c => ({layers:[], self:{kf:[[0,0],[.3,0],[.32,8],[.36,-5],[.4,0],[.7,0],[.72,-10],[.75,4],[.78,0],[1,0]].map(([o, x]) => ({offset:o, easing:STEP,
    transform:c.T(`skewX(${f2(x*.8*c.I)}deg) translateX(${f2(x*c.I)}px)`), clipPath:x ? `inset(${Math.round(c.rnd()*40)}% 0% ${Math.round(c.rnd()*40)}% 0%)` : "inset(0% 0% 0% 0%)"}))}}));
  R("corruptBlocks", "손상 블록", {poster:.12, density:true, d:{duration:1400, color:"#ff2df0"}}, c => ({layers:Array.from({length:Math.round(6 + 5*c.D)}, (_, i) => {
    const col = [c.color, "#7a7a7a", "#2df0ff", "#3a3a3a"][Math.floor(c.rnd()*4)];
    return {css:`left:${f2(c.rnd()*80)}%;top:${f2(c.rnd()*85)}%;width:${f2(10 + c.rnd()*25)}%;height:${f2(4 + c.rnd()*12)}%;background:${col};opacity:0`, kf:flicker(windows(c.rnd, 2, .15, i % 2 ? undefined : .05), {opacity:1}, {opacity:0})};
  })}));
  R("packetLoss", "패킷 손실", {poster:.12, density:true, d:{duration:1600, color:"#000000"}}, c => ({layers:Array.from({length:Math.round(8 + 6*c.D)}, (_, i) => ({
    css:`left:${Math.floor(c.rnd()*12)*8.33}%;top:${Math.floor(c.rnd()*8)*12.5}%;width:8.4%;height:12.6%;background:${c.color};opacity:0`, kf:flicker(windows(c.rnd, 2, .2, i % 2 ? undefined : .05), {opacity:1}, {opacity:0})}))}));
  R("redScan", "빨간 스캔", {poster:.3, d:{duration:900}}, c => ({layers:[{css:`left:0;right:0;top:0;height:2px;background:${c.color};box-shadow:0 0 10px 2px ${hexA(c.color,.7)}`,
    kf:[{top:"0%", opacity:1}, {top:"100%", opacity:.6}], easing:"ease-in"}]}));
  R("alarmBeacon", "경광등", {poster:.2, d:{duration:1200}}, c => ({layers:[{css:`${centered(200)};border-radius:50%;mix-blend-mode:screen;background:conic-gradient(${hexA(c.color,.6*Math.min(c.I,1.5))},transparent 50deg,transparent 180deg,${hexA(c.color,.6*Math.min(c.I,1.5))} 180deg,transparent 230deg)`,
    kf:[{transform:"rotate(0deg)"}, {transform:"rotate(360deg)"}], easing:"linear"}]}));
  R("hazardFrame", "위험 테두리", {clip:false, poster:.3, d:{duration:800, color:"#ffcc00"}}, c => ({layers:[{css:`inset:-8px;border-radius:inherit;${ringMask(8)};background:repeating-linear-gradient(-45deg,${c.color} 0 8px,#111 8px 16px)`,
    kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"22.63px 0px"}], easing:"linear"}]}));
  R("cautionTape", "출입 금지 테이프", {poster:.3, d:{duration:2000, color:"#ffcc00"}}, c => ({layers:[{css:`left:-20%;right:-20%;top:42%;height:16%;transform:rotate(-12deg);background:repeating-linear-gradient(-45deg,${c.color} 0 12px,#111 12px 24px);box-shadow:0 2px 6px rgba(0,0,0,.5)`,
    kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"67.88px 0px"}], easing:"linear"}]}));
  R("criticalVignette", "붉은 비네트", {poster:.5, d:{duration:1400}}, c => ({layers:[{css:"inset:0;border-radius:inherit",
    kf:seq([0, 1, 0], v => ({boxShadow:`inset 0 0 ${f2(10 + 40*v*c.I)}px ${f2(4*v*c.I)}px ${hexA(c.color,.3 + .5*v)}`})), easing:"ease-in-out"}]}));
  R("posterize", "색 단계 붕괴", {poster:.3, d:{duration:1200}}, c => ({layers:[], self:{kf:[0, 40, 0, -60, 0, 120, 0].map((h, i, a) => ({offset:f2(i/(a.length - 1)), easing:STEP, filter:`hue-rotate(${f2(h*c.I)}deg) contrast(${h ? f2(1 + .6*c.I) : 1}) saturate(${h ? f2(1 + c.I) : 1})`}))}}));

  /* 요소 자체가 고장 나는 효과 */
  R("errorShake", "오류 흔들림", {poster:null, d:{duration:700, iterations:1}}, c => ({layers:[{css:`inset:0;border-radius:inherit;background:${hexA(c.color,.35)};opacity:0`,
    kf:[{opacity:1}, {opacity:0}], easing:"ease-out"}], self:{kf:shake(c, 8, 10)}}));
  R("accessDenied", "접근 거부", {poster:null, d:{duration:900, iterations:1}}, c => ({layers:[{css:`inset:-2px;border-radius:inherit;border:2px solid ${c.color};box-shadow:0 0 12px ${hexA(c.color,.8)};opacity:0`,
    kf:[{opacity:1}, {opacity:1}, {opacity:0}], easing:"ease-out"}], self:{kf:shake(c, 6, 14), easing:"ease-out"}}));
  R("frozenFrame", "화면 멈춤", {poster:null, d:{duration:2000}}, c => ({layers:[], self:{kf:[[0,0,1],[.4,0,1],[.41,3,.5],[.7,3,.5],[.71,0,1],[1,0,1]].map(([o, x, s]) => ({offset:o, easing:STEP, transform:c.T(`translateY(${f2(x*c.I)}px)`), filter:`saturate(${s}) brightness(${s < 1 ? 1.2 : 1})`}))}}));
  R("overheat", "과열", {poster:.5, d:{duration:1800, color:"#ff5a1f"}}, c => ({layers:[{css:`left:0;right:0;bottom:0;height:60%;background:linear-gradient(to top,${hexA(c.color,.45*c.I)},transparent)`,
    kf:seq([.5, 1, .5], v => ({opacity:v, transform:`scaleY(${f2(.8 + .2*v)})`})), easing:"ease-in-out"}], self:{easing:"ease-in-out", kf:seq([0, 1, 0], v => ({filter:`sepia(${f2(.4*v*c.I)}) saturate(${f2(1 + v*c.I)}) hue-rotate(${f2(-15*v)}deg)`}))}}));
  R("voltageDrop", "전압 저하", {poster:null, d:{duration:2200}}, c => ({layers:[], self:{kf:[[0,1],[.3,1],[.32,.4],[.34,.9],[.36,.3],[.4,1],[.75,1],[.77,.5],[.8,1],[1,1]].map(([o, v]) => ({offset:o, easing:STEP, filter:`brightness(${f2(1 - (1 - v)*clamp(c.I, 0, 1.2))})`}))}}));
  R("crtOff", "CRT 꺼짐", {poster:null, d:{duration:1000, iterations:1, color:"#ffffff"}}, c => ({layers:[{css:`left:0;right:0;top:50%;height:2px;translate:0 -50%;background:${c.color};box-shadow:0 0 12px ${c.color};opacity:0`,
    kf:[{offset:0, opacity:0, transform:"scaleX(1)"}, {offset:.45, opacity:0, transform:"scaleX(1)"}, {offset:.5, opacity:1, transform:"scaleX(1)"}, {offset:.85, opacity:1, transform:"scaleX(.02)"}, {offset:1, opacity:0, transform:"scaleX(0)"}], easing:"ease-in"}],
    self:{fill:"forwards", easing:"ease-in", kf:[{offset:0, transform:c.T("scale(1, 1)"), filter:"brightness(1)", opacity:c.op}, {offset:.5, transform:c.T("scale(1, .01)"), filter:"brightness(3)", opacity:c.op}, {offset:.51, opacity:0, transform:c.T("scale(1, .01)"), filter:"brightness(3)"}, {offset:1, opacity:0, transform:c.T("scale(1, .01)"), filter:"brightness(3)"}]}}));
  R("crtOn", "CRT 켜짐", {poster:null, d:{duration:1000, iterations:1, color:"#ffffff"}}, c => ({layers:[{css:`left:0;right:0;top:50%;height:2px;translate:0 -50%;background:${c.color};box-shadow:0 0 12px ${c.color};opacity:0`,
    kf:[{offset:0, opacity:1, transform:"scaleX(0)"}, {offset:.3, opacity:1, transform:"scaleX(1)"}, {offset:.5, opacity:0, transform:"scaleX(1)"}, {offset:1, opacity:0, transform:"scaleX(1)"}], easing:"ease-out"}],
    self:{fill:"backwards", easing:"ease-out", kf:[{offset:0, opacity:0, transform:c.T("scale(1, .01)"), filter:"brightness(3)"}, {offset:.3, opacity:0, transform:c.T("scale(1, .01)"), filter:"brightness(3)"}, {offset:.31, opacity:c.op, transform:c.T("scale(1, .01)"), filter:"brightness(3)"}, {offset:1, opacity:c.op, transform:c.T("scale(1, 1)"), filter:"brightness(1)"}]}}));
}
