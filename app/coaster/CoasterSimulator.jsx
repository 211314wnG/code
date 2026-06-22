'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createTrackCurve, getTrackBounds } from './lib/track.js'
import { buildTrackFrames } from './lib/frames.js'
import { buildTrackMesh } from './lib/trackMesh.js'
import { buildScene } from './lib/scene.js'
import { CoasterPhysics } from './lib/physics.js'
import { RideCamera } from './lib/rideCamera.js'
import { CoasterAudio } from './lib/audio.js'
import { buildCar } from './lib/car.js'
import HUD from './HUD.jsx'

// Top-level client component. Owns the Three.js renderer, the animation loop and
// the wiring between physics, camera and audio. Everything is torn down on
// unmount so the component is safe inside React's dev double-mount.
export default function CoasterSimulator() {
  const mountRef = useRef(null)
  const audioRef = useRef(null)
  const speedRef = useRef(0)
  const runningRef = useRef(false)

  const [started, setStarted] = useState(false)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)

    // World + track.
    const { scene } = buildScene()
    const curve = createTrackCurve()
    const frames = buildTrackFrames(curve, 1400)
    const trackMesh = buildTrackMesh(curve, frames)
    scene.add(trackMesh)

    const camera = new THREE.PerspectiveCamera(78, mount.clientWidth / mount.clientHeight, 0.1, 2000)

    // Front car parented to the camera (rides in the rider's view).
    const car = buildCar()
    camera.add(car)
    scene.add(camera)

    const bounds = getTrackBounds(curve)
    const trackLength = curve.getLength()
    const physics = new CoasterPhysics({ trackLength })
    const rideCamera = new RideCamera(frames, { eyeHeight: 1.6, lookAhead: 0.006 })

    const audio = new CoasterAudio()
    audioRef.current = audio

    // Place the camera before the first frame so there is no flash.
    rideCamera.update(camera, 0, 0)

    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    let raf

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)

      if (runningRef.current) {
        const u = physics.u
        const tangent = curve.getTangentAt(u)
        physics.update(dt, tangent.y)
        rideCamera.update(camera, physics.u, 0.35)

        const speed01 = (physics.speed - physics.minSpeed) / (physics.maxSpeed - physics.minSpeed)
        const onLift = physics.u > physics.liftStart && physics.u < physics.liftEnd

        // High-speed camera shake for extra thrill (the parented car rides
        // with the camera, so only the world appears to rattle).
        const shake = speed01 * speed01 * 0.07
        if (shake > 0.001) {
          camera.position.x += (Math.random() - 0.5) * shake
          camera.position.y += (Math.random() - 0.5) * shake
          camera.position.z += (Math.random() - 0.5) * shake
        }

        // Speed feedback for HUD (km/h-ish) and audio.
        speedRef.current = physics.speed * 3.6
        audio.update(speed01, onLift)
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      audio.dispose()
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach((m) => {
            if (m.map) m.map.dispose()
            m.dispose()
          })
        }
      })
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  const handleStart = () => {
    setStarted(true)
    runningRef.current = true
    audioRef.current?.start()
  }

  const handleToggleMute = () => {
    const next = !muted
    setMuted(next)
    audioRef.current?.setMuted(next)
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
      <HUD
        started={started}
        onStart={handleStart}
        muted={muted}
        onToggleMute={handleToggleMute}
        speedRef={speedRef}
      />
    </div>
  )
}
