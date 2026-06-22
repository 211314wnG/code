import * as THREE from 'three'

// A crafted low-poly rifle parented to the camera (the in-engine fallback model),
// with recoil animation and a muzzle flash. Positioned lower-right in view.
export class Weapon {
  constructor(camera) {
    this.group = new THREE.Group()
    this.recoil = 0
    this.basePos = new THREE.Vector3(0.28, -0.28, -0.6)

    const body = new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.6, roughness: 0.45 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x17181c, metalness: 0.5, roughness: 0.6 })
    const accent = new THREE.MeshStandardMaterial({ color: 0x3a4756, metalness: 0.7, roughness: 0.4 })

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.6), body)
    receiver.position.set(0, 0, 0)
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 12), dark)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.02, -0.55)
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.34), accent)
    handguard.position.set(0, 0.01, -0.34)
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.12), dark)
    mag.position.set(0, -0.2, 0.04)
    mag.rotation.x = 0.2
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), dark)
    grip.position.set(0, -0.16, 0.2)
    grip.rotation.x = 0.35
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.26), body)
    stock.position.set(0, -0.02, 0.42)
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.1), dark)
    sight.position.set(0, 0.12, 0.05)

    this.group.add(receiver, barrel, handguard, mag, grip, stock, sight)

    // Muzzle flash
    this.muzzlePos = new THREE.Vector3(0, 0.02, -0.85)
    const flashMat = new THREE.SpriteMaterial({
      color: 0xfff2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthTest: false,
    })
    this.flash = new THREE.Sprite(flashMat)
    this.flash.scale.set(0.5, 0.5, 0.5)
    this.flash.position.copy(this.muzzlePos)
    this.group.add(this.flash)

    this.group.position.copy(this.basePos)
    this.group.traverse((o) => { o.renderOrder = 10; if (o.material) o.material.depthTest = o === this.flash ? false : true })
    camera.add(this.group)
  }

  fire() {
    this.recoil = Math.min(1, this.recoil + 0.6)
    this.flash.material.opacity = 1
    this.flash.material.rotation = Math.random() * Math.PI
    this.flash.scale.setScalar(0.4 + Math.random() * 0.3)
  }

  update(dt) {
    this.recoil = Math.max(0, this.recoil - dt * 6)
    const r = this.recoil
    this.group.position.set(this.basePos.x, this.basePos.y, this.basePos.z + r * 0.12)
    this.group.rotation.x = r * 0.25
    this.flash.material.opacity *= Math.max(0, 1 - dt * 18)
  }
}
