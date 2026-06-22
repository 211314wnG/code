export const metadata = {
  title: '211314wng',
  description: 'My GitHub Pages site',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
