(()=>{
  'use strict';
  if(globalThis.ABYSSAL_COMPANION_RENDER_V1?.version===1)return;
  function drawIncubator(ctx,project,now=0){
    const pet=globalThis.ABYSSAL_PETS_V1?.getSnapshot?.(),config=globalThis.ABYSSAL_PETS_CONFIG_V1;if(!config)return;
    const camp=typeof CAMP!=='undefined'?CAMP:{x:2400,y:2400},x=camp.x+Number(config.incubator?.offset?.x||0),y=camp.y+Number(config.incubator?.offset?.y||0),p=project(x,y),pulse=pet?.incubation?Math.round((Math.sin(now/210)+1)*1.5):0;
    ctx.fillStyle='#283a35';ctx.fillRect(Math.round(p.x-17),Math.round(p.y-10),34,19);ctx.fillStyle='#8b7353';ctx.fillRect(Math.round(p.x-14),Math.round(p.y-13),28,5);ctx.fillStyle='#52796b';ctx.fillRect(Math.round(p.x-10),Math.round(p.y-5),20,9);
    ctx.fillStyle=pet?.incubation?'#a9e4c8':'#d2bd83';ctx.fillRect(Math.round(p.x-3-pulse),Math.round(p.y-8-pulse),6+pulse*2,7+pulse*2);ctx.fillStyle='#f1ebd7';ctx.textAlign='center';ctx.font='bold 7px ui-monospace,monospace';ctx.fillText('孵化器',p.x,p.y+18);
  }
  function drawCompanion(ctx,project,pet,now=0){
    if(!pet)return;const p=project(pet.x,pet.y),bob=Math.round(Math.sin(now/145)*1),x=Math.round(p.x),y=Math.round(p.y+bob);
    ctx.fillStyle='#172720';ctx.fillRect(x-9,y+6,18,3);ctx.fillStyle=pet.evolved?'#b4c9a4':'#b6a27c';ctx.fillRect(x-6,y-5,12,10);ctx.fillRect(x-4,y-9,8,5);ctx.fillStyle='#72b8a5';ctx.fillRect(x-8,y-7,3,4);ctx.fillRect(x+5,y-7,3,4);ctx.fillStyle='#f1d18a';ctx.fillRect(x-3,y-3,2,2);ctx.fillRect(x+2,y-3,2,2);ctx.fillStyle='#31453a';ctx.fillRect(x-7,y+4,4,3);ctx.fillRect(x+3,y+4,4,3);
    ctx.fillStyle='#f1eee1';ctx.textAlign='center';ctx.font='bold 7px ui-monospace,monospace';ctx.fillText(pet.name,x,y-12);
  }
  globalThis.ABYSSAL_COMPANION_RENDER_V1=Object.freeze({version:1,drawIncubator,drawCompanion});
})();
