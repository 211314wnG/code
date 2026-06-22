import * as THREE from 'three'
import { TILES, ATLAS_COLS } from './textures.js'

// Block ids
export const AIR = 0
export const GRASS = 1
export const DIRT = 2
export const STONE = 3
export const LOG = 4
export const LEAVES = 5
export const SAND = 6
export const PLANKS = 7
export const COBBLE = 8

// Blocks available in the hotbar.
export const HOTBAR = [GRASS, DIRT, STONE, LOG, PLANKS, LEAVES, SAND, COBBLE]

// Per-block face tiles: [top, bottom, side]
const FACE_TILES = {
  [GRASS]: [TILES.GRASS_TOP, TILES.DIRT, TILES.GRASS_SIDE],
  [DIRT]: [TILES.DIRT, TILES.DIRT, TILES.DIRT],
  [STONE]: [TILES.STONE, TILES.STONE, TILES.STONE],
  [LOG]: [TILES.LOG_TOP, TILES.LOG_TOP, TILES.LOG_SIDE],
  [LEAVES]: [TILES.LEAVES, TILES.LEAVES, TILES.LEAVES],
  [SAND]: [TILES.SAND, TILES.SAND, TILES.SAND],
  [PLANKS]: [TILES.PLANKS, TILES.PLANKS, TILES.PLANKS],
  [COBBLE]: [TILES.COBBLE, TILES.COBBLE, TILES.COBBLE],
}

export const WORLD_W = 56
export const WORLD_D = 56
export const WORLD_H = 28

// Outward-CCW unit-cube faces: dir vector, 4 corner offsets, brightness.
const FACES = [
  { n: [1, 0, 0], b: 0.78, c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { n: [-1, 0, 0], b: 0.78, c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { n: [0, 1, 0], b: 1.0, c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], b: 0.5, c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], b: 0.62, c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], b: 0.62, c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
]
const UVQ = [[0, 1], [1, 1], [1, 0], [0, 0]]

