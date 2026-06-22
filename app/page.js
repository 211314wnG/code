import Link from 'next/link'

// Landing page: a small game hub with two cards routing to each game.
const GAMES = [
  {
    href: '/minecraft',
    title: '我的世界',
    subtitle: 'Voxel Sandbox',
    emoji: '⛏️',
    desc: '体素方块世界：自由探索、挖掘与建造。电脑用 WASD + 鼠标，手机有方向键、跳跃与挖/放按钮。',
    bg: 'linear-gradient(135deg, #4f8f3a 0%, #2f5d8a 100%)',
  },
  {
    href: '/coaster',
    title: '过山车',
    subtitle: 'Coaster POV',
    emoji: '🎢',
    desc: '第一人称过山车模拟：俯冲、倾斜急转弯、垂直大回环，重力驱动的速度与实时音效。',
    bg: 'linear-gradient(135deg, #ee5253 0%, #6a2c9c 100%)',
  },
  {
    href: '/tetris',
    title: '俄罗斯方块',
    subtitle: 'Tetris',
    emoji: '🧱',
    desc: '经典俄罗斯方块：旋转、消行、连击得分与等级提速。电脑用方向键，手机有触屏按钮。',
    bg: 'linear-gradient(135deg, #4dd0e1 0%, #3949ab 100%)',
  },
]

export default function Home() {
  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎮 游戏合集</h1>
        <p style={styles.sub}>用 Three.js 打造 · 选择一个开始</p>
      </header>

      <div style={styles.grid}>
        {GAMES.map((g) => (
          <Link key={g.href} href={g.href} style={styles.card}>
            <div style={{ ...styles.thumb, background: g.bg }}>
              <span style={styles.emoji}>{g.emoji}</span>
            </div>
            <div style={styles.body}>
              <div style={styles.cardTitleRow}>
                <span style={styles.cardTitle}>{g.title}</span>
                <span style={styles.cardSubtitle}>{g.subtitle}</span>
              </div>
              <p style={styles.desc}>{g.desc}</p>
              <span style={styles.play}>进入 →</span>
            </div>
          </Link>
        ))}
      </div>

      <footer style={styles.footer}>Built with Next.js + Three.js · 部署于 GitHub Pages</footer>
    </main>
  )
}

const styles = {
  main: {
    minHeight: '100vh',
    boxSizing: 'border-box',
    padding: '48px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'radial-gradient(circle at 50% 0%, #1b2a4a 0%, #0b1220 60%)',
    color: '#eaf2ff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: { textAlign: 'center', marginBottom: 36 },
  title: { fontSize: '2.6rem', margin: '0 0 8px' },
  sub: { margin: 0, opacity: 0.7, fontSize: '1rem' },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 860,
  },
  card: {
    width: 380,
    maxWidth: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
    display: 'flex',
    flexDirection: 'column',
  },
  thumb: {
    height: 150,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 72, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' },
  body: { padding: '18px 20px 22px' },
  cardTitleRow: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 },
  cardTitle: { fontSize: '1.5rem', fontWeight: 800 },
  cardSubtitle: { fontSize: '0.85rem', opacity: 0.6 },
  desc: { margin: '0 0 16px', fontSize: '0.95rem', lineHeight: 1.55, opacity: 0.85 },
  play: { fontWeight: 700, color: '#7db7ff' },
  footer: { marginTop: 48, fontSize: '0.8rem', opacity: 0.5, textAlign: 'center' },
}
