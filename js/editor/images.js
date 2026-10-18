/* 이미지 넣기: 파일 고르기 · 캔버스로 끌어 놓기 · 붙여넣기(Ctrl+V).
   - 이미지는 원본 비율 그대로, 페이지의 60%를 넘지 않는 크기로 들어간다.
   - 아주 큰 사진은 긴 변 2000px로 줄여 저장한다 (프로젝트가 브라우저 저장 공간에 함께 저장되므로).
     GIF(움직이는 그림)와 SVG는 그대로 둔다. */
import { TYPES, state, geo, view, $, get, commit, node, uniqueName, toast } from "../core/state.js";
import { computeLayout } from "./canvas.js";
import { insertParent } from "./tree.js";

const MAX_SIDE = 2000, MAX_BYTES = 1.5 * 1024 * 1024;
const clamp = (v, a, b) => Math.max(a, Math.min(Math.max(a, b), v));
const isImage = f => f && /^image\//.test(f.type);
const readURL = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(r.error); r.readAsDataURL(f); });
export const imageSize = src => new Promise(ok => { const im = new Image(); im.onload = () => ok({w:im.naturalWidth, h:im.naturalHeight, im}); im.onerror = () => ok(null); im.src = src; });

// 파일 → {src, w, h}. 큰 사진만 줄여서 다시 저장한다 (줄인 결과가 더 크면 원본을 쓴다)
export async function readImage(f){
  const src = await readURL(f), s = await imageSize(src);
  if(!s) throw new Error("이미지를 읽을 수 없습니다");
  if(/gif|svg/.test(f.type) || (Math.max(s.w, s.h) <= MAX_SIDE && f.size <= MAX_BYTES)) return {src, w:s.w, h:s.h};
  const k = Math.min(1, MAX_SIDE / Math.max(s.w, s.h)), w = Math.round(s.w * k), h = Math.round(s.h * k);
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  cv.getContext("2d").drawImage(s.im, 0, 0, w, h);
  let out = cv.toDataURL("image/webp", .9);
  if(!out.startsWith("data:image/webp")) out = cv.toDataURL(f.type === "image/png" ? "image/png" : "image/jpeg", .9); // webp를 못 만드는 브라우저
  return {src:out.length < src.length ? out : src, w, h};
}
// 원본 비율을 지키며 최대 크기 안에 맞춘다
export function fitSize(w, h, maxW, maxH){
  const k = Math.min(1, maxW / w, maxH / h);
  return {w:Math.max(1, Math.round(w * k)), h:Math.max(1, Math.round(h * k))};
}

/* 여러 파일을 한 번에 넣는다. at: 아트보드 좌표(놓은 위치, 이미지 가운데). 없으면 보이는 화면 가운데. */
export async function insertImages(files, at){
  files = [...files].filter(isImage);
  if(!files.length) return 0;
  const imgs = [];
  for(const f of files){ try{ imgs.push(await readImage(f)); }catch(e){ toast(`${f.name}: 이미지를 읽을 수 없습니다`); } }
  if(!imgs.length) return 0;
  computeLayout();
  if(!at){
    const r = $("stage").getBoundingClientRect(), s = $("screen").getBoundingClientRect();
    at = [Math.min(geo.root.w, Math.max(0, (r.left + r.width / 2 - s.left) / geo.scale)), Math.min(geo.root.h, Math.max(0, (r.top + r.height / 2 - s.top) / geo.scale))];
  }
  // 놓은 곳이 선택한 컨테이너 안이면 그 안에, 아니면 페이지에 넣는다
  let parent = insertParent(), pr = parent ? geo.I[parent] : geo.root;
  if(parent && !(at[0] >= pr.x && at[0] <= pr.x + pr.w && at[1] >= pr.y && at[1] <= pr.y + pr.h)){ parent = null; pr = geo.root; }
  const nodes = imgs.map((m, i) => {
    const z = fitSize(m.w, m.h, geo.root.w * .6, geo.root.h * .6);
    return node("image", parent, {name:uniqueName(TYPES.image.label), src:m.src, fit:"cover", w:z.w, h:z.h,
      // 놓은 곳을 가운데로 하되, 부모 밖으로 나가지 않게 맞춘다
      x:Math.round(clamp(at[0] - pr.x - z.w / 2, 0, pr.w - z.w) + i * 24), y:Math.round(clamp(at[1] - pr.y - z.h / 2, 0, pr.h - z.h) + i * 24)});
  });
  commit(() => { state.project.nodes.push(...nodes); state.sels = nodes.map(n => n.id); state.sel = nodes[nodes.length - 1].id; });
  toast(`이미지 ${nodes.length}개를 넣었습니다`);
  return nodes.length;
}

// 선택한 이미지 요소의 파일을 바꾸고, 크기를 새 이미지 비율에 맞춘다 (너비는 그대로)
export async function replaceImage(n, f){
  if(!isImage(f)) return;
  const m = await readImage(f);
  commit(() => { n.props.src = m.src; if(n.props.wu === "px" && n.props.hu === "px") n.props.h = Math.max(1, Math.round(n.props.w * m.h / m.w)); });
  toast("이미지를 넣었습니다");
}
// 원본 비율로 높이를 맞춘다
export async function fitRatio(n){
  const s = n.props.src && await imageSize(n.props.src);
  if(!s){ toast("이미지를 불러올 수 없어 비율을 알 수 없습니다"); return; }
  computeLayout();
  const r = geo.L[n.id];
  commit(() => {
    const h = r.w * s.h / s.w;
    n.props.h = n.props.hu === "%" ? Math.round(h / (r.h || 1) * n.props.h * 1000) / 1000 : Math.round(h);
  });
}

// 이미지 넣기 버튼이 고를 파일 창 (고른 뒤 방금 만든 자리 표시 요소를 채운다)
export function pickInto(id){
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*";
  inp.onchange = () => { const n = get(id); if(n && inp.files[0]) replaceImage(n, inp.files[0]).catch(() => toast("이미지를 읽을 수 없습니다")); };
  inp.click();
}

export function initImages(){
  view.pickImage = pickInto;
  const stage = $("stage"), hasFiles = e => [...(e.dataTransfer?.types || [])].includes("Files");
  // 끌어 놓기: 놓은 위치에 넣는다
  stage.addEventListener("dragover", e => { if(!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; stage.classList.add("dropping"); });
  stage.addEventListener("dragleave", e => { if(e.target === stage || !stage.contains(e.relatedTarget)) stage.classList.remove("dropping"); });
  stage.addEventListener("drop", e => {
    if(!hasFiles(e)) return;
    e.preventDefault(); stage.classList.remove("dropping");
    // 이미지 요소 위에 놓으면 그 요소의 그림을 바꾼다
    const hit = e.target.closest?.("#screen .el"), hn = hit && get(hit.dataset.id), f = [...e.dataTransfer.files].find(isImage);
    if(hn && TYPES[hn.type].image && f && !hn.props.locked){ replaceImage(hn, f).catch(() => toast("이미지를 읽을 수 없습니다")); return; }
    const s = $("screen").getBoundingClientRect();
    insertImages(e.dataTransfer.files, [(e.clientX - s.left) / geo.scale, (e.clientY - s.top) / geo.scale]).then(k => { if(!k) toast("이미지 파일만 넣을 수 있습니다"); });
  });
}
// 붙여넣기 이벤트에 이미지 파일이 있으면 넣고 true
export function pasteImages(e){
  const files = [...(e.clipboardData?.files || [])].filter(isImage);
  if(!files.length) return false;
  e.preventDefault(); insertImages(files);
  return true;
}
