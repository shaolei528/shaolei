(()=>{
  const canvas=document.getElementById('canvas');
  const wrap=document.querySelector('.arena-wrap');
  const connection=document.getElementById('connection');
  const game=document.getElementById('game');
  const joystick=document.getElementById('joystick');
  const stick=document.getElementById('stick');
  if(!canvas||!wrap)return;

  function fitPixelCanvas(){
    const r=wrap.getBoundingClientRect();
    if(r.width<20||r.height<20)return;
    const w=360;
    const h=Math.max(520,Math.min(820,Math.round(w*r.height/r.width)));
    if(canvas.width!==w||canvas.height!==h){
      canvas.width=w;canvas.height=h;
      const c=canvas.getContext('2d');if(c)c.imageSmoothingEnabled=false;
    }
  }

  fitPixelCanvas();
  addEventListener('resize',fitPixelCanvas,{passive:true});
  addEventListener('pageshow',fitPixelCanvas,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(fitPixelCanvas,180),{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(fitPixelCanvas).observe(wrap);

  document.documentElement.style.overscrollBehavior='none';
  document.body.style.overscrollBehavior='none';
  document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
  document.addEventListener('contextmenu',e=>{if(e.target.closest('button,.joystick,.arena'))e.preventDefault()});

  function cancelMovement(){
    if(stick)stick.style.transform='translate(0,0)';
    if(joystick){
      try{joystick.dispatchEvent(new Event('pointercancel',{bubbles:false}))}catch{}
    }
  }
  addEventListener('blur',cancelMovement);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelMovement()});
  addEventListener('pagehide',cancelMovement);

  let btn=null,timer=null;
  function showRetry(){
    if(btn||!game||game.classList.contains('hidden'))return;
    btn=document.createElement('button');btn.type='button';btn.textContent='RECONNECT';
    Object.assign(btn.style,{position:'absolute',left:'50%',top:'165px',transform:'translateX(-50%)',zIndex:'25',border:'1px solid #51675f',background:'#0d1a17ee',color:'#dfeae3',padding:'8px 12px',font:'700 9px ui-monospace,monospace',letterSpacing:'.08em'});
    btn.onclick=()=>location.reload();game.appendChild(btn);
  }
  function hideRetry(){if(btn){btn.remove();btn=null}}
  function arm(){
    clearTimeout(timer);
    timer=setTimeout(()=>{
      const t=(connection?.textContent||'').toUpperCase();
      if(t.includes('RECONNECT')||t.includes('OFFLINE')||t.includes('CONNECT'))showRetry();
    },9000);
  }

  addEventListener('offline',()=>{cancelMovement();if(connection){connection.textContent='OFFLINE';connection.className='connection poor'}arm()});
  addEventListener('online',()=>{if(connection){connection.textContent='RECONNECTING';connection.className='connection reconnect'}arm()});
  if(connection)new MutationObserver(()=>{
    const t=(connection.textContent||'').toUpperCase();
    if(t==='GOOD'||t==='FAIR'||t==='POOR')hideRetry();else arm();
  }).observe(connection,{childList:true,characterData:true,subtree:true});

  addEventListener('unhandledrejection',arm);
  addEventListener('error',arm);
  arm();
})();