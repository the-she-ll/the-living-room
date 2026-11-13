/**
 * MindAR image-tracking session + Three.js overlays for each artifact.
 *
 * Loaded on demand (dynamic import) so the ~2 MB tracking engine is only
 * downloaded when a visitor opens the AR Lens.
 */
import * as THREE from 'three';
import { FREQUENCIES, MAGAZINES, PANTHEON } from '../data/frequencies';
import { asset, RIGHTS } from '../data/site';
import AudioController from '../audio/AudioController';


/* --------------------------- canvas textures --------------------------- */

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

function cardTexture({ eyebrow, title, body, bg = '#F2E6CC', ink = '#2B1A10', accent = '#8A3319' }) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 640;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, c.width, 22);
  ctx.strokeStyle = '#C99A2E';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, c.width - 14, c.height - 14);

  ctx.fillStyle = accent;
  ctx.font = '600 34px "DM Sans", sans-serif';
  ctx.fillText(eyebrow.toUpperCase(), 60, 96);
  ctx.fillStyle = ink;
  ctx.font = '900 76px Fraunces, Georgia, serif';
  ctx.fillText(title, 60, 186);
  ctx.font = '400 38px "DM Sans", sans-serif';
  wrap(ctx, body, c.width - 120)
    .slice(0, 8)
    .forEach((l, i) => ctx.fillText(l, 60, 262 + i * 50));

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ----------------------------- overlays -------------------------------- */
// MindAR anchor space: the target image is 1 unit wide, centred at origin.

/* ----------- portrait: flip through trailblazers over the painting ----------- */

// Where the painted portrait sits inside its AR target (target width = 1 unit).
const FRAME = { x: 0.017, y: -0.015, w: 0.92, h: 1.23 };

function comingSoonPortrait(p) {
  const c = document.createElement('canvas');
  c.width = 600;
  c.height = 780;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2e1c14';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = 'rgba(212,155,36,.5)';
  ctx.setLineDash([12, 10]);
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, c.width - 80, c.height - 80);
  ctx.fillStyle = '#f2e6cc';
  ctx.textAlign = 'center';
  ctx.font = '900 56px Fraunces, Georgia, serif';
  wrap(ctx, p.name, c.width - 120).forEach((l, i) => ctx.fillText(l, c.width / 2, 360 + i * 64));
  ctx.fillStyle = '#e8bd5a';
  ctx.font = '500 26px "DM Sans", sans-serif';
  ctx.fillText('Portrait coming soon', c.width / 2, 470);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildPortraits(group, { pantheon }, shared) {
  const loader = new THREE.TextureLoader();
  const textures = pantheon.map((p) => {
    const slot = { tex: comingSoonPortrait(p), aspect: 600 / 780 };
    if (p.image) {
      loader.load(p.image, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        slot.tex = tex;
        slot.aspect = tex.image.width / tex.image.height;
        slot.ready = true;
      });
    }
    return slot;
  });

  // gold frame + photo, sized to each image's own shape ("contain" in the painted frame)
  const holder = new THREE.Group();
  holder.position.set(FRAME.x, FRAME.y, 0.02);
  group.add(holder);
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xc99a2e }));
  frame.position.z = -0.002;
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: textures[0].tex }));
  holder.add(frame, photo);

  const api = shared.api || {
    index: 0,
    total: pantheon.length,
    onChange: null,
    go(d) {
      api.index = (api.index + d + api.total) % api.total;
      AudioController.playPageTurn();
      api.onChange?.(api.state());
    },
    next: () => api.go(1),
    prev: () => api.go(-1),
    state: () => ({ index: api.index, total: api.total, person: pantheon[api.index] }),
  };
  shared.api = api;

  let shown = -1;
  let outgoing = null; // the photo turning away
  let flip = 0; // 1 → 0 progress of the card turn
  const update = () => {
    const slot = textures[api.index];
    if (shown !== api.index) {
      if (shown !== -1) {
        outgoing = textures[shown];
        flip = 1;
      }
      shown = api.index;
    }
    // the card turns edge-on, swaps photo at the midpoint, then turns back
    flip = Math.max(0, flip - 0.06);
    holder.rotation.y = Math.sin(flip * Math.PI) * (Math.PI / 2) * (flip > 0.5 ? 1 : -1) * 0.98;
    const show = flip > 0.5 && outgoing ? outgoing : slot;
    if (photo.material.map !== show.tex) {
      photo.material.map = show.tex;
      photo.material.needsUpdate = true;
    }
    let w = FRAME.w;
    let h = w / show.aspect;
    if (h > FRAME.h) {
      h = FRAME.h;
      w = h * show.aspect;
    }
    photo.scale.set(w, h, 1);
    frame.scale.set(w + 0.035, h + 0.035, 1);
  };
  return { update, api };
}

