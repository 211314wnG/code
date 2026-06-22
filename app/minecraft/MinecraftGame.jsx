'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createAtlasTexture } from './lib/textures.js'
import {
  World, WORLD_W, WORLD_D, AIR, GRASS, HOTBAR,
} from './lib/world.js'
import { Player, HALF, HEIGHT, EYE_HEIGHT } from './lib/player.js'
import HUD from './HUD.jsx'

export default function MinecraftGame() {
  const mountRef = useRef(null)
  const inputRef = useRef({ f: false, b: false, l: false, r: false, jump: false })
  const actionRef = useRef({ breakHeld: false, placeHeld: false })
  const selectedRef = useRef(GRASS)
  const apiRef = useRef({})

  const [selected, setSelected] = useState(GRASS)
  // Touch controls are shown on touch devices; hidden as soon as a key/mouse is
  // used, and restored on the next screen touch.
  const [touchUI, setTouchUI] = useState(
    typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
  )

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.touchAction = 'none'

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x8ec9f0)
    scene.fog = new THREE.Fog(0x8ec9f0, 60, 150)

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.05, 400)

    // World mesh
    const world = new World()
    const atlas = createAtlasTexture()
    const material = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true })
    let mesh = new THREE.Mesh(world.buildGeometry(), material)
    scene.add(mesh)

    const rebuild = () => {
      const geo = world.buildGeometry()
      mesh.geometry.dispose()
      mesh.geometry = geo
    }

    // Selection highlight
    const hl = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.001, 1.001, 1.001)),
      new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 }),
    )
    hl.visible = false
    scene.add(hl)

    // Player spawns above the centre column.
    const cx = WORLD_W / 2, cz = WORLD_D / 2
    const groundH = world.heightAt(Math.floor(cx), Math.floor(cz))
    const player = new Player(cx, groundH + 3 + EYE_HEIGHT, cz)

    const forward = new THREE.Vector3()
    const overlapsPlayer = (bx, by, bz) => {
      const minX = player.eye.x - HALF, maxX = player.eye.x + HALF
      const minZ = player.eye.z - HALF, maxZ = player.eye.z + HALF
      const fy = player.eye.y - EYE_HEIGHT
      const minY = fy, maxY = fy + HEIGHT
      return (
        bx + 1 > minX && bx < maxX &&
        by + 1 > minY && by < maxY &&
        bz + 1 > minZ && bz < maxZ
      )
    }

    const doBreak = () => {
      forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
      const hit = world.raycast(camera.position, forward, 6)
      if (!hit) return
      world.set(hit.block.x, hit.block.y, hit.block.z, AIR)
      rebuild()
    }
    const doPlace = () => {
      forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
      const hit = world.raycast(camera.position, forward, 6)
      if (!hit) return
      const tx = hit.block.x + hit.normal.x
      const ty = hit.block.y + hit.normal.y
      const tz = hit.block.z + hit.normal.z
      if (!world.inside(tx, ty, tz) || world.get(tx, ty, tz) !== AIR) return
      if (overlapsPlayer(tx, ty, tz)) return
      world.set(tx, ty, tz, selectedRef.current)
      rebuild()
    }
    apiRef.current = { doBreak, doPlace }

    // ---- Desktop input: pointer lock + mouse ----
    let locked = false
    const SENS = 0.0024
    const onClickCanvas = () => { if (!locked) canvas.requestPointerLock?.() }
    const onLockChange = () => { locked = document.pointerLockElement === canvas }
    const onMouseMove = (e) => {
      if (!locked) return
      player.yaw -= e.movementX * SENS
      player.pitch -= e.movementY * SENS
      player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch))
    }
    const onMouseDown = (e) => {
      if (!locked) return
      if (e.button === 0) actionRef.current.breakHeld = true
      else if (e.button === 2) actionRef.current.placeHeld = true
    }
    const onMouseUp = (e) => {
      if (e.button === 0) actionRef.current.breakHeld = false
      else if (e.button === 2) actionRef.current.placeHeld = false
    }
    const onContext = (e) => e.preventDefault()
    canvas.addEventListener('click', onClickCanvas)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('contextmenu', onContext)

    // ---- Keyboard ----
    const keyMap = { KeyW: 'f', KeyS: 'b', KeyA: 'l', KeyD: 'r', ArrowUp: 'f', ArrowDown: 'b', ArrowLeft: 'l', ArrowRight: 'r' }
    const onKeyDown = (e) => {
      setTouchUI(false)
      if (e.code === 'Space') { inputRef.current.jump = true; e.preventDefault() }
      const m = keyMap[e.code]
      if (m) inputRef.current[m] = true
      if (e.code.startsWith('Digit')) {
        const n = parseInt(e.code.slice(5), 10) - 1
        if (n >= 0 && n < HOTBAR.length) setSelected(HOTBAR[n])
      }
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space') inputRef.current.jump = false
      const m = keyMap[e.code]
      if (m) inputRef.current[m] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    const onAnyMouseDown = () => setTouchUI(false)
    window.addEventListener('mousedown', onAnyMouseDown)

    // ---- Touch look (on empty canvas areas; HUD buttons handle their own) ----
    let lookId = null, lastX = 0, lastY = 0
    const onTouchStart = (e) => {
      setTouchUI(true)
      const t = e.changedTouches[0]
      if (lookId === null) { lookId = t.identifier; lastX = t.clientX; lastY = t.clientY }
    }
    const onTouchMove = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookId) {
          player.yaw -= (t.clientX - lastX) * 0.005
          player.pitch -= (t.clientY - lastY) * 0.005
          player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch))
          lastX = t.clientX; lastY = t.clientY
        }
      }
    }
    const onTouchEnd = (e) => {
      for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null
    }
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd)
    canvas.addEventListener('touchcancel', onTouchEnd)

    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    let raf
    let lastAct = 0
    const euler = new THREE.Euler(0, 0, 0, 'YXZ')

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)

      player.update(dt, inputRef.current, world)
      camera.position.copy(player.eye)
      euler.set(player.pitch, player.yaw, 0)
      camera.quaternion.setFromEuler(euler)

      // Highlight targeted block.
      forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
      const hit = world.raycast(camera.position, forward, 6)
      if (hit) {
        hl.visible = true
        hl.position.set(hit.block.x + 0.5, hit.block.y + 0.5, hit.block.z + 0.5)
      } else hl.visible = false

      // Break / place on held action with a cooldown.
      const now = performance.now()
      if (now - lastAct > 180) {
        if (actionRef.current.breakHeld) { doBreak(); lastAct = now }
        else if (actionRef.current.placeHeld) { doPlace(); lastAct = now }
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('click', onClickCanvas)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('contextmenu', onContext)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onAnyMouseDown)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
      if (document.pointerLockElement === canvas) document.exitPointerLock?.()
      mesh.geometry.dispose()
      material.dispose()
      atlas.dispose()
      hl.geometry.dispose()
      hl.material.dispose()
      renderer.dispose()
      if (canvas.parentNode === mount) mount.removeChild(canvas)
    }
  }, [])

  const setMove = (dir, active) => { inputRef.current[dir] = active }
  const setJump = (active) => { inputRef.current.jump = active }
  const setBreak = (active) => { actionRef.current.breakHeld = active }
  const setPlace = (active) => { actionRef.current.placeHeld = active }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#8ec9f0' }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
      <HUD
        touchUI={touchUI}
        selected={selected}
        onSelect={setSelected}
        onMove={setMove}
        onJump={setJump}
        onBreak={setBreak}
        onPlace={setPlace}
      />
    </div>
  )
}
