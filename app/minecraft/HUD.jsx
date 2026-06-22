'use client'

import { HOTBAR, GRASS, DIRT, STONE, LOG, LEAVES, SAND, PLANKS, COBBLE } from './lib/world.js'

const LABELS = {
  [GRASS]: '🟩', [DIRT]: '🟫', [STONE]: '⬜', [LOG]: '🪵',
  [PLANKS]: '🟧', [LEAVES]: '🍃', [SAND]: '🟨', [COBBLE]: '🧱',
}
const NAMES = {
  [GRASS]: '草', [DIRT]: '泥', [STONE]: '石', [LOG]: '木',
  [PLANKS]: '板', [LEAVES]: '叶', [SAND]: '沙', [COBBLE]: '砖',
}

// Hold helper: fires active true on press, false on release, for both touch and
// mouse, and prevents the event reaching the canvas (so buttons don't rotate
// the camera).
function holdProps(setActive) {
  const down = (e) => { e.preventDefault(); e.stopPropagation(); setActive(true) }
  const up = (e) => { e.preventDefault(); e.stopPropagation(); setActive(false) }
  return {
    onTouchStart: down, onTouchEnd: up, onTouchCancel: up,
    onMouseDown: down, onMouseUp: up, onMouseLeave: up,
  }
}

export default function HUD({ touchUI, selected, onSelect, onMove, onJump, onBreak, onPlace }) {
  return (
    <div style={styles.overlay}>
      {/* Crosshair */}
      <div style={styles.crosshair}>+</div>

      {/* Hotbar */}
      <div style={styles.hotbar}>
        {HOTBAR.map((b) => (
          <button
            key={b}
            onClick={() => onSelect(b)}
            style={{ ...styles.slot, ...(selected === b ? styles.slotActive : null) }}
            title={NAMES[b]}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{LABELS[b]}</span>
            <span style={styles.slotName}>{NAMES[b]}</span>
          </button>
        ))}
      </div>

      {/* Desktop hint */}
      {!touchUI && (
        <div style={styles.hint}>
          点击锁定鼠标 · WASD 移动 · 空格跳 · 左键挖 · 右键放 · 数字键选方块
        </div>
      )}

      {/* Mobile controls */}
      {touchUI && (
        <>
          <div style={styles.dpad}>
            <button style={{ ...styles.dbtn, ...styles.up }} {...holdProps((a) => onMove('f', a))}>▲</button>
            <button style={{ ...styles.dbtn, ...styles.left }} {...holdProps((a) => onMove('l', a))}>◀</button>
            <button style={{ ...styles.dbtn, ...styles.right }} {...holdProps((a) => onMove('r', a))}>▶</button>
            <button style={{ ...styles.dbtn, ...styles.down }} {...holdProps((a) => onMove('b', a))}>▼</button>
          </div>

          <div style={styles.actions}>
            <button style={{ ...styles.abtn, background: 'rgba(60,160,90,0.85)' }} {...holdProps(onJump)}>跳</button>
            <button style={{ ...styles.abtn, background: 'rgba(200,80,70,0.85)' }} {...holdProps(onBreak)}>挖</button>
            <button style={{ ...styles.abtn, background: 'rgba(70,120,210,0.85)' }} {...holdProps(onPlace)}>放</button>
          </div>
        </>
      )}
    </div>
  )
}

const btnBase = {
  border: 'none',
  borderRadius: 12,
  color: 'white',
  fontWeight: 700,
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'none',
  cursor: 'pointer',
  pointerEvents: 'auto',
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 26,
    fontWeight: 400,
    textShadow: '0 0 3px rgba(0,0,0,0.7)',
  },
  hotbar: {
    position: 'absolute',
    bottom: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 6,
    padding: 6,
    borderRadius: 12,
    background: 'rgba(0,0,0,0.3)',
    pointerEvents: 'auto',
  },
  slot: {
    width: 46,
    height: 46,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    border: '2px solid rgba(255,255,255,0.25)',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.08)',
    color: 'white',
    cursor: 'pointer',
  },
  slotActive: { border: '2px solid #fff', background: 'rgba(255,255,255,0.25)' },
  slotName: { fontSize: 10, opacity: 0.85 },
  hint: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    background: 'rgba(0,0,0,0.32)',
    padding: '6px 12px',
    borderRadius: 999,
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
    whiteSpace: 'nowrap',
  },
  dpad: {
    position: 'absolute',
    left: 20,
    bottom: 84,
    width: 168,
    height: 168,
  },
  dbtn: {
    ...btnBase,
    position: 'absolute',
    width: 56,
    height: 56,
    fontSize: 22,
    background: 'rgba(20,24,32,0.6)',
  },
  up: { left: 56, top: 0 },
  down: { left: 56, top: 112 },
  left: { left: 0, top: 56 },
  right: { left: 112, top: 56 },
  actions: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  abtn: {
    ...btnBase,
    width: 72,
    height: 72,
    borderRadius: '50%',
    fontSize: 22,
  },
}
