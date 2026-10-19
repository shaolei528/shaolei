(()=>{
  'use strict';

  if(globalThis.ABYSSAL_SAVE_EXTENSIONS_V1?.version===1)return;

  const KEY=typeof STORAGE_KEY==='string'?STORAGE_KEY:'abyssal_wake_save_v5';
  const providers=new Map();
  let restoredOwners={};

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function readOwners(){
    try{
      const save=JSON.parse(localStorage.getItem(KEY)||'null');
      if(save?.v!==5||save.extensions?.version!==1||!save.extensions.owners||typeof save.extensions.owners!=='object')return{};
      return save.extensions.owners;
    }catch{return{};}
  }
  function register(id,provider){
    const name=String(id||'');
    if(!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(name)||!provider||typeof provider.snapshot!=='function'||typeof provider.restore!=='function')return false;
    if(providers.has(name))return false;
    providers.set(name,provider);
    try{provider.restore(clone(restoredOwners[name]));}catch(error){console.warn('[Abyssal save extension]',name,error)}
    return true;
  }
  function snapshot(){
    const owners={};
    for(const[name,provider]of providers)owners[name]=clone(provider.snapshot());
    return{version:1,owners};
  }

  restoredOwners=readOwners();
  globalThis.ABYSSAL_SAVE_EXTENSIONS_V1=Object.freeze({version:1,register,snapshot});
})();
