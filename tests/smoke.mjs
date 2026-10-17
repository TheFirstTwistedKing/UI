/* 편집기 자동 점검: 브라우저(Playwright)로 index.html을 열어 주요 기능과 성능 한도를 확인한다.
   실행: node tests/smoke.mjs        (Playwright가 없으면 PLAYWRIGHT=/경로/node_modules/playwright 로 지정)
   빌드가 없는 정적 페이지라 저장소 폴더를 직접 띄워서 연다. 실패한 항목이 있으면 종료 코드 1. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
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
const LIBS = {shape:["#shapeLib", 113], ornament:["#decoLib", 102], component:["#cmpLib", 100], motion:["#animLib", 200], fx:["#fxLib", 400]};

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
  check("모바일: 탭을 연 뒤에도 가로 스크롤 없음", !(await hscroll()));
  check("모바일: 스크립트 오류 없음", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

await browser.close(); server.close();
const failed = results.filter(r => !r.ok);
for(const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`);
console.log(`\n${results.length - failed.length}/${results.length} 통과`);
process.exit(failed.length ? 1 : 0);
