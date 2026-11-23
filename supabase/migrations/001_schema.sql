-- Smart Home Gone Rogue 2.0 — schema
-- Run this first in the Supabase SQL editor (or with `supabase db push`).
--
-- Every row belongs to one "home", and every home belongs to one signed-in user
-- (homes.user_id -> auth.users.id). Row Level Security in 002_security.sql uses
-- that chain so a user can only ever see and change their own home.

create table if not exists public.homes (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references auth.users (id) on delete cascade,
  name                   text not null default 'My Home',
  -- Occupancy mode: home / away / night
  mode                   text not null default 'home' check (mode in ('home', 'away', 'night')),
  -- Security system
  alarm_armed            boolean not null default false,
  alarm_triggered        boolean not null default false,
  -- Thermostat (simulated, no hardware). Range matches the original assignment slider: 55–90 °F.
  target_temp            integer not null default 72 check (target_temp between 55 and 90),
  hvac_mode              text not null default 'auto' check (hvac_mode in ('heat', 'cool', 'auto', 'off')),
  -- Emergency override
  emergency_active       boolean not null default false,
  emergency_reason       text,
  emergency_activated_at timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists public.rooms (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid not null references public.homes (id) on delete cascade,
  name       text not null,
  slug       text not null,             -- stable key used by automation actions, e.g. 'bedroom'
  sort_order integer not null default 0,
  unique (home_id, slug)
);

-- One table for every simulated device. Columns that don't apply to a device type stay null.
create table if not exists public.devices (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid not null references public.homes (id) on delete cascade,
  room_id    uuid not null references public.rooms (id) on delete cascade,
  type       text not null check (type in ('light', 'lock')),
  name       text not null,
  is_on      boolean,                                          -- lights only
  brightness integer check (brightness between 0 and 100),     -- lights only
  is_locked  boolean,                                          -- locks only
  updated_at timestamptz not null default now(),
  constraint light_fields check (type <> 'light' or (is_on is not null and brightness is not null)),
  constraint lock_fields  check (type <> 'lock'  or is_locked is not null)
);

-- Rules are data: WHEN trigger_event [AND condition] THEN action.
-- What each action actually does lives in src/lib/automationEngine.js.
create table if not exists public.automation_rules (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references public.homes (id) on delete cascade,
  rule_key      text not null,
  name          text not null,
  description   text not null,
  trigger_event text not null check (trigger_event in ('mode_home', 'mode_away', 'mode_night', 'intrusion', 'alarm_armed')),
  condition     text check (condition in ('alarm_armed')),
  action        text not null check (action in ('all_lights_off', 'night_lighting', 'comfort_lighting',
                                                'trigger_alarm', 'all_lights_full', 'lock_all_doors')),
  enabled       boolean not null default true,
  sort_order    integer not null default 0,
  unique (home_id, rule_key)
);

create table if not exists public.activity_logs (
  id          bigint generated always as identity primary key,
  home_id     uuid not null references public.homes (id) on delete cascade,
  event_type  text not null check (event_type in ('lighting', 'security', 'climate', 'mode',
                                                  'automation', 'emergency', 'system')),
  description text not null check (char_length(description) between 1 and 300),
  simulated   boolean not null default false,  -- true for simulated security events
  created_at  timestamptz not null default now()
);

create index if not exists rooms_home_idx         on public.rooms (home_id);
create index if not exists devices_home_idx       on public.devices (home_id);
create index if not exists rules_home_idx         on public.automation_rules (home_id);
create index if not exists activity_home_time_idx on public.activity_logs (home_id, created_at desc);

-- Keep updated_at honest on every UPDATE.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists homes_touch on public.homes;
create trigger homes_touch before update on public.homes
  for each row execute function public.touch_updated_at();

drop trigger if exists devices_touch on public.devices;
create trigger devices_touch before update on public.devices
  for each row execute function public.touch_updated_at();
