import * as THREE from 'three'

// Control points (x = east, y = up, z = north), in metres. The path is a closed
// circuit: station -> lift hill -> first drop -> vertical loop -> banked turns
// -> camelback hills -> banked return to the station.
//
// The vertical loop lives in the y/z plane: the train enters at the bottom
// moving +z, climbs the front, goes over the top moving -z, comes down the back
// and exits the bottom slightly ahead, continuing +z.
const CONTROL_POINTS = [
  // Station (lowest, flat)
  [0, 6, 0],
  [0, 6, 14],

  // Chain lift hill climbing to the highest point
  [0, 12, 30],
  [0, 24, 48],
  [0, 38, 66],
  [0, 46, 82], // crest

  // First big drop
  [0, 40, 92],
  [0, 20, 104],
  [0, 6, 116],

  // --- Vertical loop (centre ~ y=24, z=140, radius 18) ---
  [0, 6, 130], // approach, low
  [0, 6, 139], // bottom entry (+z)
  [0, 24, 158], // front, rising (+y)
  [0, 42, 140], // top (-z)
  [0, 24, 122], // back, descending (-y)
  [0, 6, 141], // bottom exit, slightly ahead (+z)
  [0, 8, 152], // pull out

  // Rising into a banked right turn that sweeps east
  [6, 16, 170],
  [26, 18, 182],
  [48, 18, 178],
  [62, 16, 160],

  // Camelback hills heading back west
  [66, 22, 138],
  [60, 12, 116],
  [48, 20, 96],
  [36, 10, 78],

  // Banked left turn rounding back toward the station
  [22, 12, 60],
  [4, 10, 44],
  [-14, 9, 34],
  [-20, 8, 20],

  // Final swoop back into the station
  [-12, 7, 6],
  [-4, 6, -4],
  [0, 6, -6],
]

export function createTrackCurve() {
  const points = CONTROL_POINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5)
  return curve
}

// Highest point on the curve, used as the energy reference for the physics.
export function getTrackBounds(curve, samples = 1000) {
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i <= samples; i++) {
    const p = curve.getPointAt(i / samples)
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return { minY, maxY }
}
