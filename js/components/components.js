/* UI 구성 요소 라이브러리: 버튼·카드·내비게이션·입력·표시·섹션·게임 HUD 100종.
   각 구성 요소는 기존 요소(사각형·원·텍스트·도형·장식)로 만든 트리이고, 넣으면 그룹 하나로 묶인다.
   트리 형식: [유형, 속성, 자식들]. 좌표는 부모 기준 px(필요하면 %). */

export const COMPONENT_CATEGORIES = ["버튼", "카드", "내비게이션", "입력·폼", "표시·상태", "섹션", "게임·HUD"];

const K = {gold:"#e9d8a6", ink:"#0b0b0d", panel:"#16161a", panel2:"#1f1f25", line:"#2c2c34", text:"#f4f1ea", muted:"#9a98a2", cyan:"#5ce1ff", red:"#ff4d5e", green:"#3ddc97", amber:"#ffb020", violet:"#9d7bff", blue:"#4d8dff"};
const MONO = '"JetBrains Mono"', SERIF = "Cinzel", DISPLAY = "Orbitron";

const r = (x, y, w, h, o = {}, k = []) => ["rect", {x, y, w, h, fill:K.panel, ...o}, k];
const el = (x, y, w, h, o = {}, k = []) => ["ellipse", {x, y, w, h, fill:K.panel2, ...o}, k];
const t = (x, y, w, h, text, o = {}) => ["text", {x, y, w, h, text, fontSize:14, color:K.text, fontWeight:400, ...o}, []];
// 부모를 꽉 채우고 가운데 정렬한 글자
const lbl = (text, o = {}) => t(0, 0, 100, 100, text, {wu:"%", hu:"%", align:"center", valign:"center", ...o});
const sh = (x, y, w, h, shape, o = {}) => ["shape", {x, y, w, h, shape, fill:K.gold, ...o}, []];
const dc = (x, y, w, h, deco, o = {}) => ["deco", {x, y, w, h, deco, fill:K.gold, lineWidth:1.5, ...o}, []];
const bd = (c, w = 1, s = "solid") => ({borderWidth:w, borderColor:c, borderStyle:s});
const SHADOW = {shadowOn:true, shadowX:0, shadowY:14, shadowBlur:34, shadowSpread:0, shadowColor:"#000000", shadowAlpha:.5};
const card = (w, h, o = {}, k = []) => r(0, 0, w, h, {radius:14, ...bd(K.line), ...o}, k);
const range = (n, fn) => Array.from({length:n}, (_, i) => fn(i));

const C = [];
const add = (cat, id, name, w, h, kids) => C.push({cat, id, name, w, h, kids});

/* 버튼 */
const B = (id, name, w, h, kids) => add("버튼", id, name, w, h, kids);
const btn = (w, h, label, o = {}, lo = {}) => r(0, 0, w, h, {fill:K.gold, radius:8, ...o}, [lbl(label, {color:K.ink, fontWeight:600, fontSize:16, ...lo})]);
B("btnPrimary", "기본 버튼", 160, 48, [btn(160, 48, "시작하기")]);
B("btnOutline", "외곽선 버튼", 160, 48, [btn(160, 48, "더 알아보기", {fillAlpha:0, ...bd(K.gold)}, {color:K.gold, fontWeight:500})]);
B("btnGhost", "고스트 버튼", 160, 48, [btn(160, 48, "취소", {fill:K.panel2}, {color:K.text, fontWeight:500})]);
B("btnPill", "알약 버튼", 180, 48, [btn(180, 48, "무료로 시작", {radius:24})]);
B("btnIcon", "아이콘 버튼", 180, 48, [r(0, 0, 180, 48, {fill:K.gold, radius:8}, [t(20, 0, 110, 48, "다음 단계", {color:K.ink, fontWeight:600, fontSize:16, valign:"center"}), sh(140, 17, 20, 14, "arrowRight", {fill:K.ink})])]);
B("btnDanger", "위험 버튼", 140, 44, [btn(140, 44, "삭제", {fill:K.red}, {color:"#ffffff"})]);
B("btnSuccess", "완료 버튼", 160, 44, [r(0, 0, 160, 44, {fill:K.green, radius:8}, [sh(26, 15, 16, 14, "check", {fill:K.ink}), t(50, 0, 96, 44, "저장 완료", {color:K.ink, fontWeight:600, fontSize:15, valign:"center"})])]);
B("btnLarge", "큰 CTA 버튼", 260, 64, [btn(260, 64, "지금 시작하기", {radius:12, ...SHADOW, shadowColor:"#e9d8a6", shadowAlpha:.25}, {fontSize:20, fontWeight:700})]);
B("btnSmall", "작은 버튼", 96, 32, [btn(96, 32, "더 보기", {radius:6}, {fontSize:13})]);
B("btnNeon", "네온 버튼", 180, 48, [r(0, 0, 180, 48, {fill:K.ink, radius:8, ...bd(K.cyan), fx:[{effect:"neonGlow", color:K.cyan}]}, [lbl("접속하기", {color:K.cyan, fontWeight:600, fontSize:16, letterSpacing:1})])]);
B("btnCut", "깎인 버튼", 180, 48, [sh(0, 0, 180, 48, "chamfer"), lbl("ACTIVATE", {color:K.ink, font:MONO, fontWeight:700, letterSpacing:2})]);
B("btnHud", "HUD 버튼", 180, 52, [dc(0, 0, 180, 52, "frameBrackets", {fill:K.cyan}), r(6, 6, 168, 40, {fill:K.cyan, fillAlpha:.08, radius:2}), lbl("ENGAGE", {color:K.cyan, font:MONO, fontWeight:700, letterSpacing:3})]);
B("btnArrow", "화살표 링크 버튼", 170, 36, [t(0, 0, 130, 30, "자세히 보기", {color:K.gold, fontWeight:500, fontSize:16, valign:"center"}), sh(136, 9, 26, 12, "arrowSlim"), dc(0, 30, 170, 6, "lineSimple", {lineWidth:1})]);
B("btnSplit", "분할 버튼", 190, 44, [r(0, 0, 190, 44, {fill:K.gold, radius:8}, [t(0, 0, 146, 44, "내보내기", {color:K.ink, fontWeight:600, fontSize:15, align:"center", valign:"center"}), r(146, 8, 1, 28, {fill:K.ink, fillAlpha:.3}), sh(160, 18, 14, 9, "chevronDown", {fill:K.ink})])]);
B("btnGroup", "버튼 묶음", 270, 40, [r(0, 0, 90, 40, {fill:K.panel2, ...bd(K.line)}, [lbl("일", {color:K.muted})]), r(90, 0, 90, 40, {fill:K.gold}, [lbl("주", {color:K.ink, fontWeight:600})]), r(180, 0, 90, 40, {fill:K.panel2, ...bd(K.line)}, [lbl("월", {color:K.muted})])]);
B("btnFab", "떠 있는 원형 버튼", 60, 60, [el(0, 0, 60, 60, {fill:K.gold, ...SHADOW}, [sh(19, 19, 22, 22, "plus", {fill:K.ink})])]);
B("btnRoundIcon", "원형 아이콘 버튼", 44, 44, [el(0, 0, 44, 44, {...bd(K.line)}, [sh(13, 14, 18, 16, "heart", {fill:K.red})])]);
B("btnTextLink", "텍스트 링크", 120, 28, [t(0, 0, 120, 22, "비밀번호 찾기", {color:K.gold, fontSize:14}), dc(0, 22, 92, 6, "lineSimple", {lineWidth:1, fillAlpha:.6})]);
B("btnLoading", "로딩 버튼", 160, 48, [r(0, 0, 160, 48, {fill:K.gold, radius:8}, [dc(56, 18, 48, 12, "loadingDots", {fill:K.ink, anims:["pulse"]})])]);
B("btnDisabled", "비활성 버튼", 160, 48, [btn(160, 48, "사용할 수 없음", {fill:"#2a2a30", opacity:.7}, {color:K.muted, fontWeight:500})]);

