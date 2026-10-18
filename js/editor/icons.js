/* 아이콘 세트: 16×16 격자, 1.5px 선, 둥근 끝. 모든 아이콘은 currentColor를 따른다. */
const P = {
  undo:'<path d="M5.5 3.5 2.5 6.5l3 3"/><path d="M2.5 6.5h7a4 4 0 0 1 0 8H7"/>',
  redo:'<path d="m10.5 3.5 3 3-3 3"/><path d="M13.5 6.5h-7a4 4 0 0 0 0 8H9"/>',
  file:'<path d="M4 1.5h5l3.5 3.5v9.5H4z"/><path d="M9 1.5V5h3.5"/>',
  save:'<path d="M2.5 2.5h9l2 2v9h-11z"/><path d="M5 2.5v3.5h5V2.5M5 13.5V9.5h6v4"/>',
  open:'<path d="M1.5 4V13h11l2-6H4.5l-2 6"/><path d="M1.5 4V2.5h4l1.5 1.5h5.5V7"/>',
  play:'<path d="M5 3v10l8-5z"/>',
  pause:'<path d="M5 3v10M11 3v10"/>',
  stop:'<rect x="3.5" y="3.5" width="9" height="9" rx="1"/>',
  loop:'<path d="M2.5 7V6a2.5 2.5 0 0 1 2.5-2.5h8.5M11 1.5l2 2-2 2"/><path d="M13.5 9v1a2.5 2.5 0 0 1-2.5 2.5H2.5M5 14.5l-2-2 2-2"/>',
  plus:'<path d="M8 3v10M3 8h10"/>',
  close:'<path d="m4 4 8 8M12 4l-8 8"/>',
  eye:'<path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
  eyeOff:'<path d="M2 2l12 12M6.6 3.7A6.4 6.4 0 0 1 8 3.5c4.1 0 6.5 4.5 6.5 4.5a11 11 0 0 1-1.9 2.4M4.1 5A11 11 0 0 0 1.5 8S3.9 12.5 8 12.5a6 6 0 0 0 2.6-.6"/>',
  lock:'<rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>',
  unlock:'<rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 4.8-1"/>',
  export:'<path d="M8 10V1.5M5 4.5l3-3 3 3"/><path d="M2.5 9v4.5h11V9"/>',
  magnet:'<path d="M3.5 2.5v5a4.5 4.5 0 0 0 9 0v-5"/><path d="M3.5 5.5h3M9.5 5.5h3M6.5 2.5v5a1.5 1.5 0 0 0 3 0v-5"/>',
  // 요소 유형
  rect:'<rect x="2.5" y="3.5" width="11" height="9" rx="1"/>',
  ellipse:'<circle cx="8" cy="8" r="5.5"/>',
  deco:'<path d="M8 1.5v13M1.5 8h13"/><path d="m3.5 3.5 9 9M12.5 3.5l-9 9"/><circle cx="8" cy="8" r="2.5"/>',
  shape:'<path d="m4.5 1.8 3 5.2h-6z"/><circle cx="11.3" cy="4.6" r="2.6"/><rect x="5" y="9" width="6.5" height="5.2" rx=".6"/>',
  text:'<path d="M3 3.5h10M8 3.5v9.5M6 13h4"/>',
  image:'<rect x="2" y="2.5" width="12" height="11" rx="1"/><circle cx="5.5" cy="6" r="1.2"/><path d="m2.5 12 4-4 3 3 1.5-1.5 2.5 2.5"/>',
  group:'<path d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3"/><rect x="5" y="5" width="6" height="6" rx=".5"/>',
  draw:'<path d="M2.5 13.5c1.5-.3 2.6-1 3.4-1.8l7-7a1.6 1.6 0 0 0-2.3-2.3l-7 7c-.8.8-1.4 1.9-1.1 4.1z"/><path d="m9.5 3.8 2.3 2.3"/>',
  page:'<rect x="3" y="1.5" width="10" height="13" rx="1"/><path d="M5.5 5h5M5.5 8h5M5.5 11h3"/>',
  // 왼쪽 패널 탭
  layers:'<path d="m8 2 6 3-6 3-6-3z"/><path d="m2 8 6 3 6-3"/><path d="m2 11 6 3 6-3"/>',
  component:'<path d="m8 1.5 3 3-3 3-3-3zM8 8.5l3 3-3 3-3-3zM4.5 5l3 3-3 3-3-3zM11.5 5l3 3-3 3-3-3z"/>',
  ornament:'<path d="M8 1.5v13M1.5 8h13"/><path d="m3.5 3.5 9 9M12.5 3.5l-9 9"/><circle cx="8" cy="8" r="2.5"/>',
  motion:'<path d="M1.5 11c2-6 4-6 6 0s4 6 7-1"/><circle cx="14" cy="5" r="1"/>',
  fx:'<path d="m8 1.5 1.6 4.2 4.4.3-3.4 2.8 1.1 4.2L8 10.6 4.3 13l1.1-4.2L2 6l4.4-.3z"/>',
  premodel:'<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3.6" stroke-dasharray="1.4 1.4"/><path d="M8 5.2V8l2 1.3"/>',
  search:'<circle cx="7" cy="7" r="4.5"/><path d="m10.4 10.4 3.6 3.6"/>',
  paneLeft:'<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M6 2.5v11"/><path d="M3 5.5h1.5M3 8h1.5"/>',
  paneRight:'<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M10 2.5v11"/><path d="M11.5 5.5H13M11.5 8H13"/>',
  chevron:'<path d="m4.5 6 3.5 3.5L11.5 6"/>',
  timeline:'<path d="M1.5 4.5h13M1.5 8h13M1.5 11.5h13"/><path d="M5 2.5v4M10 6v4M7 9.5v4"/>'
};
export const icon = (name, cls = "ic") => `<svg class="${cls}" viewBox="0 0 16 16" aria-hidden="true">${P[name] || ""}</svg>`;
// data-icon 속성이 있는 정적 요소 앞에 아이콘을 넣는다
// 많이 반복되는 곳(레이어 목록)용: 아이콘을 한 번만 정의해 두고 <use>로 참조한다
let sprite = null;
export function iconRef(name, cls = "ic"){
  if(!sprite){
    sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sprite.setAttribute("aria-hidden", "true"); sprite.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    sprite.innerHTML = Object.entries(P).map(([k, v]) => `<symbol id="ic-${k}" viewBox="0 0 16 16">${v}</symbol>`).join("");
    document.body.prepend(sprite);
  }
  return `<svg class="${cls}" viewBox="0 0 16 16" aria-hidden="true"><use href="#ic-${name}"/></svg>`;
}
export function mountIcons(root = document){
  root.querySelectorAll("[data-icon]").forEach(e => { if(!e.querySelector(":scope > svg.ic")) e.insertAdjacentHTML("afterbegin", icon(e.dataset.icon)); });
}
