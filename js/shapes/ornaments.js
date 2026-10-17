/* 장식 라이브러리: 구분선·모서리·프레임·HUD·패턴·신화 문양·우주·신성·시스템.
   선 위주의 SVG로, 색은 currentColor(요소의 채우기 색), 선 두께는 --sw(요소의 선 두께)를 따른다.
   viewBox를 요소 크기에 맞춰 늘리고(preserveAspectRatio="none"), 선은 non-scaling-stroke로 두께를 유지한다. */

export const ORNAMENT_CATEGORIES = ["구분선", "모서리", "프레임", "HUD", "패턴", "신화·고전", "우주·천체", "신성", "시스템·버추얼"];
// 장식 SVG 공용 스타일 (편집기와 내보내기가 함께 쓴다)
export const ORN_CSS = ".o-s{fill:none;stroke:currentColor;stroke-width:var(--sw,1.5px);vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.o-f{fill:currentColor}.o-d{stroke-dasharray:6 5}.o-t{stroke-dasharray:0 6}.o-g{stroke-width:calc(var(--sw,1.5px)*4.5);opacity:.14}.o-g2{stroke-width:calc(var(--sw,1.5px)*2.2);opacity:.3}";

const f = n => +(+n).toFixed(2);
const rad = d => d * Math.PI / 180;
const P = (x, y) => `${f(x)} ${f(y)}`;
const M = (pts, close) => "M" + pts.map(([x, y]) => P(x, y)).join("L") + (close ? "Z" : "");
const L = (x1, y1, x2, y2) => `M${P(x1, y1)}L${P(x2, y2)}`;
const circ = (cx, cy, r) => `M${P(cx - r, cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2*r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2*r)} 0Z`;
// 각도(도, 0=오른쪽, 시계 방향)로 지정한 원호
const arc = (cx, cy, r, a0, a1) => { const p0 = [cx + r*Math.cos(rad(a0)), cy + r*Math.sin(rad(a0))], p1 = [cx + r*Math.cos(rad(a1)), cy + r*Math.sin(rad(a1))];
  return `M${P(...p0)}A${f(r)} ${f(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${P(...p1)}`; };
const pol = (cx, cy, r, a) => [cx + r*Math.cos(rad(a)), cy + r*Math.sin(rad(a))];
const S = (d, cls = "", extra = "") => `<path class="o-s${cls ? " " + cls : ""}" d="${d}"${extra}/>`;
const F = (d, extra = "") => `<path class="o-f" d="${d}"${extra}/>`;
const op = v => ` opacity="${v}"`;
const range = (n, fn) => Array.from({length:n}, (_, i) => fn(i));
const diamond = (cx, cy, rx, ry = rx) => M([[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]], true);
const sine = (x0, x1, y, amp, waves, steps = 80) => M(range(steps + 1, i => [x0 + (x1 - x0) * i / steps, y + amp * Math.sin(i / steps * waves * Math.PI * 2)]));

const O = [];
// vb: viewBox 크기 [w, h], size: 넣을 때 기본 크기(px), color: 넣을 때 기본 색(없으면 요소 기본값)
const add = (cat, id, name, vb, size, svg, color) => O.push({cat, id, name, vb, size, svg, clip:cat === "패턴", ...(color ? {color} : {})});

/* 구분선 (viewBox 200×20) */
const DV = [200, 20], DS = [320, 24], D = (id, name, svg) => add("구분선", id, name, DV, DS, svg);
D("lineSimple", "한 줄", S(L(0, 10, 200, 10)));
D("lineDouble", "두 줄", S(L(0, 7, 200, 7)) + S(L(0, 13, 200, 13)));
D("lineDashed", "파선", S(L(0, 10, 200, 10), "o-d"));
D("lineDotted", "점선", S(L(2, 10, 198, 10), "o-t"));
D("lineDiamond", "가운데 마름모", S(L(0, 10, 88, 10) + L(112, 10, 200, 10)) + F(diamond(100, 10, 7, 6)));
D("lineDot", "가운데 점", S(L(0, 10, 92, 10) + L(108, 10, 200, 10)) + F(circ(100, 10, 3)));
D("lineRing", "가운데 고리", S(L(0, 10, 90, 10) + L(110, 10, 200, 10) + circ(100, 10, 6)));
D("threeDots", "점 세 개", F(circ(86, 10, 2.5) + circ(100, 10, 2.5) + circ(114, 10, 2.5)));
D("lineTaper", "흐려지는 선", range(5, i => S(L(100 - (i + 1) * 20, 10, 100 - i * 20, 10) + L(100 + i * 20, 10, 100 + (i + 1) * 20, 10), "", op(f(1 - i * .2)))).join(""));
D("lineArrows", "양쪽 화살표 선", S(L(4, 10, 196, 10) + M([[12, 4], [4, 10], [12, 16]]) + M([[188, 4], [196, 10], [188, 16]])));
D("lineCaps", "끝 막음 선", S(L(0, 10, 200, 10) + L(1, 3, 1, 17) + L(199, 3, 199, 17) + L(50, 6, 50, 14) + L(100, 5, 100, 15) + L(150, 6, 150, 14)));
D("lineScroll", "소용돌이 장식선", S(L(0, 10, 78, 10) + L(122, 10, 200, 10) + "M78 10C88 10 90 2 96 4S98 14 94 13M122 10C112 10 110 18 104 16S102 6 106 7") + F(circ(100, 10, 2)));
D("lineWave", "물결선", S(sine(0, 200, 10, 5, 6)));
D("lineZigzag", "지그재그 선", S(M(range(21, i => [i * 10, i % 2 ? 4 : 16]))));
D("lineChain", "사슬", range(10, i => S(`M${P(i * 20 + 4, 10)}a8 5 0 1 0 16 0a8 5 0 1 0 -16 0Z`)).join(""));
D("lineBracket", "꺾쇠 구분선", S(M([[0, 16], [8, 10], [192, 10], [200, 4]])));
D("lineNotch", "홈 구분선", S(M([[0, 12], [78, 12], [86, 5], [114, 5], [122, 12], [200, 12]])));
D("lineSegments", "끊긴 막대", F(range(8, i => { const x = [0, 34, 48, 90, 104, 146, 160, 190][i], w = [30, 10, 38, 10, 38, 10, 26, 10][i]; return M([[x, 8], [x + w, 8], [x + w, 12], [x, 12]], true); }).join("")));
D("lineStar", "가운데 별", S(L(0, 10, 86, 10) + L(114, 10, 200, 10)) + F("M100 1Q101.5 8.5 109 10Q101.5 11.5 100 19Q98.5 11.5 91 10Q98.5 8.5 100 1Z"));
D("diamondChain", "마름모 사슬", S(range(12, i => diamond(8 + i * 16.7, 10, 6, 5)).join("")));
D("lineAngles", "꺾쇠 끝 선", S(L(14, 10, 186, 10) + M([[10, 3], [3, 10], [10, 17]]) + M([[190, 3], [197, 10], [190, 17]])));
D("lineEndDots", "끝 점 선", S(L(6, 10, 194, 10)) + F(circ(4, 10, 3.5) + circ(196, 10, 3.5)));
D("lineConverge", "모이는 선", S(M([[0, 4], [88, 10]]) + M([[0, 16], [88, 10]]) + M([[200, 4], [112, 10]]) + M([[200, 16], [112, 10]])) + F(diamond(100, 10, 8, 5)));
D("lineCrosses", "엑스 표식 선", S(L(0, 10, 200, 10) + range(5, i => { const x = 20 + i * 40; return L(x - 3, 7, x + 3, 13) + L(x - 3, 13, x + 3, 7); }).join("")));

