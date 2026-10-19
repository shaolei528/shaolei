import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const preview=fs.readFileSync(new URL('../prototypes/successor-3-4/preview.js',import.meta.url),'utf8');
const runner=fs.readFileSync(new URL('../prototypes/successor-3-4/qa-runner.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../prototypes/successor-3-4/preview.css',import.meta.url),'utf8');
const guard=preview.match(/const guard = `([\s\S]*?)`;/)?.[1];
assert.ok(guard,'guard bootstrap must remain explicit in the isolated preview shell');
const script=guard.replaceAll('<\\/script>','</script>').match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'storage isolation bootstrap must execute before V21 modules');

const keys=new Map([['abyssal_wake_save_v5','live-player-save'],['unrelated','keep']]);
const storage={
  get length(){return keys.size;},
  key(index){return [...keys.keys()][index]??null;},
  getItem(key){return keys.get(String(key))??null;},
  setItem(key,value){keys.set(String(key),String(value));},
  removeItem(key){keys.delete(String(key));},
};
const posts=[];
function boot(){
  const sandbox={parent:{localStorage:storage,postMessage:message=>posts.push(message)},addEventListener(){},Map};
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(script,sandbox,{filename:'isolated-preview-storage.js'});
  return sandbox;
}

const first=boot();
assert.equal(first.localStorage.getItem('abyssal_wake_save_v5'),null,'V21 must not read the real player save');
first.localStorage.setItem('abyssal_wake_save_v5','preview-player-save');
first.localStorage.setItem('abyssal_home_workbench_v1','{"tier":2}');
assert.equal(first.localStorage.length,2,'the Storage view enumerates only isolated preview keys');
assert.deepEqual([first.localStorage.key(0),first.localStorage.key(1)].sort(),['abyssal_home_workbench_v1','abyssal_wake_save_v5'],'the Storage key API omits unrelated browser data');
assert.equal(storage.getItem('abyssal_wake_save_v5'),'live-player-save','real V21 save remains untouched');
assert.equal(storage.getItem('unrelated'),'keep','unrelated browser data remains untouched');
assert.equal(storage.getItem('abyssal_wake_successor_preview_v1:abyssal_wake_save_v5'),'preview-player-save','preview save is persisted under its own namespace');
assert.equal(posts.at(-1).persistent,true,'preview reports persistence when browser storage is available');

const reloaded=boot();
assert.equal(reloaded.localStorage.getItem('abyssal_wake_save_v5'),'preview-player-save','same-tab reload restores the isolated preview save');
reloaded.localStorage.clear();
assert.equal(storage.getItem('abyssal_wake_save_v5'),'live-player-save','clearing preview data does not clear production saves');
assert.equal(storage.getItem('unrelated'),'keep','clearing preview data preserves unrelated keys');
assert.equal(storage.getItem('abyssal_wake_successor_preview_v1:abyssal_wake_save_v5'),null,'preview clear removes only namespaced data');
assert.ok(preview.includes('isolated browser save'),'outer preview labels the changed persistence boundary');
assert.ok(preview.includes("document.querySelector('#save-state')")&&preview.includes("'试玩存档 · 已保存'")&&preview.includes("'试玩存档 · 临时'"),'outer preview exposes the current persistence state to the player');
assert.ok(runner.includes('id="save-state"')&&css.includes('header .save-state'),'the save indicator has a visible, compact header slot');

const blockedSandbox={parent:{localStorage:{getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')},removeItem(){throw new Error('blocked')}},postMessage:message=>posts.push(message)},addEventListener(){},Map};
blockedSandbox.window=blockedSandbox;vm.createContext(blockedSandbox);vm.runInContext(script,blockedSandbox,{filename:'isolated-preview-storage-blocked.js'});
blockedSandbox.localStorage.setItem('abyssal_wake_save_v5','memory-fallback');
assert.equal(blockedSandbox.localStorage.getItem('abyssal_wake_save_v5'),'memory-fallback','blocked browser storage falls back to the session memory cache');
assert.equal(posts.at(-1).persistent,false,'preview reports when fallback cannot persist through reload');
console.log(JSON.stringify({ok:true,save:'isolated-namespaced-persistence',reload:'restored',realSave:'unchanged',clear:'preview-only'}));
