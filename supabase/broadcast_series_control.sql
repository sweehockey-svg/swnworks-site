-- Channel-scoped mobile edit: only change wins on the matching on-air series.
create or replace function broadcast_control.set_series_wins(
  p_channel text, p_expected jsonb, p_home integer, p_away integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  result jsonb;
  win_limit integer;
begin
  if auth.uid() is null or not coalesce(public.swn_studio_scene_access(p_channel), false) then
    raise exception 'Scene access required' using errcode = '42501';
  end if;

  win_limit := case coalesce(p_expected->>'seriesFormat', '5')
    when '3' then 2 when '5' then 3 when '7' then 4 end;
  if win_limit is null or coalesce(p_expected->>'ticket', '') = ''
    or coalesce(p_expected->>'home', '') = '' or coalesce(p_expected->>'away', '') = ''
    or p_home is null or p_away is null or p_home not between 0 and win_limit
    or p_away not between 0 and win_limit or (p_home = win_limit and p_away = win_limit) then
    raise exception 'Invalid series wins' using errcode = '22023';
  end if;

  update public.broadcast_studio_state
  set state = state || jsonb_build_object('seriesHome', p_home::text, 'seriesAway', p_away::text),
      updated_at = clock_timestamp()
  where channel = p_channel
    and (state->'publicNoMatch') is distinct from 'true'::jsonb
    and (state#>>'{transientSource,expires_at}')::timestamptz > clock_timestamp()
    and p_expected = jsonb_build_object(
      'leagueId', state->'leagueId', 'home', state->'home', 'away', state->'away',
      'matchName', state->'matchName', 'seriesFormat', state->'seriesFormat', 'seriesRound', state->'seriesRound',
      'seriesHome', state->'seriesHome', 'seriesAway', state->'seriesAway', 'ticket', state#>'{transientSource,ticket}'
    )
  returning state into result;
  if result is null then
    raise exception 'Series changed or match data has expired' using errcode = 'P0002';
  end if;
  return result;
end;
$function$;

revoke all on function broadcast_control.set_series_wins(text,jsonb,integer,integer) from public, anon, authenticated;
grant execute on function broadcast_control.set_series_wins(text,jsonb,integer,integer) to authenticated;

create or replace function public.broadcast_studio_set_series_wins(
  p_channel text, p_expected jsonb, p_home integer, p_away integer
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select broadcast_control.set_series_wins(p_channel,p_expected,p_home,p_away);
$function$;

revoke all on function public.broadcast_studio_set_series_wins(text,jsonb,integer,integer) from public, anon, authenticated;
grant execute on function public.broadcast_studio_set_series_wins(text,jsonb,integer,integer) to authenticated;
