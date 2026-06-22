import * as THREE from 'three'
import { createTerrainTexture, createSkyTexture } from './textures.js'

// Assemble the environment: sky dome, terrain, distance fog, scattered trees and
// a realistic layered lighting rig (ambient + hemisphere fill + shadow-casting
// sun) configured for soft shadows.
export function buildScene() {
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xbcd6f2, 180, 620)

  // --- Sky dome --------------------------------------------------------------
  const skyTex = createSkyTexture()
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(700, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }),
  )
  scene.add(sky)

  // --- Terrain ---------------------------------------------------------------
  const terrainTex = createTerrainTexture()
  const terrainGeo = new THREE.PlaneGeometry(1400, 1400, 64, 64)
  // Gentle rolling hills, but keep the area under the circuit flat.
  const pos = terrainGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const dist = Math.hypot(x, y)
    const falloff = THREE.MathUtils.clamp((dist - 120) / 260, 0, 1)
    const h = (Math.sin(x * 0.015) + Math.cos(y * 0.012)) * 9 * falloff
    pos.setZ(i, h)
  }
  terrainGeo.computeVertexNormals()
  const terrain = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshStandardMaterial({ map: terrainTex, roughness: 1, metalness: 0 }),
  )
  terrain.rotation.x = -Math.PI / 2
  terrain.position.y = 0
  terrain.receiveShadow = true
  scene.add(terrain)

  // --- Lighting --------------------------------------------------------------
  const ambient = new THREE.AmbientLight(0xffffff, 0.35)
  scene.add(ambient)

  const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x4a6b3a, 0.55)
  scene.add(hemi)

  const sun = new THREE.DirectionalLight(0xfff4e0, 1.4)
  sun.position.set(120, 180, 80)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 10
  sun.shadow.camera.far = 600
  sun.shadow.camera.left = -220
  sun.shadow.camera.right = 220
  sun.shadow.camera.top = 220
  sun.shadow.camera.bottom = -220
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.04
  scene.add(sun)
  scene.add(sun.target)

  // --- Scenery: scattered low-poly trees ------------------------------------
  scene.add(buildTrees())

  return { scene, sun }
}

function buildTrees() {
  const group = new THREE.Group()
  const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 4, 6)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 })
  const leafGeo = new THREE.ConeGeometry(3, 8, 7)
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7d33, roughness: 1 })

  const count = 90
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 110 + Math.random() * 230
    const x = Math.cos(angle) * radius
    const z = 70 + Math.sin(angle) * radius
    const scale = 0.7 + Math.random() * 1.1

    const tree = new THREE.Group()
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = 2
    trunk.castShadow = true
    const leaves = new THREE.Mesh(leafGeo, leafMat)
    leaves.position.y = 7
    leaves.castShadow = true
    tree.add(trunk, leaves)
    tree.position.set(x, 0, z)
    tree.scale.setScalar(scale)
    tree.rotation.y = Math.random() * Math.PI
    group.add(tree)
  }
  return group
}
