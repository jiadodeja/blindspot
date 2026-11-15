export default function Switch({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" className={`switch ${value ? 'on' : ''}`} role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)}><span /></button>;
}
