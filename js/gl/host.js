/* 편집기 전체가 함께 쓰는 WebGL 렌더러 하나. 처음 필요할 때 만든다 (WebGL 효과를 안 쓰면 컨텍스트도 만들지 않는다).
   품질(preview·high·ultra)은 브라우저에 기억한다. */
import { glRuntime } from "./runtime.js";

const KEY = "uiforge.web.glq";
let host = null, quality = "high";
try{ quality = localStorage.getItem(KEY) || "high"; }catch(e){}
export const glQuality = () => quality;
export function glHost(){
  if(!host){ host = glRuntime(); if(host.ok) host.setQuality(quality); }
  return host;
}
export function setGlQuality(q){
  quality = q;
  try{ localStorage.setItem(KEY, q); }catch(e){}
  if(host && host.ok) host.setQuality(q);
}
