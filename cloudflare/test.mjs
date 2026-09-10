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
const ctx = { getWebSockets: () => sockets };
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

await send(a,{type:'broadcast',channel:ZONE,event:'custom_probe',payload:{id:'legacy-id',value:7}});
const custom = b.sent.filter(x=>x.type==='broadcast'&&x.event==='custom_probe').at(-1);
if (!custom || custom.payload?.id!=='legacy-id' || custom.payload?.value!==7) throw new Error('unknown event payload compatibility was broken');

await send(a,{type:'ping',id:'p1'});
if (!a.sent.some(x=>x.type==='pong'&&x.id==='p1')) throw new Error('ping failed');

console.log('cloudflare relay protocol test passed: server-canonical identity + compatibility');
