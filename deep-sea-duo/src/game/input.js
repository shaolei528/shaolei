import { normalize } from './math.js';

const MOVE_ZONE_MAX_X = 0.5;
const SWIPE_RADIUS = 0.16;
const SWIPE_DEAD_ZONE = 0.025;

export function directionFromDrag(start, current, radius = SWIPE_RADIUS, deadZone = SWIPE_DEAD_ZONE) {
  if (!start || !current || radius <= 0) return { x: 0, y: 0 };
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance < deadZone) return { x: 0, y: 0 };
  const scaledX = dx / radius;
  const scaledY = dy / radius;
  const magnitude = Math.hypot(scaledX, scaledY);
  if (magnitude <= 1) return { x: scaledX, y: scaledY };
  return normalize(scaledX, scaledY);
}

export function createInput(canvas) {
  const input = {
    movement: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    firing: false,
    dash: false,
  };
  const pressedKeys = new Set();
  let movementPointer = null;
  let aimPointer = null;
  let movementStart = null;
  let aimStart = null;
  let touchMovement = { x: 0, y: 0 };

  function position(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0.5, y: 0.5 };
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  function keyboardMovement() {
    const x = (pressedKeys.has('d') ? 1 : 0) - (pressedKeys.has('a') ? 1 : 0);
    const y = (pressedKeys.has('s') ? 1 : 0) - (pressedKeys.has('w') ? 1 : 0);
    return normalize(x, y);
  }

  function syncMovement() {
    input.movement = movementPointer === null ? keyboardMovement() : touchMovement;
  }

  function updateMovement(event) {
    touchMovement = directionFromDrag(movementStart, position(event));
    syncMovement();
  }

  function updateAim(event) {
    const direction = directionFromDrag(aimStart, position(event));
    if (direction.x || direction.y) input.aim = normalize(direction.x, direction.y);
    input.firing = true;
  }

  function releasePointer(pointerId) {
    if (pointerId === movementPointer) {
      movementPointer = null;
      movementStart = null;
      touchMovement = { x: 0, y: 0 };
      syncMovement();
    }
    if (pointerId === aimPointer) {
      aimPointer = null;
      aimStart = null;
      input.firing = false;
    }
  }

  function reset() {
    movementPointer = null;
    aimPointer = null;
    movementStart = null;
    aimStart = null;
    touchMovement = { x: 0, y: 0 };
    pressedKeys.clear();
    input.movement = { x: 0, y: 0 };
    input.firing = false;
    input.dash = false;
  }

  canvas.addEventListener('pointerdown', event => {
    const point = position(event);
    try { canvas.setPointerCapture(event.pointerId); } catch {}
    if (point.x < MOVE_ZONE_MAX_X && movementPointer === null) {
      movementPointer = event.pointerId;
      movementStart = point;
      touchMovement = { x: 0, y: 0 };
      syncMovement();
      return;
    }
    if (aimPointer === null) {
      aimPointer = event.pointerId;
      aimStart = point;
      input.firing = true;
    }
  });

  canvas.addEventListener('pointermove', event => {
    if (event.pointerId === movementPointer) updateMovement(event);
    if (event.pointerId === aimPointer) updateAim(event);
  });
  canvas.addEventListener('pointerup', event => releasePointer(event.pointerId));
  canvas.addEventListener('pointercancel', event => releasePointer(event.pointerId));
  canvas.addEventListener('lostpointercapture', event => releasePointer(event.pointerId));

  window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if ('wasd'.includes(key)) {
      pressedKeys.add(key);
      syncMovement();
    }
    if (event.key === ' ') {
      event.preventDefault();
      input.dash = true;
    }
  });
  window.addEventListener('keyup', event => {
    const key = event.key.toLowerCase();
    if ('wasd'.includes(key)) {
      pressedKeys.delete(key);
      syncMovement();
    }
  });
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') reset();
  });

  return {
    input,
    reset,
    requestDash() { input.dash = true; },
    consumeDash() {
      const active = input.dash;
      input.dash = false;
      return active;
    },
    frame() {
      return {
        movement: { ...input.movement },
        aim: { ...input.aim },
        firing: input.firing,
        dash: this.consumeDash(),
      };
    },
  };
}
