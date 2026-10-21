(() => {
  'use strict';

  const frame = document.querySelector('#game');
  const error = document.querySelector('#error');
  frame.tabIndex = 0;
  frame.addEventListener('load', () => {
    const childDocument = frame.contentDocument;
    childDocument?.addEventListener('pointerdown', event => {
      const target = event.target;
      if (target === childDocument.querySelector('canvas') || target?.closest?.('.successor-pad')) {
        frame.focus({ preventScroll: true });
      }
    }, { passive: true });
  });
  frame.addEventListener('error', () => {
    error.hidden = false;
    frame.hidden = true;
  });

  const runtime = new URL('../../survival-v21.html?awView=34', location.href);
  frame.src = runtime.href;
})();
