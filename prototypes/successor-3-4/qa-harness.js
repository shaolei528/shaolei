(() => {
  'use strict';
  if (window.AW_SUCCESSOR_PREVIEW !== true || window.AW_DEV_QA !== true) return;
  const bridge = window.ABYSSAL_SUCCESSOR_QA_BRIDGE_V1;
  if (!bridge) throw new Error('Successor QA bridge is unavailable');

  let input = null;
  let remaining = 0;
  let label = 'idle';
  let sequence = [];
  let sequenceIndex = 0;
  let sequenceLabel = '';
  function setStep(name, x, y, duration = .05) {
    stop('new step');
    label = String(name);
    input = { x: Number(x) || 0, y: Number(y) || 0 };
    remaining = Math.max(0, Math.min(1.25, Number(duration) || .05));
  }
  function beginSequence(name, steps) {
    stop('new sequence');
    sequenceLabel = String(name);
    sequence = Array.isArray(steps) ? steps.map(step => ({ ...step })) : [];
    sequenceIndex = 0;
    beginNextStep();
  }
  function beginNextStep() {
    const step = sequence[sequenceIndex++];
    if (!step) { stop('sequence complete'); label = `${sequenceLabel} complete`; return; }
    label = `${sequenceLabel}: ${step.label || sequenceIndex}`;
    input = { x: Number(step.x) || 0, y: Number(step.y) || 0 };
    remaining = Math.max(0, Math.min(1.25, Number(step.duration) || .05));
  }
  function stop(reason = 'stopped') {
    input = null;
    remaining = 0;
    sequence = [];
    sequenceIndex = 0;
    label = String(reason);
  }
  function advance(dt, state = {}) {
    if (!state.active) { stop('inactive'); return; }
    if (sequenceLabel === 'RETURN QA' && state.inCamp === true) { stop('returned to camp'); return; }
    if (!input) return;
    remaining -= Math.max(0, Number(dt) || 0);
    if (remaining <= 0) {
      input = null;
      if (sequence.length) beginNextStep();
      else label = `${label} complete`;
    }
  }
  function currentInput() { return input; }
  window.ABYSSAL_PREVIEW_QA_V1 = Object.freeze({ currentInput, setStep, beginSequence, advance, stop });
  if (window.AW_SHOW_SUCCESSOR_QA_CONTROLS === false) return;

  const panel = document.createElement('section');
  panel.className = 'successor-qa-harness';
  panel.setAttribute('aria-label', 'Developer QA controls');
  Object.assign(panel.style, { position: 'fixed', zIndex: '9999', top: '8px', left: '8px', maxWidth: 'min(440px, calc(100vw - 16px))', padding: '8px', color: '#edf3e6', background: '#101a18ed', border: '1px solid #9ab3a2', borderRadius: '6px', font: '12px ui-monospace, monospace' });
  const status = document.createElement('output');
  status.className = 'successor-qa-status';
  status.setAttribute('aria-live', 'polite');
  panel.appendChild(status);
  const controls = document.createElement('div');
  Object.assign(controls.style, { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' });
  panel.appendChild(controls);
  function button(text, action) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = text;
    element.addEventListener('click', action);
    controls.appendChild(element);
    return element;
  }
  const locations = [
    ['HOME', '1:1', 2400, 2470],
    ['WOOD QA', '1:1', 2050, 2255],
    ['WOOD 2 QA', '1:1', 2065, 2560],
    ['WOOD 3 QA', '1:1', 2160, 2720],
    ['WOOD 4 QA', '1:1', 2735, 2560],
    ['STONE QA', '1:1', 2100, 2650],
    ['STONE 2 QA', '1:1', 2040, 2440],
    // Use the seeded stone outside CAMP; the nearby inner stone overlaps farm interaction range.
    ['STONE 3 QA', '1:1', 2865, 2835],
    ['WORKBENCH QA', '1:1', 2195, 2535],
    ['MIRE MART QA', '1:0', 2400, 1200],
    ['LOOT QA', '1:0', 2630, 1008],
    ['FIGHT QA', '1:0', 2244, 1248],
  ];
  for (const [name, zone, x, y] of locations) button(name, () => bridge.teleport(name, zone, x, y));
  button('POOL QA', () => {
    const body = window.ABYSSAL_WATER_BODIES_V1?.getBody?.('camp-pool');
    if (!body) { label = 'POOL QA unavailable'; return; }
    bridge.teleport('POOL QA', body.zone, body.access.x, body.access.y);
  });
  for (const [name, x, y] of [['STEP W', -1, 0], ['STEP E', 1, 0], ['STEP N', 0, -1], ['STEP S', 0, 1]])
    button(name, () => bridge.setStep(name, x, y, .65));
  button('WORLD N STEP', () => {
    const projected = window.ABYSSAL_CAMERA_ADAPTER_V1.project(0, -1);
    const length = Math.hypot(projected.x, projected.y) || 1;
    bridge.setStep('WORLD N STEP', projected.x / length, projected.y / length, .65);
  });
  button('ROUTE QA', () => beginSequence('ROUTE QA', [
    { label: 'north', x: 0, y: -1, duration: .65 }, { label: 'east', x: 1, y: 0, duration: .65 }, { label: 'south', x: 0, y: 1, duration: .65 },
  ]));
  button('RETURN QA', () => beginSequence('RETURN QA', Array.from({ length: 18 }, (_, index) => ({ label: `southwest ${index + 1}`, x: -.94, y: .34, duration: 1.25 }))));
  button('STOP', () => bridge.stop('manual stop'));
  document.body.appendChild(panel);

  function updateStatus() {
    const state = bridge.snapshot();
    const hurtGrace = window.ABYSSAL_SURVIVAL_HURT_GRACE_V1?.snapshot?.() || {};
    const target = window.ABYSSAL_INTERACTION_V12?.getTarget?.();
    const work = target?.type === 'resource' && target.resource
      ? window.ABYSSAL_RESOURCE_WORK_V1?.progressFor?.(target.resource.id) || 0
      : 0;
    status.textContent = `QA · ${label} · ${state.zone} (${state.x},${state.y}) · tick ${state.ticks} · collision ${state.collision} · target ${state.target||'-'} · event ${state.event} · mobs ${state.liveMobs} · windups ${state.windups} · nearest ${state.nearest} ${state.foe||''} · grace ${Math.ceil(hurtGrace.remainingMs||0)}ms / suppressed ${hurtGrace.suppressedHits||0} · ${state.active ? 'ACTIVE' : 'INACTIVE'}`;
    status.textContent += ` · work ${work}`;
    requestAnimationFrame(updateStatus);
  }
  requestAnimationFrame(updateStatus);
})();
