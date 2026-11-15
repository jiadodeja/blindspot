import type { sampleIssues } from './fixtures/quickfix';

type IssueCardProps = { issue: (typeof sampleIssues)[number] };

// Person B: wire highlighting, suggestions, preview, undo, loading and errors here.
export default function IssueCard({ issue }: IssueCardProps) {
  return (
    <article className="issue-row">
      <span className={`issue-icon ${issue.iconColor}`}><issue.Icon size={21} /></span>
      <span className="issue-copy"><strong>{issue.title}</strong><small>{issue.detail}</small></span>
      <span className={`severity ${issue.severity.toLowerCase()}`}>{issue.severity}</span>
    </article>
  );
}
