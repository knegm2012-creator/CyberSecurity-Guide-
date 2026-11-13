/**
 * CS Odyssey Terminal Audio Engine
 * 
 * Implements high-fidelity, zero-dependency retro computing sound effects
 * synthesized directly via the browser Web Audio API:
 * - Mechanical keyclick (soft tactile typewriter/terminal click)
 * - Carriage return click (Enter key latch)
 * - Success chime (retro 2-tone wargame flag capture fanfare)
 * - Error buzzer (subtle CRT terminal blip)
 * - SSH modem connect chime (baud-rate handshake chirp)
 * 
 * Works 100% offline, requires zero external audio asset downloads,
 * and complies with browser autoplay policies.
 */

class TerminalAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.35; // Master volume multiplier (0.0 to 1.0)

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cs_terminal_audio_enabled');
        if (saved !== null) {
          this.isEnabled = saved === 'true';
        }
      } catch (_) {}
    }
  }

  /**
   * Lazily initialize AudioContext on user interaction to comply with autoplay policy.
   */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cs_terminal_audio_enabled', enabled ? 'true' : 'false');
      } catch (_) {}
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    if (this.isEnabled) {
      this.playKeyClick();
    }
    return this.isEnabled;
  }

  /**
   * Mechanical terminal keystroke click:
   * Uses a tiny filtered noise burst + short resonant sine thump.
   */
  public playKeyClick() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Noise burst component (key contact friction)
    const bufferSize = Math.floor(ctx.sampleRate * 0.012); // 12ms
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2800 + (Math.random() * 400 - 200), now);
    noiseFilter.Q.setValueAtTime(2.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06 * this.volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Body thump component (mechanical switch bottom-out)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320 + (Math.random() * 40 - 20), now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.015);

    oscGain.gain.setValueAtTime(0.08 * this.volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noiseSource.start(now);
    osc.start(now);
    osc.stop(now + 0.016);
  }

  /**
   * Carriage return / Enter key click: slightly deeper, more resonant mechanical switch.
   */
  public playReturnClick() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Deeper thump
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.035);

    gain.gain.setValueAtTime(0.12 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.036);
  }

  /**
   * Retro 2-tone success chime:
   * Ascending high-frequency harmonic sine chime (587Hz -> 880Hz -> 1174Hz)
   * Triggered when a Bandit level password or CTF flag is discovered!
   */
  public playSuccessBeep() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.16 * this.volume, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.13);

    // Tone 2: A5 (880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.08);

    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.18 * this.volume, now + 0.095);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.29);

    // Tone 3: D6 shimmer (1174.66 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1174.66, now + 0.16);

    gain3.gain.setValueAtTime(0, now + 0.16);
    gain3.gain.linearRampToValueAtTime(0.14 * this.volume, now + 0.175);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc3.start(now + 0.16);
    osc3.stop(now + 0.46);
  }

  /**
   * Terminal error buzzer / CRT blip:
   * A short low-pitch blip (160 Hz square wave with gentle lowpass).
   */
  public playErrorBeep() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.09);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.1 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.095);
  }

  /**
   * Modem / Tele-type handshake chirp for SSH session establishment:
   * Classic retro acoustic coupler frequency glide.
   */
  public playConnectChime() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency glide: 440 -> 987 -> 1318 -> 1760 Hz
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(1760.0, now + 0.18);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);

    gain.gain.setValueAtTime(0.08 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }
}

export const terminalAudio = new TerminalAudioEngine();
