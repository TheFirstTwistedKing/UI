/* 추가 VFX 묶음. 각 파일이 def(분류, id, 이름, 옵션, make)로 효과를 등록한다. */
import { particleEffects } from "./particles.js";
import { lightEffects } from "./light.js";
import { holoEffects } from "./holo.js";
import { energyEffects } from "./energy.js";
import { weatherEffects } from "./weather.js";
import { borderEffects } from "./border.js";
import { errorEffects } from "./error.js";
import { glitchEffects } from "./glitch.js";
import { destroyEffects } from "./destroy.js";

export function extraEffects(){
  const out = [];
  const def = (cat, id, name, o, make) => out.push({id, name, cat, ...o, make});
  for(const add of [particleEffects, lightEffects, holoEffects, energyEffects, weatherEffects, borderEffects, errorEffects, glitchEffects, destroyEffects]) add(def);
  return out;
}
