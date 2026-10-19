import assert from 'node:assert/strict';
import fs from 'node:fs';

const renderer=fs.readFileSync(new URL('../prototypes/successor-3-4/successor-renderer.js',import.meta.url),'utf8');
const survival=fs.readFileSync(new URL('../modules/survival/status.js',import.meta.url),'utf8');
const lighting=renderer.slice(renderer.indexOf('function drawExplorationLighting'),renderer.indexOf('function drawMob('));
const anomaly=renderer.slice(renderer.indexOf('function drawShoreAnomaly'),renderer.indexOf('function drawStarterWaypoints'));
assert.ok(lighting.length>0,'successor renderer must provide its own exploration lighting pass');
assert.ok(lighting.includes('nightLevel()')&&lighting.includes('Number(me.sanity)')&&lighting.includes("currentZone==='1:1'"),
  'candidate light and horror overlays must react to V21 night and SAN outside SafeCamp');
assert.ok(lighting.includes('inventory.lantern?184:126')&&lighting.includes('adapter.project(Math.cos(Number(me.dir)'),
  'a held lantern must extend an isometric-facing player light cone');
assert.ok(lighting.includes('createRadialGradient')&&lighting.includes('vignette.addColorStop')&&lighting.includes("fillStyle='#713b7c'"),
  'field darkness must include a point-light pool, edge vignette, and low-SAN color contamination');
assert.ok(lighting.includes('const poiMood=blackmarshGroundQa&&currentZone===\'1:0\'')&&lighting.includes('(poiMood?.06:0)')&&lighting.includes('const overlay=Math.min(.18,')&&lighting.includes('Math.min(.045,')&&lighting.includes('darkness>.22||poiMood'),
  'low sanity and night may tint the MIRE MART view but must not black out readable town edges');
assert.ok(renderer.includes('drawExplorationLighting(lastTime);')&&renderer.indexOf('drawExplorationLighting(lastTime);')<renderer.indexOf('drawCampfireLight(lastTime);'),
  'field lighting must layer over darkness before the SafeCamp fire glow');
assert.ok(anomaly.includes('distance<72')&&anomaly.includes("const prompt='E 检查松动的铁盖'")&&!anomaly.includes('out.ellipse(p.x,p.y'),
  'the hidden service entrance must use a close-range interaction hint without a waypoint ring');
assert.ok(survival.includes('const night=nightLevel()')&&survival.includes('inventory.lantern'),
  'newer light radius may only present the existing V21 lantern survival state');
console.log(JSON.stringify({ok:true,systems:['night','sanity','isometric-player-light','lantern-radius-upgrade','vignette'],simulation:'unchanged'}));
