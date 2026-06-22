import * as THREE from 'three'
import { concreteTexture, wallTexture, crateTexture, metalTexture, skyTexture } from './textures.js'

// Builds a symmetric arena with perimeter walls, cover crates, low walls, a
// central raised platform with ramps and two block "buildings". Returns the
// solid colliders (Box3) and their meshes (for line-of-sight / bullet blocking),
// plus spawn points and the sun light.
export const ARENA = 80 // half-extent is ARENA/2

export function buildArena(scene) {
  scene.background = new THREE.Color(0x9fb0c4)
  scene.fog = new THREE.Fog(0x9fb0c4, 70, 160)

  // Sky dome
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 24, 12),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false }),
  )
  scene.add(sky)

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.5))
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x444038, 0.5))
  const sun = new THREE.DirectionalLight(0xfff2da, 1.25)
  sun.position.set(60, 90, 40)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 10
  sun.shadow.camera.far = 300
  const d = 70
  sun.shadow.camera.left = -d; sun.shadow.camera.right = d
  sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d
  sun.shadow.bias = -0.0004
  scene.add(sun); scene.add(sun.target)

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA, ARENA),
    new THREE.MeshStandardMaterial({ map: concreteTexture(28), roughness: 1 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const colliders = []
  const wallMeshes = []
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture(6), roughness: 0.9 })
  const crateMat = new THREE.MeshStandardMaterial({ map: crateTexture(), roughness: 0.8 })
  const metalMat = new THREE.MeshStandardMaterial({ map: metalTexture(3), roughness: 0.6, metalness: 0.4 })

  const addBox = (w, h, dp, x, y, z, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), mat)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    scene.add(m)
    const box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(w, h, dp))
    colliders.push(box)
    wallMeshes.push(m)
    return m
  }

  const H = ARENA / 2
  const t = 2
  const wh = 9
  // Perimeter
  addBox(ARENA, wh, t, 0, wh / 2, -H, wallMat)
  addBox(ARENA, wh, t, 0, wh / 2, H, wallMat)
  addBox(t, wh, ARENA, -H, wh / 2, 0, wallMat)
  addBox(t, wh, ARENA, H, wh / 2, 0, wallMat)

  // Central raised platform + ramps
  addBox(16, 3, 16, 0, 1.5, 0, metalMat)
  // ramps as thin angled boxes (treated as steps via collider; keep simple low cover instead)
  addBox(6, 1, 1.2, 0, 0.5, 11, metalMat)
  addBox(6, 1, 1.2, 0, 0.5, -11, metalMat)

  // Two block buildings
  addBox(14, 7, 10, -26, 3.5, -22, wallMat)
  addBox(10, 6, 14, 26, 3, 24, wallMat)

  // Long low cover walls
  addBox(14, 2.4, 1.5, -18, 1.2, 14, wallMat)
  addBox(14, 2.4, 1.5, 18, 1.2, -14, wallMat)
  addBox(1.5, 2.4, 12, 8, 1.2, 22, wallMat)
  addBox(1.5, 2.4, 12, -8, 1.2, -22, wallMat)

  // Scattered crates (some stacked)
  const cratePos = [
    [-12, 6], [12, -6], [20, 10], [-20, -10], [30, -2], [-30, 2],
    [6, 30], [-6, -30], [22, -28], [-22, 28], [14, 16], [-14, -16],
  ]
  for (const [x, z] of cratePos) {
    addBox(3, 3, 3, x, 1.5, z, crateMat)
    if (Math.random() < 0.4) addBox(2.4, 2.4, 2.4, x, 3 + 1.2, z, crateMat)
  }

  // Spawn points spread around the edges + corners
  const spawns = [
    new THREE.Vector3(-32, 0, -32), new THREE.Vector3(32, 0, -32),
    new THREE.Vector3(-32, 0, 32), new THREE.Vector3(32, 0, 32),
    new THREE.Vector3(0, 0, 34), new THREE.Vector3(0, 0, -34),
    new THREE.Vector3(34, 0, 0), new THREE.Vector3(-34, 0, 0),
  ]

  return { colliders, wallMeshes, spawns, sun }
}
