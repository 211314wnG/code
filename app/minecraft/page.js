'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

// Three.js touches `window`, so the game is loaded client-side only.
const MinecraftGame = dynamic(() => import('./MinecraftGame.jsx'), {
  ssr: false,
  loading: () => <Loading label="正在生成世界…" />,
})

function Loading({ label }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#8ec9f0',
        color: '#10212f',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {label}
    </div>
  )
}

export default function MinecraftPage() {
  return (
    <>
      <MinecraftGame />
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
  background: 'rgba(10,16,28,0.55)',
  color: '#fff',
  textDecoration: 'none',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 14,
}
