(()=>{
  'use strict';

  const enter = document.getElementById('enter');
  const nameInput = document.getElementById('name');
  const setup = document.getElementById('setup');
  const gate = document.getElementById('gate');

  if(!enter || !gate){
    console.error('[Abyssal V9 boot] required entry DOM is missing');
    return;
  }

  const BOOT = {
    ready: false,
    loading: false,
    requested: false,
    promise: null,
    lastPointerUpAt: 0,
    timeoutMs: 7000
  };

  window.ABYSSAL_BOOT_V9 = BOOT;

  const originalLabel = enter.textContent;

  function setStatus(text, error=false){
    if(!setup) return;
    setup.classList.remove('hidden');
    setup.textContent = text;
    setup.style.color = error ? '#efb1aa' : '';
  }

  function setBusy(busy){
    enter.disabled = !!busy;
    enter.textContent = busy ? 'ENTERING MIREWOOD…' : originalLabel;
    enter.style.opacity = busy ? '.78' : '';
  }

  function loadScript(src, timeoutMs=BOOT.timeoutMs){
    return new Promise((resolve, reject)=>{
      const script = document.createElement('script');
      let settled = false;
      const timer = setTimeout(()=>finish(false, new Error('timeout: ' + src)), timeoutMs);

      function finish(ok, value){
        if(settled) return;
        settled = true;
        clearTimeout(timer);
        script.onload = null;
        script.onerror = null;
        if(ok) resolve(value);
        else{
          script.remove();
          reject(value);
        }
      }

      script.src = src;
      script.async = false;
      script.onload = ()=>finish(true, src);
      script.onerror = ()=>finish(false, new Error('failed: ' + src));
      document.head.appendChild(script);
    });
  }

  async function ensureRealtime(){
    if(window.supabase?.createClient) return;

    const mirrors = [
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
      'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
    ];

    let lastError = null;
    for(const src of mirrors){
      try{
        setStatus('Connecting shared-world services…');
        await loadScript(src);
        if(window.supabase?.createClient) return;
      }catch(error){
        lastError = error;
      }
    }

    throw lastError || new Error('Realtime client unavailable');
  }

  function removeEntryInterceptors(){
    enter.removeEventListener('pointerup', interceptPointerUp, true);
    enter.removeEventListener('click', interceptClick, true);
    nameInput?.removeEventListener('keydown', interceptKeyDown, true);
  }

  function handOffToExistingEnter(){
    if(!BOOT.requested || !BOOT.ready) return;
    BOOT.requested = false;
    removeEntryInterceptors();
    setBusy(false);
    if(setup) setup.classList.add('hidden');
    enter.click();
  }

  async function loadExistingGame(){
    if(BOOT.ready) return true;
    if(BOOT.promise) return BOOT.promise;

    BOOT.promise = (async()=>{
      BOOT.loading = true;
      try{
        await ensureRealtime();

        const files = [
          'game-core.js?v=9',
          'game-play.js?v=9',
          'game-render.js?v=9',
          'game-v7-patch.js?v=9',
          'mobile-fixes.js?v=9',
          'network-v9.js?v=9'
        ];

        for(const file of files){
          setStatus('Loading Mirewood…');
          await loadScript(file);
        }

        BOOT.ready = true;
        BOOT.loading = false;
        BOOT.promise = null;
        setBusy(false);
        if(setup) setup.classList.add('hidden');
        handOffToExistingEnter();
        return true;
      }catch(error){
        console.error('[Abyssal V9 boot]', error);
        BOOT.ready = false;
        BOOT.loading = false;
        BOOT.promise = null;
        BOOT.requested = false;
        setBusy(false);
        setStatus('Shared world failed to load. Tap ENTER SAFE CAMP to retry.', true);
        return false;
      }
    })();

    return BOOT.promise;
  }

  function requestEntry(event){
    if(BOOT.ready) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if(BOOT.loading){
      BOOT.requested = true;
      return;
    }

    BOOT.requested = true;
    setBusy(true);
    setStatus('Preparing Safe Camp…');
    loadExistingGame();
  }

  function interceptPointerUp(event){
    BOOT.lastPointerUpAt = performance.now();
    requestEntry(event);
  }

  function interceptClick(event){
    if(performance.now() - BOOT.lastPointerUpAt < 650){
      if(!BOOT.ready){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }
    requestEntry(event);
  }

  function interceptKeyDown(event){
    if(event.key !== 'Enter') return;
    requestEntry(event);
  }

  enter.addEventListener('pointerup', interceptPointerUp, {capture:true, passive:false});
  enter.addEventListener('click', interceptClick, {capture:true, passive:false});
  nameInput?.addEventListener('keydown', interceptKeyDown, {capture:true});

  setTimeout(()=>{
    if(!BOOT.ready && !BOOT.loading) loadExistingGame();
  }, 250);

  window.addEventListener('pageshow', ()=>{
    if(!BOOT.ready && !BOOT.loading) loadExistingGame();
  });
})();
