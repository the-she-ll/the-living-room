import { useState } from 'react';
import { Check, Radio, X } from 'lucide-react';
import { FREQUENCIES } from '../data/frequencies';
import AudioController from '../audio/AudioController';

/** Hotspot positions in the 400×300 illustration (percent-based). */
const HOTSPOTS = {
  portraits: { x: 33, y: 22 },
  chair: { x: 30, y: 55 },
  table: { x: 47, y: 78 },
  turntable: { x: 80, y: 52 },
  phone: { x: 9, y: 58 },
};

function LivingRoomScene() {
  return (
    <svg viewBox="0 0 400 300" className="block h-full w-full" role="img" aria-label="Illustrated map of the 1970s living room painting">
      <defs>
        <pattern id="panel" width="22" height="200" patternUnits="userSpaceOnUse">
          <rect width="22" height="200" fill="#6b4026" />
          <rect width="20" height="200" fill="#7a4a2c" />
          <path d="M6 0 q3 60 -1 120 t2 80" stroke="#5a3520" strokeWidth="1" fill="none" opacity=".6" />
          <path d="M14 0 q-2 70 2 130 t-1 70" stroke="#8c5a36" strokeWidth="1" fill="none" opacity=".5" />
        </pattern>
        <pattern id="shag" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#d49b24" />
          <path d="M1 6 L2 1 M4 6 L5 2" stroke="#b9821a" strokeWidth="1.2" />
          <path d="M3 6 L3 2" stroke="#e8bd5a" strokeWidth="1" />
        </pattern>
        <linearGradient id="velvet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a8a4a" />
          <stop offset="1" stopColor="#3e4a24" />
        </linearGradient>
        <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd98a" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3722" />
          <stop offset="1" stopColor="#3a2214" />
        </linearGradient>
      </defs>

      {/* wall + floor */}
      <rect width="400" height="200" fill="url(#panel)" />
      <rect y="0" width="400" height="10" fill="#4a2b18" />
      <rect y="196" width="400" height="6" fill="#3a2214" />
      <rect y="200" width="400" height="100" fill="url(#floor)" />

      {/* window with afternoon light */}
      <rect x="250" y="30" width="70" height="80" fill="#f4d890" />
      <rect x="250" y="30" width="70" height="80" fill="none" stroke="#3a2214" strokeWidth="5" />
      <path d="M285 30 V110 M250 70 H320" stroke="#3a2214" strokeWidth="3" />
      <path d="M238 26 Q250 70 240 116 L258 116 Q250 70 258 26Z" fill="#8a3319" />
      <path d="M332 26 Q320 70 330 116 L312 116 Q320 70 312 26Z" fill="#8a3319" />
      <path d="M250 110 L200 300 L380 300 L320 110Z" fill="url(#sun)" />

      {/* portraits wall */}
      {[
        [80, 30, 34, 42], [124, 22, 40, 52], [174, 34, 30, 36], [100, 82, 26, 30], [150, 84, 34, 28],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#c99a2e" />
          <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="#e6d6b0" />
          <circle cx={x + w / 2} cy={y + h * 0.42} r={w * 0.16} fill="#4a2b18" />
          <path d={`M${x + w * 0.22} ${y + h - 3} Q${x + w / 2} ${y + h * 0.52} ${x + w * 0.78} ${y + h - 3}Z`} fill="#4a2b18" />
        </g>
      ))}

      {/* side table + rotary phone */}
      <rect x="18" y="160" width="40" height="6" fill="#5a3520" />
      <rect x="22" y="166" width="4" height="40" fill="#4a2b18" />
      <rect x="50" y="166" width="4" height="40" fill="#4a2b18" />
      <path d="M26 160 Q26 146 38 146 Q50 146 50 160Z" fill="#8a3319" />
      <circle cx="38" cy="153" r="5" fill="#f2e6cc" />
      <path d="M24 146 Q38 136 52 146" stroke="#8a3319" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M50 156 q8 6 2 12 q-6 6 2 12 q8 6 2 12" stroke="#8a3319" strokeWidth="1.5" fill="none" />
      {/* lamp */}
      <path d="M28 104 L48 104 L54 128 L22 128Z" fill="#e8bd5a" opacity=".95" />
      <rect x="36" y="128" width="4" height="18" fill="#3a2214" />

      {/* sofa (velvet + plastic sheen) */}
      <rect x="62" y="132" width="168" height="44" rx="12" fill="url(#velvet)" />
      <rect x="56" y="150" width="24" height="52" rx="10" fill="#3e4a24" />
      <rect x="212" y="150" width="24" height="52" rx="10" fill="#3e4a24" />
      <rect x="76" y="168" width="140" height="28" rx="8" fill="#6f7f45" />
      <path d="M70 140 Q146 126 222 140" stroke="#fff" strokeOpacity=".4" strokeWidth="2.5" fill="none" />
      <path d="M82 172 Q146 164 210 172" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" />
      <rect x="74" y="200" width="6" height="8" fill="#2a1810" />
      <rect x="212" y="200" width="6" height="8" fill="#2a1810" />

      {/* stereo console */}
      <rect x="262" y="140" width="128" height="58" rx="4" fill="#6b3f22" />
      <rect x="268" y="146" width="52" height="44" fill="#3a2214" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x="270" y={149 + i * 6} width="48" height="2.5" fill="#2a160c" />
      ))}
      <rect x="326" y="128" width="58" height="14" rx="2" fill="#4a2b18" />
      <ellipse cx="352" cy="132" rx="20" ry="5" fill="#111" />
      <ellipse cx="352" cy="132" rx="6" ry="1.6" fill="#d49b24" />
      <path d="M376 126 L360 134" stroke="#ccc" strokeWidth="1.8" />
      <rect x="330" y="154" width="50" height="8" rx="2" fill="#120a06" />
      <rect x="334" y="156" width="20" height="4" fill="#ffb347" opacity=".8" />
      <rect x="272" y="198" width="6" height="10" fill="#3a2214" />
      <rect x="376" y="198" width="6" height="10" fill="#3a2214" />
      {/* record crate */}
      <rect x="290" y="214" width="40" height="26" fill="#8c5a36" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={293 + i * 9} y="206" width="7" height="12" fill={['#1a535c', '#8a3319', '#d49b24', '#4f5d2f'][i]} />
      ))}

      {/* shag rug */}
      <ellipse cx="190" cy="252" rx="160" ry="40" fill="url(#shag)" />
      <ellipse cx="190" cy="252" rx="160" ry="40" fill="none" stroke="#e8bd5a" strokeWidth="3" strokeDasharray="1 3" />

      {/* coffee table + magazines */}
      <ellipse cx="190" cy="236" rx="74" ry="14" fill="#4a2b18" />
      <ellipse cx="190" cy="232" rx="74" ry="14" fill="#86532d" />
      <rect x="128" y="236" width="6" height="22" fill="#4a2b18" />
      <rect x="246" y="236" width="6" height="22" fill="#4a2b18" />
      <g transform="rotate(-10 168 228)">
        <rect x="152" y="220" width="30" height="16" fill="#8a3319" />
        <text x="167" y="232" textAnchor="middle" fontSize="9" fontWeight="900" fill="#f2e6cc" fontFamily="Georgia">JET</text>
      </g>
      <g transform="rotate(8 206 228)">
        <rect x="190" y="220" width="34" height="17" fill="#1a535c" />
        <text x="207" y="232" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#d49b24" fontFamily="Georgia">ESSENCE</text>
      </g>
      <circle cx="236" cy="226" r="5" fill="#c99a2e" />

      {/* plant */}
      <rect x="236" y="182" width="16" height="18" fill="#8a3319" />
      {[-40, -15, 10, 35].map((a) => (
        <ellipse key={a} cx="244" cy="166" rx="4" ry="18" fill="#4f5d2f" transform={`rotate(${a} 244 182)`} />
      ))}
    </svg>
  );
}

