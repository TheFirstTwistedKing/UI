/* WebGL2 VFX 렌더러. 편집기와 내보낸 HTML이 같은 코드를 쓴다 (glRuntime·glBoot는 그대로 문자열로 내보낸다).
   - 페이지 전체에서 WebGL 컨텍스트는 하나만 만든다. 효과마다 자기 크기의 텍스처(FBO)에 그린 뒤
     공유 캔버스의 아래쪽에 합성하고, 요소 안의 2D 캔버스로 복사한다.
   - 단계: 장면(절차 셰이더 + GPU 입자) → 잔상(피드백) → 블룸(밝은 부분 추출·흐림) → 최종 합성(왜곡·색수차).
   - 입자는 상태를 저장하지 않고 (번호, 시드, 시간)으로 위치를 계산한다. 그래서 타임라인을 앞뒤로 옮겨도 같은 장면이 나온다.
   - 값 P: count·size·life·speed·dir·spread·grav·accel·turb·noise·depth·fall·emitX·emitY·emitR (입자),
     glow·bloom·trail·distort·chroma (후처리), 그 밖의 키는 셰이더의 u_키 uniform으로 넘어간다. */
function glRuntime(){
  "use strict";
  const host = {ok:false, list:new Set(), q:{scale:1, pmul:1, bloom:true, max:1024}};
  const cv = document.createElement("canvas");
  const gl = cv.getContext("webgl2", {alpha:true, premultipliedAlpha:true, antialias:false, depth:false, stencil:false, preserveDrawingBuffer:false});
  if(!gl) return host;
  host.ok = true;
  const QUALITY = {preview:{scale:.5, pmul:.3, bloom:false, max:512}, high:{scale:1, pmul:1, bloom:true, max:1024}, ultra:{scale:Math.min(2, window.devicePixelRatio || 1), pmul:2, bloom:true, max:2048}};
  host.setQuality = name => { host.q = QUALITY[name] || QUALITY.high; host.list.forEach(i => i.size = null); };
  host.setQuality("high");

  const LIB = `
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float h11(float n){ return h21(vec2(n, n * .37 + 11.7)); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for(int i = 0; i < 5; i++){ v += a * vnoise(p); p = m * p; a *= .5; } return v; }
`;
  const HEAD = "#version 300 es\nprecision highp float;\n";
  const QUAD = HEAD + "out vec2 vUv; void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2. - 1., 0., 1.); }";
  const COMMON_U = "uniform float uTime, uPhase, uSeed, uI, uGlow; uniform vec2 uRes; uniform vec3 uColor, uColor2;\n";

  function shader(type, src){
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + "\n" + src.split("\n").map((l, i) => (i + 1) + ": " + l).join("\n"));
    return s;
  }
  function program(vs, fs){
    const p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, vs)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for(let i = 0; i < n; i++){ const a = gl.getActiveUniform(p, i); u[a.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(p, a.name); }
    return {p, u};
  }
  const vao = gl.createVertexArray();
  const P_BRIGHT = program(QUAD, HEAD + "in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform float uThr;\nvoid main(){ vec4 c = texture(uTex, vUv); float l = max(c.r, max(c.g, c.b)); o = c * smoothstep(uThr, uThr + .35, l); }");
  const P_BLUR = program(QUAD, HEAD + "in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform vec2 uDir;\nvoid main(){ vec4 s = texture(uTex, vUv) * .227; float w[4] = float[](.195, .122, .054, .016);\n for(int i = 0; i < 4; i++){ vec2 d = uDir * float(i + 1) * 1.5; s += (texture(uTex, vUv + d) + texture(uTex, vUv - d)) * w[i]; } o = s; }");
  const P_TRAIL = program(QUAD, HEAD + "in vec2 vUv; out vec4 o; uniform sampler2D uCur, uPrev; uniform float uDecay;\nvoid main(){ o = max(texture(uCur, vUv), texture(uPrev, vUv) * uDecay); }");
  const P_FINAL = program(QUAD, HEAD + LIB + `in vec2 vUv; out vec4 o; uniform sampler2D uSrc, uBloom; uniform float uBloomK, uDist, uChroma, uTime, uHasBloom; uniform vec2 uRes;
void main(){
  vec2 uv = vUv;
  if(uDist > 0.){ vec2 w = vec2(vnoise(uv * 5. + uTime * .6), vnoise(uv * 5. - uTime * .5 + 7.3)) - .5; uv += w * uDist * .12; }
  vec2 off = (uv - .5) * uChroma / max(uRes, vec2(1.)) * 2.;
  vec4 a = texture(uSrc, uv + off), b = texture(uSrc, uv), c = texture(uSrc, uv - off);
  vec3 rgb = vec3(a.r, b.g, c.b);
  float al = max(a.a, max(b.a, c.a));
  if(uHasBloom > .5) rgb += texture(uBloom, uv).rgb * uBloomK;
  rgb = min(rgb, vec3(1.));
  al = clamp(max(al, max(rgb.r, max(rgb.g, rgb.b))), 0., 1.);
  // 상자 가장자리에서 잘린 선이 보이지 않게 부드럽게 줄인다
  vec2 e = min(vUv, 1. - vUv); float edge = smoothstep(0., .05, min(e.x, e.y));
  o = vec4(rgb, al) * edge;
}`);
  const PART_VS = HEAD + LIB + COMMON_U + `uniform float uLife, uSpeed, uDir, uSpread, uGrav, uAccel, uTurb, uNoise, uSize, uDepth, uFall, uEmitX, uEmitY, uEmitR;
out vec2 vQ; out float vA, vK;
const vec2 Q[6] = vec2[](vec2(-1, -1), vec2(1, -1), vec2(-1, 1), vec2(-1, 1), vec2(1, -1), vec2(1, 1));
void main(){
  float fi = float(gl_InstanceID) + uSeed * .001;
  float life = uLife * (.7 + .6 * h11(fi * 3.1));
  float tt = uTime + h11(fi * 1.7) * life;
  float cyc = floor(tt / life), age = tt - cyc * life, s = fi + cyc * 131.7;
  vec2 origin = vec2(uEmitX, uEmitY) * uRes + (vec2(h11(s * 2.3), h11(s * 5.9)) - .5) * uEmitR * min(uRes.x, uRes.y) * 2.;
  float ang = radians(uDir + (h11(s * 7.1) - .5) * uSpread);
  vec2 dir = vec2(cos(ang), sin(ang));
  float sp = uSpeed * (.55 + .45 * h11(s * 9.7));
  vec2 pos = origin + dir * sp * age + .5 * (vec2(0., uGrav) + dir * uAccel) * age * age;
  pos += (vec2(vnoise(pos * uNoise + vec2(uTime * .5, s)), vnoise(pos * uNoise + vec2(s, uTime * .5))) - .5) * 2. * uTurb * age;
  float k = age / life, depth = mix(1., .35 + .9 * h11(s * 4.4), uDepth);
  vA = pow(1. - k, uFall) * smoothstep(0., .06, k) * depth; vK = k;
  vec2 q = Q[gl_VertexID]; vQ = q;
  vec2 p = pos + q * uSize * depth * (1. - .4 * k);
  gl_Position = vec4(p.x / uRes.x * 2. - 1., 1. - p.y / uRes.y * 2., 0., 1.);
}`;
  const PART_FS = HEAD + COMMON_U + "in vec2 vQ; in float vA, vK; out vec4 o;\nvoid main(){ float d = length(vQ); float a = exp(-d * d * 3.5) * (1. - smoothstep(.85, 1., d)) * vA; vec3 c = mix(uColor, uColor2, vK) * a * uI * uGlow; o = vec4(c, a); }";
  const P_PART = program(PART_VS, PART_FS);
  const progs = new Map();
  // 효과의 절차 셰이더: def.frag 안에 vec4 effect(vec2 uv, vec2 px) 를 정의한다 (px는 왼쪽 위 기준 논리 픽셀)
  function fragProgram(def){
    if(progs.has(def.id)) return progs.get(def.id);
    const us = (def.u || []).map(k => "uniform float u_" + k + ";").join("\n");
    const pr = program(QUAD, HEAD + LIB + COMMON_U + us + "\nin vec2 vUv; out vec4 o;\n" + def.frag + "\nvoid main(){ o = effect(vUv, vec2(vUv.x, 1. - vUv.y) * uRes); }");
    progs.set(def.id, pr); return pr;
  }

  function target(w, h){
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    for(const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return {t, f, w, h};
  }
  const free = r => { if(r){ gl.deleteTexture(r.t); gl.deleteFramebuffer(r.f); } };
  function bindTarget(r, clear){ gl.bindFramebuffer(gl.FRAMEBUFFER, r ? r.f : null); gl.viewport(0, 0, r ? r.w : cv.width, r ? r.h : cv.height); if(clear){ gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } }
  function tex(unit, r, loc){ gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, r.t); gl.uniform1i(loc, unit); }
  const quad = () => gl.drawArrays(gl.TRIANGLES, 0, 3);
  const rgb = h => [1, 3, 5].map(i => (parseInt(String(h || "#ffffff").substr(i, 2), 16) || 0) / 255);

  function sizeOf(inst){
    const lw = Math.max(1, inst.cv.clientWidth || inst.cv.width), lh = Math.max(1, inst.cv.clientHeight || inst.cv.height);
    const k = Math.min(host.q.scale, host.q.max / Math.max(lw, lh));
    return {lw, lh, w:Math.max(1, Math.round(lw * k)), h:Math.max(1, Math.round(lh * k))};
  }
  function ensure(inst){
    const s = sizeOf(inst);
    if(inst.size && inst.size.w === s.w && inst.size.h === s.h && inst.size.lw === s.lw && inst.size.lh === s.lh) return;
    release(inst); inst.size = s;
    inst.cv.width = s.w; inst.cv.height = s.h;
    inst.scene = target(s.w, s.h);
    inst.trail = [target(s.w, s.h), target(s.w, s.h)];
    const bw = Math.max(1, s.w >> 1), bh = Math.max(1, s.h >> 1);
    inst.bloom = [target(bw, bh), target(bw, bh)];
    inst.lastT = null;
  }
  function release(inst){ free(inst.scene); (inst.trail || []).forEach(free); (inst.bloom || []).forEach(free); inst.scene = inst.trail = inst.bloom = null; }

  host.add = (canvas, def, P) => { const inst = {cv:canvas, ctx:canvas.getContext("2d"), def, P, size:null, live:false, t0:0}; host.list.add(inst); return inst; };
  host.drop = inst => { release(inst); host.list.delete(inst); };
  // 화면에서 사라진 캔버스의 자원을 정리한다
  host.prune = () => host.list.forEach(i => { if(!i.cv.isConnected) host.drop(i); });
  host.clear = inst => { inst.ctx.clearRect(0, 0, inst.cv.width, inst.cv.height); inst.lastT = null; };

  // 효과 하나를 시간 t(초)에 그린다. phase: 한 주기 안의 위치(0~1)
  host.draw = (inst, t, phase) => {
    if(!inst.cv.isConnected && !inst.detached) return;
    ensure(inst);
    // 잔상이 있는 효과를 멈춘 화면·건너뛴 위치에서 그릴 때는 직전 0.4초를 먼저 쌓아 재생 중과 같은 모습을 만든다
    if((inst.P.trail || 0) > 0 && !inst.warm && (inst.lastT == null || t < inst.lastT || t - inst.lastT > .25)){
      inst.warm = true; inst.lastT = null;
      for(let k = 24; k > 0; k--) if(t - k / 60 >= 0) host.draw(inst, t - k / 60, phase);
      inst.warm = false;
    }
    const s = inst.size, P = inst.P, def = inst.def, q = host.q;
    if(cv.width < s.w || cv.height < s.h){ cv.width = Math.max(cv.width, s.w); cv.height = Math.max(cv.height, s.h); }
    gl.bindVertexArray(vao); gl.disable(gl.DEPTH_TEST);
    const common = (pr) => {
      gl.useProgram(pr.p); const u = pr.u;
      if(u.uTime) gl.uniform1f(u.uTime, t); if(u.uPhase) gl.uniform1f(u.uPhase, phase || 0);
      if(u.uSeed) gl.uniform1f(u.uSeed, (P.seed || 0) % 9973); if(u.uI) gl.uniform1f(u.uI, P.intensity ?? 1); if(u.uGlow) gl.uniform1f(u.uGlow, P.glow ?? 1);
      if(u.uRes) gl.uniform2f(u.uRes, s.lw, s.lh); if(u.uColor) gl.uniform3fv(u.uColor, rgb(P.color)); if(u.uColor2) gl.uniform3fv(u.uColor2, rgb(P.color2 || P.color));
    };
    // 1) 장면
    bindTarget(inst.scene, true);
    gl.disable(gl.BLEND);
    if(def.frag){
      const pr = fragProgram(def); common(pr);
      for(const k of def.u || []) if(pr.u["u_" + k]) gl.uniform1f(pr.u["u_" + k], +P[k] || 0);
      quad();
    }
    if(def.particles){
      const pr = P_PART; common(pr); const u = pr.u;
      const set = (n, v) => { if(u[n]) gl.uniform1f(u[n], v); };
      set("uLife", Math.max(.05, P.life ?? 1.5)); set("uSpeed", P.speed ?? 120); set("uDir", P.dir ?? -90); set("uSpread", P.spread ?? 60);
      set("uGrav", P.grav ?? 0); set("uAccel", P.accel ?? 0); set("uTurb", P.turb ?? 0); set("uNoise", P.noise ?? .01); set("uSize", P.size ?? 4);
      set("uDepth", P.depth ?? 0); set("uFall", P.fall ?? 1); set("uEmitX", P.emitX ?? .5); set("uEmitY", P.emitY ?? .5); set("uEmitR", P.emitR ?? .05);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, Math.max(1, Math.round((P.count ?? 200) * q.pmul)));
      gl.disable(gl.BLEND);
    }
    let src = inst.scene;
    // 2) 잔상: 시간이 뒤로 가거나 크게 건너뛰면 처음부터 쌓는다
    const decay = P.trail || 0;
    if(decay > 0){
      const jump = inst.lastT == null || t < inst.lastT || t - inst.lastT > .25;
      const [a, b] = inst.trail;
      if(jump){ bindTarget(b, true); }
      bindTarget(a, true); gl.useProgram(P_TRAIL.p);
      tex(0, inst.scene, P_TRAIL.u.uCur); tex(1, b, P_TRAIL.u.uPrev); gl.uniform1f(P_TRAIL.u.uDecay, Math.min(.985, decay)); quad();
      inst.trail = [b, a]; src = a;
    }
    inst.lastT = t;
    // 3) 블룸
    const bloomK = q.bloom ? (P.bloom || 0) : 0;
    if(bloomK > 0){
      const [a, b] = inst.bloom;
      bindTarget(a, true); gl.useProgram(P_BRIGHT.p); tex(0, src, P_BRIGHT.u.uTex); gl.uniform1f(P_BRIGHT.u.uThr, .25); quad();
      for(let i = 0; i < 2; i++){
        bindTarget(b, true); gl.useProgram(P_BLUR.p); tex(0, a, P_BLUR.u.uTex); gl.uniform2f(P_BLUR.u.uDir, 1 / a.w, 0); quad();
        bindTarget(a, true); tex(0, b, P_BLUR.u.uTex); gl.uniform2f(P_BLUR.u.uDir, 0, 1 / a.h); quad();
      }
    }
    if(inst.warm) return;
    // 4) 최종 합성: 공유 캔버스 왼쪽 아래에 그리고 요소의 캔버스로 복사
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, s.w, s.h);
    gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, s.w, s.h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.disable(gl.SCISSOR_TEST);
    const F = P_FINAL; gl.useProgram(F.p);
    tex(0, src, F.u.uSrc); tex(1, inst.bloom[0], F.u.uBloom);
    gl.uniform1f(F.u.uBloomK, bloomK); gl.uniform1f(F.u.uHasBloom, bloomK > 0 ? 1 : 0);
    gl.uniform1f(F.u.uDist, P.distort || 0); gl.uniform1f(F.u.uChroma, (P.chroma || 0) * (s.w / s.lw)); gl.uniform1f(F.u.uTime, t); gl.uniform2f(F.u.uRes, s.w, s.h);
    quad();
    inst.ctx.clearRect(0, 0, s.w, s.h);
    inst.ctx.drawImage(cv, 0, cv.height - s.h, s.w, s.h, 0, 0, s.w, s.h);
  };

  // 실시간 재생 (라이브러리 견본·미리보기·내보낸 페이지): 화면에 보이는 것만 그린다
  let raf = 0;
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { const i = [...host.list].find(x => x.cv === e.target); if(i) i.visible = e.isIntersecting; })) : null;
  function loop(now){
    raf = 0; let any = false;
    host.list.forEach(i => {
      if(!i.live) return;
      if(!i.cv.isConnected){ host.drop(i); return; }
      any = true;
      if(i.visible === false) return;
      const r = i.timing ? i.timing(now) : {t:(now - i.t0) / 1000, phase:0};
      if(r == null) host.clear(i); else host.draw(i, r.t, r.phase);
    });
    if(any) raf = requestAnimationFrame(loop);
  }
  host.live = (inst, on, timing) => {
    inst.live = on; inst.t0 = performance.now(); inst.timing = timing || null;
    if(on){ if(io) io.observe(inst.cv); if(!raf) raf = requestAnimationFrame(loop); }
    else if(io) io.unobserve(inst.cv);
  };
  return host;
}

