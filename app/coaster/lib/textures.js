import * as THREE from 'three'

// All textures are generated procedurally on a <canvas> at runtime. This keeps
// every visual asset local to the project (no CDN / network fetch) while still
// giving the scene rich, tileable surfaces.

function makeCanvas(size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

function finishTexture(canvas, repeat = 1) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeat)
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Grassy terrain with subtle noise so the ground does not read as flat colour.
export function createTerrainTexture() {
  const size = 512
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#3f7d3a'
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 24000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const shade = 40 + Math.floor(Math.random() * 90)
    const g = 90 + Math.floor(Math.random() * 70)
    ctx.fillStyle = `rgba(${shade},${g},${Math.floor(shade * 0.6)},0.5)`
    ctx.fillRect(x, y, 1.5, 1.5)
  }

  // a few dirt patches for variation
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 10 + Math.random() * 40
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, 'rgba(120,95,60,0.35)')
    grad.addColorStop(1, 'rgba(120,95,60,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  return finishTexture(canvas, 60)
}

// Brushed-metal look for the rails.
export function createMetalTexture() {
  const size = 128
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#c0382b'
  ctx.fillRect(0, 0, size, size)
  for (let y = 0; y < size; y++) {
    const v = 0.5 + 0.5 * Math.sin(y * 0.5)
    ctx.fillStyle = `rgba(0,0,0,${0.05 + v * 0.08})`
    ctx.fillRect(0, y, size, 1)
  }
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`
    ctx.fillRect(x, y, 1, 1)
  }

  return finishTexture(canvas, 1)
}

// Painted steel for the support structure.
export function createSupportTexture() {
  const size = 128
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#37474f'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth = 2
  for (let i = -size; i < size; i += 12) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + size, size)
    ctx.stroke()
  }

  return finishTexture(canvas, 1)
}

// Gradient sky painted onto a canvas, mapped to the inside of the sky dome.
export function createSkyTexture() {
  const w = 16
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0.0, '#1b3a78')
  grad.addColorStop(0.45, '#5b8fd6')
  grad.addColorStop(0.75, '#bcd6f2')
  grad.addColorStop(1.0, '#e9f3ff')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
