globalThis.WebSocket = { OPEN: 1 };

const { GameWorld } = await import('./src/index.js');

class FakeWS {
  constructor(name) { this.name = name; this.readyState = 1; this.sent = []; this.attachment = null; }
  send(data) { this.sent.push(JSON.parse(data)); }
  serializeAttachment(value) { this.attachment = structuredClone(value); }
  deserializeAttachment() { return structuredClone(this.attachment); }
  close() { this.readyState = 3; }
}

const a = new FakeWS('a');
const b = new FakeWS('b');
const sockets = [a, b];
const worldStorage = new Map();
const storage = {
  async get(key) { return structuredClone(worldStorage.get(key)); },
  async put(key, value) { worldStorage.set(key, structuredClone(value)); }
};
const ctx = { getWebSockets: () => sockets, storage };
const world = new GameWorld(ctx, {});
for (const ws of sockets) ws.serializeAttachment({sessionId:'',name:'Wanderer',subscriptions:[],presence:{},rateWindowAt:0,rateCount:0});

const send = (ws, packet) => world.webSocketMessage(ws, JSON.stringify(packet));
const GLOBAL = 'abyssal-wake-public-v1:global';
const ZONE = 'abyssal-wake-public-v1:zone:1:1';

await send(a,{type:'hello',sessionId:'a',name:'Alice',protocol:'abyssal-relay-v1'});
await send(b,{type:'hello',sessionId:'b',name:'Bob',protocol:'abyssal-relay-v1'});
await send(a,{type:'subscribe',channel:GLOBAL});
await send(b,{type:'subscribe',channel:GLOBAL});
await send(a,{type:'track',channel:GLOBAL,meta:{name:'Mallory',zone:'1:1'}});
await send(b,{type:'track',channel:GLOBAL,meta:{name:'Bob',zone:'1:1'}});

const presence = a.sent.filter(x=>x.type==='presence_snapshot'&&x.channel===GLOBAL).at(-1);
if (!presence || presence.entries.length !== 2) throw new Error('global presence != 2');
const alicePresence = presence.entries.find(x=>x.id==='a');
if (!alicePresence || alicePresence.name!=='Alice') throw new Error('presence name was not server-canonicalized');

await send(a,{type:'broadcast',channel:GLOBAL,event:'chat',payload:{id:'b',name:'Bob',text:'hello'}});
const chat = b.sent.filter(x=>x.type==='broadcast'&&x.event==='chat'&&x.payload?.text==='hello').at(-1);
if (!chat) throw new Error('chat relay failed');
if (chat.from!=='a' || chat.payload.id!=='a' || chat.payload.name!=='Alice') throw new Error('chat identity spoof was not rejected');

await send(a,{type:'subscribe',channel:ZONE});
await send(b,{type:'subscribe',channel:ZONE});
await send(a,{type:'track',channel:ZONE,meta:{name:'Mallory',x:2400,y:2400}});
await send(b,{type:'track',channel:ZONE,meta:{name:'Bob',x:2410,y:2400}});

await send(a,{type:'broadcast',channel:ZONE,event:'move',payload:{id:'b',name:'Bob',zone:'9:9',x:2420,y:2400,seq:1}});
const move = b.sent.filter(x=>x.type==='broadcast'&&x.event==='move'&&x.payload?.x===2420).at(-1);
if (!move) throw new Error('move relay failed');
if (move.from!=='a' || move.payload.id!=='a' || move.payload.name!=='Alice') throw new Error('move identity spoof was not rejected');
if (move.payload.zone!=='1:1' || move.payload.y!==2400 || move.payload.seq!==1) throw new Error('move canonicalization damaged gameplay fields');

await send(a,{type:'broadcast',channel:ZONE,event:'attack',payload:{id:'b',name:'Bob',zone:'0:0',x:2420,y:2400,dir:0,range:62,damage:11}});
const attack = b.sent.filter(x=>x.type==='broadcast'&&x.event==='attack'&&x.payload?.damage===11).at(-1);
if (!attack) throw new Error('attack relay failed');
if (attack.from!=='a' || attack.payload.id!=='a' || attack.payload.name!=='Alice' || attack.payload.zone!=='1:1') throw new Error('attack identity/zone spoof was not rejected');
if (attack.payload.range!==62 || attack.payload.damage!==11) throw new Error('attack canonicalization damaged gameplay fields');

const hitCooldownUntil=Date.now()+900;
await send(a,{type:'broadcast',channel:ZONE,event:'mob_hit',payload:{target:'a',damage:4,sanity:1,kind:'crawler',mobId:'m-zone-test',hitCdUntil:hitCooldownUntil}});
const mobHit = b.sent.filter(x=>x.type==='broadcast'&&x.channel===ZONE&&x.event==='mob_hit').at(-1);
if (!mobHit || mobHit.payload?.target!=='a' || mobHit.payload?.mobId!=='m-zone-test' || mobHit.payload?.hitCdUntil!==hitCooldownUntil) throw new Error('mob cooldown state was not relayed intact');
if (a.sent.some(x=>x.type==='broadcast'&&x.channel===ZONE&&x.event==='mob_hit')) throw new Error('mob_hit was echoed to its sender');

