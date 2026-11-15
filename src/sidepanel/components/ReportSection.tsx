import { ChevronDown, ChevronUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export default function ReportSection({ title, Icon, children, open, onToggle, theme }: { title: string; Icon: LucideIcon; children: ReactNode; open: boolean; onToggle: () => void; theme: string }) {
  return (
    <section className="report-section">
      <button className={`section-header ${theme}`} type="button" aria-expanded={open} onClick={onToggle}>
        <span><Icon size={21} /><strong>{title}</strong></span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className="section-body">{children}</div>}
    </section>
  );
}