/**
 * The non-NFC route. Tap the illustrated painting to read each riddle, then
 * "tune in" once you've found the matching object on the real canvas.
 */
export default function CanvasMap({ discovered, onTuneIn, onOpen }) {
  const [selected, setSelected] = useState(null);
  const sel = selected ? FREQUENCIES[selected] : null;
  const selFound = selected && discovered.includes(selected);

  return (
    <section aria-label="Explore map">
      <div className="relative overflow-hidden rounded-2xl border-[10px] border-[#6b4a1e] bg-umber shadow-[0_0_0_2px_#c99a2e,0_20px_40px_rgba(0,0,0,0.5)]">
        <div className="film-grain aspect-[4/3]">
          <LivingRoomScene />
        </div>

        {Object.entries(HOTSPOTS).map(([id, pos]) => {
          const f = FREQUENCIES[id];
          const found = discovered.includes(id);
          const isSel = selected === id;
          return (
            <button
              type="button"
              key={id}
              onClick={() => {
                AudioController.playClick();
                setSelected(isSel ? null : id);
              }}
              aria-label={found ? `${f.title}, discovered` : `Hidden frequency ${f.band}`}
              className="absolute z-[4] grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {!found && <span className="absolute inset-1 animate-hotspot rounded-full border-2 border-amber" />}
              <span
                className={`relative grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-black shadow-lg transition ${
                  isSel ? 'scale-125' : ''
                } ${found ? 'border-parchment text-parchment' : 'border-amber bg-umber-deep/80 text-amber'}`}
                style={found ? { background: f.color } : undefined}
              >
                {found ? <Check size={14} strokeWidth={3} /> : '?'}
              </span>
            </button>
          );
        })}
      </div>

      {/* clue card */}
      <div className="mt-3 min-h-[112px]">
        {sel ? (
          <div key={selected} className="parchment animate-rise rounded-xl p-4 shadow-lg" style={{ borderLeft: `6px solid ${sel.color}` }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-60">
                  {sel.band} FM · {selFound ? sel.subtitle : 'Unknown signal'}
                </p>
                <p className="font-display text-xl font-black">{selFound ? sel.title : 'A riddle on the air…'}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close clue" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/10">
                <X size={16} />
              </button>
            </div>
            <p className="font-display mt-1 text-[15px] leading-snug italic">{sel.clue}</p>
            <button
              type="button"
              onClick={() => (selFound ? onOpen(selected) : onTuneIn(selected))}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full py-3 font-bold text-parchment"
              style={{ background: sel.color }}
            >
              <Radio size={16} /> {selFound ? 'Open this frequency' : 'Found it, tune in'}
            </button>
          </div>
        ) : (
          <p className="px-2 pt-2 text-center text-sm text-parchment/70">
            No NFC on your phone? Tap a glowing <span className="text-amber">?</span> to hear its riddle, find the object in the painting, then tune in.
          </p>
        )}
      </div>
    </section>
  );
}
