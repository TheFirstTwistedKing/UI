/* WebGL2로 그리는 VFX 견본. 각 효과는 gl(셰이더 정의)과 params(편집할 수 있는 값 목록)를 가진다.
   - gl.frag: vec4 effect(vec2 uv, vec2 px) 를 정의하는 GLSL. u에 적은 값은 uniform float u_값 으로 들어간다.
   - gl.particles: GPU 입자를 함께 그린다.
   - d.p: 효과별 세부 값의 기본값. 효과에 쓰이는 값만 편집 화면에 보인다. */

// 편집할 수 있는 세부 값: 이름 · 최소 · 최대 · 간격 · 설명
export const GL_PARAMS = {
  count:["입자 수", 0, 2000, 10], size:["입자 크기", .5, 30, .5], life:["수명 (초)", .1, 6, .05],
  speed:["입자 속도", 0, 800, 5], accel:["가속도", -600, 600, 5], grav:["중력", -800, 800, 5],
  dir:["방향 (도)", -180, 180, 1], spread:["퍼짐 각도", 0, 360, 1],
  emitX:["방출 위치 X", 0, 1, .01], emitY:["방출 위치 Y", 0, 1, .01], emitR:["방출 범위", 0, .5, .005],
  turb:["난류", 0, 300, 1], noise:["노이즈 크기", .001, .1, .001], depth:["깊이감", 0, 1, .01], fall:["감쇠", .2, 4, .05],
  radius:["반지름", .1, 1.5, .01], rings:["고리 수", 0, 4, 1], rays:["광선 수", 0, 24, 1],
  swirl:["소용돌이", 0, 3, .01], arms:["팔 수", 1, 8, 1],
  glow:["발광", 0, 3, .05], bloom:["블룸", 0, 3, .05], trail:["잔상", 0, .98, .01],
  distort:["왜곡", 0, 1, .01], chroma:["색수차", 0, 8, .1],
};

const CORE = `
vec4 effect(vec2 uv, vec2 px){
  float m = min(uRes.x, uRes.y);
  vec2 p = (px - uRes * .5) / m;
  float r = length(p), a = atan(p.y, p.x), R = u_radius * .5;
  float n = fbm(p * 4. + vec2(uTime * .6, -uTime * .4) + uSeed * .01);
  float core = smoothstep(R, 0., r + (n - .5) * .14 * uI);
  float ring = 0.;
  for(int i = 0; i < 4; i++){
    float fi = float(i);
    if(fi >= u_rings) break;
    float rr = R * (1.25 + .4 * fi) + .015 * sin(uTime * 2. + fi);
    float w = (1.2 + uI) / m;
    float dir = mod(fi, 2.) * 2. - 1.;
    ring += exp(-pow((r - rr) / w, 2.)) * (.55 + .45 * sin(a * (3. + fi * 2.) + uTime * (1. + fi) * dir));
  }
  float rays = u_rays > .5 ? pow(max(0., sin(a * u_rays + uTime * 1.3 + n * 3.)), 10.) * smoothstep(R * 3.2, R, r) * smoothstep(R * .6, R * 1.1, r) : 0.;
  float k = core * 1.3 + ring * .8 + rays * .7;
  vec3 col = mix(uColor2, uColor, clamp(core * 1.5 + ring * .3, 0., 1.)) * k + vec3(pow(core, 5.) * .9);
  col *= uI * uGlow * smoothstep(.5, .38, r);
  return vec4(col, clamp(max(col.r, max(col.g, col.b)), 0., 1.));
}`;

const PORTAL = `
vec4 effect(vec2 uv, vec2 px){
  float m = min(uRes.x, uRes.y);
  vec2 p = (px - uRes * .5) / m;
  float r = length(p), a = atan(p.y, p.x), R = u_radius * .5;
  float tw = u_swirl * 2.2 / (r * 5. + .35) - uTime * 1.4, sw = a + tw;
  vec2 q = mat2(cos(tw), sin(tw), -sin(tw), cos(tw)) * p;
  float arms = .5 + .5 * sin(sw * floor(u_arms + .5) + fbm(p * 3. + uTime * .3) * 4.);
  float n = fbm(q * 5. + vec2(0., -uTime * .8) + uSeed * .01);
  float disk = smoothstep(R * 1.7, R * .95, r) * smoothstep(R * .45, R * .7, r);
  float rim = exp(-pow((r - R * .62) * m / (2. + 2. * uI), 2.));
  float k = disk * (arms * .75 + n * .7) * uI + rim * 1.3;
  vec3 col = mix(uColor2, uColor, clamp(arms * n * 1.5 + rim, 0., 1.)) * k * uGlow;
  float hole = smoothstep(R * .62, R * .4, r);
  col *= (1. - hole) * smoothstep(.5, .4, r);
  return vec4(col, clamp(max(col.r, max(col.g, col.b)) + hole * .92, 0., 1.));
}`;

export const GL_EFFECTS = [
  {id:"glCore", name:"에너지 코어", cat:"WebGL", color:true, color2:true, poster:.3,
    gl:{id:"glCore", frag:CORE, u:["radius", "rings", "rays"], particles:true},
    params:["radius", "rings", "rays", "count", "size", "life", "speed", "spread", "turb", "noise", "depth", "fall", "glow", "bloom", "trail", "distort", "chroma"],
    d:{duration:4000, iterations:0, color:"#73e2ec", color2:"#0111f3",
      p:{radius:.55, rings:3, rays:12, count:140, size:2.5, life:1.4, speed:70, dir:0, spread:360, grav:0, accel:-20, turb:12, noise:.02, depth:.5, fall:1.4, emitX:.5, emitY:.5, emitR:.06,
        glow:1.2, bloom:1.2, trail:0, distort:.08, chroma:1.2}}},
  {id:"glFountain", name:"입자 분수", cat:"WebGL", color:true, color2:true, poster:.5,
    gl:{id:"glFountain", frag:null, u:[], particles:true},
    params:["count", "size", "life", "speed", "accel", "grav", "dir", "spread", "emitX", "emitY", "emitR", "turb", "noise", "depth", "fall", "glow", "bloom", "trail", "chroma"],
    d:{duration:3000, iterations:0, color:"#73e2ec", color2:"#0111f3",
      p:{count:600, size:3, life:1.8, speed:300, dir:-90, spread:28, grav:330, accel:0, emitX:.5, emitY:.95, emitR:.02, turb:25, noise:.015, depth:.6, fall:1.2,
        glow:1, bloom:1.1, trail:.8, distort:0, chroma:0}}},
  {id:"glPortal", name:"포털", cat:"WebGL", color:true, color2:true, poster:.4,
    gl:{id:"glPortal", frag:PORTAL, u:["radius", "swirl", "arms"], particles:false},
    params:["radius", "swirl", "arms", "glow", "bloom", "trail", "distort", "chroma"],
    d:{duration:5000, iterations:0, color:"#b98cff", color2:"#0111f3",
      p:{radius:.7, swirl:1.2, arms:3, glow:1.1, bloom:1, trail:0, distort:.3, chroma:2.5}}},
].map(e => ({...e, make:() => ({layers:[]})}));