/* ------------- turntable: four live 2D visuals over the painted record player ------------- */

export const TURNTABLE_VISUALS = ['Sunday Spin', 'Mothership', 'Sound Waves', 'Equalizer'];

// Where the painted turntable sits inside its AR target (target width = 1 unit).
const DECK = { x: 0.06, y: 0.03, size: 0.78 };

const AMBER = '#ffb347';
const MUSTARD = '#d49b24';
const PARCHMENT = '#f2e6cc';

/** A vinyl record seen from above: grooves, a fixed light sheen, and a spinning label. */
function drawRecord(ctx, cx, cy, r, rot, labelColor) {
  ctx.save();
  ctx.translate(cx, cy);
  // disc
  ctx.fillStyle = '#121212';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // grooves
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let g = r * 0.38; g < r * 0.97; g += r * 0.035) {
    ctx.beginPath();
    ctx.arc(0, 0, g, 0, Math.PI * 2);
    ctx.stroke();
  }
  // sheen stays still while the record turns, like light on real vinyl
  const sheen = ctx.createConicGradient(-0.6, 0, 0);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.06, 'rgba(255,230,190,0.16)');
  sheen.addColorStop(0.12, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.56, 'rgba(255,230,190,0.1)');
  sheen.addColorStop(0.62, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // label (rotates)
  ctx.rotate(rot);
  ctx.fillStyle = labelColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.33, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PARCHMENT;
  ctx.textAlign = 'center';
  ctx.font = `900 ${Math.round(r * 0.085)}px Fraunces, Georgia, serif`;
  ctx.fillText('SUNDAY', 0, -r * 0.1);
  ctx.fillText('SESSIONS', 0, -r * 0.01);
  ctx.font = `600 ${Math.round(r * 0.05)}px "DM Sans", sans-serif`;
  ctx.fillText('THE LIVING ROOM · 33⅓', 0, r * 0.17);
  // spindle
  ctx.fillStyle = '#d9d9d9';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTonearm(ctx, cx, cy, r, t) {
  const px = cx + r * 1.05;
  const py = cy - r * 0.95;
  const a = 0.62 + Math.sin(t * 1.3) * 0.006; // tiny wobble riding the groove
  ctx.save();
  ctx.translate(px, py);
  ctx.fillStyle = '#9a9a9a';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(a);
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = r * 0.035;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, r * 1.25);
  ctx.lineTo(-r * 0.12, r * 1.45);
  ctx.stroke();
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(-r * 0.2, r * 1.42, r * 0.14, r * 0.12);
  ctx.restore();
}

