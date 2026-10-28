/**
 * AudioController: every sound in the exhibition, synthesized live with the
 * Web Audio API (no audio files required).
 *
 *  - Vinyl crackle ambience (looping, toggleable)
 *  - "Tuning in" radio sweep for unlocks
 *  - One signature soundbite per frequency
 *  - A 5-stem soul groove sequencer (bass, drums, shaker, keys, pad).
 *    Each discovered frequency adds its stem to the mix.
 *  - Optional playback of real recordings (`playClip`) with a synthesized
 *    "muffled voice" placeholder when no file has been supplied yet.
 *
 * iOS Safari only lets audio start inside a user gesture, so call `unlock()`
 * from a tap handler before anything else.
 */

import { asset } from '../data/site';

const BPM = 94;
const STEPS = 32; // two bars of 16th notes
const SWING = 0.16;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12;

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Two-bar vamp: Dm9 → G13
const KEY_CHORDS = [
  [53, 57, 60, 64], // F A C E   (Dm9 rootless)
  [53, 59, 64, 69], // F B E A   (G13 rootless)
];
const PAD_CHORDS = [
  [50, 57, 62, 65], // D A D F
  [43, 55, 59, 62], // G G B D
];
// [step, midi note, length in steps]
const BASSLINE = [
  [0, 38, 3], [3, 38, 1], [6, 45, 1], [8, 48, 2], [10, 50, 1], [12, 45, 2], [14, 48, 1],
  [16, 43, 3], [19, 43, 1], [22, 47, 1], [24, 50, 2], [26, 53, 1], [28, 52, 1], [30, 50, 1],
];
const KICKS = [0, 7, 10, 16, 23, 26];
const SNARES = [[4, 1], [12, 1], [15, 0.25], [20, 1], [28, 1], [31, 0.3]];
const KEY_HITS = [[2, 0.5], [6, 0.7], [11, 0.5], [18, 0.5], [22, 0.7], [27, 0.5]];

export const STEMS = ['bass', 'drums', 'shaker', 'keys', 'pad'];

class AudioControllerImpl {
  constructor() {
    this.ctx = null;
    this.listeners = new Set();
    this.state = {
      unlocked: false,
      ambientOn: false,
      grooveOn: false,
      stems: { bass: false, drums: false, shaker: false, keys: false, pad: false },
      clipPlaying: null,
    };
    this._timer = null;
    this._step = 0;
    this._nextTime = 0;
    this._clip = null;
    this._clipNodes = [];
  }