/* 카드 */
const CD = (id, name, w, h, kids) => add("카드", id, name, w, h, kids);
const imgArea = (x, y, w, h, o = {}) => r(x, y, w, h, {fill:K.panel2, ...o}, [sh(w / 2 - 22, h / 2 - 14, 44, 28, "mountains", {fill:K.muted, fillAlpha:.35}), el(w / 2 + 14, h / 2 - 22, 10, 10, {fill:K.muted, fillAlpha:.35})]);
CD("cardBasic", "기본 카드", 300, 170, [card(300, 170, {}, [t(22, 20, 256, 26, "카드 제목", {fontSize:19, fontWeight:600}), t(22, 54, 256, 60, "짧은 설명을 두 줄 정도 적습니다. 내용에 맞게 바꾸세요.", {color:K.muted, lineHeight:1.6}), t(22, 128, 200, 22, "자세히 →", {color:K.gold, fontWeight:500})])]);
CD("cardImage", "이미지 카드", 280, 320, [card(280, 320, {clip:true}, [imgArea(0, 0, 280, 160), t(20, 178, 240, 26, "이미지 카드", {fontSize:18, fontWeight:600}), t(20, 210, 240, 60, "사진 아래에 제목과 설명을 둡니다.", {color:K.muted, lineHeight:1.6}), t(20, 280, 200, 22, "읽기 →", {color:K.gold})])]);
CD("cardProfile", "프로필 카드", 260, 240, [card(260, 240, {}, [el(94, 24, 72, 72, {...bd(K.gold, 2)}, [lbl("KM", {color:K.gold, fontWeight:600, fontSize:22})]), t(0, 108, 260, 26, "김민서", {fontSize:18, fontWeight:600, align:"center"}), t(0, 136, 260, 20, "프로덕트 디자이너", {color:K.muted, fontSize:13, align:"center"}), r(80, 176, 100, 36, {fillAlpha:0, radius:18, ...bd(K.gold)}, [lbl("팔로우", {color:K.gold, fontSize:14})])])]);
CD("cardPricing", "요금제 카드", 260, 360, [card(260, 360, {...bd(K.gold)}, [t(24, 24, 200, 22, "프로", {color:K.gold, font:MONO, letterSpacing:2, fontSize:13}), t(24, 52, 212, 44, "₩19,000", {fontSize:34, fontWeight:700}), t(24, 98, 200, 20, "매월 결제", {color:K.muted, fontSize:13}),
  ...range(4, i => sh(24, 146 + i * 32, 14, 12, "check", {fill:K.gold})), ...["프로젝트 무제한", "VFX 400종", "HTML 내보내기", "우선 지원"].map((s, i) => t(48, 140 + i * 32, 190, 24, s, {color:K.text, valign:"center"})), btn(212, 44, "선택하기", {x:24, y:292})])]);
