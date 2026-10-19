(()=>{
  'use strict';
  if(globalThis.ABYSSAL_CAMP_WORLD_SYNC_V1?.version===1)return;

  const nextSequence={farm:0,livestock:0,building:0};
  const lastSequenceBySender=new Map();
  const publisherEpoch=(()=>{try{return crypto.randomUUID()}catch{return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}})();
  const farmEvents=['abyssal:crop-planted','abyssal:crop-harvested'];
  const livestockEvents=['abyssal:livestock-fed','abyssal:livestock-product-collected','abyssal:livestock-bred','abyssal:livestock-grown'];
  const buildingEvents=['abyssal:building-placed','abyssal:building-dismantled','abyssal:building-damaged'];

  function sessionId(){return typeof SESSION_ID==='string'?SESSION_ID:'';}
  function zoneKey(){return typeof currentZone==='string'?currentZone:'1:1';}
  function snapshotFor(domain,zone){
    if(domain==='farm')return zone==='1:1'?globalThis.ABYSSAL_FARMING_V1?.exportWorldSnapshot?.():null;
    if(domain==='livestock')return zone==='1:1'?globalThis.ABYSSAL_LIVESTOCK_V1?.exportWorldSnapshot?.():null;
    if(domain==='building')return globalThis.ABYSSAL_HOME_BUILDING_V1?.snapshotForZone?.(zone)||null;
    return null;
  }
  function applySnapshot(domain,zone,state){
    if(domain==='farm')return zone==='1:1'&&globalThis.ABYSSAL_FARMING_V1?.applyRemoteSnapshot?.(state)===true;
    if(domain==='livestock')return zone==='1:1'&&globalThis.ABYSSAL_LIVESTOCK_V1?.applyRemoteSnapshot?.(state)===true;
    if(domain==='building')return globalThis.ABYSSAL_HOME_BUILDING_V1?.applyRemoteZoneSnapshot?.(zone,state)===true;
    return false;
  }
  function sendDomain(domain,zone=zoneKey(),channel=zoneCh){
    const player=sessionId();
    if(!player||!zoneConnected||!channel||channel!==zoneCh||String(zone)!==zoneKey())return false;
    const state=snapshotFor(domain,String(zone));
    if(!state)return false;
    const seq=++nextSequence[domain];
    try{
      const result=channel.send({type:'broadcast',event:'camp_world_v1',payload:{version:1,domain,zone:String(zone),sessionId:player,epoch:publisherEpoch,seq,state}});
      Promise.resolve(result).catch(()=>{});
      return true;
    }catch{return false;}
  }
  function sendAll(channel=zoneCh){
    if(!channel||channel!==zoneCh||!zoneConnected)return false;
    let sent=false;
    for(const domain of ['farm','livestock','building'])sent=sendDomain(domain,zoneKey(),channel)||sent;
    return sent;
  }
  function requestZoneState(zone=zoneKey(),channel=zoneCh){
    if(!channel||channel!==zoneCh||!zoneConnected||String(zone)!==zoneKey())return false;
    try{
      const result=channel.send({type:'broadcast',event:'camp_world_request_v1',payload:{version:1,zone:String(zone),sessionId:sessionId()}});
      Promise.resolve(result).catch(()=>{});
      return true;
    }catch{return false;}
  }
  function respondToRequest(payload,meta={},channel=zoneCh){
    if(!zoneLeader||!channel||channel!==zoneCh||!zoneConnected||!payload||payload.version!==1||payload.zone!==zoneKey()||!meta.from||String(payload.sessionId||'')!==String(meta.from)||meta.from===sessionId())return false;
    return sendAll(channel);
  }
  function receive(payload,meta={}){
    if(!payload||payload.version!==1||!['farm','livestock','building'].includes(payload.domain))return false;
    const sender=String(meta.from||'');
    const epoch=String(payload.epoch||'');
    if(!sender||sender===sessionId()||String(payload.sessionId||'')!==sender||epoch.length<8||epoch.length>128||payload.zone!==zoneKey())return false;
    if(!zoneLeader&&String(zoneLeaderId||'')!==sender)return false;
    const seq=Math.floor(Number(payload.seq));
    if(!Number.isSafeInteger(seq)||seq<1)return false;
    const senderKey=`${sender}:${epoch}:${payload.domain}`;
    if(seq<=(lastSequenceBySender.get(senderKey)||0))return false;
    if(!applySnapshot(payload.domain,payload.zone,payload.state))return false;
    lastSequenceBySender.set(senderKey,seq);
    if(zoneLeader)sendDomain(payload.domain,payload.zone,zoneCh);
    return true;
  }
  function bind(type,domain){
    window.addEventListener(type,event=>{
      const detail=event?.detail||{};
      if(detail.playerId!==sessionId()||String(detail.zone||zoneKey())!==zoneKey())return;
      sendDomain(domain,zoneKey());
    });
  }
  for(const type of farmEvents)bind(type,'farm');
  for(const type of livestockEvents)bind(type,'livestock');
  for(const type of buildingEvents)bind(type,'building');

  globalThis.ABYSSAL_CAMP_WORLD_SYNC_V1=Object.freeze({version:1,sendDomain,sendAll,requestZoneState,respondToRequest,receive});
})();