/* 모서리 (왼쪽 위 모서리, viewBox 100×100) */
const CV = [100, 100], CS = [80, 80], C = (id, name, svg) => add("모서리", id, name, CV, CS, svg);
C("cornerL", "꺾쇠 모서리", S(M([[2, 60], [2, 2], [60, 2]])));
C("cornerDouble", "이중 꺾쇠", S(M([[2, 60], [2, 2], [60, 2]]) + M([[12, 44], [12, 12], [44, 12]])));
C("cornerRound", "둥근 모서리", S("M2 64V24Q2 2 24 2H64"));
C("cornerNotch", "깎인 모서리", S(M([[2, 64], [2, 20], [20, 2], [64, 2]])));
C("cornerDot", "점 모서리", S(M([[2, 56], [2, 2], [56, 2]])) + F(circ(16, 16, 5)));
C("cornerSwirl", "소용돌이 모서리", S("M2 80V2H80M2 2C30 6 40 18 38 32S24 46 18 36S24 20 32 26" + "M2 2C6 30 18 40 32 38"));
C("cornerTriangle", "삼각 모서리", F(M([[0, 0], [34, 0], [0, 34]], true)) + S(M([[2, 70], [2, 42]]) + M([[42, 2], [70, 2]])));
C("cornerSteps", "계단 모서리", S(M([[2, 70], [2, 46], [14, 46], [14, 26], [26, 26], [26, 14], [46, 14], [46, 2], [70, 2]])));
C("cornerTicks", "눈금 모서리", S(M([[2, 80], [2, 2], [80, 2]]) + range(6, i => L(2, 14 + i * 11, i % 2 ? 7 : 11, 14 + i * 11) + L(14 + i * 11, 2, 14 + i * 11, i % 2 ? 7 : 11)).join("")));
C("cornerArcs", "원호 모서리", S(arc(0, 0, 30, 0, 90) + arc(0, 0, 50, 0, 90) + arc(0, 0, 70, 0, 90), "", ""));
C("cornerCircuit", "회로 모서리", S(M([[2, 90], [2, 2], [90, 2]]) + M([[14, 70], [14, 30], [30, 14], [70, 14]]) + M([[26, 50], [26, 38], [38, 26], [50, 26]])) + F(circ(14, 70, 3) + circ(70, 14, 3) + circ(26, 50, 2.5) + circ(50, 26, 2.5)));
C("cornerFan", "부채 모서리", S(arc(0, 0, 44, 0, 90) + arc(0, 0, 30, 0, 90) + range(5, i => { const a = 9 + i * 18; return L(...pol(0, 0, 30, a), ...pol(0, 0, 44, a)); }).join("") + M([[2, 90], [2, 2], [90, 2]])));
C("cornerLeaf", "잎 모서리", S(M([[2, 80], [2, 2], [80, 2]])) + F("M8 8C30 10 40 24 42 42C24 40 10 30 8 8Z", op(.85)));
C("cornerPlus", "십자 모서리", S(M([[2, 50], [2, 2], [50, 2]]) + L(20, 12, 20, 28) + L(12, 20, 28, 20)));

/* 프레임 (viewBox 100×100) */
const FV = [100, 100], FS = [240, 160], FR = (id, name, svg) => add("프레임", id, name, FV, FS, svg);
const corners = (len, ins = 1) => [[ins, ins, 1, 1], [100 - ins, ins, -1, 1], [100 - ins, 100 - ins, -1, -1], [ins, 100 - ins, 1, -1]].map(([x, y, sx, sy]) => M([[x, y + sy * len], [x, y], [x + sx * len, y]])).join("");
FR("frameThin", "얇은 프레임", S(M([[1, 1], [99, 1], [99, 99], [1, 99]], true)));
FR("frameDouble", "이중 프레임", S(M([[1, 1], [99, 1], [99, 99], [1, 99]], true) + M([[5, 5], [95, 5], [95, 95], [5, 95]], true)));
FR("frameCut", "깎인 프레임", S(M([[10, 1], [90, 1], [99, 10], [99, 90], [90, 99], [10, 99], [1, 90], [1, 10]], true)));
FR("frameHUD", "HUD 프레임", S(M([[1, 12], [1, 1], [36, 1], [40, 5], [60, 5], [64, 1], [99, 1], [99, 88], [88, 99], [1, 99]], true) + L(4, 30, 4, 70) + L(96, 20, 96, 50)));
FR("frameBrackets", "네 모서리 꺾쇠", S(corners(16)));
FR("frameBracketDots", "꺾쇠와 점", S(corners(12)) + F(circ(50, 1.5, 1.5) + circ(50, 98.5, 1.5) + circ(1.5, 50, 1.5) + circ(98.5, 50, 1.5)));
FR("frameSquare", "대괄호 프레임", S(M([[10, 1], [1, 1], [1, 99], [10, 99]]) + M([[90, 1], [99, 1], [99, 99], [90, 99]])));
FR("frameTab", "탭 프레임", S(M([[1, 12], [1, 1], [34, 1], [38, 8], [99, 8], [99, 99], [1, 99]], true)));
FR("frameDeco", "아르데코 프레임", S(M([[1, 8], [8, 8], [8, 1], [92, 1], [92, 8], [99, 8], [99, 92], [92, 92], [92, 99], [8, 99], [8, 92], [1, 92]], true) + M([[12, 5], [88, 5], [88, 12], [95, 12], [95, 88], [88, 88], [88, 95], [12, 95], [12, 88], [5, 88], [5, 12], [12, 12]], true), "", op(.9)));
FR("frameDotted", "점선 프레임", S(M([[1, 1], [99, 1], [99, 99], [1, 99]], true), "o-t"));
FR("frameTicks", "눈금 프레임", S(M([[1, 1], [99, 1], [99, 99], [1, 99]], true) + range(9, i => { const v = 10 + i * 10, l = i === 4 ? 6 : 3; return L(v, 1, v, 1 + l) + L(v, 99, v, 99 - l) + L(1, v, 1 + l, v) + L(99, v, 99 - l, v); }).join("")));
FR("frameCornerSquares", "모서리 사각 프레임", S(M([[4, 4], [96, 4], [96, 96], [4, 96]], true)) + F([[0, 0], [92, 0], [92, 92], [0, 92]].map(([x, y]) => M([[x, y], [x + 8, y], [x + 8, y + 8], [x, y + 8]], true)).join("")));
FR("frameOctagon", "팔각 프레임", S(M([[30, 1], [70, 1], [99, 30], [99, 70], [70, 99], [30, 99], [1, 70], [1, 30]], true)));
FR("frameSideBars", "옆 막대 프레임", S(L(6, 1, 94, 1) + L(6, 99, 94, 99)) + F(M([[0, 10], [3, 10], [3, 90], [0, 90]], true) + M([[97, 10], [100, 10], [100, 90], [97, 90]], true)));
FR("frameTitleGap", "제목 틈 프레임", S(M([[24, 1], [1, 1], [1, 99], [99, 99], [99, 1], [76, 1]])) + F(diamond(24, 1, 1.6, 2.4) + diamond(76, 1, 1.6, 2.4)));
FR("frameRoundDouble", "둥근 이중 프레임", S("M12 1H88Q99 1 99 12V88Q99 99 88 99H12Q1 99 1 88V12Q1 1 12 1Z" + "M14 6H86Q94 6 94 14V86Q94 94 86 94H14Q6 94 6 86V14Q6 6 14 6Z"));

