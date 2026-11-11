-- The Edge Function authenticates the operator and verifies roster membership
-- against the signed broadcast snapshot before calling this service-only RPC.
create or replace function broadcast_control.set_verified_lineups(p_channel text,p_expected jsonb,p_lineups jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare result jsonb;
begin
  if current_setting('role',true) is distinct from 'service_role' then
    raise exception 'Service role required' using errcode='42501';
  end if;
  update public.broadcast_studio_state
  set state=jsonb_set(state,'{lineups}',p_lineups,false),updated_at=clock_timestamp()
  where channel=p_channel and state->>'scene'='duallineup'
    and (state->'publicNoMatch') is distinct from 'true'::jsonb
    and (state#>>'{transientSource,expires_at}')::timestamptz > clock_timestamp()
    and state#>>'{transientSource,ticket}'=p_expected->>'ticket'
    and state->>'leagueId'=p_expected->>'leagueId'
    and state->>'home'=p_expected->>'home' and state->>'away'=p_expected->>'away'
    and state->>'matchName' is not distinct from p_expected->>'matchName'
    and state->>'teamOrderRevision' is not distinct from p_expected->>'teamOrderRevision'
    and state->'lineups'=p_expected->'baseLineups'
    and jsonb_typeof(p_lineups)='object' and p_lineups is distinct from state->'lineups'
  returning state into result;
  if result is null then raise exception 'Match, scene or lineup changed' using errcode='P0002'; end if;
  return result;
end;
$function$;

revoke all on function broadcast_control.set_verified_lineups(text,jsonb,jsonb) from public,anon,authenticated;
grant usage on schema broadcast_control to service_role;
grant execute on function broadcast_control.set_verified_lineups(text,jsonb,jsonb) to service_role;

create or replace function public.broadcast_studio_set_verified_lineups(p_channel text,p_expected jsonb,p_lineups jsonb)
returns jsonb language sql security invoker set search_path=''
as $function$
  select broadcast_control.set_verified_lineups(p_channel,p_expected,p_lineups);
$function$;
revoke all on function public.broadcast_studio_set_verified_lineups(text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.broadcast_studio_set_verified_lineups(text,jsonb,jsonb) to service_role;
