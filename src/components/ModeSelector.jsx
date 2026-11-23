import { House, Plane, Moon } from 'lucide-react';
import { MODE_LIST } from '../lib/modes.js';

const ICONS = { home: House, away: Plane, night: Moon };

export default function ModeSelector({ mode, disabled, onSelect }) {
  return (
    <section className="mode-selector" aria-labelledby="mode-heading">
      <div className="section-head">
        <h2 id="mode-heading">Home mode</h2>
        {disabled && <span className="muted small">Locked during emergency override</span>}
      </div>
      <div className="mode-grid">
        {MODE_LIST.map((m) => {
          const Icon = ICONS[m.id];
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              className={`mode-button ${active ? 'is-active' : ''}`}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onSelect(m.id)}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="mode-name">{m.label}</span>
              <span className="mode-desc">{m.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
