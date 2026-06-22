import * as THREE from 'three'
import { createMetalTexture, createSupportTexture } from './textures.js'

const RAIL_GAUGE = 1.4 // half-distance between the two running rails
const RAIL_RISE = 0.5 // how far rails sit above the spine
const RAIL_RADIUS = 0.18
const TERRAIN_Y = 0 // ground level for support beams

// Build the full track group: two running rails, a centre spine, cross ties and
// vertical support beams down to the terrain.
export function buildTrackMesh(curve, frames) {
  const group = new THREE.Group()
  group.name = 'coaster-track'

  const metalTex = createMetalTexture()
  const supportTex = createSupportTexture()

  const railMat = new THREE.MeshStandardMaterial({
    map: metalTex,
    color: 0xff5544,
    metalness: 0.7,
    roughness: 0.35,
  })
  const spineMat = new THREE.MeshStandardMaterial({
    color: 0x9aa7b0,
    metalness: 0.8,
    roughness: 0.4,
  })
  const tieMat = new THREE.MeshStandardMaterial({
    color: 0x6d7b86,
    metalness: 0.6,
    roughness: 0.5,
  })
  const supportMat = new THREE.MeshStandardMaterial({
    map: supportTex,
    color: 0x4a5a64,
    metalness: 0.5,
    roughness: 0.6,
  })

  const { positions, normals, binormals, count } = frames

  const leftPts = []
  const rightPts = []
  const spinePts = []
  for (let i = 0; i <= count; i++) {
    const p = positions[i]
    const n = normals[i]
    const b = binormals[i]
    const up = n.clone().multiplyScalar(RAIL_RISE)
    leftPts.push(p.clone().add(b.clone().multiplyScalar(-RAIL_GAUGE)).add(up))
    rightPts.push(p.clone().add(b.clone().multiplyScalar(RAIL_GAUGE)).add(up))
    spinePts.push(p.clone())
  }

  const railSegments = count
  const leftRail = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftPts, true), railSegments, RAIL_RADIUS, 12, true),
    railMat,
  )
  const rightRail = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightPts, true), railSegments, RAIL_RADIUS, 12, true),
    railMat,
  )
  const spine = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spinePts, true), railSegments, 0.28, 10, true),
    spineMat,
  )
  for (const m of [leftRail, rightRail, spine]) {
    m.castShadow = true
    m.receiveShadow = true
    group.add(m)
  }

  // Cross ties at a regular spacing.
  const tieGeo = new THREE.BoxGeometry(RAIL_GAUGE * 2 + 0.5, 0.18, 0.5)
  const tieEvery = Math.max(1, Math.round(count / 320))
  for (let i = 0; i <= count; i += tieEvery) {
    const p = positions[i]
    const n = normals[i]
    const b = binormals[i]
    const t = new THREE.Vector3().crossVectors(n, b).normalize() // tangent
    const tie = new THREE.Mesh(tieGeo, tieMat)
    tie.position.copy(p).add(n.clone().multiplyScalar(RAIL_RISE * 0.4))
    const basis = new THREE.Matrix4().makeBasis(b, n, t)
    tie.quaternion.setFromRotationMatrix(basis)
    tie.castShadow = true
    tie.receiveShadow = true
    group.add(tie)
  }

  // Vertical support beams to the ground, only where the column below is clear
  // (so beams never punch through a loop, helix or any lower track section).
  const tangents = frames.tangents
  const supportEvery = Math.max(1, Math.round(count / 70))
  const beamUp = new THREE.Vector3(0, 1, 0)
  const columnClear = (p, py) => {
    for (let j = 0; j <= count; j += 4) {
      const q = positions[j]
      if (q.y < py - 2 && Math.hypot(q.x - p.x, q.z - p.z) < 2.2) return false
    }
    return true
  }
  for (let i = 0; i <= count; i += supportEvery) {
    const p = positions[i]
    const height = p.y - TERRAIN_Y
    if (height < 3) continue // too low / underground to bother
    if (Math.abs(tangents[i].y) > 0.5) continue // steep/inverted (loop) section
    if (!columnClear(p, p.y)) continue // track passes underneath -> would clip

    const beamGeo = new THREE.CylinderGeometry(0.32, 0.45, height, 8)
    const beam = new THREE.Mesh(beamGeo, supportMat)
    beam.position.set(p.x, TERRAIN_Y + height / 2, p.z)
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamUp)
    beam.castShadow = true
    beam.receiveShadow = true
    group.add(beam)

    // A short diagonal brace for taller supports.
    if (height > 14) {
      const braceLen = height * 0.6
      const braceGeo = new THREE.CylinderGeometry(0.18, 0.18, braceLen, 6)
      const brace = new THREE.Mesh(braceGeo, supportMat)
      brace.position.set(p.x + 2.2, TERRAIN_Y + height * 0.35, p.z)
      brace.rotation.z = THREE.MathUtils.degToRad(28)
      brace.castShadow = true
      group.add(brace)
    }
  }

  return group
}
