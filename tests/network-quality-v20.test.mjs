import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../network-quality-v20.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v17.html',import.meta.url),'utf8');

const sandbox={console,window:null};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'network-quality-v20.js'});

const api=sandbox.ABYSSAL_NETWORK_QUALITY_V20;
assert.ok(api,'V20 network quality API must be exposed');
assert.equal(api.version,20,'V20 API version mismatch');

assert.equal(api.median([100,300,200]),200,'median must ignore ordering');
assert.equal(api.median([100,200,300,400]),250,'even median must average middle values');
assert.equal(api.percentile([120,130,140,150,600],.9),600,'p90 must retain serious spikes in short windows');
assert.equal(api.recentLoss([true,true,false,true]),.25,'recent loss must be calculated from the recent outcome window');

const stable=api.summarize([118,122,125,121,127,124],[true,true,true,true,true,true]);
assert.equal(api.qualityFor(stable,true)[0],'良好','stable low latency must be good');
assert.equal(api.intervalFor(stable),.14,'good relay must keep the existing fastest movement interval');

const oneSpike=api.summarize([120,125,130,581,128,126,124,127,123,129],Array(10).fill(true));
assert.ok(oneSpike.median<140,'one spike must not replace the stable RTT with 581ms');
assert.equal(oneSpike.latest,129,'latest RTT must remain independently observable');
assert.ok(oneSpike.jitter>90,'the spike must remain visible in jitter');
assert.equal(api.qualityFor(oneSpike,true)[0],'一般','a major spike must degrade quality instead of being hidden as good');
assert.equal(api.intervalFor(oneSpike),.20,'a major spike must move to the middle send interval');

const sustainedHigh=api.summarize([480,510,581,540,525],[true,true,true,true,true]);
assert.equal(api.qualityFor(sustainedHigh,true)[0],'较差','sustained high RTT must be poor');
assert.equal(api.intervalFor(sustainedHigh),.32,'poor network must use the existing conservative interval');

const lossy=api.summarize([140,145,150,148,152],[true,false,true,false,true]);
assert.equal(api.qualityFor(lossy,true)[0],'较差','40% recent ping loss must be poor even with low RTT');
assert.equal(api.intervalFor(lossy),.32,'lossy network must use the conservative interval');

assert.deepEqual(Array.from(api.qualityFor(stable,false)),['重新连接','reconnect'],'disconnected relay must report reconnecting');
assert.equal(api.intervalFor(api.summarize([120,125],[])),.20,'insufficient samples must start conservatively in the middle interval');
assert.ok(Math.abs(api.hzForInterval(.14)-7.142857)<.001,'fastest interval must remain about 7.1Hz');
assert.ok(Math.abs(api.hzForInterval(.32)-3.125)<.001,'slow interval must remain about 3.1Hz');

const relayIndex=boot.indexOf("'network-relay-v16.js'");
const qualityIndex=boot.indexOf("'network-quality-v20.js'");
const motionIndex=boot.indexOf("'smooth-motion-v18.js'");
assert.ok(relayIndex>=0&&qualityIndex>relayIndex,'V20 must load after the relay it observes');
assert.ok(motionIndex>qualityIndex,'V20 quality policy must be installed before motion wraps the update loop');
assert.ok(boot.includes("const VER='17h'"),'V17h cache key must be present');

for(const forbidden of[
  'new WebSocket(',
  'locationHint',
  'RELAY.url=',
  "event:'move'",
  "event:'attack'",
  "event:'mobs'"
]){
  assert.equal(source.includes(forbidden),false,`V20 diagnostics must not alter transport/payload semantics: ${forbidden}`);
}
for(const required of[
  '中位 RTT',
  'P90 RTT',
  '近期 Ping 丢失',
  '移动同步档位',
  'disconnectTransitions',
  'qualityFor(currentStats(),connectedForQuality())',
  'return intervalFor(currentStats())'
]){
  assert.ok(source.includes(required),`V20 invariant missing: ${required}`);
}

console.log(JSON.stringify({
  ok:true,
  stableQuality:'good',
  singleSpike:'degraded-not-hidden',
  sustainedHigh:'poor',
  recentLoss:'poor',
  disconnected:'reconnecting',
  maxMovementRate:'unchanged-7.1Hz',
  protocolPayload:'unchanged',
  bootOrder:'pass'
}));
