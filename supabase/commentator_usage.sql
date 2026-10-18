-- Cockpit usage: server-only writes/reads. No note bodies, search text, IPs or tokens.
begin;
-- Only the two metadata projections needed for the report; never auth secrets.
grant usage on schema auth to service_role;
grant select(id,email,last_sign_in_at) on auth.users to service_role;
grant select(user_id,created_at) on auth.sessions to service_role;
grant select(owner_id,updated_at) on public.commentator_notes to service_role;
grant select(owner_id,updated_at) on public.commentator_lineup_overrides to service_role;
grant select(owner_id,updated_at) on public.commentator_player_history to service_role;
create table public.commentator_usage_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  event text not null check(event in ('page_open','view_open','player_open','active_minute')),
  league_key text not null check(league_key in ('selector','hockeyettan','hockeytvaan','suomi-sarja','legacy')),
  feature text not null check(feature in ('home','cockpit','match','lines','players','goalies','special','live','story','h2h','studio','notes','ai','account','overview','stats','history')),
  team_id uuid references public.teams(id) on delete set null,
  player_id uuid references public.players(id) on delete set null,
  visit_id uuid not null,
  created_at timestamptz not null default now()
);
create index commentator_usage_owner_time on public.commentator_usage_events(owner_id,created_at desc);
create index commentator_usage_time on public.commentator_usage_events(created_at desc);
alter table public.commentator_usage_events enable row level security;
create policy "deny client access to cockpit usage" on public.commentator_usage_events for all to anon,authenticated using(false) with check(false);
revoke all on public.commentator_usage_events from public,anon,authenticated;
grant select,insert,delete on public.commentator_usage_events to service_role;
grant usage,select on sequence public.commentator_usage_events_id_seq to service_role;

-- Invoker functions deliberately callable ONLY by the authenticated server function.
create or replace function public.commentator_record_usage(p_owner uuid,p_event text,p_league text,p_feature text,p_team uuid,p_player uuid,p_visit uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text,731));
  if (select count(*) from public.commentator_usage_events where owner_id=p_owner and created_at>now()-interval '1 minute')>=60 then return false; end if;
  if exists(select 1 from public.commentator_usage_events where owner_id=p_owner and visit_id=p_visit and event=p_event and feature=p_feature and league_key=p_league and team_id is not distinct from p_team and player_id is not distinct from p_player and created_at>now()-case when p_event='active_minute' then interval '55 seconds' else interval '3 seconds' end) then return false; end if;
  insert into public.commentator_usage_events(owner_id,event,league_key,feature,team_id,player_id,visit_id) values(p_owner,p_event,p_league,p_feature,p_team,p_player,p_visit);
  return true;
end $$;
revoke all on function public.commentator_record_usage(uuid,text,text,text,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.commentator_record_usage(uuid,text,text,text,uuid,uuid,uuid) to service_role;

drop function if exists public.commentator_usage_report(integer,uuid);
create or replace function public.commentator_usage_report(p_days integer default 30,p_user uuid default null,p_hide_admins boolean default true)
returns jsonb language sql stable security invoker set search_path='' as $$
with people as (
  select u.id as user_id,a.email,max(a.display_name) as display_name,bool_or(a.active) as active,bool_or(a.role='admin') as is_admin,u.last_sign_in_at,
    jsonb_agg(jsonb_build_object('league',a.league_key,'team',t.canonical_name,'active',a.active)) as access
  from public.commentator_access a left join auth.users u on lower(u.email)=lower(a.email)
  left join public.teams t on t.id=a.team_id group by u.id,a.email,u.last_sign_in_at
  having not coalesce(p_hide_admins,true) or not bool_or(a.role='admin')
), events as (
 select e.* from public.commentator_usage_events e where e.created_at>=now()-make_interval(days=>greatest(1,least(p_days,90)))
 and exists(select 1 from people p where p.user_id=e.owner_id)
), usage as (
 select owner_id,max(created_at) as last_seen,count(*) filter(where event='page_open') as page_opens,
 count(*) filter(where event='view_open') as view_opens,count(*) filter(where event='player_open') as player_opens,
 count(*) filter(where event='active_minute') as active_minutes from events group by owner_id
), timeline as (
 select e.id,e.owner_id,e.event,e.league_key,e.feature,e.created_at,t.canonical_name as team_name,p.display_name as player_name
 from events e left join public.teams t on t.id=e.team_id left join public.players p on p.id=e.player_id
 where p_user is null or e.owner_id=p_user order by e.created_at desc,e.id desc limit 500
), logins as (
 select s.user_id,s.created_at from auth.sessions s where s.created_at>=now()-make_interval(days=>greatest(1,least(p_days,90)))
 and exists(select 1 from people p where p.user_id=s.user_id) and (p_user is null or s.user_id=p_user)
 order by s.created_at desc limit 500
), saved as (
 select owner_id,'notes' as kind,count(*) as total,max(updated_at) as last_saved from public.commentator_notes group by owner_id
 union all select owner_id,'lineups',count(*),max(updated_at) from public.commentator_lineup_overrides group by owner_id
 union all select owner_id,'history',count(*),max(updated_at) from public.commentator_player_history group by owner_id
 union all select owner_id,'ai',count(*),max(created_at) from public.commentator_ai_requests group by owner_id
)
select jsonb_build_object(
 'generated_at',now(),'tracking_started_at',(select min(created_at) from public.commentator_usage_events),
 'users',(select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('usage',coalesce((select to_jsonb(x)-'owner_id' from usage x where x.owner_id=p.user_id),'{}'::jsonb),'saved',coalesce((select jsonb_agg(to_jsonb(s)-'owner_id') from saved s where s.owner_id=p.user_id),'[]'::jsonb)) order by p.display_name),'[]'::jsonb) from people p),
 'timeline',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from timeline t),
 'logins',(select coalesce(jsonb_agg(to_jsonb(l)),'[]'::jsonb) from logins l),
 'features',(select coalesce(jsonb_agg(to_jsonb(f)),'[]'::jsonb) from (select feature,event,count(*) as total from events where event in ('view_open','player_open') and (p_user is null or owner_id=p_user) group by feature,event order by count(*) desc) f),
 'timeline_total',(select count(*) from events where p_user is null or owner_id=p_user)
);
$$;
revoke all on function public.commentator_usage_report(integer,uuid,boolean) from public,anon,authenticated;
grant execute on function public.commentator_usage_report(integer,uuid,boolean) to service_role;
comment on table public.commentator_usage_events is 'Authenticated cockpit feature usage; no private content. Retention 90 days. Admin via commentator-usage only.';
select cron.schedule('commentator-usage-retention','25 3 * * *',$job$delete from public.commentator_usage_events where created_at < now()-interval '90 days'$job$);
commit;
