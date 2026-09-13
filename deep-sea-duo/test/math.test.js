import test from 'node:test'; import assert from 'node:assert/strict';
import { clamp, normalize, circlesTouch } from '../src/game/math.js';
test('normalizes a direction vector', () => assert.deepEqual(normalize(3, 4), { x: .6, y: .8 }));
test('clamps values into a range', () => assert.equal(clamp(12, 0, 10), 10));
test('recognizes touching circles', () => assert.equal(circlesTouch({x:0,y:0,radius:4}, {x:7,y:0,radius:3}), true));
