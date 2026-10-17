/* VFX 효과 정의.
   각 효과는 요소 위에 겹치는 레이어(.vfx 컨테이너 안의 블록)와, 필요하면 요소 자체의 키프레임(self)을 만든다.
   - 레이어 위치·크기·이동량은 %로 지정해 내보낸 페이지에서 요소 크기가 달라져도 모양이 유지된다.
   - 같은 결과를 편집기(Web Animations API)와 내보내기(CSS @keyframes)가 함께 쓴다.
   - 파티클·파편의 무작위 배치는 seed로 고정되어 다시 열어도, 내보내도 같다.
   - 키프레임 일부에 offset을 주면 모든 키프레임에 offset을 준다 (CSS 변환 단순화). */

import { clamp, f2, hexA, rng, STEP, flicker, windows, NOISE } from "./vfx-util.js";
import { extraEffects } from "./vfx-lib/index.js";
export { hexA };

export const VFX_CATEGORIES = ["빛", "홀로그램", "파티클", "에너지", "날씨·자연", "테두리", "오류", "글리치", "파괴"];

/* 효과 정의
   d: 기본 설정, clip: 요소 밖으로 나가지 않게 자름, poster: 편집 화면에서 보여 줄 순간(지속 시간 대비 비율, null이면 숨김),
   tail: 레이어가 시차를 두고 시작해 끝나는 시점이 지속 시간보다 늦을 수 있음,
   make(c) → {layers:[{css, kf, at, dur, easing, fill}], self:{kf, fill}} */
