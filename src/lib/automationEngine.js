// Automation engine: plain, deterministic JavaScript, with no AI, randomness or network calls.
//
// Every user action goes through one "plan" function in this file. A plan function takes the
// current state and returns:
//
//   {
//     nextState,     // what the house looks like after the action (used to update React right away)
//     homePatch,     // columns to UPDATE on the homes row           -> saved by homeService.applyPlan
//     devicePatches, // { deviceId: { column: value } }              -> saved by homeService.applyPlan
//     logs,          // activity_logs rows to INSERT                  -> saved by homeService.applyPlan
//     executedRules, // rule_keys that actually changed something
//   }
//
// Because these functions never touch React or Supabase, they can be unit tested
// (src/lib/automationEngine.test.js) and give the same output for the same input every time.
//
// state shape: { home, rooms, devices, rules } exactly as loaded from Supabase.

import { MODES } from './modes.js';
import { TEMP_MIN, TEMP_MAX } from './constants.js';

/* ----------------------------- draft helpers ----------------------------- */

// A draft is a working copy of the state that records every field that changes.
function createDraft(state) {
  return {
    home: { ...state.home },
    rooms: state.rooms,
    rules: state.rules,
    devices: state.devices.map((d) => ({ ...d })),
    homePatch: {},
    devicePatches: {},
    logs: [],
    executedRules: [],
  };
}

// Sets fields on the home; returns how many actually changed.
function setHome(draft, patch) {
  let changed = 0;
  for (const [key, value] of Object.entries(patch)) {
    if (draft.home[key] !== value) {
      draft.home[key] = value;
      draft.homePatch[key] = value;
      changed++;
    }
  }
  return changed;
}

// Sets fields on one device; returns how many actually changed.
function setDevice(draft, deviceId, patch) {
  const device = draft.devices.find((d) => d.id === deviceId);
  if (!device) throw new Error(`Unknown device ${deviceId}`);
  let changed = 0;
  for (const [key, value] of Object.entries(patch)) {
    if (device[key] !== value) {
      device[key] = value;
      draft.devicePatches[deviceId] = { ...draft.devicePatches[deviceId], [key]: value };
      changed++;
    }
  }
  return changed;
}

function log(draft, event_type, description, simulated = false) {
  draft.logs.push({ event_type, description, simulated });
}

function finalize(draft) {
  return {
    nextState: { home: draft.home, rooms: draft.rooms, rules: draft.rules, devices: draft.devices },
    homePatch: draft.homePatch,
    devicePatches: draft.devicePatches,
    logs: draft.logs,
    executedRules: draft.executedRules,
  };
}

const lights = (draft) => draft.devices.filter((d) => d.type === 'light');
const locks = (draft) => draft.devices.filter((d) => d.type === 'lock');

function lightInRoom(draft, slug) {
  const room = draft.rooms.find((r) => r.slug === slug);
  return room ? lights(draft).filter((d) => d.room_id === room.id) : [];
}

// Brightness 0 means "off"; anything above 0 means "on".
function setLightLevel(draft, light, brightness) {
  return setDevice(draft, light.id, { is_on: brightness > 0, brightness });
}

/* -------------------------------- actions -------------------------------- */
// What each automation_rules.action value does. Each returns the number of changed fields.

export const ACTIONS = {
  all_lights_off: (draft) => lights(draft).reduce((n, l) => n + setDevice(draft, l.id, { is_on: false }), 0),

  all_lights_full: (draft) => lights(draft).reduce((n, l) => n + setLightLevel(draft, l, 100), 0),

  comfort_lighting: (draft) => {
    const levels = { living_room: 75, kitchen: 75, bedroom: 40, bathroom: 40 };
    return Object.entries(levels).reduce(
      (n, [slug, level]) => n + lightInRoom(draft, slug).reduce((m, l) => m + setLightLevel(draft, l, level), 0),
      0,
    );
  },

  night_lighting: (draft) => {
    let n = 0;
    for (const l of lightInRoom(draft, 'bedroom')) n += setLightLevel(draft, l, 20);
    for (const l of lightInRoom(draft, 'bathroom')) n += setLightLevel(draft, l, 10);
    for (const l of [...lightInRoom(draft, 'living_room'), ...lightInRoom(draft, 'kitchen')]) {
      n += setDevice(draft, l.id, { is_on: false });
    }
    return n;
  },

  lock_all_doors: (draft) => locks(draft).reduce((n, d) => n + setDevice(draft, d.id, { is_locked: true }), 0),

  trigger_alarm: (draft) => setHome(draft, { alarm_triggered: true }),
};

const CONDITIONS = {
  alarm_armed: (draft) => draft.home.alarm_armed === true,
};

/* ------------------------------ rule runner ------------------------------ */

