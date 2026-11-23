import { Siren, OctagonAlert } from 'lucide-react';

// Shown while homes.alarm_triggered is true. Because that flag is stored in the database,
// the alert is still there after a refresh until someone acknowledges it.
export function AlarmAlert({ home, onAcknowledge }) {
  if (!home.alarm_triggered) return null;
  return (
    <div className="banner banner-alarm" role="alert">
      <Siren size={22} aria-hidden="true" />
      <div>
        <strong>Security alert: alarm triggered</strong>
        <span>Simulated event. No real sensors or emergency services are involved.</span>
      </div>
      <button type="button" className="btn btn-light" onClick={onAcknowledge}>
        Acknowledge alert
      </button>
    </div>
  );
}

export function EmergencyBanner({ home }) {
  if (!home.emergency_active) return null;
  const since = home.emergency_activated_at ? new Date(home.emergency_activated_at).toLocaleTimeString() : '';
  return (
    <div className="banner banner-emergency" role="alert">
      <OctagonAlert size={24} aria-hidden="true" />
      <div>
        <strong>EMERGENCY OVERRIDE ACTIVE: {home.emergency_reason}</strong>
        <span>
          Since {since}. Doors unlocked, lights at 100%, HVAC off. Automations and mode changes are paused.
        </span>
      </div>
      {/* Scrolls instead of using an #anchor, because the URL hash is used for page routing. */}
      <button
        type="button"
        className="btn btn-light"
        onClick={() => {
          document.getElementById('emergency-override')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          document.getElementById('restore-phrase')?.focus({ preventScroll: true });
        }}
      >
        Restore normal operation
      </button>
    </div>
  );
}
