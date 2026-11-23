-- Smart Home Gone Rogue 2.0 — Row Level Security and permissions
-- Run after 001_schema.sql.
--
-- Rules of thumb used here:
--   * The browser only ever holds the public anon key. Everything it can do is limited by
--     these policies, so nothing here trusts the frontend.
--   * Signed-out visitors (role "anon") get no access at all.
--   * Signed-in users (role "authenticated") can only touch rows of the home they own.
--   * Column grants limit UPDATE to the fields the UI legitimately changes
--     (e.g. you can dim a light, but you cannot move it into someone else's home).
--   * activity_logs is append-only: no UPDATE or DELETE policy exists, so history can't be rewritten.

alter table public.homes            enable row level security;
alter table public.rooms            enable row level security;
alter table public.devices          enable row level security;
alter table public.automation_rules enable row level security;
alter table public.activity_logs    enable row level security;

-- Start from nothing, then grant back only what is needed.
revoke all on public.homes, public.rooms, public.devices, public.automation_rules, public.activity_logs
  from anon, authenticated;

grant select on public.homes, public.rooms, public.devices, public.automation_rules, public.activity_logs
  to authenticated;

grant update (name, mode, alarm_armed, alarm_triggered, target_temp, hvac_mode,
              emergency_active, emergency_reason, emergency_activated_at)
  on public.homes to authenticated;
grant update (is_on, brightness, is_locked) on public.devices to authenticated;
grant update (enabled) on public.automation_rules to authenticated;
grant insert (home_id, event_type, description, simulated) on public.activity_logs to authenticated;

-- Child tables check ownership through home_id -> homes.user_id.
-- "(select auth.uid())" is evaluated once per query instead of once per row
-- (Supabase performance recommendation).

-- homes -------------------------------------------------------------------
drop policy if exists "own home: read"   on public.homes;
drop policy if exists "own home: update" on public.homes;
create policy "own home: read" on public.homes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own home: update" on public.homes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- rooms (read only; created by the seed function) ---------------------------
drop policy if exists "own rooms: read" on public.rooms;
create policy "own rooms: read" on public.rooms
  for select to authenticated
  using (home_id in (select id from public.homes where user_id = (select auth.uid())));

-- devices -------------------------------------------------------------------
drop policy if exists "own devices: read"   on public.devices;
drop policy if exists "own devices: update" on public.devices;
create policy "own devices: read" on public.devices
  for select to authenticated
  using (home_id in (select id from public.homes where user_id = (select auth.uid())));
create policy "own devices: update" on public.devices
  for update to authenticated
  using (home_id in (select id from public.homes where user_id = (select auth.uid())))
  with check (home_id in (select id from public.homes where user_id = (select auth.uid())));

-- automation rules (toggle enabled only) -------------------------------------
drop policy if exists "own rules: read"   on public.automation_rules;
drop policy if exists "own rules: update" on public.automation_rules;
create policy "own rules: read" on public.automation_rules
  for select to authenticated
  using (home_id in (select id from public.homes where user_id = (select auth.uid())));
create policy "own rules: update" on public.automation_rules
  for update to authenticated
  using (home_id in (select id from public.homes where user_id = (select auth.uid())))
  with check (home_id in (select id from public.homes where user_id = (select auth.uid())));

-- activity log (read + append only) -----------------------------------------
drop policy if exists "own activity: read"   on public.activity_logs;
drop policy if exists "own activity: insert" on public.activity_logs;
create policy "own activity: read" on public.activity_logs
  for select to authenticated
  using (home_id in (select id from public.homes where user_id = (select auth.uid())));
create policy "own activity: insert" on public.activity_logs
  for insert to authenticated
  with check (home_id in (select id from public.homes where user_id = (select auth.uid())));
