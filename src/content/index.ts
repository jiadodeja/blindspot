// The content script runs inside the web page.
// It listens for messages from the side panel and hands them to the right file.
//   Person A owns src/content/effects/index.ts  (Simulate tab)
//   Person B owns src/content/quickfix/index.ts (Quick Fix tab)
// Each handler returns true if it handled the message.
import type { PanelToContent, ContentReply } from '../shared/messages'
import { handleEffects } from './effects'
import { handleQuickFix } from './quickfix'

chrome.runtime.onMessage.addListener(
  (message: PanelToContent, _sender, sendResponse: (reply: ContentReply) => void) => {
    // returning true tells Chrome we will answer later (async)
    return handleEffects(message, sendResponse) || handleQuickFix(message, sendResponse)
  },
)
