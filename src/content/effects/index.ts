// Person A: Simulate message handling and per-page settings.
// Return true for handled messages so the shared router does not call Quick Fix.
import {
  defaultEffects,
  type EffectSettings,
  type PanelToContent,
  type ContentReply,
} from '../../shared/messages';
import { applyEffects, resetEffects } from './manager';

let currentSettings: EffectSettings = structuredClone(defaultEffects);

export function handleEffects(
  message: PanelToContent,
  sendResponse: (reply: ContentReply) => void,
): boolean {
  try {
    switch (message.type) {
      case 'APPLY_EFFECTS':
        applyEffects(message.settings);
        currentSettings = structuredClone(message.settings);
        sendResponse({ ok: true, type: 'DONE' });
        break;

      case 'RESET_EFFECTS':
        resetEffects();
        currentSettings = structuredClone(defaultEffects);
        sendResponse({ ok: true, type: 'DONE' });
        break;

      case 'GET_EFFECTS':
        sendResponse({
          ok: true,
          type: 'EFFECTS',
          settings: structuredClone(currentSettings),
        });
        break;

      default:
        return false;
    }
  } catch (error) {
    sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return true;
}