const VISUALS = [
  // 1. Sunday Spin: record, tonearm, notes drifting up
  (ctx, S, t, level) => {
    const r = S * 0.34;
    drawRecord(ctx, S / 2, S / 2, r, t * 3.5, '#8a3319');
    drawTonearm(ctx, S / 2, S / 2, r, t);
    ctx.textAlign = 'center';
    for (let k = 0; k < 7; k++) {
      const phase = (t * 0.25 + k / 7) % 1;
      const x = S / 2 + Math.sin(k * 2.1 + t) * S * 0.36;
      const y = S * 0.92 - phase * S * 0.9;
      ctx.globalAlpha = Math.sin(phase * Math.PI) * (0.6 + level * 0.4);
      ctx.fillStyle = k % 2 ? AMBER : PARCHMENT;
      ctx.font = `${Math.round(S * (0.06 + (k % 3) * 0.015))}px serif`;
      ctx.fillText(k % 3 ? '♪' : '♫', x, y);
    }
    ctx.globalAlpha = 1;
  },
  // 2. Mothership: orbiting color rings, stars, a little saucer
  (ctx, S, t, level) => {
    const c = S / 2;
    for (let k = 0; k < 60; k++) {
      const x = (Math.sin(k * 91.7) * 0.5 + 0.5) * S;
      const y = (Math.cos(k * 47.3) * 0.5 + 0.5) * S;
      ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + k));
      ctx.fillStyle = PARCHMENT;
      ctx.fillRect(x, y, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
    const colors = ['#8a3319', MUSTARD, '#4f5d2f', '#1a535c', '#b4502c'];
    colors.forEach((col, k) => {
      const rr = S * (0.3 + k * 0.035) + level * S * 0.02;
      const start = t * (k % 2 ? -0.9 : 1.2) * (1 + k * 0.15);
      ctx.strokeStyle = col;
      ctx.lineWidth = S * 0.018;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(c, c, rr, start, start + Math.PI * (0.9 + k * 0.12));
      ctx.stroke();
    });
    drawRecord(ctx, c, c, S * 0.24, t * 3.5, '#1a535c');
    // saucer on an orbit
    const a = t * 0.7;
    const sx = c + Math.cos(a) * S * 0.42;
    const sy = c + Math.sin(a) * S * 0.16 - S * 0.02;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = 'rgba(255,179,71,0.35)';
    ctx.beginPath();
    ctx.moveTo(-S * 0.02, S * 0.01);
    ctx.lineTo(S * 0.02, S * 0.01);
    ctx.lineTo(S * 0.05, S * 0.09);
    ctx.lineTo(-S * 0.05, S * 0.09);
    ctx.fill();
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.ellipse(0, 0, S * 0.06, S * 0.016, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = AMBER;
    ctx.beginPath();
    ctx.ellipse(0, -S * 0.012, S * 0.025, S * 0.016, 0, Math.PI, 0);
    ctx.fill();
    ctx.restore();
  },
  // 3. Sound Waves: ripples pulse outward with the beat
  (ctx, S, t, level) => {
    const c = S / 2;
    for (let k = 0; k < 6; k++) {
      const phase = (t * 0.45 + k / 6) % 1;
      const rr = S * 0.26 + phase * S * 0.24;
      ctx.strokeStyle = k % 2 ? AMBER : MUSTARD;
      ctx.globalAlpha = (1 - phase) * (0.45 + level * 0.55);
      ctx.lineWidth = S * (0.006 + level * 0.012);
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
        const wob = Math.sin(a * 8 + t * 4 + k) * S * 0.008 * (1 + level * 3);
        const x = c + Math.cos(a) * (rr + wob);
        const y = c + Math.sin(a) * (rr + wob);
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    drawRecord(ctx, c, c, S * 0.25, t * 3.5, '#4f5d2f');
  },
  // 4. Equalizer: a ring of bars bouncing around the record
  (ctx, S, t, level) => {
    const c = S / 2;
    const n = 48;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 - Math.PI / 2;
      const band = Math.abs(Math.sin(k * 0.55 + t * 3.1) * Math.sin(k * 0.21 - t * 1.7));
      const h = S * (0.03 + band * 0.1 + level * 0.12);
      const r0 = S * 0.3;
      ctx.strokeStyle = `hsl(${30 + (k / n) * 25}, 90%, ${55 + band * 15}%)`;
      ctx.lineWidth = S * 0.018;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
      ctx.lineTo(c + Math.cos(a) * (r0 + h), c + Math.sin(a) * (r0 + h));
      ctx.stroke();
    }
    drawRecord(ctx, c, c, S * 0.26, t * 3.5, MUSTARD);
  },
];

function buildTurntable(group, _content, shared) {
  const S = 768;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(DECK.size, DECK.size),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  plane.position.set(DECK.x, DECK.y, 0.1);
  group.add(plane);

  const api = shared.api || {
    index: 0,
    total: VISUALS.length,
    onChange: null,
    go(d) {
      api.index = (api.index + d + api.total) % api.total;
      AudioController.playClick();
      api.onChange?.(api.state());
    },
    next: () => api.go(1),
    prev: () => api.go(-1),
    state: () => ({ index: api.index, total: api.total, name: TURNTABLE_VISUALS[api.index] }),
  };
  shared.api = api;

  let last = 0;
  let shown = api.index;
  let fade = 1;
  let smooth = 0;
  const update = (t) => {
    if (t - last < 1 / 30) return; // ~30 fps is plenty and saves battery
    last = t;
    const lvl = AudioController.getLevel();
    smooth = lvl > smooth ? lvl : smooth * 0.85 + lvl * 0.15;
    // quick dip to transparent when switching visuals
    if (shown !== api.index) {
      fade = Math.max(0, fade - 0.25);
      if (fade === 0) shown = api.index;
    } else fade = Math.min(1, fade + 0.2);
    ctx.clearRect(0, 0, S, S);
    ctx.globalAlpha = 1;
    VISUALS[shown](ctx, S, t, smooth);
    plane.material.opacity = fade;
    plane.position.z = 0.1 + Math.sin(t * 1.4) * 0.008;
    tex.needsUpdate = true;
  };
  return { update, api };
}

/* ---------------- coffee table: real-cover flip-through ---------------- */

const PAGE_W = 0.42;
const PAGE_H = 0.63; // 2:3 magazine proportions

function paperCanvas(w = 512, h = 768) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  return { c, ctx };
}

function toTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Plain paper page for issues whose cover scan hasn't been added (no illustration). */
function comingSoonTexture(m) {
  const { c, ctx } = paperCanvas();
  ctx.fillStyle = '#efe4cc';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = 'rgba(43,26,16,.35)';
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, c.width - 80, c.height - 80);
  ctx.fillStyle = '#2b1a10';
  ctx.textAlign = 'center';
  ctx.font = '900 64px Fraunces, Georgia, serif';
  wrap(ctx, m.masthead, c.width - 120).forEach((l, i) => ctx.fillText(l, c.width / 2, 330 + i * 70));
  ctx.font = '500 26px "DM Sans", sans-serif';
  ctx.globalAlpha = 0.6;
  ctx.fillText(m.date, c.width / 2, 470);
  ctx.fillText('Cover image coming soon', c.width / 2, 520);
  return toTexture(c);
}

/** The back of each cover: that issue's story, plus its credit and the rights line. */
/** Page 2 (back of the cover): the issue's story summary, credit and rights line. */
function storyTexture(m, rightsLine) {
  const { c, ctx } = paperCanvas();
  ctx.fillStyle = '#f7efdc';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#2b1a10';
  ctx.font = '600 20px "DM Sans", sans-serif';
  ctx.globalAlpha = 0.6;
  ctx.fillText(`${m.masthead} · ${m.date}`.toUpperCase(), 40, 64);
  ctx.globalAlpha = 1;
  ctx.font = '900 40px Fraunces, Georgia, serif';
  let y = 120;
  wrap(ctx, m.coverLine, c.width - 80).slice(0, 3).forEach((l) => {
    ctx.fillText(l, 40, y);
    y += 46;
  });
  ctx.font = '400 25px "DM Sans", sans-serif';
  y += 14;
  wrap(ctx, m.story, c.width - 80).slice(0, 14).forEach((l) => {
    ctx.fillText(l, 40, y);
    y += 34;
  });
  ctx.font = '400 17px "DM Sans", sans-serif';
  ctx.globalAlpha = 0.55;
  const foot = wrap(ctx, `© ${m.credit}. ${rightsLine}`, c.width - 80).slice(0, 3);
  foot.forEach((l, i) => ctx.fillText(l, 40, c.height - 40 - (foot.length - 1 - i) * 22));
  return toTexture(c);
}

/** Page 3: one photo from the article, with a caption and photographer credit. */
function photoPageTexture(m) {
  const { c, ctx } = paperCanvas();
  const tex = toTexture(c);
  const draw = (photo) => {
    ctx.fillStyle = '#f7efdc';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#2b1a10';
    if (!photo) {
      ctx.strokeStyle = 'rgba(43,26,16,.3)';
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, c.width - 80, c.height - 80);
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.6;
      ctx.font = '500 24px "DM Sans", sans-serif';
      ctx.fillText('Photo from the issue', c.width / 2, c.height / 2 - 10);
      ctx.fillText('coming soon', c.width / 2, c.height / 2 + 24);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
      tex.needsUpdate = true;
      return;
    }
    const boxW = c.width - 64;
    const boxH = c.height - 200;
    const k = Math.min(boxW / photo.width, boxH / photo.height);
    const w = photo.width * k;
    const h = photo.height * k;
    const top = 40 + (boxH - h) / 2;
    ctx.drawImage(photo, 32 + (boxW - w) / 2, top, w, h);
    let y = top + h + 34;
    if (m.insideCaption) {
      ctx.font = 'italic 400 21px "DM Sans", sans-serif';
      wrap(ctx, m.insideCaption, c.width - 72).slice(0, 3).forEach((l) => {
        ctx.fillText(l, 36, y);
        y += 27;
      });
    }
    if (m.insideCredit) {
      ctx.font = '400 15px "DM Sans", sans-serif';
      ctx.globalAlpha = 0.55;
      ctx.fillText(`Photo: ${m.insideCredit}`, 36, y + 6);
      ctx.globalAlpha = 1;
    }
    tex.needsUpdate = true;
  };
  draw(null);
  if (m.insideImage) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => draw(img);
    img.src = m.insideImage;
  }
  return tex;
}

