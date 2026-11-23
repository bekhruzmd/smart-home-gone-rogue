import { useEffect, useRef, useState } from 'react';

// Dragging a slider fires dozens of change events. Saving each one would spam the database
// and the activity log, so the slider keeps a local "draft" value for instant feedback and
// only calls onCommit once the user stops moving it for 400 ms.
// Used for light brightness (0–100 %) and for the thermostat (55–90 °F).
export default function BrightnessSlider({ id, value, onCommit, label, disabled, min = 0, max = 100, step = 5, unit = '%' }) {
  const [draft, setDraft] = useState(value);
  const timer = useRef(null);

  // When the saved value changes from elsewhere (a mode, a rule, the master switch), follow it.
  useEffect(() => setDraft(value), [value]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(e) {
    const next = Number(e.target.value);
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onCommit(next), 400);
  }

  const fill = ((draft - min) / (max - min)) * 100;

  return (
    <div className="slider-row">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={handleChange}
        disabled={disabled}
        style={{ '--fill': `${fill}%` }}
        aria-valuetext={`${draft}${unit}`}
      />
      <output htmlFor={id} className="slider-value">
        {draft}
        {unit}
      </output>
    </div>
  );
}
