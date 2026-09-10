(()=>{
'use strict';

/*
  V20 network quality diagnostics.
  Does not change protocol, payloads, relay URL, or maximum movement send rate.
  It replaces single-sample quality decisions with robust recent-window metrics.
*/

const MAX_OUTCOMES=24;
const MIN_STABLE_SAMPLES=3;

function numericSamples(values){
  return Array.from(values||[]).map(Number).filter(Number.isFinite).map(v=>Math.max(0,v));
}
function median(values){
  const a=numericSamples(values).sort((x,y)=>x-y);
  if(!a.length)return null;
  const m=Math.floor(a.length/2);
  return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function percentile(values,p=.9){
  const a=numericSamples(values).sort((x,y)=>x-y);
  if(!a.length)return null;
  const q=Math.max(0,Math.min(1,Number(p)||0));
  return a[Math.max(0,Math.min(a.length-1,Math.ceil(q*a.length)-1))];
}
function jitter(values){
  const a=numericSamples(values);
  if(a.length<2)return 0;
  let total=0;
  for(let i=1;i<a.length;i++)total+=Math.abs(a[i]-a[i-1]);
  return total/(a.length-1);
}
function recentLoss(outcomes){
  const a=Array.from(outcomes||[]).map(Boolean);
  if(!a.length)return null;
  let lost=0;for(const ok of a)if(!ok)lost++;
  return lost/a.length;
}
function summarize(values,outcomes=[],fallbackLoss=0){
  const samples=numericSamples(values);
  const latest=samples.length?samples.at(-1):null;
  const med=median(samples),p90=percentile(samples,.9),jit=jitter(samples);
  const windowLoss=recentLoss(outcomes);
  return{
    samples:samples.length,
    latest,
    median:med,
    p90,
    jitter:jit,
    loss:windowLoss==null?Math.max(0,Math.min(1,Number(fallbackLoss)||0)):windowLoss
  };
}
function qualityFor(stats,connected=true){
  if(!connected)return ['重新连接','reconnect'];
  if(!stats||stats.samples<MIN_STABLE_SAMPLES)return ['测量中','reconnect'];
  if(stats.median<180&&stats.p90<330&&stats.jitter<90&&stats.loss<.06)return ['良好','good'];
  if(stats.median<330&&stats.p90<700&&stats.jitter<180&&stats.loss<.15)return ['一般','fair'];
  return ['较差','poor'];
}
function intervalFor(stats){
  if(!stats||stats.samples<MIN_STABLE_SAMPLES)return .20;
  if(stats.median<180&&stats.p90<330&&stats.jitter<90&&stats.loss<.06)return .14;
  if(stats.median<330&&stats.p90<700&&stats.jitter<180&&stats.loss<.15)return .20;
  return .32;
}
function hzForInterval(seconds){return seconds>0?1/seconds:0;}

const API={
  version:20,
  median,percentile,jitter,recentLoss,summarize,qualityFor,intervalFor,hzForInterval,
  outcomes:[],
  disconnectTransitions:0,
  stats:null,
  active:false
};
window.ABYSSAL_NETWORK_QUALITY_V20=API;

const RELAY=window.ABYSSAL_RELAY_V16;
if(!RELAY||typeof pingSamples==='undefined')return;
API.active=true;

let lastReplies=Number(RELAY.pingReplies)||0;
let lastLost=Number(RELAY.pingLost)||0;
let lastConnected=!!RELAY.connected;
const originalConnectionQuality=typeof connectionQuality==='function'?connectionQuality:null;
const originalAdaptiveInterval=typeof adaptiveInterval==='function'?adaptiveInterval:null;

function pushOutcome(ok,count){
  const n=Math.max(0,Math.min(MAX_OUTCOMES,Math.floor(Number(count)||0)));
  for(let i=0;i<n;i++)API.outcomes.push(!!ok);
  if(API.outcomes.length>MAX_OUTCOMES)API.outcomes.splice(0,API.outcomes.length-MAX_OUTCOMES);
}
function captureCounters(){
  const replies=Math.max(0,Number(RELAY.pingReplies)||0);
  const lost=Math.max(0,Number(RELAY.pingLost)||0);
  if(replies>lastReplies)pushOutcome(true,replies-lastReplies);
  if(lost>lastLost)pushOutcome(false,lost-lastLost);
  lastReplies=replies;lastLost=lost;

  const connected=!!RELAY.connected;
  if(lastConnected&&!connected)API.disconnectTransitions++;
  lastConnected=connected;
}
function currentStats(){
  captureCounters();
  const total=(Number(RELAY.pingReplies)||0)+(Number(RELAY.pingLost)||0);
  const fallback=total?(Number(RELAY.pingLost)||0)/total:0;
  API.stats=summarize(pingSamples,API.outcomes,fallback);
  return API.stats;
}
function connectedForQuality(){
  return !!(RELAY.active&&RELAY.connected&&RELAY.helloAck&&globalConnected&&zoneConnected);
}
function appendDiagnostics(stats){
  const el=document.getElementById('networkDiagV16');
  if(!el||el.style.display==='none')return;
  const fmt=v=>v==null?'--':Math.round(v)+'ms';
  const loss=(stats.loss*100).toFixed(1)+'%';
  const interval=intervalFor(stats);
  const extra=[
    '',
    'V20 稳健网络统计',
    '最新 RTT: '+fmt(stats.latest),
    '中位 RTT: '+fmt(stats.median),
    'P90 RTT: '+fmt(stats.p90),
    '近期抖动: '+fmt(stats.jitter),
    '近期 Ping 丢失: '+loss,
    '观察到断线: '+API.disconnectTransitions+' 次',
    '移动同步档位: '+hzForInterval(interval).toFixed(1)+' 次/秒',
    'RTT 样本: '+stats.samples,
    '说明: 主界面显示中位 RTT；最新/P90 保留在这里用于识别尖峰。'
  ].join('\n');
  if(!el.textContent.includes('V20 稳健网络统计'))el.textContent+=extra;
  else el.textContent=el.textContent.split('\n\nV20 稳健网络统计')[0]+extra;
}

if(originalConnectionQuality){
  connectionQuality=function(){
    if(!RELAY.active)return originalConnectionQuality();
    return qualityFor(currentStats(),connectedForQuality());
  };
}
if(originalAdaptiveInterval){
  adaptiveInterval=function(){
    if(!RELAY.active)return originalAdaptiveInterval();
    return intervalFor(currentStats());
  };
}

const baseUpdateUIV20=typeof updateUI==='function'?updateUI:null;
if(baseUpdateUIV20){
  updateUI=function(){
    const result=baseUpdateUIV20.apply(this,arguments);
    if(!RELAY.active)return result;
    const stats=currentStats();
    if(stats.median!=null)pingEl.textContent=Math.round(stats.median)+'ms';
    else pingEl.textContent='测量中';
    jitterEl.textContent=stats.samples>1?Math.round(stats.jitter)+'ms':'--';
    lossEl.textContent=(stats.loss*100).toFixed(1)+'%';
    appendDiagnostics(stats);
    return result;
  };
}

setInterval(()=>{
  if(!started||!RELAY.active)return;
  const stats=currentStats();
  appendDiagnostics(stats);
},1000);
})();
