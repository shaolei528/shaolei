const fs=require('fs'),{spawn}=require('child_process'),{chromium}=require('playwright-core');
(async()=>{
 const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
 process.on('exit',()=>server.kill());
 await new Promise(r=>setTimeout(r,700));
 const browser=await chromium.launch({executablePath:process.env.GODOT_BROWSER_EXE||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:8765/game/build/web/index.html');
 await page.waitForFunction(()=>window.__otherworldQA,{},{timeout:60000});
 const moves=[
  {keys:['a','w'],x:-0.985,z:-0.174},{keys:['a'],x:-0.819,z:0.574},
  {keys:['w'],x:-0.574,z:-0.819},{keys:['d','w'],x:0.174,z:-0.985},
  {keys:['a','s'],x:-0.174,z:0.985},{keys:['d'],x:0.819,z:-0.574},
  {keys:['s'],x:0.574,z:0.819},{keys:['d','s'],x:0.985,z:0.174}
 ];
 const walkToward=async(target,stopDistance,maxSteps=24)=>{
  for(let i=0;i<maxSteps;i++){
   const state=await page.evaluate(()=>window.__otherworldQA);
   const dx=target.x-state.player.x,dz=target.z-state.player.z,remaining=Math.hypot(dx,dz);
   if(remaining<=stopDistance)return state;
   const move=moves.reduce((best,candidate)=>(candidate.x*dx+candidate.z*dz)>(best.x*dx+best.z*dz)?candidate:best);
   for(const key of move.keys)await page.keyboard.down(key);
   await page.waitForTimeout(Math.min(400,Math.max(120,(remaining-stopDistance)/4.5*1000)));
   for(const key of move.keys)await page.keyboard.up(key);
   await page.waitForTimeout(100);
  }
  return await page.evaluate(()=>window.__otherworldQA);
 };
 const start=await page.evaluate(()=>window.__otherworldQA);
 await page.locator('canvas').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(800);await page.keyboard.up('ArrowRight');await page.waitForTimeout(300);
 const after=await page.evaluate(()=>window.__otherworldQA);
 const distance=Math.hypot(after.player.x-start.player.x,after.player.z-start.player.z);
 if(distance<0.1)throw Error('Keyboard movement failed');
 const byEmber=await walkToward({x:2.8,z:3.1},1.4);
 if(Math.hypot(byEmber.player.x-2.8,byEmber.player.z-3.1)>1.85)throw Error('Could not reach Ember: '+JSON.stringify(byEmber));
 await page.keyboard.press('e');await page.waitForTimeout(300);
 const gathered=await page.evaluate(()=>window.__otherworldQA);
 if(!gathered.collected||gathered.ember_count!==1)throw Error('Ember pickup/inventory flow failed: '+JSON.stringify({byEmber,gathered}));
 const camp={x:-4.6,z:1.2};
 const atCamp=await walkToward(camp,2.25);
 if(Math.hypot(atCamp.player.x-camp.x,atCamp.player.z-camp.z)>3.0)throw Error('Could not return to camp: '+JSON.stringify(atCamp));
 await page.locator('canvas').focus();
 await page.getByRole('button',{name:'Build Fire [C]'}).click();await page.waitForTimeout(300);
 const crafted=await page.evaluate(()=>window.__otherworldQA);
 if(!crafted.campfire_crafted||crafted.ember_count!==0)throw Error('Campfire crafting/ingredient consumption failed: '+JSON.stringify({atCamp,crafted}));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
 const mobile=await page.evaluate(()=>window.__otherworldQA);
 for(const [name,r] of Object.entries(mobile.buttons)) {
  if(r.width<48||r.height<48||r.x<0||r.y<0||r.x+r.width>390||r.y+r.height>844)throw Error('Mobile button bounds failed: '+name+' '+JSON.stringify({rect:r,viewport:mobile.viewport,buttons:mobile.buttons}));
 }
 const b=mobile.buttons.D,client=await page.context().newCDPSession(page);
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});
 await page.waitForTimeout(700);
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);
 const touchAfter=await page.evaluate(()=>window.__otherworldQA);
 const touchDistance=Math.hypot(touchAfter.player.x-mobile.player.x,touchAfter.player.z-mobile.player.z);
 if(touchDistance<0.1)throw Error('Touch movement failed');
 if(errors.length)throw Error(JSON.stringify(errors));
 fs.mkdirSync('qa/results',{recursive:true});
 fs.writeFileSync('qa/results/browser.json',JSON.stringify({passed:true,distance,gathered,atCamp,crafted,touchDistance,start,after,mobile,touchAfter,errors},null,2));
 console.log(JSON.stringify({passed:true,distance,gathered:{collected:gathered.collected,ember_count:gathered.ember_count},campPlayer:atCamp.player,crafted:{campfire_crafted:crafted.campfire_crafted,ember_count:crafted.ember_count},touchDistance,errors}));
 await page.screenshot({path:'qa/results/mobile.png'});
 await browser.close();server.kill();
})().catch(e=>{console.error(e);process.exit(1)});
