/**
 * MindAR image-tracking session + Three.js overlays for each artifact.
 *
 * Loaded on demand (dynamic import) so the ~2 MB tracking engine is only
 * downloaded when a visitor opens the AR Lens.
 */
import * as THREE from 'three';
import { FREQUENCIES } from '../data/frequencies';
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

function coverTexture(masthead, headline, bg, fg) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = fg;
  ctx.font = '900 96px Fraunces, Georgia, serif';
  ctx.fillText(masthead, 24, 110);
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(192, 300, 110, Math.PI, 0);
  ctx.lineTo(302, 420);
  ctx.lineTo(82, 420);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = '800 34px Fraunces, Georgia, serif';
  wrap(ctx, headline, 330).forEach((l, i) => ctx.fillText(l, 24, 460 + i * 36 - 36));
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

const COVERS = [
  ['JET', 'The News Our Papers Wouldn’t Print', '#8A3319', '#F2E6CC'],
  ['ESSENCE', 'Beauty on Our Own Terms', '#1A535C', '#D49B24'],
  ['JET', 'Hometown Graduates Make History', '#D49B24', '#2E1C14'],
  ['ESSENCE', 'Sisters Building Business', '#4F5D2F', '#F2E6CC'],
  ['JET', 'Sunday Best', '#B4502C', '#F2E6CC'],
];

function buildTable(group) {
  const mags = COVERS.map(([m, h, bg, fg], i) => {
    const side = new THREE.MeshBasicMaterial({ color: 0xf2e6cc });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 0.015), [
      side, side, side, side,
      new THREE.MeshBasicMaterial({ map: coverTexture(m, h, bg, fg) }),
      side,
    ]);
    group.add(mesh);
    return mesh;
  });
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.56),
    new THREE.MeshBasicMaterial({
      map: cardTexture({ eyebrow: '97.9 FM · Jet & Essence', title: 'The Coffee Table Pulpit', body: FREQUENCIES.table.archive[0], accent: '#8A3319' }),
      transparent: true,
    }),
  );
  card.position.set(0, -0.75, 0.1);
  group.add(card);

  return (t) => {
    mags.forEach((mesh, i) => {
      const spread = (Math.sin(t * 0.8) * 0.5 + 0.5) * 0.9;
      mesh.position.set((i - 2) * 0.12 * spread, 0.1 + Math.sin(t * 1.4 + i) * 0.02, 0.12 + i * 0.06);
      mesh.rotation.z = (i - 2) * 0.18 * spread;
      mesh.rotation.y = Math.sin(t + i) * 0.15;
    });
  };
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
    const update = build(anchor.group);
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
