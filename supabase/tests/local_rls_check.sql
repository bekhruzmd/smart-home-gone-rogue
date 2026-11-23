-- Row Level Security check, run against a plain LOCAL PostgreSQL:
--
--   createdb shgr_test
--   psql -d shgr_test -f supabase/tests/local_auth_stub.sql
--   for f in supabase/migrations/*.sql; do psql -d shgr_test -f "$f"; done
--   psql -d shgr_test -f supabase/tests/local_rls_check.sql
--
-- Lines marked "expect ..." must print exactly that error. Everything else prints results.
-- It signs in as two different users by setting request.jwt.claim.sub.

\set ON_ERROR_STOP 0
-- user 1 creates home
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select 'u1 home' t, public.create_demo_home() is not null ok;
select 'u1 same home on 2nd call' t, public.create_demo_home() = (select id from homes) ok;
select 'u1 counts' t, (select count(*) from rooms) rooms, (select count(*) from devices) devices, (select count(*) from automation_rules) rules, (select count(*) from activity_logs) logs;
update devices set brightness = 35, is_on = true where name='Living Room Lights';
select 'u1 brightness persisted' t, brightness from devices where name='Living Room Lights';
update devices set brightness = 150 where name='Living Room Lights';  -- expect check violation
update devices set type='lock' where name='Bedroom Lights';            -- expect permission denied (column grant)
insert into rooms(home_id,name,slug) select id,'Hack','hack' from homes; -- expect permission denied
delete from activity_logs;                                              -- expect permission denied
update homes set target_temp = 200;                                     -- expect check violation
select public.seed_home_contents((select id from homes));               -- expect permission denied
reset role;
-- user 2
set role authenticated; select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'u2 sees nothing before home' t, (select count(*) from homes) homes, (select count(*) from devices) devices;
select public.create_demo_home();
select 'u2 sees only own' t, (select count(*) from homes) homes, (select count(*) from devices) devices, (select count(*) from activity_logs) logs;
-- u2 tries to dim every light that is NOT in u2's home: RLS hides them, so 0 rows change.
update devices set brightness = 99 where home_id <> (select id from homes);
reset role;
select 'u1 light untouched by u2' t, brightness from devices d join homes h on h.id=d.home_id where h.user_id='11111111-1111-1111-1111-111111111111' and d.name='Living Room Lights';
-- cross-user insert attempt: u2 learns u1's home id and tries to write into u1's log
reset role; create temp table u1h as select id from homes where user_id='11111111-1111-1111-1111-111111111111'; grant select on u1h to authenticated;
set role authenticated; select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
insert into activity_logs(home_id,event_type,description) select id,'system','cross-user write' from u1h; -- expect RLS violation
-- reset demo keeps logs
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select public.reset_demo_home();
select 'u1 after reset' t, (select brightness from devices where name='Living Room Lights') b, (select target_temp from homes) temp, (select count(*) from activity_logs) logs, (select count(*) from devices) devices;
-- anon
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
select count(*) from homes; -- expect permission denied
select public.create_demo_home(); -- expect permission denied
