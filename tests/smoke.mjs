/* 편집기 자동 점검: 브라우저(Playwright)로 index.html을 열어 주요 기능과 성능 한도를 확인한다.
   실행: node tests/smoke.mjs        (Playwright가 없으면 PLAYWRIGHT=/경로/node_modules/playwright 로 지정)
   빌드가 없는 정적 페이지라 저장소 폴더를 직접 띄워서 연다. 실패한 항목이 있으면 종료 코드 1. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || "playwright");

/* ---------- 정적 서버 ---------- */
const MIME = {".html":"text/html", ".js":"text/javascript", ".mjs":"text/javascript", ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png"};
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if(!p.startsWith(ROOT)){ res.writeHead(403).end(); return; }
  fs.readFile(fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, "index.html") : p, (err, buf) => {
    if(err){ res.writeHead(404).end(); return; }
    res.writeHead(200, {"content-type": MIME[path.extname(p)] || "application/octet-stream"}).end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const URL0 = `http://localhost:${server.address().port}/index.html`;

/* ---------- 점검 도구 ---------- */
const results = [];
function check(name, ok, detail = ""){ results.push({name, ok: !!ok, detail}); }
const browser = await chromium.launch();
async function openPage(width, height){
  const ctx = await browser.newContext({viewport:{width, height}, hasTouch: width < 600});
  const pg = await ctx.newPage(), errs = [];
  pg.on("pageerror", e => errs.push(e.message));
  // 외부 글꼴은 점검과 상관없고 네트워크 상태에 따라 느려지므로 막는다
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await pg.goto(URL0);
  await pg.waitForFunction(() => document.querySelector("#tree .node"));
  return {pg, errs, ctx};
}
// 라이브러리 항목 수는 정의 모듈에서 직접 센다 (항목을 늘려도 점검을 고칠 필요가 없다)
const LIBS = await (async () => {
  const n = async (f, k) => (await import(path.join(ROOT, f))) [k].length;
  return {shape:["#shapeLib", await n("js/shapes/shapes.js", "SHAPES")], ornament:["#decoLib", await n("js/shapes/ornaments.js", "ORNAMENTS")],
    component:["#cmpLib", await n("js/components/components.js", "COMPONENTS")], motion:["#animLib", await n("js/fx/presets.js", "PRESETS")], fx:["#fxLib", await n("js/fx/vfx.js", "EFFECTS")]};
})();

/* ---------- 데스크톱 ---------- */
{
  const {pg, errs, ctx} = await openPage(1440, 900);
  check("시작 화면: 캔버스가 비어 있음", await pg.locator("#screen .el").count() === 0);

  // 요소 삽입: 툴바의 모든 유형
  const types = await pg.$$eval("#insert [data-type]", bs => bs.map(b => b.dataset.type));
  for(const t of types){ await pg.click(`#insert [data-type="${t}"]`); await pg.click("#stage", {position:{x:5, y:5}}); }
  const els = await pg.locator("#screen .el").count();
  check("툴바로 모든 유형 삽입", els === types.length, `${els}/${types.length}`);
  check("레이어 목록에 행이 생김", await pg.locator("#tree .node").count() === types.length + 1);

  // 선택: 레이어 행을 누르면 강조와 캔버스 선택 표시가 함께 바뀐다
  await pg.locator("#tree .node").nth(2).click();
  const sel1 = await pg.evaluate(() => [...document.querySelectorAll("#tree .node.on")].map(r => r.dataset.id));
  const ov = await pg.locator("#screen .ov .tag").count();
  check("레이어에서 선택하면 한 행만 강조", sel1.length === 1, sel1.join(","));
  check("선택하면 캔버스에 선택 표시", ov === 1);
  await pg.locator("#tree .node").nth(3).click({modifiers:["Shift"]});
  check("Shift로 여러 개 선택", await pg.locator("#tree .node.on").count() === 2);

  // 실행 취소·다시 실행
  await pg.keyboard.press("Delete");
  const afterDel = await pg.locator("#screen .el").count();
  await pg.keyboard.press("Control+z");
  const afterUndo = await pg.locator("#screen .el").count();
  await pg.keyboard.press("Control+Shift+z");
  check("삭제 · 되돌리기 · 다시 실행", afterUndo === els && afterDel < els && await pg.locator("#screen .el").count() === afterDel, `${els}→${afterDel}→${afterUndo}`);
  await pg.keyboard.press("Control+z");

  // 라이브러리 탭: 처음 열 때 목록이 만들어진다
  for(const [view, [sel, n]] of Object.entries(LIBS)){
    const before = await pg.locator(`${sel} .lib-item`).count();
    await pg.click(`.rail [data-view="${view}"]`);
    await pg.waitForFunction(s => document.querySelectorAll(s + " .lib-item").length > 0, sel);
    const count = await pg.locator(`${sel} .lib-item`).count();
    check(`${view} 탭: ${n}종`, count === n && before === 0, `열기 전 ${before}, 연 뒤 ${count}`);
  }
  // 레이어 탭을 다시 열면 그동안 바뀐 내용이 반영된다
  await pg.click('.rail [data-view="shape"]');
  await pg.locator("#shapeLib .lib-item").first().click();
  await pg.click('.rail [data-view="layers"]');
  check("숨어 있던 레이어 목록이 열 때 갱신됨", await pg.locator("#tree .node").count() === els + 2);

  // 애니메이션 적용 → 재생 → 정지
  await pg.locator("#tree .node").nth(1).click();
  await pg.click('.rail [data-view="motion"]');
  await pg.locator("#animLib .lib-item").first().click();
  await pg.click("#libApply");
  check("애니메이션 적용 → 타임라인 트랙", await pg.locator("#tlRows > *").count() >= 1);
  await pg.keyboard.press("Escape");
  await pg.keyboard.press("Enter"); await pg.waitForTimeout(400);
  const playing = await pg.evaluate(() => [document.getElementById("tlTime").textContent, document.getAnimations().length]);
  await pg.keyboard.press("Shift+Enter");
  const stopped = await pg.evaluate(() => document.getElementById("tlTime").textContent);
  check("재생하면 시간이 흐름", playing[0] !== "00:00.00" && playing[1] > 0, playing.join(" / "));
  check("정지하면 처음으로", stopped === "00:00.00");

  // 내보내기
  const exp = await pg.evaluate(async () => { const H = await import("./js/export/html.js"); const s = H.exportDocument(); return [s.includes("<!doctype html") || s.includes("<!DOCTYPE html"), s.includes("@keyframes"), s.length]; });
  check("내보내기: HTML 문서와 @keyframes", exp[0] && exp[1], `${Math.round(exp[2] / 1024)}KB`);

  // 큰 프로젝트: 구성 요소 100종(650개 요소) + VFX 50개
  const big = await pg.evaluate(async () => {
    const S = await import("./js/core/state.js"), C = await import("./js/components/components.js"), P = await import("./js/editor/components-panel.js"), V = await import("./js/fx/vfx.js");
    let x = 20, y = 20, rowH = 0; const all = [];
    for(const d of C.COMPONENTS){ if(x + d.w > 1420){ x = 20; y += rowH + 30; rowH = 0; } all.push(...P.buildComponent(d, null, x, y)); x += d.w + 30; rowH = Math.max(rowH, d.h); }
    all.filter(n => n.type === "rect").slice(0, 50).forEach((n, i) => n.props.fx.push(V.newFx(V.EFFECTS[i * 7].id)));
    let t = performance.now();
    S.commit(() => { S.state.project.nodes = all; S.state.project.page.height = y + rowH + 40; });
    const commit = performance.now() - t;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const times = [];
    for(let i = 0; i < 10; i++){ t = performance.now(); S.select(all[10 + i * 7].id); times.push(performance.now() - t); }
    times.sort((a, b) => a - b);
    return {nodes: all.length, commit, select: times[5], dom: document.querySelectorAll("*").length};
  });
  check("큰 프로젝트: 전체 다시 그리기 300ms 이내", big.commit < 300, `${big.nodes}개 요소, ${Math.round(big.commit)}ms`);
  check("큰 프로젝트: 선택 30ms 이내", big.select < 30, `${big.select.toFixed(1)}ms`);
  const frames = await pg.evaluate(async () => {
    const E = await import("./js/fx/engine.js"); E.play();
    const ts = await new Promise(res => { const out = []; let l = performance.now(), n = 0; const f = now => { out.push(now - l); l = now; if(++n < 60) requestAnimationFrame(f); else res(out); }; requestAnimationFrame(f); });
    E.stop(); ts.sort((a, b) => a - b); return ts[30];
  });
  check("큰 프로젝트: 재생 중 프레임 중앙값 40ms 이내", frames < 40, `${frames.toFixed(1)}ms`);

  // 정밀 편집: 슬라이더·숫자 동기화, HEX/RGB/HSL 입력, 배율, 글로우, 섞기 모드, 쌓는 순서, 키프레임 직접 만들기
  const pe = await pg.evaluate(async () => {
    const S = await import("./js/core/state.js");
    const a = S.node("rect", null, {name:"PeA"}), b = S.node("rect", null, {name:"PeB"});
    S.commit(() => { S.state.project.nodes.push(a, b); S.state.sel = b.id; S.state.sels = [b.id]; });
    return b.id;
  });
  const setNum = async (sel, v) => { await pg.fill(sel, String(v)); await pg.locator(sel).dispatchEvent("change"); };
  await setNum("#p-scaleX", 1.5);
  await pg.fill("#p-fill", "rgb(255, 0, 0)"); await pg.locator("#p-fill").dispatchEvent("change");
  await pg.check("#p-glowOn"); await pg.locator("#p-glowOn").dispatchEvent("change");
  await pg.selectOption("#p-blend", "screen");
  await pg.click('[data-z="back"]');
  const peR = await pg.evaluate(async id => {
    const S = await import("./js/core/state.js"), n = S.get(id), el = document.querySelector(`#screen [data-id="${id}"]`), cs = getComputedStyle(el);
    const sibs = S.state.project.nodes.filter(x => x.parent === null);
    return {sx:n.props.scaleX, slider:document.getElementById("p-scaleX-r").value, fill:n.props.fill, glow:cs.boxShadow.includes("0px 0px 16px"), blend:cs.mixBlendMode, tf:cs.transform, first:sibs[0].id === id};
  }, pe);
  check("정밀 편집: 배율·RGB 입력·글로우·섞기·순서", peR.sx === 1.5 && +peR.slider === 1.5 && peR.fill === "#ff0000" && peR.glow && peR.blend === "screen" && peR.tf.startsWith("matrix(1.5") && peR.first, JSON.stringify(peR));
  const kf = await pg.evaluate(async id => {
    const S = await import("./js/core/state.js"), P = await import("./js/fx/presets.js"), H = await import("./js/export/html.js");
    S.commit(() => { const a = P.newAnim("custom"); a.keys = [{o:0, x:0, y:0, s:1, r:0, op:1}, {o:50, x:40, y:0, s:1.2, r:10, op:1}, {o:100, x:0, y:0, s:1, r:0, op:1}]; S.get(id).props.anims.push(a); });
    const css = H.exportCSS();
    return {css:/50%\{[^}]*translate\(40px, 0px\) rotate\(10deg\) scale\(1\.2\)/.test(css), marks:document.querySelectorAll(".tl-kf").length};
  }, pe);
  check("키프레임 직접 만들기: 내보내기 · 타임라인 표시", kf.css && kf.marks >= 3, JSON.stringify(kf));

  // 디자인 스타일: 키트를 켜고 꺼도 내용과 원래 속성은 그대로이고, 편집기와 내보내기에 같이 반영된다
  const kit = await pg.evaluate(async () => {
    const S = await import("./js/core/state.js"), H = await import("./js/export/html.js");
    const r = S.node("rect", null, {name:"KitCard", fill:"#334466", radius:6}), t = S.node("text", r.id, {name:"KitLabel", text:"내용 유지"});
    S.commit(() => { S.state.project.nodes.push(r, t); S.state.sel = r.id; S.state.sels = [r.id]; });
    const before = JSON.stringify(r.props);
    return {before, r:r.id};
  });
  for(const k of ["glass", "brutal"]) await pg.click(`.kits [data-kit="${k}"]`);
  const kitOn = await pg.evaluate(async id => { const S = await import("./js/core/state.js"), H = await import("./js/export/html.js");
    const el = document.querySelector(`#screen [data-id="${id}"]`), css = H.exportCSS();
    return {kits:S.get(id).props.styleKits.join(","), bf:getComputedStyle(el).backdropFilter, bw:getComputedStyle(el).borderTopWidth, css:css.includes("backdrop-filter") && css.includes("6px 6px 0 0 #000000")}; }, kit.r);
  await pg.click('.kits [data-kit="glass"]'); await pg.click('.kits [data-kit="brutal"]');
  const kitOff = await pg.evaluate(async id => { const S = await import("./js/core/state.js"); const p = {...S.get(id).props}; return JSON.stringify(p); }, kit.r);
  check("디자인 스타일: 조합 적용 · 내보내기 · 끄면 원래대로", kitOn.kits === "glass,brutal" && kitOn.bf.includes("blur") && kitOn.bw === "3px" && kitOn.css && kitOff === kit.before,
    `${kitOn.kits} / ${kitOn.bf} / ${kitOn.bw}`);

  // 인터랙션 모드: 페이지에서 모드를 켜고 요소에 동작을 넣으면 내보낸 HTML에서 작동한다
  await pg.keyboard.press("Escape");
  await pg.click('.kits [data-mode="cli"]');
  const modes = await pg.evaluate(async () => (await import("./js/core/state.js")).state.project.page.modes.join(","));
  const ia = await pg.evaluate(async () => {
    const S = await import("./js/core/state.js"), H = await import("./js/export/html.js");
    const b = S.node("rect", null, {name:"IaBtn", x:10, y:10, w:120, h:40}), t = S.node("rect", null, {name:"IaPanel", x:200, y:10, w:120, h:80, visible:false});
    b.props.actions = [{on:"click", v:"", do:"toggle", t:t.id, a:""}, {on:"command", v:"open", do:"show", t:t.id, a:""}];
    S.commit(() => { S.state.project.nodes.push(b, t); });
    return H.exportDocument();
  });
  const ex = await ctx.newPage(); await ex.setContent(ia);
  const d0 = await ex.evaluate(() => getComputedStyle(document.querySelector(".iapanel")).display);
  await ex.click(".iabtn"); const d1 = await ex.evaluate(() => getComputedStyle(document.querySelector(".iapanel")).display);
  await ex.click(".iabtn"); await ex.fill(".ui-bar input", "open"); await ex.press(".ui-bar input", "Enter");
  const d2 = await ex.evaluate(() => getComputedStyle(document.querySelector(".iapanel")).display);
  await ex.close();
  check("인터랙션: 모드 켜기 · 누르기 · CLI 명령이 내보낸 HTML에서 작동", modes === "gui,cli" && d0 === "none" && d1 === "block" && d2 === "block", `${modes} / ${d0}→${d1}, 명령 ${d2}`);

  // 통합 검색: 결과를 누르면 해당 라이브러리 탭이 열리고 항목이 강조된다
  await pg.click('.rail [data-view="find"]');
  await pg.fill("#findSearch", "별");
  const found = await pg.locator("#findList .find-row").count();
  await pg.locator("#findList .find-row").first().click();
  await pg.waitForSelector(".lib-item.flash", {timeout:3000}).catch(() => {});
  const jumped = await pg.evaluate(() => [document.querySelector('.rail [aria-selected="true"]').dataset.view, !!document.querySelector(".lib-item.flash")]);
  check("통합 검색: 결과 → 탭 이동과 강조", found > 0 && jumped[0] !== "find" && jumped[1], `${found}건, ${jumped.join(" / ")}`);
  await pg.click('.rail [data-view="premodel"]');
  check("Premodel 탭이 열림", await pg.locator('.view[data-view="premodel"]').isVisible());

  // 패널 접기 · 크기 조절 (타임라인 포함)
  const w = sel => pg.evaluate(s => Math.round(document.querySelector(s).getBoundingClientRect().width), sel);
  await pg.click("#paneLeft"); await pg.click("#paneRight"); await pg.waitForTimeout(350);
  const folded = [await w(".left"), await w(".right")];
  await pg.click("#paneLeft"); await pg.click("#paneRight"); await pg.waitForTimeout(350);
  const opened = [await w(".left"), await w(".right")];
  check("왼쪽·오른쪽 패널 접기와 펴기", folded[0] <= 46 && folded[1] <= 2 && opened[0] > 200 && opened[1] > 200, `접음 ${folded} / 폄 ${opened}`);
  const drag = async (sel, dx, dy) => { const b = await pg.locator(sel).boundingBox(); const x = b.x + b.width/2, y = b.y + b.height/2;
    await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.move(x + dx, y + dy, {steps:5}); await pg.mouse.up(); };
  await drag('.rsz[data-rsz="left"]', 80, 0); await drag('.rsz[data-rsz="right"]', -60, 0);
  const tl0 = await pg.evaluate(() => document.getElementById("tlTrack").offsetHeight);
  await drag('.rsz[data-rsz="time"]', 0, 50);
  const tl1 = await pg.evaluate(() => document.getElementById("tlTrack").offsetHeight);
  const sized = [await w(".left"), await w(".right")];
  check("끌어서 패널 크기 조절", sized[0] >= opened[0] + 70 && sized[1] >= opened[1] + 50 && tl1 >= tl0 + 40, `왼쪽 ${opened[0]}→${sized[0]}, 오른쪽 ${opened[1]}→${sized[1]}, 타임라인 ${tl0}→${tl1}`);
  // WebGL VFX: 견본 3종이 그려지고, 세부 값을 바꾸면 결과가 바뀌며, 내보낸 HTML의 정지 화면(움직임 줄이기)이 편집기와 같다
  const glStats = sel => `[...document.querySelectorAll("${sel}")].map(c => { const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let nz = 0; const px = []; for(let j = 3; j < d.length; j += 4){ if(d[j] > 8) nz++; if(j % 388 === 3) px.push(d[j-3], d[j-2], d[j-1], d[j]); } return {nz, px}; })`;
  const glSetup = await pg.evaluate(async () => {
    const S = await import("./js/core/state.js"), V = await import("./js/fx/vfx.js"), G = await import("./js/gl/host.js");
    const ns = ["glCore", "glFountain", "glPortal"].map((id, i) => { const n = S.node("rect", null, {name:"GL" + i, x:60 + i * 300, y:60, w:240, h:240, fillAlpha:0}); const f = V.newFx(id); f.seed = 5 + i; n.props.fx.push(f); return n; });
    S.commit(() => { S.state.project.nodes = ns; S.state.sel = null; S.state.sels = []; });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return G.glHost().ok;
  });
  const glA = await pg.evaluate(glStats("#screen .vfx canvas"));
  check("WebGL VFX: 견본 3종이 편집기에 그려짐", glSetup && glA.length === 3 && glA.every(s => s.nz > 500), glA.map(s => s.nz).join(", "));
  const glHtml = await pg.evaluate(async () => (await import("./js/export/html.js")).exportDocument());
  const glB = await pg.evaluate(async () => {
    const S = await import("./js/core/state.js");
    S.commit(() => { S.state.project.nodes[0].props.fx[0].p = {...S.state.project.nodes[0].props.fx[0].p, rings:0, rays:0}; });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return null;
  }).then(() => pg.evaluate(glStats("#screen .vfx canvas")));
  const changed = glA[0].px.reduce((s, v, i) => s + Math.abs(v - glB[0].px[i]), 0);
  check("WebGL VFX: 세부 값을 바꾸면 결과가 바뀜", changed > 1000, `차이 ${changed}`);
  {
    const ctx2 = await browser.newContext({viewport:{width:1440, height:900}, reducedMotion:"reduce"}), p2 = await ctx2.newPage(), e2 = [];
    p2.on("pageerror", e => e2.push(e.message));
    await p2.addInitScript(() => { window.__glc = 0; const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(t, o){ if(/webgl/.test(t)) window.__glc++; return g.call(this, t, o); }; });
    // addInitScript는 setContent에 적용되지 않으므로 임시 파일로 연다
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uiforge-")), "gl.html"); fs.writeFileSync(tmp, glHtml);
    await p2.goto("file://" + tmp); await p2.waitForTimeout(200);
    const ex = await p2.evaluate(glStats("canvas")), n = await p2.evaluate(() => window.__glc);
    const same = ex.length === 3 && ex.every((s, i) => s.px.every((v, j) => v === glA[i].px[j]));
    check("WebGL VFX: 내보낸 HTML이 편집기와 같은 화면 · 컨텍스트 1개", same && n === 1 && !e2.length, `컨텍스트 ${n}, ${ex.map(s => s.nz).join(", ")} ${e2.join(" | ")}`);
    await ctx2.close();
  }
  // 직접 그리기: 펜으로 그린 선이 '그리기' 요소(곡선 경로)가 되고, 내보내기에도 들어간다
  await pg.click("#penBtn");
  {
    const r = await pg.locator("#screen").boundingBox(), x0 = r.x + r.width * .2, y0 = r.y + r.height * .7;
    await pg.mouse.move(x0, y0); await pg.mouse.down();
    for(let i = 1; i <= 30; i++) await pg.mouse.move(x0 + i * 8, y0 + Math.sin(i / 4) * 30);
    await pg.mouse.up();
  }
  await pg.keyboard.press("Escape");
  const drawn = await pg.evaluate(async () => {
    const S = await import("./js/core/state.js"), H = await import("./js/export/html.js"), n = S.state.project.nodes.at(-1);
    return {type:n.type, curves:(n.props.path.match(/C/g) || []).length, svg:!!document.querySelector(`#screen [data-id="${n.id}"] svg path`), exp:H.exportDocument().includes(`<path d="${n.props.path}"`), pen:document.getElementById("penBtn").getAttribute("aria-pressed")};
  });
  check("직접 그리기: 선이 요소가 되고 내보내기에 포함", drawn.type === "draw" && drawn.curves > 2 && drawn.svg && drawn.exp && drawn.pen === "false", JSON.stringify(drawn));
  check("데스크톱: 스크립트 오류 없음", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

/* ---------- 모바일 ---------- */
{
  const {pg, errs, ctx} = await openPage(390, 844);
  const hscroll = () => pg.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  check("모바일: 가로 스크롤 없음", !(await hscroll()));
  await pg.tap('#insert [data-type="rect"]');
  check("모바일: 탭으로 요소 삽입", await pg.locator("#screen .el").count() === 1);
  for(const [view, [sel, n]] of Object.entries(LIBS)){
    await pg.tap(`.rail [data-view="${view}"]`);
    await pg.waitForFunction(s => document.querySelectorAll(s + " .lib-item").length > 0, sel);
    check(`모바일: ${view} 탭 ${n}종`, await pg.locator(`${sel} .lib-item`).count() === n);
  }
  await pg.tap('.rail [data-view="find"]'); await pg.fill("#findSearch", "버튼");
  check("모바일: 통합 검색 결과", await pg.locator("#findList .find-row").count() > 0);
  check("모바일: 탭을 연 뒤에도 가로 스크롤 없음", !(await hscroll()));
  check("모바일: 스크립트 오류 없음", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

await browser.close(); server.close();
const failed = results.filter(r => !r.ok);
for(const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`);
console.log(`\n${results.length - failed.length}/${results.length} 통과`);
process.exit(failed.length ? 1 : 0);
