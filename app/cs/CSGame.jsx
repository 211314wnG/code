'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { buildArena } from './lib/arena.js'
import { FPSPlayer } from './lib/player.js'
import { Weapon } from './lib/weapon.js'
import { GunAudio } from './lib/audio.js'
import { BotManager } from './lib/bots.js'
import HUD from './HUD.jsx'

const MAG = 30
const FIRE_MS = 110
const RELOAD_MS = 1200
const NUM_BOTS = 8

export default function CSGame() {
  const mountRef = useRef(null)
  const inputRef = useRef({ f: false, b: false, l: false, r: false, jump: false, fire: false })
  const apiRef = useRef({})
  const runningRef = useRef(false)

  const [phase, setPhase] = useState('loading') // loading | ready | playing
  const [health, setHealth] = useState(100)
  const [ammo, setAmmo] = useState(MAG)
  const [kills, setKills] = useState(0)
  const [reloading, setReloading] = useState(false)
  const [muted, setMuted] = useState(false)
  const [touchUI, setTouchUI] = useState(
    typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
  )

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.touchAction = 'none'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(78, mount.clientWidth / mount.clientHeight, 0.05, 600)
    scene.add(camera)

    const { colliders, wallMeshes, spawns } = buildArena(scene)
    const player = new FPSPlayer(0, 0, 30)
    player.yaw = Math.PI
    const weapon = new Weapon(camera)
    const audio = new GunAudio()

    const bots = new BotManager(scene)
    bots.setSpawns(spawns)
    let botsReady = false
    bots.load().then(() => {
      bots.spawn(NUM_BOTS, spawns)
      botsReady = true
      setPhase('ready')
    }).catch((e) => { console.error('model load failed', e); setPhase('ready') })

    // ---- gameplay state (refs for the loop) ----
    const st = { health: 100, ammo: MAG, kills: 0, reloading: false, lastFire: 0, dead: false, respawnAt: 0 }
    const hurt = (dmg) => {
      if (st.dead) return
      st.health = Math.max(0, st.health - dmg)
      setHealth(st.health)
      audio.hurt()
      if (st.health <= 0) {
        st.dead = true
        st.respawnAt = performance.now() / 1000 + 1.6
      }
    }

    const ray = new THREE.Raycaster()
    ray.far = 300
    const center = new THREE.Vector2(0, 0)
    const doFire = () => {
      if (st.dead || st.reloading) return
      const now = performance.now()
      if (now - st.lastFire < FIRE_MS) return
      if (st.ammo <= 0) return
      st.lastFire = now
      st.ammo--
      setAmmo(st.ammo)
      weapon.fire(); audio.shoot()
      ray.setFromCamera(center, camera)
      const targets = [...wallMeshes, ...bots.hitMeshes]
      const hits = ray.intersectObjects(targets, false)
      if (hits.length) {
        const h = hits[0]
        if (h.object.userData.bot) {
          const res = bots.damageByMesh(h.object, 34, spawns)
          if (res === 'killed') { st.kills++; setKills(st.kills) }
          if (res) audio.hit()
        }
      }
    }
    const doReload = () => {
      if (st.reloading || st.ammo === MAG || st.dead) return
      st.reloading = true; setReloading(true); audio.reload()
      setTimeout(() => { st.ammo = MAG; setAmmo(MAG); st.reloading = false; setReloading(false) }, RELOAD_MS)
    }
    apiRef.current = { doReload, audio }

    // ---- desktop input ----
    let locked = false
    const SENS = 0.0022
    const onClick = () => { if (!locked && runningRef.current) canvas.requestPointerLock?.() }
    const onLock = () => { locked = document.pointerLockElement === canvas }
    const onMouseMove = (e) => {
      if (!locked) return
      player.yaw -= e.movementX * SENS
      player.pitch -= e.movementY * SENS
      player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch))
    }
    const onMouseDown = (e) => { if (locked && e.button === 0) inputRef.current.fire = true }
    const onMouseUp = (e) => { if (e.button === 0) inputRef.current.fire = false }
    canvas.addEventListener('click', onClick)
    document.addEventListener('pointerlockchange', onLock)
    document.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    const keyMap = { KeyW: 'f', KeyS: 'b', KeyA: 'l', KeyD: 'r', ArrowUp: 'f', ArrowDown: 'b', ArrowLeft: 'l', ArrowRight: 'r' }
    const onKeyDown = (e) => {
      setTouchUI(false)
      if (e.code === 'Space') { inputRef.current.jump = true; e.preventDefault() }
      else if (e.code === 'KeyR') doReload()
      const m = keyMap[e.code]; if (m) inputRef.current[m] = true
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space') inputRef.current.jump = false
      const m = keyMap[e.code]; if (m) inputRef.current[m] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // ---- touch look (empty canvas areas) ----
    let lookId = null, lx = 0, ly = 0
    const onTS = (e) => {
      setTouchUI(true)
      const t = e.changedTouches[0]
      if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY }
    }
    const onTM = (e) => {
      for (const t of e.changedTouches) if (t.identifier === lookId) {
        player.yaw -= (t.clientX - lx) * 0.005
        player.pitch -= (t.clientY - ly) * 0.005
        player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch))
        lx = t.clientX; ly = t.clientY
      }
    }
    const onTE = (e) => { for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null }
    canvas.addEventListener('touchstart', onTS, { passive: true })
    canvas.addEventListener('touchmove', onTM, { passive: true })
    canvas.addEventListener('touchend', onTE)
    canvas.addEventListener('touchcancel', onTE)

    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    const euler = new THREE.Euler(0, 0, 0, 'YXZ')
    const clock = new THREE.Clock()
    let raf
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      if (runningRef.current) {
        // respawn player
        if (st.dead && performance.now() / 1000 >= st.respawnAt) {
          st.dead = false; st.health = 100; setHealth(100)
          const s = spawns[(Math.random() * spawns.length) | 0]
          player.setFromGround(s.x, s.z)
        }
        if (!st.dead) {
          player.update(dt, inputRef.current, colliders)
          if (inputRef.current.fire) doFire()
        }
        camera.position.copy(player.eye)
        euler.set(player.pitch, player.yaw, 0)
        camera.quaternion.setFromEuler(euler)
        weapon.update(dt)
        if (botsReady) bots.update(dt, player.eye, colliders, wallMeshes, hurt, audio)
      }
      renderer.render(scene, camera)
    }
    animate()

    apiRef.current.cleanup = () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('click', onClick)
      document.removeEventListener('pointerlockchange', onLock)
      document.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('touchstart', onTS)
      canvas.removeEventListener('touchmove', onTM)
      canvas.removeEventListener('touchend', onTE)
      canvas.removeEventListener('touchcancel', onTE)
      if (document.pointerLockElement === canvas) document.exitPointerLock?.()
      bots.dispose(); audio.dispose(); renderer.dispose()
      if (canvas.parentNode === mount) mount.removeChild(canvas)
    }
    return () => apiRef.current.cleanup()
  }, [])

  const start = () => {
    setPhase('playing')
    runningRef.current = true
    apiRef.current.audio?.start()
  }
  const toggleMute = () => { const n = !muted; setMuted(n); apiRef.current.audio?.setMuted(n) }

  const setMove = (d, a) => { inputRef.current[d] = a }
  const setJump = (a) => { inputRef.current.jump = a }
  const setFire = (a) => { inputRef.current.fire = a }
  const reload = () => apiRef.current.doReload?.()

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#9fb0c4' }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
      <HUD
        phase={phase} health={health} ammo={ammo} mag={MAG} kills={kills}
        reloading={reloading} muted={muted} touchUI={touchUI}
        onStart={start} onToggleMute={toggleMute}
        onMove={setMove} onJump={setJump} onFire={setFire} onReload={reload}
      />
    </div>
  )
}
