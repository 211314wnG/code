// Synthesized weapon audio (Web Audio, no files). start() from a user gesture.
export class GunAudio {
  constructor() { this.ctx = null; this.started = false; this.muted = false }

  start() {
    if (this.started) { if (this.ctx.state === 'suspended') this.ctx.resume(); return }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.9
    this.master.connect(this.ctx.destination)
    const len = this.ctx.sampleRate * 1
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = this.noise.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    this.started = true
  }

  setMuted(m) { this.muted = m; if (this.started) this.master.gain.value = m ? 0 : 0.9 }

  _noise(t, dur, freq, q, gain, type = 'lowpass') {
    const ctx = this.ctx
    const src = ctx.createBufferSource(); src.buffer = this.noise
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(this.master)
    src.start(t); src.stop(t + dur)
  }

  shoot() {
    if (!this.started || this.muted) return
    const t = this.ctx.currentTime
    this._noise(t, 0.18, 900, 1, 0.9, 'lowpass')
    this._noise(t, 0.05, 2600, 1, 0.5, 'highpass')
    // low thump
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain()
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.12)
    g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.16)
  }

  enemyShot() {
    if (!this.started || this.muted) return
    this._noise(this.ctx.currentTime, 0.14, 700, 1, 0.35)
  }

  reload() {
    if (!this.started || this.muted) return
    const t = this.ctx.currentTime
    this._noise(t, 0.04, 1800, 2, 0.4, 'bandpass')
    this._noise(t + 0.18, 0.05, 1200, 2, 0.45, 'bandpass')
    this._noise(t + 0.4, 0.04, 2000, 2, 0.4, 'bandpass')
  }

  hit() {
    if (!this.started || this.muted) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain()
    o.type = 'square'; o.frequency.value = 1400
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.07)
  }

  hurt() {
    if (!this.started || this.muted) return
    const t = this.ctx.currentTime
    this._noise(t, 0.2, 400, 0.7, 0.5)
  }

  dispose() { if (this.started) this.ctx.close(); this.started = false }
}
