import * as THREE from 'three'

// A procedural texture atlas for the voxel world. Every block face tile is
// painted onto one canvas row, so the whole world can use a single material.
// NearestFilter keeps the blocky Minecraft look. All generated locally.

export const TILES = {
  GRASS_TOP: 0,
  GRASS_SIDE: 1,
  DIRT: 2,
  STONE: 3,
  LOG_SIDE: 4,
  LOG_TOP: 5,
  LEAVES: 6,
  SAND: 7,
  PLANKS: 8,
  COBBLE: 9,
}
const COLS = 10
const TS = 16

function noiseFill(ctx, x0, base, spread) {
  for (let y = 0; y < TS; y++) {
    for (let x = 0; x < TS; x++) {
      const n = (Math.random() - 0.5) * spread
      const r = clamp(base[0] + n)
      const g = clamp(base[1] + n)
      const b = clamp(base[2] + n)
      ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`
      ctx.fillRect(x0 + x, y, 1, 1)
    }
  }
}
const clamp = (v) => Math.max(0, Math.min(255, v))

export function createAtlasTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = COLS * TS
  canvas.height = TS
  const ctx = canvas.getContext('2d')

  const x = (i) => i * TS

  // Grass top
  noiseFill(ctx, x(TILES.GRASS_TOP), [86, 145, 62], 28)
  // Grass side: dirt with a green lip on top
  noiseFill(ctx, x(TILES.GRASS_SIDE), [134, 96, 62], 26)
  ctx.save()
  for (let px = 0; px < TS; px++) {
    const h = 3 + ((Math.random() * 3) | 0)
    for (let py = 0; py < h; py++) {
      const n = (Math.random() - 0.5) * 28
      ctx.fillStyle = `rgb(${clamp(86 + n)|0},${clamp(145 + n)|0},${clamp(62 + n)|0})`
      ctx.fillRect(x(TILES.GRASS_SIDE) + px, py, 1, 1)
    }
  }
  ctx.restore()
  // Dirt
  noiseFill(ctx, x(TILES.DIRT), [134, 96, 62], 26)
  // Stone
  noiseFill(ctx, x(TILES.STONE), [128, 128, 132], 22)
  // Log side: brown with vertical streaks
  noiseFill(ctx, x(TILES.LOG_SIDE), [104, 78, 46], 18)
  for (let px = 0; px < TS; px += 2) {
    ctx.fillStyle = 'rgba(60,42,24,0.4)'
    ctx.fillRect(x(TILES.LOG_SIDE) + px, 0, 1, TS)
  }
  // Log top: rings
  noiseFill(ctx, x(TILES.LOG_TOP), [150, 116, 72], 16)
  ctx.strokeStyle = 'rgba(90,66,38,0.6)'
  for (let r = 2; r < 8; r += 2) {
    ctx.beginPath()
    ctx.arc(x(TILES.LOG_TOP) + 8, 8, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  // Leaves
  noiseFill(ctx, x(TILES.LEAVES), [48, 110, 42], 40)
  // Sand
  noiseFill(ctx, x(TILES.SAND), [214, 198, 142], 18)
  // Planks
  noiseFill(ctx, x(TILES.PLANKS), [171, 132, 80], 16)
  for (let py = 0; py < TS; py += 4) {
    ctx.fillStyle = 'rgba(90,66,38,0.45)'
    ctx.fillRect(x(TILES.PLANKS), py, TS, 1)
  }
  // Cobblestone
  noiseFill(ctx, x(TILES.COBBLE), [116, 116, 120], 30)

  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export const ATLAS_COLS = COLS
