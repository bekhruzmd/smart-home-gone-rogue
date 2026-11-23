// Each digit stays mounted: rapid updates retarget its CSS transition.
export default function RollingNumber({ value }) {
  return (
    <span className="rolling-number" aria-label={String(value)}>
      {String(value).split('').map((digit, index) => (
        <span className="rolling-window" key={index} aria-hidden="true">
          <span className="rolling-reel" style={{ transform: `translateY(-${Number(digit) * 10}%)` }}>
            {Array.from({ length: 10 }, (_, n) => <span className="rolling-digit" key={n}>{n}</span>)}
          </span>
        </span>
      ))}
    </span>
  );
}
