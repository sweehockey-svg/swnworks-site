-- Scoped scene operators may change ONLY scene/lineupSide through the RPC.
-- No new table-update policy: existing full-state writes remain admin-only.
begin;
create table if not exists public.broadcast_scene_access (
 user_id uuid not null references auth.users(id) on delete cascade,
 channel text not null check(channel in ('sec21-bronze-test','broadcast-en','broadcast-fi','broadcast-de')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 primary key(user_id,channel)
);
alter table public.broadcast_scene_access enable row level security;
revoke all on public.broadcast_scene_access from public,anon,authenticated;
grant select on public.broadcast_scene_access to authenticated;
grant all on public.broadcast_scene_access to service_role;
create policy "operators read their own scene grants" on public.broadcast_scene_access for select to authenticated using(user_id=(select auth.uid()));
create or replace function public.swn_studio_scene_access(p_channel text)
returns boolean language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and p_channel in ('sec21-bronze-test','broadcast-en','broadcast-fi','broadcast-de') and (
 public.swn_studio_admin_access() or exists(select 1 from public.broadcast_scene_access a where a.user_id=auth.uid() and a.channel=p_channel and a.active));
$$;
revoke all on function public.swn_studio_scene_access(text) from public,anon;
grant execute on function public.swn_studio_scene_access(text) to authenticated;

-- Dedicated non-exposed schema; elevated writer has an explicit auth/scope check.
create schema if not exists broadcast_control;
revoke all on schema broadcast_control from public,anon;
grant usage on schema broadcast_control to authenticated;
create or replace function broadcast_control.set_scene(p_channel text,p_scene text,p_lineup_side text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.swn_studio_scene_access(p_channel) then raise exception 'Scene access required' using errcode='42501'; end if;
 if p_scene is null or p_scene not in ('opening','live','matchup','series','lineup','stats','table','teamcompare','scorers','formguide','offense','defenseleaders','goalieleaders','road','leaders','intermission','lowerthird','forwards','defense','goalies','keymatchup','spotlight') then raise exception 'Invalid scene' using errcode='22023'; end if;
 if p_lineup_side is not null and p_lineup_side not in ('home','away') then raise exception 'Invalid lineup side' using errcode='22023'; end if;
 update public.broadcast_studio_state set state=jsonb_set(case when p_scene='lineup' then jsonb_set(state,'{lineupSide}',to_jsonb(coalesce(p_lineup_side,'home')),true) else state end,'{scene}',to_jsonb(p_scene),true),updated_at=clock_timestamp()
 where channel=p_channel and jsonb_typeof(state)='object' and state<>'{}'::jsonb returning state into result;
 if result is null then raise exception 'No prepared broadcast' using errcode='P0002'; end if;
 return result;
end $$;
revoke all on function broadcast_control.set_scene(text,text,text) from public,anon;
grant execute on function broadcast_control.set_scene(text,text,text) to authenticated;
create or replace function public.broadcast_studio_set_scene(p_channel text,p_scene text,p_lineup_side text default null)
returns jsonb language sql security invoker set search_path='' as $$
 select broadcast_control.set_scene(p_channel,p_scene,p_lineup_side);
$$;
revoke all on function public.broadcast_studio_set_scene(text,text,text) from public,anon;
grant execute on function public.broadcast_studio_set_scene(text,text,text) to authenticated;
commit;
