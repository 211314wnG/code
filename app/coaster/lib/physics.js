// Gravity-driven speed model for the train.
//
// The train accelerates as the tangent points downhill and decelerates climbing,
// plus a little rolling/air drag. A chain lift drives the train up the first
// hill at a steady speed, and a speed floor guarantees the circuit always
// completes (including the loop). Speed is reported in scene units/second; the
// HUD converts it to a km/h-style readout.
export class CoasterPhysics {
  constructor({ trackLength, gravity = 26, drag = 0.02, minSpeed = 6, maxSpeed = 70 }) {
    this.trackLength = trackLength
    this.gravity = gravity
    this.drag = drag
    this.minSpeed = minSpeed
    this.maxSpeed = maxSpeed

    this.distance = 0 // metres travelled along the track
    this.speed = minSpeed

    // The lift hill region (as a fraction of the track) where the chain pulls
    // the train upward at a steady pace.
    this.liftStart = 0.02
    this.liftEnd = 0.16
    this.liftSpeed = 11
  }

  get u() {
    return (this.distance / this.trackLength) % 1
  }

  // tangentY: vertical component of the unit tangent (negative = descending).
  update(dt, tangentY) {
    const u = this.u

    if (u > this.liftStart && u < this.liftEnd) {
      // Chain lift: ease toward a steady climb speed.
      this.speed += (this.liftSpeed - this.speed) * Math.min(1, dt * 2)
    } else {
      // a = -g * sin(slope); tangentY is sin(slope).
      const accel = -this.gravity * tangentY
      this.speed += accel * dt
      this.speed -= this.drag * this.speed * dt
    }

    if (this.speed < this.minSpeed) this.speed = this.minSpeed
    if (this.speed > this.maxSpeed) this.speed = this.maxSpeed

    this.distance += this.speed * dt
    return this.u
  }
}
