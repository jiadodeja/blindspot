import { useState } from 'react';
import { Accessibility, Eye, Focus, Glasses, Keyboard, Maximize2, RotateCcw, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Switch from './components/Switch';

type ModeId = 'vision' | 'tunnel' | 'reading' | 'keyboard' | 'screenreader';

type Mode = {
  id: ModeId;
  title: string;
  description: string;
  Icon: LucideIcon;
  accent: string;
};

const modes: Mode[] = [
  { id: 'vision', title: 'Low Vision / Grayscale', description: 'Reduced clarity and color perception', Icon: Eye, accent: 'lilac' },
  { id: 'tunnel', title: 'Tunnel Vision', description: 'Limited peripheral vision', Icon: Focus, accent: 'blue' },
  { id: 'reading', title: 'Reading Accessibility', description: 'Dyslexia-friendly font and spacing', Icon: Type, accent: 'mint' },
  { id: 'keyboard', title: 'Keyboard-Only Navigation', description: 'Navigate without using a mouse', Icon: Keyboard, accent: 'peach' },
  { id: 'screenreader', title: 'Screen Reader (Audio-Only)', description: 'Hear how your site is read aloud', Icon: Glasses, accent: 'lilac' },
];

export default function SimulateTab() {
  const [enabled, setEnabled] = useState<Record<ModeId, boolean>>({ vision: false, tunnel: false, reading: false, keyboard: false, screenreader: false });
  const [scale, setScale] = useState('100');

  const reset = () => { setEnabled({ vision: false, tunnel: false, reading: false, keyboard: false, screenreader: false }); setScale('100'); };

  return (
    <section className="tab-content" aria-labelledby="simulate-heading">
      <div className="section-intro">
        <span className="eyebrow"><Accessibility size={14} /> EXPERIENCE</span>
        <h1 id="simulate-heading">Experience Accessibility</h1>
        <p>Try your site through different accessibility lenses and discover barriers firsthand.</p>
      </div>

      <div className="mode-list">
        {modes.slice(0, 3).map(({ id, title, description, Icon, accent }) => (
          <div className="mode-card" key={id}>
            <span className={`mode-icon ${accent}`}><Icon size={23} strokeWidth={2.2} /></span>
            <span className="mode-copy"><strong>{title}</strong><small>{description}</small></span>
            <Switch value={enabled[id]} onChange={value => setEnabled(prev => ({ ...prev, [id]: value }))} label={`Toggle ${title}`} />
          </div>
        ))}
        <div className="mode-card">
          <span className="mode-icon lilac"><Maximize2 size={23} strokeWidth={2.2} /></span>
          <span className="mode-copy"><strong>Text Scaling</strong><small>Increase text size (up to 200%)</small></span>
          <label className="sr-only" htmlFor="text-scale">Text scaling</label>
          <select id="text-scale" className="scale-select" value={scale} onChange={event => setScale(event.target.value)}>
            <option value="100">100%</option><option value="125">125%</option><option value="150">150%</option><option value="175">175%</option><option value="200">200%</option>
          </select>
        </div>
        {modes.slice(3).map(({ id, title, description, Icon, accent }) => (
          <div className="mode-card" key={id}>
            <span className={`mode-icon ${accent}`}><Icon size={23} strokeWidth={2.2} /></span>
            <span className="mode-copy"><strong>{title}{id === 'screenreader' && <span className="beta-badge">Stretch</span>}</strong><small>{description}</small></span>
            <Switch value={enabled[id]} onChange={value => setEnabled(prev => ({ ...prev, [id]: value }))} label={`Toggle ${title}`} />
          </div>
        ))}
      </div>
      <div className="simulate-footer-actions">
        <button className="outline-button" type="button" onClick={reset}><RotateCcw size={17} /> Reset All</button>
      </div>
      <p className="demo-note">UI preview only — simulation effects are not connected to a browser tab.</p>
    </section>
  );
}
