/* 인터랙션 모드와 동작 정의. 페이지에서 켠 모드(page.modes)의 트리거만 쓸 수 있고,
   요소마다 props.actions = [{on, v, do, t, a}] 로 "언제(on·v) 무엇을(do) 어디에(t) 어떤 값으로(a)"를 저장한다.
   실제 동작은 내보낸 HTML의 실행 코드(export/runtime.js)가 맡는다. */

export const MODES = [
  {id:"gui", name:"GUI", desc:"마우스·터치로 누르고 올리는 기본 화면 조작"},
  {id:"cli", name:"CLI", desc:"화면 아래 명령줄에 명령어를 입력해 조작"},
  {id:"tui", name:"TUI", desc:"키보드만으로 조작: 화살표로 이동, Enter로 실행, 단축키"},
  {id:"nui", name:"NUI", desc:"밀기·길게 누르기·두 번 누르기 같은 자연스러운 몸짓"},
  {id:"aui", name:"AUI", desc:"음성 명령으로 조작하고 음성으로 안내"},
  {id:"oui", name:"OUI", desc:"포인터가 다가가면 형태가 바뀌는 유기적 인터페이스"},
];

// 트리거: 어느 모드에 속하는지, 값(v)이 필요한지
export const TRIGGERS = [
  {id:"click", mode:"gui", name:"누르기"},
  {id:"hover", mode:"gui", name:"마우스 올리기"},
  {id:"command", mode:"cli", name:"명령어 입력", v:"명령어", ph:"open menu"},
  {id:"key", mode:"tui", name:"키 누르기", v:"키", ph:"m 또는 Enter"},
  {id:"swipe-left", mode:"nui", name:"왼쪽으로 밀기"},
  {id:"swipe-right", mode:"nui", name:"오른쪽으로 밀기"},
  {id:"swipe-up", mode:"nui", name:"위로 밀기"},
  {id:"swipe-down", mode:"nui", name:"아래로 밀기"},
  {id:"longpress", mode:"nui", name:"길게 누르기"},
  {id:"doubletap", mode:"nui", name:"두 번 누르기"},
  {id:"voice", mode:"aui", name:"음성 명령", v:"말", ph:"메뉴 열어"},
  {id:"near", mode:"oui", name:"포인터가 다가옴", v:"거리(px)", ph:"120"},
  {id:"far", mode:"oui", name:"포인터가 멀어짐", v:"거리(px)", ph:"120"},
];
export const TRIGGER = Object.fromEntries(TRIGGERS.map(t => [t.id, t]));

// 동작: 대상이 필요한지(t), 값이 필요한지(a)
export const ACTIONS = [
  {id:"toggle", name:"보이기/숨기기 전환", t:true},
  {id:"show", name:"보이기", t:true},
  {id:"hide", name:"숨기기", t:true},
  {id:"play", name:"애니메이션·VFX 다시 재생", t:true},
  {id:"goto", name:"그 위치로 스크롤", t:true},
  {id:"text", name:"글자 바꾸기", t:true, a:"새 글자"},
  {id:"morph", name:"형태 변형 (OUI)", t:true},
  {id:"say", name:"음성으로 말하기", a:"말할 내용"},
  {id:"link", name:"링크 열기", a:"https://… 또는 #"},
];
export const ACTION = Object.fromEntries(ACTIONS.map(a => [a.id, a]));

export const newAction = mode => ({on:TRIGGERS.find(t => t.mode === mode)?.id || "click", v:"", do:"toggle", t:"", a:""});

// 지금 이 브라우저에서 각 모드를 실제로 쓸 수 있는지. sim이면 대체 입력으로 동작한다.
export function modeSupport(id){
  if(id === "nui") return "ontouchstart" in window || navigator.maxTouchPoints > 0
    ? {ok:true, label:"터치 지원"} : {ok:false, sim:true, label:"터치 없음 · 마우스로 시뮬레이션"};
  if(id === "aui"){
    const sr = !!(window.SpeechRecognition || window.webkitSpeechRecognition), tts = "speechSynthesis" in window;
    if(sr) return {ok:true, label:tts ? "음성 인식·출력 지원" : "음성 인식 지원 · 음성 출력 없음"};
    return {ok:false, sim:true, label:"음성 인식 미지원 · 글자 입력으로 시뮬레이션"};
  }
  if(id === "oui") return matchMedia("(hover:hover)").matches ? {ok:true, label:"포인터 지원"} : {ok:false, sim:true, label:"마우스 없음 · 터치로 끌 때 반응"};
  return {ok:true, label:"지원"};
}
