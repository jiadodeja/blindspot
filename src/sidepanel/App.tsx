import { useState } from 'react'

export default function App() {
  const [tab, setTab] = useState<'simulate' | 'quickfix'>('simulate')
  return (
    <div style={{ padding: 12, fontFamily: 'system-ui' }}>
      <h1>Blindspot</h1>
      <button onClick={() => setTab('simulate')}>Simulate</button>
      <button onClick={() => setTab('quickfix')}>Quick Fix</button>
      <p>{tab === 'simulate' ? 'Simulate tab goes here' : 'Quick Fix tab goes here'}</p>
    </div>
  )
}
