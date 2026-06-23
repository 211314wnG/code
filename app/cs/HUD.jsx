'use client'

function holdProps(setActive) {
  const down = (e) => { e.preventDefault(); e.stopPropagation(); setActive(true) }
  const up = (e) => { e.preventDefault(); e.stopPropagation(); setActive(false) }
  return { onTouchStart: down, onTouchEnd: up, onTouchCancel: up, onMouseDown: down, onMouseUp: up, onMouseLeave: up }
}
function tapProps(fn) {
  const down = (e) => { e.preventDefault(); e.stopPropagation(); fn() }
  return { onTouchStart: down, onMouseDown: down }
}

export default function HUD({
  phase, health, ammo, mag, kills, reloading, muted, touchUI,
  onStart, onToggleMute, onMove, onJump, onFire, onReload,
}) {
  return (
    <div style={s.overlay}>
      {phase === 'loading' && (
        <div style={s.gate}><div style={s.card}>正在加载士兵模型…</div></div>
      )}

      {phase === 'ready' && (
        <div style={s.gate}>
          <div style={s.card}>
            <h1 style={s.title}>🔫 CS 竞技场</h1>
            <p style={s.sub}>
              一张竞技地图 + 8 个会主动包抄、寻找掩体射击你的人机敌人(真实士兵模型)。
              消灭他们，注意血量。
            </p>
            <button
              style={s.start}
              onClick={onStart}
              onTouchEnd={(e) => { e.preventDefault(); onStart() }}
            >▶ 开始战斗</button>
            <p style={s.hint}>
              电脑:点击锁定鼠标 · WASD 移动 · 左键开火 · R 换弹 · 空格跳<br />
              手机:左侧方向键 · 拖动转视角 · 右侧开火/换弹/跳
            </p>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <div style={s.crosshair}>
            <span style={{ ...s.cl, width: 2, height: 14 }} />
            <span style={{ ...s.cl, width: 14, height: 2 }} />
          </div>

          {/* Health */}
          <div style={s.health}>
            <div style={s.hpLabel}>❤ {health}</div>
            <div style={s.hpBar}><div style={{ ...s.hpFill, width: `${health}%`, background: health > 40 ? '#46c267' : '#e2503f' }} /></div>
          </div>

          {/* Kills */}
          <div style={s.kills}>击杀 <b style={{ fontSize: 22 }}>{kills}</b></div>

          {/* Ammo */}
          <div style={s.ammo}>{reloading ? '换弹中…' : <><b style={{ fontSize: 26 }}>{ammo}</b> / {mag}</>}</div>

          <button style={s.mute} onClick={onToggleMute}>{muted ? '🔇' : '🔊'}</button>

          {touchUI && (
            <>
              <div style={s.dpad}>
                <button style={{ ...s.dbtn, left: 56, top: 0 }} {...holdProps((a) => onMove('f', a))}>▲</button>
                <button style={{ ...s.dbtn, left: 0, top: 56 }} {...holdProps((a) => onMove('l', a))}>◀</button>
                <button style={{ ...s.dbtn, left: 112, top: 56 }} {...holdProps((a) => onMove('r', a))}>▶</button>
                <button style={{ ...s.dbtn, left: 56, top: 112 }} {...holdProps((a) => onMove('b', a))}>▼</button>
              </div>
              <div style={s.actions}>
                <button style={{ ...s.fire }} {...holdProps(onFire)}>开火</button>
                <div style={s.row}>
                  <button style={{ ...s.abtn, background: 'rgba(56,150,86,0.6)' }} {...holdProps(onJump)}>跳</button>
                  <button style={{ ...s.abtn, background: 'rgba(70,112,200,0.6)' }} {...tapProps(onReload)}>换弹</button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

const glass = { background: 'rgba(15,20,28,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.16)' }
const btn = {
  ...glass, color: '#fff', fontWeight: 700, userSelect: 'none', WebkitUserSelect: 'none',
  WebkitTapHighlightColor: 'transparent', touchAction: 'none', cursor: 'pointer', pointerEvents: 'auto',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const s = {
  overlay: { position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', color: '#eaf2ff' },
  gate: { position: 'absolute', inset: 0, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 30%, rgba(20,30,50,0.6), rgba(0,0,0,0.85))' },
  card: { maxWidth: 460, pointerEvents: 'auto', textAlign: 'center', padding: '2.4rem 2rem', borderRadius: 18, background: 'rgba(12,18,32,0.85)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  title: { fontSize: '2.2rem', margin: '0 0 0.6rem' },
  sub: { fontSize: '1rem', opacity: 0.85, lineHeight: 1.6, margin: '0 0 1.5rem' },
  start: { fontSize: '1.1rem', padding: '0.8rem 1.8rem', border: 'none', borderRadius: 999, background: 'linear-gradient(135deg,#f0883e,#e2503f)', color: '#fff', fontWeight: 800, cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', boxShadow: '0 8px 24px rgba(226,80,63,0.45)' },
  hint: { fontSize: '0.8rem', opacity: 0.6, marginTop: '1.4rem', lineHeight: 1.7 },
  crosshair: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14 },
  cl: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(255,255,255,0.9)', boxShadow: '0 0 3px rgba(0,0,0,0.9)' },
  health: { position: 'absolute', left: 18, bottom: 18, ...glass, padding: '8px 12px', borderRadius: 12, width: 180 },
  hpLabel: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  hpBar: { height: 8, borderRadius: 5, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  hpFill: { height: '100%', transition: 'width 0.15s' },
  kills: { position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', ...glass, padding: '6px 16px', borderRadius: 999, fontSize: 14 },
  ammo: { position: 'absolute', right: 18, bottom: 18, ...glass, padding: '8px 16px', borderRadius: 12, fontSize: 14, minWidth: 90, textAlign: 'center' },
  mute: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: '50%', border: 'none', fontSize: 18, cursor: 'pointer', background: 'rgba(10,16,28,0.5)', color: '#fff', pointerEvents: 'auto' },
  dpad: { position: 'absolute', left: 22, bottom: 92, width: 168, height: 168 },
  dbtn: { ...btn, position: 'absolute', width: 56, height: 56, borderRadius: 14, fontSize: 20 },
  actions: { position: 'absolute', right: 22, bottom: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
  fire: { ...btn, width: 92, height: 92, borderRadius: '50%', fontSize: 20, background: 'rgba(226,80,63,0.6)' },
  row: { display: 'flex', gap: 12 },
  abtn: { ...btn, width: 64, height: 64, borderRadius: '50%', fontSize: 16 },
}
