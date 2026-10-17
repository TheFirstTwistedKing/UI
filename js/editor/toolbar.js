/* 상단 툴바 · 하단 상태 표시줄 · 저장/불러오기/내보내기 모달 */
import { state, geo, view, store, history, $, esc, r3, get, undo, redo, commit, openProject, blankProject, sampleProject, validProject, savePrefs, toast } from "../core/state.js";
import { renderCanvas } from "./canvas.js";

function renderToolbar(){
  $("projName").value = state.project.name;
  $("device").value = state.device; $("zoom").value = state.zoom; $("snap").checked = state.snap;
  $("undo").disabled = !history.canUndo(); $("redo").disabled = !history.canRedo();
}

function updateStatus(){
  const n = get(state.sel); let h = "";
  if(state.sels.length > 1){
    h += `<span><b>${state.sels.length}개 선택</b></span><span>기준 <b>${esc(n.props.name)}</b></span>`;
  } else if(n){
    const r = geo.L[n.id] || {x:0,y:0,w:0,h:0}, p = n.props;
    const v = (val, u) => `${r3(val)}${u}`;
    h += `<span><b>${esc(p.name)}</b></span><span>페이지 기준 <b>${Math.round(r.x)}, ${Math.round(r.y)}</b></span><span>크기 <b>${Math.round(r.w)} × ${Math.round(r.h)}</b></span><span>X ${v(p.x,p.xu)} · Y ${v(p.y,p.yu)} · W ${v(p.w,p.wu)} · H ${v(p.h,p.hu)}</span>`;
  } else {
    h += `<span><b>페이지</b></span><span>크기 <b>${geo.root.w} × ${geo.root.h}</b></span><span>요소 <b>${state.project.nodes.length}</b>개</span>`;
  }
  h += `<span style="margin-left:auto">배율 ${Math.round(geo.scale*100)}%${store.lastSaved ? ` · 자동 저장 ${store.lastSaved.toTimeString().slice(0,5)}` : ""}</span>`;
  $("status").innerHTML = h;
}

/* ---------- 모달 ---------- */
function openModal(id){ $(id).hidden = false; const f = $(id).querySelector("[data-close]"); f && f.focus(); }
export function closeModals(){ document.querySelectorAll(".modal").forEach(m => m.hidden = true); }
export const modalOpen = () => !!document.querySelector(".modal:not([hidden])");

function showExport(){
  $("codeOut").textContent = JSON.stringify({format:"uiforge-web", version:1, project:state.project}, null, 2);
}
function renderSlots(){
  const slots = store.slots();
  const names = Object.keys(slots).sort((a,b) => slots[b].savedAt - slots[a].savedAt);
  $("slots").innerHTML = names.length ? names.map(nm => {
    const s = slots[nm], d = new Date(s.savedAt);
    return `<div class="slot"><div class="t">${esc(nm)}<small>${d.toLocaleDateString("ko-KR")} ${d.toTimeString().slice(0,5)} · 요소 ${s.project.nodes.length}개</small></div>
      <button class="btn primary" type="button" data-open="${esc(nm)}">열기</button>
      <button class="btn danger" type="button" data-del="${esc(nm)}">삭제</button></div>`;
  }).join("") : `<div class="empty">저장된 프로젝트가 없습니다. 상단의 저장 버튼을 누르면 이 목록에 추가됩니다.</div>`;
}
function importText(txt){
  try{ const p = validProject(JSON.parse(txt)); if(!p) throw 0; openProject(p); closeModals(); toast("JSON을 열었습니다"); }
  catch(e){ $("importMsg").textContent = "읽을 수 없는 JSON입니다. 이 에디터의 내보내기에서 복사한 내용인지 확인하세요."; }
}

export function initToolbar(){
  view.toolbar = renderToolbar; view.status = updateStatus;
  $("projName").addEventListener("change", e => { commit(() => state.project.name = e.target.value.trim() || "이름 없음"); });
  $("device").onchange = e => { state.device = e.target.value; savePrefs(); renderCanvas(); view.props(); updateStatus(); };
  $("zoom").onchange = e => { state.zoom = e.target.value; savePrefs(); renderCanvas(); updateStatus(); };
  $("snap").onchange = e => { state.snap = e.target.checked; savePrefs(); };
  $("undo").onclick = undo; $("redo").onclick = redo;
  $("newBtn").onclick = () => { openProject(blankProject()); toast("새 프로젝트를 만들었습니다 (되돌리기 가능)"); };
  $("saveBtn").onclick = () => {
    const slots = store.slots();
    slots[state.project.name] = {project: state.project, savedAt: Date.now()};
    toast(store.setSlots(slots) ? `저장했습니다: ${state.project.name}` : "이 브라우저에서는 저장할 수 없습니다. 내보내기로 JSON을 복사해 두세요.");
  };
  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", e => { if(e.target === m || e.target.closest("[data-close]")) closeModals(); });
  });
  $("exportBtn").onclick = () => { showExport(); openModal("codeModal"); };
  $("copyCode").onclick = () => {
    const txt = $("codeOut").textContent;
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($("codeOut")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("내용을 선택했습니다. Ctrl+C로 복사하세요"); };
    try{ navigator.clipboard.writeText(txt).then(() => toast("복사했습니다"), fallback); }catch(e){ fallback(); }
  };
  $("downloadJson").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([$("codeOut").textContent], {type:"application/json"}));
    a.download = (state.project.name || "ui") + ".json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $("loadBtn").onclick = () => { renderSlots(); $("importMsg").textContent = ""; openModal("loadModal"); };
  $("slots").addEventListener("click", e => {
    const o = e.target.closest("[data-open]"), d = e.target.closest("[data-del]");
    const slots = store.slots();
    if(o && slots[o.dataset.open]){ const p = validProject(slots[o.dataset.open].project); if(p){ openProject(p); closeModals(); toast("불러왔습니다"); } }
    if(d){
      if(d.dataset.armed){ delete slots[d.dataset.del]; store.setSlots(slots); renderSlots(); }
      else { d.dataset.armed = "1"; d.textContent = "정말 삭제"; setTimeout(() => { if(d.isConnected){ delete d.dataset.armed; d.textContent = "삭제"; } }, 2500); }
    }
  });
  $("importBtn").onclick = () => importText($("importText").value);
  $("importFile").onchange = e => { const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = () => importText(r.result); r.readAsText(f); e.target.value = ""; };
  $("sampleBtn").onclick = () => { openProject(sampleProject()); closeModals(); toast("예시 히어로 섹션을 열었습니다"); };
}
