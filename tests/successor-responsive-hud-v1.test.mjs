import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../prototypes/successor-3-4/successor-renderer.js', import.meta.url), 'utf8');
const start = source.indexOf('  const infoApp=');
const end = source.indexOf("  parent.postMessage({type:'successor-ready'", start);
assert.ok(start >= 0 && end > start, 'successor renderer must contain the responsive information presentation block');

function element() {
  return {
    id: '', type: '', className: '', textContent: '', style: {}, attributes: {}, listeners: {}, children: [],
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, callback) { this.listeners[name] = callback; },
    appendChild(child) { this.children.push(child); },
  };
}

const panels = { app: element(), quest: element(), players: element() };
const appClasses = new Set(['successor-wide']);
panels.app.classList = {
  toggle(name) { if (appClasses.has(name)) { appClasses.delete(name); return false; } appClasses.add(name); return true; },
  contains(name) { return appClasses.has(name); },
};
const appendedStyles = [];
const document = {
  head: { appendChild(style) { appendedStyles.push(style); } },
  querySelector(selector) { return selector === '.app' ? panels.app : selector === '.quest' ? panels.quest : selector === '.players' ? panels.players : null; },
  createElement() { return element(); },
};
const game = element();
vm.runInNewContext(source.slice(start, end), { document, game, characterPortraitQa: false });

const toggle = game.children[0];
assert.equal(toggle.id, 'successorInfoToggle');
assert.equal(toggle.attributes['aria-expanded'], 'false');
assert.equal(toggle.attributes['aria-controls'], 'successorQuestInfo successorSurvivorInfo');
assert.equal(panels.quest.id, 'successorQuestInfo');
assert.equal(panels.players.id, 'successorSurvivorInfo');
assert.match(appendedStyles[0].textContent, /@media\(max-width:480px\)/);
assert.match(appendedStyles[0].textContent, /successor-info-open \.quest/);
assert.match(appendedStyles[0].textContent, /successor-info-open \.players/);

toggle.listeners.click();
assert.equal(panels.app.classList.contains('successor-info-open'), true);
assert.equal(toggle.attributes['aria-expanded'], 'true');
assert.equal(toggle.textContent, '收起信息');
toggle.listeners.click();
assert.equal(panels.app.classList.contains('successor-info-open'), false);
assert.equal(toggle.attributes['aria-expanded'], 'false');
assert.equal(toggle.textContent, '任务 / 队友');

console.log('PASS narrow-screen task/survivor disclosure toggles presentation only and exposes accessible state');
