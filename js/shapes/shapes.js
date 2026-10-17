/* 도형 라이브러리.
   모든 도형은 점 목록(구멍이 있으면 여러 개)으로 만들고, 0~100 상자에 맞춰 SVG path로 바꾼다.
   요소 크기에 맞춰 늘어나도록 viewBox="0 0 100 100" + preserveAspectRatio="none"으로 그린다.
   곡선은 점을 촘촘히 찍어 만든다 (편집기와 내보내기에서 모양이 같다). */

export const SHAPE_CATEGORIES = ["기본", "둥근 도형", "별·폭발", "화살표", "기호", "프레임", "UI·배지", "자연"];

const TAU = Math.PI * 2;
const pol = (a, r, cx = 50, cy = 50) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
// 정다각형·별: 위쪽 꼭짓점부터
const ngon = (n, rot = -Math.PI / 2) => Array.from({length:n}, (_, i) => pol(rot + i / n * TAU, 50));
const star = (n, inner, rot = -Math.PI / 2) => Array.from({length:n * 2}, (_, i) => pol(rot + i / (n * 2) * TAU, i % 2 ? 50 * inner : 50));
// 반지름이 각도에 따라 바뀌는 닫힌 곡선
const polar = (fn, steps = 180, cx = 50, cy = 50) => Array.from({length:steps}, (_, i) => { const a = i / steps * TAU; return pol(a, fn(a), cx, cy); });
const circle = (cx, cy, r, steps = 72, a0 = 0, a1 = TAU) => Array.from({length:steps}, (_, i) => pol(a0 + (a1 - a0) * i / steps, r, cx, cy));
const arcTo = (cx, cy, r, a0, a1, steps = 36) => Array.from({length:steps + 1}, (_, i) => pol(a0 + (a1 - a0) * i / steps, r, cx, cy));
// 꼭짓점마다 반지름 r로 둥글린다 (r은 숫자 또는 꼭짓점별 배열)
function rounded(pts, r, steps = 8){
  const out = [];
  pts.forEach((P, i) => {
    const A = pts[(i - 1 + pts.length) % pts.length], B = pts[(i + 1) % pts.length], rr0 = Array.isArray(r) ? r[i] : r;
    const la = Math.hypot(A[0] - P[0], A[1] - P[1]), lb = Math.hypot(B[0] - P[0], B[1] - P[1]);
    const rr = Math.min(rr0, la / 2, lb / 2);
    if(rr <= 0){ out.push(P); return; }
    const p1 = [P[0] + (A[0] - P[0]) / la * rr, P[1] + (A[1] - P[1]) / la * rr], p2 = [P[0] + (B[0] - P[0]) / lb * rr, P[1] + (B[1] - P[1]) / lb * rr];
    for(let k = 0; k <= steps; k++){ const t = k / steps, u = 1 - t; out.push([u*u*p1[0] + 2*u*t*P[0] + t*t*p2[0], u*u*p1[1] + 2*u*t*P[1] + t*t*p2[1]]); }
  });
  return out;
}
// 점 사이를 부드럽게 잇는 닫힌 곡선 (Catmull-Rom)
function smooth(pts, seg = 10){
  const out = [], n = pts.length;
  for(let i = 0; i < n; i++){
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for(let k = 0; k < seg; k++){
      const t = k / seg, t2 = t*t, t3 = t2*t;
      out.push([0, 1].map(j => .5 * (2*p1[j] + (-p0[j] + p2[j])*t + (2*p0[j] - 5*p1[j] + 4*p2[j] - p3[j])*t2 + (-p0[j] + 3*p1[j] - 3*p2[j] + p3[j])*t3)));
    }
  }
  return out;
}
// 2차 베지어 곡선 위의 점
const quad = (a, c, b, steps = 20) => Array.from({length:steps + 1}, (_, i) => { const t = i / steps, u = 1 - t; return [u*u*a[0] + 2*u*t*c[0] + t*t*b[0], u*u*a[1] + 2*u*t*c[1] + t*t*b[1]]; });
// 고정 시드 난수 (도형 모양이 매번 같도록)
const rnd = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const rot = (pts, deg, cx = 50, cy = 50) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [cx + (x - cx)*c - (y - cy)*s, cy + (x - cx)*s + (y - cy)*c]); };
const flipX = pts => pts.map(([x, y]) => [100 - x, y]).reverse();
// 두 원의 차로 만든 초승달: 원(50,50,50)에서 원(50+d, 50, r)을 뺀다
function crescent(d, r){
  const R = 50, x = (d*d + R*R - r*r) / (2*d), y = Math.sqrt(Math.max(0, R*R - x*x)), a = Math.atan2(y, x), b1 = Math.atan2(y, x - d), b2 = Math.atan2(-y, x - d);
  return [...arcTo(50, 50, R, a, TAU - a, 60), ...arcTo(50 + d, 50, r, b2 + TAU, b1, 60).slice(1, -1)];
}

