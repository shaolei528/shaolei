import fs from 'node:fs';
import assert from 'node:assert/strict';

const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const template=fs.readFileSync(new URL('../survival-v7.html',import.meta.url),'utf8');
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
  '多人游戏不会因打开菜单暂停',
  'location.reload()',
  'stopGameInput()',
  'applyMenuCopy()',
  'window.ABYSSAL_SHELL_V1=API'
]) assert.ok(shell.includes(required),`game shell invariant missing: ${required}`);

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
