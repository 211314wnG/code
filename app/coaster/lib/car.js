import * as THREE from 'three'

// A simple front coaster car, parented to the camera so it always sits just
// below/ahead of the rider's eyes — you see the nose of the car dive into every
// drop, which sells the first-person feel. Local space: camera looks down -Z,
// up is +Y.
export function buildCar() {
  const car = new THREE.Group()
  car.name = 'coaster-car'

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe23b2e, metalness: 0.5, roughness: 0.35 })
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x1c1c22, metalness: 0.4, roughness: 0.6 })
  const barMat = new THREE.MeshStandardMaterial({ color: 0xf0c020, metalness: 0.7, roughness: 0.3 })

  // Main hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 3.2), bodyMat)
  hull.position.set(0, -1.5, -2.0)
  car.add(hull)

  // Tapered nose pointing forward (-Z)
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.8, 4), bodyMat)
  nose.rotation.x = -Math.PI / 2
  nose.rotation.y = Math.PI / 4
  nose.position.set(0, -1.5, -3.6)
  nose.scale.set(1, 1, 0.6)
  car.add(nose)

  // Side walls
  for (const sx of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 2.8), trimMat)
    wall.position.set(sx * 1.05, -1.2, -1.9)
    car.add(wall)
  }

  // Lap / safety bar arcing across in front of the rider
  const bar = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.07, 8, 16, Math.PI), barMat)
  bar.rotation.x = Math.PI / 2
  bar.position.set(0, -0.7, -0.9)
  car.add(bar)

  // Grab handles on the bar
  for (const sx of [-0.5, 0.5]) {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), barMat)
    handle.position.set(sx, -0.95, -0.85)
    car.add(handle)
  }

  // The car is cosmetic foreground; keep it out of the shadow pass.
  car.traverse((o) => {
    o.castShadow = false
    o.receiveShadow = false
  })
  car.renderOrder = 2
  return car
}
