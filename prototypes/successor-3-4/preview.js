(() => {
  'use strict';
  const frame = document.querySelector('#game');
  const routeFlags = new URLSearchParams(location.search);
  const selectedView = routeFlags.get('view');
  const requestedQaControls = routeFlags.get('awQaControls') === '1';
  const grayboxContinuity = selectedView === 'graybox' || selectedView === 'home-pixel';
  // Give the selected HOME slice one stable, readable URL. Clear comparison
  // flags so a stale art query cannot accidentally combine unrelated drafts.
  if (grayboxContinuity) {
    for (const key of [...routeFlags.keys()]) routeFlags.delete(key);
    routeFlags.set('awDevQa', '1');
    routeFlags.set('awCozyPixel', '1');
    routeFlags.set('awQaControls', requestedQaControls ? '1' : '0');
  }
  const requestedArtPass = routeFlags.get('art') || routeFlags.get('AW_SUCCESSOR_PREVIEW_ART');
  const previewArtPass = ['revise-pass-2','revise-pass-3'].includes(requestedArtPass) ? requestedArtPass : '';
  const townArtPass = Math.max(0, Number(routeFlags.get('townArtPass')) || 0);
  const qaMode = routeFlags.get('awDevQa') === '1';
  const grayboxBuildingPreview = qaMode && (routeFlags.get('awGrayboxBuilding') === '1' || grayboxContinuity);
  const startAtGrayboxPreview = grayboxBuildingPreview && routeFlags.get('awStartAtGraybox') === '1';
  const cozyPixelProof = qaMode && routeFlags.get('awCozyPixel') === '1';
  const playableGroundDraft = qaMode && routeFlags.get('awPlayableGroundDraft') === '1';
  const liveGroundArtPreview = qaMode && routeFlags.get('awLiveGroundArt') === '1';
  const pixelSurvivorDraft = playableGroundDraft || liveGroundArtPreview;
  const showQaControls = routeFlags.get('awQaControls') !== '0';
  const candidateArtMode = routeFlags.get('awArtPreview') === '1';
  const previewFieldRigTier = routeFlags.get('previewFieldRig') === '2' ? 2 : 0;
  const playerCandidatePreview = qaMode && routeFlags.get('awPlayerCandidate') === '1';
  const generatedWalkAtlasPreview = qaMode && routeFlags.get('awPlayerWalkAtlas') === '1';
  const requestedWalkAtlasScale = routeFlags.has('awPlayerWalkScale') ? Number(routeFlags.get('awPlayerWalkScale')) : Number.NaN;
  const generatedWalkAtlasScale = generatedWalkAtlasPreview && Number.isFinite(requestedWalkAtlasScale) ? Math.max(.4, Math.min(.8, requestedWalkAtlasScale)) : .55;
  const characterPortraitPreview = qaMode && routeFlags.get('awCharacterPortrait') === '1';
  const generatedGroundPreview = qaMode && routeFlags.get('awGeneratedGround') === '1';
  const candidateTreePreview = qaMode && routeFlags.get('awTreeCandidate') === '1';
  const resourceArtPreview = qaMode && routeFlags.get('awResourceArt') === '1';
  const groundStudyPass = qaMode && routeFlags.get('awGroundStudy') === 'pass7' ? 'pass7' : routeFlags.get('awContinuousGround') === '1' && qaMode ? 'pass6' : '';
  const continuousGroundPreview = !!groundStudyPass;
  const continuousBlackmarshPreview = qaMode && routeFlags.get('awBlackmarshGround') === '1';
  const treeCandidatePreview = qaMode && routeFlags.get('awTreeCandidate') === '1';
  // Make the embedded game a deliberate keyboard target. Without tabindex,
  // browser focus can remain on the outer preview page after a player clicks
  // the game, so the V21 key listeners never see movement input.
  frame.tabIndex = 0;
  frame.addEventListener('load', () => {
    const childDocument = frame.contentDocument;
    childDocument?.addEventListener('pointerdown', event => {
      const target = event.target;
      if (target === childDocument.querySelector('canvas') || target?.closest?.('.successor-pad')) frame.focus({preventScroll:true});
    }, {passive:true});
  });
  const status = document.querySelector('#status');
  const saveState = document.querySelector('#save-state');
  const saveKeys = ['abyssal_wake_save_v5', 'abyssal_wake_save_v4', 'abyssal_wake_settings_v1', 'abyssal_home_workbench_v1'];
  const before = Object.fromEntries(saveKeys.map(key => [key, localStorage.getItem(key)]));
  const url = new URL('../../survival-v21.html', location.href);
  const repositoryRoot=new URL('../../',location.href);
  async function localAsset(path){const response=await fetch(new URL(path,repositoryRoot),{cache:'no-store'});if(!response.ok)throw new Error(`${path} ${response.status}`);return response;}
  const guard = `<meta http-equiv="Content-Security-Policy" content="connect-src 'self'">
  <script>
    window.AW_SUCCESSOR_PREVIEW = true;
    const __previewPrefix = 'abyssal_wake_successor_preview_v1:';
    const __previewMem = new Map();
    let __previewBacking = null, __previewWrites = 0, __previewPersistent = true;
    try { __previewBacking=parent.localStorage; } catch { __previewPersistent=false; }
    const __previewKey = k => __previewPrefix + String(k);
    const __previewStorage = {
      get length() { const keys=new Set(__previewMem.keys());if(__previewBacking)try{for(let i=0;i<__previewBacking.length;i++){const key=__previewBacking.key(i);if(key?.startsWith(__previewPrefix))keys.add(key);}}catch{__previewPersistent=false;}return keys.size; },
      key(index) { const keys=new Set(__previewMem.keys());if(__previewBacking)try{for(let i=0;i<__previewBacking.length;i++){const key=__previewBacking.key(i);if(key?.startsWith(__previewPrefix))keys.add(key);}}catch{__previewPersistent=false;}return [...keys][Number(index)]?.slice(__previewPrefix.length) ?? null; },
      getItem(k) { const key=__previewKey(k);if(__previewBacking)try { const value=__previewBacking.getItem(key);if(value!==null)return value; } catch { __previewPersistent=false; }return __previewMem.get(key) ?? null; },
      setItem(k,v) { const key=__previewKey(k),value=String(v);__previewMem.set(key,value);if(__previewBacking)try { __previewBacking.setItem(key,value); } catch { __previewPersistent=false; }__previewWrites++;parent.postMessage({type:'preview-storage',writes:__previewWrites,persistent:__previewPersistent},'*'); },
      removeItem(k) { const key=__previewKey(k);__previewMem.delete(key);if(__previewBacking)try { __previewBacking.removeItem(key); } catch { __previewPersistent=false; } },
      clear() { if(__previewBacking)try{for(let i=__previewBacking.length-1;i>=0;i--){const key=__previewBacking.key(i);if(key?.startsWith(__previewPrefix))__previewBacking.removeItem(key);}}catch{__previewPersistent=false;}__previewMem.clear(); }
    };
    Object.defineProperty(window, 'localStorage', {configurable:false, value:__previewStorage});
    Object.defineProperty(window, 'WebSocket', {configurable:false, writable:false, value:class PreviewSocketBlocked { constructor() { parent.postMessage({type:'preview-websocket-blocked'}, '*'); throw new Error('WebSocket blocked by local successor preview'); } }});
    addEventListener('error', e => parent.postMessage({type:'preview-error', message:e.message}, '*'));
    addEventListener('securitypolicyviolation', e => { if (e.violatedDirective === 'connect-src') parent.postMessage({type:'preview-remote-connect-blocked', blockedURI:e.blockedURI}, '*'); });
  <\/script>`;
  function report(text, error = false) { status.textContent = text; status.dataset.error = String(error); }
  addEventListener('message', event => {
    if (event.source !== frame.contentWindow) return;
    const data = event.data || {};
    if (data.type === 'preview-websocket-blocked') report('FAIL CLOSED · attempted WebSocket construction', true);
    if (data.type === 'preview-remote-connect-blocked') report(`FAIL CLOSED · remote connection blocked by preview policy (${data.blockedURI})`, true);
    if (data.type === 'preview-error') report(`V21 runtime error · ${data.message}`, true);
    if (data.type === 'preview-storage') { document.documentElement.dataset.previewWrites = String(data.writes);document.documentElement.dataset.previewPersistent = String(data.persistent === true);if(saveState){saveState.textContent=data.persistent===true?'试玩存档 · 已保存':'试玩存档 · 临时';saveState.dataset.persistent=String(data.persistent===true);} }
    if (data.type === 'successor-ready') report(`V21 live state · ${data.viewport} · ${data.terrain} cells · ${data.props} props · ${data.resources} resources · ${data.mobs} mobs · Relay blocked`);
    if (data.type === 'successor-assets') {
      const summary = Object.entries(data.assets || {}).map(([name, item]) => `${name}:${item.loaded ? `${item.width}x${item.height}` : `FALLBACK(${item.reason})`}${name === 'terrain' ? ` HTTP ${item.httpStatus || 'pending'}` : ''}`).join(' · ');
      report(`V21 preview · ${data.viewport} · ${summary}${previewArtPass?` · DRAFT terrain ${previewArtPass} · NOT PRODUCTION`:''}${generatedWalkAtlasPreview?` · DRAFT high-detail walk atlas ${data.assets.playerCandidate?.loaded?'已载入':'加载中'}`:''}${characterPortraitPreview?` · 高清角色原画 ${data.assets.characterPortrait?.loaded?'已载入':'加载中'} · DRAFT`:''} · Relay blocked · isolated browser save`);
    }
  });
  async function boot() {
    try {
      const response = await localAsset('survival-v21.html');
      let html = await response.text();
      if (!html.includes('await loadModule(name);')) throw new Error('V21 module loader hook not found');
      html = html.replace('await ensureRealtime();', 'ensureRealtime=async()=>{};await ensureRealtime();');
      html = html.replace("'./'+name+'?v='+VER", "'./'+name+'?v='+VER+'&preview='+Date.now()");
      html = html.replace('await loadModule(name);', "if(name==='modules/main-loop/smooth-motion-v18.js'){started=true;zoneConnected=true;draw=function(){}}await loadModule(name);if(name==='modules/network/network-relay-v16.js')await loadModule('prototypes/successor-3-4/local-preview-relay.js');");
      const flags = `<script>window.AW_DEV_QA=false;if(${qaMode})window.AW_DEV_QA=true;window.AW_SHOW_SUCCESSOR_QA_CONTROLS=${qaMode&&showQaControls};window.AW_ART_PREVIEW=${candidateArtMode};window.AW_SUCCESSOR_VIEW='34';window.AW_SUCCESSOR_GRAYBOX_CONTINUITY=${grayboxContinuity};window.AW_SUCCESSOR_PREVIEW_ART=${JSON.stringify(previewArtPass)};window.AW_SUCCESSOR_PREVIEW_FIELD_RIG_TIER=${previewFieldRigTier};window.AW_SUCCESSOR_CONTINUOUS_GROUND_QA=${continuousGroundPreview||continuousBlackmarshPreview};window.AW_SUCCESSOR_GROUND_STUDY=${JSON.stringify(groundStudyPass)};window.AW_SUCCESSOR_BLACKMARSH_GROUND_QA=${continuousBlackmarshPreview};window.AW_SUCCESSOR_PLAYABLE_GROUND_DRAFT=${playableGroundDraft};window.AW_SUCCESSOR_LIVE_GROUND_ART=${liveGroundArtPreview};window.AW_SUCCESSOR_PIXEL_SURVIVOR=${pixelSurvivorDraft};window.AW_SUCCESSOR_COZY_PIXEL_PROOF=${cozyPixelProof};window.AW_SUCCESSOR_PREVIEW_START_AT_MIRE_MART=${qaMode && routeFlags.get('awStartAtMireMart') === '1'};window.AW_SUCCESSOR_TREE_CANDIDATE_QA=${treeCandidatePreview||candidateTreePreview};window.AW_SUCCESSOR_RESOURCE_ART_QA=${resourceArtPreview};window.AW_SUCCESSOR_PLAYER_CANDIDATE_QA=${playerCandidatePreview};window.AW_SUCCESSOR_GENERATED_WALK_ATLAS_QA=${generatedWalkAtlasPreview};window.AW_SUCCESSOR_CHARACTER_PORTRAIT_QA=${characterPortraitPreview};window.AW_SUCCESSOR_CHARACTER_DOSSIER_QA=${characterPortraitPreview && routeFlags.get('awCharacterDossier') !== '0'};if(${characterPortraitPreview}){const art=document.createElement('style');art.textContent='.gate-card .sprite-hero{width:116px!important;height:204px!important;margin-bottom:2px!important;background-image:url(\"assets/art-candidates/modern-survivor-spritesheet-review-2026-10-06/modern-survivor-front-portrait-150x298.png\")!important;background-position:center center!important;background-size:102px 203px!important;image-rendering:auto!important;filter:drop-shadow(0 8px 13px #0008)}@media(max-height:620px){.gate-card .sprite-hero{height:150px!important;background-size:76px 150px!important}}';document.head.appendChild(art)}</scr` + 'ipt>';
      const candidateGroundFlags = generatedGroundPreview ? flags.replace('window.AW_SUCCESSOR_GROUND_STUDY=', 'window.AW_SUCCESSOR_GENERATED_GROUND_QA=true;window.AW_SUCCESSOR_GROUND_STUDY=') : flags;
      html = html.replace('<head>', `<head><base href="${url.href}">${candidateGroundFlags}<script>window.AW_SUCCESSOR_GENERATED_WALK_ATLAS_SCALE=${generatedWalkAtlasScale}</scr` + `ipt>${guard}`);
      html = html.replace('<head>', `<head><script>window.AW_SUCCESSOR_TOWN_ART_PASS=${townArtPass};</scr` + `ipt>`);
      html = html.replace('<head>', `<head><script>window.AW_SUCCESSOR_GRAYBOX_BUILDING=${grayboxBuildingPreview};</scr` + `ipt>`);
      html = html.replace('<head>', `<head><script>window.AW_SUCCESSOR_PREVIEW_START_AT_GRAYBOX=${startAtGrayboxPreview};</scr` + `ipt>`);
      html = html.replace('<head>', `<head><script>window.AW_SUCCESSOR_PREVIEW_START_AT_METRO_B2=${qaMode && routeFlags.get('awStartAtMetroB2') === '1'};</scr` + `ipt>`);
      frame.srcdoc = html;
      frame.addEventListener('load', waitForModules, {once:true});
    } catch (error) { report(`Preview failed · ${error.message}`, true); }
  }
  function waitForModules() {
    const child = frame.contentWindow;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      try { if (child.ABYSSAL_BOOT_V21?.depsReady) { clearInterval(timer); install(); return; } } catch {}
      if (attempts > 300) { clearInterval(timer); report('V21 module boot timed out', true); }
    }, 100);
  }
  async function inject(path) {
    const response = await localAsset(path);
    const script = frame.contentDocument.createElement('script');
    script.textContent = await response.text();
    frame.contentDocument.head.appendChild(script);
  }
  async function install() {
    try {
      const child = frame.contentWindow;
      if (typeof child.draw !== 'function') throw new Error('Final V21 frame hook is unavailable');
      child.__AW_V21_CANONICAL_FRAME__ = child.draw;
      child.AW_SUCCESSOR_GRAYBOX_CONTINUITY = grayboxContinuity;
      if(playerCandidatePreview){const atlasResponse=await localAsset('assets/art-candidates/modern-survivor-spritesheet-review-2026-10-06/modern-survivor-original-atlas-frames.json');child.AW_SURVIVOR_ATLAS_FRAMES=await atlasResponse.json();}
      if (cozyPixelProof) await inject('modules/render/graybox-scene-painter.js');
      if (grayboxContinuity) await inject('modules/interaction/resource-work.js');
      await inject('prototypes/successor-3-4/metro-b2-room-v1.js');
      await inject('prototypes/successor-3-4/camera-adapter.js');
      await inject('modules/render/defense-structure-render-v1.js');
      await inject('modules/ui/route-guidance-v1.js');
      await inject('prototypes/successor-3-4/successor-renderer.js');
      if (grayboxBuildingPreview) {
        const interiorLayout = await localAsset('data/world/mire-mart-interior-preview-v1.json');
        child.AW_MIRE_MART_INTERIOR_LAYOUT_PREVIEW_V1 = await interiorLayout.json();
        await inject('modules/world/building-collision-preview-v1.js');
        await inject('modules/render/building-interior-renderer-preview-v1.js');
        await inject('modules/safe-camp/building-access-preview-v1.js');
      }
      if (qaMode) await inject('prototypes/successor-3-4/qa-harness.js');
      // Keep a mouse-draggable virtual stick available in the guarded desktop
      // preview so ordinary pointer input can be tested without QA teleports.
      const previewInputStyle = child.document.createElement('style');
      previewInputStyle.textContent = 'html.abyssal-desktop-v19 .successor-pad{display:block!important;left:18px!important;bottom:70px!important}';
      child.document.head.appendChild(previewInputStyle);
      report('V21 state and systems loaded · same-origin assets only · Relay blocked · isolated browser save active');
      setTimeout(() => {
        const after = Object.fromEntries(saveKeys.map(key => [key, localStorage.getItem(key)]));
        const unchanged = JSON.stringify(before) === JSON.stringify(after);
        document.documentElement.dataset.realStorageUnchanged = String(unchanged);
        report(`${status.textContent} · real save unchanged=${unchanged}`);
        if (unchanged) {
          // mountUI replaces the original gate node; resolve the live mounted node after successor install.
          child.document.querySelector('#gate')?.classList.add('hidden');
          child.document.querySelector('#game')?.classList.remove('hidden');
        }
      }, 1500);
    } catch (error) { report(`Successor install failed · ${error.message}`, true); }
  }
  boot();
})();
