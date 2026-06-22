import * as THREE from 'three'

// Procedural surface textures for the arena (all generated locally on canvas).
function canvasTex(size, draw, repeat = 1) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d'), size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function concreteTexture(repeat = 24) {
  return canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#6b6f76'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 9000; i++) {
      const v = 90 + (Math.random() * 60) | 0
      ctx.fillStyle = `rgba(${v},${v},${v + 4},0.35)`
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2)
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 2
    for (let i = 0; i <= s; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke()
    }
  }, repeat)
}

export function wallTexture(repeat = 4) {
  return canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#8a857c'
    ctx.fillRect(0, 0, s, s)
    const bh = 32, bw = 64
    for (let y = 0; y < s; y += bh) {
      const off = (y / bh) % 2 ? bw / 2 : 0
      for (let x = -bw; x < s; x += bw) {
        const v = 120 + (Math.random() * 40) | 0
        ctx.fillStyle = `rgb(${v},${v - 6},${v - 16})`
        ctx.fillRect(x + off + 2, y + 2, bw - 4, bh - 4)
      }
    }
  }, repeat)
}

export function crateTexture() {
  return canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#b07a3c'
    ctx.fillRect(0, 0, s, s)
    ctx.fillStyle = 'rgba(80,50,20,0.5)'
    ctx.fillRect(0, 0, s, 8); ctx.fillRect(0, s - 8, s, 8)
    ctx.fillRect(0, 0, 8, s); ctx.fillRect(s - 8, 0, 8, s)
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(80,50,20,0.5)'
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s, s); ctx.moveTo(s, 0); ctx.lineTo(0, s); ctx.stroke()
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = `rgba(60,40,15,${Math.random() * 0.15})`
      ctx.fillRect(Math.random() * s, Math.random() * s, 1, 6)
    }
  }, 1)
}

export function metalTexture(repeat = 2) {
  return canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#5b6066'
    ctx.fillRect(0, 0, s, s)
    for (let y = 0; y < s; y += 4) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`
      ctx.fillRect(0, y, s, 2)
    }
  }, repeat)
}

export function skyTexture() {
  const c = document.createElement('canvas')
  c.width = 16; c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#2a3550'); g.addColorStop(0.5, '#5a6a85'); g.addColorStop(1, '#aeb9c8')
  ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
