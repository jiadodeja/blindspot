// UI-only examples. Replace with A11yIssue and SuggestFixResponse from src/shared/messages.ts
// when wiring SCAN_PAGE and the backend; see docs/MESSAGES.md.
import { Contrast, Image as ImageIcon, Keyboard } from 'lucide-react';

export const sampleIssues = [
  { id: 1, title: 'Missing image description (alt text)', detail: '1 image has no alt attribute.', severity: 'High', Icon: ImageIcon, iconColor: 'red' },
  { id: 2, title: 'Low color contrast', detail: 'Text contrast is 2.9:1 (recommended: at least 4.5:1 for normal text).', severity: 'Medium', Icon: Contrast, iconColor: 'amber' },
  { id: 3, title: 'Button with unclear label', detail: '2 buttons may be confusing for screen reader users.', severity: 'Medium', Icon: Keyboard, iconColor: 'amber' },
] as const;

export const sampleFixes = [
  { id: 1, title: 'Add a descriptive alt text.', code: '<img src="team.jpg" alt="Our team at the event" />', Icon: ImageIcon },
  { id: 2, title: 'Increase text contrast.', code: 'color: #1a1a1a; /* verify contrast */', Icon: Contrast },
  { id: 3, title: 'Give the button an accessible name.', code: '<button aria-label="Open menu">...</button>', Icon: Keyboard },
] as const;