CD("cardStat", "통계 카드", 220, 120, [card(220, 120, {}, [t(20, 18, 180, 20, "이번 달 방문자", {color:K.muted, fontSize:13}), t(20, 42, 180, 40, "48,210", {fontSize:30, fontWeight:700, font:'"Inter"'}), t(20, 86, 180, 20, "▲ 12.4% 지난달 대비", {color:K.green, fontSize:13})])]);
CD("cardFeature", "기능 카드", 260, 210, [card(260, 210, {}, [r(22, 22, 48, 48, {fill:K.gold, fillAlpha:.12, radius:12}, [sh(14, 12, 20, 24, "bolt")]), t(22, 88, 216, 26, "빠른 편집", {fontSize:18, fontWeight:600}), t(22, 120, 216, 66, "끌어 놓고 바로 확인합니다. 저장은 자동입니다.", {color:K.muted, lineHeight:1.6})])]);
CD("cardQuote", "후기 카드", 320, 210, [card(320, 210, {}, [t(22, 6, 60, 60, "“", {color:K.gold, font:SERIF, fontSize:64}), t(22, 62, 276, 70, "필요한 걸 바로 찾을 수 있어서 작업 시간이 절반으로 줄었어요.", {lineHeight:1.6, fontSize:15}), el(22, 150, 36, 36, {fill:K.violet, fillAlpha:.5}), t(68, 148, 200, 20, "박지훈", {fontWeight:600}), t(68, 168, 200, 18, "스타트업 대표", {color:K.muted, fontSize:12})])]);
CD("cardProduct", "상품 카드", 240, 320, [card(240, 320, {clip:true}, [imgArea(0, 0, 240, 180), r(12, 12, 52, 22, {fill:K.red, radius:11}, [lbl("-20%", {color:"#ffffff", fontSize:12, fontWeight:600})]), t(18, 194, 204, 24, "홀로그램 키보드", {fontSize:16, fontWeight:600}), t(18, 222, 204, 22, "₩129,000", {color:K.gold, fontSize:16, fontWeight:600}), btn(204, 40, "담기", {x:18, y:262}, {fontSize:14})])]);
CD("cardBlog", "블로그 카드", 300, 280, [card(300, 280, {clip:true}, [imgArea(0, 0, 300, 150), r(20, 166, 64, 22, {fill:K.cyan, fillAlpha:.12, radius:11}, [lbl("디자인", {color:K.cyan, fontSize:12})]), t(20, 196, 260, 48, "다크 UI에서 색을 고르는 다섯 가지 방법", {fontSize:16, fontWeight:600, lineHeight:1.4}), t(20, 248, 260, 18, "2026. 10. 17 · 5분", {color:K.muted, fontSize:12})])]);
CD("cardNotice", "알림 카드", 340, 88, [card(340, 88, {radius:12}, [el(18, 22, 44, 44, {fill:K.green, fillAlpha:.15}, [sh(13, 15, 18, 14, "check", {fill:K.green})]), t(76, 18, 200, 22, "배포 완료", {fontWeight:600}), t(76, 42, 240, 20, "홈페이지가 업데이트되었습니다.", {color:K.muted, fontSize:13}), t(270, 18, 52, 18, "방금", {color:K.muted, fontSize:12, align:"right"})])]);
CD("cardHud", "HUD 카드", 300, 190, [dc(0, 0, 300, 190, "frameHUD", {fill:K.cyan}), t(20, 18, 200, 20, "SYSTEM STATUS", {color:K.cyan, font:MONO, fontSize:12, letterSpacing:2}), t(20, 44, 200, 36, "98.6%", {color:K.text, font:DISPLAY, fontSize:28, fontWeight:700}), dc(20, 100, 140, 64, "dataBars", {fill:K.cyan, fillAlpha:.7}), t(180, 120, 100, 44, "CORE\nONLINE", {color:K.cyan, font:MONO, fontSize:12, lineHeight:1.6})]);
CD("cardGlass", "유리 카드", 280, 170, [card(280, 170, {fill:"#ffffff", fillAlpha:.06, ...bd("#3a3a44"), fx:[{effect:"shine", color:"#ffffff", intensity:.6}]}, [t(22, 22, 236, 26, "유리 질감 카드", {fontSize:18, fontWeight:600}), t(22, 56, 236, 60, "반투명 배경 위로 빛이 지나갑니다.", {color:K.muted, lineHeight:1.6})])]);
CD("cardHorizontal", "가로 카드", 400, 120, [card(400, 120, {clip:true}, [imgArea(0, 0, 130, 120), t(150, 20, 230, 24, "가로형 카드", {fontSize:17, fontWeight:600}), t(150, 50, 230, 48, "이미지를 왼쪽에 두는 목록용 카드입니다.", {color:K.muted, fontSize:13, lineHeight:1.6})])]);
CD("cardAccent", "강조선 카드", 280, 150, [card(280, 150, {clip:true}, [r(0, 0, 280, 4, {fill:K.gold}), t(22, 26, 236, 26, "공지", {fontSize:18, fontWeight:600}), t(22, 60, 236, 60, "윗선 색으로 카드의 성격을 구분합니다.", {color:K.muted, lineHeight:1.6})])]);
CD("cardCta", "행동 유도 배너", 520, 140, [r(0, 0, 520, 140, {fill:K.gold, radius:16}, [t(32, 30, 300, 32, "지금 바로 만들어 보세요", {color:K.ink, fontSize:24, fontWeight:700}), t(32, 70, 300, 40, "설치 없이 브라우저에서 바로 시작합니다.", {color:K.ink, fontSize:14}), r(360, 46, 132, 48, {fill:K.ink, radius:10}, [lbl("시작하기", {color:K.gold, fontWeight:600, fontSize:15})])])]);
CD("cardTeam", "팀원 카드", 220, 260, [card(220, 260, {}, [el(62, 24, 96, 96, {fill:K.blue, fillAlpha:.4, ...bd(K.line, 3)}), t(0, 136, 220, 24, "이서준", {fontSize:17, fontWeight:600, align:"center"}), t(0, 162, 220, 20, "프론트엔드 개발", {color:K.muted, fontSize:13, align:"center"}), ...range(3, i => el(70 + i * 30, 204, 22, 22, {...bd(K.line)}))])]);

