import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../content-v9.js',import.meta.url),'utf8');

for(const forbidden of[
  "button.textContent = 'PREP FIRST'",
  "button.textContent = 'MARK READY'",
  "button.textContent = CONTENT.ready ? 'READY ✓' : 'IN FIELD'",
  "'READY ✓ · TAP TO CANCEL'"
]){
  assert.equal(source.includes(forbidden),false,`ready UI must not write English source text: ${forbidden}`);
}

for(const required of[
  "button.textContent = '先准备'",
  "button.textContent = CONTENT.ready ? '已准备 ✓' : '野外'",
  "button.textContent = CONTENT.ready ? '已准备 ✓ · 点击取消' : '标记准备'",
  "toast('先制作骨刃、携带食物，并恢复状态。')",
  "const status = meta?.expedition ? ' · 野外' : (meta?.ready ? ' · 已准备 ✓' : ' · 营地')",
  "v9:{...v9, ready:CONTENT.ready}",
  "refreshReadyButton();",
  "}, 500);"
]){
  assert.ok(source.includes(required),`ready localization invariant missing: ${required}`);
}

assert.ok(source.includes("CONTENT.ready = !CONTENT.ready"),'ready state toggle semantics must remain intact');
assert.ok(source.includes("ready: !!payload.v9.ready"),'remote ready boolean handling must remain intact');

console.log(JSON.stringify({
  ok:true,
  readyButtonLanguage:'source-native-zh',
  remoteStatusLanguage:'source-native-zh',
  networkReadyPayload:'unchanged',
  readyStateSemantics:'preserved'
}));
