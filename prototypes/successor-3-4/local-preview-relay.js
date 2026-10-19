(()=>{
  'use strict';
  if(window.AW_SUCCESSOR_PREVIEW!==true)return;
  globalCh=null;
  globalConnected=false;

  const channel={
    async send(){return'ok'},
    async track(){return null},
    presenceState(){return{}},
    on(){return this},
    subscribe(callback){callback?.('SUBSCRIBED');return this},
    close(){},
  };

  connectGlobal=async function(){
    globalCh=null;
    globalConnected=false;
    return null;
  };

  switchZone=async function(zone){
    const target=String(zone||currentZone);
    ++switchNonce;
    switching=true;
    currentZone=target;
    me.zone=target;
    seedZone(target);
    remotes.clear();
    lastSeqById.clear();
    recvSeq=0;
    missedSeq=0;
    zonePresenceIds.clear();
    zoneCh=channel;
    mobs=[];
    spawnMobs(target);
    zoneConnected=true;
    zoneLeader=true;
    zoneLeaderId=SESSION_ID;
    switching=false;
    updateUI();
    return channel;
  };

  window.ABYSSAL_LOCAL_PREVIEW_RELAY_V1=Object.freeze({
    version:1,
    localOnly:true,
    switchZone:zone=>switchZone(zone),
    isConnected:()=>zoneConnected,
  });
})();
