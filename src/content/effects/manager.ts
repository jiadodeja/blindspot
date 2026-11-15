import type { EffectSettings } from '../../shared/messages';

import { enableBlur, disableBlur, getBlur } from './blur';
import { enableGrayscale, disableGrayscale, getGrayscale } from './grayscale';
import { enableTunnel, disableTunnel } from './tunnel';
import { enableDyslexia, disableDyslexia } from './dyslexia';
import { enableTextScale, disableTextScale } from './textScale';
import { enableKeyboard, disableKeyboard } from './keyboard';
import { enableScreenReader, disableScreenReader } from './screenReader';

let filterStyle: HTMLStyleElement | null = null;

function updateFilter(): void {
  const blurPx = getBlur();
  const grayscale = getGrayscale();

  if (blurPx === 0 && grayscale === 0) {
    filterStyle?.remove();
    filterStyle = null;
    return;
  }

  if (!filterStyle?.isConnected) {
    filterStyle = document.createElement('style');
    filterStyle.setAttribute('data-blindspot', 'filters');
    document.documentElement.appendChild(filterStyle);
  }

  // A separate stylesheet leaves the page's own filter declarations untouched.
  filterStyle.textContent = `html { filter: blur(${blurPx}px) grayscale(${grayscale}%) !important; }`;
}

// Apply the complete state each time so effects can be combined and updated.
export function applyEffects(settings: EffectSettings): void {
  if (settings.blur.on) {
    enableBlur(settings.blur.blurPx);
  } else {
    disableBlur();
  }

  if (settings.grayscale.on) {
    enableGrayscale();
  } else {
    disableGrayscale();
  }

  updateFilter();

  if (settings.tunnelVision.on) {
    enableTunnel(settings.tunnelVision.radiusPx);
  } else {
    disableTunnel();
  }

  if (settings.dyslexia.on) {
    enableDyslexia(settings.dyslexia);
  } else {
    disableDyslexia();
  }

  if (settings.textScale.on) {
    enableTextScale(settings.textScale.percent);
  } else {
    disableTextScale();
  }

  if (settings.keyboardOnly.on) {
    enableKeyboard();
  } else {
    disableKeyboard();
  }

  if (settings.screenReader.on) {
    enableScreenReader();
  } else {
    disableScreenReader();
  }
}

export function resetEffects(): void {
  disableBlur();
  disableGrayscale();
  updateFilter();
  disableTunnel();
  disableDyslexia();
  disableTextScale();
  disableKeyboard();
  disableScreenReader();
}
