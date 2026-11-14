/**
 * An original raised-fist (Black Power) icon, drawn for this app. It fills
 * with the current text color, so it matches the other hint icons.
 */
export default function RaisedFist({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      {/* knuckles: four angled fingers */}
      <path d="M6.3 3.4 8.6 2.6l1.1 4.6-2.3.6z" />
      <path d="M9.9 2.2l2.4-.2.3 4.9-2.3.2z" />
      <path d="M13.4 2.3l2.3.6-.9 4.7-2.2-.4z" />
      <path d="M16.6 3.6l2.1 1-1.9 4-2-.8z" />
      {/* the fist and thumb */}
      <path d="M5.2 8.3l12.9-.2 1.4 1.6-.8 4.4-2.6 2.2H7.6L5 13.4z" />
      {/* the forearm */}
      <path d="M7.9 16.8h8.4l-.4 5.6H8.4z" />
    </svg>
  );
}