/* 내비게이션 */
const NV = (id, name, w, h, kids) => add("내비게이션", id, name, w, h, kids);
NV("navTop", "상단 메뉴바", 960, 64, [r(0, 0, 960, 64, {...bd(K.line), radius:12}, [t(24, 0, 160, 64, "UI FORGE", {color:K.gold, font:SERIF, fontSize:20, fontWeight:700, letterSpacing:2, valign:"center"}), ...["기능", "요금", "문서", "블로그"].map((s, i) => t(360 + i * 90, 0, 80, 64, s, {color:i ? K.muted : K.text, valign:"center", align:"center"})), btn(110, 40, "시작하기", {x:826, y:12}, {fontSize:14})])]);
NV("navSide", "사이드 메뉴", 230, 380, [r(0, 0, 230, 380, {...bd(K.line), radius:14}, [t(22, 20, 180, 24, "작업 공간", {color:K.muted, fontSize:12, letterSpacing:1}), ...["대시보드", "프로젝트", "자산", "팀", "설정"].map((s, i) => i === 1 ? r(12, 56 + i * 48, 206, 40, {fill:K.gold, fillAlpha:.12, radius:8}, [r(0, 8, 3, 24, {fill:K.gold}), t(16, 0, 180, 40, s, {color:K.gold, fontWeight:500, valign:"center"})]) : t(28, 56 + i * 48, 180, 40, s, {color:K.muted, valign:"center"}))])]);
NV("navTabs", "탭", 360, 44, [...["개요", "활동", "설정"].map((s, i) => t(i * 100, 0, 100, 40, s, {color:i ? K.muted : K.text, align:"center", valign:"center", fontWeight:i ? 400 : 600})), r(0, 42, 360, 1, {fill:K.line}), r(10, 41, 80, 3, {fill:K.gold, radius:2})]);
NV("navBreadcrumb", "경로 표시", 300, 24, [t(0, 0, 40, 24, "홈", {color:K.muted, valign:"center"}), sh(40, 8, 6, 9, "chevronRight", {fill:K.muted}), t(56, 0, 50, 24, "문서", {color:K.muted, valign:"center"}), sh(106, 8, 6, 9, "chevronRight", {fill:K.muted}), t(122, 0, 120, 24, "설치 안내", {color:K.text, valign:"center", fontWeight:500})]);
NV("navPagination", "페이지 번호", 320, 40, [...["‹", "1", "2", "3", "…", "9", "›"].map((s, i) => r(i * 46, 0, 40, 40, {fill:i === 1 ? K.gold : K.panel2, radius:8, ...(i === 1 ? {} : bd(K.line))}, [lbl(s, {color:i === 1 ? K.ink : K.muted, fontWeight:i === 1 ? 600 : 400})]))]);
NV("navFooter", "하단 바", 960, 72, [r(0, 0, 960, 72, {fill:K.panel, ...bd(K.line), radius:12}, [t(24, 0, 300, 72, "© 2026 UI Forge. All rights reserved.", {color:K.muted, fontSize:13, valign:"center"}), ...["개인정보", "약관", "문의"].map((s, i) => t(700 + i * 80, 0, 80, 72, s, {color:K.muted, fontSize:13, align:"center", valign:"center"}))])]);
NV("navBottomTabs", "모바일 하단 탭", 390, 68, [r(0, 0, 390, 68, {fill:K.panel, ...bd(K.line)}, [...[["house", "홈"], ["star5", "즐겨찾기"], ["pin", "주변"], ["gear8", "설정"]].map(([s, n], i) => [sh(i * 97.5 + 37, 12, 22, 22, s, {fill:i ? K.muted : K.gold}), t(i * 97.5, 38, 97.5, 20, n, {fontSize:11, color:i ? K.muted : K.gold, align:"center"})]).flat()])]);
NV("navStepper", "단계 표시", 420, 64, [r(30, 17, 360, 2, {fill:K.line}), r(30, 17, 140, 2, {fill:K.gold}), ...range(4, i => el(i * 120 + 12, 0, 36, 36, {fill:i < 2 ? K.gold : K.panel2, ...(i < 2 ? {} : bd(K.line))}, [lbl(String(i + 1), {color:i < 2 ? K.ink : K.muted, fontWeight:600})])), ...["정보", "디자인", "검토", "완료"].map((s, i) => t(i * 120 - 10, 42, 80, 20, s, {fontSize:12, align:"center", color:i < 2 ? K.text : K.muted}))]);
NV("navHamburger", "햄버거 아이콘", 32, 24, range(3, i => r(0, i * 10, 32, 3, {fill:K.text, radius:2})));
NV("navSearch", "검색창", 320, 44, [r(0, 0, 320, 44, {fill:K.panel2, radius:22, ...bd(K.line)}, [sh(16, 13, 18, 18, "ring", {fill:K.muted}), r(30, 29, 8, 2, {fill:K.muted, rotation:45}), t(46, 0, 240, 44, "검색어를 입력하세요", {color:K.muted, valign:"center"})])]);
NV("navDropdown", "드롭다운 메뉴", 210, 196, [r(0, 0, 210, 196, {fill:K.panel2, radius:12, ...bd(K.line), ...SHADOW}, [...["새 프로젝트", "열기", "최근 항목"].map((s, i) => i === 1 ? r(6, 6 + i * 40, 198, 36, {fill:K.gold, fillAlpha:.12, radius:6}, [t(12, 0, 170, 36, s, {color:K.gold, valign:"center"})]) : t(18, 6 + i * 40, 170, 36, s, {valign:"center"})), r(12, 132, 186, 1, {fill:K.line}), t(18, 144, 170, 36, "로그아웃", {color:K.red, valign:"center"})])]);
NV("navSegment", "세그먼트 컨트롤", 290, 40, [r(0, 0, 290, 40, {fill:K.panel2, radius:20}, [r(4, 4, 92, 32, {fill:K.gold, radius:16}, [lbl("디자인", {color:K.ink, fontWeight:600, fontSize:13})]), t(96, 0, 96, 40, "코드", {color:K.muted, align:"center", valign:"center", fontSize:13}), t(192, 0, 96, 40, "미리보기", {color:K.muted, align:"center", valign:"center", fontSize:13})])]);

