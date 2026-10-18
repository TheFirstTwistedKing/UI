/* 직접 그리기 (펜): 캔버스에 마우스·펜·손가락으로 선을 그리면 '그리기' 요소(SVG 경로)가 된다.
   - 그리는 동안 점을 모아 미리 보여 주고, 손을 떼면 점을 줄인 뒤(RDP) 부드러운 곡선(캣멀-롬 → 베지어)으로 바꾼다.
   - 경로는 요소 상자 기준 0~100 좌표로 저장해, 크기를 바꾸면 선도 함께 늘어난다. 선 두께는 크기와 상관없이 그대로다.
   - Shift를 누른 채 그리면 직선. 펜을 켠 동안에는 계속 그릴 수 있고, Esc·P·펜 버튼으로 끈다. */
import { TYPES, state, geo, $, commit, node, uniqueName } from "../core/state.js";
import { computeLayout } from "./canvas.js";
import { modalOpen } from "./toolbar.js";
import { insertParent } from "./tree.js";
import { icon } from "./icons.js";

const KEY = "uiforge.web.pen";
let pen = {color:"#73e2ec", width:3};
try{ Object.assign(pen, JSON.parse(localStorage.getItem(KEY)) || {}); }catch(e){}
let on = false;
export const drawing = () => on;

const r2 = v => Math.round(v * 100) / 100;
// 점 줄이기 (Ramer–Douglas–Peucker): 선에서 eps보다 가까운 점은 버린다
function simplify(pts, eps){
  if(pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while(st.length){
    const [a, b] = st.pop(), [ax, ay] = pts[a], [bx, by] = pts[b], L = Math.hypot(bx - ax, by - ay) || 1;
    let md = 0, mi = -1;
    for(let i = a + 1; i < b; i++){ const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L; if(d > md){ md = d; mi = i; } }
    if(md > eps){ keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// 점들을 지나는 부드러운 경로 (캣멀-롬 스플라인을 3차 베지어로)
function smoothPath(p){
  if(p.length < 3) return `M${p.map(q => q.join(" ")).join("L")}`;
  let d = `M${p[0][0]} ${p[0][1]}`;
  for(let i = 0; i < p.length - 1; i++){
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    d += `C${r2(b[0] + (c[0] - a[0]) / 6)} ${r2(b[1] + (c[1] - a[1]) / 6)} ${r2(c[0] - (e[0] - b[0]) / 6)} ${r2(c[1] - (e[1] - b[1]) / 6)} ${c[0]} ${c[1]}`;
  }
  return d;
}
/* 아트보드 좌표의 점들 → 부모 기준 위치·크기와 0~100 경로. 너비나 높이가 0에 가까운 선(가로·세로 직선)은 1px로 둔다. */
export function strokeToNode(pts, parentRect, width){
  const s = simplify(pts, Math.max(.6, width * .25));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for(const [x, y] of s){ x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  let w = x1 - x0, h = y1 - y0;
  if(w < 1){ x0 -= .5; w = 1; } if(h < 1){ y0 -= .5; h = 1; }
  const norm = s.map(([x, y]) => [r2((x - x0) / w * 100), r2((y - y0) / h * 100)]);
  return {x:r2(x0 - parentRect.x), y:r2(y0 - parentRect.y), w:r2(w), h:r2(h), path:smoothPath(norm)};
}

function setPen(v){
  on = v;
  $("penBtn").setAttribute("aria-pressed", v);
  $("penOpts").hidden = !v;
  $("stage").classList.toggle("drawing", v);
}
const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(pen)); }catch(e){} };

export function initDraw(){
  $("insert").insertAdjacentHTML("beforeend", `<button type="button" id="penBtn" aria-pressed="false" title="직접 그리기 (P) · Shift: 직선 · Esc: 끝내기" aria-label="직접 그리기">${icon("draw")}<span>그리기</span></button>`);
  $("penColor").value = pen.color; $("penWidth").value = pen.width;
  $("penBtn").onclick = () => setPen(!on);
  $("penColor").oninput = e => { pen.color = e.target.value; save(); };
  $("penWidth").oninput = e => { const v = +e.target.value; if(v >= .5 && v <= 60){ pen.width = v; save(); } };
  window.addEventListener("keydown", e => {
    if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.key === "Escape" && on) setPen(false);
    else if(e.key.toLowerCase() === "p" && !modalOpen()) setPen(!on);
  });
  // 펜이 켜져 있으면 선택·이동보다 먼저 받아 그린다 (캡처 단계)
  $("screen").addEventListener("pointerdown", e => {
    if(!on || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const scr = $("screen"), at = ev => { const r = scr.getBoundingClientRect(); return [r2((ev.clientX - r.left) / geo.scale), r2((ev.clientY - r.top) / geo.scale)]; };
    const pts = [at(e)];
    // 그리는 동안 보이는 미리보기 선
    const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), pl = document.createElementNS(NS, "polyline");
    svg.setAttribute("class", "pen-live"); svg.setAttribute("width", geo.root.w); svg.setAttribute("height", geo.root.h);
    pl.setAttribute("fill", "none"); pl.setAttribute("stroke", pen.color); pl.setAttribute("stroke-width", pen.width);
    pl.setAttribute("stroke-linecap", "round"); pl.setAttribute("stroke-linejoin", "round");
    svg.appendChild(pl); scr.appendChild(svg);
    const show = list => pl.setAttribute("points", list.map(p => p.join(",")).join(" "));
    let straight = false;
    const mv = ev => {
      const evs = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev];
      for(const c of evs.length ? evs : [ev]) pts.push(at(c));
      straight = ev.shiftKey;
      show(straight ? [pts[0], pts[pts.length - 1]] : pts);
    };
    const up = () => {
      window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      svg.remove();
      const list = straight ? [pts[0], pts[pts.length - 1]] : pts;
      const [a, b] = [list[0], list[list.length - 1]];
      if(list.length < 2 || (list.length < 4 && Math.hypot(b[0] - a[0], b[1] - a[1]) < 2)) return; // 그냥 누른 것
      computeLayout();
      // 선택한 컨테이너 안에서 그리기 시작하면 그 안에, 아니면 페이지에 넣는다
      let parent = insertParent(), pr = parent ? geo.I[parent] : geo.root;
      if(parent && !(a[0] >= pr.x && a[0] <= pr.x + pr.w && a[1] >= pr.y && a[1] <= pr.y + pr.h)){ parent = null; pr = geo.root; }
      const g = strokeToNode(list, pr, pen.width);
      const n = node("draw", parent, {name:uniqueName(TYPES.draw.label), x:g.x, y:g.y, w:g.w, h:g.h, path:g.path, borderColor:pen.color, fill:pen.color, borderWidth:pen.width});
      commit(() => { state.project.nodes.push(n); state.sel = n.id; state.sels = [n.id]; });
    };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  }, true);
}
