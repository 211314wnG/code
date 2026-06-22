'use client'

import { useEffect, useState } from 'react'

// Lightweight overlay: a start gate (needed to unlock audio), a live speed
// readout and a mute toggle. It reads speed from a mutable ref updated by the
// render loop so React re-renders stay cheap.
export default function HUD({ started, onStart, muted, onToggleMute, speedRef }) {
  const [speed, setSpeed] = useState(0)

  useEffect(() => {
    if (!started) return
    let raf
    const tick = () => {
      setSpeed(speedRef.current || 0)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, speedRef])

  return (
    <>
      {!started && (
        <div style={styles.overlay}>
          <div style={styles.card}>
            <h1 style={styles.title}>🎢 Coaster POV</h1>
            <p style={styles.sub}>
              A first-person roller coaster ride built with Three.js — drops,
              banked turns and a full vertical loop, with gravity-based speed and
              live sound.
            </p>
            <button style={styles.button} onClick={onStart}>
              ▶ Start the ride
            </button>
            <p style={styles.hint}>Sound is generated live and synced to speed.</p>
          </div>
        </div>
      )}

      {started && (
        <>
          <div style={styles.speedBox}>
            <span style={styles.speedValue}>{Math.round(speed)}</span>
            <span style={styles.speedUnit}>km/h</span>
          </div>
          <button style={styles.muteBtn} onClick={onToggleMute}>
            {muted ? '🔇' : '🔊'}
          </button>
        </>
      )}
    </>
  )
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 50% 30%, rgba(20,40,80,0.55), rgba(0,0,0,0.85))',
    zIndex: 10,
  },
  card: {
    maxWidth: 460,
    textAlign: 'center',
    padding: '2.5rem 2rem',
    borderRadius: 18,
    background: 'rgba(12,18,32,0.82)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    color: '#eaf2ff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  title: { fontSize: '2.4rem', margin: '0 0 0.6rem' },
  sub: { fontSize: '1rem', opacity: 0.85, lineHeight: 1.5, margin: '0 0 1.6rem' },
  button: {
    fontSize: '1.1rem',
    padding: '0.8rem 1.8rem',
    border: 'none',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #ff6b6b, #ee5253)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 8px 24px rgba(238,82,83,0.45)',
  },
  hint: { fontSize: '0.8rem', opacity: 0.6, marginTop: '1.2rem' },
  speedBox: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    padding: '0.6rem 1rem',
    borderRadius: 12,
    background: 'rgba(10,16,28,0.55)',
    color: '#eaf2ff',
    fontFamily: '"Segoe UI", system-ui, sans-serif',
    backdropFilter: 'blur(4px)',
    zIndex: 10,
  },
  speedValue: { fontSize: '2.4rem', fontWeight: 800, lineHeight: 1 },
  speedUnit: { fontSize: '1rem', opacity: 0.75 },
  muteBtn: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: 'none',
    fontSize: '1.3rem',
    cursor: 'pointer',
    background: 'rgba(10,16,28,0.55)',
    color: 'white',
    zIndex: 10,
  },
}
