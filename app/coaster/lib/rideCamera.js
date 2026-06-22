import * as THREE from 'three'
import { sampleFrame } from './frames.js'

// Drives a first-person camera along the track. The camera sits at the rider's
// eye height above the track and looks a little way ahead, using the track frame
// for full tilt (pitch) and roll (banking / loop inversion). A small amount of
// smoothing keeps the motion from feeling jittery.
export class RideCamera {
  constructor(frames, { eyeHeight = 1.6, lookAhead = 0.006 } = {}) {
    this.frames = frames
    this.eyeHeight = eyeHeight
    this.lookAhead = lookAhead
    this._m = new THREE.Matrix4()
    this._targetQuat = new THREE.Quaternion()
    this._pos = new THREE.Vector3()
  }

  update(camera, u, smoothing = 0.25) {
    const here = sampleFrame(this.frames, u)
    const ahead = sampleFrame(this.frames, u + this.lookAhead)

    // Eye position: above the track along the (banked) normal.
    this._pos.copy(here.position).addScaledVector(here.normal, this.eyeHeight)

    // Orientation: forward = tangent, up = normal.
    const target = ahead.position.clone().addScaledVector(ahead.normal, this.eyeHeight)
    const forward = target.clone().sub(this._pos).normalize()
    this._m.lookAt(this._pos, target, here.normal)
    this._targetQuat.setFromRotationMatrix(this._m)

    if (smoothing > 0) {
      camera.position.lerp(this._pos, smoothing)
      camera.quaternion.slerp(this._targetQuat, smoothing)
    } else {
      camera.position.copy(this._pos)
      camera.quaternion.copy(this._targetQuat)
    }
  }
}
