import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';
import SafetySign from './SafetySign.jsx';
import SystemCard from './SystemCard.jsx';
import ActivityList from './ActivityList.jsx';
import Select from './Select.jsx';

const INTRUSION_LOCATIONS = ['Back Door', 'Front Door', 'Living Room Window', 'Garage'];

export default function SecurityPanel({ state, logs, actions }) {
  const { home, devices } = state;
  const locks = devices.filter((d) => d.type === 'lock');
  const allLocked = locks.every((d) => d.is_locked);
  const [location, setLocation] = useState(INTRUSION_LOCATIONS[0]);

  let status = 'Disarmed';
  let tone = 'neutral';
  let Icon = ShieldOff;
  if (home.alarm_triggered) {
    status = 'Alarm sounding';
    tone = 'danger';
    Icon = ShieldAlert;
  } else if (home.alarm_armed) {
    status = 'Armed';
    tone = 'ok';
    Icon = ShieldCheck;
  }

  const securityLogs = logs.filter((l) => l.event_type === 'security').slice(0, 3);

  return (
    <SystemCard title="Security" icon={Icon} status={status} tone={tone} className="security-panel">
      <div className="security-row">
        <div>
          <p className="big-reading">{home.alarm_armed ? 'Armed' : 'Disarmed'}</p>
          <p className="muted small">Alarm system</p>
        </div>
        <button
          type="button"
          className={`btn ${home.alarm_armed ? '' : 'btn-primary'}`}
          onClick={() => actions.setArmed(!home.alarm_armed)}
        >
          {home.alarm_armed ? 'Disarm' : 'Arm system'}
        </button>
      </div>

      <ul className="door-list" aria-label="Door locks">
        {locks.map((lock) => (
          <li key={lock.id}>
            <span className="door-name">
              <SafetySign type={lock.is_locked ? 'safe' : 'warning'} size={18} />
              {lock.name}
              <span className="door-state">{lock.is_locked ? 'Locked' : 'Unlocked'}</span>
            </span>
            <button type="button" className="btn btn-sm" onClick={() => actions.toggleLock(lock.id)}>
              {lock.is_locked ? 'Unlock' : 'Lock'}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-block" onClick={() => actions.lockAll(!allLocked)}>
        {allLocked ? 'Unlock all doors' : 'Lock all doors'}
      </button>

      <div className="panel-section">
        <h3 className="subhead">Simulate an intrusion</h3>
        <div className="simulate-row">
          <label htmlFor="intrusion-location" className="sr-only">
            Simulated intrusion location
          </label>
          <Select
            id="intrusion-location"
            value={location}
            onChange={(e) => setLocation(typeof e === 'string' ? e : e.target.value)}
            options={INTRUSION_LOCATIONS}
            aria-label="Simulated intrusion location"
          />
          <button type="button" className="btn btn-danger" onClick={() => actions.simulateIntrusion(location)}>
            Simulate intrusion
          </button>
        </div>
        <p className="muted small">Creates a fake security event. No real sensors are involved.</p>
      </div>

      <div className="panel-section">
        <h3 className="subhead">Security history</h3>
        <ActivityList logs={securityLogs} compact emptyText="No security events yet." />
      </div>
    </SystemCard>
  );
}
