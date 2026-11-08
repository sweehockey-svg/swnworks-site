-- Mobile score edits update only scores, or complete the current series game once.
create or replace function broadcast_control.set_match_result(
  p_channel text, p_expected jsonb, p_action text, p_home integer, p_away integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_state jsonb;
  patch jsonb;
  results jsonb;
  best_of integer;
  win_limit integer;
  home_wins integer;
  away_wins integer;
  game_index integer;
  is_final boolean;
begin
  if auth.uid() is null or not coalesce(public.swn_studio_scene_access(p_channel), false) then
    raise exception 'Scene access required' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('progress','final','next','reset')
    or p_home is null or p_home not between 0 and 99
    or p_away is null or p_away not between 0 and 99
    or coalesce(p_expected->>'ticket','') = ''
    or coalesce(p_expected->>'home','') = '' or coalesce(p_expected->>'away','') = ''
    or p_expected->>'home' = p_expected->>'away' then
    raise exception 'Invalid match result' using errcode = '22023';
  end if;

  select state into current_state
  from public.broadcast_studio_state
  where channel = p_channel
    and (state->'publicNoMatch') is distinct from 'true'::jsonb
    and (state#>>'{transientSource,expires_at}')::timestamptz > clock_timestamp()
    and p_expected = jsonb_build_object(
      'leagueId', state->'leagueId', 'home', state->'home', 'away', state->'away',
      'matchName', state->'matchName', 'seriesFormat', state->'seriesFormat', 'seriesRound', state->'seriesRound',
      'seriesHome', state->'seriesHome', 'seriesAway', state->'seriesAway', 'ticket', state#>'{transientSource,ticket}',
      'hs', state->'hs', 'as', state->'as', 'seriesResults', state->'seriesResults', 'seriesGameFinal', state->'seriesGameFinal'
    )
  for update;

  if current_state is null then
    raise exception 'Match or result changed' using errcode = 'P0002';
  end if;
  if p_action = 'reset' then
    if p_home <> 0 or p_away <> 0 then
      raise exception 'Series reset requires 0–0' using errcode = '22023';
    end if;
    update public.broadcast_studio_state
    set state = current_state || '{"seriesHome":"0","seriesAway":"0","seriesResults":[],"seriesGameFinal":null}'::jsonb,
        updated_at = clock_timestamp()
    where channel = p_channel returning state into current_state;
    return current_state;
  end if;
  is_final := coalesce(current_state->>'seriesGameFinal','') ~ '^[1-7]$';
  if (p_action = 'next') <> is_final then
    raise exception 'Match already final or next match not available' using errcode = '22023';
  end if;
  patch := jsonb_build_object('hs', p_home::text, 'as', p_away::text);

  if p_action <> 'progress' then
    best_of := case coalesce(current_state->>'seriesFormat','5') when '3' then 3 when '5' then 5 when '7' then 7 end;
    win_limit := (best_of + 1) / 2;
    home_wins := case when coalesce(current_state->>'seriesHome','0') ~ '^[0-4]$' then coalesce(current_state->>'seriesHome','0')::integer end;
    away_wins := case when coalesce(current_state->>'seriesAway','0') ~ '^[0-4]$' then coalesce(current_state->>'seriesAway','0')::integer end;
    if win_limit is null or home_wins is null or away_wins is null or home_wins >= win_limit or away_wins >= win_limit then
      raise exception 'Series completed or invalid' using errcode = '22023';
    end if;

    if p_action = 'next' then
      patch := jsonb_build_object('hs','0','as','0','seriesGameFinal',null);
    else
      if p_home = p_away then raise exception 'Final score cannot be tied' using errcode = '22023'; end if;
      game_index := home_wins + away_wins;
      results := case when jsonb_typeof(current_state->'seriesResults') = 'array' then current_state->'seriesResults' else '[]'::jsonb end;
      if btrim(coalesce(results->>game_index,'')) <> '' then
        raise exception 'Result already exists for this series game' using errcode = '22023';
      end if;
      while jsonb_array_length(results) <= game_index loop results := results || '[""]'::jsonb; end loop;
      results := jsonb_set(results,array[game_index::text],to_jsonb(p_home::text || '–' || p_away::text));
      patch := patch || jsonb_build_object(
        'seriesGameFinal',game_index+1,
        'seriesHome',(home_wins + case when p_home > p_away then 1 else 0 end)::text,
        'seriesAway',(away_wins + case when p_away > p_home then 1 else 0 end)::text,
        'seriesResults',results,'seriesShowResults',true
      );
    end if;
  end if;

  update public.broadcast_studio_state set state = current_state || patch, updated_at = clock_timestamp()
  where channel = p_channel returning state into current_state;
  return current_state;
end;
$function$;
revoke all on function broadcast_control.set_match_result(text,jsonb,text,integer,integer) from public, anon, authenticated;
grant execute on function broadcast_control.set_match_result(text,jsonb,text,integer,integer) to authenticated;

create or replace function public.broadcast_studio_set_match_result(p_channel text,p_expected jsonb,p_action text,p_home integer,p_away integer)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select broadcast_control.set_match_result(p_channel,p_expected,p_action,p_home,p_away);
$function$;
revoke all on function public.broadcast_studio_set_match_result(text,jsonb,text,integer,integer) from public, anon, authenticated;
grant execute on function public.broadcast_studio_set_match_result(text,jsonb,text,integer,integer) to authenticated;
