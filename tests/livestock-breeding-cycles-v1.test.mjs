import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const config=JSON.parse(read('data/farming/livestock-v1.json'));
const saveSource=read('modules/core/save-extensions-v1.js');
const inventorySource=read('modules/items/inventory-transactions-v1.js');
const livestockSource=read('modules/farming/livestock-v1.js');
const camp={x:2400,y:2400};
let persisted=null,allowSave=true;

const initialInventory={
  wood:0,stone:0,food:15,shard:0,seed:0,egg:0,milk:0,wool:0,
  fish_reedcarp:0,fish_glassminnow:0,fish_holloweye:0,
  meal_river_stew:0,meal_glass_porridge:0,meal_holloweye_chowder:0,meal_trail_stew:0,
  companion_egg:0,knife:false,lantern:false
};

function createGame(record=null){
  const events=[],inventory=record?{...record.inventory}:{...initialInventory};
  const context={
    ABYSSAL_LIVESTOCK_CONFIG_V1:config,
    STORAGE_KEY:'abyssal_wake_save_v5',SESSION_ID:'livestock-test-player',currentZone:'1:1',CAMP:camp,
    started:true,dead:false,me:{x:camp.x,y:camp.y},inventory,events,
    inCamp:actor=>Math.hypot(actor.x-camp.x,actor.y-camp.y)<470,
    localStorage:{getItem:()=>record?JSON.stringify(record):null},
    saveLocal(){
      if(!allowSave)return false;
      persisted={v:5,inventory:{...inventory},extensions:context.ABYSSAL_SAVE_EXTENSIONS_V1.snapshot()};
      return true;
    },
    updateUI(){},dispatchEvent:event=>events.push(event),
    CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
    Date,Math,Map,Set,JSON,console
  };
  context.window=context;context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(saveSource,context,{filename:'save-extensions-v1.js'});
  vm.runInContext(inventorySource,context,{filename:'inventory-transactions-v1.js'});
  vm.runInContext(livestockSource,context,{filename:'livestock-v1.js'});
  return context;
}

const game=createGame();
const api=game.ABYSSAL_LIVESTOCK_V1;
const speciesPairs=[
  {species:'chicken',male:'hen-b',female:'hen-a',product:'egg',productSeconds:18,maturitySeconds:30},
  {species:'cow',male:'cow-b',female:'cow-a',product:'milk',productSeconds:28,maturitySeconds:45},
  {species:'sheep',male:'sheep-b',female:'sheep-a',product:'wool',productSeconds:24,maturitySeconds:40}
];

assert.equal(api.getSnapshot(0).length,6,'the starter pen includes a real breeding pair for each species');
const totalBefore=game.inventory.food;
assert.equal(api.breedAnimal('hen-a','hen-b',{now:1000,actor:game.me}).reason,'incompatible-pair','breeding validates sex roles');
assert.equal(api.breedAnimal('cow-b','hen-a',{now:1000,actor:game.me}).reason,'incompatible-pair','breeding validates species');