const S = [];
const add = (cat, id, name, paths, o = {}) => S.push({cat, id, name, paths:Array.isArray(paths[0][0]) ? paths : [paths], ...o});
const holes = (cat, id, name, outer, inner) => add(cat, id, name, [outer, inner], {evenodd:true});

/* 기본 */
add("기본", "triangle", "삼각형", [[50, 0], [100, 100], [0, 100]]);
add("기본", "rightTriangle", "직각삼각형", [[0, 0], [100, 100], [0, 100]]);
add("기본", "triangleDown", "역삼각형", [[0, 0], [100, 0], [50, 100]]);
add("기본", "diamond", "마름모", [[50, 0], [100, 50], [50, 100], [0, 50]]);
add("기본", "pentagon", "오각형", ngon(5));
add("기본", "hexagon", "육각형", ngon(6, 0));
add("기본", "hexagonTall", "세로 육각형", ngon(6));
add("기본", "heptagon", "칠각형", ngon(7));
add("기본", "octagon", "팔각형", ngon(8, Math.PI / 8));
add("기본", "decagon", "십각형", ngon(10));
add("기본", "dodecagon", "십이각형", ngon(12, Math.PI / 12));
add("기본", "parallelogram", "평행사변형", [[25, 0], [100, 0], [75, 100], [0, 100]]);
add("기본", "parallelogramLeft", "왼쪽 평행사변형", [[0, 0], [75, 0], [100, 100], [25, 100]]);
add("기본", "trapezoid", "사다리꼴", [[22, 0], [78, 0], [100, 100], [0, 100]]);
add("기본", "trapezoidDown", "역사다리꼴", [[0, 0], [100, 0], [78, 100], [22, 100]]);
add("기본", "kite", "연", [[50, 0], [100, 35], [50, 100], [0, 35]]);
add("기본", "semicircle", "반원", [...arcTo(50, 100, 50, Math.PI, TAU, 48)]);
add("기본", "quarterCircle", "사분원", [[0, 100], ...arcTo(0, 100, 100, -Math.PI / 2, 0, 36)]);
add("기본", "pie", "부채꼴 3/4", [[50, 50], ...arcTo(50, 50, 50, 0, Math.PI * 1.5, 54)]);
add("기본", "lens", "렌즈", [...arcTo(50, -60, 130, Math.PI / 2 + .562, Math.PI / 2 - .562, 30), ...arcTo(50, 160, 130, -Math.PI / 2 + .562, -Math.PI / 2 - .562, 30).slice(1, -1)]);

