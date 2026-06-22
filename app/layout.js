export const metadata = {
  title: '游戏合集 · Game Hub',
  description:
    '用 Three.js 打造的网页游戏合集：体素沙盒「我的世界」与第一人称「过山车」模拟。',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: '#0b1220' }}>{children}</body>
    </html>
  )
}