/* HUD (viewBox 100×100) */
const HV = [100, 100], HS = [120, 120], H = (id, name, svg, vb = HV, size = HS) => add("HUD", id, name, vb, size, svg);
H("crosshair", "조준선", S(circ(50, 50, 30) + L(50, 2, 50, 36) + L(50, 64, 50, 98) + L(2, 50, 36, 50) + L(64, 50, 98, 50)) + F(circ(50, 50, 2)));
H("reticle", "레티클", S(circ(50, 50, 46) + circ(50, 50, 22) + range(12, i => L(...pol(50, 50, 46, i * 30), ...pol(50, 50, i % 3 ? 41 : 34, i * 30))).join("")));
H("targetLock", "조준 꺾쇠", S(corners(14, 4) + circ(50, 50, 10)) + F(circ(50, 50, 2)));
H("radar", "레이더", S(circ(50, 50, 48) + circ(50, 50, 32) + circ(50, 50, 16) + L(50, 2, 50, 98) + L(2, 50, 98, 50), "", op(.6)) + S(L(50, 50, ...pol(50, 50, 48, -40))) + F(circ(70, 32, 2.5) + circ(30, 64, 2)));
H("compass", "나침반", S(circ(50, 50, 46)) + F(M([[50, 6], [56, 50], [50, 94], [44, 50]], true) + M([[6, 50], [50, 44], [94, 50], [50, 56]], true), op(.85)) + S(range(8, i => L(...pol(50, 50, 46, i * 45 + 22.5), ...pol(50, 50, 40, i * 45 + 22.5))).join("")));
H("gauge", "게이지", S(arc(50, 56, 42, 150, 390) + range(13, i => L(...pol(50, 56, 42, 150 + i * 20), ...pol(50, 56, i % 3 ? 37 : 32, 150 + i * 20))).join("") + L(50, 56, ...pol(50, 56, 34, 300))) + F(circ(50, 56, 4)), HV, [140, 120]);
const hexAt = (cx, cy, r) => M(range(6, i => pol(cx, cy, r, i * 60)), true);
H("hexCluster", "육각 무리", S([[50, 50], [50, 22], [50, 78], [26, 36], [74, 36], [26, 64], [74, 64]].map(([x, y]) => hexAt(x, y, 15)).join("")));
H("dataBars", "데이터 막대", F([38, 62, 48, 86, 70, 54, 92, 30].map((h, i) => M([[i * 12.5 + 2, 100 - h], [i * 12.5 + 10.5, 100 - h], [i * 12.5 + 10.5, 100], [i * 12.5 + 2, 100]], true)).join("")), HV, [140, 80]);
H("barcode", "바코드", F([2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 4, 1, 2].reduce((a, w, i) => { const x = a.x; a.x += w + 1.6; if(i % 2 === 0) a.d += M([[x * 2, 0], [(x + w) * 2, 0], [(x + w) * 2, 100], [x * 2, 100]], true); return a; }, {x:1, d:""}).d), [154, 100], [140, 60]);
H("rulerH", "가로 눈금자", S(L(0, 18, 200, 18) + range(41, i => L(i * 5, 18, i * 5, i % 10 === 0 ? 2 : i % 5 === 0 ? 8 : 12)).join("")), [200, 20], [320, 28]);
H("rulerV", "세로 눈금자", S(L(18, 0, 18, 200) + range(41, i => L(18, i * 5, i % 10 === 0 ? 2 : i % 5 === 0 ? 8 : 12, i * 5)).join("")), [20, 200], [28, 320]);
H("segmentRing", "분할 고리", S(range(12, i => arc(50, 50, 44, i * 30 + 3, i * 30 + 25)).join("") + range(4, i => arc(50, 50, 34, i * 90 + 10, i * 90 + 70)).join("")));
H("chevrons", "갈매기 표시", range(3, i => S(M([[10 + i * 30, 15], [40 + i * 30, 50], [10 + i * 30, 85]]), "", op(f(.4 + i * .3)))).join(""), HV, [120, 60]);
H("loadingDots", "로딩 점", range(5, i => F(circ(10 + i * 20, 12.5, 7), op(f(1 - i * .18)))).join(""), [100, 25], [120, 30]);
H("coordGrid", "좌표 격자", S(range(16, i => { const x = 12.5 + (i % 4) * 25, y = 12.5 + Math.floor(i / 4) * 25; return L(x - 4, y, x + 4, y) + L(x, y - 4, x, y + 4); }).join("")));
H("signal", "신호", S(arc(50, 80, 15, 225, 315) + arc(50, 80, 32, 225, 315) + arc(50, 80, 49, 225, 315)) + F(circ(50, 80, 5)));
H("warning", "경고 삼각형", S(M([[50, 6], [96, 90], [4, 90]], true) + L(50, 34, 50, 62)) + F(circ(50, 74, 3.5)));
H("battery", "배터리", S(M([[2, 25], [88, 25], [88, 75], [2, 75]], true) + M([[88, 40], [96, 40], [96, 60], [88, 60]])) + F(range(3, i => M([[9 + i * 26, 32], [29 + i * 26, 32], [29 + i * 26, 68], [9 + i * 26, 68]], true)).join("")), HV, [120, 60]);
H("hexBadgeLine", "육각 배지 선", S(hexAt(50, 50, 48) + hexAt(50, 50, 38)) + F(hexAt(50, 50, 10)));
H("scanBox", "스캔 상자", S(M([[12, 2], [2, 2], [2, 98], [12, 98]]) + M([[88, 2], [98, 2], [98, 98], [88, 98]])) + S(L(8, 40, 92, 40), "", op(.7)) + F(M([[8, 39], [92, 39], [92, 41], [8, 41]], true), op(.15)));