/* 입력·폼 */
const IN = (id, name, w, h, kids) => add("입력·폼", id, name, w, h, kids);
const field = (x, y, w, h, text, o = {}, to = {}) => r(x, y, w, h, {fill:K.panel2, radius:8, ...bd(K.line), ...o}, [t(14, 0, w - 28, h, text, {color:K.muted, valign:"center", ...to})]);
IN("inText", "입력창", 300, 44, [field(0, 0, 300, 44, "이메일 주소")]);
IN("inLabeled", "라벨 입력창", 300, 74, [t(0, 0, 300, 20, "이름", {fontSize:13, color:K.muted}), field(0, 28, 300, 44, "홍길동", bd(K.gold), {color:K.text})]);
IN("inPassword", "비밀번호 입력창", 300, 44, [field(0, 0, 300, 44, "••••••••", {}, {color:K.text, letterSpacing:3}), sh(266, 15, 20, 14, "lens", {fill:K.muted, fillAlpha:.8})]);
IN("inTextarea", "여러 줄 입력", 300, 120, [r(0, 0, 300, 120, {fill:K.panel2, radius:8, ...bd(K.line)}, [t(14, 12, 272, 90, "메시지를 남겨 주세요", {color:K.muted})]), dc(284, 104, 10, 10, "lineSimple", {fill:K.muted, rotation:-45, lineWidth:1})]);
IN("inCheckbox", "체크박스", 200, 24, [r(0, 2, 20, 20, {fill:K.gold, radius:4}, [sh(4, 5, 12, 10, "check", {fill:K.ink})]), t(30, 0, 170, 24, "약관에 동의합니다", {valign:"center"})]);
IN("inRadio", "라디오 버튼", 200, 64, [el(0, 2, 20, 20, {fillAlpha:0, ...bd(K.gold, 2)}, [el(4, 4, 8, 8, {fill:K.gold})]), t(30, 0, 160, 24, "월간 결제", {valign:"center"}), el(0, 40, 20, 20, {fillAlpha:0, ...bd(K.muted, 2)}), t(30, 38, 160, 24, "연간 결제", {color:K.muted, valign:"center"})]);
IN("inToggle", "토글 스위치", 52, 28, [r(0, 0, 52, 28, {fill:K.gold, radius:14}, [el(27, 3, 22, 22, {fill:"#ffffff"})])]);
IN("inSelect", "선택 상자", 240, 44, [field(0, 0, 240, 44, "한국어", {}, {color:K.text}), sh(208, 18, 14, 9, "chevronDown", {fill:K.muted})]);
IN("inSlider", "슬라이더", 280, 24, [r(0, 10, 280, 4, {fill:K.line, radius:2}), r(0, 10, 168, 4, {fill:K.gold, radius:2}), el(158, 3, 18, 18, {fill:"#ffffff", ...bd(K.gold, 2)})]);
IN("formLogin", "로그인 폼", 340, 320, [card(340, 320, {...SHADOW}, [t(28, 26, 284, 32, "로그인", {fontSize:22, fontWeight:700}), t(28, 62, 284, 20, "계정에 다시 오신 것을 환영합니다.", {color:K.muted, fontSize:13}), field(28, 100, 284, 44, "이메일"), field(28, 156, 284, 44, "비밀번호"), btn(284, 46, "로그인", {x:28, y:218}), t(28, 278, 284, 20, "계정이 없나요? 가입하기", {color:K.gold, fontSize:13, align:"center"})])]);
IN("formNewsletter", "구독 폼", 440, 52, [r(0, 0, 440, 52, {fill:K.panel2, radius:26, ...bd(K.line)}, [t(22, 0, 260, 52, "이메일을 입력하세요", {color:K.muted, valign:"center"}), r(312, 6, 122, 40, {fill:K.gold, radius:20}, [lbl("구독하기", {color:K.ink, fontWeight:600, fontSize:14})])])]);
IN("inRating", "별점", 160, 28, range(5, i => sh(i * 32, 0, 28, 27, "star5", {fill:K.gold, fillAlpha:i < 4 ? 1 : .2})));
IN("inUpload", "파일 올리기 영역", 340, 170, [r(0, 0, 340, 170, {fill:K.gold, fillAlpha:.04, radius:14, ...bd(K.gold, 1.5, "dashed")}, [sh(154, 36, 32, 36, "arrowUp"), t(0, 86, 340, 24, "파일을 끌어다 놓으세요", {align:"center", fontWeight:500}), t(0, 114, 340, 20, "PNG, JPG, SVG · 최대 10MB", {color:K.muted, fontSize:12, align:"center"})])]);
IN("inOtp", "인증 코드 입력", 316, 56, range(6, i => r(i * 54, 0, 46, 56, {fill:K.panel2, radius:8, ...bd(i === 3 ? K.gold : K.line)}, [lbl(["4", "8", "1", "", "", ""][i], {fontSize:22, fontWeight:600, font:MONO})])));

