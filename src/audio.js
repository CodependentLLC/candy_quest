// Generated effects keep optional audio failures from affecting gameplay.
export class GameAudio {
  constructor() { this.volumes = {effects: .24, music: .08}; this.context = null; this.muted = false; this.lastPlayed = new Map(); }
  setPaused(paused) { this.muted = paused; }
  reset() { this.lastPlayed.clear(); }
  play(name, {pitch = 1, volume = 1, category = "effects", cooldown = .04} = {}) {
    if (this.muted || !this.volumes[category] || !globalThis.AudioContext) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") this.context.resume().catch(() => {});
      const now = performance.now();
      if (now - (this.lastPlayed.get(name) || 0) < cooldown * 1000) return;
      this.lastPlayed.set(name, now);
      const oscillator = this.context.createOscillator(), gain = this.context.createGain();
      oscillator.type = name === "hurt" || name === "timerWarning" ? "square" : "sine";
      const frequencies = {jump:440, landing:180, candyPickup:620, starPickup:880, stomp:260, bounce:520, checkpoint:740, hurt:120, timerWarning:300, sugarRush:660, victory:980, gameOver:140};
      oscillator.frequency.value = (frequencies[name] || 440) * pitch;
      const start = this.context.currentTime, end = start + (name === "victory" ? .32 : .12);
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(this.volumes[category] * volume, start + .008); gain.gain.exponentialRampToValueAtTime(.001, end);
      oscillator.connect(gain).connect(this.context.destination); oscillator.start(); oscillator.stop(end);
    } catch { /* Audio is enhancement only; policy/device failures are harmless. */ }
  }
  hooks() {
    return {jump:()=>this.play("jump"), landing:()=>this.play("landing"), candyPickup:o=>this.play("candyPickup",o), starPickup:o=>this.play("starPickup",o), stomp:()=>this.play("stomp"), bounce:()=>this.play("bounce"), checkpoint:()=>this.play("checkpoint"), hurt:()=>this.play("hurt"), timerWarning:o=>this.play("timerWarning",o), sugarRush:()=>this.play("sugarRush"), victory:()=>this.play("victory",{volume:1.2,cooldown:.5}), gameOver:()=>this.play("gameOver",{volume:1.1,cooldown:.5})};
  }
}