/* 패턴 (viewBox 100×100) */
const PV = [100, 100], PS = [200, 200], PT = (id, name, svg) => add("패턴", id, name, PV, PS, svg);
PT("dotGrid", "점 격자", F(range(100, i => circ(5 + (i % 10) * 10, 5 + Math.floor(i / 10) * 10, 1.1)).join("")));
PT("lineGrid", "선 격자", S(range(9, i => L((i + 1) * 10, 0, (i + 1) * 10, 100) + L(0, (i + 1) * 10, 100, (i + 1) * 10)).join(""), "", op(.8)));
PT("diagStripes", "사선 줄무늬", S(range(20, i => L(i * 10 - 100, 100, i * 10, 0)).join("")));
PT("crosshatch", "격자 빗금", S(range(20, i => L(i * 10 - 100, 100, i * 10, 0) + L(i * 10 - 100, 0, i * 10, 100)).join(""), "", op(.8)));
PT("hexPattern", "육각 무늬", S(range(36, i => { const c = i % 6, r = Math.floor(i / 6); return hexAt(c * 18 + (r % 2) * 9 + 5, r * 15.6 + 6, 9); }).join("")));
PT("trianglePattern", "삼각 무늬", S(range(5, r => M(range(11, i => [i * 10, r * 20 + (i % 2 ? 0 : 20)]))).join("") + range(6, r => L(0, r * 20, 100, r * 20)).join("")));
PT("wavesPattern", "물결 무늬", S(range(8, i => sine(0, 100, 7 + i * 12.5, 4, 3)).join("")));
PT("zigzagPattern", "지그재그 무늬", S(range(8, r => M(range(11, i => [i * 10, r * 12.5 + 3 + (i % 2 ? 0 : 7)]))).join("")));
PT("concentric", "동심원", S(range(6, i => circ(50, 50, 8 + i * 8)).join("")));
PT("chevronPattern", "갈매기 무늬", S(range(7, r => M(range(5, i => [i * 25, r * 15 + 4 + (i % 2 ? 8 : 0)]))).join("")));
PT("checker", "체크 무늬", F(range(64, i => { const c = i % 8, r = Math.floor(i / 8); return (c + r) % 2 ? "" : M([[c * 12.5, r * 12.5], [c * 12.5 + 12.5, r * 12.5], [c * 12.5 + 12.5, r * 12.5 + 12.5], [c * 12.5, r * 12.5 + 12.5]], true); }).join(""), op(.7)));
PT("plusPattern", "십자 무늬", S(range(25, i => { const x = 10 + (i % 5) * 20, y = 10 + Math.floor(i / 5) * 20; return L(x - 3, y, x + 3, y) + L(x, y - 3, x, y + 3); }).join("")));
PT("diamondLattice", "마름모 격자", S(range(16, i => diamond(12.5 + (i % 4) * 25, 12.5 + Math.floor(i / 4) * 25, 12.5)).join("")));
PT("sunburst", "방사선", S(range(36, i => L(50, 50, ...pol(50, 50, 72, i * 10))).join(""), "", op(.8)));
PT("spiral", "나선", S(M(range(241, i => { const a = i / 240 * Math.PI * 10, r = 2 + i / 240 * 46; return [50 + r * Math.cos(a), 50 + r * Math.sin(a)]; }))));
PT("seigaiha", "세이가이하 물결", S(range(30, i => { const c = i % 6, r = Math.floor(i / 6), cx = c * 20 + (r % 2) * 10, cy = r * 10 + 20; return arc(cx, cy, 10, 180, 360) + arc(cx, cy, 6.5, 180, 360) + arc(cx, cy, 3, 180, 360); }).join("")));

/* 신화·고전 */
const MV = [100, 100], MS = [140, 140], MY = (id, name, svg, vb = MV, size = MS) => add("신화·고전", id, name, vb, size, svg);
const leaf = (x, y, a, l = 9, w = 3.2) => { const [tx, ty] = pol(x, y, l, a), [lx, ly] = pol(x, y, l / 2, a); const [n1x, n1y] = pol(lx, ly, w, a - 90), [n2x, n2y] = pol(lx, ly, w, a + 90);
  return `M${P(x, y)}Q${P(n1x, n1y)} ${P(tx, ty)}Q${P(n2x, n2y)} ${P(x, y)}Z`; };
MY("laurel", "월계관", S(arc(50, 50, 40, 100, 250) + arc(50, 50, 40, -70, 80)) + F(range(9, i => { const a = 108 + i * 16; const [x, y] = pol(50, 50, 40, a); return leaf(x, y, a + 60) + leaf(x, y, a + 120); }).join("") + range(9, i => { const a = 72 - i * 16; const [x, y] = pol(50, 50, 40, a); return leaf(x, y, a - 60) + leaf(x, y, a - 120); }).join("")));
MY("meander", "메안드로스 띠", S(range(10, i => { const x = i * 20; return M([[x, 18], [x, 2], [x + 16, 2], [x + 16, 14], [x + 6, 14], [x + 6, 8], [x + 11, 8]]); }).join("") + L(0, 18, 200, 18) + L(0, 0.5, 200, 0.5)), [200, 20], [320, 32]);
MY("triangles3", "세 겹 삼각", S(range(3, i => { const [cx, cy] = pol(50, 54, 12, -90 + i * 120); return M(range(3, k => pol(cx, cy, 30, -90 + k * 120 + 60 * (i % 2))), true); }).join("")));
MY("sunDisk", "태양 원반", S(circ(50, 50, 20) + range(12, i => { const a = i * 30, [x1, y1] = pol(50, 50, 26, a), [x2, y2] = pol(50, 50, 46, a), [cx, cy] = pol(50, 50, 36, a + 8); return `M${P(x1, y1)}Q${P(cx, cy)} ${P(x2, y2)}`; }).join("")) + F(circ(50, 50, 8)));
MY("eye", "눈 문양", S("M4 50Q50 8 96 50Q50 92 4 50Z" + circ(50, 50, 16) + "M30 76Q24 90 34 94M64 76Q78 82 82 92") + F(circ(50, 50, 7)), MV, [160, 120]);
MY("crescentStar", "달과 별", F("M58 10A40 40 0 1 0 58 90A46 46 0 0 1 58 10Z" + "M74 34L77 44L87 44L79 50L82 60L74 54L66 60L69 50L61 44L71 44Z"));
MY("runeRing", "룬 고리", S(circ(50, 50, 46) + circ(50, 50, 34) + range(12, i => { const a = i * 30 + 15, [x, y] = pol(50, 50, 40, a); const k = i % 4; return k === 0 ? L(x, y - 4, x, y + 4) + L(x, y - 4, x + 3, y - 1) : k === 1 ? L(x - 3, y - 4, x + 3, y + 4) + L(x + 3, y - 4, x - 3, y + 4) : k === 2 ? M([[x - 3, y + 4], [x, y - 4], [x + 3, y + 4]]) : L(x, y - 4, x, y + 4) + L(x - 3, y, x + 3, y - 3); }).join("")));
MY("fleuron", "꽃 장식", S("M50 90C50 60 30 60 22 44C16 32 26 20 36 26C44 31 40 42 32 40M50 90C50 60 70 60 78 44C84 32 74 20 64 26C56 31 60 42 68 40M50 90V30") + F("M50 8C58 18 58 28 50 34C42 28 42 18 50 8Z"));
MY("vineBand", "덩굴 띠", S(sine(0, 200, 10, 6, 4)) + F(range(8, i => { const x = 12.5 + i * 25, y = 10 + 6 * Math.sin(x / 200 * 8 * Math.PI); return leaf(x, y, i % 2 ? 60 : -60, 8, 2.6); }).join("")), [200, 20], [320, 40]);
MY("compassStar", "팔방 별", S(range(8, i => { const a = i * 45 - 90, l = i % 2 ? 30 : 48; return M([pol(50, 50, 8, a - 45), pol(50, 50, l, a), pol(50, 50, 8, a + 45)]); }).join("") + circ(50, 50, 8)));
MY("flowerOfLife", "생명의 꽃", S(circ(50, 50, 16) + range(6, i => circ(...pol(50, 50, 16, i * 60), 16)).join("") + circ(50, 50, 32)));
MY("wings", "날개", S(range(5, i => `M50 ${48 + i * 4}C${40 - i * 6} ${40 - i * 2} ${20 - i * 3} ${30 + i * 5} ${4 + i * 2} ${22 + i * 8}` + `M50 ${48 + i * 4}C${60 + i * 6} ${40 - i * 2} ${80 + i * 3} ${30 + i * 5} ${96 - i * 2} ${22 + i * 8}`).join("")) + F(circ(50, 52, 5)), MV, [180, 100]);

