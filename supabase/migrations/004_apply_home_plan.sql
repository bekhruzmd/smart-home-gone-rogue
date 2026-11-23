create or replace function public.apply_home_plan(
  target_home uuid, home_patch jsonb, device_patches jsonb, rule_patch jsonb, entries jsonb
) returns setof public.activity_logs
language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  item record;
begin
  perform id from homes where id = target_home for update;
  if not found then raise exception 'Home unavailable'; end if;

  if home_patch <> '{}'::jsonb then
    update homes h set
      (mode, alarm_armed, alarm_triggered, target_temp, hvac_mode,
       emergency_active, emergency_reason, emergency_activated_at) =
      (select p.mode, p.alarm_armed, p.alarm_triggered, p.target_temp, p.hvac_mode,
              p.emergency_active, p.emergency_reason, p.emergency_activated_at
       from jsonb_populate_record(h, home_patch) p)
    where h.id = target_home;
  end if;
  for item in select * from jsonb_each(device_patches) loop
    update devices d set (is_on, brightness, is_locked) =
      (select p.is_on, p.brightness, p.is_locked from jsonb_populate_record(d, item.value) p)
    where d.id = item.key::uuid and d.home_id = target_home;
    if not found then raise exception 'Device unavailable'; end if;
  end loop;
  if rule_patch is not null then
    update automation_rules set enabled = (rule_patch->>'enabled')::boolean
    where id = (rule_patch->>'id')::uuid and home_id = target_home;
    if not found then raise exception 'Rule unavailable'; end if;
  end if;
  return query
    insert into activity_logs (home_id, event_type, description, simulated)
    select target_home, e.event_type, e.description, coalesce(e.simulated, false)
    from jsonb_to_recordset(entries) as e(event_type text, description text, simulated boolean)
    returning *;
end $$;

revoke all on function public.apply_home_plan(uuid,jsonb,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.apply_home_plan(uuid,jsonb,jsonb,jsonb,jsonb) to authenticated;