// Runs every enabled rule for one trigger, in sort_order. Rules run one after another on
// the same draft, so a later rule sees what an earlier one changed.
// Returns false when automation is paused by the emergency override.
export function runRules(draft, trigger) {
  if (draft.home.emergency_active) return false;

  const matching = draft.rules
    .filter((r) => r.enabled && r.trigger_event === trigger)
    .sort((a, b) => a.sort_order - b.sort_order);

  for (const rule of matching) {
    const condition = rule.condition ? CONDITIONS[rule.condition] : null;
    if (condition && !condition(draft)) continue;

    const action = ACTIONS[rule.action];
    if (!action) continue; // unknown action: ignore instead of crashing

    const changes = action(draft);
    // Only log rules that actually did something, so the history stays meaningful.
    if (changes > 0) {
      draft.executedRules.push(rule.rule_key);
      log(draft, 'automation', `Rule "${rule.name}" ran: ${rule.description}`);
    }
  }
  return true;
}

/* ---------------------------- validation helpers ---------------------------- */

export function validateTemperature(value) {
  const n = Number(value);
  if (value === '' || value === null || !Number.isFinite(n) || !Number.isInteger(n)) {
    return { ok: false, message: 'Enter a whole number.' };
  }
  if (n < TEMP_MIN || n > TEMP_MAX) {
    return { ok: false, message: `Temperature must be between ${TEMP_MIN}°F and ${TEMP_MAX}°F.` };
  }
  return { ok: true, value: n };
}

export function validateBrightness(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    return { ok: false, message: 'Brightness must be a whole number from 0 to 100.' };
  }
  return { ok: true, value: n };
}

function deviceOrThrow(state, id) {
  const device = state.devices.find((d) => d.id === id);
  if (!device) throw new Error('That device no longer exists. Refresh the page.');
  return device;
}

const roomName = (state, device) => state.rooms.find((r) => r.id === device.room_id)?.name ?? 'Unknown room';

/* ------------------------------ plan functions ------------------------------ */

// Shared by planModeChange and planRestoreNormal.
function applyMode(draft, modeId) {
  const mode = MODES[modeId];
  const wasArmed = draft.home.alarm_armed;

  setHome(draft, { mode: modeId, ...mode.home });
  if (mode.lockAllDoors) {
    for (const lock of locks(draft)) setDevice(draft, lock.id, { is_locked: true });
  }

  const parts = [`thermostat ${mode.home.target_temp}°F`, mode.home.alarm_armed ? 'alarm armed' : 'alarm disarmed'];
  if (mode.lockAllDoors) parts.unshift('all doors locked');
  log(draft, 'mode', `${mode.label} Mode activated: ${parts.join(', ')}.`);

  const ran = runRules(draft, `mode_${modeId}`);
  if (ran && !wasArmed && draft.home.alarm_armed) runRules(draft, 'alarm_armed');
}

export function planModeChange(state, modeId) {
  if (!MODES[modeId]) throw new Error(`Unknown mode "${modeId}"`);
  if (state.home.emergency_active) {
    throw new Error('Emergency override is active. Restore normal operation before changing modes.');
  }
  const draft = createDraft(state);
  applyMode(draft, modeId);
  return finalize(draft);
}

export function planLightToggle(state, deviceId) {
  const light = deviceOrThrow(state, deviceId);
  const draft = createDraft(state);
  const turningOn = !light.is_on;
  // Turning on a light that was at 0% would look like nothing happened, so use 100%.
  const brightness = turningOn && light.brightness === 0 ? 100 : light.brightness;
  setDevice(draft, deviceId, { is_on: turningOn, brightness });
  log(draft, 'lighting', `${roomName(state, light)} lights turned ${turningOn ? `on (${brightness}%)` : 'off'}.`);
  return finalize(draft);
}

export function planBrightness(state, deviceId, value) {
  const check = validateBrightness(value);
  if (!check.ok) throw new Error(check.message);
  const light = deviceOrThrow(state, deviceId);
  const draft = createDraft(state);
  setLightLevel(draft, draft.devices.find((d) => d.id === deviceId), check.value);
  log(draft, 'lighting', `${roomName(state, light)} brightness set to ${check.value}%${check.value === 0 ? ' (off)' : ''}.`);
  return finalize(draft);
}

export function planMasterLights(state, turnOn) {
  const draft = createDraft(state);
  for (const light of lights(draft)) {
    setDevice(draft, light.id, turnOn ? { is_on: true, brightness: light.brightness || 100 } : { is_on: false });
  }
  log(draft, 'lighting', `Master switch: all lights turned ${turnOn ? 'on' : 'off'}.`);
  return finalize(draft);
}

export function planLockToggle(state, deviceId) {
  const lock = deviceOrThrow(state, deviceId);
  const draft = createDraft(state);
  setDevice(draft, deviceId, { is_locked: !lock.is_locked });
  log(draft, 'security', `${lock.name} ${lock.is_locked ? 'unlocked' : 'locked'}.`);
  return finalize(draft);
}

export function planLockAll(state, locked) {
  const draft = createDraft(state);
  for (const lock of locks(draft)) setDevice(draft, lock.id, { is_locked: locked });
  log(draft, 'security', `All doors ${locked ? 'locked' : 'unlocked'}.`);
  return finalize(draft);
}

