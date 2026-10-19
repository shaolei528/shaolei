(()=>{
  'use strict';

  if(globalThis.ABYSSAL_LIVESTOCK_RENDER_V1?.version===1)return;
  const config=globalThis.ABYSSAL_LIVESTOCK_CONFIG_V1;

  function drawPen(ctx,project,habitatId='camp-pens'){
    if(!ctx||typeof project!=='function'||!config)return false;
    const habitat=config.habitats?.find(item=>String(item.id)===String(habitatId));
    if(!habitat||typeof CAMP==='undefined')return false;
    const bounds=habitat.bounds,corners=[
      project(CAMP.x+bounds.x,CAMP.y+bounds.y),
      project(CAMP.x+bounds.x+bounds.width,CAMP.y+bounds.y),
      project(CAMP.x+bounds.x+bounds.width,CAMP.y+bounds.y+bounds.height),
      project(CAMP.x+bounds.x,CAMP.y+bounds.y+bounds.height)
    ];
    ctx.save();ctx.lineCap='square';ctx.lineJoin='miter';
    ctx.strokeStyle='#3c3424';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(corners[0].x,corners[0].y);for(let i=1;i<corners.length;i++)ctx.lineTo(corners[i].x,corners[i].y);ctx.closePath();ctx.stroke();
    ctx.strokeStyle='#9b8051';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(corners[0].x,corners[0].y-4);for(let i=1;i<corners.length;i++)ctx.lineTo(corners[i].x,corners[i].y-4);ctx.closePath();ctx.stroke();
    for(let side=0;side<corners.length;side++){
      const a=corners[side],b=corners[(side+1)%corners.length],length=Math.hypot(b.x-a.x,b.y-a.y),count=Math.max(1,Math.ceil(length/46));
      for(let i=0;i<=count;i++){
        if(side===2&&i>count*.36&&i<count*.64)continue;
        const t=i/count,x=Math.round(a.x+(b.x-a.x)*t),y=Math.round(a.y+(b.y-a.y)*t);
        ctx.fillStyle='#433625';ctx.fillRect(x-2,y-9,5,12);ctx.fillStyle='#b1915d';ctx.fillRect(x-1,y-9,2,8);
      }
    }
    ctx.restore();return true;
  }

  function drawAnimal(ctx,project,animal,selected=false,now=0){
    if(!ctx||typeof project!=='function'||!animal)return false;
    const p=project(animal.x,animal.y),bob=Math.round(Math.sin(now/440+(String(animal.id).length*1.7))*1),x=Math.round(p.x),y=Math.round(p.y),male=animal.sex==='male';
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#10201955';ctx.fillRect(x-9,y+2,18,4);
    if(selected){ctx.globalAlpha=.8;ctx.strokeStyle='#f1d997';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+2,13,5,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
    if(animal.species==='chicken'){
      ctx.fillStyle='#9d8255';ctx.fillRect(x-5,y-6+bob,10,7);ctx.fillStyle='#f0e4c2';ctx.fillRect(x-4,y-10+bob,8,7);ctx.fillStyle='#d7c69d';ctx.fillRect(x-2,y-12+bob,4,3);ctx.fillStyle='#d58e64';ctx.fillRect(x+4,y-8+bob,3,2);ctx.fillStyle='#bb685b';ctx.fillRect(x-1,y-14+bob,2,2);if(male)ctx.fillRect(x+2,y-14+bob,2,2);ctx.fillStyle='#4d4233';ctx.fillRect(x-3,y+1,1,3);ctx.fillRect(x+2,y+1,1,3);
    }else if(animal.species==='cow'){
      ctx.fillStyle='#84745e';ctx.fillRect(x-10,y-9+bob,20,12);ctx.fillStyle='#e7dfc8';ctx.fillRect(x-9,y-13+bob,17,10);ctx.fillRect(x+5,y-11+bob,6,7);ctx.fillStyle='#6d6556';ctx.fillRect(x-7,y-12+bob,5,4);ctx.fillRect(x+1,y-7+bob,5,4);ctx.fillStyle='#eadbbb';ctx.fillRect(x+7,y-15+bob,3,3);ctx.fillStyle='#bb8275';ctx.fillRect(x+8,y-8+bob,4,3);ctx.fillStyle='#514637';ctx.fillRect(x-7,y+2,2,5);ctx.fillRect(x+5,y+2,2,5);
    }else{
      ctx.fillStyle='#8b8069';ctx.fillRect(x-9,y-7+bob,18,10);ctx.fillStyle='#e7e0cc';ctx.fillRect(x-8,y-11+bob,16,10);ctx.fillRect(x-11,y-8+bob,5,7);ctx.fillRect(x-4,y-14+bob,7,6);ctx.fillRect(x+3,y-13+bob,7,7);ctx.fillStyle='#cbbd9d';ctx.fillRect(x+6,y-9+bob,6,5);ctx.fillStyle='#3b352d';ctx.fillRect(x+9,y-8+bob,1,1);ctx.fillStyle='#554a39';ctx.fillRect(x-6,y+2,2,5);ctx.fillRect(x+5,y+2,2,5);
    }
    if(animal.stage==='juvenile'||animal.stage==='needs-care'){ctx.fillStyle=animal.stage==='needs-care'?'#e7c274':'#b8dbba';ctx.fillRect(x-1,y-19,3,3);}
    if(animal.productStage==='ready'){ctx.fillStyle='#fff1b8';ctx.fillRect(x+7,y-18,5,5);ctx.fillStyle='#9f783d';ctx.fillRect(x+9,y-17,1,3);}
    ctx.restore();return true;
  }

  globalThis.ABYSSAL_LIVESTOCK_RENDER_V1=Object.freeze({version:1,drawPen,drawAnimal});
})();
