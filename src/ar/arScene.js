/**
 * MindAR image-tracking session + Three.js overlays for each artifact.
 *
 * Loaded on demand (dynamic import) so the ~2 MB tracking engine is only
 * downloaded when a visitor opens the AR Lens.
 */
import * as THREE from 'three';
import { FREQUENCIES, MAGAZINES } from '../data/frequencies';
import { asset, RIGHTS } from '../data/site';
import AudioController from '../audio/AudioController';

const PALETTE = ['#8A3319', '#D49B24', '#4F5D2F', '#1A535C', '#B4502C'];

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

function buildPortraits(group) {
  const f = FREQUENCIES.portraits;
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.69),
    new THREE.MeshBasicMaterial({
      map: cardTexture({ eyebrow: `${f.band} FM · ${f.subtitle}`, title: f.title, body: f.archive[0], accent: f.color }),
      transparent: true,
    }),
  );
  card.position.set(0, 0.85, 0.15);
  group.add(card);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.66, 64),
    new THREE.MeshBasicMaterial({ color: 0xd49b24, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
  );
  group.add(halo);

  return (t) => {
    card.position.y = 0.85 + Math.sin(t * 1.6) * 0.03;
    card.rotation.y = Math.sin(t * 0.7) * 0.08;
    halo.material.opacity = 0.5 + Math.sin(t * 2.2) * 0.3;
    halo.scale.setScalar(1 + Math.sin(t * 2.2) * 0.04);
  };
}

function buildTurntable(group) {
  const rings = PALETTE.map((col, i) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(0.22 + i * 0.09, 0.012 + i * 0.002, 12, 96),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9 }),
    );
    m.position.z = 0.05 + i * 0.03;
    group.add(m);
    return m;
  });

  const bars = [];
  const barGeo = new THREE.BoxGeometry(0.03, 0.03, 1);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const b = new THREE.Mesh(barGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.08 + (i / 24) * 0.45, 0.8, 0.55) }));
    b.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0);
    group.add(b);
    bars.push(b);
  }

  return (t) => {
    rings.forEach((r, i) => {
      r.rotation.z = t * (i % 2 ? -0.6 : 0.9) * (1 + i * 0.2);
      r.rotation.x = Math.sin(t * 0.8 + i) * 0.5;
      r.position.z = 0.08 + i * 0.04 + Math.sin(t * 3 + i) * 0.02;
    });
    const level = AudioController.getLevel();
    bars.forEach((b, i) => {
      const h = 0.05 + (Math.sin(t * 6 + i * 0.9) * 0.5 + 0.5) * 0.25 + level * 0.4;
      b.scale.z = h;
      b.position.z = h / 2;
    });
  };
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

function buildTable(group, { magazines, rightsLine }) {
  const loader = new THREE.TextureLoader();
  const n = magazines.length;
  // Sized relative to the coffee-table target (1 unit = target width) so the
  // open spread floats just over the table without leaving the screen.
  const SCALE = 0.95;
  const spread = new THREE.Group();
  spread.scale.setScalar(SCALE);
  spread.position.set(-(PAGE_W * SCALE) / 2, 0.16, 0.18);
  group.add(spread);

  // soft shadow so the pages read as an object above the table
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(PAGE_W * 2.3, PAGE_H * 1.15),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 }),
  );
  shadow.scale.setScalar(SCALE);
  shadow.position.set(0, 0.14, 0.02);
  group.add(shadow);

  const geo = new THREE.PlaneGeometry(PAGE_W, PAGE_H);

  const leaves = magazines.map((m, i) => {
    const pivot = new THREE.Group();
    const coverMat = new THREE.MeshBasicMaterial({ map: comingSoonTexture(m) });
    if (m.image) {
      loader.load(
        m.image,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          coverMat.map?.dispose();
          coverMat.map = tex;
          coverMat.needsUpdate = true;
        },
        undefined,
        () => {}, // keep the "coming soon" page if the scan is missing
      );
    }
    // Both faces occupy x 0…W from the spine (pivot origin): the cover faces
    // the viewer, the story faces away, so turning the page shows the story on the left.
    const front = new THREE.Mesh(geo, coverMat);
    front.position.x = PAGE_W / 2;
    const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: storyTexture(m, rightsLine) }));
    back.rotation.y = Math.PI;
    back.position.set(PAGE_W / 2, 0, -0.001);
    pivot.add(front, back);
    spread.add(pivot);
    return { pivot, angle: 0 };
  });

  const api = {
    flipped: 0,
    total: n,
    onChange: null,
    go(d) {
      const next = Math.max(0, Math.min(n, api.flipped + d));
      if (next === api.flipped) return;
      api.flipped = next;
      AudioController.playPageTurn();
      api.onChange?.(api.state());
    },
    next: () => api.go(1),
    prev: () => api.go(-1),
    state: () => ({ flipped: api.flipped, total: n, reading: api.flipped ? magazines[api.flipped - 1] : null }),
  };

  const update = (t) => {
    spread.position.y = 0.16 + Math.sin(t * 1.2) * 0.006;
    // closed: centre the cover; open: centre the spine; finished: centre the last story
    const offset = api.flipped === 0 ? -PAGE_W / 2 : api.flipped >= n ? PAGE_W / 2 : 0;
    spread.position.x += (offset * SCALE - spread.position.x) * 0.12;
    leaves.forEach((leaf, i) => {
      const target = i < api.flipped ? -Math.PI + i * 0.004 : 0;
      leaf.angle += (target - leaf.angle) * 0.14;
      leaf.pivot.rotation.y = leaf.angle;
      // stack order: unturned covers top-down on the right, turned pages bottom-up on the left;
      // lift each page mid-turn so it arcs over its neighbours
      const p = Math.abs(leaf.angle) / Math.PI;
      const base = i < api.flipped ? i * 0.004 : (n - i) * 0.004;
      leaf.pivot.position.z = base + Math.sin(p * Math.PI) * 0.08;
    });
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
    magazines: MAGAZINES.map((m) => ({ ...m, image: asset(m.image) })),
    rightsLine: RIGHTS.short,
  };
  const controls = {};
  const fail = (code, message) => Object.assign(new Error(message), { code });

  if (!window.isSecureContext) throw fail('insecure', 'Camera requires HTTPS.');
  if (!navigator.mediaDevices?.getUserMedia) throw fail('no-camera', 'Camera not available.');

  // Verify the compiled target file exists (SPA servers return index.html for missing files).
  try {
    const res = await fetch(targetsSrc, { cache: 'force-cache' });
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
    const built = build(anchor.group, content);
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
