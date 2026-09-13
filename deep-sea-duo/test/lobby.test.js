import test from 'node:test';
import assert from 'node:assert/strict';
import { setLanguage } from '../src/i18n.js';
import { localizeRoomError, localizeRoomStatus } from '../src/ui/lobby.js';

test('lobby maps direct connection lifecycle statuses', () => {
  setLanguage('zh', { persist: false });
  assert.equal(localizeRoomStatus('connected-direct'), '局域网直连成功');
  assert.match(localizeRoomStatus('failed'), /联机失败/);
  assert.match(localizeRoomStatus('waitingDirect'), /正在建立玩家连接/);
});

test('lobby errors retain compact diagnostic codes', () => {
  setLanguage('en', { persist: false });
  const message = localizeRoomError({ code: 'ice-timeout', stage: 'W3', name: 'TimeoutError' });
  assert.match(message, /timed out/i);
  assert.match(message, /W3:ice-timeout:TimeoutError/);
  setLanguage('zh', { persist: false });
});
