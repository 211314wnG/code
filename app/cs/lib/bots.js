import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'

const ASSET_BASE = process.env.NODE_ENV === 'production' ? '/code' : ''

// Loads the downloaded animated Soldier model and manages enemy bots: they chase
// the player, take cover-aware line-of-sight shots, animate (idle/run), take
// damage and respawn.
export class BotManager {
  constructor(scene) {
    this.scene = scene
    this.bots = []
    this.hitMeshes = []
    this.ray = new THREE.Raycaster()
    this.template = null
    this.animations = null
    this.tmpBox = new THREE.Box3()
  }

  load() {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        `${ASSET_BASE}/assets/models/soldier.glb`,
        (gltf) => {
          this.template = gltf.scene
          this.animations = gltf.animations
          // Normalise to ~1.8 m tall, feet at y=0.
          const box = new THREE.Box3().setFromObject(gltf.scene)
          const h = box.max.y - box.min.y
          this.scale = 1.8 / h
          resolve()
        },
        undefined,
        reject,
      )
    })
  }

  spawn(n, spawns) {
    for (let i = 0; i < n; i++) {
      const root = skeletonClone(this.template)
      root.scale.setScalar(this.scale)
      root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false } })
      const mixer = new THREE.AnimationMixer(root)
      const find = (re) => this.animations.find((a) => re.test(a.name))
      const idleClip = find(/idle/i) || this.animations[0]
      const runClip = find(/run/i) || find(/walk/i) || this.animations[0]
      const actions = {
        idle: mixer.clipAction(idleClip),
        run: mixer.clipAction(runClip),
      }
      actions.idle.play()

      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.8, 0.7),
        new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
      )
      hit.position.y = 0.9
      root.add(hit)

      const bot = {
        root, mixer, actions, current: 'idle', hit,
        pos: new THREE.Vector3(), hp: 100, alive: true,
        shootCd: 1 + Math.random(), respawnAt: 0, moving: false,
      }
      hit.userData.bot = bot
      this.scene.add(root)
      this.hitMeshes.push(hit)
      this.bots.push(bot)
      this._place(bot, spawns)
    }
  }

  _place(bot, spawns) {
    const s = spawns[(Math.random() * spawns.length) | 0]
    bot.pos.set(s.x + (Math.random() - 0.5) * 6, 0, s.z + (Math.random() - 0.5) * 6)
    bot.root.position.copy(bot.pos)
  }

  _setAnim(bot, name) {
    if (bot.current === name) return
    bot.actions[bot.current].fadeOut(0.2)
    bot.actions[name].reset().fadeIn(0.2).play()
    bot.current = name
  }

  _blocked(x, z, colliders) {
    this.tmpBox.min.set(x - 0.5, 0, z - 0.5)
    this.tmpBox.max.set(x + 0.5, 1.8, z + 0.5)
    for (const c of colliders) if (c.intersectsBox(this.tmpBox)) return true
    return false
  }

  hasLOS(from, to, wallMeshes) {
    const dir = new THREE.Vector3().subVectors(to, from)
    const dist = dir.length()
    dir.normalize()
    this.ray.set(from, dir)
    this.ray.far = dist
    const hits = this.ray.intersectObjects(wallMeshes, false)
    return hits.length === 0
  }

  // Returns 'killed' | 'hit' | null
  damageByMesh(mesh, dmg, spawns) {
    const bot = mesh.userData.bot
    if (!bot || !bot.alive) return null
    bot.hp -= dmg
    if (bot.hp <= 0) {
      bot.alive = false
      bot.root.visible = false
      bot.respawnAt = performance.now() / 1000 + 3
      return 'killed'
    }
    return 'hit'
  }

  update(dt, playerPos, colliders, wallMeshes, onPlayerHit, audio) {
    const now = performance.now() / 1000
    const eye = new THREE.Vector3()
    const peye = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z)
    for (const bot of this.bots) {
      bot.mixer.update(dt)
      if (!bot.alive) {
        if (now >= bot.respawnAt) {
          bot.hp = 100; bot.alive = true; bot.root.visible = true
          this._place(bot, this.spawns)
        } else continue
      }

      const toP = new THREE.Vector3().subVectors(playerPos, bot.pos)
      toP.y = 0
      const dist = toP.length()
      toP.normalize()

      // Face the player.
      bot.root.rotation.y = Math.atan2(toP.x, toP.z)

      // Move toward the player until at a fighting distance; slide on walls.
      let moving = false
      if (dist > 7) {
        const sp = 3.6 * dt
        const nx = bot.pos.x + toP.x * sp
        const nz = bot.pos.z + toP.z * sp
        if (!this._blocked(nx, nz, colliders)) { bot.pos.x = nx; bot.pos.z = nz; moving = true }
        else if (!this._blocked(nx, bot.pos.z, colliders)) { bot.pos.x = nx; moving = true }
        else if (!this._blocked(bot.pos.x, nz, colliders)) { bot.pos.z = nz; moving = true }
        else {
          // strafe around obstacle
          const sx = bot.pos.x - toP.z * sp, sz = bot.pos.z + toP.x * sp
          if (!this._blocked(sx, sz, colliders)) { bot.pos.x = sx; bot.pos.z = sz; moving = true }
        }
      }
      bot.root.position.copy(bot.pos)
      this._setAnim(bot, moving ? 'run' : 'idle')

      // Shooting
      bot.shootCd -= dt
      eye.set(bot.pos.x, 1.5, bot.pos.z)
      if (bot.shootCd <= 0 && dist < 50 && this.hasLOS(eye, peye, wallMeshes)) {
        bot.shootCd = 0.9 + Math.random() * 1.1
        const chance = Math.max(0.12, 0.7 * (1 - dist / 55))
        audio?.enemyShot()
        if (Math.random() < chance) onPlayerHit(7 + (Math.random() * 6) | 0)
      }
    }
    // Keep hit meshes' world transforms current for player raycasts this frame.
    for (const bot of this.bots) bot.root.updateMatrixWorld()
  }

  setSpawns(spawns) { this.spawns = spawns }

  dispose() {
    for (const bot of this.bots) this.scene.remove(bot.root)
    this.bots = []; this.hitMeshes = []
  }
}
