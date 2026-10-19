(() => {
  'use strict';
  const frame = document.querySelector('#game');
  const error = document.querySelector('#error');
  frame.tabIndex = 0;
  frame.addEventListener('load', () => {
    const childDocument = frame.contentDocument;
    childDocument?.addEventListener('pointerdown', event => {
      const target = event.target;
      if (target === childDocument.querySelector('canvas') || target?.closest?.('.successor-pad')) frame.focus({preventScroll:true});
    }, {passive:true});
  });

  const source = new URL('../../survival-v21.html', location.href);
  const entryHook = 'BOOT.depsReady=true;BOOT.depsLoading=false;BOOT.promise=null;handoff();return true;';
  const moduleHook = 'await loadModule(name);';
  const beforeMotion = "if(name==='modules/main-loop/smooth-motion-v18.js')draw=()=>{};await loadModule(name);";
  const injectRenderer = "window.__AW_V21_CANONICAL_FRAME__=draw;draw=()=>{};await loadModule('modules/render/graybox-scene-painter.js');await loadModule('modules/interaction/resource-work.js');await loadModule('prototypes/successor-3-4/camera-adapter.js');await loadModule('modules/render/defense-structure-render-v1.js');await loadModule('modules/ui/route-guidance-v1.js');await loadModule('prototypes/successor-3-4/successor-renderer.js');";

  async function boot() {
    try {
      const response = await fetch(source, {cache:'no-store'});
      if (!response.ok) throw new Error(`game runtime HTTP ${response.status}`);
      let html = await response.text();
      if (html.split(moduleHook).length !== 2 || html.split(entryHook).length !== 2) {
        throw new Error('Unified game boot hook changed; candidate stopped safely');
      }
      html = html.replace(moduleHook, beforeMotion);
      html = html.replace("'./'+name+'?v='+VER", "'./'+name+'?v='+VER+'&awView=34'");
      html = html.replace(entryHook, `${injectRenderer}${entryHook}`);
      const flags = '<script>window.AW_DEV_QA=false;window.AW_SUCCESSOR_PREVIEW=false;window.AW_SUCCESSOR_VIEW=\'34\';window.AW_SUCCESSOR_PIXEL_SURVIVOR=false;window.AW_SUCCESSOR_LIVE_GROUND_ART=false;window.AW_SUCCESSOR_COZY_PIXEL_PROOF=true;window.AW_SUCCESSOR_GRAYBOX_CONTINUITY=true;</scr' + 'ipt>';
      html = html.replace('<head>', `<head><base href="${source.href}">${flags}`);
      frame.srcdoc = html;
    } catch (cause) {
      error.hidden = false;
      error.textContent = `Game could not load. Refresh to try again. (${String(cause?.message || cause)})`;
      frame.hidden = true;
    }
  }

  boot();
})();