export const EFFECTS = [
  {id:"neonGlow", name:"네온 글로우", cat:"빛", color:true, poster:.25, d:{duration:2000, iterations:0, color:"#5ce1ff"},
    make:c => ({layers:[{css:`inset:0;border-radius:inherit;box-shadow:0 0 ${f2(6*c.I)}px ${hexA(c.color,.95)},0 0 ${f2(22*c.I)}px ${hexA(c.color,.6)},inset 0 0 ${f2(12*c.I)}px ${hexA(c.color,.45)}`,
      kf:[{offset:0, opacity:1}, {offset:.45, opacity:.5}, {offset:.5, opacity:.9}, {offset:.55, opacity:.45}, {offset:1, opacity:1}], easing:"ease-in-out"}]})},
  {id:"shine", name:"빛 반사", cat:"빛", clip:true, color:true, poster:.3, d:{duration:2600, iterations:0, color:"#ffffff"},
    make:c => {
      const w = 28, end = f2(100 / w * 100 + 40);
      return {layers:[{css:`top:-10%;bottom:-10%;left:0;width:${w}%;background:linear-gradient(90deg,transparent,${hexA(c.color,.55*Math.min(c.I,1.6))} 50%,transparent);mix-blend-mode:screen;opacity:0`,
        kf:[{offset:0, opacity:1, transform:"translateX(-140%) skewX(-20deg)"}, {offset:.55, opacity:1, transform:`translateX(${end}%) skewX(-20deg)`}, {offset:1, opacity:1, transform:`translateX(${end}%) skewX(-20deg)`}], easing:"ease-in-out"}]};
    }},
  {id:"bloom", name:"블룸", cat:"빛", color:true, poster:.5, d:{duration:2800, iterations:0, color:"#e9d8a6"},
    make:c => ({layers:[{css:`inset:-25%;background:radial-gradient(closest-side,${hexA(c.color,.5*c.I)},${hexA(c.color,.15*c.I)} 55%,transparent);mix-blend-mode:screen;opacity:.6`,
      kf:[{transform:"scale(.85)", opacity:.45}, {transform:`scale(${f2(1 + .12*c.I)})`, opacity:1}, {transform:"scale(.85)", opacity:.45}], easing:"ease-in-out"}]})},

  {id:"scanlines", name:"스캔라인", cat:"홀로그램", clip:true, color:true, poster:.4, d:{duration:3000, iterations:0, color:"#7df9ff"},
    make:c => ({layers:[
      {css:`inset:0;background:repeating-linear-gradient(to bottom,${hexA(c.color,.2*c.I)} 0 1px,transparent 1px 4px)`,
        kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"0px 32px"}], easing:"linear"},
      {css:`left:0;right:0;top:0;height:18%;background:linear-gradient(to bottom,transparent,${hexA(c.color,.28*c.I)} 50%,transparent);opacity:0`,
        kf:[{offset:0, opacity:1, transform:"translateY(-100%)"}, {offset:.7, opacity:1, transform:"translateY(560%)"}, {offset:1, opacity:1, transform:"translateY(560%)"}], easing:"ease-in-out"}]})},
  {id:"holoShimmer", name:"홀로그램 광택", cat:"홀로그램", clip:true, poster:.35, d:{duration:3200, iterations:0},
    make:c => ({layers:[{css:`inset:0;border-radius:inherit;background:linear-gradient(115deg,transparent 20%,rgba(0,255,255,.45) 34%,rgba(255,0,200,.4) 48%,rgba(255,240,0,.4) 62%,transparent 78%);background-size:300% 100%;mix-blend-mode:color-dodge;opacity:${f2(clamp(.6*c.I,0,1))}`,
      kf:[{backgroundPosition:"100% 0%"}, {backgroundPosition:"0% 0%"}], easing:"ease-in-out"}]})},
  {id:"holoGrid", name:"홀로그램 격자", cat:"홀로그램", clip:true, color:true, poster:.5, d:{duration:2000, iterations:0, color:"#7df9ff"},
    make:c => ({layers:[{css:`inset:0;background-image:linear-gradient(${hexA(c.color,.4*c.I)} 1px,transparent 1px),linear-gradient(90deg,${hexA(c.color,.4*c.I)} 1px,transparent 1px);background-size:20px 20px;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 30%,#000 70%,transparent);mask-image:linear-gradient(to bottom,transparent,#000 30%,#000 70%,transparent)`,
      kf:[{backgroundPosition:"0px 0px", opacity:.55}, {backgroundPosition:"0px 10px", opacity:1}, {backgroundPosition:"0px 20px", opacity:.55}], easing:"linear"}]})},

  {id:"sparks", name:"불꽃 상승", cat:"파티클", color:true, density:true, tail:true, poster:1.5, d:{duration:1800, iterations:0, color:"#ffd27a"},
    make:c => ({layers:Array.from({length:Math.round(10 + 10*c.D)}, () => {
      const x = f2(5 + c.rnd()*90), s = f2(1.2 + c.rnd()*2), dx = f2((c.rnd() - .5) * 30 * c.I), dy = f2(-(50 + c.rnd()*50) * Math.max(.3, c.I));
      return {css:`inset:0;opacity:0;background:radial-gradient(circle at ${x}% 100%,${c.color} 0 ${s}px,${hexA(c.color,.35)} ${f2(s*1.6)}px,transparent ${f2(s*3)}px)`,
        kf:[{offset:0, opacity:0, transform:"translate(0%, 0%)"}, {offset:.15, opacity:1, transform:`translate(${f2(dx*.15)}%, ${f2(dy*.15)}%)`}, {offset:1, opacity:0, transform:`translate(${dx}%, ${dy}%)`}],
        at:c.rnd(), dur:.6 + c.rnd()*.5, easing:"cubic-bezier(.2,.6,.4,1)"};
    })})},
  {id:"dust", name:"떠다니는 먼지", cat:"파티클", color:true, density:true, tail:true, poster:1.5, d:{duration:6000, iterations:0, color:"#ffffff"},
    make:c => ({layers:Array.from({length:Math.round(12 + 12*c.D)}, () => {
      const x = f2(c.rnd()*100), y = f2(c.rnd()*100), s = f2(.8 + c.rnd()*1.4), dx = f2((c.rnd() - .5) * 16 * c.I), dy = f2(-(5 + c.rnd()*15) * c.I);
      return {css:`inset:0;opacity:0;background:radial-gradient(circle at ${x}% ${y}%,${hexA(c.color,.9)} 0 ${s}px,transparent ${f2(s*2.4)}px)`,
        kf:[{opacity:0, transform:"translate(0%, 0%)"}, {opacity:.8, transform:`translate(${f2(dx/2)}%, ${f2(dy/2)}%)`}, {opacity:0, transform:`translate(${dx}%, ${dy}%)`}],
        at:c.rnd(), dur:.6 + c.rnd()*.4, easing:"ease-in-out"};
    })})},
  {id:"twinkle", name:"반짝임", cat:"파티클", color:true, density:true, tail:true, poster:1.3, d:{duration:2400, iterations:0, color:"#fff4d0"},
    make:c => ({layers:Array.from({length:Math.round(6 + 8*c.D)}, () => {
      const x = f2(c.rnd()*100), y = f2(c.rnd()*100), s = f2((1.5 + c.rnd()*2.5) * Math.max(.4, c.I));
      const g = `radial-gradient(circle at ${x}% ${y}%,#fff 0 ${f2(s*.4)}px,${hexA(c.color,.9)} ${f2(s*.7)}px,transparent ${f2(s*2.2)}px)`;
      return {css:`inset:0;opacity:0;transform-origin:${x}% ${y}%;background:${g}`,
        kf:[{opacity:0, transform:"scale(.2) rotate(0deg)"}, {opacity:1, transform:"scale(1) rotate(45deg)"}, {opacity:0, transform:"scale(.2) rotate(90deg)"}],
        at:c.rnd(), dur:.35 + c.rnd()*.3, easing:"ease-in-out"};
    })})},
  {id:"embers", name:"불티", cat:"파티클", color:true, density:true, tail:true, poster:1.5, d:{duration:3200, iterations:0, color:"#ff7a2f"},
    make:c => ({layers:Array.from({length:Math.round(8 + 10*c.D)}, () => {
      const x = f2(c.rnd()*100), s = f2(1 + c.rnd()*1.8), sw = f2((4 + c.rnd()*8) * c.I), up = -(70 + c.rnd()*40) * Math.max(.3, c.I);
      return {css:`inset:0;opacity:0;background:radial-gradient(circle at ${x}% 100%,#fff2c0 0 ${f2(s*.5)}px,${c.color} ${s}px,${hexA(c.color,.3)} ${f2(s*2)}px,transparent ${f2(s*3.5)}px)`,
        kf:[0, .25, .5, .75, 1].map((o, i) => ({offset:o, opacity:i === 0 || i === 4 ? 0 : 1 - o*.6, transform:`translate(${f2([0, sw, -sw*.6, sw*.8, -sw*.3][i])}%, ${f2(up*o)}%)`})),
        at:c.rnd(), dur:.6 + c.rnd()*.4, easing:"linear"};
    })})},

  {id:"energyRing", name:"에너지 고리", cat:"에너지", color:true, poster:.4, d:{duration:1800, iterations:0, color:"#e9d8a6"},
    make:c => ({layers:[0, 1/3, 2/3].map(at => ({css:`inset:0;border-radius:inherit;border:${f2(Math.max(1, 2*c.I))}px solid ${c.color};box-shadow:0 0 ${f2(8*c.I)}px ${hexA(c.color,.6)};opacity:0`,
      kf:[{transform:"scale(1)", opacity:.9}, {transform:`scale(${f2(1 + .35*c.I)})`, opacity:0}], at, easing:"cubic-bezier(.2,.6,.3,1)"}))})},
  {id:"energyBorder", name:"에너지 테두리", cat:"에너지", color:true, poster:.3, d:{duration:900, iterations:0, color:"#5ce1ff"},
    make:c => {
      const g = f2(Math.max(1.5, 3*c.I)), p = 16.97;
      return {layers:[{css:`inset:${-g}px;padding:${g}px;border-radius:inherit;background:repeating-linear-gradient(45deg,${c.color} 0 6px,${hexA(c.color,.12)} 6px 12px);filter:drop-shadow(0 0 ${f2(4*c.I)}px ${hexA(c.color,.8)});-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude`,
        kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:`${p}px 0px`}], easing:"linear"}]};
    }},
  {id:"chargeUp", name:"충전", cat:"에너지", color:true, poster:.8, d:{duration:1600, iterations:0, color:"#9d7bff"},
    make:c => ({layers:[{css:`inset:0;border-radius:inherit;background:radial-gradient(closest-side,transparent 40%,${hexA(c.color,.45*c.I)});opacity:0`,
      kf:[{offset:0, opacity:0, boxShadow:`0 0 0px 0px ${hexA(c.color,0)}`}, {offset:.85, opacity:1, boxShadow:`0 0 ${f2(28*c.I)}px ${f2(5*c.I)}px ${hexA(c.color,.75)}`},
        {offset:1, opacity:0, boxShadow:`0 0 ${f2(44*c.I)}px ${f2(14*c.I)}px ${hexA(c.color,0)}`}], easing:"cubic-bezier(.5,0,.75,0)"}]})},

  {id:"errorFlash", name:"오류 경고", cat:"오류", color:true, poster:.04, d:{duration:1400, iterations:0, color:"#ff2d3d"},
    make:c => ({layers:[{css:`inset:0;border-radius:inherit;background:${hexA(c.color,.32*c.I)};box-shadow:inset 0 0 0 ${f2(Math.max(1, 2*c.I))}px ${c.color},0 0 ${f2(18*c.I)}px ${hexA(c.color,.55)};opacity:0`,
      kf:flicker([[0,.08],[.16,.24],[.32,.38]], {opacity:1}, {opacity:0})}]})},
  {id:"warningStripes", name:"위험 줄무늬", cat:"오류", clip:true, color:true, poster:.3, d:{duration:1000, iterations:0, color:"#ffb020"},
    make:c => ({layers:[{css:`inset:0;background:repeating-linear-gradient(-45deg,${hexA(c.color,.5*c.I)} 0 10px,${hexA("#000000",.35*c.I)} 10px 20px)`,
      kf:[{backgroundPosition:"0px 0px"}, {backgroundPosition:"28.28px 0px"}], easing:"linear"}]})},
  {id:"staticNoise", name:"화면 잡음", cat:"오류", clip:true, poster:.2, d:{duration:500, iterations:0},
    make:c => ({layers:[{css:`inset:0;border-radius:inherit;background-image:${NOISE};opacity:${f2(clamp(.3*c.I,0,1))}`,
      kf:Array.from({length:7}, (_, i) => ({offset:f2(i/6), easing:STEP, backgroundPosition:`${Math.round(c.rnd()*140)}px ${Math.round(c.rnd()*140)}px`}))}]})},

  {id:"rgbSplit", name:"RGB 분리", cat:"글리치", d:{duration:1400, iterations:0},
    make:c => {
      const pts = [0, .08, .14, .22, .5, .56, .62, .7, 1];
      return {layers:[], self:{kf:pts.map((o, i) => {
        const x = i === 0 || i === pts.length - 1 || i % 3 === 0 ? 0 : f2((1.5 + c.rnd()*4) * c.I * (c.rnd() < .5 ? -1 : 1));
        return {offset:o, easing:STEP, filter:`drop-shadow(${x}px 0 0 rgba(255,0,70,.85)) drop-shadow(${-x}px 0 0 rgba(0,240,255,.85))`};
      })}};
    }},
  {id:"sliceShift", name:"띠 어긋남", cat:"글리치", clip:true, color:true, density:true, poster:.11, d:{duration:1100, iterations:0, color:"#ff2fd2"},
    make:c => ({layers:Array.from({length:Math.round(4 + 3*c.D)}, (_, i) => {
      const y = f2(c.rnd()*92), h = f2(2 + c.rnd()*9), dx = f2((c.rnd() - .5) * 24 * c.I);
      return {css:`left:0;right:0;top:${y}%;height:${h}%;background:${hexA(i % 2 ? "#00f0ff" : c.color, .45)};mix-blend-mode:screen;opacity:0`,
        kf:flicker(windows(c.rnd, 2, .07, i % 2 ? undefined : .1), {opacity:1, transform:`translateX(${dx}%)`}, {opacity:0, transform:"translateX(0%)"})};
    })})},
  {id:"blockNoise", name:"블록 노이즈", cat:"글리치", clip:true, color:true, density:true, poster:.11, d:{duration:900, iterations:0, color:"#e9d8a6"},
    make:c => ({layers:Array.from({length:Math.round(6 + 6*c.D)}, (_, i) => {
      const col = [c.color, "#ffffff", "#000000", "#00f0ff"][Math.floor(c.rnd()*4)];
      return {css:`left:${f2(c.rnd()*85)}%;top:${f2(c.rnd()*90)}%;width:${f2(5 + c.rnd()*22)}%;height:${f2(3 + c.rnd()*9)}%;background:${hexA(col, .7*Math.min(c.I, 1.4))};opacity:0`,
        kf:flicker(windows(c.rnd, 3, .05, i % 2 ? undefined : .1), {opacity:1}, {opacity:0})};
    })})},

  {id:"shatter", name:"산산조각", cat:"파괴", color:true, density:true, poster:null, d:{duration:1400, iterations:1, color:"#e9d8a6"},
    make:c => {
      // 요소를 격자 삼각형으로 나누고, 중심에서 바깥으로 흩어지게 한다
      const cols = Math.round(3 + 2*c.D), rows = clamp(Math.round(cols * c.h / Math.max(1, c.w)), 2, 8);
      const P = [];
      for(let j = 0; j <= rows; j++){ P.push([]); for(let i = 0; i <= cols; i++){
        const edge = i === 0 || j === 0 || i === cols || j === rows;
        P[j].push([f2(clamp(i/cols*100 + (edge ? 0 : (c.rnd() - .5) * 60/cols), 0, 100)), f2(clamp(j/rows*100 + (edge ? 0 : (c.rnd() - .5) * 60/rows), 0, 100))]);
      }}
      const layers = [];
      for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
        const a = P[j][i], b = P[j][i+1], d = P[j+1][i], e = P[j+1][i+1];
        for(const tri of c.rnd() < .5 ? [[a,b,e],[a,e,d]] : [[a,b,d],[b,e,d]]){
          const cx = f2((tri[0][0] + tri[1][0] + tri[2][0]) / 3), cy = f2((tri[0][1] + tri[1][1] + tri[2][1]) / 3);
          const vx = cx - 50, vy = cy - 50, len = Math.hypot(vx, vy) || 1, dist = (25 + c.rnd()*45) * c.I;
          const lit = f2(.04 + c.rnd()*.14);
          const rot = (c.rnd() - .5) * 220 * c.I;
          layers.push({css:`inset:0;background:linear-gradient(${Math.round(c.rnd()*360)}deg,rgba(255,255,255,${lit}),rgba(0,0,0,${f2(lit*.8)})),${c.fill};clip-path:polygon(${tri.map(p => `${p[0]}% ${p[1]}%`).join(",")});transform-origin:${cx}% ${cy}%;opacity:0`,
            kf:[{offset:0, opacity:1, transform:"translate(0%, 0%) rotate(0deg) scale(1)"},
              {offset:.55, opacity:1, transform:`translate(${f2(vx/len*dist*.6)}%, ${f2(vy/len*dist*.6 + 6*c.I)}%) rotate(${f2(rot*.45)}deg) scale(.88)`},
              {offset:1, opacity:0, transform:`translate(${f2(vx/len*dist)}%, ${f2(vy/len*dist + 25*c.I)}%) rotate(${f2(rot)}deg) scale(.7)`}],
            at:c.rnd()*.06, dur:.94, easing:"cubic-bezier(.15,.7,.35,1)"});
        }
      }
      return {layers, self:{kf:[{visibility:"hidden"}, {visibility:"hidden"}], fill:"forwards"}};
    }},
  {id:"crumble", name:"부서져 떨어짐", cat:"파괴", color:true, density:true, poster:null, d:{duration:1800, iterations:1, color:"#e9d8a6"},
    make:c => {
      const cols = Math.round(8 + 6*c.D), rows = clamp(Math.round(cols * c.h / Math.max(1, c.w)), 2, 14), layers = [];
      for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
        const at = f2(i / cols * .5 + c.rnd() * .1), end = f2(Math.min(1, at + .4 + c.rnd()*.1));
        layers.push({css:`left:${f2(i/cols*100)}%;top:${f2(j/rows*100)}%;width:${f2(100/cols + .3)}%;height:${f2(100/rows + .3)}%;background:${c.fill};opacity:0`,
          kf:[{offset:0, opacity:1, transform:"translate(0px, 0px) rotate(0deg)", easing:"cubic-bezier(.5,0,.75,0)"}, {offset:at, opacity:1, transform:"translate(0px, 0px) rotate(0deg)", easing:"cubic-bezier(.5,0,.75,0)"},
            {offset:end, opacity:0, transform:`translate(${f2((c.rnd() - .5) * 30 * c.I)}px, ${f2((60 + c.rnd()*90) * c.I)}px) rotate(${f2((c.rnd() - .5) * 120)}deg)`},
            {offset:1, opacity:0, transform:"translate(0px, 0px) rotate(0deg)"}]});
      }
      return {layers, self:{kf:[{visibility:"hidden"}, {visibility:"hidden"}], fill:"forwards"}};
    }},
  {id:"burn", name:"불타 사라짐", cat:"파괴", color:true, poster:null, d:{duration:2200, iterations:1, color:"#ff6a00"},
    make:c => ({layers:[
      {css:`left:0;right:0;top:0;height:40%;background:linear-gradient(to bottom,rgba(20,8,0,.92),rgba(40,14,0,.55) 40%,transparent);opacity:0`,
        kf:[{opacity:1, top:"0%"}, {opacity:1, top:"100%"}], easing:"ease-in"},
      {css:`left:-3%;right:-3%;top:0;height:${f2(8 + 6*c.I)}%;transform:translateY(-50%);background:linear-gradient(to bottom,transparent,${c.color} 35%,#fff3c4 50%,${c.color} 65%,transparent);filter:blur(1.5px) drop-shadow(0 0 ${f2(8*c.I)}px ${hexA(c.color,.9)});opacity:0`,
        kf:[{offset:0, opacity:1, top:"0%"}, {offset:.97, opacity:1, top:"97%"}, {offset:1, opacity:0, top:"100%"}], easing:"ease-in"}],
      self:{kf:[{clipPath:"inset(0% 0% 0% 0%)"}, {clipPath:"inset(100% 0% 0% 0%)"}], fill:"forwards", easing:"ease-in"}})},
  {id:"evaporate", name:"증발", cat:"파괴", poster:null, d:{duration:1400, iterations:1},
    make:c => ({layers:[], self:{fill:"forwards", easing:"cubic-bezier(.4,0,.7,.2)", kf:[
      {opacity:c.op, filter:"blur(0px) brightness(1)", transform:c.T("translateY(0px) scale(1)")},
      {opacity:0, filter:`blur(${f2(10*c.I)}px) brightness(${f2(1 + 1.5*c.I)})`, transform:c.T(`translateY(${f2(-24*c.I)}px) scale(${f2(1 + .08*c.I)})`)}]}})}
];
EFFECTS.push(...extraEffects());
export const EFFECT = Object.fromEntries(EFFECTS.map(e => [e.id, e]));

