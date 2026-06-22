'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

const TetrisGame = dynamic(() => import('./TetrisGame.jsx'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a1020',
        color: '#eaf2ff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      正在加载俄罗斯方块…
    </div>
  ),
})

export default function TetrisPage() {
  return (
    <>
      <TetrisGame />
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
