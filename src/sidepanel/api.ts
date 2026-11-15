// Person B: ask our Vercel function for a fix.
// We send ONLY the element's HTML, its colors, and the rule name. Nothing else leaves the page.
import type { A11yIssue, SuggestFixRequest, SuggestFixResponse } from '../shared/messages'
import { API_URL } from './config'

export async function suggestFix(issue: A11yIssue): Promise<SuggestFixResponse> {
  if (API_URL.includes('YOUR-APP')) {
    throw new Error('Set your Vercel domain in src/sidepanel/config.ts first.')
  }
  const body: SuggestFixRequest = {
    ruleId: issue.ruleId,
    impact: issue.impact,
    help: issue.help,
    html: issue.html,
    styles: issue.styles,
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || data.error || `Server error ${res.status}`)
  return data as SuggestFixResponse
}
