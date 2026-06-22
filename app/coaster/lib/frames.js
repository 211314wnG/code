import * as THREE from 'three'

// Build a continuous moving frame along the curve. We use Three's Frenet-frame
// helper, which actually performs parallel transport of an initial normal (it
// rotates the normal by the angle between successive tangents). That gives a
// twist-minimising frame which, unlike a curvature-based frame, survives the
// vertical loop and straight sections without flipping.
//
// On top of that we add banking on horizontal turns so the rider leans into the
// curve. Banking is faded out where the track is steep/inverted (the loop),
// where the transported frame already does the right thing.
//
// The same frames drive both the rail geometry and the ride camera, so the
// camera roll always matches the visible track.
export function buildTrackFrames(curve, count = 1400) {
  const frenet = curve.computeFrenetFrames(count, true)
  const positions = []
  const tangents = []
  const normals = []
  const binormals = []

  // Pre-compute heading turn-rate per sample for banking.
  const headings = []
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const tan = curve.getTangentAt(t)
    headings.push(Math.atan2(tan.x, tan.z))
  }

  const maxBank = THREE.MathUtils.degToRad(55)

  // computeFrenetFrames seeds its initial normal from whichever axis is most
  // perpendicular to the first tangent, so the whole transported frame can be
  // rolled by an arbitrary amount (this is what made the view appear rotated
  // 90deg). Re-align it: roll every frame by a constant angle so the start
  // normal points to the sky. A constant roll preserves the closed continuity.
  const worldUp = new THREE.Vector3(0, 1, 0)
  const T0 = frenet.tangents[0]
  let desiredUp = worldUp.clone().addScaledVector(T0, -worldUp.dot(T0))
  if (desiredUp.lengthSq() < 1e-6) desiredUp.set(0, 0, 1).addScaledVector(T0, -T0.z)
  desiredUp.normalize()
  const N0 = frenet.normals[0]
  let align = Math.acos(THREE.MathUtils.clamp(N0.dot(desiredUp), -1, 1))
  if (new THREE.Vector3().crossVectors(N0, desiredUp).dot(T0) < 0) align = -align

  for (let i = 0; i <= count; i++) {
    const t = i / count
    const pos = curve.getPointAt(t)
    const tangent = frenet.tangents[i].clone()
    let normal = frenet.normals[i].clone()
    let binormal = frenet.binormals[i].clone()

    // Turn rate: shortest angular difference between neighbouring headings.
    const next = headings[(i + 1) % (count + 1)]
    const prev = headings[(i - 1 + count + 1) % (count + 1)]
    let dPsi = next - prev
    while (dPsi > Math.PI) dPsi -= Math.PI * 2
    while (dPsi < -Math.PI) dPsi += Math.PI * 2

    // Fade banking out as the track becomes vertical (loop) to avoid spurious
    // rolls where heading is ill-defined.
    const verticality = Math.min(1, Math.abs(tangent.y))
    const flatness = 1 - verticality
    let bank = THREE.MathUtils.clamp(dPsi * 14, -maxBank, maxBank) * flatness

    // Constant alignment roll + per-sample banking, both about the tangent.
    const q = new THREE.Quaternion().setFromAxisAngle(tangent, align + bank)
    normal.applyQuaternion(q)
    binormal.applyQuaternion(q)

    positions.push(pos)
    tangents.push(tangent.normalize())
    normals.push(normal.normalize())
    binormals.push(binormal.normalize())
  }

  return { positions, tangents, normals, binormals, count }
}

// Sample an interpolated frame at parameter u in [0, 1].
export function sampleFrame(frames, u) {
  const { positions, tangents, normals, binormals, count } = frames
  const x = THREE.MathUtils.euclideanModulo(u, 1) * count
  const i0 = Math.floor(x)
  const i1 = Math.min(i0 + 1, count)
  const f = x - i0

  const position = positions[i0].clone().lerp(positions[i1], f)
  const tangent = tangents[i0].clone().lerp(tangents[i1], f).normalize()
  const normal = normals[i0].clone().lerp(normals[i1], f).normalize()
  const binormal = binormals[i0].clone().lerp(binormals[i1], f).normalize()

  return { position, tangent, normal, binormal }
}
