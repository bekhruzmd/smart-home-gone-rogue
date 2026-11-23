import { describe, it, expect } from 'vitest';
import {
  planModeChange,
  planIntrusion,
  planAcknowledgeAlarm,
  planAlarmArm,
  planBrightness,
  planLightToggle,
  planMasterLights,
  planLockToggle,
  planThermostat,
  planEmergency,
  planRestoreNormal,
  planRuleToggle,
  validateTemperature,
} from './automationEngine.js';
import { getIssues } from './homeStatus.js';
import { RESTORE_PHRASE } from './constants.js';

// A state shaped exactly like what fetchHomeData() returns from Supabase,
// matching the seed in supabase/migrations/003_seed_functions.sql.
function makeState(homeOverrides = {}) {
  const rooms = [
    { id: 'r-living', slug: 'living_room', name: 'Living Room', sort_order: 1 },
    { id: 'r-bed', slug: 'bedroom', name: 'Bedroom', sort_order: 2 },
    { id: 'r-kitchen', slug: 'kitchen', name: 'Kitchen', sort_order: 3 },
    { id: 'r-bath', slug: 'bathroom', name: 'Bathroom', sort_order: 4 },
  ];
  const light = (id, room_id, is_on = false, brightness = 0) => ({ id, room_id, type: 'light', name: id, is_on, brightness, is_locked: null });
  const devices = [
    light('l-living', 'r-living', true, 80),
    light('l-bed', 'r-bed', true, 60),
    light('l-kitchen', 'r-kitchen'),
    light('l-bath', 'r-bath'),
    { id: 'd-front', room_id: 'r-living', type: 'lock', name: 'Front Door', is_on: null, brightness: null, is_locked: false },
    { id: 'd-back', room_id: 'r-kitchen', type: 'lock', name: 'Back Door', is_on: null, brightness: null, is_locked: false },
  ];
  const rule = (rule_key, trigger_event, action, sort_order, condition = null) => ({
    id: `rule-${rule_key}`,
    rule_key,
    name: rule_key,
    description: rule_key,
    trigger_event,
    action,
    condition,
    enabled: true,
    sort_order,
  });
  const rules = [
    rule('home_comfort_lights', 'mode_home', 'comfort_lighting', 1),
    rule('away_lights_off', 'mode_away', 'all_lights_off', 2),
    rule('night_dim_lights', 'mode_night', 'night_lighting', 3),
    rule('armed_lock_doors', 'alarm_armed', 'lock_all_doors', 4),
    rule('intrusion_trigger_alarm', 'intrusion', 'trigger_alarm', 5, 'alarm_armed'),
    rule('intrusion_lights_on', 'intrusion', 'all_lights_full', 6, 'alarm_armed'),
  ];
  const home = {
    id: 'home-1',
    mode: 'home',
    alarm_armed: false,
    alarm_triggered: false,
    target_temp: 72,
    hvac_mode: 'auto',
    emergency_active: false,
    emergency_reason: null,
    emergency_activated_at: null,
    ...homeOverrides,
  };
  return { home, rooms, devices, rules };
}

const dev = (state, id) => state.devices.find((d) => d.id === id);
const withRuleDisabled = (state, key) => ({
  ...state,
  rules: state.rules.map((r) => (r.rule_key === key ? { ...r, enabled: false } : r)),
});

