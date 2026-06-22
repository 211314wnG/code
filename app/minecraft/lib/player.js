import * as THREE from 'three'

// First-person player with gravity and axis-separated voxel AABB collision.
// `eye` is the camera position; the body is a 0.6-wide, 1.8-tall box whose feet
// sit EYE_HEIGHT below the eye.
const EYE_HEIGHT = 1.62
const HALF = 0.3
const HEIGHT = 1.8
const GRAVITY = 26
const JUMP = 8.6
const ACCEL = 60
const MAX_SPEED = 5.0
const FRICTION = 10

export class Player {
  constructor(x, y, z) {
    this.eye = new THREE.Vector3(x, y, z)
    this.vel = new THREE.Vector3()
    this.yaw = 0
    this.pitch = 0
    this.onGround = false
  }

  // input: { f, b, l, r, jump }, yaw used for movement direction.
  update(dt, input, world) {
    // Desired horizontal direction from yaw.
    const sin = Math.sin(this.yaw)
    const cos = Math.cos(this.yaw)
    // forward = (-sin, 0, -cos); right = (cos, 0, -sin)
    let wx = 0, wz = 0
    if (input.f) { wx += -sin; wz += -cos }
    if (input.b) { wx += sin; wz += cos }
    if (input.l) { wx += -cos; wz += sin }
    if (input.r) { wx += cos; wz += -sin }
    const wl = Math.hypot(wx, wz)
    if (wl > 0) { wx /= wl; wz /= wl }

    // Horizontal acceleration + friction toward target velocity.
    this.vel.x += wx * ACCEL * dt
    this.vel.z += wz * ACCEL * dt
    const fr = Math.max(0, 1 - FRICTION * dt)
    if (wl === 0) { this.vel.x *= fr; this.vel.z *= fr }
    const hs = Math.hypot(this.vel.x, this.vel.z)
    if (hs > MAX_SPEED) {
      this.vel.x *= MAX_SPEED / hs
      this.vel.z *= MAX_SPEED / hs
    }

    // Gravity + jump.
    this.vel.y -= GRAVITY * dt
    if (input.jump && this.onGround) {
      this.vel.y = JUMP
      this.onGround = false
    }

    // Integrate with per-axis collision against the voxel grid.
    this.onGround = false
    this._move(0, this.vel.x * dt, world)
    this._move(1, this.vel.y * dt, world)
    this._move(2, this.vel.z * dt, world)
  }

  _feetY() {
    return this.eye.y - EYE_HEIGHT
  }

  _blocked(world) {
    const minX = Math.floor(this.eye.x - HALF)
    const maxX = Math.floor(this.eye.x + HALF)
    const minZ = Math.floor(this.eye.z - HALF)
    const maxZ = Math.floor(this.eye.z + HALF)
    const fy = this._feetY()
    const minY = Math.floor(fy)
    const maxY = Math.floor(fy + HEIGHT)
    for (let x = minX; x <= maxX; x++)
      for (let y = minY; y <= maxY; y++)
        for (let z = minZ; z <= maxZ; z++)
          if (world.isSolid(x, y, z)) return true
    return false
  }

  _move(axis, amount, world) {
    if (amount === 0) return
    const key = axis === 0 ? 'x' : axis === 1 ? 'y' : 'z'
    this.eye[key] += amount
    if (this._blocked(world)) {
      this.eye[key] -= amount
      if (axis === 1 && amount < 0) this.onGround = true
      this.vel[key] = 0
    }
  }
}

export { EYE_HEIGHT, HALF, HEIGHT }
