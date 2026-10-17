/* 애니메이션 라이브러리 확장 (Phase 6).
   presets.js의 기본 26종에 더해 등장·퇴장·강조·반복·색·디지털 애니메이션을 정의한다.
   - 등장 효과는 같은 움직임을 거꾸로 재생하는 퇴장 효과를 짝으로 만든다 (키프레임 순서·offset 반전, 감속 → 가속).
   - 형식은 presets.js와 같다: kf(I, c) → 키프레임 목록. c.T는 기본 회전을 앞에 붙이고, c.op는 기본 불투명도. */

export function extraPresets(EASE, clamp, hexA){
  const out = [];
  const f = v => +(+v).toFixed(2);
  const add = (cat, id, name, d, kf, color) => out.push({id, name, cat, d, kf, ...(color ? {color:true} : {})});
  // 등장(in) 키프레임을 뒤집어 퇴장(out)을 만든다. 구간별 easing은 방향이 바뀌므로 지운다.
  const reverse = kfs => {
    const n = kfs.length, hasOff = kfs.some(k => k.offset !== undefined);
    return kfs.slice().reverse().map((k, i) => {
      const r = {...k}; delete r.easing;
      if(hasOff) r.offset = f(1 - (k.offset ?? (n === 1 ? 1 : (n - 1 - i) / (n - 1))));
      return r;
    });
  };
  const pair = (id, inName, outName, d, kf) => {
    add("등장", id + "In", inName, {duration:700, easing:EASE.out, iterations:1, fill:"both", ...d}, kf);
    add("퇴장", id + "Out", outName, {duration:600, easing:EASE.in, iterations:1, fill:"both", ...d, ...(d.outEasing ? {easing:d.outEasing} : {})}, (I, c) => reverse(kf(I, c)));
  };
  // 시작 방향: [id, 등장 이름(…에서), 퇴장 이름(…로), dx, dy]  — dx, dy는 등장 전 위치 쪽
  const D8 = [["Up","아래에서","아래로",0,1], ["Down","위에서","위로",0,-1], ["Left","오른쪽에서","오른쪽으로",1,0], ["Right","왼쪽에서","왼쪽으로",-1,0],
    ["UpLeft","오른쪽 아래에서","오른쪽 아래로",1,1], ["UpRight","왼쪽 아래에서","왼쪽 아래로",-1,1], ["DownLeft","오른쪽 위에서","오른쪽 위로",1,-1], ["DownRight","왼쪽 위에서","왼쪽 위로",-1,-1]];
  const D4 = D8.slice(0, 4);

  /* ---------- 등장 · 퇴장 ---------- */
  for(const [k, a, b, dx, dy] of D8)
    pair("slide" + k, `${a} 밀려 등장`, `${b} 밀려 퇴장`, {}, (I, c) => [
      {opacity:0, transform:c.T(`translate(${f(dx*60*I)}px, ${f(dy*60*I)}px)`)}, {opacity:c.op, transform:c.T("translate(0px, 0px)")}]);
  for(const [k, a, b, dx, dy] of D4)
    pair("bounce" + k, `${a} 튀어 등장`, `${b} 튀어 퇴장`, {duration:900, easing:"ease-out", outEasing:"ease-in"}, (I, c) =>
      [[0,1,0],[.6,-.12,1],[.75,.05,1],[.9,-.02,1],[1,0,1]].map(([o, p, a]) => ({offset:o, opacity:c.op*a, transform:c.T(`translate(${f(dx*80*I*p)}px, ${f(dy*80*I*p)}px)`)})));
  for(const [k, a, b, dx, dy] of D4)
    pair("zoomFrom" + k, `${a} 커지며 등장`, `${b} 작아지며 퇴장`, {}, (I, c) => [
      {opacity:0, transform:c.T(`translate(${f(dx*120*I)}px, ${f(dy*120*I)}px) scale(${f(clamp(1 - .7*I, 0, 1))})`)}, {opacity:c.op, transform:c.T("translate(0px, 0px) scale(1)")}]);
  for(const [k, a, b, dx, dy] of D4)
    pair("blurSlide" + k, `${a} 흐리게 등장`, `${b} 흐리게 퇴장`, {}, (I, c) => [
      {opacity:0, filter:`blur(${f(10*I)}px)`, transform:c.T(`translate(${f(dx*40*I)}px, ${f(dy*40*I)}px)`)}, {opacity:c.op, filter:"blur(0px)", transform:c.T("translate(0px, 0px)")}]);
  for(const [k, a, b, dx, dy] of D4)
    pair("tilt" + k, `${a} 원근 등장`, `${b} 원근 퇴장`, {duration:800}, (I, c) => [
      {opacity:0, transform:c.T(`perspective(800px) translate(${f(dx*40*I)}px, ${f(dy*40*I)}px) rotateX(${f(dy*55*I)}deg) rotateY(${f(-dx*55*I)}deg)`)},
      {opacity:c.op, transform:c.T("perspective(800px) translate(0px, 0px) rotateX(0deg) rotateY(0deg)")}]);
  // 가장자리를 경첩 삼아 접혀 있다가 펼쳐진다
  for(const [k, a, b, o, ax, s] of [["Up","아래 가장자리에서","아래 가장자리로","50% 100%","X",1], ["Down","위 가장자리에서","위 가장자리로","50% 0%","X",-1],
    ["Left","오른쪽 가장자리에서","오른쪽 가장자리로","100% 50%","Y",-1], ["Right","왼쪽 가장자리에서","왼쪽 가장자리로","0% 50%","Y",1]])
    pair("fold" + k, `${a} 펼쳐 등장`, `${b} 접혀 퇴장`, {duration:800}, (I, c) => [
      {opacity:0, transformOrigin:o, transform:c.T(`perspective(700px) rotate${ax}(${f(s*clamp(90*I, 0, 120))}deg)`)}, {opacity:c.op, transformOrigin:o, transform:c.T(`perspective(700px) rotate${ax}(0deg)`)}]);
  // 잘라 내기(clip-path)로 드러내기
  for(const [k, a, b, from, to] of [
    ["WipeRight","오른쪽부터 펼침","오른쪽으로 접힘","inset(0% 0% 0% 100%)","inset(0% 0% 0% 0%)"],
    ["WipeDown","위부터 펼침","위로 접힘","inset(0% 0% 100% 0%)","inset(0% 0% 0% 0%)"],
    ["WipeUp","아래부터 펼침","아래로 접힘","inset(100% 0% 0% 0%)","inset(0% 0% 0% 0%)"],
    ["SplitH","가운데서 좌우로 펼침","가운데로 좌우 접힘","inset(0% 50% 0% 50%)","inset(0% 0% 0% 0%)"],
    ["SplitV","가운데서 위아래로 펼침","가운데로 위아래 접힘","inset(50% 0% 50% 0%)","inset(0% 0% 0% 0%)"],
    ["Circle","원형으로 펼침","원형으로 닫힘","circle(0% at 50% 50%)","circle(75% at 50% 50%)"],
    ["Diamond","마름모로 펼침","마름모로 닫힘","polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)","polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%)"],
    ["CornerTL","왼쪽 위 모서리부터 펼침","왼쪽 위 모서리로 닫힘","circle(0% at 0% 0%)","circle(145% at 0% 0%)"],
    ["CornerBR","오른쪽 아래 모서리부터 펼침","오른쪽 아래 모서리로 닫힘","circle(0% at 100% 100%)","circle(145% at 100% 100%)"]])
    pair("clip" + k, a, b, {}, (I, c) => [{clipPath:from, filter:`brightness(${f(1 + .4*I)})`}, {clipPath:to, filter:"brightness(1)"}]);
  // 한 가지씩 다른 움직임
  const singles = [
    ["rollLeft", "왼쪽에서 굴러 등장", "왼쪽으로 굴러 퇴장", {}, (I, c) => [{opacity:0, transform:c.T(`translateX(${f(-100*I)}px) rotate(${f(-120*I)}deg)`)}, {opacity:c.op, transform:c.T("translateX(0px) rotate(0deg)")}]],
    ["rollRight", "오른쪽에서 굴러 등장", "오른쪽으로 굴러 퇴장", {}, (I, c) => [{opacity:0, transform:c.T(`translateX(${f(100*I)}px) rotate(${f(120*I)}deg)`)}, {opacity:c.op, transform:c.T("translateX(0px) rotate(0deg)")}]],
    ["speedLeft", "왼쪽에서 광속 등장", "왼쪽으로 광속 퇴장", {duration:800, easing:"ease-out"}, (I, c) => [[0,-120,30,0],[.6,0,-20,1],[.8,0,5,1],[1,0,0,1]].map(([o,x,s,a]) => ({offset:o, opacity:c.op*a, transform:c.T(`translateX(${f(x*I)}px) skewX(${f(s*I)}deg)`)}))],
    ["speedRight", "오른쪽에서 광속 등장", "오른쪽으로 광속 퇴장", {duration:800, easing:"ease-out"}, (I, c) => [[0,120,-30,0],[.6,0,20,1],[.8,0,-5,1],[1,0,0,1]].map(([o,x,s,a]) => ({offset:o, opacity:c.op*a, transform:c.T(`translateX(${f(x*I)}px) skewX(${f(s*I)}deg)`)}))],
    ["drop", "떨어지며 등장", "튀어 오르며 퇴장", {duration:1000, easing:"ease-out"}, (I, c) => [[0,-120,0],[.55,0,1],[.7,-20,1],[.85,0,1],[.93,-6,1],[1,0,1]].map(([o,y,a]) => ({offset:o, opacity:c.op*a, transform:c.T(`translateY(${f(y*I)}px)`)}))],
    ["hang", "위에 매달려 등장", "위로 감기며 퇴장", {duration:1000, easing:"ease-out"}, (I, c) => [[0,-90,0],[.6,20,1],[.8,-10,1],[1,0,1]].map(([o,r,a]) => ({offset:o, opacity:c.op*a, transformOrigin:"50% 0%", transform:c.T(`perspective(700px) rotateX(${f(r*I)}deg)`)}))],
    ["flipY", "세로축 뒤집으며 등장", "세로축 뒤집으며 퇴장", {duration:800}, (I, c) => [{opacity:0, transform:c.T(`perspective(600px) rotateY(${f(clamp(90*I, 0, 180))}deg)`)}, {opacity:c.op, transform:c.T("perspective(600px) rotateY(0deg)")}]],
    ["spiral", "소용돌이 등장", "소용돌이 퇴장", {duration:900}, (I, c) => [{opacity:0, transform:c.T(`rotate(${f(-360*I)}deg) scale(0)`)}, {opacity:c.op, transform:c.T("rotate(0deg) scale(1)")}]],
    ["expandX", "가로로 펼쳐 등장", "가로로 접혀 퇴장", {}, (I, c) => [{opacity:0, transform:c.T(`scaleX(${f(clamp(1 - I, 0, 1))})`)}, {opacity:c.op, transform:c.T("scaleX(1)")}]],
    ["expandY", "세로로 펼쳐 등장", "세로로 접혀 퇴장", {}, (I, c) => [{opacity:0, transform:c.T(`scaleY(${f(clamp(1 - I, 0, 1))})`)}, {opacity:c.op, transform:c.T("scaleY(1)")}]],
    ["unroll", "위에서 내려 펼침", "위로 말려 사라짐", {}, (I, c) => [{opacity:0, transformOrigin:"50% 0%", transform:c.T(`scaleY(${f(clamp(1 - I, 0, 1))})`)}, {opacity:c.op, transformOrigin:"50% 0%", transform:c.T("scaleY(1)")}]],
    ["pop", "톡 튀어 등장", "톡 줄며 퇴장", {duration:500}, (I, c) => [{offset:0, opacity:0, transform:c.T("scale(0)")}, {offset:.7, opacity:c.op, transform:c.T(`scale(${f(1 + .15*I)})`)}, {offset:1, opacity:c.op, transform:c.T("scale(1)")}]],
    ["elastic", "탄성 등장", "탄성 퇴장", {duration:1000, easing:"ease-out"}, (I, c) => [[0,0,0],[.4,1+.25*I,1],[.55,1-.12*I,1],[.7,1+.06*I,1],[.85,1-.02*I,1],[1,1,1]].map(([o,s,a]) => ({offset:o, opacity:c.op*a, transform:c.T(`scale(${f(s)})`)}))],
    ["riseSpin", "돌면서 떠오름", "돌면서 가라앉음", {}, (I, c) => [{opacity:0, transform:c.T(`translateY(${f(40*I)}px) rotate(${f(-12*I)}deg)`)}, {opacity:c.op, transform:c.T("translateY(0px) rotate(0deg)")}]],
    ["skew", "기울며 등장", "기울며 퇴장", {}, (I, c) => [{opacity:0, transform:c.T(`translateX(${f(-40*I)}px) skewX(${f(-30*I)}deg)`)}, {opacity:c.op, transform:c.T("translateX(0px) skewX(0deg)")}]],
    ["stretch", "늘어나며 등장", "늘어나며 퇴장", {}, (I, c) => [{opacity:0, transform:c.T(`scale(${f(1 + I)}, ${f(clamp(1 - .8*I, .05, 1))})`)}, {opacity:c.op, transform:c.T("scale(1, 1)")}]]
  ];
  for(const [id, a, b, d, kf] of singles) pair(id, a, b, d, kf);

  /* ---------- 강조 (한 번) ---------- */
  const once = (id, name, d, kf) => add("강조", id, name, {duration:1000, easing:"ease-in-out", iterations:1, ...d}, kf);
  const seq = (vals, fn) => vals.map((v, i) => ({offset:f(i / (vals.length - 1)), ...fn(v)}));
  once("hop", "통통 튀기", {easing:"ease-out"}, (I, c) => [[0,0],[.2,0],[.4,-30],[.43,-30],[.53,0],[.7,-15],[.8,0],[.9,-4],[1,0]].map(([o,y]) => ({offset:o, transform:c.T(`translateY(${f(y*I)}px)`)})));
  once("flash", "번쩍임", {duration:900}, (I, c) => seq([1,0,1,0,1], v => ({opacity:f(c.op * (1 - (1 - v) * clamp(I, 0, 1)))})));
  once("rubberV", "세로 고무줄", {duration:900, easing:"ease-out"}, (I, c) => [[0,1,1],[.3,.75,1.25],[.4,1.25,.75],[.5,.85,1.15],[.65,1.05,.95],[.75,.95,1.05],[1,1,1]].map(([o,x,y]) => ({offset:o, transform:c.T(`scale(${f(1+(x-1)*I)}, ${f(1+(y-1)*I)})`)})));
  once("tada", "짜잔", {}, (I, c) => [[0,1,0],[.1,.9,-3],[.2,.9,-3],[.3,1.1,3],[.4,1.1,-3],[.5,1.1,3],[.6,1.1,-3],[.7,1.1,3],[.8,1.1,-3],[.9,1.1,3],[1,1,0]].map(([o,s,r]) => ({offset:o, transform:c.T(`scale(${f(1+(s-1)*I)}) rotate(${f(r*I)}deg)`)})));
  once("wobble", "비틀 흔들림", {}, (I, c) => [[0,0,0],[.15,-25,-5],[.3,20,3],[.45,-15,-3],[.6,10,2],[.75,-5,-1],[1,0,0]].map(([o,x,r]) => ({offset:o, transform:c.T(`translateX(${f(x*I)}px) rotate(${f(r*I)}deg)`)})));
  once("headShake", "고개 젓기", {}, (I, c) => [[0,0,0],[.065,-6,-9],[.185,5,7],[.315,-3,-5],[.435,2,3],[.5,0,0],[1,0,0]].map(([o,x,r]) => ({offset:o, transform:c.T(`perspective(600px) translateX(${f(x*I)}px) rotateY(${f(r*I)}deg)`)})));
  once("nod", "끄덕임", {duration:900}, (I, c) => seq([0,20,-8,12,0], v => ({transformOrigin:"50% 0%", transform:c.T(`perspective(600px) rotateX(${f(v*I)}deg)`)})));
  once("jump", "점프", {duration:900}, (I, c) => [[0,0,1,1],[.2,0,1.15,.85],[.45,-40,.9,1.1],[.7,0,1.1,.9],[.85,0,.97,1.03],[1,0,1,1]].map(([o,y,x,s]) => ({offset:o, transformOrigin:"50% 100%", transform:c.T(`translateY(${f(y*I)}px) scale(${f(1+(x-1)*I)}, ${f(1+(s-1)*I)})`)})));
  once("tap", "톡", {duration:400, easing:"ease-out"}, (I, c) => seq([1, 1 + .2*I, 1], v => ({transform:c.T(`scale(${f(v)})`)})));
  once("wiggle", "까딱", {duration:700}, (I, c) => seq([0,-8,8,-6,6,-3,0], v => ({transform:c.T(`rotate(${f(v*I)}deg)`)})));
  once("flipOnce", "한 바퀴 뒤집기", {duration:900}, (I, c) => seq([[0,1],[180,1 - .1*I],[360,1]], ([r,s]) => ({transform:c.T(`perspective(600px) rotateY(${r}deg) scale(${f(s)})`)})));
  once("spinOnce", "한 바퀴 돌기", {duration:900, easing:EASE.out}, (I, c) => [{offset:0, transform:c.T("rotate(0deg)")}, {offset:.2, transform:c.T(`rotate(${f(-20*I)}deg)`)}, {offset:1, transform:c.T("rotate(360deg)")}]);
  once("boing", "통 눌림", {duration:800, easing:"ease-out"}, (I, c) => seq([1,.6,1.2,.9,1.05,1], v => ({transformOrigin:"50% 100%", transform:c.T(`scaleY(${f(1+(v-1)*I)})`)})));
  once("knock", "노크", {duration:600}, (I, c) => seq([0,6,0,6,0,0], v => ({transform:c.T(`translateX(${f(v*I)}px)`)})));
  once("shiver", "오싹 떨림", {duration:700, easing:"linear"}, (I, c) => seq([0,-1.5,1.5,-1.5,1.5,-1,1,-1,1,-.5,.5,0], (v, i) => ({transform:c.T(`translate(${f(v*I)}px, ${f(-v*.5*I)}px)`)})));
  once("ring", "종 울림", {duration:1100}, (I, c) => seq([0,15,-13,10,-8,5,-3,0], v => ({transformOrigin:"50% 0%", transform:c.T(`rotate(${f(v*I)}deg)`)})));
  once("hopSide", "옆으로 튀기", {easing:"ease-out"}, (I, c) => [[0,0],[.3,24],[.5,0],[.7,10],[.85,0],[1,0]].map(([o,x]) => ({offset:o, transform:c.T(`translateX(${f(x*I)}px)`)})));
  once("jelloV", "세로 젤로", {duration:900}, (I, c) => seq([0,-12.5,6.25,-3.1,1.6,-.8,0], v => ({transform:c.T(`skewY(${f(v*I)}deg)`)})));

  /* ---------- 반복 움직임 ---------- */
  const loop = (cat, id, name, d, kf) => add(cat, id, name, {duration:2000, easing:"ease-in-out", iterations:0, ...d}, kf);
  const circle = (n, fn) => Array.from({length:n + 1}, (_, i) => fn(i / n * Math.PI * 2, i / n));
  loop("이동", "bob", "잔잔한 오르내림", {duration:1400}, (I, c) => seq([0,-4*I,0], v => ({transform:c.T(`translateY(${f(v)}px)`)})));
  loop("이동", "floatDiag", "대각선 부유", {duration:3000}, (I, c) => seq([0,1,0], v => ({transform:c.T(`translate(${f(8*I*v)}px, ${f(-8*I*v)}px)`)})));
  loop("이동", "floatCircle", "원형 부유", {duration:4000, easing:"linear"}, (I, c) => circle(12, t => ({transform:c.T(`translate(${f(Math.cos(t)*10*I)}px, ${f(Math.sin(t)*10*I)}px)`)})));
  loop("이동", "figure8", "8자 부유", {duration:5000, easing:"linear"}, (I, c) => circle(16, t => ({transform:c.T(`translate(${f(Math.sin(t)*16*I)}px, ${f(Math.sin(2*t)*6*I)}px)`)})));
  loop("이동", "pingPongX", "좌우 왕복", {duration:1600, easing:"linear", direction:"alternate"}, (I, c) => [{transform:c.T(`translateX(${f(-30*I)}px)`)}, {transform:c.T(`translateX(${f(30*I)}px)`)}]);
  loop("이동", "pingPongY", "상하 왕복", {duration:1600, easing:"linear", direction:"alternate"}, (I, c) => [{transform:c.T(`translateY(${f(-20*I)}px)`)}, {transform:c.T(`translateY(${f(20*I)}px)`)}]);
  loop("이동", "zigzag", "지그재그", {duration:2400, easing:"linear"}, (I, c) => seq([[0,0],[10,-8],[20,0],[10,8],[0,0]], ([x,y]) => ({transform:c.T(`translate(${f(x*I)}px, ${f(y*I)}px)`)})));
  loop("이동", "ballBounce", "공 튀기기", {duration:900, easing:"linear"}, (I, c) => [{offset:0, easing:"cubic-bezier(.33,1,.66,1)", transform:c.T("translateY(0px)")},
    {offset:.5, easing:"cubic-bezier(.33,0,.66,0)", transform:c.T(`translateY(${f(-30*I)}px)`)}, {offset:1, transform:c.T("translateY(0px)")}]);
  loop("이동", "jitter", "지지직 떨림", {duration:400, easing:"linear"}, (I, c) => [[0,0],[2,-1],[-2,1],[1,2],[-1,-2],[0,0]].map(([x,y], i, a) => ({offset:f(i/(a.length-1)), easing:"steps(1, end)", transform:c.T(`translate(${f(x*I)}px, ${f(y*I)}px)`)})));
  loop("회전", "swayRot", "살랑 흔들림", {duration:2400, direction:"alternate"}, (I, c) => [{transform:c.T(`rotate(${f(-4*I)}deg)`)}, {transform:c.T(`rotate(${f(4*I)}deg)`)}]);
  loop("회전", "pendulumBottom", "거꾸로 진자", {duration:1400, direction:"alternate"}, (I, c) => [{transformOrigin:"50% 100%", transform:c.T(`rotate(${f(-12*I)}deg)`)}, {transformOrigin:"50% 100%", transform:c.T(`rotate(${f(12*I)}deg)`)}]);
  loop("회전", "spinReverse", "역회전", {easing:"linear"}, (I, c) => [{transform:c.T("rotate(0deg)")}, {transform:c.T(`rotate(${-360*Math.max(1, Math.round(I))}deg)`)}]);
  loop("회전", "spinY", "세로축 회전", {duration:2400, easing:"linear"}, (I, c) => [{transform:c.T("perspective(600px) rotateY(0deg)")}, {transform:c.T("perspective(600px) rotateY(360deg)")}]);
  loop("회전", "spinX", "가로축 회전", {duration:2400, easing:"linear"}, (I, c) => [{transform:c.T("perspective(600px) rotateX(0deg)")}, {transform:c.T("perspective(600px) rotateX(360deg)")}]);
  loop("회전", "coinFlip", "동전 뒤집기", {duration:1600}, (I, c) => seq([[0,0],[-20,180],[0,360]], ([y,r]) => ({transform:c.T(`perspective(600px) translateY(${f(y*I)}px) rotateY(${r}deg)`)})));
  loop("회전", "rock", "흔들의자", {duration:2000}, (I, c) => seq([[0,0],[-6,-4],[0,0],[6,4],[0,0]], ([r,x]) => ({transform:c.T(`translateX(${f(x*I)}px) rotate(${f(r*I)}deg)`)})));
  loop("회전", "step90", "90도씩 회전", {duration:3200, easing:EASE.back}, (I, c) => [[0,0],[.2,90],[.25,90],[.45,180],[.5,180],[.7,270],[.75,270],[.95,360],[1,360]].map(([o,r]) => ({offset:o, transform:c.T(`rotate(${r}deg)`)})));
  loop("회전", "tickTock", "째깍", {duration:1000, easing:"linear"}, (I, c) => [{offset:0, easing:"steps(1, end)", transform:c.T(`rotate(${f(-10*I)}deg)`)}, {offset:.5, easing:"steps(1, end)", transform:c.T(`rotate(${f(10*I)}deg)`)}, {offset:1, transform:c.T(`rotate(${f(-10*I)}deg)`)}]);
  loop("회전", "gyro", "3D 기울임 회전", {duration:3600, easing:"linear"}, (I, c) => circle(8, t => ({transform:c.T(`perspective(700px) rotateX(${f(Math.sin(t)*12*I)}deg) rotateY(${f(Math.cos(t)*12*I)}deg)`)})));
  loop("크기", "breathe", "숨쉬기", {duration:3200}, (I, c) => seq([0,1,0], v => ({opacity:f(c.op*(1 - .15*v)), transform:c.T(`scale(${f(1 + .04*I*v)})`)})));
  loop("크기", "throb", "두근", {duration:700, easing:"ease-out"}, (I, c) => [{offset:0, transform:c.T("scale(1)")}, {offset:.25, transform:c.T(`scale(${f(1 + .1*I)})`)}, {offset:1, transform:c.T("scale(1)")}]);
  loop("크기", "squishLoop", "말랑", {duration:1600}, (I, c) => seq([0,1,0], v => ({transform:c.T(`scale(${f(1 + .06*I*v)}, ${f(1 - .06*I*v)})`)})));
  loop("변형", "wave", "물결 기울기", {duration:1800, direction:"alternate"}, (I, c) => [{transform:c.T(`skewY(${f(-5*I)}deg)`)}, {transform:c.T(`skewY(${f(5*I)}deg)`)}]);
  loop("변형", "wobbleLoop", "비틀 반복", {duration:2200}, (I, c) => seq([[0,0],[3,-2],[-3,2],[2,-1],[0,0]], ([x,r]) => ({transform:c.T(`translateX(${f(x*I)}px) rotate(${f(r*I)}deg)`)})));
  loop("궤도", "orbitReverse", "역궤도", {duration:3000, easing:"linear"}, (I, c) => Array.from({length:9}, (_, i) => ({transform:c.T(`rotate(${-i*45}deg) translateX(${f(24*I)}px) rotate(${i*45}deg)`)})));
  loop("궤도", "orbitEllipse", "타원 궤도", {duration:3600, easing:"linear"}, (I, c) => circle(16, t => ({transform:c.T(`translate(${f(Math.cos(t)*30*I)}px, ${f(Math.sin(t)*10*I)}px)`)})));
  loop("페이드", "shimmerFade", "아른거림", {duration:2600}, (I, c) => seq([1,.7,.95,.6,1], v => ({opacity:f(c.op * (1 - (1 - v) * clamp(I, 0, 1.5)))})));

  /* ---------- 색 · 필터 ---------- */
  const fl = (id, name, d, kf, color) => add("색·필터", id, name, {duration:2000, easing:"ease-in-out", iterations:0, ...d}, kf, color);
  fl("hueCycle", "색상 순환", {duration:4000, easing:"linear"}, (I, c) => [{filter:"hue-rotate(0deg)"}, {filter:`hue-rotate(${Math.round(360*Math.max(1, Math.round(I)))}deg)`}]);
  fl("brightPulse", "밝기 펄스", {}, (I, c) => seq([1, 1 + .6*I, 1], v => ({filter:`brightness(${f(v)})`})));
  fl("saturatePulse", "채도 펄스", {}, (I, c) => seq([1, 1 + 2*I, 1], v => ({filter:`saturate(${f(v)})`})));
  fl("grayToColor", "흑백에서 컬러로", {duration:1200, iterations:1, fill:"both", easing:"ease-out"}, (I, c) => [{filter:`grayscale(${f(clamp(I, 0, 1))})`}, {filter:"grayscale(0)"}]);
  fl("sepiaTint", "세피아 물듦", {duration:4000}, (I, c) => seq([0, clamp(.8*I, 0, 1), 0], v => ({filter:`sepia(${f(v)})`})));
  fl("invertFlash", "반전 번쩍", {duration:600, iterations:1, easing:"linear"}, (I, c) => [{offset:0, easing:"steps(1, end)", filter:"invert(0)"}, {offset:.2, easing:"steps(1, end)", filter:`invert(${f(clamp(I, 0, 1))})`}, {offset:.4, easing:"steps(1, end)", filter:"invert(0)"}, {offset:.6, easing:"steps(1, end)", filter:`invert(${f(clamp(I, 0, 1))})`}, {offset:.8, filter:"invert(0)"}, {offset:1, filter:"invert(0)"}]);
  fl("contrastPulse", "대비 펄스", {}, (I, c) => seq([1, 1 + .8*I, 1], v => ({filter:`contrast(${f(v)})`})));
  fl("blurPulse", "흐림 펄스", {duration:2400}, (I, c) => seq([0, 3*I, 0], v => ({filter:`blur(${f(v)}px)`})));
  fl("shadowLift", "떠오르는 그림자", {duration:2400, direction:"alternate"}, (I, c) => [{boxShadow:"0px 2px 6px rgba(0,0,0,.35)", transform:c.T("translateY(0px)")}, {boxShadow:`0px ${f(18*I)}px ${f(30*I)}px rgba(0,0,0,.45)`, transform:c.T(`translateY(${f(-6*I)}px)`)}]);
  fl("outlineBlink", "윤곽 점멸", {duration:1200}, (I, c) => seq([.9, 0, .9], v => ({boxShadow:`0 0 0 ${f(Math.max(1, 2*I))}px ${hexA(c.color, v)}`})), true);
  fl("twoToneGlow", "두 색 글로우", {duration:2400, direction:"alternate"}, (I, c) => [{filter:`drop-shadow(0 0 ${f(10*I)}px ${hexA(c.color, .9)}) hue-rotate(0deg)`}, {filter:`drop-shadow(0 0 ${f(10*I)}px ${hexA(c.color, .9)}) hue-rotate(${f(90*I)}deg)`}], true);
  fl("neonOn", "네온 점등", {duration:1400, iterations:1, fill:"both", easing:"linear"}, (I, c) => [[0,0,0],[.1,1,1],[.14,0,0],[.3,1,1],[.34,.2,0],[.5,1,1],[1,1,1]].map(([o,a,g]) => ({offset:o, easing:"steps(1, end)", opacity:f(c.op*a), filter:`drop-shadow(0 0 ${f(12*I*g)}px ${hexA(c.color, .9)})`})), true);
  fl("innerGlow", "안쪽 글로우", {duration:2600}, (I, c) => seq([0, 1, 0], v => ({boxShadow:`inset 0 0 ${f(24*I*v)}px ${hexA(c.color, .8*v)}`})), true);
  fl("shadowOrbit", "그림자 회전", {duration:3000, easing:"linear"}, (I, c) => circle(8, t => ({filter:`drop-shadow(${f(Math.cos(t)*6*I)}px ${f(Math.sin(t)*6*I)}px ${f(4*I)}px ${hexA(c.color, .8)})`})), true);
  add("변형", "radiusMorph", "모서리 변형", {duration:3000, easing:"ease-in-out", iterations:0}, (I, c) => seq([0, clamp(50*I, 0, 50), 0], v => ({borderRadius:`${f(v)}%`})));
  add("변형", "blob", "물방울 변형", {duration:6000, easing:"ease-in-out", iterations:0}, (I, c) => seq(["30% 70% 70% 30% / 30% 30% 70% 70%", "58% 42% 75% 25% / 76% 46% 54% 24%", "50% 50% 33% 67% / 55% 27% 73% 45%", "33% 67% 58% 42% / 63% 68% 32% 37%", "30% 70% 70% 30% / 30% 30% 70% 70%"], v => ({borderRadius:v})));

  /* ---------- 디지털 · 글리치 ---------- */
  const dg = (cat, id, name, d, kf) => add(cat, id, name, {duration:1200, easing:"linear", iterations:1, ...d}, kf);
  dg("디지털 전환", "typeReveal", "타자 드러남", {easing:"steps(12, end)", fill:"both"}, (I, c) => [{clipPath:"inset(0% 100% 0% 0%)", filter:`brightness(${f(1 + .6*I)})`}, {clipPath:"inset(0% 0% 0% 0%)", filter:"brightness(1)"}]);
  dg("디지털 전환", "pixelFocus", "계단식 선명해짐", {duration:900, easing:"steps(6, end)", fill:"both"}, (I, c) => [{opacity:0, filter:`blur(${f(10*I)}px)`}, {opacity:c.op, filter:"blur(0px)"}]);
  dg("디지털 전환", "signalBlink", "신호 점멸", {duration:1000, fill:"both"}, (I, c) => seq([0,1,0,1,1,0,1], v => ({easing:"steps(1, end)", opacity:f(c.op*v)})));
  dg("디지털 전환", "scanFlicker", "스캔 깜빡임", {duration:1000, iterations:0}, (I, c) => [[0,"inset(0% 0% 0% 0%)",1],[.3,"inset(0% 0% 0% 0%)",1],[.32,"inset(40% 0% 40% 0%)",.6],[.36,"inset(0% 0% 0% 0%)",1],[.7,"inset(0% 0% 0% 0%)",1],[.72,"inset(10% 0% 75% 0%)",.7],[.75,"inset(0% 0% 0% 0%)",1],[1,"inset(0% 0% 0% 0%)",1]]
    .map(([o,cl,a]) => ({offset:o, easing:"steps(1, end)", clipPath:cl, opacity:f(c.op*a)})));
  dg("홀로그램", "holoDrift", "홀로그램 흔들림", {duration:3200, easing:"ease-in-out", iterations:0}, (I, c) => seq([[0,0,1],[2,20,.85],[-1,-10,.95],[0,0,1]], ([s,h,a]) => ({opacity:f(c.op*a), filter:`hue-rotate(${f(h*I)}deg)`, transform:c.T(`skewX(${f(s*I)}deg)`)})));
  dg("글리치", "glitchShift", "글리치 이동", {duration:800, iterations:0}, (I, c) => [[0,0,0],[.12,-5,1],[.2,4,-1],[.28,0,0],[.6,3,2],[.66,-3,0],[.72,0,0],[1,0,0]].map(([o,x,y]) => ({offset:o, easing:"steps(1, end)", transform:c.T(`translate(${f(x*I)}px, ${f(y*I)}px)`)})));
  dg("글리치", "rgbJitter", "색 어긋남", {duration:1000, iterations:0}, (I, c) => [[0,0],[.1,3],[.16,-2],[.24,0],[.6,2],[.66,-3],[.72,0],[1,0]].map(([o,x]) => ({offset:o, easing:"steps(1, end)", filter:`drop-shadow(${f(x*I)}px 0 0 rgba(255,0,70,.8)) drop-shadow(${f(-x*I)}px 0 0 rgba(0,240,255,.8))`})));
  return out;
}
