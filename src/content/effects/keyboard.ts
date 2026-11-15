// Restrict page input to the keyboard while preserving native focus and scrolling.
let focusStyle: HTMLStyleElement | null = null;
let listening = false;

const pointerEvents = [
  'pointerdown', 'pointerup', 'pointermove',
  'mousedown', 'mouseup', 'mousemove',
  'click', 'dblclick', 'auxclick', 'contextmenu',
  'wheel', 'touchstart', 'touchmove', 'touchend', 'dragstart', 'drop',
] as const;
const listenerOptions = { capture: true, passive: false };

function blockPointerInput(event: Event): void {
  // Enter/Space and assistive technology activate controls with zero-detail clicks.
  // Those must still work, including buttons that call .click() from a key handler.
  if (event.type === 'click' && (event as MouseEvent).detail === 0) return;

  event.preventDefault();
  event.stopImmediatePropagation();
}

export function enableKeyboard(): void {
  if (!listening) {
    for (const type of pointerEvents) {
      document.addEventListener(type, blockPointerInput, listenerOptions);
    }
    listening = true;
  }

  // applyEffects runs for every control change. Reuse the stylesheet each time.
  if (focusStyle?.isConnected) return;

  focusStyle = document.createElement('style');
  focusStyle.setAttribute('data-blindspot', 'keyboard');
  focusStyle.textContent = `
    :root :focus {
      outline: 3px solid #6d28d9 !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 3px #fff !important;
    }
  `;
  document.documentElement.appendChild(focusStyle);
}

export function disableKeyboard(): void {
  if (listening) {
    for (const type of pointerEvents) {
      document.removeEventListener(type, blockPointerInput, listenerOptions);
    }
    listening = false;
  }
  // Removing only our stylesheet restores the page's own focus styling.
  focusStyle?.remove();
  focusStyle = null;
}
