(()=>{
  'use strict';
  const enter=document.getElementById('enter');
  const name=document.getElementById('name');
  const setup=document.getElementById('setup');
  const gate=document.getElementById('gate');
  if(!enter||!gate)return;

  let booting=false, ready=false, requested=false, bootPromise=null;
  const originalLabel=enter.textContent;

  function status(text,isError=false){
    if(setup){
      setup.classList.remove('hidden');
      setup.textContent=text;
      setup.style.color=isError?'#efb1aa':'';
    }
  }
  function setBusy(on){
    enter.disabled=!!on;
    enter.textContent=on?'ENTERING MIREWOOD…':originalLabel;
    enter.style.opacity=on?'.78':'';
  }
  function load(src,timeout=6500){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      let done=false;
      const timer=setTimeout(()=>finish(false,new Error('timeout: '+src)),timeout);
      function finish(ok,err){
        if(done)return; done=true; clearTimeout(timer);
        s.onload=s.onerror=null;
        if(!ok){s.remove(); reject(err||new Error('load failed: '+src));}
        else resolve();
      }
      s.src=src; s.async=false;
      s.onload=()=>finish(true);
      s.onerror=()=>finish(false,new Error('load failed: '+src));
      document.head.appendChild(s);
    });
  }
  async function loadRealtime(){
    if(window.supabase?.createClient)return;
    const mirrors=[
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
      'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
    ];
    let last;
    for(const src of mirrors){
      try{
        status('Connecting the shared world…');
        await load(src,6500);
        if(window.supabase?.createClient)return;
      }catch(e){last=e;}
    }
    throw last||new Error('Realtime library unavailable');
  }
  async function loadGame(){
    if(ready)return;
    if(bootPromise)return bootPromise;
    bootPromise=(async()=>{
      booting=true;
      try{
        await loadRealtime();
        const files=['game-core.js?v=8','game-play.js?v=8','game-render.js?v=8','game-v7-patch.js?v=8','mobile-fixes.js?v=8'];
        for(const file of files){
          status('Loading Mirewood…');
          await load(file,6500);
        }
        ready=true; booting=false; setBusy(false);
        if(setup)setup.classList.add('hidden');
        if(requested){
          requested=false;
          enter.click();
        }
      }catch(err){
        console.error('[Abyssal boot]',err);
        booting=false; bootPromise=null; setBusy(false);
        status('Could not load the realtime world. Tap ENTER SAFE CAMP to retry.',true);
      }
    })();
    return bootPromise;
  }
  function requestEnter(e){
    if(ready)return;
    e?.preventDefault?.();
    if(requested&&booting)return;
    requested=true;
    setBusy(true);
    status('Preparing Safe Camp…');
    loadGame();
  }
  enter.addEventListener('pointerup',requestEnter,{passive:false});
  enter.addEventListener('click',requestEnter,{passive:false});
  name?.addEventListener('keydown',e=>{if(e.key==='Enter')requestEnter(e)});
  setTimeout(()=>loadGame(),180);
  window.addEventListener('pageshow',()=>{if(!ready&&!booting)loadGame()});
})();
