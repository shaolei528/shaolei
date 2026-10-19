import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../modules/input/interaction-v12.js', import.meta.url), 'utf8');
function block(startToken, endToken) {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start);
  assert.ok(start >= 0 && end > start, `missing source block: ${startToken}`);
  return source.slice(start, end);
}

const advice = block('function currentTaskAdvice(){', 'function currentTaskText(){');
const taskStatus = block('function currentTaskText(){', 'function showDialogPage(page){');
const dialogPage = block('function showDialogPage(page){', 'function openGuideDialog(){');

function evaluate(inventory, phase='PREPARE', homeTier=1) {
  const sandbox = {inventory, hasLeftCamp:false};
  sandbox.window=sandbox;
  sandbox.ABYSSAL_EXPEDITION_LOOP_V1={state:{phase}};
  sandbox.ABYSSAL_HOME_WORKBENCH_V1={getState:()=>({tier:homeTier})};
  vm.createContext(sandbox);
  return vm.runInContext(`${advice}\n${taskStatus}\n({advice:currentTaskAdvice(),status:currentTaskText()})`, sandbox);
}

const equipped = evaluate({wood:0,stone:0,food:1,knife:true});
assert.match(equipped.advice,/MIRE MART/,'equipped knife guidance must point to the expedition instead of repeating the recipe gate');
assert.match(equipped.advice,/×1/,'guide should reflect the food currently carried');
assert.match(equipped.status,/MIRE MART/,'equipped-knife footer should point to the expedition objective');
assert.doesNotMatch(equipped.status,/0\/4|0\/3/,'guide footer must not ask for materials after the Bone Knife is equipped');

const missingFood = evaluate({wood:0,stone:0,food:0,knife:true});
assert.match(missingFood.advice,/没有食物/,'equipped knife guidance should mention resupply when no food is carried');

const missingMaterials = evaluate({wood:1,stone:2,food:0,knife:false});
assert.match(missingMaterials.advice,/1\/4/,'preparation guidance should reflect current wood');
assert.match(missingMaterials.advice,/2\/3/,'preparation guidance should reflect current stone');

const readyToCraft = evaluate({wood:4,stone:3,food:0,knife:false});
assert.match(readyToCraft.advice,/工作台/,'when materials are ready but no knife is equipped, guide should point to crafting');

const searching = evaluate({wood:0,stone:0,food:1,knife:true,shard:1},'SEARCH_FIGHT');
assert.match(searching.advice,/当前 1\/2/,'Guide advice should read the official expedition salvage snapshot');
assert.match(searching.status,/搜索 MIRE MART/,'Guide footer should follow the expedition owner phase');

const returning = evaluate({wood:0,stone:0,food:0,knife:true,shard:2},'RETURN_HOME');
assert.match(returning.advice,/返回篝火/,'Guide should stop asking the player to search after required salvage is secured');
assert.match(returning.status,/返回安全营地/,'Guide footer should state the return leg');

const completed = evaluate({wood:0,stone:3,food:0,knife:true,shard:2},'COMPLETE');
assert.match(completed.advice,/带回来了/,'Guide should acknowledge the completed trip as community progress');
assert.match(completed.status,/强化野外装备架/,'Guide should point to the existing HOME progression reward');

const upgraded = evaluate({wood:0,stone:0,food:0,knife:true,shard:0},'COMPLETE',2);
assert.match(upgraded.advice,/已经升级/,'Guide should acknowledge Field Rig growth after HOME progression');
assert.match(upgraded.status,/已强化/,'Guide should stop asking for an upgrade that already exists');

assert.match(dialogPage,/page==='task'\?currentTaskAdvice\(\):data\.text/,'the task dialogue page must render live guidance');
console.log('PASS guide task dialogue follows live equipment, material, and food state');
