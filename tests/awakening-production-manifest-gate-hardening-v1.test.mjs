import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {validatePack,REQUIRED_PRODUCTION_IDS} from '../tools/awakening-assets/lib.mjs';
import {encodeRgbaPng} from '../tools/awakening-assets/png.mjs';

const BINDINGS={
  terrain:{cold_grass:['aw_v1_terrain_cold_grass_a','aw_v1_terrain_cold_grass_b'],dirt_shoulder:['aw_v1_terrain_dirt_shoulder_a','aw_v1_terrain_dirt_shoulder_b'],asphalt:['aw_v1_terrain_asphalt_a','aw_v1_terrain_asphalt_b','aw_v1_terrain_asphalt_cracked'],store_floor:['aw_v1_terrain_concrete_floor_a','aw_v1_terrain_concrete_floor_b']},
  decal:{puddle:['aw_v1_decal_puddle_01'],crack:['aw_v1_decal_asphalt_crack_01'],tire:['aw_v1_decal_tire_mark_01'],glass:['aw_v1_decal_broken_glass_01'],residue:['aw_v1_decal_early_residue_01']},
  prop:{fence:['aw_v1_prop_fence_01'],barrier:['aw_v1_prop_road_barrier_01'],wall:['aw_v1_prop_store_exterior_wall_01'],sign:['aw_v1_prop_store_sign_mire_mart'],counter:['aw_v1_prop_store_counter_01'],shelf:['aw_v1_prop_store_shelf_01'],fridge:['aw_v1_prop_store_fridge_01'],debris:['aw_v1_prop_store_debris_01']},
  fx:{flicker:['aw_v1_fx_store_failing_light_01'],anomaly:['aw_v1_fx_store_early_residue_01']}
};
function rgbaPng(alpha=true){
  const w=64,h=64,b=Buffer.alloc(w*h*4);
  for(let i=0;i<w*h;i++){const p=i*4;b[p]=42;b[p+1]=66;b[p+2]=78;b[p+3]=alpha&&i===0?0:255;}
  return encodeRgbaPng(w,h,b);
}
function save(root,file,data){const full=path.join(root,...file.split('/'));fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,data);}
function makeFullPack(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aw-gate-')),assets=[];
  for(const id of REQUIRED_PRODUCTION_IDS){
    const category=id.split('_')[2],file=`${category}/${id}.png`;
    save(root,file,rgbaPng(category!=='terrain'));
    const asset={id,category,file,width:64,height:64};
    if(category==='prop')asset.anchor={x:.5,y:1};
    else if(category!=='terrain')asset.anchor={x:.5,y:.5};
    if(category==='fx')asset.frames=1;
    assets.push(asset);
  }
  const manifest={version:1,pack:'Gate hardening fixture',bindings:structuredClone(BINDINGS),sheets:[],assets};
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));
  return {root,manifest};
}
function writeManifest(root,manifest){fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));}
function expectStrictFail(mutator,needle){const {root,manifest}=makeFullPack();mutator(manifest);writeManifest(root,manifest);const r=validatePack(root,{strictRequired:true});assert.equal(r.ok,false);assert.ok(r.errors.some(e=>e.includes(needle)),`${needle}\n${r.errors.join('\n')}`);}

// A complete presentation-only manifest passes the full production gate.
{
  const {root}=makeFullPack();const r=validatePack(root,{strictRequired:true});assert.equal(r.ok,true,r.errors.join('\n'));
}
// Strict allowlist rejects authority-bearing or arbitrary manifest fields.
for(const [field,value] of [['damage',10],['collision',{solid:true}],['movement',{speed:2}],['loot',['x']],['ai',{state:'idle'}],['network',{replicate:true}],['save',{persist:true}],['interaction',{type:'loot'}]]){
  const {root,manifest}=makeFullPack();manifest.assets[0][field]=value;writeManifest(root,manifest);const r=validatePack(root);assert.equal(r.ok,false);assert.ok(r.errors.some(e=>e.includes(`manifest.assets[0].${field}`)));
}
// Representative blockers across every category must fail independently.
for(const id of ['aw_v1_terrain_cold_grass_a','aw_v1_decal_early_residue_01','aw_v1_prop_store_debris_01','aw_v1_fx_store_failing_light_01','aw_v1_fx_store_early_residue_01']){
  expectStrictFail(m=>{m.assets=m.assets.filter(a=>a.id!==id);},`required production asset missing: ${id}`);
}
// Missing semantic binding fails even when its asset exists.
expectStrictFail(m=>{delete m.bindings.decal.residue;},'required production binding missing: decal.residue');
// MIRE MART is the explicit required sign binding.
expectStrictFail(m=>{m.bindings.prop.sign=['aw_v1_prop_fence_01'];},'required production binding prop.sign must include aw_v1_prop_store_sign_mire_mart');
// Grime / entrance / bollard may exist as unbound inventory but may not create runtime semantics.
{
  const {root,manifest}=makeFullPack();
  for(const [id,category] of [['aw_v1_decal_store_grime_01','decal'],['aw_v1_prop_store_entrance_01','prop'],['aw_v1_prop_roadside_bollards_cone_01','prop']]){
    const file=`${category}/${id}.png`;save(root,file,rgbaPng(true));const a={id,category,file,width:64,height:64,anchor:{x:.5,y:category==='prop'?1:.5}};manifest.assets.push(a);
  }
  writeManifest(root,manifest);const r=validatePack(root,{strictRequired:true});assert.equal(r.ok,true,r.errors.join('\n'));assert.ok(r.warnings.some(w=>w.includes('aw_v1_decal_store_grime_01')));
}
for(const [category,semantic,id] of [['decal','grime','aw_v1_decal_store_grime_01'],['prop','entrance','aw_v1_prop_store_entrance_01'],['prop','bollard','aw_v1_prop_roadside_bollards_cone_01']]){
  expectStrictFail(m=>{m.bindings[category][semantic]=[id];},`unsupported binding semantic: ${category}.${semantic}`);
}

console.log(JSON.stringify({ok:true,gate:'presentation-only allowlist + full 19-semantic strict-required',requiredAssets:REQUIRED_PRODUCTION_IDS.length,sign:'MIRE MART explicit',unsupported:['decal.grime','prop.entrance','prop.bollard']}));
