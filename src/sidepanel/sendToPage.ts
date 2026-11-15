// The side panel uses this to send a message to the web page it is looking at.
import type { PanelToContent, ContentReply } from '../shared/messages'

export async function sendToPage(message: PanelToContent, timeoutMs?: number): Promise<ContentReply> {
  async function request(): Promise<ContentReply> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab || tab.id === undefined) return { ok: false, error: 'No active tab found.' }
      const reply = await chrome.tabs.sendMessage(tab.id, message) as ContentReply | undefined
      if (!reply || typeof reply.ok !== 'boolean') {
        return { ok: false, error: 'No response from this page. Reload the extension and refresh the web page.' }
      }
      return reply
    } catch {
      // System pages and old tabs may not have a reachable content script.
      return {
        ok: false,
        error: 'Cannot reach this page. Refresh the page and try again. Chrome system pages do not work.',
      }
    }
  }

  // Simulate uses a deadline so a stale content script cannot lock its controls.
  // Quick Fix keeps its existing behavior: a scan can take longer to finish.
  if (timeoutMs === undefined) return request()

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      request(),
      new Promise<ContentReply>(resolve => {
        timer = setTimeout(() => resolve({
          ok: false,
          error: 'The page did not respond. Reload the extension and refresh the web page, then try again.',
        }), timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
