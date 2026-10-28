/**
 * Illustrated stand-ins for archival photographs (rendered with film grain in
 * ArtifactModal). Replace with licensed images by swapping this component for
 * an <img>, e.g. <img src={`/images/archive/${id}.jpg`} />.
 */
const WALL = (
  <>
    <rect width="320" height="200" fill="#5a3722" />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={i * 28} width="2" height="200" fill="#3a2214" />
    ))}
  </>
);

const SCENES = {
  portraits: (
    <>
      {WALL}
      {[
        [40, 40, 60, 76],
        [130, 26, 64, 84],
        [222, 44, 56, 70],
        [92, 128, 44, 52],
        [180, 128, 50, 56],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#b8892b" />
          <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} fill="#d9c9a3" />
          <circle cx={x + w / 2} cy={y + h * 0.42} r={w * 0.17} fill="#3b2418" />
          <path d={`M${x + w * 0.2} ${y + h - 5} Q${x + w / 2} ${y + h * 0.5} ${x + w * 0.8} ${y + h - 5}Z`} fill="#3b2418" />
        </g>
      ))}
    </>
  ),
  chair: (
    <>
      {WALL}
      <rect y="150" width="320" height="50" fill="#c99a2e" />
      <path d="M50 70 Q160 50 270 70 L270 150 L50 150Z" fill="#4f5d2f" />
      <rect x="36" y="100" width="40" height="60" rx="16" fill="#3e4a24" />
      <rect x="244" y="100" width="40" height="60" rx="16" fill="#3e4a24" />
      <rect x="70" y="112" width="180" height="34" rx="10" fill="#6f7f45" />
      <path d="M60 72 Q160 54 262 72" stroke="#fff" strokeOpacity=".35" strokeWidth="3" fill="none" />
      <rect x="120" y="166" width="80" height="14" rx="3" fill="#5a3722" />
    </>
  ),
  table: (
    <>
      <rect width="320" height="200" fill="#c99a2e" />
      <ellipse cx="160" cy="120" rx="140" ry="60" fill="#6b3f22" />
      <ellipse cx="160" cy="114" rx="132" ry="54" fill="#86532d" />
      <g transform="rotate(-8 120 110)">
        <rect x="80" y="80" width="70" height="90" fill="#8a3319" />
        <text x="115" y="100" textAnchor="middle" fontSize="18" fontWeight="900" fill="#f2e6cc" fontFamily="Georgia">JET</text>
      </g>
      <g transform="rotate(10 200 110)">
        <rect x="160" y="76" width="74" height="94" fill="#1a535c" />
        <text x="197" y="96" textAnchor="middle" fontSize="13" fontWeight="900" fill="#d49b24" fontFamily="Georgia">ESSENCE</text>
      </g>
    </>
  ),
  turntable: (
    <>
      {WALL}
      <rect x="20" y="96" width="280" height="80" rx="6" fill="#6b3f22" />
      <rect x="30" y="104" width="120" height="62" fill="#3a2214" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="34" y={108 + i * 7} width="112" height="3" fill="#2a160c" />
      ))}
      <circle cx="222" cy="134" r="34" fill="#111" />
      <circle cx="222" cy="134" r="11" fill="#d49b24" />
      <path d="M268 104 L246 140" stroke="#ccc" strokeWidth="3" />
      <rect x="54" y="176" width="10" height="16" fill="#3a2214" />
      <rect x="256" y="176" width="10" height="16" fill="#3a2214" />
    </>
  ),
  phone: (
    <>
      {WALL}
      <rect x="90" y="140" width="140" height="60" fill="#6b3f22" />
      <path d="M118 140 Q118 100 160 100 Q202 100 202 140Z" fill="#8a3319" />
      <circle cx="160" cy="122" r="16" fill="#e9dcbd" />
      <circle cx="160" cy="122" r="6" fill="#8a3319" />
      <path d="M112 96 Q160 74 208 96" stroke="#8a3319" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M210 130 q14 10 4 20 q-10 10 4 20 q14 10 4 20" stroke="#8a3319" strokeWidth="3" fill="none" />
    </>
  ),
};

export default function ArtifactIllustration({ id, className = '' }) {
  return (
    <svg viewBox="0 0 320 200" className={`block h-auto w-full ${className}`} role="img" aria-label={`Illustration: ${id}`}>
      {SCENES[id]}
    </svg>
  );
}
