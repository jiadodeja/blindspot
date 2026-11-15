import { useState } from 'react';
import { AlertTriangle, Check, Clipboard, Sparkles } from 'lucide-react';
import ReportSection from './components/ReportSection';
import IssueCard from './IssueCard';
import { sampleIssues, sampleFixes } from './fixtures/quickfix';

export default function QuickFixTab() {
  const [scanned, setScanned] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(true);
  const [fixesOpen, setFixesOpen] = useState(true);
  const [copyError, setCopyError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  async function copyFix(id: number, code: string) {
    try { await navigator.clipboard.writeText(code); setCopied(id); setCopyError(''); }
    catch { setCopied(null); setCopyError('Could not copy. Select the example code and copy it manually.'); }
  }

  return (
    <section className="tab-content ai-tab" aria-labelledby="ai-heading">
      <div className="mascot-intro">
        <div className="mascot-bg"><img src="/artwork/mascot.svg" alt="Friendly robot accessibility assistant holding an open guide" /></div>
        <div className="speech-bubble"><span className="eyebrow">YOUR AI COMPANION</span><h1 id="ai-heading">Accessibility Scan</h1><p>Explore sample issues and AI-suggested fixes.</p></div>
      </div>
      <button className="primary-button" type="button" onClick={() => { setScanned(true); setIssuesOpen(true); setFixesOpen(true); }}><Sparkles size={19} /> {scanned ? 'Show Samples Again' : 'Show Sample Scan'}</button>
      {!scanned && <p className="demo-note scan-note">Click Show Sample Scan to display sample results. No real scan or AI request is performed.</p>}
      {scanned && <p className="sample-label"><Check size={14} /> Sample scan complete · 3 example findings</p>}

      {scanned && <>
      <ReportSection title={`Accessibility Issues (${sampleIssues.length})`} Icon={AlertTriangle} open={issuesOpen} onToggle={() => setIssuesOpen(v => !v)} theme="issues-header">
        {sampleIssues.map(issue => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </ReportSection>

      <ReportSection title="AI-Suggested Fixes" Icon={Sparkles} open={fixesOpen} onToggle={() => setFixesOpen(v => !v)} theme="fixes-header">
        {sampleFixes.map(fix => (
          <div className="fix-row" key={fix.id}>
            <span className="fix-icon"><fix.Icon size={20} /></span>
            <span className="fix-copy"><strong>{fix.title}</strong><div className="code-line"><code>{fix.code}</code><button type="button" title={copied === fix.id ? 'Copied' : 'Copy suggested code'} aria-label={`Copy fix: ${fix.title}`} onClick={() => void copyFix(fix.id, fix.code)}>{copied === fix.id ? <Check size={15} /> : <Clipboard size={15} />}</button></div></span>
          </div>
        ))}
      </ReportSection>
      {copied !== null && <p className="demo-note" role="status">Example code copied.</p>}
      {copyError && <p className="demo-note" role="alert">{copyError}</p>}
      </>}
      <p className="demo-note">Example findings and code are placeholders, not verified fixes. Connect your scanner and AI backend later.</p>
    </section>
  );
}
