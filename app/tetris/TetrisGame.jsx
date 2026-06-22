'use client'

import { useEffect, useRef, useState } from 'react'

const COLS = 10
const ROWS = 20
const CELL = 30

// [matrix, color]
const PIECES = {
  I: [[[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], '#4dd0e1'],
  O: [[[1, 1], [1, 1]], '#ffd54f'],
  T: [[[0, 1, 0], [1, 1, 1], [0, 0, 0]], '#ba68c8'],
  S: [[[0, 1, 1], [1, 1, 0], [0, 0, 0]], '#81c784'],
  Z: [[[1, 1, 0], [0, 1, 1], [0, 0, 0]], '#e57373'],
  J: [[[1, 0, 0], [1, 1, 1], [0, 0, 0]], '#64b5f6'],
  L: [[[0, 0, 1], [1, 1, 1], [0, 0, 0]], '#ffb74d'],
}
const KEYS = Object.keys(PIECES)

function rotate(m) {
  const n = m.length
  const r = m.map((row) => row.slice())
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) r[x][n - 1 - y] = m[y][x]
  return r
}
const rand = () => KEYS[(Math.random() * KEYS.length) | 0]

export default function TetrisGame() {
  const canvasRef = useRef(null)
  const nextRef = useRef(null)
  const stateRef = useRef(null)

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [over, setOver] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
    const newPiece = (k = rand()) => ({ k, m: PIECES[k][0], c: PIECES[k][1], x: ((COLS - PIECES[k][0].length) / 2) | 0, y: 0 })
    const s = {
      board,
      cur: newPiece(),
      next: rand(),
      dropMs: 800,
      acc: 0,
      score: 0, lines: 0, level: 1,
      over: false, paused: false,
    }
    stateRef.current = s

    const collide = (m, px, py) => {
      for (let y = 0; y < m.length; y++)
        for (let x = 0; x < m[y].length; x++) {
          if (!m[y][x]) continue
          const bx = px + x, by = py + y
          if (bx < 0 || bx >= COLS || by >= ROWS) return true
          if (by >= 0 && s.board[by][bx]) return true
        }
      return false
    }
    const merge = () => {
      const { m, x, y, c } = s.cur
      for (let j = 0; j < m.length; j++)
        for (let i = 0; i < m[j].length; i++)
          if (m[j][i] && y + j >= 0) s.board[y + j][x + i] = c
    }
    const clearLines = () => {
      let cleared = 0
      for (let y = ROWS - 1; y >= 0; y--) {
        if (s.board[y].every((c) => c)) {
          s.board.splice(y, 1)
          s.board.unshift(Array(COLS).fill(null))
          cleared++
          y++
        }
      }
      if (cleared) {
        const pts = [0, 100, 300, 500, 800][cleared] * s.level
        s.score += pts
        s.lines += cleared
        s.level = 1 + Math.floor(s.lines / 10)
        s.dropMs = Math.max(110, 800 - (s.level - 1) * 70)
        setScore(s.score); setLines(s.lines); setLevel(s.level)
      }
    }
    const spawn = () => {
      s.cur = newPiece(s.next)
      s.next = rand()
      if (collide(s.cur.m, s.cur.x, s.cur.y)) { s.over = true; setOver(true) }
    }
    const lock = () => { merge(); clearLines(); spawn() }

    const move = (dx) => { if (!collide(s.cur.m, s.cur.x + dx, s.cur.y)) s.cur.x += dx }
    const soft = () => {
      if (!collide(s.cur.m, s.cur.x, s.cur.y + 1)) { s.cur.y += 1; s.acc = 0 }
      else lock()
    }
    const hard = () => {
      while (!collide(s.cur.m, s.cur.x, s.cur.y + 1)) s.cur.y += 1
      lock(); s.acc = 0
    }
    const rot = () => {
      const r = rotate(s.cur.m)
      for (const k of [0, -1, 1, -2, 2]) {
        if (!collide(r, s.cur.x + k, s.cur.y)) { s.cur.m = r; s.cur.x += k; break }
      }
    }
    s.actions = { move, soft, hard, rot }

    // Rendering
    const ctx = canvasRef.current.getContext('2d')
    const nctx = nextRef.current.getContext('2d')
    const drawCell = (c, x, y, g) => {
      g.fillStyle = c
      g.fillRect(x * CELL, y * CELL, CELL, CELL)
      g.fillStyle = 'rgba(255,255,255,0.18)'
      g.fillRect(x * CELL, y * CELL, CELL, 4)
      g.strokeStyle = 'rgba(0,0,0,0.35)'
      g.strokeRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1)
    }
    const draw = () => {
      ctx.fillStyle = '#0d1422'
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke() }
      for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke() }

      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (s.board[y][x]) drawCell(s.board[y][x], x, y, ctx)

      // Ghost
      let gy = s.cur.y
      while (!collide(s.cur.m, s.cur.x, gy + 1)) gy++
      const { m, x, c } = s.cur
      for (let j = 0; j < m.length; j++)
        for (let i = 0; i < m[j].length; i++)
          if (m[j][i]) {
            ctx.fillStyle = 'rgba(255,255,255,0.12)'
            ctx.fillRect((x + i) * CELL, (gy + j) * CELL, CELL, CELL)
          }
      // Current
      for (let j = 0; j < m.length; j++)
        for (let i = 0; i < m[j].length; i++)
          if (m[j][i] && s.cur.y + j >= 0) drawCell(c, x + i, s.cur.y + j, ctx)

      // Next preview
      nctx.clearRect(0, 0, nextRef.current.width, nextRef.current.height)
      const nm = PIECES[s.next][0], nc = PIECES[s.next][1]
      const sz = 22
      const off = (4 - nm.length) / 2
      for (let j = 0; j < nm.length; j++)
        for (let i = 0; i < nm[j].length; i++)
          if (nm[j][i]) {
            nctx.fillStyle = nc
            nctx.fillRect((i + off) * sz + 6, (j + off) * sz + 6, sz, sz)
            nctx.strokeStyle = 'rgba(0,0,0,0.35)'
            nctx.strokeRect((i + off) * sz + 6.5, (j + off) * sz + 6.5, sz - 1, sz - 1)
          }
    }

    let raf, last = performance.now()
    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      const dt = t - last
      last = t
      if (!s.over && !s.paused) {
        s.acc += dt
        if (s.acc >= s.dropMs) { s.acc = 0; soft() }
      }
      draw()
    }
    raf = requestAnimationFrame(loop)

    const onKey = (e) => {
      if (s.over) return
      if (e.code === 'KeyP') { s.paused = !s.paused; setPaused(s.paused); return }
      if (s.paused) return
      if (e.code === 'ArrowLeft') move(-1)
      else if (e.code === 'ArrowRight') move(1)
      else if (e.code === 'ArrowDown') soft()
      else if (e.code === 'ArrowUp' || e.code === 'KeyX') rot()
      else if (e.code === 'Space') { e.preventDefault(); hard() }
      else return
    }
    window.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const act = (fn) => (e) => {
    e?.preventDefault?.()
    const s = stateRef.current
    if (!s || s.over || s.paused) return
    s.actions[fn === 'hard' ? 'hard' : fn === 'rot' ? 'rot' : fn === 'down' ? 'soft' : 'move']?.(
      fn === 'left' ? -1 : fn === 'right' ? 1 : undefined,
    )
  }

  const restart = () => {
    setOver(false); setScore(0); setLines(0); setLevel(1); setPaused(false)
    const s = stateRef.current
    s.board.forEach((r) => r.fill(null))
    s.score = 0; s.lines = 0; s.level = 1; s.dropMs = 800; s.over = false; s.paused = false
    s.cur = { k: 'T', m: PIECES.T[0], c: PIECES.T[1], x: 3, y: 0 }
    s.next = rand()
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.stage}>
        <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} style={styles.board} />
        <div style={styles.side}>
          <Stat label="得分" value={score} />
          <Stat label="行数" value={lines} />
          <Stat label="等级" value={level} />
          <div style={styles.nextBox}>
            <div style={styles.nextLabel}>下一个</div>
            <canvas ref={nextRef} width={104} height={104} />
          </div>
          <div style={styles.kbd}>← → 移动 · ↑ 旋转 · ↓ 下移 · 空格 速降 · P 暂停</div>
        </div>

        {over && (
          <div style={styles.overlayMsg}>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>游戏结束</div>
            <div style={{ opacity: 0.8, marginBottom: 16 }}>得分 {score}</div>
            <button style={styles.restart} onClick={restart}>再来一局</button>
          </div>
        )}
      </div>

      {/* Touch / click controls */}
      <div style={styles.pad}>
        <button style={styles.pbtn} onTouchStart={act('left')} onMouseDown={act('left')}>◀</button>
        <button style={styles.pbtn} onTouchStart={act('rot')} onMouseDown={act('rot')}>⟳</button>
        <button style={styles.pbtn} onTouchStart={act('right')} onMouseDown={act('right')}>▶</button>
        <button style={styles.pbtn} onTouchStart={act('down')} onMouseDown={act('down')}>▼</button>
        <button style={styles.pbtn} onTouchStart={act('hard')} onMouseDown={act('hard')}>⤓</button>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  )
}