// Tiny value-noise FBM for terrain.
function hash2(x, z) {
  let n = (x | 0) * 374761393 + (z | 0) * 668265263
  n = (n ^ (n >> 13)) * 1274126177
  return ((n ^ (n >> 16)) >>> 0) / 4294967295
}
function smoothNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z)
  const xf = x - xi, zf = z - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = zf * zf * (3 - 2 * zf)
  const a = hash2(xi, zi), b = hash2(xi + 1, zi)
  const c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1)
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}
function fbm(x, z) {
  let sum = 0, amp = 1, freq = 1, norm = 0
  for (let o = 0; o < 4; o++) {
    sum += smoothNoise(x * freq, z * freq) * amp
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

export class World {
  constructor() {
    this.data = new Uint8Array(WORLD_W * WORLD_H * WORLD_D)
    this.generate()
  }

  idx(x, y, z) {
    return x + WORLD_W * (z + WORLD_D * y)
  }
  inside(x, y, z) {
    return x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H && z >= 0 && z < WORLD_D
  }
  get(x, y, z) {
    if (!this.inside(x, y, z)) return AIR
    return this.data[this.idx(x, y, z)]
  }
  set(x, y, z, v) {
    if (!this.inside(x, y, z)) return
    this.data[this.idx(x, y, z)] = v
  }
  isSolid(x, y, z) {
    return this.get(x, y, z) !== AIR
  }

  heightAt(x, z) {
    const base = 8
    const h = base + Math.floor(fbm(x * 0.08 + 10, z * 0.08 + 10) * 9)
    return Math.max(2, Math.min(WORLD_H - 6, h))
  }

  generate() {
    for (let x = 0; x < WORLD_W; x++) {
      for (let z = 0; z < WORLD_D; z++) {
        const h = this.heightAt(x, z)
        for (let y = 0; y <= h; y++) {
          let b = STONE
          if (y === h) b = h <= 6 ? SAND : GRASS
          else if (y >= h - 3) b = DIRT
          this.set(x, y, z, b)
        }
      }
    }
    // Scatter a few trees on grass.
    let placed = 0
    for (let i = 0; i < 400 && placed < 14; i++) {
      const x = 4 + ((Math.random() * (WORLD_W - 8)) | 0)
      const z = 4 + ((Math.random() * (WORLD_D - 8)) | 0)
      // Keep the spawn column (world centre) clear so the player never drops
      // into a canopy.
      if (Math.hypot(x - WORLD_W / 2, z - WORLD_D / 2) < 4) continue
      const h = this.heightAt(x, z)
      if (this.get(x, h, z) !== GRASS) continue
      this.placeTree(x, h + 1, z)
      placed++
    }
  }

  placeTree(x, y, z) {
    const trunk = 4 + ((Math.random() * 2) | 0)
    for (let i = 0; i < trunk; i++) this.set(x, y + i, z, LOG)
    const top = y + trunk
    for (let dy = -1; dy <= 1; dy++) {
      const r = dy === 1 ? 1 : 2
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx === 0 && dz === 0 && dy < 1) continue
          if (Math.abs(dx) === r && Math.abs(dz) === r && Math.random() < 0.5) continue
          if (this.get(x + dx, top + dy, z + dz) === AIR) this.set(x + dx, top + dy, z + dz, LEAVES)
        }
      }
    }
  }

  // Build a single merged geometry of all exposed faces.
  buildGeometry() {
    const positions = []
    const uvs = []
    const colors = []
    const indices = []
    let vi = 0
    const pad = 0.0015

    for (let y = 0; y < WORLD_H; y++) {
      for (let z = 0; z < WORLD_D; z++) {
        for (let x = 0; x < WORLD_W; x++) {
          const block = this.get(x, y, z)
          if (block === AIR) continue
          const tiles = FACE_TILES[block]
          for (const f of FACES) {
            const nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2]
            if (this.isSolid(nx, ny, nz)) continue // face hidden
            const tile = f.n[1] === 1 ? tiles[0] : f.n[1] === -1 ? tiles[1] : tiles[2]
            const u0 = (tile + pad) / ATLAS_COLS
            const u1 = (tile + 1 - pad) / ATLAS_COLS
            for (let k = 0; k < 4; k++) {
              const c = f.c[k]
              positions.push(x + c[0], y + c[1], z + c[2])
              const uvq = UVQ[k]
              uvs.push(uvq[0] === 0 ? u0 : u1, uvq[1] === 0 ? pad : 1 - pad)
              colors.push(f.b, f.b, f.b)
            }
            indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3)
            vi += 4
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.setIndex(indices)
    geo.computeBoundingSphere()
    return geo
  }

  // Voxel DDA raycast. Returns { block:{x,y,z}, normal:{x,y,z} } or null.
  raycast(origin, dir, maxDist = 6) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z)
    const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z)
    const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity
    const fr = (a, s) => (s > 0 ? Math.ceil(a) - a : a - Math.floor(a))
    let tMaxX = stepX !== 0 ? fr(origin.x, stepX) * tDeltaX : Infinity
    let tMaxY = stepY !== 0 ? fr(origin.y, stepY) * tDeltaY : Infinity
    let tMaxZ = stepZ !== 0 ? fr(origin.z, stepZ) * tDeltaZ : Infinity
    let nx = 0, ny = 0, nz = 0

    for (let i = 0; i < 100; i++) {
      if (this.isSolid(x, y, z)) {
        return { block: { x, y, z }, normal: { x: nx, y: ny, z: nz } }
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        if (tMaxX > maxDist) break
        x += stepX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0
      } else if (tMaxY < tMaxZ) {
        if (tMaxY > maxDist) break
        y += stepY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0
      } else {
        if (tMaxZ > maxDist) break
        z += stepZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ
      }
    }
    return null
  }
}
