/**
 * The four records in The Rhythm & Sanctuary's crate. Each is its own short
 * original piece (melody, instruments and rhythm), separate from the radio's
 * groove. AudioController's scheduler calls sessionStep() once per 16th note.
 */

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

/* ------------------------------ instruments ------------------------------ */

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function osc(ac, dest, t, freq, dur, { type = 'sine', gain = 0.2, attack = 0.005, filter, q = 1 } = {}) {
  const o = ac.ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  const g = ac.ctx.createGain();
  env(g, t, attack, gain, dur);
  if (filter) {
    const f = ac.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(filter, t);
    f.Q.value = q;
    o.connect(f).connect(g);
  } else o.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + attack + dur + 0.05);
}

/** Upright piano: bright attack that fades, slightly detuned strings. */
function piano(ac, dest, t, n, dur, vel = 1) {
  const f = midi(n);
  osc(ac, dest, t, f, dur, { type: 'triangle', gain: 0.16 * vel, attack: 0.003 });
  osc(ac, dest, t, f * 1.003, dur * 0.8, { type: 'triangle', gain: 0.07 * vel, attack: 0.003 });
  osc(ac, dest, t, f * 2, dur * 0.35, { type: 'sine', gain: 0.05 * vel, attack: 0.002 });
}

/** Vibraphone: pure tone with a shimmering wobble. */
function vibes(ac, dest, t, n, dur, vel = 1) {
  const ctx = ac.ctx;
  const o = ctx.createOscillator();
  o.frequency.value = midi(n);
  const trem = ctx.createOscillator();
  trem.frequency.value = 5.5;
  const depth = ctx.createGain();
  depth.gain.value = 0.35;
  const g = ctx.createGain();
  const amp = ctx.createGain();
  amp.gain.value = 0.65;
  trem.connect(depth).connect(amp.gain);
  env(g, t, 0.004, 0.14 * vel, dur);
  o.connect(amp).connect(g).connect(dest);
  osc(ac, dest, t, midi(n) * 4, 0.12, { gain: 0.03 * vel, attack: 0.001 }); // mallet strike
  o.start(t);
  trem.start(t);
  o.stop(t + dur + 0.1);
  trem.stop(t + dur + 0.1);
}

/** Bright little bell for a pop hook. */
function bell(ac, dest, t, n, dur, vel = 1) {
  osc(ac, dest, t, midi(n), dur, { gain: 0.1 * vel, attack: 0.002 });
  osc(ac, dest, t, midi(n) * 3.01, dur * 0.4, { gain: 0.03 * vel, attack: 0.001 });
}

/** Choppy rhythm guitar: a short filtered square chord. */
function guitarChop(ac, dest, t, notes, vel = 1) {
  notes.forEach((n) => osc(ac, dest, t, midi(n), 0.07, { type: 'square', gain: 0.035 * vel, attack: 0.002, filter: 2400 }));
}

/** Low, buzzy baritone-sax style bass. */
function saxBass(ac, dest, t, n, dur, vel = 1) {
  osc(ac, dest, t, midi(n), dur, { type: 'sawtooth', gain: 0.2 * vel, attack: 0.02, filter: 700, q: 3 });
}

/** Punchy horn stab. */
function hornStab(ac, dest, t, notes, vel = 1) {
  notes.forEach((n) => osc(ac, dest, t, midi(n), 0.18, { type: 'sawtooth', gain: 0.05 * vel, attack: 0.01, filter: 1800, q: 2 }));
}

function noise(ac, dest, t, dur, { type = 'bandpass', freq = 1000, q = 1, gain = 0.3, attack = 0.002, freqEnd } = {}) {
  const ctx = ac.ctx;
  const src = ctx.createBufferSource();
  src.buffer = ac.noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, attack, gain, dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t, Math.random());
  src.stop(t + dur + attack + 0.05);
}

const tambourine = (ac, dest, t, vel = 1) => {
  noise(ac, dest, t, 0.09, { freq: 7000, q: 2, gain: 0.18 * vel });
  noise(ac, dest, t + 0.012, 0.06, { freq: 9500, q: 3, gain: 0.1 * vel });
};
const clap = (ac, dest, t, vel = 1) => [0, 0.011, 0.023].forEach((d) => noise(ac, dest, t + d, 0.05, { freq: 1500, q: 0.8, gain: 0.22 * vel }));
const scratch = (ac, dest, t, up = true) =>
  noise(ac, dest, t, 0.13, { freq: up ? 600 : 3000, freqEnd: up ? 3000 : 500, q: 6, gain: 0.35, attack: 0.01 });

/* -------------------------------- pieces -------------------------------- */
// Each piece: steps (16ths per loop) and play(ac, step, t, sd, dest).

const at = (list, step) => list.filter(([s]) => s === step);

// Rent Party Stomp: solo stride piano in C (C, A7, D7, G7).
const RENT_ROOTS = [36, 33, 38, 31];
const RENT_FIFTHS = [43, 40, 45, 38];
const RENT_CHORDS = [
  [52, 55, 60],
  [55, 57, 61],
  [54, 57, 60],
  [53, 55, 59],
];
const RENT_MELODY = [
  [0, 72], [3, 76], [6, 79], [8, 76], [10, 74], [12, 72], [14, 76],
  [16, 73], [19, 76], [22, 79], [24, 81], [26, 79], [28, 76], [30, 73],
  [32, 74], [35, 78], [38, 81], [40, 78], [42, 76], [44, 74], [46, 72],
  [48, 71], [51, 74], [54, 77], [56, 79], [58, 77], [60, 74], [62, 71],
];