/* 표시·상태 */
const DS = (id, name, w, h, kids) => add("표시·상태", id, name, w, h, kids);
const alert = (c, shape, msg) => [r(0, 0, 380, 64, {fill:c, fillAlpha:.1, radius:10, ...bd(c)}, [el(16, 18, 28, 28, {fill:c, fillAlpha:.2}, [sh(7, 7, 14, 14, shape, {fill:c})]), t(56, 0, 310, 64, msg, {valign:"center", fontSize:14})])];
DS("badge", "배지", 64, 24, [r(0, 0, 64, 24, {fill:K.gold, fillAlpha:.15, radius:12, ...bd(K.gold)}, [lbl("NEW", {color:K.gold, fontSize:11, fontWeight:700, letterSpacing:1, font:MONO})])]);
DS("chips", "태그 묶음", 300, 32, ["디자인", "웹", "애니메이션"].map((s, i) => r([0, 82, 148][i], 0, [74, 58, 100][i], 32, {fill:K.panel2, radius:16, ...bd(K.line)}, [lbl(s, {fontSize:13, color:K.muted})])));
DS("avatar", "아바타", 56, 56, [el(0, 0, 56, 56, {fill:K.violet, fillAlpha:.6}, [lbl("JH", {fontWeight:600, fontSize:18})])]);
DS("avatarGroup", "아바타 묶음", 150, 44, [...[K.violet, K.blue, K.green, K.amber].map((c, i) => el(i * 28, 0, 44, 44, {fill:c, fillAlpha:.7, ...bd(K.ink, 3)})), el(112, 0, 44, 44, {fill:K.panel2, ...bd(K.ink, 3)}, [lbl("+3", {fontSize:13, color:K.muted})])]);
DS("progress", "진행 막대", 300, 40, [t(0, 0, 200, 20, "업로드 중", {fontSize:13}), t(200, 0, 100, 20, "68%", {fontSize:13, color:K.gold, align:"right", font:MONO}), r(0, 28, 300, 8, {fill:K.line, radius:4}), r(0, 28, 204, 8, {fill:K.gold, radius:4})]);
DS("progressRing", "원형 진행", 120, 120, [sh(0, 0, 120, 120, "ring", {fill:K.line}), dc(4, 4, 112, 112, "segmentRing", {lineWidth:3}), lbl("72%", {fontSize:24, fontWeight:700, font:'"Inter"'})]);
DS("gaugeWidget", "게이지 위젯", 170, 150, [dc(0, 0, 170, 145, "gauge"), t(0, 104, 170, 30, "3,240 rpm", {align:"center", font:MONO, fontSize:14, color:K.gold})]);
DS("alertInfo", "안내 알림", 380, 64, alert(K.cyan, "drop", "새 버전이 준비되었습니다. 다시 열면 적용됩니다."));
DS("alertWarn", "주의 알림", 380, 64, alert(K.amber, "triangle", "저장 공간이 거의 찼습니다."));
DS("alertError", "오류 알림", 380, 64, alert(K.red, "xMark", "연결에 실패했습니다. 다시 시도해 주세요."));
DS("toast", "토스트 메시지", 300, 52, [r(0, 0, 300, 52, {fill:K.panel2, radius:10, ...bd(K.line), ...SHADOW, anims:["riseIn"]}, [el(14, 14, 24, 24, {fill:K.green}, [sh(6, 7, 12, 10, "check", {fill:K.ink})]), t(50, 0, 236, 52, "저장되었습니다", {valign:"center"})])]);
DS("tooltip", "툴팁", 170, 60, [sh(0, 0, 170, 60, "speech", {fill:"#2a2a30"}), t(14, 4, 142, 40, "단축키 Ctrl+S", {valign:"center", fontSize:13})]);
DS("spinner", "로딩 스피너", 48, 48, [sh(0, 0, 48, 48, "ringThin", {fill:K.line}), dc(0, 0, 48, 48, "segmentRing", {lineWidth:2.5, anims:["spin"]})]);
DS("statusDot", "상태 표시", 120, 20, [el(0, 5, 10, 10, {fill:K.green, anims:["pulse"]}), t(18, 0, 100, 20, "온라인", {fontSize:13, valign:"center"})]);
DS("kpi", "핵심 지표", 220, 96, [t(0, 0, 220, 20, "전환율", {color:K.muted, fontSize:13}), t(0, 22, 140, 44, "4.82%", {fontSize:34, fontWeight:700, font:'"Inter"'}), dc(150, 30, 70, 36, "dataBars", {fill:K.gold, fillAlpha:.8}), t(0, 72, 220, 20, "▼ 0.3% 지난주 대비", {color:K.red, fontSize:12})]);
DS("skeleton", "스켈레톤 로딩", 300, 100, [r(0, 0, 300, 100, {fill:K.panel, radius:12, clip:true, fx:[{effect:"shine", color:"#ffffff", intensity:.35}]}, [el(16, 18, 48, 48, {fill:K.panel2}), r(78, 22, 180, 12, {fill:K.panel2, radius:6}), r(78, 44, 120, 12, {fill:K.panel2, radius:6}), r(16, 78, 268, 10, {fill:K.panel2, radius:5})])]);

