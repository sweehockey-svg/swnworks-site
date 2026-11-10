-- Match-scoped team order, team feed, and overlay controls.
create or replace function broadcast_control.set_team_order(
  p_channel text, p_expected jsonb, p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare result jsonb; overlay_key text;
  old_lineups jsonb; new_lineups jsonb; side text; slot text;
  old_ids text[]; new_ids text[];
  slots constant text[] := array['LW','C','RW','LD','RD','G'];
begin
  if auth.uid() is null or not coalesce(public.swn_studio_scene_access(p_channel), false) then
    raise exception 'Scene access required' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('swap','live','stream-home','stream-away','team-strip','commentators','present-player','reorder-lineups')
    or coalesce(p_expected->>'ticket','') = ''
    or coalesce(p_expected->>'home','') = '' or coalesce(p_expected->>'away','') = ''
    or p_expected->>'home' = p_expected->>'away' then
    raise exception 'Invalid team order' using errcode = '22023';
  end if;
  if p_action = 'reorder-lineups' then
    old_lineups := p_expected->'baseLineups';
    new_lineups := p_expected->'lineups';
    if jsonb_typeof(old_lineups) is distinct from 'object' or jsonb_typeof(new_lineups) is distinct from 'object' then
      raise exception 'Invalid lineups' using errcode = '22023';
    end if;
    if old_lineups-'home'-'away' <> '{}'::jsonb or new_lineups-'home'-'away' <> '{}'::jsonb then
      raise exception 'Invalid lineup side' using errcode = '22023';
    end if;
    foreach side in array array['home','away'] loop
      if jsonb_typeof(old_lineups->side) is distinct from 'object' or jsonb_typeof(new_lineups->side) is distinct from 'object' then
        raise exception 'Invalid lineup side' using errcode = '22023';
      end if;
      if (old_lineups->side)-slots <> '{}'::jsonb or (new_lineups->side)-slots <> '{}'::jsonb then
        raise exception 'Invalid lineup position' using errcode = '22023';
      end if;
      old_ids := array[]::text[];
      new_ids := array[]::text[];
      foreach slot in array slots loop
        if jsonb_typeof(old_lineups#>array[side,slot]) is distinct from 'string'
          or jsonb_typeof(new_lineups#>array[side,slot]) is distinct from 'string'
          or old_lineups#>>array[side,slot] !~ '^([1-9][0-9]{0,15})?$'
          or new_lineups#>>array[side,slot] !~ '^([1-9][0-9]{0,15})?$' then
          raise exception 'Invalid lineup position or player' using errcode = '22023';
        end if;
        old_ids := array_append(old_ids,old_lineups#>>array[side,slot]);
        new_ids := array_append(new_ids,new_lineups#>>array[side,slot]);
      end loop;
      if array(select x from unnest(old_ids) x order by x) <> array(select x from unnest(new_ids) x order by x) then
        raise exception 'Only players already assigned to this team can move' using errcode = '22023';
      end if;
    end loop;
    update public.broadcast_studio_state
    set state=jsonb_set(state,'{lineups}',new_lineups,false),updated_at=clock_timestamp()
    where channel=p_channel and state->>'scene'='duallineup'
      and (state->'publicNoMatch') is distinct from 'true'::jsonb
      and (state#>>'{transientSource,expires_at}')::timestamptz > clock_timestamp()
      and state#>>'{transientSource,ticket}'=p_expected->>'ticket'
      and state->>'leagueId' is not distinct from p_expected->>'leagueId'
      and state->>'home'=p_expected->>'home' and state->>'away'=p_expected->>'away'
      and state->>'matchName' is not distinct from p_expected->>'matchName'
      and state->>'teamOrderRevision' is not distinct from p_expected->>'teamOrderRevision'
      and state->'lineups'=old_lineups
    returning state into result;
    if result is null then raise exception 'Match, scene or lineup changed' using errcode = 'P0002'; end if;
    return result;
  end if;
  if p_action = 'present-player' and (
    coalesce(p_expected->>'playerId','') !~ '^[1-9][0-9]{0,15}$'
    or coalesce(p_expected->>'playerTeam','') not in (p_expected->>'home',p_expected->>'away')
  ) then
    raise exception 'Invalid player selection' using errcode = '22023';
  end if;
  overlay_key := case p_action when 'team-strip' then 'liveTeamStripShow' when 'commentators' then 'liveCommentatorsShow' end;

  update public.broadcast_studio_state
  set state = state
    || case when p_action = 'present-player' then jsonb_build_object(
      'scene','spotlight','presentedPlayer',jsonb_build_object('id',p_expected->>'playerId','team',p_expected->>'playerTeam')
    ) when p_action in ('stream-home','stream-away') then jsonb_build_object(
      'twitchChannel',state->'twitchTeamChannels'->(state->>substring(p_action from 8)),
      'liveTeamsReversed',p_action = 'stream-away'
    ) when overlay_key is not null then jsonb_build_object(overlay_key, not (case when overlay_key = 'liveTeamStripShow'
      then (state->overlay_key) is distinct from 'false'::jsonb else coalesce(state->overlay_key = 'true'::jsonb,false) end))
    else jsonb_build_object('liveTeamsReversed', (state->'liveTeamsReversed') is distinct from 'true'::jsonb) end
    || case when p_action = 'swap' then jsonb_build_object(
      'home',state->'away', 'away',state->'home',
      'hs',state->'as', 'as',state->'hs',
      'seriesHome',state->'seriesAway', 'seriesAway',state->'seriesHome',
      'lineupSide',case when state->>'lineupSide' = 'away' then 'home' else 'away' end,
      'lineups',jsonb_build_object('home',state#>'{lineups,away}','away',state#>'{lineups,home}'),
      'subline',regexp_replace(state->>'subline', '^(.+) vs (.+)$', '\2 vs \1', 'i'),
      'teamOrderRevision',clock_timestamp()::text
    ) else '{}'::jsonb end,
    updated_at = clock_timestamp()
  where channel = p_channel
    and (state->'publicNoMatch') is distinct from 'true'::jsonb
    and (state#>>'{transientSource,expires_at}')::timestamptz > clock_timestamp()
    and (p_action <> 'live' or state->>'scene' = 'live')
    and (p_action not in ('stream-home','stream-away') or (
      state->>'videoSource' = 'twitch'
      and state->'twitchTeamChannels'->>(state->>substring(p_action from 8)) ~ '^[a-z0-9_]{1,25}$'
      and state->'twitchTeamChannels'->>(state->>substring(p_action from 8)) is distinct from state->>'twitchChannel'
    ))
    and (case when p_action='present-player' then p_expected-'playerId'-'playerTeam' else p_expected end) = (jsonb_build_object(
      'leagueId',state->'leagueId','home',state->'home','away',state->'away',
      'matchName',state->'matchName','ticket',state#>'{transientSource,ticket}',
      'teamOrderRevision',state->'teamOrderRevision',
      'liveTeamsReversed',coalesce(state->'liveTeamsReversed' = 'true'::jsonb,false)
    ) || case when p_action in ('stream-home','stream-away') then jsonb_build_object(
      'twitchChannel',state->'twitchChannel','twitchTeamChannels',state->'twitchTeamChannels'
    ) when overlay_key is not null then jsonb_build_object('overlayVisible',case when overlay_key = 'liveTeamStripShow'
      then (state->overlay_key) is distinct from 'false'::jsonb else coalesce(state->overlay_key = 'true'::jsonb,false) end)
    else '{}'::jsonb end)
  returning state into result;

  if result is null then
    raise exception 'Match or order changed' using errcode = 'P0002';
  end if;
  return result;
end;
$function$;
revoke all on function broadcast_control.set_team_order(text,jsonb,text) from public, anon, authenticated;
grant execute on function broadcast_control.set_team_order(text,jsonb,text) to authenticated;

create or replace function public.broadcast_studio_set_team_order(p_channel text, p_expected jsonb, p_action text)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select broadcast_control.set_team_order(p_channel,p_expected,p_action);
$function$;
revoke all on function public.broadcast_studio_set_team_order(text,jsonb,text) from public, anon, authenticated;
grant execute on function public.broadcast_studio_set_team_order(text,jsonb,text) to authenticated;
