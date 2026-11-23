-- Run after local_auth_stub.sql and the migrations in a disposable database.
\set ON_ERROR_STOP on
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
do $$
declare
  home_id_to_test uuid := public.create_demo_home();
  light uuid;
  rule uuid;
  entry public.activity_logs;
begin
  select id into strict light from devices where home_id = home_id_to_test and type = 'light' limit 1;
  select id into strict rule from automation_rules where home_id = home_id_to_test limit 1;
  select * into strict entry from public.apply_home_plan(home_id_to_test, '{"target_temp":70}',
    jsonb_build_object(light, jsonb_build_object('brightness', 36)), jsonb_build_object('id', rule, 'enabled', false),
    '[{"event_type":"system","description":"Atomic save test"}]');
  if entry.home_id <> home_id_to_test or (select brightness from devices where id = light) <> 36
     or (select enabled from automation_rules where id = rule) then
    raise exception 'Successful action did not persist';
  end if;
  begin
    perform public.apply_home_plan(home_id_to_test, '{"target_temp":80}', '{}', null,
      '[{"event_type":"invalid","description":"Rollback test"}]');
    raise exception 'Invalid log unexpectedly accepted';
  exception when check_violation then null;
  end;
  if (select target_temp from homes where id = home_id_to_test) <> 70 then
    raise exception 'Failed action did not roll back';
  end if;
end $$;
rollback;
