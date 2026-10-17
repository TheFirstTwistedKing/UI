/* 파괴 35종: 조각 엔진(나누는 모양 × 흩어지는 움직임)과 불·녹음·소멸·폭발
   모든 레이어는 inset:0 + clip-path로 요소를 나눠, translate %가 요소 크기를 따른다. 요소 자체는 숨긴다. */
import { f2, hexA, clamp, STEP, centered } from "../vfx-util.js";

export function destroyEffects(def){
  const X = (id, name, o, make) => def("파괴", id, name, {color:true, poster:null, ...o, d:{duration:1600, iterations:1, color:"#e9d8a6", ...o.d}}, make);
  const f3 = v => +(+v).toFixed(3);
  const HIDE = {kf:[{visibility:"hidden"}, {visibility:"hidden"}], fill:"forwards"};
  const TF = (x, y, r, s) => `translate(${f2(x)}%, ${f2(y)}%) rotate(${f2(r)}deg) scale(${f2(s)})`;
  const T0 = TF(0, 0, 0, 1);
  const pm = c => c.rnd() < .5 ? -1 : 1;
  const poly = pts => `polygon(${pts.map(([x, y]) => `${f2(x)}% ${f2(y)}%`).join(",")})`;
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const center = pts => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  // s까지 제자리, e에 사라진 상태. mid가 있으면 그 사이에 한 프레임 더
  const hold = (s, e, T1, ease, mid) => {
    s = clamp(s, .01, .9); e = clamp(e, s + .06, 1);
    const k = [{offset:0, opacity:1, transform:T0}, {offset:f3(s), opacity:1, transform:T0, easing:ease}];
    if(mid) k.push({offset:f3(s + (e - s) * mid.at), opacity:1, transform:mid.T, easing:ease});
    k.push({offset:f3(e), opacity:0, transform:T1});
    if(e < 1) k.push({offset:1, opacity:0, transform:T1});
    return k;
  };

  /* 나누는 모양: [{pts, dir?}] (pts는 % 좌표 다각형) */
  const P = {
    tri:c => {
      const cols = Math.round(3 + 2*c.D), rows = clamp(Math.round(cols * c.h / Math.max(1, c.w)), 2, 8), G = [], out = [];
      for(let j = 0; j <= rows; j++){ G.push([]); for(let i = 0; i <= cols; i++){
        const edge = i === 0 || j === 0 || i === cols || j === rows;
        G[j].push([clamp(i/cols*100 + (edge ? 0 : (c.rnd() - .5) * 60/cols), 0, 100), clamp(j/rows*100 + (edge ? 0 : (c.rnd() - .5) * 60/rows), 0, 100)]);
      }}
      for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
        const a = G[j][i], b = G[j][i+1], d = G[j+1][i], e = G[j+1][i+1];
        for(const t of c.rnd() < .5 ? [[a,b,e],[a,e,d]] : [[a,b,d],[b,e,d]]) out.push({pts:t});
      }
      return out;
    },
    wedges:c => {
      const n = Math.round(6 + 3*c.D), off = c.rnd() * Math.PI * 2, out = [];
      const edge = a => { const dx = Math.cos(a), dy = Math.sin(a), t = 50 / Math.max(Math.abs(dx), Math.abs(dy)); return [50 + dx*t, 50 + dy*t]; };
      for(let i = 0; i < n; i++){
        const a0 = off + i / n * Math.PI * 2, a1 = off + (i + 1) / n * Math.PI * 2;
        out.push({pts:[[50, 50], ...Array.from({length:5}, (_, k) => edge(a0 + (a1 - a0) * k / 4))]});
      }
      return out;
    },
    stripsH:c => { const n = Math.round(5 + 3*c.D); return Array.from({length:n}, (_, i) => ({pts:rect(0, i/n*100, 100, (i+1)/n*100), dir:[i % 2 ? -1 : 1, 0]})); },
    stripsV:c => { const n = Math.round(5 + 3*c.D); return Array.from({length:n}, (_, i) => ({pts:rect(i/n*100, 0, (i+1)/n*100, 100), dir:[0, i % 2 ? -1 : 1]})); },
    diag:c => { const n = Math.round(6 + 3*c.D); return Array.from({length:n}, (_, i) => { const u0 = i/n*200, u1 = (i+1)/n*200;
      return {pts:[[u0, 0], [u1, 0], [u1 - 100, 100], [u0 - 100, 100]], c:[clamp((u0 + u1)/2 - 50, 0, 100), 50]}; }); },
    cells:c => {
      const cols = Math.round(5 + 3*c.D), rows = clamp(Math.round(cols * c.h / Math.max(1, c.w)), 2, 12), out = [];
      for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++) out.push({pts:rect(i/cols*100, j/rows*100, (i+1)/cols*100, (j+1)/rows*100)});
      return out;
    },
    halvesH:() => [{pts:rect(0, 0, 100, 50), dir:[0, -1]}, {pts:rect(0, 50, 100, 100), dir:[0, 1]}],
    halvesV:() => [{pts:rect(0, 0, 50, 100), dir:[-1, 0]}, {pts:rect(50, 0, 100, 100), dir:[1, 0]}],
    diagCut:() => [{pts:[[0, 0], [100, 0], [0, 100]], dir:[-.7, -.7]}, {pts:[[100, 0], [100, 100], [0, 100]], dir:[.7, .7]}],
    quarters:() => [[0, 0], [50, 0], [0, 50], [50, 50]].map(([x, y]) => ({pts:rect(x, y, x + 50, y + 50)})),
    tear:c => {
      const zig = Array.from({length:9}, (_, k) => [50 + (k % 2 ? 1 : -1) * (2 + c.rnd()*6), k / 8 * 100]);
      return [{pts:[[0, 0], ...zig, [0, 100]], dir:[-1, 0]}, {pts:[[100, 0], ...zig, [100, 100]], dir:[1, 0]}];
    }
  };

  /* 움직임: (조각, c, 순서 0~1) → {kf, origin?} */
  const vec = (fr, c) => { const [cx, cy] = fr.c; let vx = cx - 50, vy = cy - 50; const l = Math.hypot(vx, vy); if(l < 1){ const a = c.rnd() * 6.283; return [Math.cos(a), Math.sin(a)]; } return [vx / l, vy / l]; };
  const M = {
    explode:(fr, c) => { const [vx, vy] = vec(fr, c), d = (30 + c.rnd()*50) * c.I;
      return {kf:hold(.01 + c.rnd()*.08, .85 + c.rnd()*.15, TF(vx*d, vy*d + 20*c.I, (c.rnd() - .5) * 400 * c.I, .6), "cubic-bezier(.15,.7,.35,1)")}; },
    implode:(fr, c) => { const s = .01 + c.rnd()*.2;
      return {kf:hold(s, s + .45 + c.rnd()*.2, TF(50 - fr.c[0], 50 - fr.c[1], pm(c) * 180, 0), "cubic-bezier(.6,0,.9,.5)")}; },
    fall:(fr, c) => { const s = c.rnd()*.45 + .02;
      return {kf:hold(s, s + .4 + c.rnd()*.1, TF((c.rnd() - .5) * 20, (80 + c.rnd()*60) * c.I, (c.rnd() - .5) * 180, .9), "cubic-bezier(.5,0,.9,.4)")}; },
    windR:(fr, c) => { const s = fr.c[0] / 100 * .5 + c.rnd()*.08;
      return {kf:hold(s, s + .4 + c.rnd()*.1, TF((60 + c.rnd()*80) * c.I, -(10 + c.rnd()*30) * c.I, c.rnd()*240 - 60, .5), "cubic-bezier(.45,0,.7,.6)")}; },
    windL:(fr, c) => { const s = (100 - fr.c[0]) / 100 * .5 + c.rnd()*.08;
      return {kf:hold(s, s + .4 + c.rnd()*.1, TF(-(60 + c.rnd()*80) * c.I, -(10 + c.rnd()*30) * c.I, 60 - c.rnd()*240, .5), "cubic-bezier(.45,0,.7,.6)")}; },
    apart:(fr, c) => { const [vx, vy] = fr.dir || vec(fr, c), d = (25 + c.rnd()*20) * c.I;
      return {kf:hold(.18, .95, TF(vx*d, vy*d + 6*c.I, pm(c) * (4 + c.rnd()*12), .95), "cubic-bezier(.5,0,.6,1)", {at:.12, T:TF(vx*2, vy*2, 0, 1)})}; },
    fan:(fr, c) => { const [vx, vy] = vec(fr, c), d = (20 + c.rnd()*30) * c.I, dir = pm(c);
      return {origin:"50% 50%", kf:hold(.03 + c.rnd()*.1, .8 + c.rnd()*.2, TF(vx*d, vy*d, dir * (60 + c.rnd()*90), .8), "cubic-bezier(.3,.4,.5,1)")}; },
    seq:(fr, c, k) => { const s = k * .72 + c.rnd()*.04;
      return {kf:hold(s, s + .2, TF(0, 0, pm(c) * 30, 0), "ease-in", {at:.3, T:TF(0, 0, 0, 1.15)})}; }
  };

  const facet = c => { const lit = f2(.04 + c.rnd()*.14); return `linear-gradient(${Math.round(c.rnd()*360)}deg,rgba(255,255,255,${lit}),rgba(0,0,0,${f2(lit*.8)})),${c.fill}`; };
  const frag = (id, name, pat, mot, o = {}) => X(id, name, {density:true, ...o}, c => {
    const frs = P[pat](c).map(fr => ({...fr, c:fr.c || center(fr.pts)}));
    const layers = frs.map((fr, i) => {
      const m = M[mot](fr, c, frs.length > 1 ? i / (frs.length - 1) : 0);
      return {css:`inset:0;background:${facet(c)};clip-path:${poly(fr.pts)};transform-origin:${m.origin || `${f2(fr.c[0])}% ${f2(fr.c[1])}%`};opacity:0`, kf:m.kf};
    });
    return {layers, self:HIDE};
  });

  frag("triWind", "유리 조각 바람", "tri", "windR");
  frag("triImplode", "유리 조각 수축", "tri", "implode", {d:{duration:1300}});
  frag("wedgeBurst", "방사형 파열", "wedges", "explode");
  frag("wedgeImplode", "방사형 수축", "wedges", "implode");
  frag("wedgeFan", "부채꼴 흩어짐", "wedges", "fan");
  frag("stripsWindR", "가로 조각 오른쪽 날림", "stripsH", "windR");
  frag("stripsWindL", "가로 조각 왼쪽 날림", "stripsH", "windL");
  frag("stripsFall", "가로 조각 낙하", "stripsH", "fall", {d:{duration:1800}});
  frag("stripsApart", "가로 조각 엇갈림", "stripsH", "apart", {d:{duration:1300}});
  frag("columnsFall", "세로 조각 낙하", "stripsV", "fall", {d:{duration:1800}});
  frag("columnsApart", "세로 조각 엇갈림", "stripsV", "apart", {d:{duration:1300}});
  frag("diagWind", "사선 조각 날림", "diag", "windR");
  frag("cellsBurst", "블록 폭발", "cells", "explode");
  frag("cellsWind", "블록 바람", "cells", "windR", {d:{duration:2000}});
  frag("cellsPop", "블록 순차 소멸", "cells", "seq", {d:{duration:2000}});
  frag("splitH", "위아래로 쪼개짐", "halvesH", "apart", {density:false, d:{duration:1200}});
  frag("splitV", "좌우로 쪼개짐", "halvesV", "apart", {density:false, d:{duration:1200}});
  frag("splitDiag", "대각선 절단", "diagCut", "apart", {density:false, d:{duration:1200}});
  frag("quarterBurst", "네 조각 파열", "quarters", "explode", {density:false});
  frag("tearApart", "찢어짐", "tear", "apart", {density:false, d:{duration:1400}});

  // 회전·크기 고리 조각 (원형 마스크)
  const ringFx = (id, name, out) => X(id, name, {density:true}, c => {
    const n = Math.round(3 + c.D), layers = [];
    for(let i = 0; i < n; i++){
      const r0 = f2(i / n * 100), r1 = f2((i + 1) / n * 100), m = `radial-gradient(farthest-corner circle at 50% 50%,transparent ${r0}%,#000 ${r0}%,#000 ${r1}%,transparent ${r1}%)`;
      const s = out ? .02 + (n - 1 - i) / n * .3 : .02 + i / n * .3, r = pm(c) * (40 + c.rnd()*80);
      layers.push({css:`inset:0;background:${facet(c)};-webkit-mask:${m};mask:${m};transform-origin:50% 50%;opacity:0`,
        kf:hold(s, s + .5, TF(0, out ? 10*c.I : 0, r, out ? 1 + (.4 + i*.15) * c.I : 0), out ? "cubic-bezier(.2,.6,.4,1)" : "cubic-bezier(.6,0,.9,.5)")});
    }
    return {layers, self:HIDE};
  });
  ringFx("ringsBurst", "동심원 파열", true);
  ringFx("ringsCollapse", "동심원 붕괴", false);

  /* 불타 사라짐 방향 변형 */
  const DARK = "rgba(20,8,0,.92),rgba(40,14,0,.55) 40%,transparent";
  const FLAME = (c, dir) => `linear-gradient(${dir},transparent,${c.color} 35%,#fff3c4 50%,${c.color} 65%,transparent)`;
  const burnDir = (id, name, ax) => X(id, name, {clip:true, d:{duration:2200, color:"#ff6a00"}}, c => {
    const th = f2(8 + 6*c.I), glow = `filter:blur(1.5px) drop-shadow(0 0 ${f2(8*c.I)}px ${hexA(c.color,.9)})`;
    const L = {
      up:{prop:"top", from:100, to:0, char:`left:0;right:0;height:40%;translate:0 -100%;background:linear-gradient(to top,${DARK})`, flame:`left:-3%;right:-3%;height:${th}%;translate:0 -50%;background:${FLAME(c, "to bottom")}`, clip:["inset(0% 0% 0% 0%)", "inset(0% 0% 100% 0%)"]},
      right:{prop:"left", from:0, to:100, char:`top:0;bottom:0;width:40%;background:linear-gradient(to right,${DARK})`, flame:`top:-3%;bottom:-3%;width:${th}%;translate:-50% 0;background:${FLAME(c, "to right")}`, clip:["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 100%)"]},
      left:{prop:"left", from:100, to:0, char:`top:0;bottom:0;width:40%;translate:-100% 0;background:linear-gradient(to left,${DARK})`, flame:`top:-3%;bottom:-3%;width:${th}%;translate:-50% 0;background:${FLAME(c, "to right")}`, clip:["inset(0% 0% 0% 0%)", "inset(0% 100% 0% 0%)"]}
    }[ax];
    return {layers:[
      {css:`${L.char};opacity:0`, kf:[{opacity:1, [L.prop]:`${L.from}%`}, {opacity:1, [L.prop]:`${L.to}%`}], easing:"ease-in"},
      {css:`${L.flame};${glow};opacity:0`, kf:[{offset:0, opacity:1, [L.prop]:`${L.from}%`}, {offset:.97, opacity:1, [L.prop]:`${f2(L.from + (L.to - L.from) * .97)}%`}, {offset:1, opacity:0, [L.prop]:`${L.to}%`}], easing:"ease-in"}],
      self:{kf:[{clipPath:L.clip[0]}, {clipPath:L.clip[1]}], fill:"forwards", easing:"ease-in"}};
  });
  burnDir("burnUp", "아래부터 불탐", "up");
  burnDir("burnFromLeft", "왼쪽부터 불탐", "right");
  burnDir("burnFromRight", "오른쪽부터 불탐", "left");
  X("burnEdges", "가장자리부터 불탐", {clip:true, d:{duration:2200, color:"#ff6a00"}}, c => {
    const dia = f2(Math.hypot(c.w, c.h) / Math.max(1, c.w) * 100);
    return {layers:[{css:`left:50%;top:50%;width:${dia}%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(closest-side,transparent 80%,rgba(30,10,0,.8) 86%,${c.color} 92%,#fff3c4 95%,${c.color} 97%,transparent 100%);filter:drop-shadow(0 0 ${f2(8*c.I)}px ${hexA(c.color,.9)});opacity:0`,
      kf:[{offset:0, opacity:1, transform:"scale(1)"}, {offset:.97, opacity:1, transform:"scale(.03)"}, {offset:1, opacity:0, transform:"scale(0)"}], easing:"ease-in"}],
      self:{kf:[{clipPath:"circle(71% at 50% 50%)"}, {clipPath:"circle(0% at 50% 50%)"}], fill:"forwards", easing:"ease-in"}};
  });

  /* 녹음·소멸 */
  X("melt", "녹아내림", {density:true, d:{duration:2400}}, c => ({layers:Array.from({length:Math.round(5 + 4*c.D)}, () => {
    const x = f2(c.rnd()*94), w = f2(2 + c.rnd()*5), h = f2((15 + c.rnd()*35) * c.I), s = f2(.1 + c.rnd()*.3);
    return {css:`left:${x}%;top:100%;width:${w}%;height:0%;border-radius:0 0 50% 50% / 0 0 30% 30%;background:${c.fill};opacity:0`,
      kf:[{offset:0, opacity:1, height:"0%", transform:"translateY(0%)"}, {offset:s, opacity:1, height:"0%", transform:"translateY(0%)", easing:"ease-in"}, {offset:.8, opacity:1, height:`${h}%`, transform:"translateY(0%)", easing:"ease-in"}, {offset:1, opacity:0, height:`${h}%`, transform:"translateY(60%)"}]};
  }), self:{fill:"forwards", easing:"cubic-bezier(.5,0,.8,.6)", kf:[{offset:0, clipPath:"inset(0% 0% 0% 0%)", filter:"brightness(1) blur(0px)"}, {offset:.85, clipPath:"inset(100% 0% 0% 0%)", filter:"brightness(1.15) blur(1px)"}, {offset:1, clipPath:"inset(100% 0% 0% 0%)", filter:"brightness(1.15) blur(1px)"}]}}));
  X("blackhole", "블랙홀 흡수", {d:{duration:2000, color:"#9d7bff"}}, c => ({layers:[
    {css:`${centered(36)};border-radius:50%;background:radial-gradient(closest-side,#000 45%,${hexA(c.color,.9)} 58%,${hexA(c.color,.25)} 75%,transparent 100%);opacity:0`,
      kf:[{offset:0, opacity:0, transform:"scale(0) rotate(0deg)"}, {offset:.25, opacity:1, transform:"scale(1) rotate(180deg)"}, {offset:.75, opacity:1, transform:`scale(${f2(1 + .3*c.I)}) rotate(540deg)`}, {offset:1, opacity:0, transform:"scale(0) rotate(720deg)"}], easing:"ease-in-out"},
    {css:`${centered(60)};border-radius:50%;background:conic-gradient(from 0deg,transparent,${hexA(c.color,.6)},transparent 30%,${hexA(c.color,.4)} 60%,transparent);-webkit-mask:radial-gradient(closest-side,transparent 55%,#000 60%,transparent 100%);mask:radial-gradient(closest-side,transparent 55%,#000 60%,transparent 100%);opacity:0`,
      kf:[{offset:0, opacity:0, transform:"scale(.3) rotate(0deg)"}, {offset:.3, opacity:1, transform:"scale(1) rotate(-240deg)"}, {offset:.8, opacity:.8, transform:"scale(.6) rotate(-720deg)"}, {offset:1, opacity:0, transform:"scale(0) rotate(-900deg)"}], easing:"ease-in-out"}],
    self:{fill:"forwards", easing:"cubic-bezier(.55,0,.85,.4)", kf:[{offset:0, opacity:c.op, filter:"brightness(1)", transform:c.T("scale(1) rotate(0deg)")}, {offset:.2, opacity:c.op, filter:"brightness(1)", transform:c.T("scale(1) rotate(0deg)")}, {offset:.75, opacity:c.op, filter:"brightness(.4)", transform:c.T("scale(.04) rotate(540deg)")}, {offset:.78, opacity:0, filter:"brightness(.4)", transform:c.T("scale(0) rotate(560deg)")}, {offset:1, opacity:0, filter:"brightness(.4)", transform:c.T("scale(0) rotate(560deg)")}]}}));
  X("implodeFlash", "수축 섬광", {d:{duration:1400, color:"#ffffff"}}, c => ({layers:[
    {css:`${centered(30)};border-radius:50%;background:radial-gradient(closest-side,#fff,${hexA(c.color,.8)} 40%,transparent);opacity:0`,
      kf:[{offset:0, opacity:0, transform:"scale(0)"}, {offset:.48, opacity:0, transform:"scale(0)"}, {offset:.55, opacity:1, transform:"scale(1)"}, {offset:.8, opacity:0, transform:`scale(${f2(3*c.I)})`}, {offset:1, opacity:0, transform:`scale(${f2(3*c.I)})`}], easing:"ease-out"},
    {css:`${centered(20)};border-radius:50%;border:2px solid ${c.color};opacity:0`,
      kf:[{offset:0, opacity:0, transform:"scale(0)"}, {offset:.5, opacity:0, transform:"scale(0)"}, {offset:.52, opacity:1, transform:"scale(.5)"}, {offset:.9, opacity:0, transform:`scale(${f2(5*c.I)})`}, {offset:1, opacity:0, transform:`scale(${f2(5*c.I)})`}], easing:"ease-out"}],
    self:{fill:"forwards", kf:[{offset:0, opacity:c.op, filter:"brightness(1)", transform:c.T("scale(1, 1)"), easing:"cubic-bezier(.6,0,.9,.4)"}, {offset:.5, opacity:c.op, filter:"brightness(3)", transform:c.T("scale(.02, .02)")}, {offset:.52, opacity:0, filter:"brightness(3)", transform:c.T("scale(0, 0)")}, {offset:1, opacity:0, filter:"brightness(3)", transform:c.T("scale(0, 0)")}]}}));
  X("glitchDelete", "글리치 삭제", {clip:true, d:{duration:1200, color:"#ff2fd2"}}, c => {
    const pts = [[0,1,0,0,0],[.1,.9,-6,10,30],[.18,1,4,0,0],[.3,.7,8,40,10],[.4,.9,-3,5,50],[.5,.5,10,60,0],[.6,.8,-8,20,30],[.7,.3,6,70,10],[.8,.5,-10,30,50],[.9,.15,12,80,5],[1,0,0,0,0]];
    return {layers:Array.from({length:6}, (_, i) => ({css:`left:0;right:0;top:${f2(c.rnd()*90)}%;height:${f2(3 + c.rnd()*8)}%;background:${hexA(i % 2 ? "#00f0ff" : c.color, .6)};mix-blend-mode:screen;opacity:0`,
      kf:[{offset:0, opacity:0, easing:STEP}, ...Array.from({length:4}, (_, k) => [{offset:f3(.1 + k*.2 + i*.015), opacity:1, transform:`translateX(${f2((c.rnd() - .5) * 30)}%)`, easing:STEP}, {offset:f3(.15 + k*.2 + i*.015), opacity:0, transform:"translateX(0%)", easing:STEP}]).flat(), {offset:1, opacity:0, transform:"translateX(0%)"}].map((k, j, a) => j === 0 ? {...k, transform:"translateX(0%)"} : k)})),
      self:{fill:"forwards", kf:pts.map(([o, a, x, t, b]) => ({offset:o, easing:STEP, opacity:o === 1 ? 0 : f2(c.op * a), transform:c.T(`translateX(${f2(x * c.I)}%)`), clipPath:`inset(${t/2}% 0% ${b/2}% 0%)`}))}};
  });
  X("eraseWipe", "지우개 지움", {clip:true, d:{duration:1500, color:"#ffffff"}}, c => ({layers:[{css:`top:0;bottom:0;left:0;width:${f2(6 + 4*c.I)}%;translate:-50% 0;background:linear-gradient(90deg,transparent,${hexA(c.color,.85)},transparent);opacity:0`,
    kf:[{offset:0, opacity:1, left:"0%"}, {offset:.97, opacity:1, left:"97%"}, {offset:1, opacity:0, left:"100%"}], easing:"ease-in-out"}],
    self:{kf:[{clipPath:"inset(0% 0% 0% 0%)"}, {clipPath:"inset(0% 0% 0% 100%)"}], fill:"forwards", easing:"ease-in-out"}}));
  X("crumple", "구겨져 버려짐", {d:{duration:1800}}, c => ({layers:[], self:{fill:"forwards", easing:"ease-in-out",
    kf:[[0,0,0,0,1,1,1,1],[.25,0,-6,8,.85,.92,.9,1],[.5,0,10,-14,.5,.42,.75,1],[.7,0,-22,12,.22,.2,.6,1],[.8,0,-30,0,.2,.2,.6,1],[1,90,60,0,.15,.15,.6,0]].map(([o, y, r, k, sx, sy, b, a]) =>
      ({offset:o, opacity:f2(c.op * a), filter:`brightness(${b}) contrast(${f2(1 + (1 - sx) * .5)})`, transform:c.T(`translate(0%, ${f2(y * c.I)}%) rotate(${f2(r * c.I)}deg) skewX(${f2(k * c.I)}deg) scale(${f2(sx)}, ${f2(sy)})`)}))}}));
  // 경계선이 지나간 자리에서 알갱이가 생긴다 (경계선은 0~.9 동안 일정한 속도로 움직임)
  const grainsOnEdge = (c, n, fromBottom, move, css) => Array.from({length:n}, () => {
    const x = f2(c.rnd()*100), y = f2(c.rnd()*100), t = f3(clamp((fromBottom ? 100 - y : y) / 100 * .9, .01, .88)), e = f3(Math.min(1, t + .14 + c.rnd()*.12));
    const [dx, dy] = move(c);
    const k = [{offset:0, opacity:0, left:`${x}%`, top:`${y}%`}, {offset:t, opacity:0, left:`${x}%`, top:`${y}%`, easing:STEP}, {offset:f3(t + .005), opacity:1, left:`${x}%`, top:`${y}%`, easing:"ease-in"}, {offset:e, opacity:0, left:`${f2(x + dx)}%`, top:`${f2(y + dy)}%`}];
    if(e < 1) k.push({offset:1, opacity:0, left:`${f2(x + dx)}%`, top:`${f2(y + dy)}%`});
    return {css, kf:k};
  });
  X("scanDisintegrate", "스캔 분해", {density:true, d:{duration:2200, color:"#5ce1ff"}}, c => ({layers:[
    {css:`left:-2%;right:-2%;top:0;height:2px;translate:0 -50%;background:${c.color};box-shadow:0 0 ${f2(10*c.I)}px ${hexA(c.color,.9)},0 0 2px #fff;opacity:0`,
      kf:[{offset:0, opacity:1, top:"100%"}, {offset:.9, opacity:1, top:"0%"}, {offset:1, opacity:0, top:"0%"}]},
    ...grainsOnEdge(c, Math.round(24 + 20*c.D), true, c => [(c.rnd() - .5) * 8, -(15 + c.rnd()*25) * c.I], `width:4px;height:4px;background:${c.color};box-shadow:0 0 5px ${hexA(c.color,.9)};opacity:0`)],
    self:{fill:"forwards", kf:[{offset:0, clipPath:"inset(0% 0% 0% 0%)"}, {offset:.9, clipPath:"inset(0% 0% 100% 0%)"}, {offset:1, clipPath:"inset(0% 0% 100% 0%)"}]}}));
  X("sandFall", "모래처럼 흩어짐", {density:true, d:{duration:2600}}, c => ({layers:grainsOnEdge(c, Math.round(40 + 30*c.D), false, c => [(c.rnd() - .3) * 14 * c.I, (30 + c.rnd()*50) * c.I], `width:3px;height:3px;border-radius:1px;background:${c.fill};opacity:0`),
    self:{fill:"forwards", kf:[{offset:0, clipPath:"inset(0% 0% 0% 0%)"}, {offset:.9, clipPath:"inset(100% 0% 0% 0%)"}, {offset:1, clipPath:"inset(100% 0% 0% 0%)"}]}}));

  /* 폭발 */
  X("explosion", "폭발", {density:true, d:{duration:1800, color:"#ff8a2a"}}, c => {
    const blast = (s, bg, kf, easing = "cubic-bezier(.1,.7,.3,1)") => ({css:`${centered(s)};border-radius:50%;background:${bg};opacity:0`, kf, easing});
    const layers = [
      blast(70, `radial-gradient(closest-side,rgba(60,60,60,.7),rgba(40,40,40,.35) 60%,transparent)`, [{offset:0, opacity:0, transform:"translateY(0%) scale(.3)"}, {offset:.15, opacity:.9, transform:"translateY(0%) scale(.8)"}, {offset:1, opacity:0, transform:`translateY(${f2(-40*c.I)}%) scale(${f2(1.8*c.I)})`}], "ease-out"),
      blast(90, `radial-gradient(closest-side,#fff3c4,${c.color} 35%,rgba(160,30,0,.8) 65%,transparent)`, [{offset:0, opacity:1, transform:"scale(.2)"}, {offset:.25, opacity:1, transform:`scale(${f2(1.1*c.I)})`}, {offset:.55, opacity:0, transform:`scale(${f2(1.4*c.I)})`}, {offset:1, opacity:0, transform:`scale(${f2(1.4*c.I)})`}]),
      blast(50, `radial-gradient(closest-side,#fff,rgba(255,255,255,.6) 50%,transparent)`, [{offset:0, opacity:1, transform:"scale(.3)"}, {offset:.12, opacity:0, transform:`scale(${f2(2*c.I)})`}, {offset:1, opacity:0, transform:`scale(${f2(2*c.I)})`}]),
      {css:`${centered(40)};border-radius:50%;border:${f2(Math.max(1, 3*c.I))}px solid ${hexA("#fff3c4",.9)};opacity:0`, kf:[{offset:0, opacity:.9, transform:"scale(.5)"}, {offset:.5, opacity:0, transform:`scale(${f2(3.5*c.I)})`}, {offset:1, opacity:0, transform:`scale(${f2(3.5*c.I)})`}], easing:"ease-out"}
    ];
    for(let i = 0, n = Math.round(10 + 6*c.D); i < n; i++){
      const a = c.rnd() * 6.283, d = (80 + c.rnd()*160) * c.I, s = f2(3 + c.rnd()*5);
      layers.push({css:`left:50%;top:50%;width:${s}%;aspect-ratio:1;translate:-50% -50%;background:${c.fill};opacity:0`,
        kf:[{offset:0, opacity:1, transform:"translate(0%, 0%) rotate(0deg)"}, {offset:.8, opacity:1, transform:`translate(${f2(Math.cos(a)*d*10)}%, ${f2(Math.sin(a)*d*10 + 300*c.I)}%) rotate(${Math.round((c.rnd() - .5) * 720)}deg)`}, {offset:1, opacity:0, transform:`translate(${f2(Math.cos(a)*d*11)}%, ${f2(Math.sin(a)*d*11 + 500*c.I)}%) rotate(${Math.round((c.rnd() - .5) * 720)}deg)`}], easing:"cubic-bezier(.15,.7,.4,1)"});
    }
    return {layers, self:{fill:"forwards", kf:[{offset:0, visibility:"visible", filter:"brightness(1)"}, {offset:.06, visibility:"visible", filter:"brightness(3)"}, {offset:.08, visibility:"hidden", filter:"brightness(3)"}, {offset:1, visibility:"hidden", filter:"brightness(3)"}]}};
  });
}
