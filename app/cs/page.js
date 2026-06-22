'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

const CSGame = dynamic(() => import('./CSGame.jsx'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#9fb0c4',
        color: '#10212f',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      正在加载竞技场…
    </div>
  ),
})

export default function CSPage() {
  return (
    <>
      <CSGame />
      <Link href="/" style={backStyle}>← 返回</Link>
    </>
  )
}

const backStyle = {
  position: 'fixed',
  top: 16,
  left: 70,
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
