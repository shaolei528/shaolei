import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const hitSource=read('modules/combat/hit-feedback.js');
const weaponSource=read('modules/combat/weapon-presentation-v1.js');
const feelSource=read('modules/combat/playable-feel-v1.js');
const audioSource=read('modules/audio/playable-feel-audio-v1.js');
const playerCombat=read('modules/combat/player-combat.js');
const perfSource=read('modules/core/dev-performance-v1.js');

for(const source of [hitSource,weaponSource,feelSource]){
  for(const forbidden of ['zoneCh.send','new WebSocket(','RELAY_URL','saveLocal(','STORAGE_KEY','localStorage.']){
    assert.equal(source.includes(forbidden),false,`presentation layer must stay local-only: ${forbidden}`);
  }
  assert.equal(source.includes('setInterval('),false,'combat presentation must not add a scheduler');
  assert.equal(source.includes('requestAnimationFrame('),false,'combat presentation must not add an RAF root');
}
for(const invariant of [
  'attackCd=inventory.knife?.32:.48',
  'attackFlash=.15',
  'range:inventory.knife?80:62',
  'damage:inventory.knife?22:11',
  'if(diff<1.0)'
])assert.ok(playerCombat.includes(invariant),`gameplay invariant changed: ${invariant}`);
assert.ok(playerCombat.includes("attackBtn.addEventListener('pointerdown',()=>attack())"),'mobile attack must still dynamically resolve the current attack wrapper');
assert.ok(feelSource.includes('TRUE HIT-STOP IS DEFERRED'),'true simulation hit-stop must remain explicitly deferred');
assert.equal(feelSource.includes('baseUpdate('),false,'presentation layer must not pause/own simulation updates');
assert.ok(perfSource.includes('location.search'),'normal URL dev instrumentation gate must remain present');

{
  const sandbox={
    console,window:null,SESSION_ID:'self',inventory:{knife:true},attackFlash:.15,
    sx:x=>x,sy:y=>y,inCamp(){return false;},
    directionRow(){return 2;},onAttack(){},drawPlayer(){},
    ctx:{imageSmoothingEnabled:true,globalAlpha:1,fillStyle:'',save(){},restore(){},fillRect(){}}
  };
  sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(weaponSource,sandbox,{filename:'weapon-presentation-v1.js'});
  const api=sandbox.ABYSSAL_WEAPON_PRESENTATION_V1;
  assert.equal(api.attackDuration,.15);
  assert.ok(api.swingOffset(.12)<-.5,'early phase must visibly anticipate');
  assert.ok(api.swingOffset(.50)>.35,'mid phase must snap through the slash');
  assert.ok(api.swingOffset(.92)>0&&api.swingOffset(.92)<.7,'late phase must recover without lingering at full extension');
  assert.ok(api.swingEmphasis(.5)>api.swingEmphasis(.1),'contact window must read stronger than early anticipation');
  const stateBefore=sandbox.attackFlash;
  for(let i=0;i<1000;i++)api.poseFor({id:'self',x:100,y:100,dir:(i%8)*Math.PI/4,attack:0},true);
  assert.equal(sandbox.attackFlash,stateBefore,'1000 presentation samples must not mutate canonical attackFlash');
}

