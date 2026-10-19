(()=>{
'use strict';

if(globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1?.version===1)return;

const STACK_KEYS=new Set(['wood','stone','food','shard','seed','egg','milk','wool','fish_reedcarp','fish_glassminnow','fish_holloweye','companion_egg','meal_river_stew','meal_glass_porridge','meal_holloweye_chowder','meal_trail_stew']);
const UNLOCK_KEYS=new Set(['knife','lantern']);

function validCosts(costs){
  if(!costs||typeof costs!=='object'||Array.isArray(costs))return false;
  return Object.entries(costs).every(([key,value])=>STACK_KEYS.has(key)&&Number.isInteger(value)&&value>0);
}
function validUnlocks(unlocks){
  if(!unlocks||typeof unlocks!=='object'||Array.isArray(unlocks))return false;
  return Object.entries(unlocks).every(([key,value])=>UNLOCK_KEYS.has(key)&&value===true);
}
function commitCraftMutation({costs={},unlocks={}}={}){
  const inv=typeof inventory!=='undefined'&&inventory?inventory:null;
  if(!inv)return{ok:false,reason:'inventory-unavailable'};
  if(!validCosts(costs)||!validUnlocks(unlocks)||(!Object.keys(costs).length&&!Object.keys(unlocks).length))return{ok:false,reason:'invalid-transaction'};
  for(const key of Object.keys(unlocks))if(inv[key]===true)return{ok:false,reason:'already-owned',item:key};
  for(const [key,cost] of Object.entries(costs)){
    const count=Number(inv[key]);
    if(!Number.isFinite(count)||count<cost)return{ok:false,reason:'materials-required',item:key};
  }
  const previous={};
  for(const key of [...Object.keys(costs),...Object.keys(unlocks)])previous[key]=inv[key];
  for(const [key,cost] of Object.entries(costs))inv[key]=Number(inv[key])-cost;
  for(const key of Object.keys(unlocks))inv[key]=true;
  let saved=false;
  try{saved=typeof saveLocal==='function'&&saveLocal()===true;}catch{}
  if(!saved){for(const [key,value] of Object.entries(previous))inv[key]=value;return{ok:false,reason:'save-failed'};}
  try{if(typeof updateUI==='function')updateUI();}catch{}
  return{ok:true};
}

function commitItemGrant({grants={}}={}){
  const inv=typeof inventory!=='undefined'&&inventory?inventory:null;
  if(!inv||!grants||typeof grants!=='object'||Array.isArray(grants))return{ok:false,reason:'invalid-grant'};
  const entries=Object.entries(grants);
  if(!entries.length||entries.some(([key,value])=>!STACK_KEYS.has(key)||!Number.isInteger(value)||value<0||value>99)||entries.every(([,value])=>value===0))return{ok:false,reason:'invalid-grant'};
  const previous={};
  for(const[key,amount]of entries){const current=Number(inv[key]);if(!Number.isFinite(current)||current<0)return{ok:false,reason:'invalid-inventory'};previous[key]=current;}
  for(const[key,amount]of entries)inv[key]=previous[key]+amount;
  let saved=false;
  try{saved=typeof saveLocal==='function'&&saveLocal()===true;}catch{}
  if(!saved){for(const[key,value]of Object.entries(previous))inv[key]=value;return{ok:false,reason:'save-failed'};}
  try{if(typeof updateUI==='function')updateUI();}catch{}
  return{ok:true};
}

function commitItemExchange({costs={},grants={}}={}){
  const inv=typeof inventory!=='undefined'&&inventory?inventory:null;
  if(!inv||!validCosts(costs)||!grants||typeof grants!=='object'||Array.isArray(grants))return{ok:false,reason:'invalid-exchange'};
  const outputs=Object.entries(grants);
  if(outputs.some(([key,value])=>!STACK_KEYS.has(key)||!Number.isInteger(value)||value<0||value>99)||(!Object.keys(costs).length&&!outputs.length))return{ok:false,reason:'invalid-exchange'};
  for(const[key,cost]of Object.entries(costs)){const count=Number(inv[key]);if(!Number.isFinite(count)||count<cost)return{ok:false,reason:'materials-required',item:key};}
  const touched=[...new Set([...Object.keys(costs),...outputs.map(([key])=>key)])],previous={};
  for(const key of touched){const count=Number(inv[key]);if(!Number.isFinite(count)||count<0)return{ok:false,reason:'invalid-inventory',item:key};previous[key]=count;}
  for(const[key,cost]of Object.entries(costs))inv[key]=previous[key]-cost;
  for(const[key,amount]of outputs)inv[key]=Number(inv[key]||0)+amount;
  let saved=false;
  try{saved=typeof saveLocal==='function'&&saveLocal()===true;}catch{}
  if(!saved){for(const[key,value]of Object.entries(previous))inv[key]=value;return{ok:false,reason:'save-failed'};}
  try{if(typeof updateUI==='function')updateUI();}catch{}
  return{ok:true};
}

globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1={version:1,commitCraftMutation,commitItemGrant,commitItemExchange};
})();
