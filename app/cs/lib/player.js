import * as THREE from 'three'

// First-person controller with gravity, jump and axis-separated AABB collision
// against the arena's Box3 colliders. Movement logic mirrors the Minecraft game.
const EYE = 1.65
const RADIUS = 0.4
const HEIGHT = 1.75
const GRAVITY = 24
const JUMP = 8
const ACCEL = 70
const MAX_SPEED = 7
const FRICTION = 11

export class FPSPlayer {
  constructor(x, y, z) {
    this.eye = new THREE.Vector3(x, y + EYE, z)
    this.vel = new THREE.Vector3()
    this.yaw = 0
    this.pitch = 0
    this.onGround = false
    this.tmp = new THREE.Box3()
  }

  feetY() { return this.eye.y - EYE }

  setFromGround(x, z) {
    this.eye.set(x, EYE, z)
    this.vel.set(0, 0, 0)
  }

  _blocked(colliders) {
    const fy = this.feetY()
    this.tmp.min.set(this.eye.x - RADIUS, fy, this.eye.z - RADIUS)
    this.tmp.max.set(this.eye.x + RADIUS, fy + HEIGHT, this.eye.z + RADIUS)
    for (const c of colliders) if (c.intersectsBox(this.tmp)) return true
    return false
  }

  _move(axis, amt, colliders) {
    if (amt === 0) return
    const k = axis === 0 ? 'x' : axis === 1 ? 'y' : 'z'
    this.eye[k] += amt
    if (this._blocked(colliders)) {
      this.eye[k] -= amt
      if (axis === 1 && amt < 0) this.onGround = true
      this.vel[k] = 0
    }
  }

  update(dt, input, colliders) {
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw)
    let wx = 0, wz = 0
    if (input.f) { wx -= sin; wz -= cos }
    if (input.b) { wx += sin; wz += cos }
    if (input.l) { wx -= cos; wz += sin }
    if (input.r) { wx += cos; wz -= sin }
    const wl = Math.hypot(wx, wz)
    if (wl > 0) { wx /= wl; wz /= wl }

    this.vel.x += wx * ACCEL * dt
    this.vel.z += wz * ACCEL * dt
    const fr = Math.max(0, 1 - FRICTION * dt)
    if (wl === 0) { this.vel.x *= fr; this.vel.z *= fr }
    const hs = Math.hypot(this.vel.x, this.vel.z)
    if (hs > MAX_SPEED) { this.vel.x *= MAX_SPEED / hs; this.vel.z *= MAX_SPEED / hs }

    this.vel.y -= GRAVITY * dt
    if (input.jump && this.onGround) { this.vel.y = JUMP; this.onGround = false }

    this.onGround = false
    this._move(0, this.vel.x * dt, colliders)
    this._move(2, this.vel.z * dt, colliders)
    this._move(1, this.vel.y * dt, colliders)

    // Ground plane
    if (this.feetY() < 0) { this.eye.y = EYE; this.vel.y = 0; this.onGround = true }
  }
}

export { EYE, RADIUS, HEIGHT }
