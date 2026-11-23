// Every read and write to Supabase for the smart home lives here.
// Components never call Supabase directly; they call the useSmartHome hook, which calls these.
//
// Each function either returns data or THROWS an Error. It never returns "success" for a
// write the database rejected. supabase-js reports problems in `error` instead of throwing,
// so `unwrap` turns that into a real exception.

import { supabase } from '../lib/supabaseClient.js';

function unwrap({ data, error }, what) {
  if (error) throw new Error(`${what} failed: ${error.message}`);
  return data;
}

// Calls the SQL function that returns this user's home id, creating the demo home on first login.
export async function ensureHome() {
  return unwrap(await supabase.rpc('create_demo_home'), 'Loading your home');
}

// Loads everything the dashboard needs in parallel (5 SELECT queries).
export async function fetchHomeData(homeId) {
  const [home, rooms, devices, rules, logs] = await Promise.all([
    supabase.from('homes').select('*').eq('id', homeId).single(),
    supabase.from('rooms').select('*').eq('home_id', homeId).order('sort_order'),
    supabase.from('devices').select('*').eq('home_id', homeId).order('type').order('name'),
    supabase.from('automation_rules').select('*').eq('home_id', homeId).order('sort_order'),
    supabase
      .from('activity_logs')
      .select('*')
      .eq('home_id', homeId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(30),
  ]);
  return {
    home: unwrap(home, 'Loading home settings'),
    rooms: unwrap(rooms, 'Loading rooms'),
    devices: unwrap(devices, 'Loading devices'),
    rules: unwrap(rules, 'Loading automation rules'),
    logs: unwrap(logs, 'Loading activity'),
  };
}

// The database commits the state changes and activity history together.
export async function applyPlan(homeId, { homePatch, devicePatches, rulePatch, logs }) {
  return unwrap(await supabase.rpc('apply_home_plan', {
    target_home: homeId,
    home_patch: homePatch,
    device_patches: devicePatches,
    rule_patch: rulePatch ?? null,
    entries: logs,
  }), 'Saving your home');
}

export async function resetDemoHome() {
  return unwrap(await supabase.rpc('reset_demo_home'), 'Resetting the demo');
}