/* 섹션 */
const SC = (id, name, w, h, kids) => add("섹션", id, name, w, h, kids);
SC("secHero", "히어로 섹션", 960, 440, [r(0, 0, 960, 440, {fill:"#111114", radius:20, ...bd(K.line), clip:true}, [sh(600, 60, 320, 320, "blob2", {fill:K.gold, fillAlpha:.08}), dc(660, 120, 200, 200, "reticle", {fillAlpha:.6}), t(56, 70, 400, 20, "RASYANCUT · SYSTEM", {color:K.gold, font:MONO, fontSize:13, letterSpacing:3}), t(56, 104, 560, 130, "보이는 모든 것을\n직접 설계하세요", {fontSize:50, fontWeight:700, lineHeight:1.2}), t(56, 250, 480, 52, "도형, 장식, 애니메이션, VFX를 끌어 놓고 바로 HTML로 내보냅니다.", {color:K.muted, fontSize:16, lineHeight:1.6}), btn(170, 52, "시작하기", {x:56, y:330}), btn(170, 52, "예시 보기", {x:240, y:330, fillAlpha:0, ...bd(K.gold)}, {color:K.gold})])]);
SC("secFeatures", "기능 3열", 960, 260, [t(0, 0, 960, 36, "왜 UI Forge인가요", {fontSize:28, fontWeight:700, align:"center"}), ...[["bolt", "빠름", "설치 없이 바로 편집합니다."], ["gear8", "정밀함", "px과 %로 위치를 정확히 맞춥니다."], ["sparkle", "화려함", "VFX 400종을 바로 씁니다."]].map(([s, h2, d], i) => r(i * 330, 70, 300, 180, {...bd(K.line), radius:14}, [r(22, 22, 44, 44, {fill:K.gold, fillAlpha:.12, radius:10}, [sh(12, 12, 20, 20, s)]), t(22, 82, 256, 26, h2, {fontSize:18, fontWeight:600}), t(22, 114, 256, 44, d, {color:K.muted, lineHeight:1.6})]))]);
SC("secCta", "행동 유도 섹션", 960, 200, [r(0, 0, 960, 200, {fill:K.gold, radius:20}, [t(0, 44, 960, 40, "오늘 첫 화면을 만들어 보세요", {color:K.ink, fontSize:30, fontWeight:700, align:"center"}), r(400, 112, 160, 50, {fill:K.ink, radius:25}, [lbl("무료로 시작", {color:K.gold, fontWeight:600})])])]);
SC("secPricing", "요금표 3열", 960, 380, [...[["베이직", "무료"], ["프로", "₩19,000"], ["팀", "₩49,000"]].map(([n, p], i) => r(i * 330, i === 1 ? 0 : 20, 300, i === 1 ? 380 : 340, {...bd(i === 1 ? K.gold : K.line), radius:16}, [t(28, 28, 244, 22, n, {color:i === 1 ? K.gold : K.muted, font:MONO, letterSpacing:2, fontSize:13}), t(28, 58, 244, 44, p, {fontSize:32, fontWeight:700}), ...range(3, k => t(28, 130 + k * 32, 244, 24, [["프로젝트 3개", "프로젝트 무제한", "프로젝트 무제한"][i], "VFX " + [23, 400, 400][i] + "종", ["커뮤니티 지원", "우선 지원", "전담 지원"][i]][k], {color:K.muted})), btn(244, 46, "선택하기", {x:28, y:i === 1 ? 306 : 266, ...(i === 1 ? {} : {fillAlpha:0, ...bd(K.gold)})}, i === 1 ? {} : {color:K.gold})]))]);
SC("secFaq", "자주 묻는 질문", 720, 210, [...["설치가 필요한가요?", "내보낸 코드를 수정할 수 있나요?", "모바일 화면도 지원하나요?"].map((q, i) => [t(0, i * 70, 640, 56, q, {fontSize:17, fontWeight:500, valign:"center"}), sh(694, i * 70 + 20, 16, 16, "plus", {fill:K.gold}), r(0, i * 70 + 62, 720, 1, {fill:K.line})]).flat()]);
SC("secTestimonials", "후기 모음", 960, 220, [...[["“처음 써 봐도 바로 익숙해졌어요.”", "최유진 · 디자이너"], ["“VFX 덕분에 랜딩 페이지가 살아났어요.”", "정도윤 · 마케터"]].map(([q, n], i) => r(i * 490, 0, 470, 220, {...bd(K.line), radius:16}, [t(28, 10, 60, 60, "“", {color:K.gold, font:SERIF, fontSize:60}), t(28, 70, 414, 70, q.slice(1, -1), {fontSize:18, lineHeight:1.6}), t(28, 162, 414, 22, n, {color:K.muted, fontSize:13})]))]);
SC("secStats", "숫자 통계 줄", 960, 120, [...[["400+", "VFX 효과"], ["200", "애니메이션"], ["113", "도형"], ["0원", "시작 비용"]].map(([v, l], i) => [t(i * 240, 10, 240, 52, v, {fontSize:40, fontWeight:700, align:"center", color:K.gold, font:'"Inter"'}), t(i * 240, 68, 240, 22, l, {color:K.muted, align:"center"}), ...(i ? [r(i * 240, 20, 1, 70, {fill:K.line})] : [])]).flat()]);
SC("secLogos", "로고 줄", 960, 90, [t(0, 0, 960, 20, "함께하는 팀", {color:K.muted, fontSize:13, align:"center", letterSpacing:2}), ...range(5, i => r(i * 196, 38, 176, 48, {fill:K.panel2, radius:8}, [lbl("LOGO " + (i + 1), {color:K.muted, font:MONO, letterSpacing:2, fontSize:13})]))]);
SC("secContact", "연락처 블록", 480, 230, [card(480, 230, {}, [t(28, 26, 424, 30, "연락처", {fontSize:22, fontWeight:700}), ...[["pin", "서울시 강남구 테헤란로 1"], ["speech", "hello@uiforge.dev"], ["house", "평일 10:00 – 18:00"]].map(([s, txt], i) => [sh(28, 80 + i * 44, 20, 20, s, {fill:K.gold}), t(62, 76 + i * 44, 380, 28, txt, {valign:"center", color:K.muted})]).flat()])]);
SC("secTimeline", "타임라인 목록", 420, 280, [r(9, 8, 2, 260, {fill:K.line}), ...[["2024", "첫 버전 공개"], ["2025", "VFX 엔진 추가"], ["2026", "라이브러리 1,000종"], ["다음", "협업 기능"]].map(([y, d], i) => [el(0, i * 70 + 4, 20, 20, {fill:i < 3 ? K.gold : K.panel2, ...(i < 3 ? {} : bd(K.gold))}), t(40, i * 70, 120, 22, y, {color:K.gold, font:MONO, fontSize:13}), t(40, i * 70 + 24, 360, 24, d, {fontSize:16})]).flat()]);
SC("secHeader", "섹션 제목", 600, 110, [t(0, 0, 600, 20, "FEATURES", {color:K.gold, font:MONO, fontSize:13, letterSpacing:4, align:"center"}), t(0, 28, 600, 44, "필요한 모든 것", {fontSize:34, fontWeight:700, align:"center"}), dc(180, 86, 240, 20, "lineDiamond")]);
SC("secFooter", "푸터 열", 960, 220, [r(0, 0, 960, 220, {...bd(K.line), radius:16}, [t(32, 32, 220, 28, "UI FORGE", {color:K.gold, font:SERIF, fontSize:20, fontWeight:700, letterSpacing:2}), t(32, 68, 220, 60, "웹 홈페이지를 위한\n비주얼 에디터", {color:K.muted, fontSize:13, lineHeight:1.6}),
  ...[["제품", ["기능", "요금", "업데이트"]], ["자료", ["문서", "예시", "블로그"]], ["회사", ["소개", "채용", "문의"]]].map(([h2, ls], i) => [t(380 + i * 190, 32, 160, 22, h2, {fontWeight:600}), ...ls.map((s, k) => t(380 + i * 190, 66 + k * 30, 160, 22, s, {color:K.muted, fontSize:13}))]).flat(), r(32, 170, 896, 1, {fill:K.line}), t(32, 182, 600, 22, "© 2026 UI Forge", {color:K.muted, fontSize:12})])]);

