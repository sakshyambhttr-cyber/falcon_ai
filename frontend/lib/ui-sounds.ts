/** Short UI click — used when the loading screen completes. */
export function playClickSound() {
  if (typeof window === 'undefined') return

  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return

    const ctx = new Ctx()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(920, now)
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.06)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.1)

    const click = ctx.createOscillator()
    const clickGain = ctx.createGain()
    click.type = 'triangle'
    click.frequency.setValueAtTime(1800, now + 0.01)
    clickGain.gain.setValueAtTime(0.0001, now + 0.01)
    clickGain.gain.exponentialRampToValueAtTime(0.04, now + 0.012)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
    click.connect(clickGain)
    clickGain.connect(ctx.destination)
    click.start(now + 0.01)
    click.stop(now + 0.06)

    window.setTimeout(() => void ctx.close(), 120)
  } catch {
    /* ignore — audio is optional polish */
  }
}