/* 둥근 도형 */
add("둥근 도형", "roundTriangle", "둥근 삼각형", rounded([[50, 0], [100, 100], [0, 100]], 14));
add("둥근 도형", "roundDiamond", "둥근 마름모", rounded([[50, 0], [100, 50], [50, 100], [0, 50]], 12));
add("둥근 도형", "roundPentagon", "둥근 오각형", rounded(ngon(5), 10));
add("둥근 도형", "roundHexagon", "둥근 육각형", rounded(ngon(6, 0), 10));
add("둥근 도형", "roundOctagon", "둥근 팔각형", rounded(ngon(8, Math.PI / 8), 8));
add("둥근 도형", "squircle", "스쿼클", polar(a => 50 / Math.pow(Math.pow(Math.abs(Math.cos(a)), 4) + Math.pow(Math.abs(Math.sin(a)), 4), 1/4), 160));
add("둥근 도형", "egg", "달걀", polar(a => 50 * (1 - .14 * Math.sin(a)), 120));
add("둥근 도형", "teardrop", "물방울 모서리", [[0, 0], [50, 0], ...arcTo(50, 50, 50, -Math.PI / 2, Math.PI, 54).slice(1)]);
add("둥근 도형", "roundStar", "둥근 별", rounded(star(5, .5), 7));
add("둥근 도형", "blob1", "블롭 1", smooth([[50, 2], [86, 14], [98, 52], [78, 90], [38, 98], [6, 74], [8, 30]]));
add("둥근 도형", "blob2", "블롭 2", smooth([[40, 4], [74, 0], [98, 30], [90, 66], [62, 98], [22, 90], [2, 58], [14, 22]]));
add("둥근 도형", "blob3", "블롭 3", smooth([[56, 0], [96, 22], [84, 52], [100, 84], [60, 100], [30, 82], [0, 70], [12, 30]]));

/* 별·폭발 */
add("별·폭발", "star3", "세모 별", star(3, .35));
add("별·폭발", "star4", "네모 별", star(4, .38));
add("별·폭발", "star5", "별", star(5, .45));
add("별·폭발", "star5Thin", "가는 별", star(5, .25));
add("별·폭발", "star6", "육각 별", star(6, .55));
add("별·폭발", "star7", "칠각 별", star(7, .5));
add("별·폭발", "star8", "팔각 별", star(8, .6));
add("별·폭발", "star10", "십각 별", star(10, .65));
add("별·폭발", "star12", "십이각 별", star(12, .72));
add("별·폭발", "star16", "십육각 별", star(16, .78));
add("별·폭발", "sparkle", "반짝임", [[50, 0], [100, 50], [50, 100], [0, 50]].flatMap((p, i, a) => { const q = a[(i + 1) % 4], m = [50 + ((p[0] + q[0]) / 2 - 50) * .18, 50 + ((p[1] + q[1]) / 2 - 50) * .18]; return quad(p, m, q, 16).slice(0, -1); }));
add("별·폭발", "starburst", "스타버스트", star(24, .8));
add("별·폭발", "seal", "실링 배지", polar(a => 50 * (.93 + .07 * Math.cos(20 * a)), 200));
add("별·폭발", "comicBurst", "만화 폭발", (() => { const r = rnd(7); return Array.from({length:26}, (_, i) => pol(-Math.PI / 2 + i / 26 * TAU, i % 2 ? 28 + r()*8 : 42 + r()*8)); })());

