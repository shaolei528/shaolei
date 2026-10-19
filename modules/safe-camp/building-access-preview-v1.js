(() => {
  'use strict';
  if (window.AW_SUCCESSOR_PREVIEW !== true || window.AW_DEV_QA !== true || window.AW_SUCCESSOR_GRAYBOX_BUILDING !== true) return;

  const layout = window.AW_MIRE_MART_INTERIOR_LAYOUT_PREVIEW_V1;
  if (!layout || !window.ABYSSAL_BUILDING_COLLISION_PREVIEW_V1 || !window.ABYSSAL_BUILDING_RENDERER_PREVIEW_V1) return;
  const ROOM = Object.freeze({ ...layout.room });
  const doorCenter = (ROOM.doorLeft + ROOM.doorRight) / 2;
  const doorInsideY = ROOM.height - 64;
  const cabinet = layout.cabinet;
  const collision = window.ABYSSAL_BUILDING_COLLISION_PREVIEW_V1.createResolver(layout);
  const renderer = window.ABYSSAL_BUILDING_RENDERER_PREVIEW_V1;
  const state = { inside: false, x: doorCenter, y: doorInsideY, origin: null, searched: false, message: '', blocked: false, moving: false };
  let latestContext = null;

  function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function setPlayer(context, x, y) {
    state.x = x; state.y = y;
    context.setPosition?.(x, y);
  }
  function enter(context) {
    const entrance = context.entrance;
    state.origin = { x: entrance.x + entrance.w / 2, y: entrance.y + entrance.h + 28 };
    state.inside = true;
    state.moving = false;
    state.message = '门槛已穿过：室内墙体与货架碰撞已启用。';
    setPlayer(context, doorCenter, doorInsideY);
  }
  function leave(context) {
    const origin = state.origin || { x: 2432, y: 1116 };
    state.inside = false;
    state.origin = null;
    state.moving = false;
    state.message = '已回到街面。';
    context.setPosition?.(origin.x, origin.y);
  }
  function handleInteract(context) {
    if (!context?.player) return false;
    if (!state.inside) {
      const entrance = context.entrance;
      if (!entrance) return false;
      const centerX = entrance.x + entrance.w / 2;
      const thresholdY = entrance.y + 18;
      if (distance(context.player.x, context.player.y, centerX, thresholdY) > 150) return false;
      enter(context);
      return true;
    }

    if (distance(state.x, state.y, doorCenter, doorInsideY) < 72) {
      leave(context);
      return true;
    }
    if (distance(state.x, state.y, cabinet.x, cabinet.y) < cabinet.range) {
      state.searched = true;
      state.message = layout.clue.text;
      return true;
    }
    state.message = '靠近柜台检查记录，或走回南侧门口离开。';
    return true;
  }
  function handleDoorCrossing(context, intent) {
    if (state.inside || !context?.player || !context.entrance) return false;
    const entrance = context.entrance;
    const centerX = entrance.x + entrance.w / 2;
    const intentWorld = window.ABYSSAL_CAMERA_ADAPTER_V1?.worldIntentForScreenInput?.(intent?.x || 0, intent?.y || 0) || { x: 0, y: 0 };
    const aligned = Math.abs(context.player.x - centerX) <= entrance.w / 2 - 12;
    const crossedThreshold = context.player.y <= entrance.y + entrance.h + 40 && context.player.y >= entrance.y - 20;
    if (!aligned || !crossedThreshold || intentWorld.y >= -0.05) return false;
    enter(context);
    return true;
  }
  function currentAction(context) {
    if (!context?.player) return null;
    if (!state.inside) {
      const entrance = context.entrance;
      if (!entrance) return null;
      const centerX = entrance.x + entrance.w / 2;
      const thresholdY = entrance.y + entrance.h + 12;
      return distance(context.player.x, context.player.y, centerX, thresholdY) <= 150
        ? { id: 'enter', label: '进入 MIRE MART 室内', shortLabel: '进门' }
        : null;
    }
    if (distance(state.x, state.y, doorCenter, doorInsideY) < 96) {
      return { id: 'exit', label: '返回街面', shortLabel: '出门' };
    }
    if (distance(state.x, state.y, cabinet.x, cabinet.y) < cabinet.range + 18) {
      return { id: 'clue', label: state.searched ? '再次查看交班纸' : '检查柜台交班纸', shortLabel: '调查' };
    }
    return null;
  }
  function ensureActionButton() {
    let button = document.getElementById('aw-building-action-preview-v1');
    if (button) return button;
    const game = document.getElementById('game');
    if (!game) return null;
    let style = document.getElementById('aw-building-action-preview-style-v1');
    if (!style) {
      style = document.createElement('style');
      style.id = 'aw-building-action-preview-style-v1';
      style.textContent = `#game #aw-building-action-preview-v1{position:absolute!important;left:50%!important;bottom:calc(155px + env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;z-index:120!important;display:none;min-width:142px;min-height:42px;padding:9px 15px;border:1px solid #d6c28f;border-radius:6px;background:#18241df2;color:#fff8df;font:800 11px ui-monospace,monospace;letter-spacing:.04em;box-shadow:0 5px 18px #0009;pointer-events:auto;touch-action:manipulation;cursor:pointer}#game #aw-building-action-preview-v1:focus-visible{outline:2px solid #f5df9c;outline-offset:3px}`;
      document.head.appendChild(style);
    }
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'aw-building-action-preview-v1';
    button.textContent = '进门';
    button.addEventListener('pointerdown', event => {
      const access = window.ABYSSAL_SUCCESSOR_BUILDING_ACCESS_V1;
      if (!access?.interact?.()) return;
      window.frameElement?.focus?.({ preventScroll: true });
      button.focus?.({ preventScroll: true });
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    button.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
    game.appendChild(button);
    return button;
  }
  function updatePrompt(context) {
    if (!context?.player) return;
    latestContext = context;
    const button = ensureActionButton();
    if (!button) return;
    const prompt = document.getElementById('interactionPromptV12');
    if (prompt) { prompt.textContent = ''; prompt.style.display = 'none'; }
    const action = currentAction(context);
    state.action = action?.id || '';
    button.style.display = action ? 'block' : 'none';
    if (action) {
      button.textContent = action.shortLabel;
      button.setAttribute('aria-label', `${action.label}，或按 E`);
      button.title = `${action.label}（E）`;
    } else {
      button.removeAttribute('aria-label');
      button.removeAttribute('title');
    }
  }
  function step({ player, adapter, screenX = 0, screenY = 0, elapsed = 0, context }) {
    if (!state.inside) return false;
    const intent = adapter?.worldIntentForScreenInput?.(screenX, screenY) || { x: screenX, y: screenY };
    const length = Math.hypot(intent.x, intent.y) || 1;
    const scale = length > 1 ? 1 / length : 1;
    const speed = 142;
    const nextY = state.y + intent.y * scale * speed * elapsed;
    const inDoorLane = state.x >= ROOM.doorLeft + 12 && state.x <= ROOM.doorRight - 12;
    if (inDoorLane && intent.y > 0.05 && state.y >= doorInsideY - 16 && nextY >= ROOM.height - ROOM.wall + 8) {
      leave(context);
      return true;
    }
    const beforeX = state.x, beforeY = state.y;
    const moved = collision.resolveMove(state.x, state.y, intent.x * scale * speed * elapsed, intent.y * scale * speed * elapsed);
    state.x = moved.x; state.y = moved.y; state.blocked = moved.blocked;
    state.moving = Math.hypot(state.x - beforeX, state.y - beforeY) > .015;
    if (player) {
      player.x = state.x; player.y = state.y;
      if (state.moving) player.dir = Math.atan2(intent.y, intent.x);
    }
    return true;
  }
  const handledKeyboardEvents = new WeakSet();
  document.addEventListener('abyssal:interaction-intent', event => {
    if (!currentAction(latestContext)) return;
    if (window.ABYSSAL_SUCCESSOR_BUILDING_ACCESS_V1?.interact?.()) {
      event.preventDefault();
      const keyboardEvent = event.detail?.keyboardEvent;
      if (keyboardEvent) { handledKeyboardEvents.add(keyboardEvent); keyboardEvent.preventDefault(); }
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.repeat || String(event.key).toLowerCase() !== 'e' || handledKeyboardEvents.has(event)) return;
    if (!currentAction(latestContext) || window.ABYSSAL_SHELL_V1?.blocksGameInput?.(event)) return;
    if (window.ABYSSAL_SUCCESSOR_BUILDING_ACCESS_V1?.interact?.()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.ABYSSAL_BUILDING_INTERIOR_PREVIEW_V1 = Object.freeze({
    version: 1,
    guardedPreviewOnly: true,
    isInside: () => state.inside,
    handleInteract,
    handleDoorCrossing,
    updatePrompt,
    step,
    drawInterior: args => renderer.drawInterior(args, state),
    drawGrayboxExterior: args => renderer.drawGrayboxExterior(args),
    snapshot: () => ({ inside: state.inside, x: state.x, y: state.y, searched: state.searched, blocked: state.blocked, origin: state.origin && { ...state.origin } }),
  });
})();
