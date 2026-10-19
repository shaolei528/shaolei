(()=>{
'use strict';

if(globalThis.ABYSSAL_LIVESTOCK_V1?.version===1)return;
const config=globalThis.ABYSSAL_LIVESTOCK_CONFIG_V1;
if(!config||config.version!==1||!config.species||!Array.isArray(config.habitats)||!Array.isArray(config.starterAnimals))throw new Error('Livestock V1 requires its species and habitat data');
const animals=new Map(),busy=new Set(),events=[];
const species=config.species,habitats=new Map(config.habitats.map(habitat=>[String(habitat.id),habitat]));
const saveApi=globalThis.ABYSSAL_SAVE_EXTENSIONS_V1;
let nextId=1;

function finite(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function clone(value){return JSON.parse(JSON.stringify(value));}
function camp(){return typeof CAMP!=='undefined'?CAMP:{x:2400,y:2400};}
function isInCamp(actor){return !!actor&&typeof inCamp==='function'&&inCamp(actor)&&(typeof currentZone==='undefined'||currentZone==='1:1');}
function habitatPoint(habitatId,x,y){
  const habitat=habitats.get(String(habitatId||''));if(!habitat)return false;
  const origin=camp(),bounds=habitat.bounds||{},wx=finite(x)-origin.x,wy=finite(y)-origin.y;
  return wx>=finite(bounds.x)&&wy>=finite(bounds.y)&&wx<=finite(bounds.x)+finite(bounds.width)&&wy<=finite(bounds.y)+finite(bounds.height);
}
function makeStarter(){
  const origin=camp();
  return config.starterAnimals.map(item=>({id:String(item.id),species:String(item.species),sex:item.sex,habitatId:String(item.habitatId),x:origin.x+finite(item.offset?.x),y:origin.y+finite(item.offset?.y),maturesAt:0,fedAt:0,productReadyAt:0,careCount:1,breedCooldownUntil:0,parentIds:[]}));
}
function cleanAnimal(item){
  const id=String(item?.id||''),speciesId=String(item?.species||''),habitatId=String(item?.habitatId||''),sex=item?.sex;
  if(!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(id)||!species[speciesId]||!habitats.has(habitatId)||!['female','male'].includes(sex))return null;
  const x=finite(item.x,NaN),y=finite(item.y,NaN);if(!Number.isFinite(x)||!Number.isFinite(y)||!habitatPoint(habitatId,x,y))return null;
  return{id,species:speciesId,sex,habitatId,x,y,maturesAt:Math.max(0,finite(item.maturesAt)),fedAt:Math.max(0,finite(item.fedAt)),productReadyAt:Math.max(0,finite(item.productReadyAt)),careCount:Math.max(0,Math.min(1,Math.floor(finite(item.careCount)))),breedCooldownUntil:Math.max(0,finite(item.breedCooldownUntil)),parentIds:Array.isArray(item.parentIds)?item.parentIds.map(String).slice(0,2):[]};
}
function stageOf(animal,now=Date.now()){
  if(!animal.maturesAt)return'adult';
  if(now<animal.maturesAt)return'juvenile';
  return animal.careCount>0?'ready-to-mature':'needs-care';
}
function productStageOf(animal,now=Date.now()){
  if(stageOf(animal,now)!=='adult'||!animal.fedAt)return'none';
  return now>=animal.productReadyAt?'ready':'growing';
}
function saveOnly(){try{return typeof saveLocal==='function'&&saveLocal()===true}catch{return false}}
function emit(type,detail){
  const event={type,playerId:typeof SESSION_ID==='string'?SESSION_ID:'',zone:typeof currentZone==='string'?currentZone:'1:1',...detail};
  events.push(event);if(events.length>80)events.shift();
  try{window.dispatchEvent(new CustomEvent(type,{detail:event}))}catch{}
}
function exchange(request){return globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1?.commitItemExchange?.(request)||{ok:false,reason:'inventory-unavailable'};}
function setAnimal(animal){animals.set(animal.id,animal);}
function restore(state){
  animals.clear();
  if(state?.version!==1||!Array.isArray(state.animals)){
    nextId=1;for(const item of makeStarter())setAnimal(item);return;
  }
  for(const entry of state.animals.slice(0,48)){const animal=cleanAnimal(entry);if(animal&&!animals.has(animal.id))setAnimal(animal);}
  nextId=Math.max(1,Math.floor(finite(state.nextId,1)));
  if(!animals.size)for(const item of makeStarter())setAnimal(item);
}
function saveSnapshot(){return{version:1,nextId,animals:[...animals.values()].map(animal=>clone(animal))};}
function applyRemoteSnapshot(state){
  if(state?.version!==1||!Array.isArray(state.animals))return false;
  const previous=saveSnapshot();restore(state);
  if(!saveOnly()){restore(previous);return false;}
  return true;
}
function matureDue(now){
  for(const animal of animals.values()){
    if(!animal.maturesAt||now<animal.maturesAt||animal.careCount<1)continue;
    const previous=clone(animal);animal.maturesAt=0;animal.careCount=0;
    if(!saveOnly()){setAnimal(previous);continue;}
    emit('abyssal:livestock-grown',{animalId:animal.id,species:animal.species,habitatId:animal.habitatId});
  }
}
function snapshot(now=Date.now()){
  matureDue(now);
  return [...animals.values()].map(animal=>{
    const kind=species[animal.species];
    return{id:animal.id,species:animal.species,name:kind.name,sex:animal.sex,habitatId:animal.habitatId,x:animal.x,y:animal.y,stage:stageOf(animal,now),maturesAt:animal.maturesAt,careCount:animal.careCount,productItem:kind.productItem,productName:kind.productName,productStage:productStageOf(animal,now),productReadyAt:animal.productReadyAt,breedCooldownUntil:animal.breedCooldownUntil};
  });
}
function withinReach(actor,animal){
  if(!isInCamp(actor)||!animal||!habitatPoint(animal.habitatId,animal.x,animal.y))return false;
  return Math.hypot(finite(actor.x)-animal.x,finite(actor.y)-animal.y)<=Math.max(24,finite(config.interactionRadius,86));
}
function eligiblePair(animal,now){
  if(!animal||stageOf(animal,now)!=='adult')return null;
  const kind=species[animal.species];if(!kind||animals.size>=48)return null;
  const cooldown=animal.breedCooldownUntil>now;
  if(cooldown)return null;
  const mate=[...animals.values()].find(candidate=>candidate.id!==animal.id&&candidate.species===animal.species&&candidate.sex!==animal.sex&&candidate.habitatId===animal.habitatId&&stageOf(candidate,now)==='adult'&&candidate.breedCooldownUntil<=now);
  if(!mate)return null;
  const female=animal.sex==='female'?animal:mate,male=animal.sex==='male'?animal:mate;
  return{femaleId:female.id,maleId:male.id,species:animal.species,speciesName:kind.name};
}
function getTarget(actor=typeof me!=='undefined'?me:null,now=Date.now()){
  if(!actor||typeof started!=='undefined'&&!started||typeof dead!=='undefined'&&dead||!isInCamp(actor))return null;
  const rows=snapshot(now);let best=null;
  for(const row of rows){const d=Math.hypot(finite(actor.x)-row.x,finite(actor.y)-row.y);if(d>finite(config.interactionRadius,86)||best&&d>=best.d)continue;
    const kind=species[row.species],stage=row.stage,productStage=row.productStage;
    let label;
    if(productStage==='ready')label=`【互动】收取${kind.productName}`;
    else if(productStage==='growing')label=`${kind.name}${row.sex==='female'?'':'♂'} · ${Math.max(1,Math.ceil((row.productReadyAt-now)/1000))}秒后${kind.productName}成熟`;
    else if(stage==='needs-care')label=`【互动】照料${kind.name}幼崽 · 口粮 ×1`;
    else if(stage==='juvenile'&&row.careCount>0)label=`${kind.name}幼崽正在长大`;
    else if(stage==='juvenile')label=`【互动】照料${kind.name}幼崽 · 口粮 ×1`;
    else if(productStage==='none')label=`【互动】喂养${kind.name} · 口粮 ×1`;
    const pair=eligiblePair(animals.get(row.id),now);
    best={type:'livestock',animalId:row.id,species:row.species,d,label,stage,productStage,breedPair:pair};
  }
  return best;
}
function feedAnimal(animalId,{now=Date.now(),actor=typeof me!=='undefined'?me:null}={}){
  const id=String(animalId||''),animal=animals.get(id);if(!animal)return{ok:false,reason:'unknown-animal'};
  if(!withinReach(actor,animal))return{ok:false,reason:'outside-habitat'};
  if(busy.has(id))return{ok:false,reason:'busy'};
  const stage=stageOf(animal,now);
  if(stage==='adult'&&productStageOf(animal,now)==='ready')return{ok:false,reason:'product-ready'};
  if(stage==='adult'&&animal.fedAt)return{ok:false,reason:'already-fed'};
  if((stage==='juvenile'||stage==='needs-care')&&animal.careCount>0)return{ok:false,reason:'already-cared'};
  if(stage==='ready-to-mature')return{ok:false,reason:'growing'};
  const previous=clone(animal),updated=clone(animal);
  if(stage==='adult'){updated.fedAt=now;updated.productReadyAt=now+Math.max(1,finite(species[animal.species].productionSeconds,24))*1000;}
  else{updated.careCount=1;if(now>=updated.maturesAt)updated.maturesAt=now+1000;}
  busy.add(id);setAnimal(updated);
  const result=exchange({costs:{[config.feedItem]:1},grants:{}});
  if(!result.ok)setAnimal(previous);
  busy.delete(id);
  if(!result.ok)return result;
  emit('abyssal:livestock-fed',{animalId:id,species:animal.species,feedItem:config.feedItem,stage});
  return{ok:true,animalId:id,stage:stage==='adult'?'producing':'cared'};
}
function collectProduct(animalId,{now=Date.now(),actor=typeof me!=='undefined'?me:null}={}){
  const id=String(animalId||''),animal=animals.get(id);if(!animal)return{ok:false,reason:'unknown-animal'};
  if(!withinReach(actor,animal))return{ok:false,reason:'outside-habitat'};
  if(busy.has(id))return{ok:false,reason:'busy'};
  if(productStageOf(animal,now)!=='ready')return{ok:false,reason:animal.fedAt?'not-ready':'no-product'};
  const previous=clone(animal),updated=clone(animal);updated.fedAt=0;updated.productReadyAt=0;
  busy.add(id);setAnimal(updated);
  const item=species[animal.species].productItem,result=exchange({costs:{},grants:{[item]:1}});
  if(!result.ok)setAnimal(previous);
  busy.delete(id);
  if(!result.ok)return result;
  emit('abyssal:livestock-product-collected',{animalId:id,species:animal.species,item,amount:1});
  return{ok:true,animalId:id,item,amount:1};
}
function breedAnimal(maleId,femaleId,{now=Date.now(),actor=typeof me!=='undefined'?me:null}={}){
  const male=animals.get(String(maleId||'')),female=animals.get(String(femaleId||''));
  if(!male||!female)return{ok:false,reason:'unknown-animal'};
  if(male.id===female.id||male.sex!=='male'||female.sex!=='female'||male.species!==female.species||male.habitatId!==female.habitatId)return{ok:false,reason:'incompatible-pair'};
  if(!withinReach(actor,male)||!withinReach(actor,female))return{ok:false,reason:'outside-habitat'};
  const kind=species[male.species];
  if(stageOf(male,now)!=='adult'||stageOf(female,now)!=='adult')return{ok:false,reason:'not-adult'};
  if(now<male.breedCooldownUntil||now<female.breedCooldownUntil)return{ok:false,reason:'cooldown'};
  if([...animals.values()].filter(animal=>animal.species===male.species).length>=finite(kind.maxAnimals,8))return{ok:false,reason:'pen-full'};
  const previousMale=clone(male),previousFemale=clone(female),previousNextId=nextId,id=`young-${male.species}-${nextId++}`;
  const child={id,species:male.species,sex:(nextId%2)?'female':'male',habitatId:male.habitatId,x:(male.x+female.x)/2,y:(male.y+female.y)/2,maturesAt:now+Math.max(1,finite(kind.maturitySeconds,30))*1000,fedAt:0,productReadyAt:0,careCount:0,breedCooldownUntil:0,parentIds:[male.id,female.id]};
  const cooldown=now+Math.max(1,finite(kind.breedingCooldownSeconds,45))*1000;
  male.breedCooldownUntil=cooldown;female.breedCooldownUntil=cooldown;
  setAnimal(child);
  const result=exchange({costs:{[config.feedItem]:1},grants:{}});
  if(!result.ok){setAnimal(previousMale);setAnimal(previousFemale);animals.delete(id);nextId=previousNextId;return result;}
  emit('abyssal:livestock-bred',{species:male.species,maleId:male.id,femaleId:female.id,offspringId:id,habitatId:child.habitatId});
  return{ok:true,offspringId:id,species:male.species,maturesAt:child.maturesAt};
}
function interact(animalId,options={}){
  const animal=animals.get(String(animalId||''));if(!animal)return{ok:false,reason:'unknown-animal'};
  const now=finite(options.now,Date.now()),stage=stageOf(animal,now);
  if(productStageOf(animal,now)==='ready')return collectProduct(animal.id,{...options,now});
  if(stage==='adult'&&animal.fedAt)return{ok:false,reason:'producing',secondsLeft:Math.max(1,Math.ceil((animal.productReadyAt-now)/1000))};
  return feedAnimal(animal.id,{...options,now});
}
if(saveApi?.register)saveApi.register('farming.livestock.v1',{snapshot:saveSnapshot,restore});
globalThis.ABYSSAL_LIVESTOCK_V1=Object.freeze({version:1,getSnapshot:snapshot,getTarget,feedAnimal,collectProduct,breedAnimal,interact,stageOf,productStageOf,exportWorldSnapshot:saveSnapshot,applyRemoteSnapshot,events:()=>events.map(event=>clone(event))});
})();