export function newFx(id){
  const e = EFFECT[id];
  return Object.assign({effect:id, duration:1500, delay:0, iterations:0, intensity:1, speed:1, density:1, color:"#e9d8a6", seed:Math.floor(Math.random()*1e9)}, e.d);
}
export const normFx = f => EFFECT[f.effect] ? Object.assign(newFx(f.effect), f) : Object.assign(newFx("neonGlow"), {seed:f.seed || 1});

/* 요소 속성(props), 효과 설정(f), 요소 크기(box)로 레이어와 타이밍을 만든다.
   반환: {clip, layers:[{css, keyframes, timing}], self:{keyframes, timing}|null, timing} */
export function buildFx(props, f, box){
  f = normFx(f);
  const e = EFFECT[f.effect], speed = f.speed > 0 ? f.speed : 1, D = Math.max(1, f.duration / speed);
  const rot = props.rotation || 0;
  const c = {I:Math.max(0, +f.intensity || 0), D:clamp(+f.density || 0, 0, 4), color:f.color, rnd:rng(f.seed), w:box.w || 100, h:box.h || 100,
    op:props.opacity ?? 1, T:s => (rot ? `rotate(${rot}deg) ` : "") + s,
    fill:props.fillAlpha > 0 ? hexA(props.fill, props.fillAlpha) : f.color};
  const out = e.make(c), iters = f.iterations > 0 ? f.iterations : Infinity;
  const timing = {duration:D, delay:Math.max(0, f.delay), iterations:iters};
  return {
    clip:!!e.clip, timing,
    layers:out.layers.map(l => ({css:l.css, keyframes:l.kf || null,
      timing:{duration:Math.max(1, D * (l.dur || 1)), delay:timing.delay + D * (l.at || 0), iterations:iters, direction:"normal", easing:l.easing || "linear", fill:l.fill || "none"}})),
    self:out.self ? {keyframes:out.self.kf, timing:{duration:D, delay:timing.delay, iterations:iters, direction:"normal", easing:out.self.easing || "linear", fill:out.self.fill || "none"}} : null
  };
}
// 효과가 끝나는 시점(ms). 무한 반복이면 Infinity. 시차가 있는 효과는 한 주기만큼 여유를 둔다.
export function fxEnd(f){
  f = normFx(f);
  const D = f.duration / (f.speed || 1);
  return f.iterations > 0 ? f.delay + D * f.iterations + (EFFECT[f.effect].tail ? D : 0) : Infinity;
}
// 편집 화면에서 보여 줄 시점(ms). null이면 정지 상태에서 레이어를 숨긴다.
export function fxPoster(f){
  f = normFx(f);
  const p = EFFECT[f.effect].poster;
  return p == null ? null : f.delay + f.duration / (f.speed || 1) * p;
}
// 컨테이너 기본 스타일: 테두리까지 덮고, 모양(모서리)을 따르며, 요소가 숨겨져도(파괴 효과) 보이게 한다
export const containerCSS = (props, clip) => {
  const b = props.borderWidth > 0 ? props.borderWidth : 0;
  return `position:absolute;inset:${b ? -b + "px" : "0"};pointer-events:none;border-radius:inherit;visibility:visible${clip ? ";overflow:hidden" : ""}`;
};
