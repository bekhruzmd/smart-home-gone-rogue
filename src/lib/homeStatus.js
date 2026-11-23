// Derived status. Nothing here is stored: it's calculated from state on every render,
// the same way the original assignment counted "active issues".

import { COMFORT_MIN, COMFORT_MAX } from './constants.js';

export function getIssues(state) {
  if (!state?.home) return [];
  const { home, devices } = state;
  const issues = [];

  if (home.emergency_active) {
    issues.push({ id: 'emergency', severity: 'critical', text: `Emergency override active: ${home.emergency_reason}` });
  }
  if (home.alarm_triggered) {
    issues.push({ id: 'alarm', severity: 'critical', text: 'Alarm is sounding' });
  }

  const unlocked = devices.filter((d) => d.type === 'lock' && !d.is_locked);
  if (unlocked.length) {
    issues.push({
      id: 'doors',
      severity: 'warning',
      text: `${unlocked.map((d) => d.name).join(' and ')} ${unlocked.length === 1 ? 'is' : 'are'} unlocked`,
    });
  }

  // Only while someone is home: Away Mode deliberately uses an energy-saving 78 °F.
  if (home.mode === 'home' && home.hvac_mode !== 'off' && (home.target_temp < COMFORT_MIN || home.target_temp > COMFORT_MAX)) {
    issues.push({
      id: 'climate',
      severity: 'warning',
      text: `Thermostat at ${home.target_temp}°F is outside the ${COMFORT_MIN}–${COMFORT_MAX}°F comfort zone`,
    });
  }

  if (home.mode !== 'home' && !home.alarm_armed) {
    issues.push({ id: 'unarmed', severity: 'warning', text: 'Alarm is disarmed while nobody is home/awake' });
  }
  return issues;
}

export function lightsSummary(devices) {
  const all = devices.filter((d) => d.type === 'light');
  const on = all.filter((d) => d.is_on);
  return { total: all.length, on: on.length };
}
