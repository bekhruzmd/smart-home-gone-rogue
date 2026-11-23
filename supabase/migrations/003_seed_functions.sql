-- Smart Home Gone Rogue 2.0 — demo data (seed) functions
-- Run after 002_security.sql.
--
-- Demo data is per user: the first time someone signs in, the app calls
-- create_demo_home() and gets their own house with 4 rooms, 6 devices and 6 rules.
-- reset_demo_home() puts that house back into its "gone rogue" starting state
-- (the same problems the original assignment started with: dark house, unlocked
-- doors, 90 °F, alarm going off) while keeping the activity history.
--
-- These run as SECURITY DEFINER (with the table owner's rights) because users are not
-- allowed to INSERT rooms/devices/rules directly. They only ever act on the caller's
-- own home, identified by auth.uid(), so they can't be used to touch anyone else's data.

-- Internal helper: (re)creates rooms, devices and rules for one home.
create or replace function public.seed_home_contents(p_home_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_living   uuid;
  v_bedroom  uuid;
  v_kitchen  uuid;
  v_bathroom uuid;
begin
  insert into public.rooms (home_id, name, slug, sort_order) values (p_home_id, 'Living Room', 'living_room', 1) returning id into v_living;
  insert into public.rooms (home_id, name, slug, sort_order) values (p_home_id, 'Bedroom',     'bedroom',     2) returning id into v_bedroom;
  insert into public.rooms (home_id, name, slug, sort_order) values (p_home_id, 'Kitchen',     'kitchen',     3) returning id into v_kitchen;
  insert into public.rooms (home_id, name, slug, sort_order) values (p_home_id, 'Bathroom',    'bathroom',    4) returning id into v_bathroom;

  -- Rogue starting state: every light off, both doors unlocked.
  insert into public.devices (home_id, room_id, type, name, is_on, brightness, is_locked) values
    (p_home_id, v_living,   'light', 'Living Room Lights', false, 0, null),
    (p_home_id, v_bedroom,  'light', 'Bedroom Lights',     false, 0, null),
    (p_home_id, v_kitchen,  'light', 'Kitchen Lights',     false, 0, null),
    (p_home_id, v_bathroom, 'light', 'Bathroom Lights',    false, 0, null),
    (p_home_id, v_living,   'lock',  'Front Door',         null, null, false),
    (p_home_id, v_kitchen,  'lock',  'Back Door',          null, null, false);

  insert into public.automation_rules
    (home_id, rule_key, name, description, trigger_event, condition, action, sort_order) values
    (p_home_id, 'home_comfort_lights', 'Home Mode lighting',
       'When Home Mode activates, set the living room and kitchen to 75% and the bedroom and bathroom to 40%.',
       'mode_home', null, 'comfort_lighting', 1),
    (p_home_id, 'away_lights_off', 'Away Mode: lights off',
       'When Away Mode activates, turn off every light.',
       'mode_away', null, 'all_lights_off', 2),
    (p_home_id, 'night_dim_lights', 'Night Mode: dim lights',
       'When Night Mode activates, dim the bedroom to 20% and bathroom to 10%, and turn off the living room and kitchen.',
       'mode_night', null, 'night_lighting', 3),
    (p_home_id, 'armed_lock_doors', 'Lock doors when armed',
       'When the alarm is armed, lock every door.',
       'alarm_armed', null, 'lock_all_doors', 4),
    (p_home_id, 'intrusion_trigger_alarm', 'Intrusion: sound alarm',
       'When an intrusion is detected while the system is armed, trigger the alarm.',
       'intrusion', 'alarm_armed', 'trigger_alarm', 5),
    (p_home_id, 'intrusion_lights_on', 'Intrusion: floodlights',
       'When an intrusion is detected while the system is armed, turn every light on at 100%.',
       'intrusion', 'alarm_armed', 'all_lights_full', 6);
end $$;

-- Only the other two functions call the helper; signed-in users cannot call it directly.
revoke execute on function public.seed_home_contents(uuid) from public, anon, authenticated;

-- Returns the caller's home id, creating the demo home the first time.
create or replace function public.create_demo_home()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_home uuid;
begin
  if v_user is null then
    raise exception 'You must be signed in';
  end if;

  select id into v_home from public.homes where user_id = v_user;
  if v_home is not null then
    return v_home;
  end if;

  -- ON CONFLICT: if two calls race (e.g. two tabs), only one creates the home.
  insert into public.homes (user_id, name, mode, alarm_armed, alarm_triggered, target_temp, hvac_mode)
  values (v_user, 'My Smart Home', 'home', true, true, 90, 'auto')
  on conflict (user_id) do nothing
  returning id into v_home;

  if v_home is null then
    select id into v_home from public.homes where user_id = v_user;
    return v_home;
  end if;

  perform public.seed_home_contents(v_home);

  insert into public.activity_logs (home_id, event_type, description, simulated) values
    (v_home, 'system', 'Demo home created. Every device is simulated; no real hardware is connected.', false),
    (v_home, 'security', 'SIMULATED: the house has gone rogue. Doors unlocked, lights out, thermostat at 90°F, alarm sounding.', true);

  return v_home;
end $$;

-- Puts the caller's home back to the rogue starting state. Activity history is kept.
create or replace function public.reset_demo_home()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_home uuid;
begin
  if v_user is null then
    raise exception 'You must be signed in';
  end if;

  select id into v_home from public.homes where user_id = v_user;
  if v_home is null then
    return public.create_demo_home();
  end if;

  delete from public.devices          where home_id = v_home;
  delete from public.rooms            where home_id = v_home;
  delete from public.automation_rules where home_id = v_home;

  update public.homes set
    mode = 'home', alarm_armed = true, alarm_triggered = true,
    target_temp = 90, hvac_mode = 'auto',
    emergency_active = false, emergency_reason = null, emergency_activated_at = null
  where id = v_home;

  perform public.seed_home_contents(v_home);

  insert into public.activity_logs (home_id, event_type, description, simulated) values
    (v_home, 'system', 'Demo reset: the house is back in its "gone rogue" starting state.', true);

  return v_home;
end $$;

revoke execute on function public.create_demo_home() from public, anon;
revoke execute on function public.reset_demo_home()  from public, anon;
grant  execute on function public.create_demo_home() to authenticated;
grant  execute on function public.reset_demo_home()  to authenticated;
