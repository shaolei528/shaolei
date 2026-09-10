window.ABYSSAL_CONFIG={
  RELAY_URL:'wss://abyssal-wake-relay.zuoranzhang.workers.dev/ws',
  SUPABASE_URL:'https://kqwlkleuguixkgutwuda.supabase.co',
  SUPABASE_KEY:'sb_publishable_F5j_5pFw4tTDvYLe-mxzXQ_S1l37mUJ',
  WORLD_CHANNEL:'abyssal-wake-public-v1'
};

(()=>{
  const path=String(location.pathname||'');
  const v17=/survival-v17(?:-live)?\.html$/i.test(path);
  if(!v17||!window.ABYSSAL_CONFIG.RELAY_URL||window.supabase?.createClient)return;
  const makeDeadChannel=()=>{
    const ch={
      on(){return ch;},
      subscribe(cb){queueMicrotask(()=>cb?.('CHANNEL_ERROR'));return ch;},
      async track(){return 'error';},
      async send(){return 'error';},
      presenceState(){return {};},
      async unsubscribe(){return 'ok';}
    };
    return ch;
  };
  window.supabase={
    __abyssalRelayShim:true,
    createClient:()=>({channel:makeDeadChannel,removeChannel:async()=>{}})
  };
})();
