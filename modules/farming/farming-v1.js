(()=>{
'use strict';

if(globalThis.ABYSSAL_FARMING_V1?.version===1)return;
const config=globalThis.ABYSSAL_FARMING_CONFIG_V1;
if(!config||config.version!==1||!Array.isArray(config.plots)||!config.crops)throw new Error('Farming V1 requires its crop data');
const PLOT_IDS=new Set(config.plots.map(plot=>String(plot.id)));
const crops=config.crops;
const plants=new Map();
const busy=new Set();
const saveApi=globalThis.ABYSSAL_SAVE_EXTENSIONS_V1;
const events=[];

function finite(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function cropStage(plant,now=Date.now()){
  if(!plant)return'empty';
  const crop=crops[plant.cropId];if(!crop)return'empty';
  const elapsed=Math.max(0,now-finite(plant.plantedAt,now))/1000;
  return elapsed>=Math.max(1,finite(crop.growthSeconds,42))?'ready':'growing';
}
function cleanState(state){
  const next=new Map();
  if(state?.version!==1||!Array.isArray(state.plants))return next;
  for(const entry of state.plants){
    const id=String(entry?.plotId||''),cropId=String(entry?.cropId||''),plantedAt=finite(entry?.plantedAt,-1);
    if(PLOT_IDS.has(id)&&crops[cropId]&&plantedAt>=0&&!next.has(id))next.set(id,{plotId:id,cropId,plantedAt});
  }
  return next;
}
function snapshot(now=Date.now()){
  const camp=typeof CAMP!=='undefined'?CAMP:{x:2400,y:2400};
  return config.plots.map(plot=>{
    const plant=plants.get(String(plot.id))||null;
    return{id:String(plot.id),x:finite(camp.x)+finite(plot.offset?.x),y:finite(camp.y)+finite(plot.offset?.y),cropId:plant?.cropId||null,plantedAt:plant?.plantedAt||0,stage:cropStage(plant,now),name:plant?crops[plant.cropId].name:''};
  });
}
function saveSnapshot(){return{version:1,plants:[...plants.values()].map(plant=>({...plant}))};}
function emit(type,detail){
  const event={type,playerId:typeof SESSION_ID==='string'?SESSION_ID:'',zone:typeof currentZone==='string'?currentZone:'1:1',...detail};
  events.push(event);if(events.length>40)events.shift();
  try{window.dispatchEvent(new CustomEvent(type,{detail:event}));}catch{}
}
function exchange(request){return globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1?.commitItemExchange?.(request)||{ok:false,reason:'inventory-unavailable'};}
function plantCrop(plotId,{now=Date.now(),cropId=config.starterCrop}={}){
  const id=String(plotId||''),crop=crops[String(cropId||'')];
  if(!PLOT_IDS.has(id)||!crop)return{ok:false,reason:'invalid-plot'};
  if(busy.has(id))return{ok:false,reason:'busy'};
  if(plants.has(id))return{ok:false,reason:'occupied'};
  const plant={plotId:id,cropId:String(cropId),plantedAt:Math.max(0,finite(now,Date.now()))};
  busy.add(id);plants.set(id,plant);
  const result=exchange({costs:{[crop.seedItem]:1},grants:{}});
  if(!result.ok)plants.delete(id);
  busy.delete(id);
  if(!result.ok)return result;
  emit('abyssal:crop-planted',{plotId:id,cropId:plant.cropId,plantedAt:plant.plantedAt});
  return{ok:true,plotId:id,stage:cropStage(plant,now)};
}
function harvestCrop(plotId,{now=Date.now()}={}){
  const id=String(plotId||''),plant=plants.get(id);
  if(!PLOT_IDS.has(id))return{ok:false,reason:'invalid-plot'};
  if(busy.has(id))return{ok:false,reason:'busy'};
  if(!plant)return{ok:false,reason:'empty'};
  if(cropStage(plant,now)!=='ready')return{ok:false,reason:'growing',secondsLeft:Math.max(1,Math.ceil((plant.plantedAt+crops[plant.cropId].growthSeconds*1000-now)/1000))};
  const crop=crops[plant.cropId];busy.add(id);plants.delete(id);
  const result=exchange({costs:{},grants:crop.yield});
  if(!result.ok)plants.set(id,plant);
  busy.delete(id);
  if(!result.ok)return result;
  emit('abyssal:crop-harvested',{plotId:id,cropId:plant.cropId,yield:{...crop.yield}});
  return{ok:true,plotId:id,yield:{...crop.yield}};
}
function getTarget(actor=typeof me!=='undefined'?me:null,now=Date.now()){
  if(!actor||typeof started!=='undefined'&&!started||typeof dead!=='undefined'&&dead||typeof currentZone==='string'&&currentZone!=='1:1')return null;
  if(typeof inCamp==='function'&&!inCamp(actor))return null;
  let best=null;
  for(const plot of snapshot(now)){
    const d=Math.hypot(finite(actor.x)-plot.x,finite(actor.y)-plot.y);
    if(d>86||best&&d>=best.d)continue;
    const label=plot.stage==='empty'?'【互动】播种盐风叶菜':plot.stage==='growing'?`盐风叶菜生长中 · ${Math.max(1,Math.ceil((plot.plantedAt+crops[plot.cropId].growthSeconds*1000-now)/1000))}秒`:'【互动】收获盐风叶菜';
    best={type:'farm',plotId:plot.id,d,label,stage:plot.stage};
  }
  return best;
}
function interact(plotId,{now=Date.now()}={}){
  const plot=snapshot(now).find(item=>item.id===String(plotId||''));
  if(!plot)return{ok:false,reason:'invalid-plot'};
  if(plot.stage==='empty')return plantCrop(plot.id,{now});
  if(plot.stage==='growing')return{ok:false,reason:'growing',secondsLeft:Math.max(1,Math.ceil((plot.plantedAt+crops[plot.cropId].growthSeconds*1000-now)/1000))};
  return harvestCrop(plot.id,{now});
}
function restore(state){plants.clear();for(const[id,plant]of cleanState(state))plants.set(id,plant);}
function applyRemoteSnapshot(state){
  if(state?.version!==1||!Array.isArray(state.plants))return false;
  const previous=saveSnapshot();restore(state);
  let saved=false;try{saved=typeof saveLocal==='function'&&saveLocal()===true}catch{}
  if(!saved){restore(previous);return false;}
  return true;
}
if(saveApi?.register)saveApi.register('farming.v1',{snapshot:saveSnapshot,restore});
const api=Object.freeze({version:1,plotData:config.plots.map(plot=>({...plot,offset:{...plot.offset}})),getSnapshot:snapshot,getTarget,plantCrop,harvestCrop,interact,cropStage,exportWorldSnapshot:saveSnapshot,applyRemoteSnapshot,events:()=>events.map(event=>({...event}))});
globalThis.ABYSSAL_FARMING_V1=api;
})();
