// Small ISO-style safety sign shapes, drawn as inline SVG so they scale with text.
//   warning   = yellow triangle with "!"   (needs attention)
//   safe      = green square with a check  (all clear)
//   danger    = red circle with "!"        (act now)
// aria-hidden: the words next to the sign always say the same thing.
export default function SafetySign({ type = 'warning', size = 20 }) {
  if (type === 'safe') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="sign">
        <rect x="1" y="1" width="22" height="22" rx="2" fill="var(--safe)" />
        <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'danger') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="sign">
        <circle cx="12" cy="12" r="11" fill="var(--danger)" />
        <path d="M12 6.5v7" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="12" cy="17.3" r="1.6" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="sign">
      <path d="M12 1.8L23 21.5H1z" fill="var(--hazard)" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 8.5v6" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="12" cy="18" r="1.4" fill="var(--ink)" />
    </svg>
  );
}
