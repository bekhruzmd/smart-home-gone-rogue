import Switch from './Switch.jsx';

const TRIGGER_LABELS = {
  mode_home: 'Home Mode activates',
  mode_away: 'Away Mode activates',
  mode_night: 'Night Mode activates',
  intrusion: 'Intrusion detected',
  alarm_armed: 'Alarm is armed',
};

const CONDITION_LABELS = { alarm_armed: 'system is armed' };

export default function RuleList({ rules, paused, onToggle }) {
  return (
    <ul className="rule-list">
      {rules.map((rule) => (
        <li key={rule.id} className={`rule ${rule.enabled ? '' : 'is-disabled'}`}>
          <div className="rule-text">
            <h3>{rule.name}</h3>
            <p className="rule-logic">
              <span className="kw">WHEN</span> {TRIGGER_LABELS[rule.trigger_event] ?? rule.trigger_event}
              {rule.condition && (
                <>
                  {' '}
                  <span className="kw">AND</span> {CONDITION_LABELS[rule.condition]}
                </>
              )}
            </p>
            <p className="muted small">{rule.description}</p>
          </div>
          <div className="rule-state">
            <span className={`badge ${!rule.enabled ? 'badge-neutral' : paused ? 'badge-warn' : 'badge-ok'}`}>
              {!rule.enabled ? 'Disabled' : paused ? 'Paused' : 'Enabled'}
            </span>
            <Switch checked={rule.enabled} onChange={() => onToggle(rule.id)} label={`Enable rule: ${rule.name}`} />
          </div>
        </li>
      ))}
    </ul>
  );
}