/* ---------- 우주·신성·시스템: 하늘빛 글로우 장식 ----------
   G는 같은 선을 굵고 옅게 두 번 더 깔아 네온처럼 번져 보이게 한다 (필터 없이 선만으로 그려 어디서나 같게 보인다). */
const SKY = "#8fd3ff";
const G = (d, cls = "") => ["o-g", "o-g2", ""].map(k => S(d, [k, cls].filter(Boolean).join(" "))).join("");
const GF = d => S(d, "o-g") + S(d, "o-g2") + F(d);
const rnd = seed => { let a = seed; return () => (a = a * 16807 % 2147483647) / 2147483647; };
const ellPt = (cx, cy, rx, ry, rot, t) => { const x = rx*Math.cos(t), y = ry*Math.sin(t), r = rad(rot); return [cx + x*Math.cos(r) - y*Math.sin(r), cy + x*Math.sin(r) + y*Math.cos(r)]; };
const ell = (cx, cy, rx, ry, rot = 0, n = 72) => M(range(n, i => ellPt(cx, cy, rx, ry, rot, i / n * Math.PI * 2)), true);
// 보이는 점만 이어 그린다 (행성 뒤로 숨는 고리 등)
const runs = (pts, vis) => { let d = "", on = false; pts.forEach((p, i) => { if(vis(p, i)){ d += (on ? "L" : "M") + P(...p); on = true; } else on = false; }); return d; };
// 반짝이는 네 갈래 별 (가운데가 오목하게 휜다)
const star4 = (cx, cy, R, r, rot = 0) => `M${P(...pol(cx, cy, R, rot - 90))}` + range(4, k => { const a = rot - 90 + k*90; return `Q${P(...pol(cx, cy, r, a + 45))} ${P(...pol(cx, cy, R, a + 90))}`; }).join("") + "Z";
const starN = (cx, cy, R, r, n, rot = -90) => M(range(n*2, k => pol(cx, cy, k % 2 ? r : R, rot + k*180/n)), true);
const spiral = (cx, cy, a0, turns, r0, r1, n = 90) => M(range(n + 1, k => { const t = k / n; return pol(cx, cy, r0 + (r1 - r0)*t, a0 + t*turns*360); }));
const ticks = (cx, cy, r0, r1, n, every = 0, r2 = r1) => range(n, k => { const a = k*360/n; return L(...pol(cx, cy, r0, a), ...pol(cx, cy, every && k % every === 0 ? r2 : r1, a)); }).join("");

/* 우주·천체 */
const KV = [100, 100], KS = [160, 160], CO = (id, name, svg, vb = KV, size = KS) => add("우주·천체", id, name, vb, size, svg, SKY);
CO("orbitRings", "궤도 고리", G(ell(50, 50, 46, 14, -20) + ell(50, 50, 36, 22, 28) + ell(50, 50, 44, 9, 70)) + GF(circ(50, 50, 7)) + F(circ(...ellPt(50, 50, 46, 14, -20, .6), 2.4) + circ(...ellPt(50, 50, 36, 22, 28, 3.6), 2) + circ(...ellPt(50, 50, 44, 9, 70, 2.2), 1.8)));
{
  const outer = range(121, i => ellPt(50, 52, 47, 11, -16, i / 120 * Math.PI * 2)), inner = range(121, i => ellPt(50, 52, 37, 8, -16, i / 120 * Math.PI * 2));
  const hidden = ([x, y], i) => !(i > 60 && Math.hypot(x - 50, y - 52) < 23);   // 고리 뒤쪽 중 행성에 가린 부분
  CO("ringedPlanet", "고리 행성", G(circ(50, 52, 22)) + S(arc(50, 52, 16, 200, 340) + L(31, 46, 69, 44) + L(29, 56, 71, 54), "", op(.55)) + G(runs(outer, hidden)) + S(runs(inner, hidden), "", op(.6)));
}
{
  const st = [[22, 16], [70, 20], [40, 46], [50, 50], [60, 54], [30, 84], [76, 80]];
  CO("constellation", "별자리", S(M([st[0], st[2], st[3], st[4], st[1]]) + M([st[2], st[5]]) + M([st[4], st[6]]), "", op(.7)) + F(st.map(([x, y], i) => i === 0 || i === 6 ? star4(x, y, 7, 1.4) : circ(x, y, i === 3 ? 2.6 : 2)).join("")) + S(st.filter((_, i) => i === 0 || i === 6).map(([x, y]) => circ(x, y, 3.5)).join(""), "o-g"));
}
CO("starBurst4", "회절 별", GF(star4(50, 50, 48, 5)) + F(star4(50, 50, 22, 3, 45)) + G(circ(50, 50, 10)));
CO("crescentOrbit", "초승달 궤도", GF("M56 18A32 32 0 1 0 56 82A40 40 0 0 1 56 18Z") + S(circ(50, 50, 44), "o-t") + F(star4(80, 26, 8, 1.6)) + F(circ(87, 66, 2.2)));
{
  const r = rnd(7), dots = range(36, () => { const a = r()*2, t = r(), [x, y] = pol(50, 50, 6 + t*40, a*180 + t*560 + (r() - .5)*20); return circ(x, y, .6 + r()*1.2); }).join("");
  CO("galaxySpiral", "나선 은하", G(spiral(50, 50, 0, 1.55, 5, 46) + spiral(50, 50, 180, 1.55, 5, 46)) + GF(circ(50, 50, 5)) + F(dots));
}
CO("astrolabe", "아스트롤라베", G(circ(50, 50, 46) + circ(50, 50, 30)) + S(circ(50, 50, 42) + ticks(50, 50, 42, 44.5, 72, 6, 46) + L(50, 4, 50, 96) + L(4, 50, 96, 50), "", op(.7)) + G(circ(50, 44, 22) + ell(50, 56, 26, 12)) + F(range(4, k => M([pol(50, 50, 30, k*90 + 45), pol(50, 50, 36, k*90 + 41), pol(50, 50, 36, k*90 + 49)], true)).join("") + circ(50, 50, 2.5)));
CO("zodiacRing", "황도 고리", G(circ(50, 50, 46) + circ(50, 50, 36)) + S(circ(50, 50, 26) + range(12, k => L(...pol(50, 50, 36, k*30), ...pol(50, 50, 46, k*30))).join("") + starN(50, 50, 26, 10, 12), "", op(.7)) +
  F(range(12, k => { const [x, y] = pol(50, 50, 41, k*30 + 15); return [circ(x, y, 1.6), diamond(x, y, 2.2), star4(x, y, 3, .7), M([[x, y - 2.4], [x + 2.2, y + 1.6], [x - 2.2, y + 1.6]], true)][k % 4]; }).join("")));
{
  const r = rnd(11);
  CO("sunCorona", "태양 코로나", G(circ(50, 50, 16)) + F(circ(50, 50, 9)) + S(range(48, k => { const a = k*7.5, l = 26 + r()*20; return L(...pol(50, 50, 20, a), ...pol(50, 50, l, a)); }).join(""), "", op(.75)) + S(range(48, k => L(...pol(50, 50, 20, k*7.5), ...pol(50, 50, 30, k*7.5))).join(""), "o-g"));
}
CO("moonPhases", "달의 위상", range(7, k => { const cx = 18 + k*27.3, cy = 20, rr = 10, ph = k / 6, rx = f(Math.abs(Math.cos(ph*Math.PI))*rr);
  const lit = k === 0 ? "" : k === 6 ? circ(cx, cy, rr) : k === 3 ? `M${P(cx, cy - rr)}A${rr} ${rr} 0 0 1 ${P(cx, cy + rr)}Z` : `M${P(cx, cy - rr)}A${rr} ${rr} 0 0 1 ${P(cx, cy + rr)}A${rx} ${rr} 0 0 ${ph < .5 ? 0 : 1} ${P(cx, cy - rr)}Z`;
  return G(circ(cx, cy, rr)) + (lit ? F(lit) : ""); }).join(""), [200, 40], [360, 72]);
