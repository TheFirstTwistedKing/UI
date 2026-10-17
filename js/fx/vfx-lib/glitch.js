/* 글리치 36종: RGB 분리·띠·요소 왜곡·신호 고장 */
import { f2, hexA, clamp, STEP, flicker, windows, seq, NOISE } from "../vfx-util.js";

export function glitchEffects(def){
  const G = (id, name, o, make) => def("글리치", id, name, {poster:.11, ...o, d:{duration:1200, iterations:0, ...o.d}}, make);
  const f3 = v => +(+v).toFixed(3);
  const sign = c => c.rnd() < .5 ? -1 : 1;
  // 평소엔 neutral, 글리치 구간마다 gen()이 만든 두 프레임을 계단식으로 끼운다
  const bursts = (wins, gen, neutral) => {
    const k = [{offset:0, ...neutral, easing:STEP}];
    for(const [a, b] of wins){ k.push({offset:f3(a), ...gen(), easing:STEP}, {offset:f3((a + b) / 2), ...gen(), easing:STEP}, {offset:f3(b), ...neutral, easing:STEP}); }
    k.push({offset:1, ...neutral});
    return k;
  };
  const self = (c, n, len, gen, neutral) => ({layers:[], self:{kf:bursts(windows(c.rnd, n, len), gen, neutral)}});
  const shadow = (x, y, a = .85) => `drop-shadow(${f2(x)}px ${f2(y)}px 0 rgba(255,0,70,${a})) drop-shadow(${f2(-x)}px ${f2(-y)}px 0 rgba(0,240,255,${a}))`;
  const NO_SHADOW = shadow(0, 0);
  // 가로 띠: 위치·두께·이동량·색을 정해 깜빡이게
  const bands = (c, n, o) => Array.from({length:n}, (_, i) => {
    const y = f2(c.rnd() * (100 - o.h[1])), h = f2(o.h[0] + c.rnd() * (o.h[1] - o.h[0])), dx = f2((c.rnd() - .5) * o.dx * c.I);
    return {css:`left:0;right:0;top:${y}%;height:${h}%;background:${o.bg(i)};${o.blend ? `mix-blend-mode:${o.blend};` : ""}opacity:0`,
      kf:flicker(windows(c.rnd, o.n || 2, o.len || .06, i % 2 ? undefined : .1), {opacity:1, transform:`translateX(${dx}%)`}, {opacity:0, transform:"translateX(0%)"})};
  });

  /* RGB 분리 변형 (요소 자체) */
  G("rgbSplitV", "세로 RGB 분리", {}, c => self(c, 4, .07, () => ({filter:shadow(0, (1.5 + c.rnd()*4) * c.I * sign(c))}), {filter:NO_SHADOW}));
  G("rgbSplitDiag", "대각 RGB 분리", {}, c => self(c, 4, .07, () => { const v = (1.5 + c.rnd()*3.5) * c.I * sign(c); return {filter:shadow(v, v)}; }, {filter:NO_SHADOW}));
  G("rgbSplitWide", "넓은 RGB 분리", {d:{duration:1600}}, c => self(c, 3, .1, () => ({filter:shadow((6 + c.rnd()*8) * c.I * sign(c), 0, .7)}), {filter:NO_SHADOW}));
  G("rgbSubtle", "은은한 색수차", {d:{duration:2600}}, c => ({layers:[], self:{easing:"ease-in-out",
    kf:seq([0, 1, -.6, .8, 0], v => ({filter:shadow(v * 1.2 * c.I, v * .4 * c.I, .5)}))}}));
  G("rgbBurst", "RGB 폭발", {d:{duration:2000}}, c => ({layers:[], self:{kf:[[0,0],[.42,0],[.43,9],[.45,-6],[.47,3],[.49,0],[1,0]].map(([o, x]) => ({offset:o, easing:STEP, filter:shadow(x * c.I, 0)}))}}));

  /* 띠 어긋남 변형 */
  G("sliceThin", "가는 띠 글리치", {clip:true, color:true, density:true, d:{color:"#00f0ff"}}, c => ({layers:bands(c, Math.round(8 + 6*c.D), {h:[.6, 2], dx:30, n:3, len:.04, blend:"screen", bg:i => hexA(i % 3 ? c.color : "#ff2fd2", .6)})}));
  G("sliceThick", "굵은 띠 글리치", {clip:true, color:true, density:true, d:{color:"#ff2fd2", duration:1500}}, c => ({layers:bands(c, Math.round(2 + 2*c.D), {h:[12, 26], dx:20, len:.08, blend:"screen", bg:i => hexA(i % 2 ? "#00f0ff" : c.color, .35)})}));
  G("sliceVertical", "세로 띠 글리치", {clip:true, color:true, density:true, d:{color:"#7dff9a"}}, c => ({layers:Array.from({length:Math.round(4 + 3*c.D)}, (_, i) => {
    const x = f2(c.rnd()*92), w = f2(2 + c.rnd()*8), dy = f2((c.rnd() - .5) * 24 * c.I);
    return {css:`top:0;bottom:0;left:${x}%;width:${w}%;background:${hexA(i % 2 ? "#ffffff" : c.color, .45)};mix-blend-mode:screen;opacity:0`,
      kf:flicker(windows(c.rnd, 2, .07, i % 2 ? undefined : .1), {opacity:1, transform:`translateY(${dy}%)`}, {opacity:0, transform:"translateY(0%)"})};
  })}));
  G("sliceWhite", "흰 띠 섬광", {clip:true, density:true}, c => ({layers:bands(c, Math.round(3 + 3*c.D), {h:[1, 6], dx:16, len:.05, bg:() => `rgba(255,255,255,${f2(clamp(.75*c.I,0,1))})`})}));
  G("sliceBlack", "검은 띠 끊김", {clip:true, density:true}, c => ({layers:bands(c, Math.round(3 + 3*c.D), {h:[3, 12], dx:8, len:.07, bg:() => `rgba(0,0,0,${f2(clamp(.85*c.I,0,1))})`})}));

  /* 요소 왜곡 */
  const T0 = c => ({transform:c.T("translate(0%, 0%)")});
  G("jumpCut", "점프 컷", {}, c => self(c, 4, .06, () => ({transform:c.T(`translate(${f2((c.rnd() - .5) * 10 * c.I)}%, ${f2((c.rnd() - .5) * 6 * c.I)}%)`)}), T0(c)));
  G("squashGlitch", "찌그러짐 글리치", {}, c => self(c, 3, .07, () => ({transform:c.T(`scale(${f2(1 + (c.rnd() - .3) * .3 * c.I)}, ${f2(1 - (c.rnd() - .3) * .3 * c.I)})`)}), {transform:c.T("scale(1, 1)")}));
  G("skewGlitch", "기울기 글리치", {}, c => self(c, 4, .06, () => ({transform:c.T(`skewX(${f2((c.rnd() - .5) * 30 * c.I)}deg)`)}), {transform:c.T("skewX(0deg)")}));
  G("hueGlitch", "색조 글리치", {}, c => self(c, 4, .07, () => ({filter:`hue-rotate(${Math.round(60 + c.rnd()*240)}deg) saturate(${f2(1 + c.I)})`}), {filter:"hue-rotate(0deg) saturate(1)"}));
  G("invertGlitch", "반전 글리치", {}, c => self(c, 3, .05, () => ({filter:`invert(${f2(clamp(.7 + .3*c.rnd(), 0, 1))})`}), {filter:"invert(0)"}));
  G("contrastCrush", "대비 붕괴", {}, c => self(c, 3, .08, () => ({filter:`contrast(${f2(2 + 3*c.I*c.rnd())}) brightness(${f2(.7 + c.rnd()*.8)})`}), {filter:"contrast(1) brightness(1)"}));
  G("mirrorFlip", "좌우 반전 순간", {d:{duration:1800}}, c => self(c, 2, .05, () => ({transform:c.T("scaleX(-1)")}), {transform:c.T("scaleX(1)")}));
  G("rotateGlitch", "회전 튐", {}, c => self(c, 4, .06, () => ({transform:c.T(`rotate(${f2((c.rnd() - .5) * 14 * c.I)}deg)`)}), {transform:c.T("rotate(0deg)")}));
  G("zoomGlitch", "확대 튐", {}, c => self(c, 4, .06, () => ({transform:c.T(`scale(${f2(1 + (c.rnd() * .25 - .05) * c.I)})`)}), {transform:c.T("scale(1)")}));
  G("clipShuffle", "잘림 섞기", {}, c => self(c, 4, .07, () => {
    const t = Math.round(c.rnd()*40), b = Math.round(c.rnd()*40);
    return {clipPath:`inset(${t}% 0% ${b}% 0%)`, transform:c.T(`translateX(${f2((c.rnd() - .5) * 8 * c.I)}%)`)};
  }, {clipPath:"inset(0% 0% 0% 0%)", ...T0(c)}));
  G("stutter", "프레임 끊김", {d:{duration:1000}}, c => self(c, 5, .05, () => ({opacity:f2(c.op * (.15 + c.rnd()*.4)), transform:c.T(`translate(0%, ${f2((c.rnd() - .5) * 4 * c.I)}%)`)}), {opacity:c.op, ...T0(c)}));
  G("ghostDouble", "잔상 겹침", {d:{duration:2200}}, c => ({layers:[], self:{easing:"ease-in-out",
    kf:seq([0, 1, .3, -.8, 0], v => ({filter:`drop-shadow(${f2(v * 8 * c.I)}px 0 ${f2(Math.abs(v) * 2)}px rgba(255,255,255,.45))`}))}}));
  G("waveDistort", "물결 왜곡", {d:{duration:1600}}, c => ({layers:[], self:{easing:"ease-in-out",
    kf:seq([0, 1, 0, -1, 0], v => ({transform:c.T(`skewX(${f2(v * 6 * c.I)}deg) translateX(${f2(-v * 2 * c.I)}%) scaleY(${f2(1 + Math.abs(v) * .03 * c.I)})`)}))}}));
  G("glitchIn", "글리치 등장", {poster:null, d:{duration:900, iterations:1}}, c => ({layers:[], self:{fill:"backwards",
    kf:[[0,0,12,8],[.15,.6,-9,0],[.25,0,6,5],[.4,.8,-4,0],[.5,.3,3,3],[.65,1,-2,0],[.8,.8,1,1.5],[1,1,0,0]].map(([o, a, x, s]) =>
      ({offset:o, easing:STEP, opacity:f2(c.op * a), transform:c.T(`translateX(${f2(x * c.I)}%)`), filter:shadow(s * c.I, 0)}))}}));
  G("glitchOut", "글리치 퇴장", {poster:null, d:{duration:900, iterations:1}}, c => ({layers:[], self:{fill:"forwards",
    kf:[[0,1,0,0],[.2,.8,-1,1.5],[.35,1,2,0],[.5,.3,-3,3],[.6,.8,4,0],[.75,0,-6,5],[.85,.6,9,0],[1,0,12,8]].map(([o, a, x, s]) =>
      ({offset:o, easing:STEP, opacity:f2(c.op * a), transform:c.T(`translateX(${f2(x * c.I)}%)`), filter:shadow(s * c.I, 0)}))}}));

  /* 레이어 글리치 */
  G("pixelSort", "픽셀 정렬", {clip:true, color:true, density:true, d:{color:"#ffd27a"}}, c => ({layers:Array.from({length:Math.round(6 + 6*c.D)}, (_, i) => {
    const x = f2(c.rnd()*96), y = f2(c.rnd()*60), h = f2(15 + c.rnd()*40 * c.I);
    return {css:`left:${x}%;top:${y}%;width:${f2(1 + c.rnd()*3)}%;height:${h}%;transform-origin:50% 0%;background:linear-gradient(to bottom,${hexA(i % 3 ? c.color : "#ffffff", .8)},transparent);opacity:0`,
      kf:flicker(windows(c.rnd, 2, .1, i % 2 ? undefined : .08), {opacity:1, transform:"scaleY(1)"}, {opacity:0, transform:"scaleY(.2)"})};
  })}));
  G("datamosh", "데이터모시", {clip:true, density:true, d:{duration:2400}}, c => ({layers:Array.from({length:Math.round(3 + 2*c.D)}, (_, i) => {
    const hue = Math.round(c.rnd()*360), dx = f2((c.rnd() - .5) * 30 * c.I), dy = f2((c.rnd() - .5) * 20 * c.I);
    return {css:`left:${f2(c.rnd()*60)}%;top:${f2(c.rnd()*70)}%;width:${f2(25 + c.rnd()*35)}%;height:${f2(14 + c.rnd()*26)}%;background:linear-gradient(90deg,hsla(${hue},90%,60%,.55),hsla(${(hue + 90) % 360},90%,50%,.25));filter:blur(2px);mix-blend-mode:difference;opacity:0`,
      kf:[{offset:0, opacity:0, transform:"translate(0%, 0%) scaleX(1)"}, {offset:.1, opacity:1, transform:"translate(0%, 0%) scaleX(1)"}, {offset:.45, opacity:.8, transform:`translate(${dx}%, ${dy}%) scaleX(1.6)`}, {offset:.6, opacity:0, transform:`translate(${dx}%, ${dy}%) scaleX(2)`}, {offset:1, opacity:0, transform:"translate(0%, 0%) scaleX(1)"}],
      at:i * .12, easing:"ease-in-out"};
  })}));
  G("vhsTracking", "VHS 트래킹", {clip:true, poster:.3, d:{duration:2600}}, c => ({layers:[
    {css:`left:0;right:0;top:0;height:${f2(10 + 6*c.I)}%;background-image:${NOISE};background-size:140px 40px;opacity:${f2(clamp(.6*c.I,0,1))};mix-blend-mode:screen`,
      kf:[{offset:0, top:"-15%", backgroundPosition:"0px 0px"}, {offset:1, top:"105%", backgroundPosition:"140px 0px"}], easing:"linear"},
    {css:`left:0;right:0;top:0;height:1.5%;background:rgba(255,255,255,${f2(clamp(.5*c.I,0,1))})`, kf:[{top:"-10%"}, {top:"110%"}], easing:"linear"}]}));
  G("scanlineJitter", "스캔라인 떨림", {clip:true, color:true, d:{duration:700, color:"#ffffff"}}, c => ({layers:[{css:`inset:0;background:repeating-linear-gradient(to bottom,${hexA(c.color,.16*c.I)} 0 1px,transparent 1px 3px)`,
    kf:Array.from({length:9}, (_, i) => ({offset:f2(i/8), easing:STEP, backgroundPosition:`${i % 8 ? Math.round((c.rnd() - .5) * 8 * c.I) : 0}px ${i % 8 ? Math.round(c.rnd()*3) : 0}px`, transform:`translateX(${i % 8 ? f2((c.rnd() - .5) * 2 * c.I) : 0}%)`}))}]}));
  G("chromaticFringe", "색 번짐 테두리", {poster:.25, d:{duration:1800}}, c => ({layers:[["rgba(255,0,70,.7)", 1], ["rgba(0,240,255,.7)", -1]].map(([col, s]) => ({css:`inset:0;border-radius:inherit;border:1.5px solid ${col};mix-blend-mode:screen`,
    kf:seq([0, 1, .4, 1, 0], v => ({transform:`translate(${f2(s * v * 3 * c.I)}px, ${f2(-s * v * c.I)}px)`})), easing:"ease-in-out"}))}));
  G("interlaceShift", "인터레이스 어긋남", {clip:true, color:true, d:{duration:900, color:"#7df9ff"}}, c => ({layers:[0, 1].map(k => {
    const col = hexA(c.color, .22*c.I), stops = k ? `transparent 0 2px,${col} 2px 3px,transparent 3px 4px` : `${col} 0 1px,transparent 1px 4px`;
    return {css:`inset:0;background:repeating-linear-gradient(to bottom,${stops});opacity:0`,
      kf:flicker(windows(c.rnd, 3, .07, k ? undefined : .1), {opacity:1, transform:`translateX(${f2((k ? -1 : 1) * 4 * c.I)}%)`}, {opacity:0, transform:"translateX(0%)"})};
  })}));
  G("mosaicCrush", "모자이크 붕괴", {clip:true, d:{duration:1400}}, c => ({layers:[{css:`inset:0;border-radius:inherit;background-image:linear-gradient(45deg,rgba(255,255,255,.18) 25%,transparent 25% 75%,rgba(255,255,255,.18) 75%),linear-gradient(45deg,rgba(0,0,0,.25) 25%,transparent 25% 75%,rgba(0,0,0,.25) 75%);opacity:0`,
    kf:bursts(windows(c.rnd, 3, .08, .1), () => { const s = Math.round(6 + c.rnd()*18 * c.I); return {opacity:1, backgroundSize:`${s}px ${s}px`, backgroundPosition:`0px 0px, ${Math.round(s/2)}px ${Math.round(s/2)}px`}; }, {opacity:0, backgroundSize:"8px 8px", backgroundPosition:"0px 0px, 4px 4px"})}]}));
  G("noiseBars", "잡음 띠", {clip:true, density:true, d:{duration:1000}}, c => ({layers:bands(c, Math.round(3 + 2*c.D), {h:[4, 14], dx:6, len:.08, blend:"screen", bg:() => `${NOISE} 0 0/140px 140px`})}));
  G("signalDropout", "신호 끊김", {clip:true, d:{duration:2500}}, c => ({layers:[
    {css:`inset:0;border-radius:inherit;background:#000;opacity:0`, kf:flicker([[.1, .14], [.62, .65]], {opacity:f2(clamp(.9*c.I,0,1))}, {opacity:0})},
    {css:`inset:0;border-radius:inherit;background-image:${NOISE};opacity:0`, kf:flicker([[.14, .17], [.65, .67]], {opacity:f2(clamp(.7*c.I,0,1))}, {opacity:0})},
    {css:`left:0;right:0;top:49%;height:2%;background:#fff;opacity:0`, kf:flicker([[.1, .12], [.62, .63]], {opacity:1}, {opacity:0})}]}));
  G("colorLayerShift", "색 레이어 어긋남", {clip:true, d:{duration:1300}}, c => ({layers:["rgba(255,0,60,.28)", "rgba(0,255,120,.22)", "rgba(40,90,255,.28)"].map((col, i) => ({css:`inset:0;border-radius:inherit;background:${col};mix-blend-mode:screen;opacity:0`,
    kf:bursts(windows(c.rnd, 3, .07, i ? undefined : .1), () => ({opacity:1, transform:`translate(${f2((c.rnd() - .5) * 12 * c.I)}%, ${f2((c.rnd() - .5) * 6 * c.I)}%)`}), {opacity:0, transform:"translate(0%, 0%)"})}))}));
  G("verticalRoll", "화면 말림", {clip:true, poster:.25, d:{duration:2200}}, c => ({layers:[{css:`left:0;right:0;top:0;height:${f2(8 + 6*c.I)}%;background:linear-gradient(to bottom,rgba(255,255,255,.35),#000 18%,#000 82%,rgba(255,255,255,.2))`,
    kf:[{offset:0, transform:"translateY(-110%)"}, {offset:.6, transform:"translateY(1150%)"}, {offset:1, transform:"translateY(1150%)"}], easing:"linear"}]}));
  G("bitcrush", "비트 압축", {clip:true, d:{duration:1300}}, c => ({layers:[{css:`inset:0;border-radius:inherit;background:repeating-linear-gradient(90deg,rgba(0,0,0,.35) 0 1px,transparent 1px 5px),repeating-linear-gradient(0deg,rgba(0,0,0,.35) 0 1px,transparent 1px 5px);opacity:0`,
    kf:flicker(windows(c.rnd, 3, .1, .1), {opacity:1}, {opacity:0})}],
    self:{kf:flicker(windows(c.rnd, 3, .1, .1), {filter:`saturate(${f2(1 + 2*c.I)}) contrast(${f2(1 + .8*c.I)})`}, {filter:"saturate(1) contrast(1)"})}}));
  G("lineGlitch", "튀는 선", {clip:true, color:true, d:{duration:1000, color:"#ffffff"}}, c => ({layers:[{css:`left:0;right:0;top:0;height:${f2(Math.max(1, 2*c.I))}px;background:${c.color};box-shadow:0 0 6px ${hexA(c.color,.8)};opacity:0`,
    kf:bursts(windows(c.rnd, 4, .06, .1), () => ({opacity:1, top:`${Math.round(c.rnd()*98)}%`}), {opacity:0, top:"50%"})}]}));
  G("colorSmear", "색 번짐", {clip:true, color:true, density:true, d:{duration:1600, color:"#ff2fd2"}}, c => ({layers:Array.from({length:Math.round(3 + 3*c.D)}, (_, i) => {
    const y = f2(c.rnd()*90), h = f2(2 + c.rnd()*6);
    return {css:`left:0;top:${y}%;width:100%;height:${h}%;transform-origin:0% 50%;background:linear-gradient(90deg,${hexA(i % 2 ? "#00f0ff" : c.color, .7)},transparent);filter:blur(1px);opacity:0`,
      kf:flicker(windows(c.rnd, 2, .1, i % 2 ? undefined : .08), {opacity:1, transform:`scaleX(${f2(.4 + c.rnd()*.6)})`}, {opacity:0, transform:"scaleX(0)"})};
  })}));
}
