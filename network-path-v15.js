(()=>{
  'use strict';
  const DUAL=window.ABYSSAL_DUAL_V14;
  if(!DUAL)return;
  const state={version:15,transport:'--',localType:'--',remoteType:'--',protocol:'--',updatedAt:0};
  window.ABYSSAL_PATH_V15=state;

  function badge(){
    let el=document.getElementById('transportBadgeV15');
    if(el)return el;
    el=document.createElement('div');
    el.id='transportBadgeV15';
    el.style.cssText='position:absolute;left:8px;top:158px;z-index:13;padding:4px 6px;border:1px solid #4d655b;background:#0c1d19e8;color:#b8c9c1;font:700 7px ui-monospace,monospace;pointer-events:none';
    el.textContent='实际路径：--';
    game?.appendChild(el);
    return el;
  }

  function connections(){
    const out=[];
    if(DUAL.role==='guest'&&DUAL.hostConn?.peerConnection)out.push(DUAL.hostConn.peerConnection);
    if(DUAL.role==='host')for(const c of DUAL.guestConns?.values?.()||[])if(c?.peerConnection)out.push(c.peerConnection);
    return out;
  }

  async function inspect(){
    if(!DUAL.active||!DUAL.linked){state.transport='--';badge().textContent='实际路径：--';return;}
    const pcs=connections();
    for(const pc of pcs){
      try{
        const stats=await pc.getStats();
        let pair=null;
        stats.forEach(r=>{
          if(r.type==='transport'&&r.selectedCandidatePairId){const p=stats.get(r.selectedCandidatePairId);if(p)pair=p;}
          if(!pair&&r.type==='candidate-pair'&&r.state==='succeeded'&&(r.nominated||r.selected))pair=r;
        });
        if(!pair)continue;
        const local=stats.get(pair.localCandidateId),remote=stats.get(pair.remoteCandidateId);
        state.localType=local?.candidateType||'--';
        state.remoteType=remote?.candidateType||'--';
        state.protocol=local?.protocol||remote?.protocol||'--';
        state.transport=(state.localType==='relay'||state.remoteType==='relay')?'TURN中继':'P2P直连';
        state.updatedAt=Date.now();
        badge().textContent='实际路径：'+state.transport+(state.protocol!=='--'?' · '+String(state.protocol).toUpperCase():'');
        const diag=document.getElementById('networkDiagV14');
        if(diag){
          let row=diag.querySelector('[data-v15-path]');
          if(!row){row=document.createElement('div');row.dataset.v15Path='1';row.style.marginTop='4px';diag.appendChild(row);}
          row.textContent='实际路径: '+state.transport+' · local '+state.localType+' · remote '+state.remoteType+' · '+state.protocol;
        }
        return;
      }catch{}
    }
    badge().textContent='实际路径：检测中';
  }

  badge();
  setInterval(inspect,1600);
})();
