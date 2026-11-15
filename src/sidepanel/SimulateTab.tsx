import { useEffect, useRef, useState } from 'react';
import { Accessibility, Contrast, Eye, Focus, Glasses, Keyboard, Maximize2, RotateCcw, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Switch from './components/Switch';
import { sendToPage } from './sendToPage';
import { defaultEffects } from '../shared/messages';
import type { EffectSettings } from '../shared/messages';

type ModeId = 'grayscale' | 'tunnelVision' | 'dyslexia' | 'keyboardOnly' | 'screenReader';

type Mode = {
  id: ModeId;
  title: string;
  description: string;
  Icon: LucideIcon;
  accent: string;
};

const modes: Mode[] = [
  { id: 'grayscale', title: 'Grayscale', description: 'View the page without color', Icon: Contrast, accent: 'gray' },
  { id: 'tunnelVision', title: 'Tunnel Vision', description: 'Limited peripheral vision', Icon: Focus, accent: 'blue' },
  { id: 'dyslexia', title: 'Reading Accessibility', description: 'Dyslexia-friendly font and spacing', Icon: Type, accent: 'mint' },
  { id: 'keyboardOnly', title: 'Keyboard-Only Navigation', description: 'Block mouse input; navigate with the keyboard', Icon: Keyboard, accent: 'peach' },
  { id: 'screenReader', title: 'Screen Reader (Audio-Only)', description: 'Hear how your site is read aloud', Icon: Glasses, accent: 'lilac' },
];

export default function SimulateTab() {
  const [settings, setSettings] = useState<EffectSettings>(() => structuredClone(defaultEffects));
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);

  useEffect(() => {
    async function refreshSettings() {
      const version = ++requestVersion.current;
      setBusy(true);
      setError('');
      try {
        const reply = await sendToPage({ type: 'GET_EFFECTS' }, 3000);
        if (version !== requestVersion.current) return;
        if (!reply.ok) throw new Error(reply.error);
        if (reply.type !== 'EFFECTS') throw new Error('Could not read simulation settings for this page.');
        setSettings(reply.settings);
      } catch (cause) {
        if (version === requestVersion.current) {
          setSettings(structuredClone(defaultEffects));
          setError(cause instanceof Error ? cause.message : 'Could not read simulation settings.');
        }
      } finally {
        if (version === requestVersion.current) setBusy(false);
      }
    }

    const onActivated = () => { void refreshSettings(); };
    const onUpdated = (_tabId: number, change: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) => {
      if (tab.active && change.status === 'complete') void refreshSettings();
    };
    void refreshSettings();
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      ++requestVersion.current;
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  async function updateSettings(nextSettings: EffectSettings, reset = false) {
    const version = ++requestVersion.current;
    setBusy(true);
    setError('');
    try {
      const reply = await sendToPage(reset
        ? { type: 'RESET_EFFECTS' }
        : { type: 'APPLY_EFFECTS', settings: nextSettings }, 3000);
      if (version !== requestVersion.current) return;
      if (!reply.ok) throw new Error(reply.error);
      if (reply.type !== 'DONE') throw new Error('Could not update simulation settings.');
      setSettings(nextSettings);
    } catch (cause) {
      if (version === requestVersion.current) {
        setError(cause instanceof Error ? cause.message : 'Could not update simulation settings.');
      }
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }

  function toggleMode(id: ModeId, on: boolean) {
    void updateSettings({ ...settings, [id]: { ...settings[id], on } });
  }

  return (
    <section className="tab-content" aria-labelledby="simulate-heading">
      <div className="section-intro">
        <span className="eyebrow"><Accessibility size={14} /> EXPERIENCE</span>
        <h1 id="simulate-heading">Experience Accessibility</h1>
        <p>Try your site through different accessibility lenses and discover barriers firsthand.</p>
      </div>

      {error && <p className="simulation-error" role="alert">{error}</p>}
      {busy && <p className="demo-note" role="status">Waiting for the page to respond...</p>}
      <fieldset className="mode-list simulation-controls" disabled={busy} aria-busy={busy}>
        <legend className="sr-only">Simulation controls</legend>
        <div className="mode-card">
          <span className="mode-icon lilac"><Eye size={23} strokeWidth={2.2} /></span>
          <span className="mode-copy"><strong>Blur</strong><small>Choose how much to blur the page</small></span>
          <label className="sr-only" htmlFor="blur-level">Blur amount</label>
          <select id="blur-level" className="scale-select" value={settings.blur.on ? settings.blur.blurPx : 0} onChange={event => {
            const blurPx = Number(event.target.value);
            void updateSettings({ ...settings, blur: { on: blurPx > 0, blurPx } });
          }}>
            <option value="0">Off</option><option value="2">2px</option><option value="4">4px</option><option value="6">6px</option><option value="8">8px</option><option value="10">10px</option>
          </select>
        </div>
        {modes.slice(0, 3).map(({ id, title, description, Icon, accent }) => (
          <div className="mode-card" key={id}>
            <span className={`mode-icon ${accent}`}><Icon size={23} strokeWidth={2.2} /></span>
            <span className="mode-copy"><strong>{title}</strong><small>{description}</small></span>
            <Switch value={settings[id].on} onChange={value => toggleMode(id, value)} label={`Toggle ${title}`} />
          </div>
        ))}
        <div className="mode-card">
          <span className="mode-icon lilac"><Maximize2 size={23} strokeWidth={2.2} /></span>
          <span className="mode-copy"><strong>Text Scaling</strong><small>Increase text size (up to 200%)</small></span>
          <label className="sr-only" htmlFor="text-scale">Text scaling</label>
          <select id="text-scale" className="scale-select" value={settings.textScale.on ? settings.textScale.percent : 100} onChange={event => {
            const percent = Number(event.target.value);
            void updateSettings({ ...settings, textScale: { on: percent !== 100, percent } });
          }}>
            <option value="100">100%</option><option value="125">125%</option><option value="150">150%</option><option value="175">175%</option><option value="200">200%</option>
          </select>
        </div>
        {modes.slice(3).map(({ id, title, description, Icon, accent }) => (
          <div className="mode-card" key={id}>
            <span className={`mode-icon ${accent}`}><Icon size={23} strokeWidth={2.2} /></span>
            <span className="mode-copy"><strong>{title}{id === 'screenReader' && <span className="beta-badge">Stretch</span>}</strong><small>{description}</small></span>
            <Switch value={settings[id].on} onChange={value => toggleMode(id, value)} label={`Toggle ${title}`} />
          </div>
        ))}
      </fieldset>
      {settings.keyboardOnly.on && <p className="demo-note">Mouse clicks and wheel scrolling are blocked on the page. Use Tab and Shift+Tab to navigate, Enter or Space to activate controls, and arrow keys or Page Down to scroll. Turn this mode off here to restore mouse input.</p>}
      <div className="simulate-footer-actions">
        <button className="outline-button" type="button" disabled={busy} onClick={() => void updateSettings(structuredClone(defaultEffects), true)}><RotateCcw size={17} /> Reset All</button>
      </div>
      <p className="demo-note">Blur, grayscale, tunnel vision, text scaling, and keyboard focus apply to the current page. Reading and screen reader modes are still placeholders.</p>
    </section>
  );
}