/* 화살표 */
const arrowR = [[0, 30], [60, 30], [60, 0], [100, 50], [60, 100], [60, 70], [0, 70]];
add("화살표", "arrowRight", "오른쪽 화살표", arrowR);
add("화살표", "arrowLeft", "왼쪽 화살표", flipX(arrowR));
add("화살표", "arrowUp", "위쪽 화살표", rot(arrowR, -90));
add("화살표", "arrowDown", "아래쪽 화살표", rot(arrowR, 90));
add("화살표", "arrowBoth", "양쪽 화살표", [[0, 50], [28, 0], [28, 30], [72, 30], [72, 0], [100, 50], [72, 100], [72, 70], [28, 70], [28, 100]]);
add("화살표", "arrowBothV", "위아래 화살표", rot([[0, 50], [28, 0], [28, 30], [72, 30], [72, 0], [100, 50], [72, 100], [72, 70], [28, 70], [28, 100]], 90));
const chevR = [[0, 0], [55, 0], [100, 50], [55, 100], [0, 100], [45, 50]];
add("화살표", "chevronRight", "오른쪽 갈매기", chevR);
add("화살표", "chevronLeft", "왼쪽 갈매기", flipX(chevR));
add("화살표", "chevronUp", "위쪽 갈매기", rot(chevR, -90));
add("화살표", "chevronDown", "아래쪽 갈매기", rot(chevR, 90));
add("화살표", "process", "진행 단계", [[0, 0], [75, 0], [100, 50], [75, 100], [0, 100]]);
add("화살표", "notchedArrow", "홈 화살표", [[0, 30], [60, 30], [60, 0], [100, 50], [60, 100], [60, 70], [0, 70], [12, 50]]);
add("화살표", "arrowSlim", "가는 화살표", [[0, 42], [78, 42], [78, 20], [100, 50], [78, 80], [78, 58], [0, 58]]);
add("화살표", "arrowBent", "꺾인 화살표", [[0, 100], [0, 40], [60, 40], [60, 15], [100, 55], [60, 95], [60, 70], [30, 70], [30, 100]]);
add("화살표", "arrowQuad", "네 방향 화살표", [[50, 0], [68, 20], [58, 20], [58, 42], [80, 42], [80, 32], [100, 50], [80, 68], [80, 58], [58, 58], [58, 80], [68, 80], [50, 100], [32, 80], [42, 80], [42, 58], [20, 58], [20, 68], [0, 50], [20, 32], [20, 42], [42, 42], [42, 20], [32, 20]]);
add("화살표", "uTurn", "유턴 화살표", [[0, 100], [0, 40], ...arcTo(40, 40, 40, Math.PI, TAU, 24).slice(1), [80, 55], [100, 55], [65, 95], [30, 55], [50, 55], ...arcTo(40, 40, 10, 0, -Math.PI, 12).slice(1), [30, 100]]);