export function planAlarmArm(state, armed) {
  const draft = createDraft(state);
  // Disarming also silences an alarm that is going off.
  setHome(draft, armed ? { alarm_armed: true } : { alarm_armed: false, alarm_triggered: false });
  log(draft, 'security', armed ? 'Security system armed.' : 'Security system disarmed.');
  if (armed && !state.home.alarm_armed) runRules(draft, 'alarm_armed');
  return finalize(draft);
}

// Simulated intrusion (the "Simulate Intrusion" button). Nothing here touches real hardware.
export function planIntrusion(state, location = 'Back Door') {
  const draft = createDraft(state);
  log(draft, 'security', `SIMULATED intrusion detected at the ${location}.`, true);

  if (draft.home.emergency_active) {
    log(draft, 'security', 'SIMULATED: emergency override is active, so automations did not respond.', true);
    return finalize(draft);
  }
  if (!draft.home.alarm_armed) {
    log(draft, 'security', 'SIMULATED: system is disarmed, so the alarm was not triggered.', true);
  }
  runRules(draft, 'intrusion');
  if (draft.home.alarm_armed && !draft.home.alarm_triggered) {
    log(draft, 'security', 'SIMULATED: system is armed but the "sound alarm" rule is disabled.', true);
  }
  return finalize(draft);
}

export function planAcknowledgeAlarm(state) {
  const draft = createDraft(state);
  setHome(draft, { alarm_triggered: false });
  log(
    draft,
    'security',
    `Alarm acknowledged and silenced. System is still ${draft.home.alarm_armed ? 'armed' : 'disarmed'}.`,
    true,
  );
  return finalize(draft);
}

export function planThermostat(state, { target_temp, hvac_mode }) {
  const draft = createDraft(state);
  const parts = [];
  if (target_temp !== undefined) {
    const check = validateTemperature(target_temp);
    if (!check.ok) throw new Error(check.message);
    if (setHome(draft, { target_temp: check.value })) parts.push(`target set to ${check.value}°F`);
  }
  if (hvac_mode !== undefined) {
    if (!['heat', 'cool', 'auto', 'off'].includes(hvac_mode)) throw new Error('Unknown heating/cooling mode.');
    if (setHome(draft, { hvac_mode })) parts.push(`mode set to ${hvac_mode}`);
  }
  if (parts.length) log(draft, 'climate', `Thermostat ${parts.join(', ')}.`);
  return finalize(draft);
}

// Emergency override — see presentation/ARCHITECTURE.md for the reasoning.
//  1. Marks the home as being in an emergency (emergency_active + reason + time).
//  2. Unlocks every door so people can get out and responders can get in.
//  3. Turns every light on at 100% so exits are visible.
//  4. Turns the HVAC off so it doesn't spread smoke or gas.
//  5. Pauses ALL automation rules (runRules returns early) and blocks mode changes
//     until someone explicitly restores normal operation.
export function planEmergency(state, reason, now = new Date().toISOString()) {
  if (state.home.emergency_active) throw new Error('Emergency override is already active.');
  const cleanReason = String(reason ?? '').trim() || 'Unspecified emergency';
  const draft = createDraft(state);
  setHome(draft, {
    emergency_active: true,
    emergency_reason: cleanReason,
    emergency_activated_at: now,
    hvac_mode: 'off',
  });
  for (const lock of locks(draft)) setDevice(draft, lock.id, { is_locked: false });
  for (const light of lights(draft)) setLightLevel(draft, light, 100);
  log(
    draft,
    'emergency',
    `EMERGENCY OVERRIDE activated (${cleanReason}): doors unlocked, all lights 100%, HVAC off, automations paused.`,
  );
  return finalize(draft);
}

// Leaving the emergency state needs an explicit confirmation phrase, then the home
// goes back to Home Mode with automations running again.
export function planRestoreNormal(state, phrase, requiredPhrase) {
  if (!state.home.emergency_active) throw new Error('Emergency override is not active.');
  if (String(phrase ?? '').trim().toLowerCase() !== requiredPhrase.toLowerCase()) {
    throw new Error(`Type "${requiredPhrase}" to confirm.`);
  }
  const draft = createDraft(state);
  setHome(draft, { emergency_active: false, emergency_reason: null, emergency_activated_at: null, hvac_mode: 'auto' });
  log(draft, 'emergency', 'Emergency override cleared by the user. Automations resumed.');
  applyMode(draft, 'home');
  return finalize(draft);
}

export function planRuleToggle(state, ruleId) {
  const rule = state.rules.find((r) => r.id === ruleId);
  if (!rule) throw new Error('That rule no longer exists. Refresh the page.');
  const draft = createDraft(state);
  draft.rules = state.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  log(draft, 'automation', `Rule "${rule.name}" ${rule.enabled ? 'disabled' : 'enabled'}.`);
  return { ...finalize(draft), rulePatch: { id: ruleId, enabled: !rule.enabled } };
}