// Jackson Street Rehearsals: bubbly soul in F (F, Bb, C, Bb).
const JS_ROOTS = [41, 46, 48, 46];
const JS_TRIADS = [
  [65, 69, 72],
  [65, 70, 74],
  [67, 72, 76],
  [65, 70, 74],
];
const JS_BASS = [[0, 0], [3, 12], [6, 0], [8, 7], [10, 12], [13, 10]];
const JS_HOOK = [[0, 77], [2, 79], [4, 81], [6, 79], [8, 77], [12, 74]];

// Hitsville U.S.A.: Detroit stomp in C (C, Am, F, G).
const HV_ROOTS = [36, 33, 41, 43];
const HV_ORGAN = [
  [60, 64, 67],
  [57, 60, 64],
  [57, 60, 65],
  [59, 62, 67],
];
const HV_VIBES = [
  [0, 76], [4, 79], [6, 81], [8, 79], [12, 76],
  [16, 72], [20, 76], [24, 79], [28, 76],
  [32, 77], [36, 81], [40, 84], [44, 81],
  [48, 79], [52, 83], [56, 86], [58, 83], [60, 79],
];

// Back to School Jam: breakbeat in A minor.
const BB_KICK = [0, 6, 10, 16, 22, 27];
const BB_SNARE = [4, 12, 20, 28];
const BB_GHOST = [7, 15, 23, 30];
const BB_BASS = [[0, 45, 2], [3, 45, 1], [6, 48, 2], [10, 43, 2], [16, 45, 2], [19, 52, 1], [22, 50, 2], [26, 48, 2]];

export const SESSION_PIECES = {
  'rent-party': {
    steps: 64,
    play(ac, step, t, sd, dest) {
      const bar = Math.floor(step / 16);
      const s = step % 16;
      if (s === 0) piano(ac, dest, t, RENT_ROOTS[bar], sd * 3.5, 1.1);
      if (s === 8) piano(ac, dest, t, RENT_FIFTHS[bar], sd * 3.5, 1);
      if (s === 4 || s === 12) RENT_CHORDS[bar].forEach((n) => piano(ac, dest, t, n, sd * 2.5, 0.7));
      at(RENT_MELODY, step).forEach(([, n]) => piano(ac, dest, t, n, sd * 2.2, 0.9));
    },
  },
  'jackson-street': {
    steps: 64,
    play(ac, step, t, sd, dest) {
      const bar = Math.floor(step / 16);
      const s = step % 16;
      if (s === 0 || s === 8 || s === 10) ac._kick(dest, t, s === 10 ? 0.6 : 1);
      if (s === 4 || s === 12) {
        ac._snare(dest, t, 0.8);
        clap(ac, dest, t, 1);
      }
      tambourine(ac, dest, t, s % 4 === 2 ? 1 : 0.4);
      if (s % 4 === 2) guitarChop(ac, dest, t, JS_TRIADS[bar]);
      at(JS_BASS, s).forEach(([, off]) => ac._bassNote(dest, t, JS_ROOTS[bar] + off, sd * 1.6, 1));
      if (bar % 2 === 0) at(JS_HOOK, s).forEach(([, n]) => bell(ac, dest, t, n, sd * 2, 1));
    },
  },
  hitsville: {
    steps: 64,
    play(ac, step, t, sd, dest) {
      const bar = Math.floor(step / 16);
      const s = step % 16;
      if (s % 4 === 0) ac._snare(dest, t, 0.75); // the snare on every beat
      if (s === 0 || s === 7 || s === 8) ac._kick(dest, t, 0.9);
      if (s % 2 === 0) tambourine(ac, dest, t, s % 8 === 4 ? 1 : 0.45);
      if (s === 0) saxBass(ac, dest, t, HV_ROOTS[bar], sd * 5);
      if (s === 6) saxBass(ac, dest, t, HV_ROOTS[bar], sd * 1.5);
      if (s === 10) saxBass(ac, dest, t, HV_ROOTS[bar] + 7, sd * 4);
      if (s === 0) HV_ORGAN[bar].forEach((n) => ac._organ(dest, t, n, sd * 16, 0.025));
      at(HV_VIBES, step).forEach(([, n]) => vibes(ac, dest, t, n, sd * 3.5));
    },
  },
  sedgwick: {
    steps: 32,
    play(ac, step, t, sd, dest) {
      if (BB_KICK.includes(step)) ac._kick(dest, t, 0.95);
      if (BB_SNARE.includes(step)) ac._snare(dest, t, 1);
      if (BB_GHOST.includes(step)) ac._snare(dest, t, 0.25);
      if (step % 2 === 0) ac._hat(dest, t, step === 14 || step === 30 ? 1.4 : 0.8);
      at(BB_BASS, step).forEach(([, n, len]) => ac._bassNote(dest, t, n, sd * len, 0.95));
      if (step === 0 || step === 18) hornStab(ac, dest, t, [57, 60, 64, 67]);
      if (step === 28) scratch(ac, dest, t, true);
      if (step === 29) scratch(ac, dest, t, false);
    },
  },
};
