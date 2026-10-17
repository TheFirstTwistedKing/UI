/* 애니메이션 재생 엔진
   - 편집 중(정지 상태)에는 아무 애니메이션도 붙이지 않아 요소가 기본 상태로 보인다.
   - 재생·일시정지·탐색 중에는 Web Animations API 애니메이션을 일시정지 상태로 붙이고,
     requestAnimationFrame 하나로 모든 애니메이션의 currentTime을 같은 시계에 맞춘다.
   - 정지하거나 캔버스를 다시 그리면 이전 애니메이션은 모두 cancel()로 정리한다. */
import { state, view, get } from "../core/state.js";
import { build, endTime, newAnim } from "./presets.js";

export const player = { t:0, playing:false, active:false, rate:1, loop:true };
let anims = [], raf = 0, last = 0;
let previewId = null, previewAnims = [];
let elementFor = () => null;
export function bindElements(fn){ elementFor = fn; }

// 타임라인 길이: 끝나는 애니메이션 중 가장 늦은 시점을 초 단위로 올림, 최소 5초
export function range(){
  let end = 0;
  for(const n of state.project.nodes) for(const a of n.props.anims || []){ const e = endTime(a); if(isFinite(e)) end = Math.max(end, e); }
  return Math.max(5000, Math.ceil(end / 1000) * 1000);
}

function clear(){ anims.forEach(a => a.cancel()); anims = []; }
// 캔버스를 다시 그린 뒤 호출된다
export function attach(){
  clear();
  if(player.active){
    for(const n of state.project.nodes){
      if(!n.props.visible || !n.props.anims || !n.props.anims.length) continue;
      const el = elementFor(n.id); if(!el) continue;
      for(const a of n.props.anims){
        const {keyframes, timing} = build(n.props, a);
        try{ const an = el.animate(keyframes, timing); an.pause(); an.currentTime = player.t; anims.push(an); }catch(e){ /* 잘못된 값은 건너뛴다 */ }
      }
    }
  }
  attachPreview();
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
export function stop(){ pause(); player.t = 0; player.active = false; clear(); view.clock(); }
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
