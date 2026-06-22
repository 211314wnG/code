'use client'

import dynamic from 'next/dynamic'

// Three.js touches `window`, so the simulator is loaded client-side only.
const CoasterSimulator = dynamic(() => import('./coaster/CoasterSimulator.jsx'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0b1220',
        color: '#eaf2ff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      Loading the coaster…
    </div>
  ),
})

export default function Home() {
  return <CoasterSimulator />
}