{
  let now=1000;
  const emitted=[];
  class CustomEventMock{constructor(type,init={}){this.type=type;this.detail=init.detail;}}
  const sandbox={
    console,window:null,globalThis:null,CustomEvent:CustomEventMock,
    performance:{now:()=>now},SESSION_ID:'self',inventory:{knife:true},attackCd:0,attackFlash:0,
    mobs:[{id:'crawler-1',kind:'crawler',x:40,y:50,hp:30}],me:{hp:100},
    attack(){sandbox.attackCd=.32;sandbox.attackFlash=.15;},
    handleMobAttack(){sandbox.mobs[0].hp=Math.max(0,sandbox.mobs[0].hp-10);},
    onMobs(){},onMobHit(){sandbox.me.hp-=4;},onAttack(){},
    drawLighting(){},canvas:{style:{translate:''}},
    ABYSSAL_SHELL_V1:{getSettings(){return{reducedMotion:false};}},
    dispatchEvent(event){emitted.push(event);return true;}
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);vm.runInContext(feelSource,sandbox,{filename:'playable-feel-v1.js'});

  for(let i=0;i<1000;i++){
    sandbox.attackCd=0;sandbox.attackFlash=0;sandbox.attack();
  }
  assert.equal(emitted.filter(event=>event.type==='abyssal:player-swing').length,1000,'1000 accepted swings must emit exactly one swing semantic each');
  assert.equal(emitted.filter(event=>event.type==='abyssal:combat-hit').length,0,'swing/miss path must not fake a hit semantic');

  for(let i=0;i<500;i++){
    sandbox.mobs[0].hp=i%5===4?5:30;
    sandbox.handleMobAttack({id:'self'});
  }
  const hits=emitted.filter(event=>event.type==='abyssal:combat-hit');
  const deaths=emitted.filter(event=>event.type==='abyssal:mob-death');
  assert.equal(hits.length,500,'500 confirmed damage events must emit 500 impact semantics');
  assert.equal(deaths.length,100,'crawler lethal transitions must emit one death semantic each');
  assert.ok(hits.some(event=>event.detail.kind==='crawler'&&event.detail.killed===false),'crawler nonlethal hit semantic missing');
  assert.ok(deaths.every(event=>event.detail.kind==='crawler'&&event.detail.killed===true),'death semantic must preserve crawler kind and lethal flag');
  assert.ok(sandbox.ABYSSAL_PLAYABLE_FEEL_V1.shakeStrength<=3.6,'local impact kick must remain tightly capped');

  for(let i=0;i<200;i++){sandbox.me.hp=100;sandbox.onMobHit({target:'self'});}
  assert.equal(emitted.filter(event=>event.type==='abyssal:player-hurt').length,200,'repeated hurt must emit presentation semantics without dropping gameplay calls');
  sandbox.drawLighting(360,600);
  assert.notEqual(sandbox.canvas.style.translate,'','active hurt/impact feedback should produce a short presentation-only canvas translation');
  now+=500;sandbox.drawLighting(360,600);
  assert.equal(sandbox.canvas.style.translate,'','screen kick must always clear after its bounded envelope');
  assert.equal(sandbox.ABYSSAL_PLAYABLE_FEEL_V1.shakeStrength,0,'shake state must not remain stuck after expiry');
}

{
  let now=2000,vibrations=0,fillRects=0,strokeRects=0;
  const sandbox={
    console,window:null,globalThis:null,performance:{now:()=>now},SESSION_ID:'self',
    navigator:{vibrate(){vibrations++;return true;}},
    mobs:[{id:'crawler-1',kind:'crawler',x:60,y:70,hp:30}],me:{hp:100},attackFlash:.15,
    handleMobAttack(){sandbox.mobs[0].hp=Math.max(0,sandbox.mobs[0].hp-10);},
    onMobs(){},onMobHit(){sandbox.me.hp-=4;},onAttack(){},
    drawMobs(){},drawPlayer(){},drawLighting(){},sx:x=>x,sy:y=>y,
    ctx:{
      imageSmoothingEnabled:true,globalAlpha:1,fillStyle:'',strokeStyle:'',lineWidth:1,
      save(){},restore(){},beginPath(){},stroke(){},arc(){},
      fillRect(){fillRects++;},strokeRect(){strokeRects++;}
    }
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);vm.runInContext(hitSource,sandbox,{filename:'hit-feedback.js'});
  for(let i=0;i<500;i++){
    sandbox.mobs[0].hp=i%5===4?5:30;
    now+=90;sandbox.handleMobAttack({id:'self'});
  }
  assert.ok(sandbox.ABYSSAL_HIT_FEEDBACK.sparks.length<=12,'hit spark state must remain bounded under 500 impacts');
  assert.ok(sandbox.ABYSSAL_HIT_FEEDBACK.impacts.length<=16,'impact pulse state must remain bounded under 500 impacts');
  assert.ok(sandbox.ABYSSAL_HIT_FEEDBACK.impacts.some(p=>p.killed),'lethal impacts need a distinct presentation pulse');
  sandbox.drawMobs(360,600);
  assert.ok(fillRects>0,'confirmed hits must render impact pixels beyond the swing-only presentation');
  now+=500;sandbox.drawMobs(360,600);
  assert.equal(sandbox.ABYSSAL_HIT_FEEDBACK.sparks.length,0,'expired hit sparks must be released');
  assert.equal(sandbox.ABYSSAL_HIT_FEEDBACK.impacts.length,0,'expired impact pulses must be released');

  for(let i=0;i<200;i++){sandbox.me.hp=100;now+=10;sandbox.onMobHit({});}
  const fillBefore=fillRects,strokeBefore=strokeRects;
  sandbox.drawLighting(360,600);
  assert.ok(fillRects>fillBefore,'player hurt must add a brief low-alpha screen pulse, not only a number change');
  assert.ok(strokeRects>strokeBefore,'player hurt must retain the short damage border');
  const afterActive={fillRects,strokeRects};
  now+=300;sandbox.drawLighting(360,600);
  assert.deepEqual({fillRects,strokeRects},afterActive,'hurt presentation must expire and stop drawing');
  assert.ok(vibrations>0,'local confirmed impacts may retain short haptic feedback');
}