CO("comet", "혜성", S(range(6, k => `M188 22Q${120 - k*6} ${30 + k*3} ${8 + k*4} ${34 + k*5}`).join(""), "", op(.55)) + G("M188 22Q118 30 12 40") + GF(circ(186, 22, 6)) + F(star4(186, 22, 14, 1.2)), [200, 60], [320, 96]);
CO("starDivider", "별 구분선", G(L(0, 10, 84, 10) + L(116, 10, 200, 10)) + GF(star4(100, 10, 12, 2.4)) + F(star4(72, 10, 5, 1.1) + star4(128, 10, 5, 1.1) + circ(60, 10, 1.2) + circ(140, 10, 1.2)), DV, [360, 36]);
CO("orbitDivider", "궤도 구분선", G(L(0, 15, 74, 15) + L(126, 15, 200, 15) + ell(100, 15, 24, 8, -10)) + GF(circ(100, 15, 4.5)) + F(circ(...ellPt(100, 15, 24, 8, -10, .9), 1.8)), [200, 30], [360, 54]);
{
  const vis = n => ([x, y], i) => !(i > n / 2 && Math.hypot(x - 50, y - 50) < 15);
  const disk = (rx, ry) => { const pts = range(97, i => ellPt(50, 50, rx, ry, -8, i / 96 * Math.PI * 2)); return runs(pts, vis(96)); };
  CO("blackHole", "블랙홀", G(circ(50, 50, 15)) + S(circ(50, 50, 12), "", op(.5)) + G(disk(46, 9)) + S(disk(37, 7) + disk(28, 5.5), "", op(.7)) + S(arc(50, 50, 21, 200, 340), "", op(.8)) + S(arc(50, 50, 21, 200, 340), "o-g"));
}
{
  const r = rnd(5);
  CO("starChart", "성도", G(circ(50, 50, 46)) + S(ell(50, 50, 16, 46) + ell(50, 50, 32, 46) + L(50, 4, 50, 96) + range(3, k => { const y = 50 + (k - 1)*22, w = Math.sqrt(46*46 - (y - 50)**2); return L(50 - w, y, 50 + w, y); }).join(""), "", op(.4)) +
    F(range(16, () => { const a = r()*360, d = Math.sqrt(r())*42, [x, y] = pol(50, 50, d, a); return circ(x, y, .7 + r()*1.3); }).join("") + star4(36, 30, 6, 1.2) + star4(66, 64, 5, 1)));
}

