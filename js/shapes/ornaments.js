/* 장식 라이브러리: 구분선·모서리·프레임·HUD·패턴·신화 문양.
   선 위주의 SVG로, 색은 currentColor(요소의 채우기 색), 선 두께는 --sw(요소의 선 두께)를 따른다.
   viewBox를 요소 크기에 맞춰 늘리고(preserveAspectRatio="none"), 선은 non-scaling-stroke로 두께를 유지한다. */

export const ORNAMENT_CATEGORIES = ["구분선", "모서리", "프레임", "HUD", "패턴", "신화·고전"];
// 장식 SVG 공용 스타일 (편집기와 내보내기가 함께 쓴다)
export const ORN_CSS = ".o-s{fill:none;stroke:currentColor;stroke-width:var(--sw,1.5px);vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.o-f{fill:currentColor}.o-d{stroke-dasharray:6 5}.o-t{stroke-dasharray:0 6}";

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
// vb: viewBox 크기 [w, h], size: 넣을 때 기본 크기(px)
const add = (cat, id, name, vb, size, svg) => O.push({cat, id, name, vb, size, svg, clip:cat === "패턴"});

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
H("loadingDots", "로딩 점", range(5, i => F(circ(10 + i * 20, 50, 7), op(f(1 - i * .18)))).join(""), HV, [120, 30]);
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
