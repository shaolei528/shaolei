import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../prototypes/successor-3-4/qa-harness.js', import.meta.url), 'utf8');
function makeElement(tag) {
  return {
    tag, children: [], listeners: {}, style: {}, attributes: {}, textContent: '',
    setAttribute(key, value) { this.attributes[key] = value; },
    appendChild(child) { this.children.push(child); return child; },
    addEventListener(name, callback) { this.listeners[name] = callback; },
    click() { this.listeners.click?.({ target: this }); },
  };
}

for (const flags of [{}, { AW_SUCCESSOR_PREVIEW: true }, { AW_DEV_QA: true }]) {
  const blocked = { window: flags, document: { createElement() { throw new Error('must remain gated'); } } };
  vm.createContext(blocked);
  vm.runInContext(source, blocked);
  assert.equal(blocked.window.ABYSSAL_PREVIEW_QA_V1, undefined, 'QA API is absent unless both preview and dev flags are true');
}

const calls = [];
const panelRoots = [];
let rafCallback;
const bridge = {
  teleport(...args) { calls.push(['teleport', ...args]); },
  setStep(...args) { calls.push(['step', ...args]); },
  stop(...args) { calls.push(['stop', ...args]); },
  snapshot() { return { zone: '1:0', x: 12, y: 34, ticks: 9, collision: 'CLEAR', target:'camp:0', event: 'none', liveMobs: 2, windups: 1, nearest: 50, foe:'crawler 58hp', active: true }; },
};
const sandbox = {
  window: {
    AW_SUCCESSOR_PREVIEW: true,
    AW_DEV_QA: true,
    ABYSSAL_SUCCESSOR_QA_BRIDGE_V1: bridge,
    ABYSSAL_SURVIVAL_HURT_GRACE_V1: { snapshot() { return { remainingMs: 374.5, suppressedHits: 4 }; } },
    ABYSSAL_INTERACTION_V12: { getTarget() { return { type: 'resource', resource: { id: 'camp:0' } }; } },
    ABYSSAL_RESOURCE_WORK_V1: { progressFor(id) { return id === 'camp:0' ? 2 : 0; } },
    ABYSSAL_WATER_BODIES_V1: { getBody(id) { return id === 'camp-pool' ? { zone: '1:1', access: { x: 2884, y: 2488 } } : null; } },
    ABYSSAL_CAMERA_ADAPTER_V1: { project(x, y) { return { x: x - y, y: (x + y) / 2 }; } },
  },
  document: {
    body: { appendChild(element) { panelRoots.push(element); } },
    createElement: makeElement,
  },
  requestAnimationFrame(callback) { rafCallback = callback; },
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const api = sandbox.window.ABYSSAL_PREVIEW_QA_V1;
assert.ok(api, 'gated QA API is installed in the isolated development preview');
assert.equal(panelRoots.length, 1, 'one isolated diagnostics panel is mounted');
const panel = panelRoots[0];
const status = panel.children[0];
const controls = panel.children[1];
const buttons = new Map(controls.children.map(element => [element.textContent, element]));
assert.equal(buttons.size, 21, 'panel has twelve local QA locations, a water edge spot, six step/route controls, a return route, and STOP');

for (const name of ['HOME', 'WOOD QA', 'WOOD 2 QA', 'WOOD 3 QA', 'WOOD 4 QA', 'STONE QA', 'STONE 2 QA', 'STONE 3 QA', 'WORKBENCH QA', 'MIRE MART QA', 'LOOT QA', 'FIGHT QA']) buttons.get(name).click();
assert.deepEqual(calls.filter(call => call[0] === 'teleport'), [
  ['teleport', 'HOME', '1:1', 2400, 2470],
  ['teleport', 'WOOD QA', '1:1', 2050, 2255],
  ['teleport', 'WOOD 2 QA', '1:1', 2065, 2560],
  ['teleport', 'WOOD 3 QA', '1:1', 2160, 2720],
  ['teleport', 'WOOD 4 QA', '1:1', 2735, 2560],
  ['teleport', 'STONE QA', '1:1', 2100, 2650],
  ['teleport', 'STONE 2 QA', '1:1', 2040, 2440],
  ['teleport', 'STONE 3 QA', '1:1', 2865, 2835],
  ['teleport', 'WORKBENCH QA', '1:1', 2195, 2535],
  ['teleport', 'MIRE MART QA', '1:0', 2400, 1200],
  ['teleport', 'LOOT QA', '1:0', 2630, 1008],
  ['teleport', 'FIGHT QA', '1:0', 2244, 1248],
], 'location controls only call the guarded local preview bridge with authored QA spots');
buttons.get('POOL QA').click();
assert.deepEqual(calls.at(-1), ['teleport', 'POOL QA', '1:1', 2884, 2488], 'the water test spot places the player well outside the authored dry bank');
for (const name of ['STEP W', 'STEP E', 'STEP N', 'STEP S']) buttons.get(name).click();
assert.deepEqual(calls.filter(call => call[0] === 'step').slice(0, 4), [
  ['step', 'STEP W', -1, 0, .65], ['step', 'STEP E', 1, 0, .65],
  ['step', 'STEP N', 0, -1, .65], ['step', 'STEP S', 0, 1, .65],
], 'cardinal QA controls request visible but bounded screen-input holds');
buttons.get('WORLD N STEP').click();
const worldNorth = calls.filter(call => call[0] === 'step').at(-1);
assert.equal(worldNorth[1], 'WORLD N STEP');
assert.ok(Math.abs(worldNorth[2] - 1 / Math.sqrt(1.25)) < 1e-9 && Math.abs(worldNorth[3] + .5 / Math.sqrt(1.25)) < 1e-9, 'world-north input is projected through the selected camera adapter');

buttons.get('ROUTE QA').click();
assert.deepEqual({ ...api.currentInput() }, { x: 0, y: -1 }, 'route starts with its first visible simulated hold');
api.advance(.65, { active: true });
assert.deepEqual({ ...api.currentInput() }, { x: 1, y: 0 }, 'route advances only after the prior hold consumes simulation time');
api.advance(.65, { active: true });
assert.deepEqual({ ...api.currentInput() }, { x: 0, y: 1 }, 'route retains explicit order');
api.advance(.65, { active: true });
assert.equal(api.currentInput(), null, 'route sequence finishes without leaving movement input active');
buttons.get('STEP N').click();
api.advance(.05, { active: false });
assert.equal(api.currentInput(), null, 'death/disconnect/inactive simulation clears queued input');
buttons.get('STOP').click();
assert.deepEqual(calls.at(-1), ['stop', 'manual stop'], 'STOP delegates to the preview-only bridge');
buttons.get('RETURN QA').click();
assert.deepEqual({ ...api.currentInput() }, { x: -.94, y: .34 }, 'return sequence starts with movement toward camp');
api.advance(.05, { active: true, inCamp: true });
assert.equal(api.currentInput(), null, 'return QA clears its remaining route as soon as the player reaches camp');

rafCallback();
assert.match(status.textContent, /QA · .*1:0 \(12,34\).*collision CLEAR.*target camp:0.*mobs 2.*nearest 50 crawler 58hp.*grace 375ms \/ suppressed 4.*ACTIVE/, 'diagnostics read current preview state, resource and nearest enemy state, and Survival hurt-grace counters');
assert.match(status.textContent, /work 2/, 'diagnostics expose hit progress for the selected resource so local mining input can be verified');
assert.match(source, /button\('RETURN QA',[\s\S]*x: -\.94, y: \.34, duration: 1\.25/,'the local-only return route uses sustained directional input instead of teleporting the player home');

let quietPanels=0;const quietSandbox={...sandbox,window:{...sandbox.window,AW_SHOW_SUCCESSOR_QA_CONTROLS:false},document:{createElement(){throw new Error('visual-only route must not build diagnostic UI')},body:{appendChild(){quietPanels++}}},requestAnimationFrame(){throw new Error('visual-only route must not start diagnostic UI updates')}};
vm.createContext(quietSandbox);vm.runInContext(source,quietSandbox);
assert.ok(quietSandbox.window.ABYSSAL_PREVIEW_QA_V1,'visual-only mode keeps the guarded QA API available for normal preview operation');
assert.equal(quietPanels,0,'visual-only mode does not mount the developer overlay');
console.log('PASS successor QA harness is flag-gated, separate from renderer, bounded, and local-preview-only');
