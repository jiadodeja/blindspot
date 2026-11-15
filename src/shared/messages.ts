// Shared message types. Owned by Person C. Ask C before changing this file.
// The panel sends a message. The content script or background answers.

// ---------- Simulate tab (Person A) ----------

export interface EffectSettings {
  blur: { on: boolean; blurPx: number } // blurPx 0 to 10; independent of grayscale
  grayscale: { on: boolean }
  tunnelVision: { on: boolean; radiusPx: number } // radiusPx 40 to 300
  dyslexia: {
    on: boolean
    letterSpacingEm: number // 0 to 0.3
    wordSpacingEm: number // 0 to 0.6
    lineHeight: number // 1.2 to 2.4
    openDyslexicFont: boolean
  }
  textScale: { on: boolean; percent: number } // 100 to 200
  keyboardOnly: { on: boolean }
  screenReader: { on: boolean } // stretch goal
}

export const defaultEffects: EffectSettings = {
  blur: { on: false, blurPx: 4 },
  grayscale: { on: false },
  tunnelVision: { on: false, radiusPx: 90 },
  dyslexia: {
    on: false,
    letterSpacingEm: 0.12,
    wordSpacingEm: 0.3,
    lineHeight: 1.8,
    openDyslexicFont: false,
  },
  textScale: { on: false, percent: 150 },
  keyboardOnly: { on: false },
  screenReader: { on: false },
}

// ---------- Quick Fix tab (Person B) ----------

export type Impact = 'minor' | 'moderate' | 'serious' | 'critical'

export interface A11yIssue {
  id: string // example: "image-alt-0". Unique for this scan.
  ruleId: string // axe rule name, like "image-alt" or "color-contrast"
  impact: Impact
  help: string // short axe title
  description: string // longer axe text
  html: string // the element's outerHTML, cut to 1500 characters
  selector: string // CSS selector, for humans to read
  styles: { color: string; backgroundColor: string; fontSize: string }
}

// ---------- Messages: panel to content script ----------
// Send with chrome.tabs.sendMessage(tabId, message)

export type PanelToContent =
  | { type: 'APPLY_EFFECTS'; settings: EffectSettings }
  | { type: 'RESET_EFFECTS' }
  | { type: 'GET_EFFECTS' }
  | { type: 'SCAN_PAGE' }
  | { type: 'HIGHLIGHT_ISSUE'; issueId: string }
  | { type: 'PREVIEW_FIX'; issueId: string; fixedHtml: string }
  | { type: 'UNDO_PREVIEW'; issueId: string }
  | { type: 'GET_ELEMENT_RECT'; issueId: string } // for screenshot crop (stretch)

// ---------- Replies from the content script ----------

export type ContentReply =
  | { ok: true; type: 'EFFECTS'; settings: EffectSettings }
  | { ok: true; type: 'SCAN_RESULT'; issues: A11yIssue[] }
  | { ok: true; type: 'DONE' }
  | {
      ok: true
      type: 'ELEMENT_RECT'
      rect: { x: number; y: number; width: number; height: number }
      devicePixelRatio: number
    }
  | { ok: false; error: string }

// ---------- Messages: panel to background ----------
// Send with chrome.runtime.sendMessage(message)

export type PanelToBackground = { type: 'CAPTURE_TAB' } // stretch

export type BackgroundReply =
  | { ok: true; type: 'SCREENSHOT'; dataUrl: string }
  | { ok: false; error: string }

// ---------- AI backend: panel to Vercel ----------
// POST https://YOUR-APP.vercel.app/api/suggest-fix  (plain fetch from the panel)

export interface SuggestFixRequest {
  ruleId: string
  impact: Impact
  help: string
  html: string
  styles: { color: string; backgroundColor: string; fontSize: string }
  screenshotBase64?: string // stretch: small PNG, no "data:" prefix
}

export interface SuggestFixResponse {
  who: string // who this problem hurts, in plain words
  explanation: string // why it is a problem and what the fix does
  fixedHtml: string // the fixed element, ready to paste
}

// ---------- Challenge mode (stretch) ----------
export type ChallengeMessage =
  | { type: 'START_TRACKING' }
  | { type: 'STOP_TRACKING' }
// STOP_TRACKING replies: { ok: true, type: 'TRACKING_RESULT', clicks, tabPresses, ms }