await send(a,{type:'broadcast',channel:ZONE,event:'custom_probe',payload:{id:'legacy-id',value:7}});
const custom = b.sent.filter(x=>x.type==='broadcast'&&x.event==='custom_probe').at(-1);
if (!custom || custom.payload?.id!=='legacy-id' || custom.payload?.value!==7) throw new Error('unknown event payload compatibility was broken');

const campWorldPayload={version:1,domain:'farm',zone:'1:1',sessionId:'a',epoch:'worker-test-epoch',seq:1,state:{version:1,plants:[]}};
await send(a,{type:'broadcast',channel:ZONE,event:'camp_world_v1',payload:campWorldPayload});
const campWorld=b.sent.filter(x=>x.type==='broadcast'&&x.channel===ZONE&&x.event==='camp_world_v1').at(-1);
if (!campWorld || campWorld.from!=='a' || campWorld.payload?.sessionId!=='a' || campWorld.payload?.domain!=='farm') throw new Error('camp world snapshot relay failed');
const ownerSnapshots=[
  {version:1,domain:'farm',zone:'1:1',sessionId:'a',epoch:'worker-test-epoch',seq:2,state:{version:1,plants:[{plotId:'bed-a',cropId:'saltleaf',plantedAt:10}]}},
  {version:1,domain:'livestock',zone:'1:1',sessionId:'a',epoch:'worker-test-epoch',seq:1,state:{version:1,nextId:2,animals:[{id:'chicken-a',species:'chicken'}]}},
  {version:1,domain:'building',zone:'1:1',sessionId:'a',epoch:'worker-test-epoch',seq:1,state:{version:1,nextId:2,structures:[{id:'barrier-a',zone:'1:1'}]}}
];
for(const payload of ownerSnapshots)await send(a,{type:'broadcast',channel:ZONE,event:'camp_world_v1',payload});
const savedFarm=await storage.get('camp-world:v1:1:1:farm');
if(savedFarm?.state?.plants?.[0]?.plotId!=='bed-a'||savedFarm?.revision!==2)throw new Error('zone leader farm snapshot was not checkpointed');
const followerSnapshot={...ownerSnapshots[0],sessionId:'b',seq:99,state:{version:1,plants:[{plotId:'attacker-bed',cropId:'saltleaf',plantedAt:20}]}};
await send(b,{type:'broadcast',channel:ZONE,event:'camp_world_v1',payload:followerSnapshot});
if((await storage.get('camp-world:v1:1:1:farm'))?.state?.plants?.[0]?.plotId!=='bed-a')throw new Error('a nonleader overwrote the durable zone snapshot');
await send(a,{type:'broadcast',channel:ZONE,event:'camp_world_request_v1',payload:{version:1,zone:'1:1',sessionId:'a'}});
const campWorldRequest=b.sent.filter(x=>x.type==='broadcast'&&x.channel===ZONE&&x.event==='camp_world_request_v1').at(-1);
if (!campWorldRequest || campWorldRequest.from!=='a' || campWorldRequest.payload?.sessionId!=='a') throw new Error('camp world join request relay failed');

const reserved=new FakeWS('reserved');
reserved.serializeAttachment({sessionId:'',name:'Wanderer',subscriptions:[],presence:{},rateWindowAt:0,rateCount:0});
sockets.push(reserved);
await send(reserved,{type:'hello',sessionId:'abyssal-relay',name:'Reserved'});
if(!reserved.sent.some(packet=>packet.type==='error'&&packet.code==='BAD_SESSION'))throw new Error('a client claimed the durable relay snapshot identity');

a.readyState=3;b.readyState=3;reserved.readyState=3;
const c=new FakeWS('c');
c.serializeAttachment({sessionId:'',name:'Wanderer',subscriptions:[],presence:{},rateWindowAt:0,rateCount:0});
sockets.push(c);
const restartedWorld=new GameWorld(ctx,{});
await restartedWorld.webSocketMessage(c,JSON.stringify({type:'hello',sessionId:'c',name:'Carol'}));
await restartedWorld.webSocketMessage(c,JSON.stringify({type:'subscribe',channel:ZONE}));
await restartedWorld.webSocketMessage(c,JSON.stringify({type:'track',channel:ZONE,meta:{x:2420,y:2400}}));
const restored=c.sent.filter(packet=>packet.type==='broadcast'&&packet.event==='camp_world_v1'&&packet.from==='abyssal-relay');
if(restored.length!==3)throw new Error(`a returning room leader received ${restored.length} of 3 durable domain snapshots`);
if(restored.find(packet=>packet.payload.domain==='farm')?.payload?.state?.plants?.[0]?.plotId!=='bed-a')throw new Error('the farm snapshot was not restored after every player disconnected');
if(restored.find(packet=>packet.payload.domain==='livestock')?.payload?.state?.animals?.[0]?.id!=='chicken-a')throw new Error('the livestock snapshot was not restored after every player disconnected');
if(restored.find(packet=>packet.payload.domain==='building')?.payload?.state?.structures?.[0]?.id!=='barrier-a')throw new Error('the building snapshot was not restored after every player disconnected');

await restartedWorld.webSocketMessage(c,JSON.stringify({type:'ping',id:'p1'}));
if (!c.sent.some(x=>x.type==='pong'&&x.id==='p1')) throw new Error('ping failed');

console.log('cloudflare relay protocol test passed: server-canonical identity + compatibility + durable camp snapshots');
