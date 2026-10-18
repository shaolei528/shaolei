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
 const start=await page.evaluate(()=>window.__otherworldQA);
 await page.locator('canvas').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(800);await page.keyboard.up('ArrowRight');await page.waitForTimeout(300);
 const after=await page.evaluate(()=>window.__otherworldQA);
 const distance=Math.hypot(after.player.x-start.player.x,after.player.z-start.player.z);
 if(distance<0.1)throw Error('Keyboard movement failed');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
 const mobile=await page.evaluate(()=>window.__otherworldQA);
 for(const [name,r] of Object.entries(mobile.buttons)) {
  if(r.width<48||r.height<48||r.x<0||r.y<0||r.x+r.width>390||r.y+r.height>844)throw Error('Mobile button bounds failed: '+name);
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
 fs.writeFileSync('qa/results/browser.json',JSON.stringify({passed:true,distance,touchDistance,start,after,mobile,touchAfter,errors},null,2));
 console.log(JSON.stringify({passed:true,distance,touchDistance,errors}));
 await page.screenshot({path:'qa/results/mobile.png'});
 await browser.close();server.kill();
})().catch(e=>{console.error(e);process.exit(1)});
