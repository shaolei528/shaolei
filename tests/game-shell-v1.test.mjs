import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const template=fs.readFileSync(new URL('../ui-shell.html',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../modules/ui/game-shell-v1.js',import.meta.url),'utf8');
const platform=fs.readFileSync(new URL('../modules/input/platform-inventory-v19.js',import.meta.url),'utf8');

assert.ok(boot.includes("'modules/ui/game-shell-v1.js'"),'V21 must load the game shell');
assert.ok(boot.indexOf("'modules/ui/game-shell-v1.js'")<boot.indexOf("'modules/combat/hit-feedback.js'"),'shell must load before final feedback extension');

for(const id of['shellMain','shellPlayPanel','shellSettingsPanel','shellContinue','shellPause','shellOverlay','shellRelayState','name','enter','setup']){
  assert.ok(template.includes(`id=\"${id}\"`),`game shell template missing #${id}`);
}
assert.ok(template.includes('好友 · 即将开放'),'unimplemented friends must be visibly unavailable');
assert.ok(template.includes('不是私有持久世界、世界列表或账号系统'),'world UI must not claim an unavailable backend');
assert.ok(template.includes('env(safe-area-inset-top)'),'shell must preserve safe-area support');
assert.ok(template.includes('image-rendering:pixelated'),'shell must preserve pixel-art rendering');
assert.ok(template.includes('@media(prefers-reduced-motion:reduce)'),'shell must honor reduced-motion preferences');

for(const required of[
  "SETTINGS_KEY='abyssal_wake_settings_v1'",
  'localStorage.setItem(SETTINGS_KEY',
  'blocksGameInput(event)',
  'event.defaultPrevented',
  '多人游戏不会因打开菜单暂停',
  'location.reload()',
  'stopGameInput()',
  'applyMenuCopy()',
  "window.AW_SUCCESSOR_VIEW==='34'",
  '3/4 斜俯视 · 海岸营地 · 探索后归来',
  'window.ABYSSAL_SHELL_V1=API'
]) assert.ok(shell.includes(required),`game shell invariant missing: ${required}`);

const applyMenuCopy=shell.match(/function applyMenuCopy\(\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(applyMenuCopy,'player-facing menu copy hook must remain a named UI-owned function');
function renderMenuCopy(route){
  const nodes={
    '.brand':{innerHTML:''},
    '.subtitle':{innerHTML:''},
    '.gate .note':{textContent:''},
    '.shell-status':{textContent:'V21 · 像素地表 · SafeCamp · Cloudflare WebSocket Relay'}
  };
  const context={started:false,window:{AW_SUCCESSOR_VIEW:route},document:{querySelector:selector=>nodes[selector]||null}};
  vm.runInNewContext(`${applyMenuCopy};applyMenuCopy();`,context);
  return nodes['.shell-status'].textContent;
}
assert.equal(renderMenuCopy(undefined),'V21 · 像素地表 · SafeCamp · Cloudflare WebSocket Relay','legacy UI copy remains unchanged outside the successor view');
assert.equal(renderMenuCopy('34'),'3/4 斜俯视 · 海岸营地 · 探索后归来','the successor menu hides internal V21 and provider labels');

assert.ok(platform.includes('window.ABYSSAL_SHELL_V1?.blocksGameInput?.(event)'),'desktop controls must honor shell input isolation');
assert.ok(platform.includes('API.stopMovement=stopMovement'),'shell must be able to release desktop movement safely');
assert.ok(boot.includes('let connectGlobal=async()=>null,switchZone=async()=>null;'),'V21 Relay override bindings must exist before network adapters load');
assert.equal(shell.includes("STORAGE_KEY='abyssal_wake_save_v5'"),false,'settings must not redefine the world-save key');
assert.equal(shell.includes('WORLD_CHANNEL'),false,'settings/menu must not change relay channels');

console.log(JSON.stringify({
  ok:true,
  menu:'present',
  relayEntry:'current-route-only',
  settings:'separate-local-key',
  inputIsolation:'platform-hooked',
  unavailableFriends:'explicit',
  persistentWorldClaim:'absent'
}));
