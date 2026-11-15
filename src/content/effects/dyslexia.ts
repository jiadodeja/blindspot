import type { EffectSettings } from '../../shared/messages';

// Illustrative visual stress, not a representation of how dyslexia looks.
type WrappedText = { original: Text; wrapper: HTMLSpanElement; text: string };
const wrapped: WrappedText[] = [];
const blocks = new Map<Element, string | null>();
let style: HTMLStyleElement | null = null;
const SKIP = [
  'script', 'style', 'noscript', 'template', 'input', 'textarea', 'select', 'option',
  'svg', 'math',
  '[contenteditable]:not([contenteditable="false"])', '[role="textbox"]',
  '[hidden]', '[aria-hidden="true"]', '[data-blindspot]',
  '[data-blindspot-reading]',
].join(',');
// Bound extra animated spans per text node, rather than starving later page text.
const MAX_MOVING_LETTERS_PER_NODE = 12;
let observer: MutationObserver | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
const observeOptions = {
  childList: true, subtree: true, characterData: true, attributes: true,
  attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
};

function bounded(value: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function enableDyslexia(settings: EffectSettings['dyslexia']): void {
  if (!document.body) return;
  const firstEnable = !style?.isConnected;
  if (firstEnable) {
    style = document.createElement('style');
    style.setAttribute('data-blindspot', 'dyslexia');
    document.documentElement.appendChild(style);
  }
  const letterSpacing = bounded(settings.letterSpacingEm, -0.08, 0, -0.04);
  const wordSpacing = bounded(settings.wordSpacingEm, -0.2, 0, -0.12);
  const lineHeight = bounded(settings.lineHeight, 0.95, 1.4, 1.1);
  style!.textContent = `
    [data-blindspot-reading] {
      letter-spacing: ${letterSpacing}em !important;
      word-spacing: ${wordSpacing}em !important;
      line-height: ${lineHeight} !important;
      text-shadow: 0.7px 0.4px 0.6px currentColor !important;
    }
    [data-blindspot-reading-block="active"] {
      line-height: ${lineHeight} !important;
    }
    [data-blindspot-reading-letter] {
      display: inline-block !important;
      animation: blindspot-reading-wobble 2.8s ease-in-out infinite !important;
      transform-origin: center;
      animation-delay: var(--blindspot-reading-delay, 0s) !important;
    }
    [data-blindspot-reading-letter="flip"] {
      animation-name: blindspot-reading-flip !important;
    }
    @keyframes blindspot-reading-wobble {
      0%, 100% { transform: translate(0, 0); }
      35% { transform: translate(1.5px, -1.5px) rotate(8deg); }
      70% { transform: translate(-1.5px, 1px) rotate(-8deg); }
    }
    @keyframes blindspot-reading-flip {
      0%, 15%, 90%, 100% { transform: rotateY(0deg); }
      35%, 65% { transform: rotateY(180deg) translateY(-1px); }
    }
    @media (prefers-reduced-motion: reduce) {
      [data-blindspot-reading-letter] { animation: none !important; }
      [data-blindspot-reading-letter="flip"] { transform: scaleX(-1); }
    }
  `;
  // Other controls re-apply the full settings; never rebuild existing spans.
  if (!firstEnable) return;
  refreshText();
  observer = new MutationObserver(() => {
    if (refreshTimer !== undefined) return;
    refreshTimer = setTimeout(() => {
      refreshTimer = undefined;
      if (style?.isConnected) refreshText();
    }, 100);
  });
  observer.observe(document.body, observeOptions);
}

function refreshText(): void {
  // Do not observe our own wrappers, or the observer would trigger itself forever.
  observer?.disconnect();
  try {
    wrapText();
  } finally {
    if (document.body) observer?.observe(document.body, observeOptions);
  }
}

function wrapText(): void {
  // Forget content that a live page has removed, rather than retaining old trees.
  for (let index = wrapped.length - 1; index >= 0; index--) {
    if (!wrapped[index].wrapper.isConnected) wrapped.splice(index, 1);
  }
  for (const block of blocks.keys()) if (!block.isConnected) blocks.delete(block);
  // Collect first, then edit. Mutating a TreeWalker while iterating skips nodes.
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (true) {
    const node = walker.nextNode() as Text | null;
    if (!node) break;
    const parent = node.parentElement;
    if (!parent || !node.data.trim() || parent.closest(SKIP) || parent.isContentEditable) continue;
    const css = getComputedStyle(parent);
    if (css.visibility !== 'visible' || (css.display !== 'contents' && parent.getClientRects().length === 0)) continue;
    nodes.push(node);
  }

  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  for (const original of nodes) {
    const text = original.data;
    const block = original.parentElement?.closest('p, li, blockquote, h1, h2, h3, h4, h5, h6');
    if (block && !blocks.has(block)) {
      blocks.set(block, block.getAttribute('data-blindspot-reading-block'));
      block.setAttribute('data-blindspot-reading-block', 'active');
    }
    const wrapper = document.createElement('span');
    wrapper.setAttribute('data-blindspot-reading', '');
    let plain = '';
    let movingLetters = 0;
    for (const { segment, index } of segmenter.segment(text)) {
      if (/\p{L}/u.test(segment) && (movingLetters === 0 || Math.random() < 0.15)) {
        if (plain) { wrapper.appendChild(document.createTextNode(plain)); plain = ''; }
        const letter = document.createElement('span');
        letter.setAttribute('data-blindspot-reading-letter', movingLetters % 2 === 0 ? 'flip' : 'wobble');
        letter.textContent = segment;
        letter.style.setProperty('--blindspot-reading-delay', `${-(movingLetters % 12) * 0.2}s`);
        wrapper.appendChild(letter);
        movingLetters++;
        if (movingLetters === MAX_MOVING_LETTERS_PER_NODE) {
          plain = text.slice(index + segment.length);
          break;
        }
      } else {
        plain += segment;
      }
    }
    if (plain) wrapper.appendChild(document.createTextNode(plain));
    original.replaceWith(wrapper);
    wrapped.push({ original, wrapper, text });
  }
}

export function disableDyslexia(): void {
  observer?.disconnect();
  observer = null;
  clearTimeout(refreshTimer);
  refreshTimer = undefined;
  for (const { original, wrapper, text } of wrapped) {
    if (!wrapper.parentNode) continue; // The page may have replaced this content.
    // Preserve text changes made by the page, including changes to the detached original.
    if (original.data === text) original.data = wrapper.textContent ?? '';
    wrapper.replaceWith(original);
  }
  wrapped.length = 0;
  for (const [block, previous] of blocks) {
    if (block.getAttribute('data-blindspot-reading-block') !== 'active') continue;
    if (previous === null) block.removeAttribute('data-blindspot-reading-block');
    else block.setAttribute('data-blindspot-reading-block', previous);
  }
  blocks.clear();
  style?.remove();
  style = null;
}
