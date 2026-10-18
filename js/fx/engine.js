/* 애니메이션·VFX 재생 엔진
   - 편집 중(정지 상태)에는 애니메이션을 붙이지 않아 요소가 기본 상태로 보인다.
     VFX 레이어만 효과마다 정한 한 순간(poster)에 멈춘 모습으로 보여 준다. 요소 자체를 바꾸는 VFX(self)는 붙이지 않는다.
   - 재생·일시정지·탐색 중에는 Web Animations API 애니메이션을 일시정지 상태로 붙이고,
     requestAnimationFrame 하나로 모든 애니메이션의 currentTime을 같은 시계에 맞춘다.
   - 정지하거나 캔버스를 다시 그리면 이전 애니메이션은 모두 cancel()로 정리한다. */
import { state, geo, view, get } from "../core/state.js";
import { build, endTime, newAnim } from "./presets.js";
import { buildFx, fxEnd, fxPoster, newFx, containerCSS } from "./vfx.js";
import { registerAngle, hexA } from "./vfx-util.js";
import { glHost, setGlQuality } from "../gl/host.js";

registerAngle(); // 원뿔 그라디언트 회전 각도가 보간되도록

export const player = { t:0, playing:false, active:false, rate:1, loop:true };
let anims = [], raf = 0, last = 0, tickR = 5000; // tickR: 재생 중에 쓰는 타임라인 길이 (프레임마다 다시 계산하지 않는다)
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
  if(b.gl) mountGl(c, b.gl, f);
  return c;
}
/* WebGL 효과: 컨테이너 안에 2D 캔버스를 두고, 공유 렌더러가 그린 결과를 복사한다.
   WebGL2가 없으면 효과 색의 은은한 빛으로 대신하고 그 사실을 툴팁으로 알린다 (내보낸 HTML과 같은 대체 방식). */
function mountGl(c, g, f){
  const host = glHost();
  if(!host.ok){ c.style.background = `radial-gradient(closest-side,${hexA(f.color, 1/3)},transparent)`; c.title = "이 브라우저는 WebGL2를 지원하지 않아 대체 그림으로 표시합니다"; return; }
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  c.appendChild(cv);
  c._gl = host.add(cv, g.def, g.P);
}
// 타임라인 시각(ms) → 효과 안의 시간(초)과 한 주기 안의 위치. 효과가 시작 전이거나 끝났으면 null
function glTime(c, ms){
  const t = c._b.timing, tl = ms - t.delay;
  if(tl < 0 || tl > t.duration * t.iterations) return null;
  return {t:tl / 1000 * (c._gl.P.speedK || 1), phase:(tl % t.duration) / t.duration};
}
function glDraw(c, ms){
  if(!c._gl) return;
  const r = ms == null ? null : glTime(c, ms);
  r ? glHost().draw(c._gl, r.t, r.phase) : glHost().clear(c._gl);
}
// 효과가 있는 요소마다 컨테이너가 없거나 설정이 바뀌었으면 다시 만든다 (캔버스를 다시 칠하면 컨테이너는 지워진다)
function mountAll(){
  if(glHost().ok) glHost().prune();
  for(const n of state.project.nodes){
    const el = elementFor(n.id); if(!el) continue;
    const list = n.props.visible ? n.props.fx || [] : [], r = geo.L[n.id] || {w:100, h:100};
    const key = JSON.stringify(list) + "|" + Math.round(r.w) + "x" + Math.round(r.h) + "|" + n.props.fill + n.props.fillAlpha + n.props.borderWidth + n.props.rotation + n.props.opacity + "|" + n.props.scaleX + "," + n.props.scaleY;
    if(el._fxKey === key && (!list.length || el.querySelector(":scope > .vfx:not(.pv)"))) continue;
    el.querySelectorAll(":scope > .vfx:not(.pv)").forEach(c => { stopPoster(c); c.remove(); });
    el._fxKey = key;
    list.forEach(f => { const c = mountOne(el, n.props, f, r); if(!player.active) startPoster(c); });
  }
}
const play1 = (target, kf, t) => { try{ return target.animate(kf, t); }catch(e){ return null; } };
function startPoster(c){
  const at = fxPoster(c._f); c._posters = [];
  glDraw(c, at);
  if(at == null) return;
  for(const l of c._b.layers){ if(!l.keyframes) continue; const a = play1(l.el, l.keyframes, l.timing); if(a){ a.pause(); a.currentTime = at; c._posters.push(a); } }
}
function stopPoster(c){ (c._posters || []).forEach(a => a.cancel()); c._posters = null; }
const fxContainers = () => document.querySelectorAll("#screen .vfx:not(.pv)");

function clear(){ anims.forEach(a => a.cancel()); anims = []; }
// 캔버스를 다시 그린 뒤 호출된다
export function attach(){
  clear(); tickR = range();
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
  if(player.active) fxContainers().forEach(c => glDraw(c, player.t));
  attachPreview(); attachFxPreview();
}
// WebGL 품질을 바꾸면 지금 보이는 모습을 새 품질로 다시 그린다
export function setQuality(q){
  setGlQuality(q);
  fxContainers().forEach(c => glDraw(c, player.active ? player.t : fxPoster(c._f)));
}
function seekAll(){ for(const a of anims) a.currentTime = player.t; fxContainers().forEach(c => glDraw(c, player.t)); view.clock(); }
function tick(now){
  const dt = now - last; last = now;
  player.t += dt * player.rate;
  const R = tickR;
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
  player.playing = true; last = performance.now(); tickR = range();
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
// 선택이 바뀌면 고른 견본을 새 선택 요소에서 다시 재생한다
export function refreshPreview(){ attachPreview(); attachFxPreview(); }
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
  if(c._gl){ const t0 = performance.now(); glHost().live(c._gl, true, now => glTime(c, now - t0)); }
  return {c, list, cycle:isFinite(b.timing.iterations) ? b.timing.duration * b.timing.iterations + 700 : 0};
}
const endLive = h => { h.list.forEach(a => a.cancel()); if(h.c._gl){ glHost().live(h.c._gl, false); glHost().drop(h.c._gl); } h.c.remove(); };
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
const SWATCH = {fill:"#73e2ec", fillAlpha:.22, rotation:0, opacity:1, borderWidth:0};
export function fxSwatch(el, id){
  if(el._h){ endLive(el._h); clearTimeout(el._t); el._h = null; }
  if(!id) return;
  const loop = () => { if(el._h) endLive(el._h); el._h = runLive(el, SWATCH, {...newFx(id), seed:7}, {w:22, h:22}); if(el._h.cycle) el._t = setTimeout(loop, el._h.cycle); };
  loop();
}
