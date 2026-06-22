'use client'

import { HOTBAR, GRASS, DIRT, STONE, LOG, LEAVES, SAND, PLANKS, COBBLE } from './lib/world.js'

const LABELS = {
  [GRASS]: '🟩', [DIRT]: '🟫', [STONE]: '⬜', [LOG]: '🪵',
  [PLANKS]: '🟧', [LEAVES]: '🍃', [SAND]: '🟨', [COBBLE]: '🧱',
}
const NAMES = {
  [GRASS]: '草', [DIRT]: '泥', [STONE]: '石', [LOG]: '木',
  [PLANKS]: '木板', [LEAVES]: '树叶', [SAND]: '沙', [COBBLE]: '圆石',
}

// Press/release helper for both touch and mouse; stops the event reaching the
// canvas so buttons never rotate the camera or trigger tap-to-mine.
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
      <div style={styles.crosshair}>
        <span style={{ ...styles.cross, width: 2, height: 18 }} />
        <span style={{ ...styles.cross, width: 18, height: 2 }} />
      </div>

      {/* Selected block name */}
      <div style={styles.selName}>{LABELS[selected]} {NAMES[selected]}</div>

      {/* Hotbar */}
      <div style={styles.hotbar}>
        {HOTBAR.map((b, i) => (
          <button
            key={b}
            onClick={() => onSelect(b)}
            style={{ ...styles.slot, ...(selected === b ? styles.slotActive : null) }}
            title={NAMES[b]}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{LABELS[b]}</span>
            <span style={styles.slotKey}>{i + 1}</span>
          </button>
        ))}
      </div>

      {/* Desktop hint */}
      {!touchUI && (
        <div style={styles.hint}>
          点击锁定鼠标 · <b>WASD</b> 移动 · <b>空格</b> 跳 · <b>左键</b> 挖 · <b>右键</b> 放 · <b>1–8</b> 选方块
        </div>
      )}

      {/* Mobile controls */}
      {touchUI && (
        <>
          <div style={styles.dpad}>
            <button style={{ ...styles.dbtn, ...styles.up }} {...holdProps((a) => onMove('f', a))}>▲</button>
            <button style={{ ...styles.dbtn, ...styles.left }} {...holdProps((a) => onMove('l', a))}>◀</button>
            <span style={styles.dcenter} />
            <button style={{ ...styles.dbtn, ...styles.right }} {...holdProps((a) => onMove('r', a))}>▶</button>
            <button style={{ ...styles.dbtn, ...styles.down }} {...holdProps((a) => onMove('b', a))}>▼</button>
          </div>

          <div style={styles.actions}>
            <button style={{ ...styles.abtn, ...styles.jump }} {...holdProps(onJump)}>⤒<small style={styles.alabel}>跳</small></button>
            <div style={styles.actionRow}>
              <button style={{ ...styles.abtn, ...styles.dig }} {...holdProps(onBreak)}>⛏<small style={styles.alabel}>挖</small></button>
              <button style={{ ...styles.abtn, ...styles.put }} {...holdProps(onPlace)}>▣<small style={styles.alabel}>放</small></button>
            </div>
          </div>

          <div style={styles.tapHint}>点击屏幕可挖方块 · 拖动转视角</div>
        </>
      )}
    </div>
  )
}

const glass = {
  background: 'rgba(18,24,34,0.42)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.16)',
}
const btnBase = {
  ...glass,
  color: 'rgba(255,255,255,0.95)',
  fontWeight: 700,
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'none',
  cursor: 'pointer',
  pointerEvents: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 18,
    height: 18,
  },
  cross: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(255,255,255,0.85)',
    borderRadius: 2,
    boxShadow: '0 0 3px rgba(0,0,0,0.8)',
  },
  selName: {
    position: 'absolute',
    bottom: 78,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#fff',
    fontSize: 13,
    opacity: 0.85,
    textShadow: '0 1px 3px rgba(0,0,0,0.7)',
  },
  hotbar: {
    ...glass,
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 6,
    padding: 8,
    borderRadius: 16,
    pointerEvents: 'auto',
  },
  slot: {
    position: 'relative',
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid rgba(255,255,255,0.14)',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    color: 'white',
    cursor: 'pointer',
    transition: 'transform 0.08s, box-shadow 0.08s',
  },
  slotActive: {
    border: '2px solid #fff',
    background: 'rgba(255,255,255,0.22)',
    transform: 'translateY(-4px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
  },
  slotKey: {
    position: 'absolute',
    top: 2,
    right: 5,
    fontSize: 10,
    opacity: 0.6,
  },
  hint: {
    ...glass,
    position: 'absolute',
    top: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    padding: '7px 16px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  tapHint: {
    position: 'absolute',
    top: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    padding: '6px 14px',
    borderRadius: 999,
    ...glass,
    whiteSpace: 'nowrap',
  },
  dpad: {
    position: 'absolute',
    left: 22,
    bottom: 90,
    width: 168,
    height: 168,
  },
  dbtn: {
    ...btnBase,
    position: 'absolute',
    width: 56,
    height: 56,
    fontSize: 20,
    borderRadius: 14,
  },
  dcenter: {
    position: 'absolute',
    left: 64, top: 64, width: 40, height: 40,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
  },
  up: { left: 56, top: 0 },
  down: { left: 56, top: 112 },
  left: { left: 0, top: 56 },
  right: { left: 112, top: 56 },
  actions: {
    position: 'absolute',
    right: 22,
    bottom: 90,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 14,
  },
  actionRow: { display: 'flex', gap: 14 },
  abtn: {
    ...btnBase,
    width: 70,
    height: 70,
    borderRadius: '50%',
    fontSize: 26,
    flexDirection: 'column',
    gap: 0,
  },
  alabel: { fontSize: 11, fontWeight: 600, opacity: 0.9, marginTop: -2 },
  jump: { background: 'rgba(56,150,86,0.55)' },
  dig: { background: 'rgba(196,72,62,0.55)' },
  put: { background: 'rgba(64,112,200,0.55)' },
}
