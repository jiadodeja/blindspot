// The side panel uses this to send a message to the web page it is looking at.
import type { PanelToContent, ContentReply } from '../shared/messages'

export async function sendToPage(message: PanelToContent): Promise<ContentReply> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || tab.id === undefined) return { ok: false, error: 'No active tab found.' }
  try {
    return (await chrome.tabs.sendMessage(tab.id, message)) as ContentReply
  } catch {
    // This happens on chrome:// pages, or on pages that were open before the extension loaded.
    return {
      ok: false,
      error: 'Cannot reach this page. Refresh the page and try again. Chrome system pages do not work.',
    }
  }
}