/**
 * Coffee-table magazines, one issue at a time. Each issue reads like a real
 * magazine: cover → open to the summary (left) and an article photo (right)
 * → next issue. Steps run 0..2n-1: even = closed on the cover, odd = open.
 */
function buildTable(group, { magazines, rightsLine }, shared) {
  const loader = new THREE.TextureLoader();
  const n = magazines.length;

  // Per-issue textures, built once and shared by every view of the table.
  if (!shared.pages) {
    shared.pages = magazines.map((m) => {
      const slot = { cover: comingSoonTexture(m), story: storyTexture(m, rightsLine), photo: photoPageTexture(m) };
      if (m.image) {
        loader.load(m.image, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          slot.cover = tex;
        });
      }
      return slot;
    });
  }
  const pages = shared.pages;

  // Sized relative to the coffee-table target (1 unit = target width) so the
  // open spread floats just over the table without leaving the screen.
  const SCALE = 0.95;
  const spread = new THREE.Group();
  spread.scale.setScalar(SCALE);
  spread.position.set(-(PAGE_W * SCALE) / 2, 0.16, 0.18);
  group.add(spread);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(PAGE_W * 2.3, PAGE_H * 1.15),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 }),
  );
  shadow.scale.setScalar(SCALE);
  shadow.position.set(0, 0.14, 0.02);
  group.add(shadow);

  const geo = new THREE.PlaneGeometry(PAGE_W, PAGE_H);
  const mat = () => new THREE.MeshBasicMaterial({ transparent: true });
  const coverMat = mat();
  const storyMat = mat();
  const photoMat = mat();

  // page 3 lies flat on the right; the cover leaf turns over it on the spine
  const photoPage = new THREE.Mesh(geo, photoMat);
  photoPage.position.set(PAGE_W / 2, 0, 0);
  const pivot = new THREE.Group();
  pivot.position.z = 0.004;
  const front = new THREE.Mesh(geo, coverMat);
  front.position.x = PAGE_W / 2;
  const back = new THREE.Mesh(geo, storyMat);
  back.rotation.y = Math.PI;
  back.position.set(PAGE_W / 2, 0, -0.001);
  pivot.add(front, back);
  spread.add(photoPage, pivot);

  const api = shared.api || {
    step: 0,
    total: n,
    onChange: null,
    go(d) {
      const next = Math.max(0, Math.min(2 * n - 1, api.step + d));
      if (next === api.step) return;
      api.step = next;
      AudioController.playPageTurn();
      api.onChange?.(api.state());
    },
    next: () => api.go(1),
    prev: () => api.go(-1),
    state: () => {
      const mag = Math.floor(api.step / 2);
      return { step: api.step, lastStep: 2 * n - 1, mag, open: api.step % 2 === 1, total: n, reading: magazines[mag] };
    },
  };
  shared.api = api;

  let shownMag = Math.floor(api.step / 2);
  let fade = 1; // opacity while switching issues
  let switching = false;
  let angle = 0;

  const update = (t) => {
    const mag = Math.floor(api.step / 2);
    const open = api.step % 2 === 1;

    // switching issues: fade out, swap pages (closed), fade back in
    if (mag !== shownMag && !switching) switching = true;
    if (switching) {
      fade = Math.max(0, fade - 0.12);
      if (fade === 0) {
        shownMag = mag;
        angle = open ? -Math.PI : 0;
        switching = false;
      }
    } else {
      fade = Math.min(1, fade + 0.1);
    }

    const p = pages[shownMag];
    if (coverMat.map !== p.cover) { coverMat.map = p.cover; coverMat.needsUpdate = true; }
    if (storyMat.map !== p.story) { storyMat.map = p.story; storyMat.needsUpdate = true; }
    if (photoMat.map !== p.photo) { photoMat.map = p.photo; photoMat.needsUpdate = true; }
    coverMat.opacity = storyMat.opacity = photoMat.opacity = fade;

    const target = !switching && open ? -Math.PI : switching ? angle : 0;
    angle += (target - angle) * 0.14;
    pivot.rotation.y = angle;
    pivot.position.z = 0.004 + Math.sin((Math.abs(angle) / Math.PI) * Math.PI) * 0.08;
    // the photo page only shows once the cover has turned
    photoPage.visible = angle < -0.2;

    spread.position.y = 0.16 + Math.sin(t * 1.2) * 0.006 - (1 - fade) * 0.04;
    const offset = open && !switching ? 0 : -PAGE_W / 2; // closed: centre the cover; open: centre the spine
    spread.position.x += (offset * SCALE - spread.position.x) * 0.12;
  };

  return { update, api };
}

