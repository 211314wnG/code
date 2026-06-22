// Dynamic roller-coaster sound, synthesised entirely in the browser with the
// Web Audio API (no audio files / no network). Three layers are mixed and driven
// by the train's speed:
//   1. Wind  - filtered white noise whose volume and brightness rise with speed.
//   2. Rumble- low-passed noise for the rolling wheels.
//   3. Clack - periodic clicks (wheels over the track ties) whose rate tracks
//              speed; during the lift hill these become the chain-lift "tick".
//
// start() must be called from a user gesture to satisfy autoplay policies.
export class CoasterAudio {
  constructor() {
    this.ctx = null
    this.started = false
    this.muted = false
    this.nextClack = 0
  }

  start() {
    if (this.started) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    this.ctx = ctx

    this.master = ctx.createGain()
    this.master.gain.value = 0.0001
    this.master.connect(ctx.destination)

    const noiseBuffer = this._makeNoiseBuffer(ctx)

    // Wind layer
    this.windSource = ctx.createBufferSource()
    this.windSource.buffer = noiseBuffer
    this.windSource.loop = true
    this.windFilter = ctx.createBiquadFilter()
    this.windFilter.type = 'bandpass'
    this.windFilter.frequency.value = 600
    this.windFilter.Q.value = 0.6
    this.windGain = ctx.createGain()
    this.windGain.gain.value = 0
    this.windSource.connect(this.windFilter).connect(this.windGain).connect(this.master)
    this.windSource.start()

    // Rumble layer
    this.rumbleSource = ctx.createBufferSource()
    this.rumbleSource.buffer = noiseBuffer
    this.rumbleSource.loop = true
    this.rumbleFilter = ctx.createBiquadFilter()
    this.rumbleFilter.type = 'lowpass'
    this.rumbleFilter.frequency.value = 220
    this.rumbleGain = ctx.createGain()
    this.rumbleGain.gain.value = 0
    this.rumbleSource.connect(this.rumbleFilter).connect(this.rumbleGain).connect(this.master)
    this.rumbleSource.start()

    // Fade master in.
    this.master.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.6)

    this.started = true
  }

  _makeNoiseBuffer(ctx) {
    const len = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  setMuted(muted) {
    this.muted = muted
    if (!this.started) return
    const target = muted ? 0.0001 : 0.9
    this.master.gain.cancelScheduledValues(this.ctx.currentTime)
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1)
  }

  // speed01: normalised speed 0..1. onLift: chain-lift section.
  update(speed01, onLift) {
    if (!this.started || this.muted) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const s = Math.max(0, Math.min(1, speed01))

    this.windGain.gain.setTargetAtTime(s * s * 0.5, now, 0.08)
    this.windFilter.frequency.setTargetAtTime(400 + s * 2600, now, 0.1)

    this.rumbleGain.gain.setTargetAtTime(0.12 + s * 0.5, now, 0.08)
    this.rumbleFilter.frequency.setTargetAtTime(120 + s * 360, now, 0.1)

    // Schedule discrete clacks. Rate scales with speed; slow ticks on the lift.
    const rate = onLift ? 6 : 4 + s * 46
    const interval = 1 / rate
    if (this.nextClack < now) this.nextClack = now
    while (this.nextClack < now + 0.1) {
      this._clack(this.nextClack, onLift ? 0.25 : 0.18 + s * 0.4, onLift)
      this.nextClack += interval
    }
  }

  _clack(time, gainVal, onLift) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = onLift ? 90 : 150 + Math.random() * 80
    g.gain.setValueAtTime(0.0001, time)
    g.gain.exponentialRampToValueAtTime(gainVal * 0.5, time + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
    osc.connect(g).connect(this.master)
    osc.start(time)
    osc.stop(time + 0.06)
  }

  dispose() {
    if (this.started && this.ctx) this.ctx.close()
    this.started = false
  }
}
