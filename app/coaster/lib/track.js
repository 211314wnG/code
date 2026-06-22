import * as THREE from 'three'

// Control points (x = east, y = up, z = north), in metres. The path is a long
// closed circuit: station -> tall lift hill -> steep first drop -> big vertical
// loop -> high banked turn -> descending helix -> airtime camelbacks -> a second
// (smaller) loop -> banked return to the station.
//
// Vertical loops live in the y/z plane: the train enters at the bottom moving
// +z, climbs the front, goes over the top moving -z, comes down the back and
// exits the bottom slightly ahead, continuing +z.
const CONTROL_POINTS = [
  // Station (lowest, flat)
  [0, 7, 0],
  [0, 7, 18],

  // Tall chain lift hill climbing to the highest point (~74 m)
  [0, 16, 42],
  [0, 32, 64],
  [0, 50, 84],
  [0, 66, 102],
  [0, 74, 118], // crest

  // Steep, near-vertical first drop
  [0, 68, 130],
  [0, 42, 140],
  [0, 16, 148],
  [0, 6, 158],

  // --- Vertical loop #1 (centre ~ y=32, z=184, radius 26) ---
  [0, 6, 170], // bottom entry (+z)
  [0, 32, 210], // front, rising (+y)
  [0, 58, 184], // top (-z)
  [0, 32, 158], // back, descending (-y)
  [0, 7, 186], // bottom exit, slightly ahead (+z)
  [0, 13, 202], // pull out

  // Rising into a high, fast banked right turn sweeping east
  [16, 26, 220],
  [48, 34, 232],
  [82, 34, 224],
  [104, 28, 196],

  // Descending helix (a corkscrewing spiral down to the west)
  [108, 22, 166],
  [92, 16, 146],
  [64, 14, 152],
  [56, 18, 180],
  [78, 14, 198],
  [98, 10, 178],

  // Big airtime camelback hills heading back west
  [86, 28, 150],
  [66, 10, 128],
  [44, 24, 106],
  [24, 9, 86],

  // --- Vertical loop #2 (smaller, centre ~ y=24, z=64, radius 17) ---
  [8, 8, 74],
  [8, 24, 92],
  [8, 41, 74],
  [8, 24, 56],
  [8, 9, 75],

  // Banked left turn rounding home
  [-6, 12, 56],
  [-22, 11, 40],
  [-26, 9, 22],
  [-18, 8, 6],

  // Final swoop back into the station
  [-8, 7, -4],
  [0, 7, -6],
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