for(let index=0;index<speciesPairs.length;index++){
  const pair=speciesPairs[index],bornAt=10_000+index*100_000;
  const parents=api.getSnapshot(bornAt).filter(animal=>animal.species===pair.species);
  game.me.x=(parents[0].x+parents[1].x)/2;game.me.y=(parents[0].y+parents[1].y)/2;
  const selected=api.getTarget(game.me,bornAt);
  assert.equal(selected?.species,pair.species,`${pair.species} pair is discoverable through normal nearby interaction selection`);
  assert.deepEqual({...selected.breedPair},{maleId:pair.male,femaleId:pair.female,species:pair.species,speciesName:config.species[pair.species].name});
  const born=api.breedAnimal(pair.male,pair.female,{now:bornAt,actor:game.me});
  assert.equal(born.ok,true,`${pair.species} adults in the same pen can breed through the owner command`);
  assert.equal(game.inventory.food,totalBefore-index*4-1,'each successful birth consumes one feed item atomically after the previous species lifecycle');
  assert.equal(api.breedAnimal(pair.male,pair.female,{now:bornAt+1,actor:game.me}).reason,'cooldown','the same pair cannot breed twice during cooldown');

  const childId=born.offspringId,maturityAt=bornAt+pair.maturitySeconds*1000;
  const child=api.getSnapshot(maturityAt).find(animal=>animal.id===childId);
  assert.equal(child.stage,'needs-care',`${pair.species} offspring need care at maturity`);
  game.me.x=child.x;game.me.y=child.y;
  assert.equal(api.interact(childId,{now:maturityAt,actor:game.me}).ok,true,'ordinary livestock interaction spends feed to care for the juvenile');
  assert.equal(api.getSnapshot(maturityAt+999).find(animal=>animal.id===childId).stage,'juvenile','care does not mature the animal instantly');
  assert.equal(api.getSnapshot(maturityAt+1000).find(animal=>animal.id===childId).stage,'adult','a cared juvenile matures after its visible growth beat');
  assert.equal(api.interact(childId,{now:maturityAt+1001,actor:game.me}).ok,true,'a grown animal can be fed to begin production');
  const productAt=maturityAt+1001+pair.productSeconds*1000;
  const product=api.interact(childId,{now:productAt,actor:game.me});
  assert.deepEqual({...product},{ok:true,animalId:childId,item:pair.product,amount:1},`${pair.species} produces its configured item once`);
  assert.equal(game.inventory[pair.product],1,`${pair.species} output reaches the shared inventory`);
  assert.equal(api.interact(childId,{now:productAt+1,actor:game.me}).stage,'producing','a new production cycle requires a fresh feed action');
  assert.equal(game.inventory[pair.product],1,'feeding again cannot immediately duplicate the collected product');
  const nextProduct=api.interact(childId,{now:productAt+1+pair.productSeconds*1000,actor:game.me});
  assert.equal(nextProduct.item,pair.product,'a second product becomes available only after its configured production time');
  assert.equal(game.inventory[pair.product],2,'the next production cycle awards exactly one additional item');
}

assert.ok(game.events.some(event=>event.type==='abyssal:livestock-bred'&&event.detail?.playerId==='livestock-test-player'),'birth emits an owner-scoped gameplay event');
assert.ok(game.events.some(event=>event.type==='abyssal:livestock-grown'),'maturity emits a gameplay event');
const childCount=api.getSnapshot(500_000).filter(animal=>animal.id.startsWith('young-')).length;
assert.equal(childCount,3,'the save extension contains all three offspring');
const reloaded=createGame(persisted);
assert.equal(reloaded.ABYSSAL_LIVESTOCK_V1.getSnapshot(500_000).filter(animal=>animal.id.startsWith('young-')).length,3,'V5 reload restores births without granting products again');
assert.deepEqual({egg:reloaded.inventory.egg,milk:reloaded.inventory.milk,wool:reloaded.inventory.wool},{egg:2,milk:2,wool:2});

const beforeFailedBreed=JSON.stringify(api.exportWorldSnapshot()),foodBeforeFailedBreed=game.inventory.food;
const hens=api.getSnapshot(1_000_000).filter(animal=>animal.species==='chicken');
game.me.x=(hens[0].x+hens[1].x)/2;game.me.y=(hens[0].y+hens[1].y)/2;
allowSave=false;
const failed=api.breedAnimal('hen-b','hen-a',{now:1_000_000,actor:game.me});
assert.equal(failed.reason,'save-failed','a failed V5 commit rejects breeding');
assert.equal(JSON.stringify(api.exportWorldSnapshot()),beforeFailedBreed,'failed breeding restores parents, cooldowns and offspring state');
assert.equal(game.inventory.food,foodBeforeFailedBreed,'failed breeding rolls back feed');

console.log(JSON.stringify({ok:true,species:['chicken','cow','sheep'],loop:['breed','care','mature','feed','collect'],sharedV5Inventory:true,reload:true,duplicateRewardRejected:true,saveRollback:true}));