/* 신성 */
const DVV = [100, 100], DSZ = [160, 160], DI = (id, name, svg, vb = DVV, size = DSZ) => add("신성", id, name, vb, size, svg, "#a9ddff");
DI("haloRadiant", "후광", G(circ(50, 50, 24)) + S(circ(50, 50, 28), "o-d") + S(range(36, k => L(...pol(50, 50, 32, k*10), ...pol(50, 50, k % 2 ? 40 : 47, k*10))).join(""), "", op(.8)) + S(range(36, k => L(...pol(50, 50, 32, k*10), ...pol(50, 50, k % 2 ? 40 : 47, k*10))).join(""), "o-g"));
{
  const feather = (x0, y0, x1, y1, w) => { const mx = (x0 + x1)/2, my = (y0 + y1)/2, l = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0)/l*w, ny = (x1 - x0)/l*w; return `M${P(x0, y0)}Q${P(mx + nx, my + ny)} ${P(x1, y1)}Q${P(mx - nx, my - ny)} ${P(x0, y0)}Z`; };
  const wing = s => range(7, k => { const t = k / 6, tx = 60 + s*(8 + 46*Math.cos(t*1.1)), ty = 10 + t*52, bx = 60 + s*4, by = 34 + k*2; return feather(bx, by, tx, ty, 3.6 + k*.3); }).join("");
  DI("lightWings", "빛의 날개", G(wing(-1) + wing(1)) + GF(circ(60, 38, 4)), [120, 70], [240, 140]);
}
{
  const r = rnd(3), runes = range(24, k => { const a = k*15 + 7.5, [x, y] = pol(50, 50, 44, a), q = r(); return q < .33 ? L(...pol(x, y, 2, a + 90), ...pol(x, y, 2, a - 90)) : q < .66 ? L(...pol(x, y, 2, a + 45), ...pol(x, y, 2, a - 135)) + L(...pol(x, y, 2, a - 45), ...pol(x, y, 2, a + 135)) : M([pol(x, y, 2, a + 120), pol(x, y, 2, a), pol(x, y, 2, a - 120)]); }).join("");
  DI("hexSigil", "육망성 마법진", G(circ(50, 50, 48) + circ(50, 50, 40) + M(range(3, k => pol(50, 50, 32, -90 + k*120)), true) + M(range(3, k => pol(50, 50, 32, 90 + k*120)), true)) + S(circ(50, 50, 32) + circ(50, 50, 14) + runes, "", op(.75)) + S(range(6, k => circ(...pol(50, 50, 32, -90 + k*60), 3)).join(""), "") + F(circ(50, 50, 3)));
}
DI("heptagram", "칠망성 인장", G(M(range(7, k => pol(50, 50, 40, -90 + (k*3 % 7)*360/7)), true) + circ(50, 50, 46)) + S(circ(50, 50, 18), "", op(.7)) + F(range(7, k => circ(...pol(50, 50, 46, -90 + k*360/7), 2.4)).join("")));
{
  const R = 9, c = [[50, 50]]; for(const d of [2*R, 4*R]) for(let k = 0; k < 6; k++) c.push(pol(50, 50, d, -90 + k*60));
  let lines = ""; for(let i = 0; i < c.length; i++) for(let j = i + 1; j < c.length; j++) lines += L(...c[i], ...c[j]);
  DI("metatron", "메타트론 큐브", S(lines, "", op(.45)) + G(c.map(([x, y]) => circ(x, y, R)).join("")));
}
DI("seedOfLife", "생명의 씨앗", G(circ(50, 50, 16) + range(6, k => circ(...pol(50, 50, 16, k*60), 16)).join("") + circ(50, 50, 32)) + S(circ(50, 50, 38) + circ(50, 50, 42), "", op(.6)));
DI("providence", "섭리의 눈", G(M([[50, 18], [92, 88], [8, 88]], true) + "M26 64Q50 44 74 64Q50 84 26 64Z") + G(circ(50, 64, 8)) + F(circ(50, 64, 3.5)) + S(range(9, k => { const a = -160 + k*17.5; return L(...pol(50, 52, 40, a), ...pol(50, 52, k % 2 ? 46 : 49, a)); }).join(""), "", op(.75)));
DI("crossFlare", "빛 십자", GF(star4(50, 50, 48, 2.2)) + F(star4(50, 50, 24, 1.4, 45)) + G(circ(50, 50, 12)) + S(range(16, k => L(...pol(50, 50, 16, k*22.5 + 11.25), ...pol(50, 50, 22, k*22.5 + 11.25))).join(""), "", op(.6)));
DI("sacredArch", "신전 아치", G("M8 140V62Q8 14 50 4Q92 14 92 62V140") + S("M16 140V64Q16 24 50 14Q84 24 84 64V140" + L(8, 136, 92, 136), "", op(.7)) + GF(star4(50, 28, 8, 1.6)) + F(circ(16, 64, 1.8) + circ(84, 64, 1.8)), [100, 140], [200, 280]);
DI("divineDivider", "신성 구분선", G(L(0, 12, 76, 12) + L(124, 12, 200, 12) + "M88 12Q80 4 66 6M88 12Q80 20 66 18M112 12Q120 4 134 6M112 12Q120 20 134 18") + GF(diamond(100, 12, 7, 9)) + S(star4(100, 12, 14, 2), "", op(.6)), [200, 24], [360, 42]);
DI("haloCrown", "빛의 관", G(ell(50, 30, 40, 8)) + S(ell(50, 30, 33, 5.5), "", op(.6)) + S(range(9, k => { const t = Math.PI + (k + 1) / 10 * Math.PI, [x, y] = ellPt(50, 30, 40, 8, 0, t); return L(x, y - 2, x, y - (k % 2 ? 8 : 14)); }).join(""), "", op(.8)) + GF(star4(50, 6, 6, 1.2)), [100, 40], [200, 80]);
DI("lotusLight", "빛 연꽃", G("M50 78C40 62 40 44 50 30C60 44 60 62 50 78Z" + "M50 78C34 70 26 56 28 42C40 48 48 62 50 78Z" + "M50 78C66 70 74 56 72 42C60 48 52 62 50 78Z" + "M50 78C30 78 16 68 12 56C26 54 40 64 50 78Z" + "M50 78C70 78 84 68 88 56C74 54 60 64 50 78Z") + S(range(7, k => { const a = -150 + k*20; return L(...pol(50, 50, 30, a), ...pol(50, 50, 44, a)); }).join("") + L(20, 84, 80, 84), "", op(.7)));
DI("celestialFrame", "천상 프레임", G("M8 6H192V134H8Z") + S("M16 14H184V126H16Z", "", op(.6)) + F([[8, 6], [192, 6], [192, 134], [8, 134]].map(([x, y]) => star4(x, y, 7, 1.4)).join("") + diamond(100, 134, 4, 5) + circ(8, 70, 2) + circ(192, 70, 2)) + G("M92 6A8 8 0 0 0 108 6"), [200, 140], [320, 224]);
DI("seraphRings", "세라핌 고리", G(ell(50, 50, 46, 15, 0) + ell(50, 50, 46, 15, 60) + ell(50, 50, 46, 15, 120)) + G("M36 50Q50 40 64 50Q50 60 36 50Z") + F(circ(50, 50, 3.2)) + F(range(6, k => circ(...pol(50, 50, 46*.97, k*60 + 30), 1.6)).join("")));

