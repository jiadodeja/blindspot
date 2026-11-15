// Person B: handles the Quick Fix messages that come from the side panel.
import type { PanelToContent, ContentReply } from '../../shared/messages'
import { scanPage } from './scan'
import { highlight, previewFix, undoPreview } from './preview'

type Reply = (reply: ContentReply) => void

// small helper: turn "error text or null" into a reply
function answer(error: string | null, sendResponse: Reply) {
  sendResponse(error ? { ok: false, error } : { ok: true, type: 'DONE' })
}

// returns true if this file handled the message
export function handleQuickFix(message: PanelToContent, sendResponse: Reply): boolean {
  switch (message.type) {
    case 'SCAN_PAGE':
      scanPage()
        .then((issues) => sendResponse({ ok: true, type: 'SCAN_RESULT', issues }))
        .catch((err) => sendResponse({ ok: false, error: 'Scan failed: ' + String(err) }))
      return true // we answer later
    case 'HIGHLIGHT_ISSUE':
      answer(highlight(message.issueId), sendResponse)
      return true
    case 'PREVIEW_FIX':
      answer(previewFix(message.issueId, message.fixedHtml), sendResponse)
      return true
    case 'UNDO_PREVIEW':
      answer(undoPreview(message.issueId), sendResponse)
      return true
    default:
      return false
  }
}
