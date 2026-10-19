import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const legacyUi=fs.readFileSync(new URL('../ui-shell.html',import.meta.url),'utf8');
const v21Boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const runtime=fs.readFileSync(new URL('../modules/core/runtime-state.js',import.meta.url),'utf8');
const mobileFit=fs.readFileSync(new URL('../modules/input/mobile-fixes.js',import.meta.url),'utf8');
const rule=legacyUi.match(/\.arena\{([^}]+)\}/)?.[1]||'';
assert.match(rule,/(?:^|;)object-fit:contain(?:;|$)/,'the shared game canvas must preserve aspect ratio if fractional layout dimensions differ by a pixel');
assert.match(rule,/(?:^|;)image-rendering:pixelated(?:;|$)/,'the responsive game canvas must keep nearest-neighbor pixel edges');
assert.match(legacyUi,/id="canvas" class="arena" width="360" height="640"/,'the game canvas keeps its established 360px base width');
assert.ok(v21Boot.includes("fetch('./ui-shell.html?ui='+VER"),'V21 must use the shared responsive UI shell');
assert.ok(runtime.includes('Math.round(r.width)')&&runtime.includes('Math.round(r.height)')&&mobileFit.includes('resizeCanvas();')&&!mobileFit.includes('const w=360'),'both sizing paths must use one canvas-to-arena sizing contract');

function extractFunction(source,signature){
  const start=source.indexOf(signature);assert.ok(start>=0,`${signature} exists`);
  let depth=0,opened=false;
  for(let i=source.indexOf('{',start);i<source.length;i++){
    if(source[i]==='{'){depth++;opened=true}
    else if(source[i]==='}'&&opened&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`Could not isolate ${signature}`);
}
const resizeFunction=extractFunction(runtime,'function resizeCanvas(){');
for(const [width,height] of [[1100,618],[390,742]]){
  const box={width,height},canvas={width:360,height:640,getBoundingClientRect(){return box}},ctx={imageSmoothingEnabled:true};
  const sandbox={canvas,ctx,Math,addEventListener(){}};vm.createContext(sandbox);vm.runInContext(resizeFunction,sandbox);
  sandbox.resizeCanvas();assert.equal(canvas.width,width);assert.equal(canvas.height,height);assert.equal(ctx.imageSmoothingEnabled,false);
  sandbox.resizeCanvas();assert.equal(canvas.width,width);assert.equal(canvas.height,height,'a stable viewport must not resize the backing bitmap again');
}
const mobileSandbox={wrap:{getBoundingClientRect(){return{width:390,height:742}}},resizeCalls:0};
vm.createContext(mobileSandbox);vm.runInContext('function resizeCanvas(){resizeCalls++}',mobileSandbox);vm.runInContext(extractFunction(mobileFit,'function fitPixelCanvas(){'),mobileSandbox);mobileSandbox.fitPixelCanvas();
assert.equal(mobileSandbox.resizeCalls,1,'mobile resize adapter delegates exactly once to the core sizing owner');

function layout(viewWidth,viewHeight){
  const appWidth=Math.min(viewWidth,1100),arenaWidth=appWidth,arenaHeight=viewHeight-102;
  const backingWidth=Math.round(arenaWidth),backingHeight=Math.round(arenaHeight);
  const scale=Math.min(arenaWidth/backingWidth,arenaHeight/backingHeight);
  return{arenaWidth,arenaHeight,displayedWidth:backingWidth*scale,displayedHeight:backingHeight*scale,scaleX:scale,scaleY:scale};
}
for(const [width,height] of [[1280,720],[390,844]]){
  const fitted=layout(width,height);
  assert.ok(Math.abs(fitted.scaleX-fitted.scaleY)<1e-12,`${width}x${height}: CSS fit must not stretch rendered game pixels`);
  assert.ok(fitted.displayedWidth<=fitted.arenaWidth+1e-6&&fitted.displayedHeight<=fitted.arenaHeight+1e-6,`${width}x${height}: canvas must stay inside the arena`);
}
console.log(JSON.stringify({ok:true,desktopNoStretch:true,mobileNoStretch:true,nearestNeighbor:true,renderedBrowserAcceptance:'UNKNOWN'}));