/* 기호 */
add("기호", "plus", "더하기", [[35, 0], [65, 0], [65, 35], [100, 35], [100, 65], [65, 65], [65, 100], [35, 100], [35, 65], [0, 65], [0, 35], [35, 35]]);
add("기호", "xMark", "엑스", rot([[38, 0], [62, 0], [62, 38], [100, 38], [100, 62], [62, 62], [62, 100], [38, 100], [38, 62], [0, 62], [0, 38], [38, 38]], 45));
add("기호", "check", "체크", [[0, 55], [14, 41], [36, 63], [86, 13], [100, 27], [36, 91]]);
add("기호", "heart", "하트", Array.from({length:160}, (_, i) => { const t = i / 160 * TAU, s = Math.sin(t); return [50 + 16 * s*s*s * 3, 45 - (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) * 3]; }));
add("기호", "bolt", "번개", [[58, 0], [12, 58], [44, 58], [34, 100], [88, 38], [54, 38], [70, 0]]);
add("기호", "drop", "물방울", [[50, 0], ...arcTo(50, 66, 34, -Math.PI / 2 + 1.03, Math.PI * 1.5 - 1.03, 60)]);
add("기호", "crescent", "초승달", rot(crescent(30, 42), -20));
add("기호", "sun", "해", [circle(50, 50, 26, 60), ...Array.from({length:8}, (_, i) => { const a = i / 8 * TAU; return [pol(a - .16, 32), pol(a, 50), pol(a + .16, 32)]; })]);
add("기호", "cloud", "구름", (() => {
  // 원 여러 개를 합친 윤곽: 가운데에서 뻗은 선이 가장 멀리 닿는 원까지의 거리, 바닥은 평평하게
  const C = [[28, 64, 22], [50, 46, 28], [74, 58, 22], [52, 66, 22]], O = [50, 64];
  return Array.from({length:240}, (_, i) => { const a = i / 240 * TAU, ux = Math.cos(a), uy = Math.sin(a);
    let t = Math.max(...C.map(([cx, cy, r]) => { const dx = cx - O[0], dy = cy - O[1], b = ux*dx + uy*dy, q = b*b - (dx*dx + dy*dy - r*r); return q < 0 ? 0 : b + Math.sqrt(q); }));
    if(uy > 0) t = Math.min(t, (86 - O[1]) / uy);
    return [O[0] + ux*t, O[1] + uy*t]; });
})());
add("기호", "pin", "위치 핀", [[[50, 100], ...arcTo(50, 36, 36, Math.PI / 2 + .97, Math.PI / 2 - .97 + TAU, 60)], circle(50, 36, 13, 40)], {evenodd:true});
add("기호", "house", "집", [[50, 0], [100, 45], [86, 45], [86, 100], [14, 100], [14, 45], [0, 45]]);
add("기호", "bookmark", "책갈피", [[0, 0], [100, 0], [100, 100], [50, 72], [0, 100]]);
add("기호", "tag", "가격표", [[0, 50], [28, 0], [100, 0], [100, 100], [28, 100]]);
add("기호", "shield", "방패", [[50, 0], [100, 12], [100, 48], ...quad([100, 48], [100, 82], [50, 100]).slice(1, -1), [50, 100], ...quad([50, 100], [0, 82], [0, 48]).slice(1, -1), [0, 48], [0, 12]]);
add("기호", "flag", "깃발", [[0, 0], [100, 0], [80, 30], [100, 60], [12, 60], [12, 100], [0, 100]]);
add("기호", "leaf", "나뭇잎", [...arcTo(100, 100, 100, Math.PI, Math.PI * 1.5, 40), ...arcTo(0, 0, 100, 0, Math.PI / 2, 40)]);

/* 프레임 (가운데가 빈 도형) */
holes("프레임", "ring", "고리", circle(50, 50, 50, 96), circle(50, 50, 34, 96));
holes("프레임", "ringThin", "얇은 고리", circle(50, 50, 50, 96), circle(50, 50, 44, 96));
holes("프레임", "squareFrame", "사각 프레임", [[0, 0], [100, 0], [100, 100], [0, 100]], [[14, 14], [86, 14], [86, 86], [14, 86]]);
holes("프레임", "roundFrame", "둥근 프레임", rounded([[0, 0], [100, 0], [100, 100], [0, 100]], 24), rounded([[12, 12], [88, 12], [88, 88], [12, 88]], 14));
holes("프레임", "hexFrame", "육각 프레임", ngon(6, 0), ngon(6, 0).map(([x, y]) => [50 + (x - 50) * .72, 50 + (y - 50) * .72]));
holes("프레임", "triangleFrame", "삼각 프레임", [[50, 0], [100, 100], [0, 100]], [[50, 30], [79, 88], [21, 88]]);
holes("프레임", "starFrame", "별 테두리", star(5, .45), star(5, .45).map(([x, y]) => [50 + (x - 50) * .62, 52 + (y - 52) * .62]));
add("프레임", "target", "과녁", [circle(50, 50, 50, 96), circle(50, 50, 38, 96), circle(50, 50, 26, 72), circle(50, 50, 14, 48)], {evenodd:true});
holes("프레임", "diamondFrame", "마름모 프레임", [[50, 0], [100, 50], [50, 100], [0, 50]], [[50, 18], [82, 50], [50, 82], [18, 50]]);
holes("프레임", "cutFrame", "모서리 잘린 프레임", [[16, 0], [84, 0], [100, 16], [100, 84], [84, 100], [16, 100], [0, 84], [0, 16]], [[20, 10], [80, 10], [90, 20], [90, 80], [80, 90], [20, 90], [10, 80], [10, 20]]);

