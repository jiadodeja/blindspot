import {
  defaultEffects,
  type EffectSettings,
  type PanelToContent,
  type ContentReply,
} from '../shared/messages';
import { applyEffects, resetEffects } from './effects/manager';

let currentSettings: EffectSettings = structuredClone(defaultEffects);

chrome.runtime.onMessage.addListener(
  (
    message: PanelToContent,
    _sender,
    sendResponse: (reply: ContentReply) => void,
  ) => {
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
          // Other messages belong to Quick Fix. Leave them to its handler.
          return false;
      }
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return false;
  },
);
