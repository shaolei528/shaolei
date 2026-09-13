import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('main drives gameplay through the game-session runtime', async () => {
  const main = await read('src/main.js');
  assert.match(main, /createGameSession/);
  assert.match(main, /session\.tick\(/);
  assert.match(main, /session\.begin\(/);
  assert.doesNotMatch(main, /\bstep\s*\(/);
});

test('main delegates room presentation to the lobby module', async () => {
  const main = await read('src/main.js');
  assert.match(main, /createLobbyUi/);
  assert.doesNotMatch(main, /querySelector\('#room-panel'\)/);
  assert.doesNotMatch(main, /connected-relay|relay-error|relay-closed/);
});

test('build badge has one runtime source of truth', async () => {
  const [html, build] = await Promise.all([read('index.html'), read('src/build.js')]);
  assert.match(html, /id="build-badge"[^>]*>BOOT</);
  assert.match(build, /BUILD_ID\s*=\s*'AUDIT-A1'/);
});

test('offline cache includes the extracted runtime modules', async () => {
  const sw = await read('sw.js');
  assert.match(sw, /\.\/src\/build\.js/);
  assert.match(sw, /\.\/src\/app\/game-session\.js/);
  assert.match(sw, /\.\/src\/ui\/lobby\.js/);
});