  /* ------------------------------ plumbing ----------------------------- */

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  _set(patch) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn(this.state));
  }

  get supported() {
    return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
  }

  /** Must be called from a user gesture (tap/click). Safe to call repeatedly. */
  async unlock() {
    if (!this.supported) return false;
    if (!this.ctx) this._build();
    if (this.ctx.state !== 'running') {
      try {
        await this.ctx.resume();
      } catch {
        /* ignore */
      }
    }
    // iOS: play a one-sample silent buffer to fully unlock output.
    const b = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
    const s = this.ctx.createBufferSource();
    s.buffer = b;
    s.connect(this.ctx.destination);
    s.start(0);
    this._set({ unlocked: this.ctx.state === 'running' });
    return this.state.unlocked;
  }

  _build() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx({ latencyHint: 'interactive' });
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    // Gentle "warm tape" rolloff
    const warm = ctx.createBiquadFilter();
    warm.type = 'lowpass';
    warm.frequency.value = 9000;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.master.connect(warm).connect(comp).connect(this.analyser).connect(ctx.destination);
    this._levelBuf = new Uint8Array(this.analyser.fftSize);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);

    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = 0;
    this.ambientBus.connect(this.master);

    this.grooveBus = ctx.createGain();
    this.grooveBus.gain.value = 0.8;
    this.grooveBus.connect(this.master);

    this.stemGain = {};
    STEMS.forEach((name) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(this.grooveBus);
      this.stemGain[name] = g;
    });

    // Electric-piano tremolo
    const trem = ctx.createOscillator();
    const tremDepth = ctx.createGain();
    trem.frequency.value = 4.6;
    tremDepth.gain.value = 0.25;
    this.keysTrem = ctx.createGain();
    this.keysTrem.gain.value = 0.75;
    trem.connect(tremDepth).connect(this.keysTrem.gain);
    trem.start();
    this.keysTrem.connect(this.stemGain.keys);

    this.noiseBuf = this._makeNoise(2);
    this.crackleBuf = this._makeCrackle(6);
  }

  _makeNoise(seconds) {
    const { ctx } = this;
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _makeCrackle(seconds) {
    const { ctx } = this;
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(2, sr * seconds, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < d.length; i++) {
        // soft surface hiss (low-passed)
        lp += ((Math.random() * 2 - 1) - lp) * 0.08;
        d[i] = lp * 0.12;
      }
      // pops & clicks
      const pops = seconds * 26;
      for (let p = 0; p < pops; p++) {
        const at = Math.floor(Math.random() * (d.length - 200));
        const amp = Math.random() < 0.12 ? 0.6 + Math.random() * 0.4 : 0.05 + Math.random() * 0.25;
        const len = 8 + Math.floor(Math.random() * 60);
        for (let k = 0; k < len; k++) {
          d[at + k] += (Math.random() * 2 - 1) * amp * Math.exp(-k / (len / 4));
        }
      }
      // once-per-rotation thump (33⅓ rpm ≈ 1.8s)
      for (let t = 0.3; t < seconds; t += 1.8) {
        const at = Math.floor(t * sr);
        for (let k = 0; k < 400; k++) d[at + k] += Math.sin(k / 18) * 0.12 * Math.exp(-k / 90);
      }
    }
    return buf;
  }

  getLevel() {
    if (!this.analyser) return 0;
    this.analyser.getByteTimeDomainData(this._levelBuf);
    let sum = 0;
    for (let i = 0; i < this._levelBuf.length; i++) {
      const v = (this._levelBuf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this._levelBuf.length) * 3.2);
  }

  /* ------------------------------ ambience ----------------------------- */

  setAmbient(on) {
    if (!this.ctx) {
      this._set({ ambientOn: false });
      return;
    }
    const t = this.ctx.currentTime;
    if (on && !this._crackle) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.crackleBuf;
      src.loop = true;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 120;
      src.connect(hp).connect(this.ambientBus);
      src.start();
      this._crackle = src;
    }
    this.ambientBus.gain.cancelScheduledValues(t);
    this.ambientBus.gain.setTargetAtTime(on ? 0.55 : 0, t, 0.4);
    this._set({ ambientOn: on });
  }

  /* --------------------------- one-shot sounds ------------------------- */

  _env(node, t, a, peak, d, end = 0.0001) {
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(peak, t + a);
    node.gain.exponentialRampToValueAtTime(end, t + a + d);
  }

  _noise(dest, t, dur, { type = 'bandpass', freq = 1000, q = 1, gain = 0.5, attack = 0.002, freqEnd } = {}) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    this._env(g, t, attack, gain, dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random());
    src.stop(t + dur + attack + 0.05);
  }

  _tone(dest, t, freq, dur, { type = 'sine', gain = 0.3, attack = 0.005, freqEnd } = {}) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = this.ctx.createGain();
    this._env(g, t, attack, gain, dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + attack + dur + 0.05);
    return o;
  }

  /** Radio dial sweep → lock-on chime. */
  playTuneIn() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.02;
    const bus = this.sfxBus;
    this._noise(bus, t, 1.3, { type: 'bandpass', freq: 400, freqEnd: 3200, q: 4, gain: 0.35, attack: 0.05 });
    // heterodyne whistles while sweeping
    this._tone(bus, t + 0.1, 1800, 0.5, { type: 'sine', gain: 0.05, freqEnd: 600 });
    this._tone(bus, t + 0.55, 900, 0.45, { type: 'sine', gain: 0.04, freqEnd: 1400 });
    // lock-on: warm major-seventh chime
    [62, 66, 69, 73].forEach((n, i) => {
      this._tone(bus, t + 1.25 + i * 0.07, midi(n), 1.4, { type: 'triangle', gain: 0.12, attack: 0.01 });
      this._tone(bus, t + 1.25 + i * 0.07, midi(n + 12), 0.6, { type: 'sine', gain: 0.04 });
    });
  }

  playClick() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._noise(this.sfxBus, t, 0.03, { type: 'highpass', freq: 2500, gain: 0.25 });
  }

  /** Rotary dial: the finger-stop click + the spring-return pulses. */
  playDial(digit) {
    if (!this.ctx) return 0;
    const t = this.ctx.currentTime;
    const pulses = digit === 0 ? 10 : digit;
    this._noise(this.sfxBus, t, 0.05, { type: 'bandpass', freq: 1800, q: 2, gain: 0.3 });
    const start = t + 0.25;
    for (let i = 0; i < pulses; i++) {
      this._noise(this.sfxBus, start + i * 0.1, 0.02, { type: 'bandpass', freq: 3200, q: 3, gain: 0.35 });
    }
    return 0.25 + pulses * 0.1;
  }

  _phoneRing(t, cycles = 2) {
    // Mechanical bell: two detuned tones gated at 20 Hz, 1.2s on, 0.6s off
    for (let c = 0; c < cycles; c++) {
      const s = t + c * 1.8;
      for (let k = 0; k < 24; k++) {
        const kt = s + k * 0.05;
        this._tone(this.sfxBus, kt, 1180, 0.045, { type: 'square', gain: 0.035, attack: 0.001 });
        this._tone(this.sfxBus, kt + 0.025, 1420, 0.04, { type: 'square', gain: 0.03, attack: 0.001 });
      }
    }
  }

  /** A single page turn (magazine flip-throughs). */
  playPageTurn() {
    if (this.ctx) this._pageTurn(this.ctx.currentTime + 0.01);
  }

  _pageTurn(t) {
    this._noise(this.sfxBus, t, 0.28, { type: 'bandpass', freq: 1200, freqEnd: 4200, q: 0.8, gain: 0.3, attack: 0.04 });
    this._noise(this.sfxBus, t + 0.22, 0.12, { type: 'highpass', freq: 3000, gain: 0.15 });
  }

  /** The signature soundbite for each frequency. */
  playSoundbite(id) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.03;
    switch (id) {
      case 'phone':
        this._phoneRing(t, 2);
        break;
      case 'table':
        this._pageTurn(t);
        this._pageTurn(t + 0.55);
        this._pageTurn(t + 1.0);
        break;
      case 'turntable': {
        // needle drop + bass riff
        this._noise(this.sfxBus, t, 0.08, { type: 'lowpass', freq: 600, gain: 0.6 });
        BASSLINE.slice(0, 7).forEach(([step, n, len]) =>
          this._bassNote(this.sfxBus, t + 0.3 + step * this._stepDur(), n, len * this._stepDur(), 1),
        );
        break;
      }
      case 'chair': {
        const sd = this._stepDur();
        // a one-bar drum fill
        [0, 4, 7, 10, 12, 14, 15].forEach((s) => {
          if (s === 4 || s === 12) this._snare(this.sfxBus, t + s * sd, 1);
          else if (s >= 14) this._snare(this.sfxBus, t + s * sd, 0.5);
          else this._kick(this.sfxBus, t + s * sd, 1);
          this._hat(this.sfxBus, t + s * sd, 0.4);
        });
        break;
      }
      case 'portraits':
      default:
        PAD_CHORDS[0].forEach((n) => this._organ(this.sfxBus, t, n, 2.6, 0.06));
        break;
    }
  }

  /* ---------------------------- instruments ---------------------------- */

  _stepDur() {
    return 60 / BPM / 4;
  }

  _kick(dest, t, vel) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    this._env(g, t, 0.003, 0.9 * vel, 0.38);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.45);
  }

  _snare(dest, t, vel) {
    this._noise(dest, t, 0.17, { type: 'highpass', freq: 1400, gain: 0.45 * vel });
    this._tone(dest, t, 190, 0.09, { type: 'triangle', gain: 0.25 * vel, attack: 0.001, freqEnd: 150 });
  }

  _hat(dest, t, vel) {
    this._noise(dest, t, 0.035, { type: 'highpass', freq: 7500, gain: 0.22 * vel, attack: 0.001 });
  }

  _shaker(dest, t, vel) {
    this._noise(dest, t, 0.06, { type: 'bandpass', freq: 5200, q: 1.4, gain: 0.2 * vel, attack: 0.012 });
  }

  _bassNote(dest, t, n, dur, vel) {
    const f = midi(n);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(260, t + Math.max(0.12, dur));
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55 * vel, t + 0.008);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.9, 0.04);
    const saw = this.ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = f;
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = f;
    const subG = this.ctx.createGain();
    subG.gain.value = 0.9;
    saw.connect(lp);
    sub.connect(subG).connect(lp);
    lp.connect(g).connect(dest);
    saw.start(t);
    sub.start(t);
    saw.stop(t + dur + 0.3);
    sub.stop(t + dur + 0.3);
  }

  _rhodes(dest, t, n, dur, vel) {
    const f = midi(n);
    this._tone(dest, t, f, dur, { gain: 0.12 * vel, attack: 0.004 });
    this._tone(dest, t, f * 2, dur * 0.6, { gain: 0.035 * vel, attack: 0.004 });
    this._tone(dest, t, f * 7, 0.08, { gain: 0.02 * vel, attack: 0.001 }); // tine "bark"
  }

  _organ(dest, t, n, dur, level) {
    const f = midi(n);
    [1, 2, 3, 4].forEach((h, i) => {
      const o = this.ctx.createOscillator();
      o.frequency.value = f * h;
      const g = this.ctx.createGain();
      const lvl = level * [1, 0.6, 0.35, 0.2][i];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(lvl, t + 0.25);
      g.gain.setValueAtTime(lvl, t + dur - 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(dest);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  /* ----------------------------- the groove ---------------------------- */

  setStem(name, on) {
    if (!this.ctx || !this.stemGain[name]) return;
    const levels = { bass: 0.95, drums: 0.85, shaker: 0.7, keys: 0.8, pad: 0.6 };
    this.stemGain[name].gain.setTargetAtTime(on ? levels[name] : 0, this.ctx.currentTime, 0.15);
    this._set({ stems: { ...this.state.stems, [name]: on } });
  }

  setStems(names) {
    STEMS.forEach((s) => this.setStem(s, names.includes(s)));
  }

  startGroove(stems) {
    if (!this.ctx) return;
    if (stems) this.setStems(stems);
    if (this._timer) return;
    this._step = 0;
    this._nextTime = this.ctx.currentTime + 0.1;
    this._timer = setInterval(() => this._schedule(), LOOKAHEAD_MS);
    this._set({ grooveOn: true });
  }

  stopGroove() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this._set({ grooveOn: false });
  }

  _schedule() {
    const sd = this._stepDur();
    while (this._nextTime < this.ctx.currentTime + SCHEDULE_AHEAD) {
      const swing = this._step % 2 === 1 ? sd * SWING : 0;
      this._playStep(this._step, this._nextTime + swing, sd);
      this._nextTime += sd;
      this._step = (this._step + 1) % STEPS;
    }
  }

  _playStep(step, t, sd) {
    const bar = step < 16 ? 0 : 1;
    const { drums, shaker, keys, pad, bass } = this.stemGain;

    if (KICKS.includes(step)) this._kick(drums, t, step % 8 === 7 ? 0.6 : 1);
    SNARES.forEach(([s, v]) => s === step && this._snare(drums, t, v));
    if (step % 2 === 0) this._hat(drums, t, step % 4 === 0 ? 0.7 : 1);

    this._shaker(shaker, t, step % 4 === 2 ? 1 : 0.45);
    if (step === 30) this._pageTurn(t); // a little page-flip fill from the coffee table

    BASSLINE.forEach(([s, n, len]) => s === step && this._bassNote(bass, t, n, len * sd, 1));

    KEY_HITS.forEach(([s, v]) => {
      if (s % 16 === step % 16 && Math.floor(s / 16) === bar) {
        KEY_CHORDS[bar].forEach((n) => this._rhodes(this.keysTrem, t, n, sd * 3, v));
      }
    });

    if (step % 16 === 0) PAD_CHORDS[bar].forEach((n) => this._organ(pad, t, n, sd * 16, 0.05));
  }

  /* ------------------------------- clips ------------------------------- */

  /**
   * Play a recorded clip if `src` is set, otherwise a synthesized "muffled
   * voice over the line" placeholder (~seconds long). Resolves when done.
   */
  playClip(id, src, seconds = 4, { phone = false } = {}) {
    this.stopClip();
    this._set({ clipPlaying: id });
    if (src) {
      return new Promise((resolve) => {
        const a = new Audio(asset(src));
        a.crossOrigin = 'anonymous';
        this._clip = a;
        const done = () => {
          if (this._clip === a) this._set({ clipPlaying: null });
          resolve();
        };
        a.onended = done;
        a.onerror = () => {
          this._clip = null;
          this._placeholderVoice(id, seconds, phone).then(resolve);
        };
        a.play().catch(a.onerror);
      });
    }
    return this._placeholderVoice(id, seconds, phone);
  }

  _placeholderVoice(id, seconds, phone) {
    if (!this.ctx) {
      this._set({ clipPlaying: null });
      return Promise.resolve();
    }
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.05;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(this.sfxBus);
    // telephone / old radio band-limit
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = phone ? 380 : 220;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = phone ? 2800 : 3600;
    hp.connect(lp).connect(out);

    // "Syllables": formant-filtered buzz with a random amplitude contour
    const buzz = ctx.createOscillator();
    buzz.type = 'sawtooth';
    const pitch = 110 + Math.random() * 70;
    buzz.frequency.setValueAtTime(pitch, t);
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.Q.value = 5;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.Q.value = 7;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    let x = t;
    while (x < t + seconds) {
      const syl = 0.09 + Math.random() * 0.16;
      const pause = Math.random() < 0.15 ? 0.25 + Math.random() * 0.3 : 0.02;
      env.gain.setTargetAtTime(0.16 + Math.random() * 0.12, x, 0.02);
      env.gain.setTargetAtTime(0.0, x + syl, 0.03);
      f1.frequency.setTargetAtTime(350 + Math.random() * 500, x, 0.03);
      f2.frequency.setTargetAtTime(1000 + Math.random() * 1400, x, 0.03);
      buzz.frequency.setTargetAtTime(pitch * (0.9 + Math.random() * 0.25), x, 0.05);
      x += syl + pause;
    }
    buzz.connect(f1).connect(env);
    buzz.connect(f2).connect(env);
    env.connect(hp);
    buzz.start(t);
    buzz.stop(t + seconds + 0.2);

    // line hiss underneath
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.noiseBuf;
    hiss.loop = true;
    const hg = ctx.createGain();
    hg.gain.value = 0.025;
    hiss.connect(hg).connect(hp);
    hiss.start(t);
    hiss.stop(t + seconds + 0.2);

    this._clipNodes = [buzz, hiss];
    return new Promise((resolve) => {
      this._clipTimer = setTimeout(() => {
        this._clipNodes = [];
        if (this.state.clipPlaying === id) this._set({ clipPlaying: null });
        resolve();
      }, (seconds + 0.2) * 1000);
    });
  }

  stopClip() {
    if (this._clip) {
      this._clip.pause();
      this._clip = null;
    }
    this._clipNodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        /* already stopped */
      }
    });
    this._clipNodes = [];
    clearTimeout(this._clipTimer);
    if (this.state.clipPlaying) this._set({ clipPlaying: null });
  }
}

export const AudioController = new AudioControllerImpl();
export default AudioController;
