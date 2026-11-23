import RollingNumber from './RollingNumber.jsx';
import { useEffect, useState } from 'react';
import { Thermometer, Minus, Plus } from 'lucide-react';
import SystemCard from './SystemCard.jsx';
import BrightnessSlider from './BrightnessSlider.jsx';
import { TEMP_MIN, TEMP_MAX, COMFORT_MIN, COMFORT_MAX, TEMPERATURE_PRESETS, HVAC_MODES } from '../lib/constants.js';
import { validateTemperature } from '../lib/automationEngine.js';

export default function ThermostatPanel({ state, actions }) {
  const { home } = state;
  const [typed, setTyped] = useState(String(home.target_temp));
  const [inputError, setInputError] = useState('');

  // Keep the text box in sync when a mode or preset changes the temperature.
  useEffect(() => setTyped(String(home.target_temp)), [home.target_temp]);

  const comfortable = home.target_temp >= COMFORT_MIN && home.target_temp <= COMFORT_MAX;
  // Reading color: green in the comfort zone; in Away/Night an out-of-zone setpoint is intentional (calm blue).
  const band = comfortable
    ? 'comfort'
    : home.mode !== 'home'
      ? 'setback'
      : home.target_temp < COMFORT_MIN
        ? 'cold'
        : 'hot';

  function submitTyped(e) {
    e.preventDefault();
    const check = validateTemperature(typed.trim());
    if (!check.ok) {
      setInputError(check.message);
      return;
    }
    setInputError('');
    actions.setThermostat({ target_temp: check.value });
  }

  const step = (delta) => {
    const next = home.target_temp + delta;
    if (next >= TEMP_MIN && next <= TEMP_MAX) actions.setThermostat({ target_temp: next });
  };

  return (
    <SystemCard
      title="Climate"
      icon={Thermometer}
      status={
        home.hvac_mode === 'off'
          ? 'HVAC off'
          : comfortable
            ? 'Comfortable'
            : home.mode !== 'home'
              ? 'Energy saving' // Away/Night setpoints are intentional (matches getIssues)
              : band === 'hot'
                ? 'Too warm'
                : 'Too cold'
      }
      tone={home.hvac_mode === 'off' ? 'neutral' : comfortable ? 'ok' : home.mode !== 'home' ? 'info' : 'warn'}
      className="climate-panel"
    >
      <div className="thermo-dial">
        <button
          type="button"
          className="icon-btn"
          onClick={() => step(-1)}
          disabled={home.target_temp <= TEMP_MIN}
          aria-label="Decrease temperature by 1 degree"
        >
          <Minus size={18} />
        </button>
        <p className={`thermo-reading band-${band}`} aria-live="polite">
          <RollingNumber value={home.target_temp} />
          <span>°F</span>
        </p>
        <button
          type="button"
          className="icon-btn"
          onClick={() => step(1)}
          disabled={home.target_temp >= TEMP_MAX}
          aria-label="Increase temperature by 1 degree"
        >
          <Plus size={18} />
        </button>
      </div>
      <p className="muted small center">
        Target temperature. Comfort zone {COMFORT_MIN}–{COMFORT_MAX}°F. Simulated thermostat.
      </p>

      {/* The original assignment's 55–90 °F slider, now debounced and saved. */}
      <BrightnessSlider
        id="temp-slider"
        label="Target temperature"
        value={home.target_temp}
        min={TEMP_MIN}
        max={TEMP_MAX}
        step={1}
        unit="°F"
        onCommit={(v) => actions.setThermostat({ target_temp: v })}
      />

      <form className="inline-form" onSubmit={submitTyped} noValidate>
        <label htmlFor="temp-input">Set exact temperature</label>
        <div className="input-row">
          <input
            id="temp-input"
            inputMode="numeric"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            aria-invalid={Boolean(inputError)}
            aria-describedby="temp-help"
          />
          <button type="submit" className="btn">
            Set
          </button>
        </div>
        <p id="temp-help" className={inputError ? 'field-error' : 'muted small'} role={inputError ? 'alert' : undefined}>
          {inputError || `Allowed range ${TEMP_MIN}–${TEMP_MAX}°F.`}
        </p>
      </form>

      <p className="field-label">Presets</p>
      <div className="chip-row">
        {TEMPERATURE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`chip ${home.target_temp === p.value ? 'is-active' : ''}`}
            aria-pressed={home.target_temp === p.value}
            onClick={() => actions.setThermostat({ target_temp: p.value })}
            title={p.hint}
          >
            {p.label} {p.value}°
          </button>
        ))}
      </div>

      <p className="field-label">Heating / cooling</p>
      <div className="segmented" role="group" aria-label="Heating and cooling mode">
        {HVAC_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={home.hvac_mode === m.id}
            className={home.hvac_mode === m.id ? 'is-active' : ''}
            onClick={() => actions.setThermostat({ hvac_mode: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>
    </SystemCard>
  );
}
