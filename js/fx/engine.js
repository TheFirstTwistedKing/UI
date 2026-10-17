/* 애니메이션·VFX 재생 엔진
   - 편집 중(정지 상태)에는 애니메이션을 붙이지 않아 요소가 기본 상태로 보인다.
     VFX 레이어만 효과마다 정한 한 순간(poster)에 멈춘 모습으로 보여 준다. 요소 자체를 바꾸는 VFX(self)는 붙이지 않는다.
   - 재생·일시정지·탐색 중에는 Web Animations API 애니메이션을 일시정지 상태로 붙이고,
     requestAnimationFrame 하나로 모든 애니메이션의 currentTime을 같은 시계에 맞춘다.
   - 정지하거나 캔버스를 다시 그리면 이전 애니메이션은 모두 cancel()로 정리한다. */
import { state, geo, view, get } from "../core/state.js";
import { build, endTime, newAnim } from "./presets.js";
import { buildFx, fxEnd, fxPoster, newFx, containerCSS } from "./vfx.js";
import { registerAngle } from "./vfx-util.js";

registerAngle(); // 원뿔 그라디언트 회전 각도가 보간되도록

export const player = { t:0, playing:false, active:false, rate:1, loop:true };
let anims = [], raf = 0, last = 0;
let previewId = null, previewAnims = [];
let fxPreviewId = null, fxPreview = [], fxPreviewTimer = 0;
let elementFor = () => null;
export function bindElements(fn){ elementFor = fn; }

// 타임라인 길이: 끝나는 애니메이션·효과 중 가장 늦은 시점을 초 단위로 올림, 최소 5초
export function range(){
  let end = 0;
  for(const n of state.project.nodes){
    for(const a of n.props.anims || []){ const e = endTime(a); if(isFinite(e)) end = Math.max(end, e); }
    for(const f of n.props.fx || []){ const e = fxEnd(f); if(isFinite(e)) end = Math.max(end, e); }
  }
  return Math.max(5000, Math.ceil(end / 1000) * 1000);
}

/* ---------- VFX 레이어 DOM ---------- */
// 효과 하나를 요소 안에 그린다. 반환한 컨테이너의 _b에 레이어별 키프레임·타이밍이 있다.
function mountOne(el, props, f, box, extra){
  const b = buildFx(props, f, box), c = document.createElement("div");
  c.className = "vfx" + (extra ? " " + extra : "");
  c.style.cssText = containerCSS(props, b.clip);
  b.layers.forEach(l => { const d = document.createElement("i"); d.style.cssText = "position:absolute;display:block;" + l.css; l.el = d; c.appendChild(d); });
  c._b = b; c._f = f;
  el.appendChild(c);
  return c;
}
// 효과가 있는 요소마다 컨테이너가 없거나 설정이 바뀌었으면 다시 만든다 (캔버스를 다시 칠하면 컨테이너는 지워진다)
function mountAll(){
  for(const n of state.project.nodes){
    const el = elementFor(n.id); if(!el) continue;
    const list = n.props.visible ? n.props.fx || [] : [], r = geo.L[n.id] || {w:100, h:100};
    const key = JSON.stringify(list) + "|" + Math.round(r.w) + "x" + Math.round(r.h) + "|" + n.props.fill + n.props.fillAlpha + n.props.borderWidth + n.props.rotation + n.props.opacity;
    if(el._fxKey === key && (!list.length || el.querySelector(":scope > .vfx:not(.pv)"))) continue;
    el.querySelectorAll(":scope > .vfx:not(.pv)").forEach(c => { stopPoster(c); c.remove(); });
    el._fxKey = key;
    list.forEach(f => { const c = mountOne(el, n.props, f, r); if(!player.active) startPoster(c); });
  }
}
const play1 = (target, kf, t) => { try{ return target.animate(kf, t); }catch(e){ return null; } };
function startPoster(c){
  const at = fxPoster(c._f); c._posters = [];
  if(at == null) return;
  for(const l of c._b.layers){ if(!l.keyframes) continue; const a = play1(l.el, l.keyframes, l.timing); if(a){ a.pause(); a.currentTime = at; c._posters.push(a); } }
}
function stopPoster(c){ (c._posters || []).forEach(a => a.cancel()); c._posters = null; }
const fxContainers = () => document.querySelectorAll("#screen .vfx:not(.pv)");

