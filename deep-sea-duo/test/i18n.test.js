import test from 'node:test';
import assert from 'node:assert/strict';
import { getLanguage, setLanguage, t, upgradeText } from '../src/i18n.js';

test('Chinese is available as the primary locale', () => { setLanguage('zh', { persist: false }); assert.equal(getLanguage(), 'zh'); assert.equal(t('gameTitle'), '深海搭档'); });
test('English locale translates core game UI', () => { setLanguage('en', { persist: false }); assert.equal(t('bossName'), 'Abyss Shark'); assert.equal(t('createRoom'), 'Create Room'); });
test('upgrade localization follows selected language', () => { setLanguage('en', { persist: false }); assert.equal(upgradeText('rapid').label, 'Rapid Coral'); setLanguage('zh', { persist: false }); assert.equal(upgradeText('rapid').label, '连射珊瑚'); });
test('template values are interpolated', () => { setLanguage('en', { persist: false }); assert.equal(t('survived', { seconds: 42 }), 'Survived 42s'); setLanguage('zh', { persist: false }); });
