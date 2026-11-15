import type { EffectSettings } from '../../shared/messages';

import { enableBlur, disableBlur } from './blur';
import { enableGrayscale, disableGrayscale } from './grayscale';
import { enableTunnel, disableTunnel } from './tunnel';
import { enableDyslexia, disableDyslexia } from './dyslexia';
import { enableTextScale, disableTextScale } from './textScale';
import { enableKeyboard, disableKeyboard } from './keyboard';
import { enableScreenReader, disableScreenReader } from './screenReader';

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
  disableTunnel();
  disableDyslexia();
  disableTextScale();
  disableKeyboard();
  disableScreenReader();
}