/* 시스템·버추얼 */
const SV = [100, 100], SZ = [160, 160], SY = (id, name, svg, vb = SV, size = SZ) => add("시스템·버추얼", id, name, vb, size, svg, "#62d0ff");
SY("hudScope", "HUD 원형 스코프", G(range(4, k => arc(50, 50, 46, k*90 + 10, k*90 + 80)).join("") + circ(50, 50, 24)) + S(circ(50, 50, 38), "o-d") + S(ticks(50, 50, 40, 42.5, 36, 9, 44) + L(50, 14, 50, 40) + L(50, 60, 50, 86) + L(14, 50, 40, 50) + L(60, 50, 86, 50), "", op(.7)) + F(range(4, k => M([pol(50, 50, 49, k*90), pol(50, 50, 54, k*90 - 4), pol(50, 50, 54, k*90 + 4)], true)).join("") + circ(50, 50, 1.8)));
SY("techFrame", "테크 프레임", G("M12 2H84L90 8H110L116 2H188L198 12V108L188 118H12L2 108V12Z") + S("M10 10H40M160 10H190M10 110H40M160 110H190M2 40V80M198 40V80", "", op(.6)) + F("M6 6h4v4h-4zM190 6h4v4h-4zM6 110h4v4h-4zM190 110h4v4h-4z"), [200, 120], [320, 192]);
{
  const r = rnd(9); let d = "", pads = "";
  for(let k = 0; k < 10; k++){ let x = 10 + Math.floor(r()*19)*10, y = 10 + Math.floor(r()*9)*10, dir = Math.floor(r()*4); const pts = [[x, y]];
    for(let j = 0, n = 3 + Math.floor(r()*4); j < n; j++){ if(r() < .45) dir = (dir + (r() < .5 ? 1 : 3)) % 4; const l = 10*(1 + Math.floor(r()*3)); x = Math.max(4, Math.min(196, x + [1, 0, -1, 0][dir]*l)); y = Math.max(4, Math.min(96, y + [0, 1, 0, -1][dir]*l)); pts.push([x, y]); }
    d += M(pts); pads += circ(...pts[0], 2.4) + circ(...pts[pts.length - 1], 2.4); }
  SY("circuit", "회로 배선", G(d) + G(pads), [200, 100], [320, 160]);
}
{
  const r = rnd(13);
  SY("dataEqualizer", "데이터 이퀄라이저", F(range(24, k => { const h = 8 + r()*44, x = 4 + k*8.2; return `M${P(x, 56 - h)}h5v${f(h)}h-5z`; }).join(""), op(.85)) + G(L(0, 58, 200, 58)) + S(L(0, 10, 200, 10), "o-d", op(.4)), [200, 60], [320, 96]);
}
SY("wireGlobe", "와이어 지구본", G(circ(50, 50, 44)) + S(ell(50, 50, 22, 44) + ell(50, 50, 38, 44) + L(50, 6, 50, 94) + ell(50, 50, 44, 8) + ell(50, 28, 38, 6) + ell(50, 72, 38, 6), "", op(.65)) + G(ell(50, 50, 54, 14, -22)) + F(circ(...ellPt(50, 50, 54, 14, -22, .5), 2.4)), SV, [170, 170]);
SY("hexCore", "육각 코어", G(M(range(6, k => pol(50, 50, 46, k*60 - 90)), true) + M(range(6, k => pol(50, 50, 32, k*60)), true)) + S(M(range(6, k => pol(50, 50, 20, k*60 - 90)), true) + range(6, k => L(...pol(50, 50, 20, k*60 - 90), ...pol(50, 50, 46, k*60 - 90))).join(""), "", op(.7)) + GF(M(range(6, k => pol(50, 50, 7, k*60 - 90)), true)) + F(range(6, k => circ(...pol(50, 50, 46, k*60 - 90), 2)).join("")));
{
  const cube = r => { const v = range(6, k => pol(50, 50, r, -90 + k*60)); return {v, front:M(v, true) + [1, 3, 5].map(k => L(50, 50, ...v[k])).join(""), back:[0, 2, 4].map(k => L(50, 50, ...v[k])).join("")}; };
  const A = cube(46), B = cube(22);
  SY("tesseract", "테서랙트", G(A.front) + S(A.back, "o-d", op(.6)) + G(B.front) + S(B.back, "o-d", op(.6)) + S(range(6, k => L(...A.v[k], ...B.v[k])).join(""), "", op(.55)) + F(A.v.map(p => circ(...p, 1.6)).join("")));
}
SY("targetBrackets", "타깃 괄호", G("M4 22V4H22M78 4H96V22M96 78V96H78M22 96H4V78") + G(circ(50, 50, 12)) + S(L(50, 30, 50, 42) + L(50, 58, 50, 70) + L(30, 50, 42, 50) + L(58, 50, 70, 50), "", op(.8)) + F(M([[50, 10], [46, 4], [54, 4]], true) + M([[50, 90], [46, 96], [54, 96]], true) + M([[10, 50], [4, 46], [4, 54]], true) + M([[90, 50], [96, 46], [96, 54]], true) + circ(50, 50, 1.8)));
SY("signalDivider", "신호 파형 구분선", G("M0 15H66L72 11L78 15H84L90 2L96 28L102 8L106 15H200") + S(sine(0, 200, 15, 4, 5), "", op(.25)) + F(circ(0.5, 15, 2) + circ(199.5, 15, 2)), [200, 30], [360, 54]);
{
  const N = [[50, 50], [18, 22], [80, 18], [86, 62], [60, 86], [20, 76], [34, 48], [70, 40]], E = [[0, 6], [0, 7], [0, 4], [6, 1], [6, 5], [7, 2], [7, 3], [3, 4], [5, 4], [1, 2]];
  SY("nodeGraph", "노드 그래프", S(E.map(([a, b]) => L(...N[a], ...N[b])).join(""), "", op(.6)) + G(N.slice(1).map(([x, y]) => circ(x, y, 4)).join("") + circ(50, 50, 7) + circ(50, 50, 11)) + F(N.map(([x, y], i) => circ(x, y, i ? 1.6 : 3)).join("")));
}
SY("progressArcs", "진행 호", G(arc(50, 50, 44, -90, 180) + arc(50, 50, 28, -90, 70)) + S(circ(50, 50, 36), "o-d", op(.6)) + S(ticks(50, 50, 47, 49.5, 40, 4, 51), "", op(.7)) + F(circ(...pol(50, 50, 44, 180), 2.6) + circ(...pol(50, 50, 28, 70), 2.2)));
SY("techDivider", "테크 구분선", G(L(0, 10, 60, 10) + L(140, 10, 200, 10) + "M86 4L92 10L86 16M94 4L100 10L94 16M102 4L108 10L102 16") + F("M66 8h10v4h-10zM124 8h10v4h-10z") + S(L(60, 10, 64, 10) + L(136, 10, 140, 10) + L(112, 10, 120, 10), "", op(.6)), DV, [360, 36]);
SY("radarScope", "레이더", G(circ(50, 50, 46)) + S(circ(50, 50, 31) + circ(50, 50, 16) + L(4, 50, 96, 50) + L(50, 4, 50, 96), "", op(.5)) + range(6, k => S(L(50, 50, ...pol(50, 50, 46, -60 + k*7)), "", op(f(.15 + k*.17)))).join("") + G(L(50, 50, ...pol(50, 50, 46, -18))) + F(circ(70, 30, 2.4) + circ(28, 66, 1.8) + circ(64, 72, 1.6)) + S(circ(70, 30, 5), "", op(.6)));
SY("gridHorizon", "가상 지평선", G(L(0, 40, 200, 40) + `M${P(82, 40)}A18 18 0 0 1 ${P(118, 40)}`) + S(range(11, k => { const x = k*20; return L(100 + (x - 100)*.12, 40, x, 100); }).join("") + range(6, k => { const y = 40 + 60*((k + 1) / 6) ** 2; return L(0, y, 200, y); }).join(""), "", op(.6)) + S(L(84, 34, 116, 34) + L(87, 28, 113, 28), "", op(.6)), [200, 100], [320, 160]);

export const ORNAMENTS = O;
export const ORNAMENT = Object.fromEntries(O.map(o => [o.id, o]));
export const ornamentOf = id => ORNAMENT[id] || ORNAMENT.lineDiamond;

const hexA = (hex, a) => { const h = hex.replace("#", ""); const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) || 0); return `rgba(${r},${g},${b},${+(+a).toFixed(3)})`; };
export const ornColor = p => p.fillAlpha >= 1 ? p.fill : hexA(p.fill, Math.max(0, p.fillAlpha));
// 편집기용 SVG (스타일을 속성에 담는다). 내보내기는 클래스 규칙으로 같은 값을 준다.
export function ornamentMarkup(p, cls = "orn"){
  const o = ornamentOf(p.deco), sh = p.shadowOn ? `;filter:drop-shadow(${p.shadowX}px ${p.shadowY}px ${p.shadowBlur / 2}px ${hexA(p.shadowColor, p.shadowAlpha)})` : "";
  return `<svg class="${cls}" viewBox="0 0 ${o.vb[0]} ${o.vb[1]}" preserveAspectRatio="none" aria-hidden="true" style="color:${ornColor(p)};--sw:${p.lineWidth}px${o.clip ? ";overflow:hidden" : ""}${sh}">${o.svg}</svg>`;
}
