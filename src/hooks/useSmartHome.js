import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureHome, fetchHomeData, applyPlan, resetDemoHome } from '../services/homeService.js';
import * as engine from '../lib/automationEngine.js';
import { RESTORE_PHRASE } from '../lib/constants.js';

const LOG_LIMIT = 30;

// The single source of truth for the smart home in React.
//
// Data flow for every button:
//   component -> action here -> engine.planX(currentState) -> setState(plan.nextState)   (instant UI)
//                                                         -> applyPlan() saves to Supabase
//   if saving fails -> show the error and reload from the database, so the screen
//                      never keeps showing a change that wasn't saved.
export function useSmartHome(userId, notify) {
  const [state, setState] = useState(null); // { home, rooms, devices, rules }
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [loadError, setLoadError] = useState('');
  const [savingCount, setSavingCount] = useState(0);

  // A ref always holds the latest state, so two quick clicks plan from fresh data
  // instead of from a stale render.
  const stateRef = useRef(null);
  const homeIdRef = useRef(null);

  const pending = useRef(Promise.resolve());
  const enqueue = useCallback((task) => {
    setSavingCount((n) => n + 1);
    const result = pending.current.then(task);
    pending.current = result.catch(() => {});
    return result.finally(() => setSavingCount((n) => n - 1));
  }, []);

  const commitState = (next) => {
    stateRef.current = next;
    setState(next);
  };

  const load = useCallback(async ({ failureContext = '' } = {}) => {
    setStatus('loading');
    try {
      homeIdRef.current ??= await ensureHome();
      const data = await fetchHomeData(homeIdRef.current);
      const { logs: freshLogs, ...homeState } = data;
      commitState(homeState);
      setLogs(freshLogs);
      setStatus('ready');
      setLoadError('');
      return true;
    } catch (err) {
      commitState(null);
      setLoadError(failureContext + err.message);
      setStatus('error');
      return false;
    }
  }, []);

  useEffect(() => {
    homeIdRef.current = null;
    stateRef.current = null;
    if (userId) load();
  }, [userId, load]);

  // Runs one engine plan: update the screen immediately, then persist.
  const run = useCallback(
    (makePlan) => enqueue(async () => {
      const current = stateRef.current;
      if (!current) return false;

      let plan;
      try {
        plan = makePlan(current);
      } catch (err) {
        // Validation errors (e.g. temperature out of range) never reach the database.
        notify({ type: 'error', message: err.message });
        return false;
      }

      const nothingChanged =
        !Object.keys(plan.homePatch).length && !Object.keys(plan.devicePatches).length && !plan.rulePatch && !plan.logs.length;
      if (nothingChanged) return true;

      commitState(plan.nextState); // optimistic update
      try {
        const inserted = await applyPlan(homeIdRef.current, plan);
        // Newest first, matching the order used when loading from the database.
        setLogs((prev) => [...[...inserted].reverse(), ...prev].slice(0, LOG_LIMIT));
        return true;
      } catch (err) {
        const reason = /[.!?]$/.test(err.message) ? err.message : `${err.message}.`;
        notify({ type: 'error', message: `${reason} Reloading your home.` });
        await load();
        return false;
      }
    }),
    [enqueue, load, notify],
  );

  const actions = {
    setMode: (mode) => run((s) => engine.planModeChange(s, mode)),
    toggleLight: (id) => run((s) => engine.planLightToggle(s, id)),
    setBrightness: (id, value) => run((s) => engine.planBrightness(s, id, value)),
    setAllLights: (on) => run((s) => engine.planMasterLights(s, on)),
    toggleLock: (id) => run((s) => engine.planLockToggle(s, id)),
    lockAll: (locked) => run((s) => engine.planLockAll(s, locked)),
    setArmed: (armed) => run((s) => engine.planAlarmArm(s, armed)),
    simulateIntrusion: (location) => run((s) => engine.planIntrusion(s, location)),
    acknowledgeAlarm: () => run((s) => engine.planAcknowledgeAlarm(s)),
    setThermostat: (changes) => run((s) => engine.planThermostat(s, changes)),
    activateEmergency: (reason) => run((s) => engine.planEmergency(s, reason)),
    restoreNormal: (phrase) => run((s) => engine.planRestoreNormal(s, phrase, RESTORE_PHRASE)),
    toggleRule: (id) => run((s) => engine.planRuleToggle(s, id)),
    resetDemo: () => enqueue(async () => {
      try {
        homeIdRef.current = await resetDemoHome(); // the SQL function returns the home id
        return await load({ failureContext: 'Your home was reset, but refreshing it failed. ' });
      } catch (err) {
        notify({ type: 'error', message: err.message });
        return false;
      }
    }),
    reload: () => load(),
  };

  return { state, logs, status, loadError, saving: savingCount > 0, homeId: homeIdRef.current, actions };
}
