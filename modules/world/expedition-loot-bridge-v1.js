(()=>{
  'use strict';

  if(globalThis.ABYSSAL_EXPEDITION_LOOT_BRIDGE_V1?.version===1)return;
  const expedition=globalThis.ABYSSAL_EXPEDITION_LOOP_V1;
  if(expedition?.version!==1||typeof expedition.recordConfirmedMobLoot!=='function')throw new Error('Expedition loot bridge dependencies are unavailable.');

  window.addEventListener('abyssal:loot-claimed',event=>{
    expedition.recordConfirmedMobLoot(event?.detail);
  });
  globalThis.ABYSSAL_EXPEDITION_LOOT_BRIDGE_V1=Object.freeze({version:1});
})();
