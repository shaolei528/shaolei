(()=>{
  'use strict';
  if(window.ABYSSAL_TURN_V15)return;
  const Native=window.RTCPeerConnection||window.webkitRTCPeerConnection;
  if(!Native){window.ABYSSAL_TURN_V15={version:15,installed:false,error:'RTCPeerConnection unavailable'};return;}

  const auth={username:'openrelayproject',credential:'openrelayproject'};
  const extra=[
    {urls:'stun:stun.relay.metered.ca:80'},
    {urls:'turn:openrelay.metered.ca:80',...auth},
    {urls:'turn:openrelay.metered.ca:443',...auth},
    {urls:'turn:openrelay.metered.ca:443?transport=tcp',...auth},
    {urls:'turns:openrelay.metered.ca:443?transport=tcp',...auth}
  ];

  function key(server){
    const urls=Array.isArray(server?.urls)?server.urls.join(','):String(server?.urls||server?.url||'');
    return urls+'|'+String(server?.username||'');
  }
  function merge(config){
    const next={...(config||{})};
    const current=Array.isArray(next.iceServers)?next.iceServers:[];
    const seen=new Set();
    next.iceServers=[...current,...extra].filter(server=>{
      const k=key(server);if(!k||seen.has(k))return false;seen.add(k);return true;
    });
    if(!next.iceTransportPolicy)next.iceTransportPolicy='all';
    return next;
  }

  function PatchedRTCPeerConnection(config,constraints){
    return new Native(merge(config),constraints);
  }
  try{Object.setPrototypeOf(PatchedRTCPeerConnection,Native);}catch{}
  PatchedRTCPeerConnection.prototype=Native.prototype;
  try{if(Native.generateCertificate)PatchedRTCPeerConnection.generateCertificate=Native.generateCertificate.bind(Native);}catch{}

  window.RTCPeerConnection=PatchedRTCPeerConnection;
  if(window.webkitRTCPeerConnection===Native)window.webkitRTCPeerConnection=PatchedRTCPeerConnection;
  window.ABYSSAL_TURN_V15={version:15,installed:true,iceServers:extra.map(s=>s.urls)};
})();