{
  let now=1000,constructors=0,sources=0,sourceStops=0,oscillators=0,oscillatorStops=0,disconnects=0;
  const docHandlers=new Map(),winHandlers=new Map();
  const param=value=>({value,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}});
  const node=()=>({connect(){},disconnect(){disconnects++;}});
  class FakeAudioContext{
    constructor(){constructors++;this.sampleRate=8000;this.currentTime=0;this.state='suspended';this.destination={};}
    createGain(){return{...node(),gain:param(0)};}
    createBuffer(_channels,length){const data=new Float32Array(length);return{getChannelData(){return data;}};}
    createBufferSource(){sources++;return{...node(),buffer:null,loop:false,onended:null,start(){},stop(){sourceStops++;this.onended?.();}};}
    createBiquadFilter(){return{...node(),type:'lowpass',frequency:param(0),Q:param(0)};}
    createStereoPanner(){return{...node(),pan:param(0)};}
    createOscillator(){oscillators++;return{...node(),type:'sine',frequency:param(0),onended:null,start(){},stop(){oscillatorStops++;this.onended?.();}};}
    resume(){this.state='running';return Promise.resolve();}
    suspend(){this.state='suspended';return Promise.resolve();}
  }
  const sandbox={
    console,AudioContext:FakeAudioContext,performance:{now:()=>now},Math,started:true,
    me:{x:0,y:0},CAMP:{x:0,y:0,r:100},mobs:[],inCamp(){return true;},
    setInterval(){return 1;},
    document:{hidden:false,addEventListener(type,fn){docHandlers.set(type,fn);}},
    addEventListener(type,fn){winHandlers.set(type,fn);},window:null,globalThis:null
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);vm.runInContext(audioSource,sandbox,{filename:'playable-feel-audio-v1.js'});
  await sandbox.ABYSSAL_AUDIO_V1.unlock({isTrusted:true});
  for(let i=0;i<1000;i++)sandbox.ABYSSAL_AUDIO_V1.playSwing({knife:true});
  for(let i=0;i<500;i++){now+=60;assert.equal(sandbox.ABYSSAL_AUDIO_V1.playImpact({local:true,kind:'crawler',killed:i%5===4}),true);}
  for(let i=0;i<200;i++){now+=100;sandbox.ABYSSAL_AUDIO_V1.playHurt();}
  for(let i=0;i<100;i++){now+=10;sandbox.ABYSSAL_AUDIO_V1.playCrawler({distance:90,pan:(i%3-1)*.4});}
  assert.equal(constructors,1,'combat soak must retain exactly one AudioContext');
  assert.equal(oscillators,1800,'expected one transient tone per swing/impact/hurt/crawler event');
  assert.equal(oscillatorStops,1800,'every transient combat oscillator must stop');
  assert.equal(sources,1802,'expected 1800 transient noise sources plus two persistent ambience loops');
  assert.equal(sourceStops,1800,'every transient combat noise source must stop before ambience teardown');
  assert.ok(disconnects>=1800*5,'transient node chains must disconnect rather than accumulate');
  assert.equal(sandbox.ABYSSAL_AUDIO_V1.getMixerState().ambienceActive,true);
  sandbox.ABYSSAL_AUDIO_V1.stopAmbience();
  assert.equal(sourceStops,1802,'ambience teardown must stop exactly the two persistent loops');
  assert.equal(sandbox.ABYSSAL_AUDIO_V1.getMixerState().ambienceActive,false);
}

console.log(JSON.stringify({
  ok:true,
  presentation:'swing-readability+impact-pulse+death-semantic+hurt-pulse+bounded-kick',
  missVsHit:'swing-only vs swing+impact+haptic+kick',
  trueHitStop:'DEFER TRUE HIT-STOP',
  swingSoak:1000,
  impactSoak:500,
  hurtSoak:200,
  audioContext:'single',
  gameplayAuthority:'unchanged',
  mobileAttack:'dynamic-wrapper-contract-preserved'
}));