/* UI·배지 */
add("UI·배지", "speech", "말풍선", rounded([[0, 0], [100, 0], [100, 78], [38, 78], [16, 100], [20, 78], [0, 78]], [12, 12, 12, 0, 0, 0, 12]));
add("UI·배지", "speechRound", "둥근 말풍선", [...arcTo(50, 42, 50, Math.PI * .62, Math.PI * 2.5, 70), [22, 100]].map(([x, y]) => [x, Math.min(y, 100)]));
add("UI·배지", "thought", "생각 풍선", [polar(a => 34 + 5 * Math.abs(Math.sin(4 * a)), 160, 56, 40), circle(18, 82, 8, 30), circle(6, 96, 4, 20)]);
add("UI·배지", "ticket", "티켓", [[0, 0], [100, 0], [100, 38], ...arcTo(100, 50, 12, -Math.PI / 2, -Math.PI * 1.5, 16).slice(1, -1), [100, 62], [100, 100], [0, 100], [0, 62], ...arcTo(0, 50, 12, Math.PI / 2, -Math.PI / 2, 16).slice(1, -1), [0, 38]]);
add("UI·배지", "chamfer", "모서리 깎기", [[14, 0], [86, 0], [100, 14], [100, 86], [86, 100], [14, 100], [0, 86], [0, 14]]);
add("UI·배지", "chamferCorner", "한쪽 모서리 깎기", [[0, 0], [78, 0], [100, 22], [100, 100], [0, 100]]);
add("UI·배지", "chamferDiag", "대각 모서리 깎기", [[22, 0], [100, 0], [100, 78], [78, 100], [0, 100], [0, 22]]);
add("UI·배지", "folderTab", "폴더 탭", [[0, 12], [6, 0], [38, 0], [46, 12], [100, 12], [100, 100], [0, 100]]);
add("UI·배지", "plaque", "명판", [...arcTo(0, 0, 14, Math.PI / 2, 0, 10), ...arcTo(100, 0, 14, Math.PI, Math.PI / 2, 10), ...arcTo(100, 100, 14, -Math.PI / 2, -Math.PI, 10), ...arcTo(0, 100, 14, 0, -Math.PI / 2, 10)]);
add("UI·배지", "banner", "리본 배너", [[0, 0], [100, 0], [88, 50], [100, 100], [0, 100], [12, 50]]);
add("UI·배지", "ribbonTail", "리본 꼬리", [[0, 0], [100, 0], [100, 100], [75, 84], [50, 100], [25, 84], [0, 100]]);
add("UI·배지", "scallop", "물결 배지", polar(a => 50 * (.9 + .1 * Math.abs(Math.cos(8 * a))), 200));
const gear = (teeth, depth) => polar(a => { const u = (a / TAU * teeth) % 1; return 50 * (u < .15 || u > .85 ? 1 : u < .3 ? 1 - depth * (u - .15) / .15 : u < .7 ? 1 - depth : 1 - depth * (.85 - u) / .15); }, teeth * 24);
add("UI·배지", "gear8", "톱니바퀴", [gear(8, .2), circle(50, 50, 16, 48)], {evenodd:true});
add("UI·배지", "gear12", "잔 톱니바퀴", [gear(12, .14), circle(50, 50, 22, 48)], {evenodd:true});
add("UI·배지", "waveTop", "물결 상단", [...Array.from({length:61}, (_, i) => [i / 60 * 100, 10 + 8 * Math.sin(i / 60 * TAU * 2)]), [100, 100], [0, 100]]);
add("UI·배지", "zigzagBottom", "지그재그 하단", [[0, 0], [100, 0], ...Array.from({length:17}, (_, i) => [100 - i / 16 * 100, i % 2 ? 100 : 86])]);
add("UI·배지", "crown", "왕관", [[0, 22], [26, 52], [50, 0], [74, 52], [100, 22], [90, 100], [10, 100]]);

