// Person B: the Quick Fix tab. Scan the page, then show a card for each problem.
import { useState } from 'react'
import { AlertTriangle, Sparkles } from 'lucide-react'
import ReportSection from './components/ReportSection'
import IssueCard from './IssueCard'
import type { A11yIssue } from '../shared/messages'
import { sendToPage } from './sendToPage'
import './quickfix.css'

export default function QuickFixTab() {
  const [issues, setIssues] = useState<A11yIssue[] | null>(null)
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState('')
  const [failed, setFailed] = useState(false)
  const [issuesOpen, setIssuesOpen] = useState(true)

  async function onScan() {
    setScanning(true)
    setFailed(false)
    setStatus('Scanning the page...')
    const reply = await sendToPage({ type: 'SCAN_PAGE' })
    if (reply.ok && reply.type === 'SCAN_RESULT') {
      setIssues(reply.issues)
      setIssuesOpen(true)
      const count = reply.issues.length
      setStatus(count === 0 ? 'No problems found.' : `${count} ${count === 1 ? 'problem' : 'problems'} found.`)
    } else if (!reply.ok) {
      setFailed(true)
      setStatus(reply.error)
    }
    setScanning(false)
  }

  return (
    <section className="tab-content ai-tab" aria-labelledby="ai-heading">
      <div className="mascot-intro">
        <div className="mascot-bg"><img src="/artwork/mascot.svg" alt="Spot, a friendly robot holding an open guide" /></div>
        <div className="speech-bubble"><span className="eyebrow">SPOT</span><h1 id="ai-heading">Accessibility Scan</h1><p>Scan this page, then ask AI for a fix.</p></div>
      </div>

      <button className="primary-button" type="button" onClick={onScan} disabled={scanning}>
        <Sparkles size={19} /> {scanning ? 'Scanning...' : issues ? 'Scan Again' : 'Scan Page'}
      </button>
      <p className={`scan-status ${failed ? 'error' : ''}`} role={failed ? 'alert' : 'status'}>{status}</p>

      {issues && issues.length > 0 && (
        <ReportSection title={`Problems (${issues.length})`} Icon={AlertTriangle} open={issuesOpen} onToggle={() => setIssuesOpen(v => !v)} theme="issues-header">
          {issues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
        </ReportSection>
      )}
    </section>
  )
}
