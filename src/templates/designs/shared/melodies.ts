/**
 * Built-in background melodies, generated in the browser with the Web Audio API (no audio files, no licences).
 * Ported from the supplied Enchanted Garden (music box), Modern Indian (raga Bhupali) and Cinematic (diya score) designs.
 */

type Ctx = AudioContext;
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export interface Melody {
  /** Called every ~100 ms; schedules the notes due in the next half second. */
  tick(ctx: Ctx, out: AudioNode): void;
  reset(ctx: Ctx): void;
  /** Effects chain from `out` to the speakers. */
  connect(ctx: Ctx, out: GainNode): void;
}

/** Soft music box: C – G – Am – F arpeggios with a melody every other round. */
export function musicBox(): Melody {
  const chords = [[60, 67, 72, 76, 79, 76, 72, 67], [55, 62, 67, 71, 74, 71, 67, 62], [57, 64, 69, 72, 76, 72, 69, 64], [53, 60, 65, 69, 72, 69, 65, 60]];
  const melody = [76, 0, 74, 0, 72, 0, 71, 0, 69, 0, 67, 0, 65, 0, 64, 0, 72, 0, 71, 0, 69, 0, 67, 0, 65, 0, 64, 0, 62, 0, 60, 0];
  const beat = 0.34;
  let step = 0;
  let next = 0;
  const note = (ctx: Ctx, out: AudioNode, freq: number, t: number, vol: number, dur: number) => {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = "sine"; o2.type = "triangle"; o.frequency.value = freq; o2.frequency.value = freq * 2; g2.gain.value = 0.15;
    o.connect(g); o2.connect(g2).connect(g); g.connect(out);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  };
  return {
    reset(ctx) { next = ctx.currentTime + 0.1; },
    connect(ctx, out) {
      out.gain.value = 0.55;
      const delay = ctx.createDelay(), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
      delay.delayTime.value = 0.27; fb.gain.value = 0.32; lp.type = "lowpass"; lp.frequency.value = 2400;
      out.connect(ctx.destination); out.connect(delay); delay.connect(lp).connect(fb).connect(delay); lp.connect(ctx.destination);
    },
    tick(ctx, out) {
      while (next < ctx.currentTime + 0.4) {
        const chord = chords[Math.floor(step / 8) % 4];
        note(ctx, out, hz(chord[step % 8]), next, 0.11, 1.8);
        const m = melody[step % 32];
        if (m && Math.floor(step / 32) % 2 === 1) note(ctx, out, hz(m + 12), next, 0.07, 2.4);
        next += beat; step++;
      }
    },
  };
}

/** Tanpura drone with a santoor-like melody in raga Bhupali (Sa Re Ga Pa Dha). */
export function raga(): Melody {
  const S = 60, R = 62, G = 64, P = 67, D = 69, S2 = 72, R2 = 74;
  const phrase = [G, R, S, R, G, P, G, 0, D, P, G, R, G, 0, 0, 0, S2, D, P, G, P, D, S2, 0, R2, S2, D, P, G, R, S, 0, G, G, P, D, S2, 0, D, P, G, P, G, R, S, 0, 0, 0];
  const beat = 0.3;
  let step = 0, droneStep = 0, next = 0, nextDrone = 0;
  const pluck = (ctx: Ctx, out: AudioNode, f: number, t: number, v: number, dur: number) => {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = "triangle"; o2.type = "sine"; o.frequency.value = f; o2.frequency.value = f * 3.01; g2.gain.value = 0.12;
    o.connect(g); o2.connect(g2).connect(g); g.connect(out);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  };
  const drone = (ctx: Ctx, out: AudioNode, f: number, t: number) => {
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.Q.value = 6;
    o.connect(lp).connect(g).connect(out);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(500, t + 2.5);
    o.start(t); o.stop(t + 3.3);
  };
  return {
    reset(ctx) { next = nextDrone = ctx.currentTime + 0.1; },
    connect(ctx, out) {
      out.gain.value = 0.8;
      const dl = ctx.createDelay(), fb = ctx.createGain();
      dl.delayTime.value = 0.33; fb.gain.value = 0.28;
      out.connect(ctx.destination); out.connect(dl); dl.connect(fb).connect(dl); dl.connect(ctx.destination);
    },
    tick(ctx, out) {
      while (nextDrone < ctx.currentTime + 0.5) {
        drone(ctx, out, hz([P - 12, S, S, S - 12][droneStep % 4]), nextDrone); droneStep++; nextDrone += 1.15;
      }
      while (next < ctx.currentTime + 0.5) {
        const n = phrase[step % phrase.length];
        if (n && step >= 8) { pluck(ctx, out, hz(n), next, 0.09, 1.6); if (step % 4 === 0) pluck(ctx, out, hz(n), next + beat / 2, 0.04, 1.2); }
        step++; next += beat;
      }
    },
  };
}

/** The Cinematic designs' score: a warm drone and santoor-like plucks in raga Yaman, with a long hall reverb. */
export function diya(): Melody {
  const mel = [64, 66, 67, 71, 69, 0, 67, 66, 64, 0, 62, 64, 66, 0, 0, 0, 71, 72, 74, 72, 71, 69, 67, 0, 66, 67, 69, 67, 66, 64, 0, 0];
  let step = 0, next = 0, nextDrone = 0, droneStep = 0;
  const pluck = (ctx: Ctx, out: AudioNode, f: number, t: number, v: number) => {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = "triangle"; o2.type = "sine"; o.frequency.value = f; o2.frequency.value = f * 2.01; g2.gain.value = 0.25;
    o.connect(g); o2.connect(g2).connect(g); g.connect(out);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.start(t); o2.start(t); o.stop(t + 2.5); o2.stop(t + 2.5);
  };
  const drone = (ctx: Ctx, out: AudioNode, f: number, t: number) => {
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass";
    lp.frequency.setValueAtTime(1300, t); lp.frequency.exponentialRampToValueAtTime(380, t + 3);
    o.connect(lp).connect(g).connect(out);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    o.start(t); o.stop(t + 3.7);
  };
  return {
    reset(ctx) { next = nextDrone = ctx.currentTime + 0.1; },
    connect(ctx, out) {
      out.gain.value = 0.9;
      // A generated hall: decaying noise as the impulse response.
      const len = Math.floor(ctx.sampleRate * 3.2), buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      const rv = ctx.createConvolver(), dry = ctx.createGain(), wet = ctx.createGain();
      rv.buffer = buf; dry.gain.value = 0.7; wet.gain.value = 0.5;
      out.connect(dry).connect(ctx.destination); out.connect(rv).connect(wet).connect(ctx.destination);
    },
    tick(ctx, out) {
      while (nextDrone < ctx.currentTime + 0.5) { drone(ctx, out, hz([55, 48, 48, 36][droneStep % 4]), nextDrone); droneStep++; nextDrone += 1.3; }
      while (next < ctx.currentTime + 0.5) { const n = mel[step % mel.length]; if (n && step > 6) pluck(ctx, out, hz(n), next, 0.07); step++; next += 0.42; }
    },
  };
}
