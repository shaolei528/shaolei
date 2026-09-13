import { normalize } from './math.js';

export function createInput(canvas) {
  const input = { movement: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, firing: false, dash: false };
  let movementPointer = null;
  let aimPointer = null;
  function position(event) {
    const rect = canvas.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width; const y = (event.clientY - rect.top) / rect.height;
    return { x, y };
  }
  function updateMovement(event) { const point = position(event); input.movement = normalize((point.x - 0.24) / 0.24, (point.y - 0.7) / 0.25); }
  function updateAim(event) { const point = position(event); input.aim = normalize(point.x - 0.72, point.y - 0.52); input.firing = true; }
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    if (position(e).x < 0.47 && movementPointer === null) { movementPointer = e.pointerId; updateMovement(e); }
    else if (aimPointer === null) { aimPointer = e.pointerId; updateAim(e); }
  });
  canvas.addEventListener('pointermove', e => { if (e.pointerId === movementPointer) updateMovement(e); if (e.pointerId === aimPointer) updateAim(e); });
  function end(e) { if (e.pointerId === movementPointer) { movementPointer = null; input.movement = { x: 0, y: 0 }; } if (e.pointerId === aimPointer) { aimPointer = null; input.firing = false; } }
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  window.addEventListener('keydown', e => { const key = e.key.toLowerCase(); if (key === 'w') input.movement.y = -1; if (key === 's') input.movement.y = 1; if (key === 'a') input.movement.x = -1; if (key === 'd') input.movement.x = 1; if (key === ' ') input.dash = true; });
  window.addEventListener('keyup', e => { if ('wasd'.includes(e.key.toLowerCase())) input.movement = { x: 0, y: 0 }; });
  return { input, consumeDash() { const active = input.dash; input.dash = false; return active; } };
}
