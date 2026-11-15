// Person B: one card for one accessibility problem.
// Show on page, Suggest fix (AI), Preview / Undo on the live page, Copy code.
import { useState } from 'react'
import { AlertTriangle, Check, Clipboard, Contrast, Eye, Image as ImageIcon, Keyboard, Sparkles, Undo2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { A11yIssue, Impact, SuggestFixResponse } from '../shared/messages'
import { sendToPage } from './sendToPage'
import { suggestFix } from './api'
import { plainRule } from './ruleText'

// critical and serious look "high" (red). The word on the badge is the real axe level.
const SEVERITY_CLASS: Record<Impact, string> = { critical: 'high', serious: 'high', moderate: 'medium', minor: 'low' }

function iconFor(ruleId: string): LucideIcon {
  if (ruleId.includes('image') || ruleId.includes('alt')) return ImageIcon
  if (ruleId.includes('contrast')) return Contrast
  if (ruleId.includes('name') || ruleId.includes('label') || ruleId.includes('link')) return Keyboard
  return AlertTriangle
}

export default function IssueCard({ issue }: { issue: A11yIssue }) {
  const [fix, setFix] = useState<SuggestFixResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState('') // errors show here

  const Icon = iconFor(issue.ruleId)
  const high = issue.impact === 'critical' || issue.impact === 'serious'
  const words = plainRule(issue)

  async function onSuggest() {
    setLoading(true)
    setMessage('')
    try {
      setFix(await suggestFix(issue))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    }
    setLoading(false)
  }

  async function onPreview() {
    if (!fix) return
    const reply = await sendToPage({ type: 'PREVIEW_FIX', issueId: issue.id, fixedHtml: fix.fixedHtml })
    if (reply.ok) {
      setPreviewing(true)
      setMessage('')
    } else {
      setMessage(reply.error)
    }
  }

  async function onUndo() {
    const reply = await sendToPage({ type: 'UNDO_PREVIEW', issueId: issue.id })
    if (reply.ok) setPreviewing(false)
    else setMessage(reply.error)
  }

  async function onCopy() {
    if (!fix) return
    try {
      await navigator.clipboard.writeText(fix.fixedHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setMessage('Could not copy. Select the code and copy it by hand.')
    }
  }

  async function onShow() {
    const reply = await sendToPage({ type: 'HIGHLIGHT_ISSUE', issueId: issue.id })
    if (!reply.ok) setMessage(reply.error)
  }

  return (
    <article className="issue-card">
      <div className="issue-row">
        <span className={`issue-icon ${high ? 'red' : 'amber'}`}><Icon size={21} /></span>
        <span className="issue-copy">
          <strong>{words.title}</strong>
          <small>{words.detail}</small>
        </span>
        <span className={`severity ${SEVERITY_CLASS[issue.impact]}`}>{issue.impact}</span>
      </div>

      <div className="issue-actions">
        <button type="button" className="mini-button" onClick={onShow}><Eye size={13} /> Show on page</button>
        {!fix && (
          <button type="button" className="mini-button strong" onClick={onSuggest} disabled={loading}>
            <Sparkles size={13} /> {loading ? 'Asking AI...' : 'Suggest fix'}
          </button>
        )}
      </div>

      {fix && (
        <div className="fix-box">
          <p><strong>Who it hurts:</strong> {fix.who}</p>
          <p>{fix.explanation}</p>
          <pre><code>{fix.fixedHtml}</code></pre>
          <div className="issue-actions">
            {issue.canPreview && (previewing
              ? <button type="button" className="mini-button" onClick={onUndo}><Undo2 size={13} /> Undo preview</button>
              : <button type="button" className="mini-button strong" onClick={onPreview}><Eye size={13} /> Preview</button>)}
            <button type="button" className="mini-button" onClick={onCopy}>
              {copied ? <Check size={13} /> : <Clipboard size={13} />} {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>
        </div>
      )}

      {message && <p className="card-error" role="alert">{message}</p>}
    </article>
  )
}