const styles = {
  wrap: {
    position: 'fixed', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 18, padding: 16, boxSizing: 'border-box',
    background: 'radial-gradient(circle at 50% 0%, #18244a 0%, #0a1020 70%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    color: '#eaf2ff',
  },
  stage: { position: 'relative', display: 'flex', gap: 18, alignItems: 'flex-start', maxHeight: '74vh' },
  board: {
    height: '74vh', width: 'auto',
    borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.5)', touchAction: 'none',
  },
  side: { display: 'flex', flexDirection: 'column', gap: 12, width: 130 },
  stat: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px' },
  statLabel: { fontSize: 12, opacity: 0.65 },
  statValue: { fontSize: 24, fontWeight: 800 },
  nextBox: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 10 },
  nextLabel: { fontSize: 12, opacity: 0.65, marginBottom: 6 },
  kbd: { fontSize: 11, opacity: 0.55, lineHeight: 1.6 },
  overlayMsg: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', borderRadius: 10,
    background: 'rgba(5,9,18,0.8)', textAlign: 'center',
  },
  restart: {
    border: 'none', borderRadius: 999, padding: '10px 22px', fontSize: 16, fontWeight: 700,
    background: 'linear-gradient(135deg,#4dd0e1,#64b5f6)', color: '#03121a', cursor: 'pointer',
  },
  pad: { display: 'flex', gap: 12 },
  pbtn: {
    width: 62, height: 62, borderRadius: 16, fontSize: 24, fontWeight: 700,
    color: '#eaf2ff', cursor: 'pointer',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
    backdropFilter: 'blur(6px)', WebkitTapHighlightColor: 'transparent', touchAction: 'none',
    userSelect: 'none', WebkitUserSelect: 'none',
  },
}