describe('modes', () => {
  it('Away Mode locks every door, arms the alarm, sets 78°F and (via rule) turns all lights off', () => {
    const plan = planModeChange(makeState(), 'away');
    const s = plan.nextState;
    expect(s.home).toMatchObject({ mode: 'away', alarm_armed: true, target_temp: 78 });
    expect(dev(s, 'd-front').is_locked).toBe(true);
    expect(dev(s, 'd-back').is_locked).toBe(true);
    expect(s.devices.filter((d) => d.type === 'light').every((l) => !l.is_on)).toBe(true);
    expect(plan.executedRules).toContain('away_lights_off');
    // Only the fields that changed are sent to the database.
    expect(plan.homePatch).toEqual({ mode: 'away', alarm_armed: true, target_temp: 78 });
    expect(plan.devicePatches['l-kitchen']).toBeUndefined(); // was already off
    expect(plan.logs[0].event_type).toBe('mode');
  });

  it('Night Mode dims the bedroom to 20%, bathroom to 10%, turns off living room + kitchen, locks and arms', () => {
    const s = planModeChange(makeState(), 'night').nextState;
    expect(dev(s, 'l-bed')).toMatchObject({ is_on: true, brightness: 20 });
    expect(dev(s, 'l-bath')).toMatchObject({ is_on: true, brightness: 10 });
    expect(dev(s, 'l-living').is_on).toBe(false);
    expect(dev(s, 'l-kitchen').is_on).toBe(false);
    expect(s.home).toMatchObject({ mode: 'night', alarm_armed: true, target_temp: 68 });
    expect(dev(s, 'd-front').is_locked).toBe(true);
  });

  it('Home Mode disarms, silences, sets 72°F and applies comfort lighting', () => {
    const start = makeState({ mode: 'away', alarm_armed: true, alarm_triggered: true, target_temp: 78 });
    const s = planModeChange(start, 'home').nextState;
    expect(s.home).toMatchObject({ mode: 'home', alarm_armed: false, alarm_triggered: false, target_temp: 72 });
    expect(dev(s, 'l-living')).toMatchObject({ is_on: true, brightness: 75 });
    expect(dev(s, 'l-bath')).toMatchObject({ is_on: true, brightness: 40 });
  });

  it('a disabled rule does not run: Away Mode leaves the lights alone', () => {
    const state = withRuleDisabled(makeState(), 'away_lights_off');
    const plan = planModeChange(state, 'away');
    expect(dev(plan.nextState, 'l-living').is_on).toBe(true);
    expect(plan.executedRules).not.toContain('away_lights_off');
    expect(plan.nextState.home.alarm_armed).toBe(true); // the mode itself still applies
  });

  it('rejects unknown modes and mode changes during an emergency', () => {
    expect(() => planModeChange(makeState(), 'party')).toThrow(/Unknown mode/);
    expect(() => planModeChange(makeState({ emergency_active: true }), 'away')).toThrow(/Emergency override/);
  });

  it('does not mutate the input state (pure function)', () => {
    const state = makeState();
    const before = JSON.stringify(state);
    planModeChange(state, 'away');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('is deterministic: same input gives the same plan', () => {
    expect(planModeChange(makeState(), 'night')).toEqual(planModeChange(makeState(), 'night'));
  });
});

describe('security simulation', () => {
  it('intrusion while ARMED triggers the alarm and floodlights, logged as simulated', () => {
    const plan = planIntrusion(makeState({ alarm_armed: true }), 'Back Door');
    expect(plan.nextState.home.alarm_triggered).toBe(true);
    expect(plan.homePatch).toEqual({ alarm_triggered: true });
    expect(plan.nextState.devices.filter((d) => d.type === 'light').every((l) => l.is_on && l.brightness === 100)).toBe(true);
    expect(plan.logs[0]).toMatchObject({ event_type: 'security', simulated: true });
    expect(plan.logs[0].description).toMatch(/SIMULATED intrusion detected at the Back Door/);
    expect(plan.executedRules).toEqual(['intrusion_trigger_alarm', 'intrusion_lights_on']);
  });

  it('intrusion while DISARMED is logged but does not trigger the alarm', () => {
    const plan = planIntrusion(makeState({ alarm_armed: false }));
    expect(plan.nextState.home.alarm_triggered).toBe(false);
    expect(plan.homePatch).toEqual({});
    expect(plan.logs.map((l) => l.description).join(' ')).toMatch(/disarmed/);
    expect(plan.logs.every((l) => l.simulated)).toBe(true);
  });

  it('intrusion while armed but with the alarm rule disabled does not trigger it, and says why', () => {
    const state = withRuleDisabled(makeState({ alarm_armed: true }), 'intrusion_trigger_alarm');
    const plan = planIntrusion(state);
    expect(plan.nextState.home.alarm_triggered).toBe(false);
    expect(plan.logs.at(-1).description).toMatch(/rule is disabled/);
  });

  it('acknowledging silences the alarm but keeps the system armed', () => {
    const plan = planAcknowledgeAlarm(makeState({ alarm_armed: true, alarm_triggered: true }));
    expect(plan.nextState.home).toMatchObject({ alarm_armed: true, alarm_triggered: false });
  });

  it('arming runs the "lock doors when armed" rule; disarming also silences the alarm', () => {
    const armed = planAlarmArm(makeState(), true).nextState;
    expect(armed.home.alarm_armed).toBe(true);
    expect(dev(armed, 'd-front').is_locked && dev(armed, 'd-back').is_locked).toBe(true);

    const disarmed = planAlarmArm(makeState({ alarm_armed: true, alarm_triggered: true }), false).nextState;
    expect(disarmed.home).toMatchObject({ alarm_armed: false, alarm_triggered: false });
  });
});

describe('emergency override', () => {
  const NOW = '2026-12-01T15:00:00.000Z';

  it('sets a defined emergency state: doors unlocked, lights 100%, HVAC off, reason + time recorded', () => {
    const start = planModeChange(makeState(), 'away').nextState; // doors locked first
    const plan = planEmergency(start, 'Fire alarm', NOW);
    const s = plan.nextState;
    expect(s.home).toMatchObject({
      emergency_active: true,
      emergency_reason: 'Fire alarm',
      emergency_activated_at: NOW,
      hvac_mode: 'off',
    });
    expect(s.devices.filter((d) => d.type === 'lock').every((d) => d.is_locked === false)).toBe(true);
    expect(s.devices.filter((d) => d.type === 'light').every((d) => d.is_on && d.brightness === 100)).toBe(true);
    expect(plan.logs[0].event_type).toBe('emergency');
  });

  it('pauses automation: an armed intrusion during an emergency does not run rules', () => {
    const s = planEmergency(makeState({ alarm_armed: true }), 'Gas leak', NOW).nextState;
    const plan = planIntrusion(s);
    expect(plan.executedRules).toEqual([]);
    expect(plan.nextState.home.alarm_triggered).toBe(false);
  });

  it('requires the exact confirmation phrase to restore', () => {
    const s = planEmergency(makeState(), 'Fire alarm', NOW).nextState;
    expect(() => planRestoreNormal(s, 'please', RESTORE_PHRASE)).toThrow(/to confirm/);
    expect(() => planRestoreNormal(s, '', RESTORE_PHRASE)).toThrow();
  });

  it('restoring clears the emergency, resumes automation and returns to Home Mode', () => {
    const s = planEmergency(makeState(), 'Fire alarm', NOW).nextState;
    const plan = planRestoreNormal(s, '  i control THIS house ', RESTORE_PHRASE);
    expect(plan.nextState.home).toMatchObject({
      emergency_active: false,
      emergency_reason: null,
      mode: 'home',
      hvac_mode: 'auto',
      target_temp: 72,
    });
    expect(plan.executedRules).toContain('home_comfort_lights'); // automation runs again
  });

  it('cannot be activated twice or restored when not active', () => {
    const s = planEmergency(makeState(), 'Fire alarm', NOW).nextState;
    expect(() => planEmergency(s, 'Fire alarm', NOW)).toThrow(/already active/);
    expect(() => planRestoreNormal(makeState(), RESTORE_PHRASE, RESTORE_PHRASE)).toThrow(/not active/);
  });
});

describe('lighting, locks and climate', () => {
  it('brightness 35% updates only that light and logs it', () => {
    const plan = planBrightness(makeState(), 'l-living', 35);
    expect(plan.devicePatches).toEqual({ 'l-living': { brightness: 35 } });
    expect(plan.logs[0].description).toBe('Living Room brightness set to 35%.');
  });

  it('brightness 0 turns the light off; invalid brightness is rejected', () => {
    expect(dev(planBrightness(makeState(), 'l-living', 0).nextState, 'l-living').is_on).toBe(false);
    expect(() => planBrightness(makeState(), 'l-living', 150)).toThrow();
    expect(() => planBrightness(makeState(), 'l-living', 'abc')).toThrow();
  });

  it('turning on a light that was at 0% uses 100%', () => {
    expect(dev(planLightToggle(makeState(), 'l-kitchen').nextState, 'l-kitchen')).toMatchObject({ is_on: true, brightness: 100 });
  });

  it('master switch turns every light on or off', () => {
    const on = planMasterLights(makeState(), true).nextState;
    expect(on.devices.filter((d) => d.type === 'light').every((l) => l.is_on)).toBe(true);
    const off = planMasterLights(makeState(), false).nextState;
    expect(off.devices.filter((d) => d.type === 'light').every((l) => !l.is_on)).toBe(true);
  });

  it('lock toggle flips one door', () => {
    const plan = planLockToggle(makeState(), 'd-front');
    expect(plan.devicePatches).toEqual({ 'd-front': { is_locked: true } });
  });

  it('thermostat validates input and range', () => {
    expect(planThermostat(makeState(), { target_temp: 70 }).homePatch).toEqual({ target_temp: 70 });
    expect(() => planThermostat(makeState(), { target_temp: 120 })).toThrow(/between 55/);
    expect(() => planThermostat(makeState(), { target_temp: 'warm' })).toThrow(/whole number/);
    expect(() => planThermostat(makeState(), { hvac_mode: 'turbo' })).toThrow();
    expect(validateTemperature('')).toMatchObject({ ok: false });
    expect(validateTemperature('72.5')).toMatchObject({ ok: false });
    expect(validateTemperature('55')).toEqual({ ok: true, value: 55 });
  });

  it('setting the same temperature again produces no database writes', () => {
    const plan = planThermostat(makeState(), { target_temp: 72 });
    expect(plan.homePatch).toEqual({});
    expect(plan.logs).toEqual([]);
  });

  it('rule toggle produces a rule patch and a log entry', () => {
    const plan = planRuleToggle(makeState(), 'rule-away_lights_off');
    expect(plan.rulePatch).toEqual({ id: 'rule-away_lights_off', enabled: false });
    expect(plan.nextState.rules.find((r) => r.rule_key === 'away_lights_off').enabled).toBe(false);
  });
});

describe('issue counter (getIssues)', () => {
  it('the rogue starting state reports alarm, doors and climate issues', () => {
    const rogue = makeState({ alarm_armed: true, alarm_triggered: true, target_temp: 90 });
    expect(getIssues(rogue).map((i) => i.id).sort()).toEqual(['alarm', 'climate', 'doors']);
  });

  it('fixing everything leaves zero issues', () => {
    const rogue = makeState({ alarm_armed: true, alarm_triggered: true, target_temp: 90 });
    const away = planModeChange(rogue, 'away').nextState;
    // Changing mode must NOT silently silence a sounding alarm; it needs acknowledging.
    expect(getIssues(away).map((i) => i.id)).toEqual(['alarm']);
    const fixed = planAcknowledgeAlarm(away).nextState;
    expect(getIssues(fixed)).toEqual([]); // 78 °F in Away Mode is intentional, not an issue
  });
});
