export const metadata = {
  title: 'Coaster POV — Three.js Roller Coaster Simulator',
  description:
    'A first-person roller coaster POV simulator built with Three.js: drops, banked turns, a vertical loop, gravity-based speed and dynamic sound.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, overflow: 'hidden', background: '#0b1220' }}>{children}</body>
    </html>
  )
}