function clear(){ anims.forEach(a => a.cancel()); anims = []; }
// 캔버스를 다시 그린 뒤 호출된다
export function attach(){
  clear();
  mountAll();
  if(player.active){
    fxContainers().forEach(stopPoster);
    const add = (target, kf, t) => { const a = play1(target, kf, t); if(a){ a.pause(); a.currentTime = player.t; anims.push(a); } };
    for(const n of state.project.nodes){
      if(!n.props.visible) continue;
      const el = elementFor(n.id); if(!el) continue;
      for(const a of n.props.anims || []){ const {keyframes, timing} = build(n.props, a); add(el, keyframes, timing); }
      for(const c of el.querySelectorAll(":scope > .vfx:not(.pv)")){
        const b = c._b;
        if(b.self) add(el, b.self.keyframes, b.self.timing);
        for(const l of b.layers) if(l.keyframes) add(l.el, l.keyframes, l.timing);
      }
    }
  }
  attachPreview(); attachFxPreview();
}
function seekAll(){ for(const a of anims) a.currentTime = player.t; view.clock(); }
function tick(now){
  const dt = now - last; last = now;
  player.t += dt * player.rate;
  const R = range();
  if(player.t >= R){
    if(player.loop) player.t %= R;
    else { player.t = R; seekAll(); pause(); return; }
  }
  seekAll();
  if(player.playing) raf = requestAnimationFrame(tick);
}
export function play(){
  if(player.playing) return;
  if(!player.active){ player.active = true; attach(); }
  if(player.t >= range()) player.t = 0;
  player.playing = true; last = performance.now();
  raf = requestAnimationFrame(tick);
  view.clock();
}
export function pause(){ player.playing = false; cancelAnimationFrame(raf); view.clock(); }
export function toggle(){ player.playing ? pause() : play(); }
export function stop(){ pause(); player.t = 0; player.active = false; clear(); fxContainers().forEach(c => { stopPoster(c); startPoster(c); }); view.clock(); }
export function seek(t){
  player.t = Math.max(0, Math.min(range(), t));
  if(!player.active){ player.active = true; attach(); } else seekAll();
  view.clock();
}
export function setRate(r){ player.rate = r; }

/* ---------- 라이브러리 미리보기 (저장하지 않는 임시 재생) ---------- */
// 선택한 요소에 프리셋을 반복 재생해 적용 전에 확인한다. 등장·퇴장처럼 한 번 끝나는 효과는 쉬었다가 다시 재생한다.
export function setPreview(id){ previewId = id; attachPreview(); }
function attachPreview(){
  previewAnims.forEach(a => a.cancel()); previewAnims = [];
  if(!previewId) return;
  for(const id of state.sels){
    const n = get(id), el = elementFor(id); if(!n || !el) continue;
    const {keyframes, timing} = build(n.props, newAnim(previewId));
    const once = isFinite(timing.iterations);
    try{ previewAnims.push(el.animate(keyframes, {...timing, delay:0, iterations:Infinity, endDelay:once ? 500 : 0, fill:"none"})); }catch(e){}
  }
}
// 목록의 작은 견본 요소에서 재생 (마우스를 올린 항목 하나만)
export function swatch(el, id){
  if(el._an){ el._an.cancel(); el._an = null; }
  if(!id) return;
  const {keyframes, timing} = build({rotation:0, opacity:1}, newAnim(id));
  try{ el._an = el.animate(keyframes, {...timing, delay:0, iterations:Infinity, endDelay:isFinite(timing.iterations) ? 400 : 0, fill:"none"}); }catch(e){}
}

/* VFX 미리보기: 요소 안에 임시 컨테이너(.pv)를 만들어 실시간으로 재생한다.
   한 번 끝나는 효과(파괴 등)는 끝난 뒤 잠깐 쉬고 처음부터 다시 재생한다. */
function runLive(el, props, f, box){
  const c = mountOne(el, props, {...f, delay:0}, box, "pv"), b = c._b, list = [];
  if(b.self){ const a = play1(el, b.self.keyframes, b.self.timing); if(a) list.push(a); }
  for(const l of b.layers) if(l.keyframes){ const a = play1(l.el, l.keyframes, l.timing); if(a) list.push(a); }
  return {c, list, cycle:isFinite(b.timing.iterations) ? b.timing.duration * b.timing.iterations + 700 : 0};
}
const endLive = h => { h.list.forEach(a => a.cancel()); h.c.remove(); };
export function setFxPreview(id){ fxPreviewId = id; attachFxPreview(); }
function attachFxPreview(){
  fxPreview.forEach(endLive); fxPreview = []; clearTimeout(fxPreviewTimer);
  if(!fxPreviewId) return;
  let cycle = 0;
  for(const id of state.sels){
    const n = get(id), el = elementFor(id); if(!n || !el) continue;
    const h = runLive(el, n.props, newFx(fxPreviewId), geo.L[id] || {w:100, h:100});
    fxPreview.push(h); cycle = h.cycle;
  }
  if(cycle) fxPreviewTimer = setTimeout(attachFxPreview, cycle);
}
const SWATCH = {fill:"#e9d8a6", fillAlpha:.22, rotation:0, opacity:1, borderWidth:0};
export function fxSwatch(el, id){
  if(el._h){ endLive(el._h); clearTimeout(el._t); el._h = null; }
  if(!id) return;
  const loop = () => { if(el._h) endLive(el._h); el._h = runLive(el, SWATCH, {...newFx(id), seed:7}, {w:22, h:22}); if(el._h.cycle) el._t = setTimeout(loop, el._h.cycle); };
  loop();
}
