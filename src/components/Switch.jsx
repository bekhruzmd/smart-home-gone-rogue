// Accessible on/off switch: a real <button> with role="switch", so it works with
// keyboard (Tab + Space/Enter) and screen readers announce "on"/"off".
export default function Switch({ checked, onChange, label, disabled = false, showLabel = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      className={`switch ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      {showLabel && <span className="switch-label">{label}</span>}
    </button>
  );
}
