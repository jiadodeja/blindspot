import { useState } from 'react';
import { Glasses, Sparkles } from 'lucide-react';
import BrandHeader from './components/BrandHeader';
import SimulateTab from './SimulateTab';
import QuickFixTab from './QuickFixTab';

export default function App() {
  const [tab, setTab] = useState<'simulate' | 'quickfix'>('simulate');
  return (
    <main className="panel-stage">
      <div className="app-shell">
        <BrandHeader />
        <div className="surface">
          <nav className="tabs" aria-label="Blindspot tools">
            <button type="button" className={`tab-button ${tab === 'simulate' ? 'active' : ''}`} aria-current={tab === 'simulate' ? 'page' : undefined} onClick={() => setTab('simulate')}><Glasses size={19} /> Simulate</button>
            <button type="button" className={`tab-button ${tab === 'quickfix' ? 'active' : ''}`} aria-current={tab === 'quickfix' ? 'page' : undefined} onClick={() => setTab('quickfix')}><Sparkles size={19} /> Quick Fix</button>
          </nav>
          <div className="tab-pane" hidden={tab !== 'simulate'}><SimulateTab /></div>
          <div className="tab-pane" hidden={tab !== 'quickfix'}><QuickFixTab /></div>
        </div>
      </div>
    </main>
  );
}
