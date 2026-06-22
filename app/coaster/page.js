'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

// Three.js touches `window`, so the simulator is loaded client-side only.
const CoasterSimulator = dynamic(() => import('./CoasterSimulator.jsx'), {
  ssr: false,
  loading: () => <Loading label="正在加载过山车…" />,
})

function Loading({ label }) {
  return (
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
      {label}
    </div>
  )
}

export default function CoasterPage() {
  return (
    <>
      <CoasterSimulator />
      <Link href="/" style={backStyle}>← 返回</Link>
    </>
  )
}

const backStyle = {
  position: 'fixed',
  top: 16,
  left: 16,
  zIndex: 50,
  padding: '8px 14px',
  borderRadius: 999,
  background: 'rgba(10,16,28,0.6)',
  color: '#eaf2ff',
  textDecoration: 'none',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 14,
  backdropFilter: 'blur(4px)',
}
