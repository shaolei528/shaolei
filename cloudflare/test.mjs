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
await send(a,{type:'track',channel:GLOBAL,meta:{name:'Alice',zone:'1:1'}});
await send(b,{type:'track',channel:GLOBAL,meta:{name:'Bob',zone:'1:1'}});

const presence = a.sent.filter(x=>x.type==='presence_snapshot'&&x.channel===GLOBAL).at(-1);
if (!presence || presence.entries.length !== 2) throw new Error('global presence != 2');

await send(a,{type:'broadcast',channel:GLOBAL,event:'chat',payload:{text:'hello'}});
if (!b.sent.some(x=>x.type==='broadcast'&&x.event==='chat'&&x.payload?.text==='hello')) throw new Error('chat relay failed');

await send(a,{type:'subscribe',channel:ZONE});
await send(b,{type:'subscribe',channel:ZONE});
await send(a,{type:'track',channel:ZONE,meta:{name:'Alice',x:2400,y:2400}});
await send(b,{type:'track',channel:ZONE,meta:{name:'Bob',x:2410,y:2400}});
await send(a,{type:'broadcast',channel:ZONE,event:'move',payload:{id:'a',x:2420,y:2400,seq:1}});
if (!b.sent.some(x=>x.type==='broadcast'&&x.event==='move'&&x.payload?.x===2420)) throw new Error('move relay failed');

await send(a,{type:'ping',id:'p1'});
if (!a.sent.some(x=>x.type==='pong'&&x.id==='p1')) throw new Error('ping failed');

console.log('cloudflare relay protocol test passed');