/* 내보낸 HTML에서 실행: cfg = {quality, defs:{id:{frag,u,particles}}, inst:[{s:캔버스 선택자, def, P, delay, D, iters, color}]} */
function glBoot(cfg){
  "use strict";
  const host = glRuntime(), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!host.ok){
    // WebGL2가 없으면 효과 색의 은은한 빛으로 대신한다
    cfg.inst.forEach(x => { const c = document.querySelector(x.s); if(c){ c.style.display = "none"; c.parentNode.style.background = "radial-gradient(closest-side," + x.P.color + "55,transparent)"; c.parentNode.title = "이 브라우저는 WebGL2를 지원하지 않아 대체 그림으로 표시합니다"; } });
    return;
  }
  host.setQuality(cfg.quality || "high");
  const t0 = performance.now();
  cfg.inst.forEach(x => {
    const c = document.querySelector(x.s); if(!c) return;
    const inst = host.add(c, cfg.defs[x.def], x.P);
    const timing = now => {
      const tl = (reduce ? x.poster : now - t0) - x.delay;
      if(tl < 0 || (x.iters > 0 && tl > x.D * x.iters)) return null;
      return {t:tl / 1000 * (x.P.speedK || 1), phase:(tl % x.D) / x.D};
    };
    if(reduce){ const r = timing(0); if(r) host.draw(inst, r.t, r.phase); }
    else host.live(inst, true, timing);
  });
}

export { glRuntime, glBoot };
export const GL_RUNTIME_SRC = glRuntime.toString(), GL_BOOT_SRC = glBoot.toString();