/* 게임·HUD */
const GM = (id, name, w, h, kids) => add("게임·HUD", id, name, w, h, kids);
const bar = (c, label, v, max) => [r(0, 0, 260, 28, {fill:"#0e0e12", radius:4, ...bd(c)}, [r(3, 3, Math.round(254 * v / max), 22, {fill:c, radius:2}), lbl(`${label} ${v}/${max}`, {font:MONO, fontSize:12, fontWeight:700, color:"#ffffff", letterSpacing:1})])];
GM("hpBar", "체력 바", 260, 28, bar(K.red, "HP", 70, 100));
GM("mpBar", "마나 바", 260, 28, bar(K.blue, "MP", 45, 80));
GM("hudPanel", "HUD 패널", 320, 210, [r(4, 4, 312, 202, {fill:K.cyan, fillAlpha:.05}), dc(0, 0, 320, 210, "frameHUD", {fill:K.cyan, fx:[{effect:"scanlines", color:K.cyan, intensity:.6}]}), t(22, 20, 276, 20, "TARGET ANALYSIS", {color:K.cyan, font:MONO, fontSize:12, letterSpacing:2}), ...["거리   1,280 m", "속도   340 km/h", "위험도  낮음"].map((s, i) => t(22, 54 + i * 28, 276, 24, s, {font:MONO, fontSize:13, color:K.text})), dc(22, 160, 276, 24, "rulerH", {fill:K.cyan, fillAlpha:.7, lineWidth:1})]);
GM("minimap", "미니맵", 170, 170, [el(0, 0, 170, 170, {fill:"#0b1418", ...bd(K.cyan)}), dc(10, 10, 150, 150, "radar", {fill:K.cyan, lineWidth:1}), sh(77, 74, 16, 20, "triangle", {fill:K.gold}), t(0, 150, 170, 20, "N", {color:K.cyan, font:MONO, fontSize:11, align:"center"})]);
GM("skillBar", "스킬 슬롯", 316, 68, [...["bolt", "star5", "drop", "heart", "sun"].map((s, i) => r(i * 64, 0, 56, 56, {fill:"#0e0e12", radius:8, ...bd(i === 0 ? K.gold : K.line)}, [sh(14, 14, 28, 28, s, {fill:[K.amber, K.gold, K.cyan, K.red, K.amber][i], fillAlpha:i === 4 ? .35 : 1}), t(4, 36, 16, 16, String(i + 1), {font:MONO, fontSize:10, color:K.muted})]))]);
GM("inventory", "인벤토리", 228, 156, [...range(6, i => r((i % 3) * 78, Math.floor(i / 3) * 80, 70, 72, {fill:"#0e0e12", radius:8, ...bd(K.line)}, i < 4 ? [sh(19, 18, 32, 32, ["shield", "drop", "crown", "leaf"][i], {fill:[K.muted, K.red, K.gold, K.green][i]}), t(40, 50, 26, 18, ["", "×3", "", "×12"][i], {font:MONO, fontSize:10, color:K.muted, align:"right"})] : []))]);
GM("dialogBox", "대화 상자", 620, 160, [r(0, 20, 620, 140, {fill:"#0e0e12", fillAlpha:.92, radius:12, ...bd(K.gold)}, [t(28, 30, 560, 70, "여행자여, 이 문을 지나면 돌아올 수 없다.\n그래도 가겠는가?", {fontSize:17, lineHeight:1.7}), sh(586, 112, 14, 10, "triangleDown", {anims:["blink"]})]), r(24, 0, 120, 36, {fill:K.gold, radius:6}, [lbl("문지기", {color:K.ink, fontWeight:700})])]);
GM("questMarker", "퀘스트 표시", 60, 90, [sh(0, 0, 60, 80, "pin", {fill:K.amber, anims:["float"]}), t(0, 6, 60, 44, "!", {color:K.ink, fontSize:28, fontWeight:900, align:"center", valign:"center", anims:["float"]})]);
GM("scoreCounter", "점수판", 220, 70, [r(0, 0, 220, 70, {fill:"#0e0e12", radius:10, ...bd(K.line)}, [t(18, 10, 184, 16, "SCORE", {color:K.muted, font:MONO, fontSize:11, letterSpacing:3}), t(18, 26, 184, 36, "0128450", {color:K.gold, font:DISPLAY, fontSize:28, fontWeight:700, letterSpacing:2})])]);
GM("crosshairHud", "조준 오버레이", 170, 170, [dc(25, 25, 120, 120, "crosshair", {fill:K.cyan}), dc(0, 0, 170, 170, "targetLock", {fill:K.cyan, fillAlpha:.6, lineWidth:1}), t(110, 140, 60, 20, "128m", {color:K.cyan, font:MONO, fontSize:11, align:"right"})]);

export const COMPONENTS = C;
export const COMPONENT = Object.fromEntries(C.map(c => [c.id, c]));