/* 자연 */
const flower = (k, inner) => polar(a => 50 * (inner + (1 - inner) * Math.abs(Math.cos(k * a / 2))), 240);
add("자연", "flower4", "네잎꽃", flower(4, .3));
add("자연", "flower5", "다섯잎꽃", rot(flower(5, .35), -90));
add("자연", "flower6", "여섯잎꽃", flower(6, .4));
add("자연", "flower8", "여덟잎꽃", flower(8, .5));
add("자연", "clover", "클로버", rot(polar(a => 50 * Math.abs(Math.cos(1.5 * a)) ** .6 * .98 + 1, 240), -90));
add("자연", "mountains", "산", [[0, 100], [32, 22], [50, 52], [70, 0], [100, 100]]);
add("자연", "waveBand", "물결 띠", [...Array.from({length:61}, (_, i) => [i / 60 * 100, 25 + 18 * Math.sin(i / 60 * TAU)]), ...Array.from({length:61}, (_, i) => [100 - i / 60 * 100, 75 + 18 * Math.sin((1 - i / 60) * TAU)])]);
add("자연", "tree", "나무", [[50, 0], [78, 30], [66, 30], [88, 58], [72, 58], [96, 86], [56, 86], [56, 100], [44, 100], [44, 86], [4, 86], [28, 58], [12, 58], [34, 30], [22, 30]]);

/* 0~100 상자에 맞추고 path 문자열로 */
const num = v => +v.toFixed(2);
function toPath(paths){
  const all = paths.flat();
  const x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]));
  const sx = 100 / (x1 - x0 || 1), sy = 100 / (y1 - y0 || 1);
  return paths.map(pts => "M" + pts.map(([x, y]) => `${num((x - x0) * sx)} ${num((y - y0) * sy)}`).join("L") + "Z").join("");
}
export const SHAPES = S.map(s => ({id:s.id, name:s.name, cat:s.cat, d:toPath(s.paths), evenodd:!!s.evenodd}));
export const SHAPE = Object.fromEntries(SHAPES.map(s => [s.id, s]));
export const shapeOf = id => SHAPE[id] || SHAPE.star5;

/* 요소 속성으로 SVG 마크업을 만든다 (편집기·내보내기 공용) */
const hexA = (hex, a) => { const h = hex.replace("#", ""); const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) || 0); return `rgba(${r},${g},${b},${+(+a).toFixed(3)})`; };
export function shapeFill(p){ return p.fillAlpha > 0 ? (p.fillAlpha >= 1 ? p.fill : hexA(p.fill, p.fillAlpha)) : "none"; }
export function shapeStroke(p){
  if(!(p.borderWidth > 0)) return "";
  const w = p.borderWidth, dash = p.borderStyle === "dashed" ? ` stroke-dasharray="${w * 3} ${w * 2}"` : p.borderStyle === "dotted" ? ` stroke-dasharray="0 ${w * 2}" stroke-linecap="round"` : "";
  return ` stroke="${p.borderColor}" stroke-width="${w}" stroke-linejoin="round" vector-effect="non-scaling-stroke"${dash}`;
}
export function shapeShadow(p){
  const f = [];
  if(p.shadowOn) f.push(`drop-shadow(${p.shadowX}px ${p.shadowY}px ${p.shadowBlur / 2}px ${hexA(p.shadowColor, p.shadowAlpha)})`);
  if(p.glowOn) f.push(`drop-shadow(0 0 ${p.glowBlur / 2}px ${hexA(p.glowColor, p.glowAlpha)})`);
  return f.join(" ");
}
export function shapeMarkup(p, cls = "shp"){
  const s = shapeOf(p.shape), f = shapeShadow(p);
  return `<svg class="${cls}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"${f ? ` style="filter:${f}"` : ""}><path d="${s.d}" fill="${shapeFill(p)}"${s.evenodd ? ' fill-rule="evenodd"' : ""}${shapeStroke(p)}/></svg>`;
}