function buildGeneric(group, id) {
  const f = FREQUENCIES[id];
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 0.625),
    new THREE.MeshBasicMaterial({
      map: cardTexture({ eyebrow: `${f.band} FM · ${f.subtitle}`, title: f.title, body: f.archive[0], accent: f.color }),
      transparent: true,
    }),
  );
  card.position.set(0, 0.75, 0.12);
  group.add(card);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.5, 64),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(f.color), transparent: true, side: THREE.DoubleSide }),
  );
  group.add(ring);
  return (t) => {
    card.position.y = 0.75 + Math.sin(t * 1.5) * 0.03;
    ring.scale.setScalar(1 + ((t * 0.8) % 1) * 0.4);
    ring.material.opacity = 1 - ((t * 0.8) % 1);
  };
}

const BUILDERS = { portraits: buildPortraits, turntable: buildTurntable, table: buildTable };

/* ------------------------------ session -------------------------------- */

/**
 * Start an AR session inside `container`.
 * Rejects with an Error whose `.code` is one of:
 *   'insecure' | 'no-camera' | 'denied' | 'no-targets' | 'failed'
 */
export async function startAR({ container, targetsSrc, targetOrder, onFound, onLost }) {
  const content = {
    pantheon: PANTHEON.map((p) => ({ ...p, image: asset(p.image) })),
    magazines: MAGAZINES.map((m) => ({ ...m, image: asset(m.image), insideImage: asset(m.insideImage) })),
    rightsLine: RIGHTS.short,
  };
  const controls = {};
  const shared = {}; // per-artifact state shared by duplicate (angled-view) targets
  const fail = (code, message) => Object.assign(new Error(message), { code });

  if (!window.isSecureContext) throw fail('insecure', 'Camera requires HTTPS.');
  if (!navigator.mediaDevices?.getUserMedia) throw fail('no-camera', 'Camera not available.');

  // Verify the compiled target file exists (SPA servers return index.html for missing files).
  try {
    const res = await fetch(targetsSrc);
    const type = res.headers.get('content-type') || '';
    if (!res.ok || type.includes('text/html')) throw new Error();
  } catch {
    throw fail('no-targets', 'AR targets have not been installed yet.');
  }

  const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js');

  // Each session renders into its own host so overlapping start/stop calls can't clobber each other.
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;inset:0;overflow:hidden;';
  container.appendChild(host);

  const mindar = new MindARThree({
    container: host,
    imageTargetSrc: targetsSrc,
    maxTrack: 1,
    uiLoading: 'no',
    uiScanning: 'no',
    uiError: 'no',
    filterMinCF: 0.0001,
    filterBeta: 0.001,
  });
  const { renderer, scene, camera } = mindar;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const updaters = [];
  targetOrder.forEach((id, index) => {
    if (!FREQUENCIES[id]) return;
    const anchor = mindar.addAnchor(index);
    const build = BUILDERS[id] || ((g) => buildGeneric(g, id));
    shared[id] ||= {};
    const built = build(anchor.group, content, shared[id]);
    const update = typeof built === 'function' ? built : built.update;
    if (built.api) controls[id] = built.api;
    updaters.push({ anchor, update });
    anchor.onTargetFound = () => onFound?.(id);
    anchor.onTargetLost = () => onLost?.(id);
  });

  try {
    await mindar.start();
  } catch (err) {
    host.remove();
    const name = err?.name || '';
    if (name === 'NotAllowedError' || name === 'SecurityError') throw fail('denied', 'Camera permission denied.');
    if (name === 'NotFoundError' || name === 'OverconstrainedError') throw fail('no-camera', 'No camera found.');
    throw fail('failed', err?.message || 'AR failed to start.');
  }

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    updaters.forEach(({ anchor, update }) => anchor.visible !== false && update(t));
    renderer.render(scene, camera);
  });

  return {
    /** Per-artifact interactive controls, e.g. controls.table.next() */
    controls,
    stop() {
      renderer.setAnimationLoop(null);
      try {
        mindar.stop();
      } catch {
        /* already stopped */
      }
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => {
          m.map?.dispose?.();
          m.dispose?.();
        });
      });
      renderer.dispose();
      host.remove();
    },
  };
}
