/* 하단 타임라인: 재생 제어 · 눈금 · 애니메이션 트랙 · 재생 위치 탐색 */
import { state, view, $, esc, get, select } from "../core/state.js";
import { PRESET, endTime, normAnim } from "../fx/presets.js";
import { EFFECT, fxEnd, normFx } from "../fx/vfx.js";
import { player, range, toggle, stop, seek, setRate } from "../fx/engine.js";
import { icon } from "./icons.js";

const fmt = ms => { const s = ms / 1000, m = Math.floor(s / 60); return `${String(m).padStart(2,"0")}:${(s - m*60).toFixed(2).padStart(5,"0")}`; };
let lastRange = 0;

function renderRuler(R){
  let h = "";
  const steps = R / 100;
  for(let i = 0; i <= steps; i++){
    const x = i / steps * 100, major = i % 10 === 0;
    if(steps > 100 && !major && i % 5) continue;
    h += `<i class="${major ? "major" : ""}" style="left:${x}%"></i>`;
    if(major && i < steps) h += `<b style="left:${x}%">${i/10}s</b>`;
  }
  $("ruler").innerHTML = h;
}

// 트랙 구조 (요소·애니메이션이 바뀔 때)
function renderTimeline(){
  const R = range(); lastRange = R;
  renderRuler(R);
  const rows = [];
  const row = (n, name, a, end, cls) => {
    const left = a.delay / R * 100, width = isFinite(end) ? (end - a.delay) / R * 100 : 100 - left;
    rows.push(`<div class="tl-row${state.sels.includes(n.id) ? " on" : ""}" data-id="${n.id}">
      <div class="tl-label" title="${esc(n.props.name)} · ${esc(name)}"><span>${esc(n.props.name)}</span><small>${esc(name)}</small></div>
      <div class="tl-lane"><div class="tl-bar${cls}${isFinite(end) ? "" : " inf"}" style="left:${left}%;width:${Math.max(.5, width)}%" title="${esc(name)} · ${a.delay}ms 지연 · ${a.duration}ms${a.iterations > 0 ? " × " + a.iterations : " 무한 반복"}"></div></div>
    </div>`);
  };
  for(const n of state.project.nodes){
    (n.props.anims || []).forEach(raw => { const a = normAnim(raw); row(n, PRESET[a.preset].name, a, endTime(a), ""); });
    (n.props.fx || []).forEach(raw => { const f = normFx(raw); row(n, "VFX · " + EFFECT[f.effect].name, f, fxEnd(f), " fx"); });
  }
  $("tlRows").innerHTML = rows.join("");
  $("tlEmpty").hidden = rows.length > 0;
  updateClock();
}
// 매 프레임 갱신 (시간 표시 · 재생 위치)
function updateClock(){
  if(range() !== lastRange){ renderTimeline(); return; }
  $("tlTime").textContent = fmt(player.t);
  $("playhead").style.left = (player.t / lastRange * 100) + "%";
  $("playhead").hidden = !player.active;
  const b = $("tlPlay");
  if(b.dataset.state !== String(player.playing)){
    b.dataset.state = player.playing;
    b.innerHTML = icon(player.playing ? "pause" : "play");
    b.title = player.playing ? "일시 정지 (Enter)" : "재생 (Enter)";
    b.setAttribute("aria-label", player.playing ? "일시 정지" : "재생");
  }
  $("tlStop").disabled = !player.active;
}

export function initTimeline(){
  view.timeline = renderTimeline; view.clock = updateClock;
  $("tlPlay").onclick = toggle;
  $("tlStop").onclick = stop;
  $("tlRate").onchange = e => setRate(+e.target.value);
  $("tlLoop").onchange = e => { player.loop = e.target.checked; };
  // 눈금이나 트랙 빈 곳을 누르고 끌면 재생 위치를 옮긴다. 막대를 누르면 그 요소를 선택한다.
  $("tlTrack").addEventListener("pointerdown", e => {
    const bar = e.target.closest(".tl-bar"), label = e.target.closest(".tl-label");
    if(bar || label){ const r = e.target.closest(".tl-row"); if(r && get(r.dataset.id)) select(r.dataset.id); return; }
    const lanes = $("ruler").getBoundingClientRect();
    if(e.clientX < lanes.left) return;
    const to = ev => seek((ev.clientX - lanes.left) / lanes.width * range());
    to(e);
    const up = () => { window.removeEventListener("pointermove", to); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", to); window.addEventListener("pointerup", up);
  });
}
