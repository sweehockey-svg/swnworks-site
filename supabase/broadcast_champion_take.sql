-- Both studio and mobile writes pass here. Do not alter their access checks.
create or replace function broadcast_control.take_champion_on_clinch()
returns trigger language plpgsql security invoker set search_path = ''
as $function$
declare
  round_name text;
  win_limit integer;
  before_home integer;
  before_away integer;
  after_home integer;
  after_away integer;
  music jsonb;
begin
  if new.channel not in ('sec21-bronze-test','broadcast-en','broadcast-fi','broadcast-de')
     or new.channel is distinct from old.channel
     or jsonb_typeof(old.state) is distinct from 'object'
     or jsonb_typeof(new.state) is distinct from 'object'
     or old.state->>'publicNoMatch' = 'true' or new.state->>'publicNoMatch' = 'true'
     or new.state->>'scene' in ('idle','nextmatch')
     or new.state->>'leagueId' is distinct from old.state->>'leagueId'
     or new.state->>'matchName' is distinct from old.state->>'matchName'
     or new.state->>'home' is distinct from old.state->>'home'
     or new.state->>'away' is distinct from old.state->>'away'
     or coalesce(new.state->>'home','') !~ '^[1-9][0-9]*$'
     or coalesce(new.state->>'away','') !~ '^[1-9][0-9]*$'
     or new.state->>'home' = new.state->>'away'
     or coalesce(new.state->>'seriesFormat','5') <> coalesce(old.state->>'seriesFormat','5')
  then return new; end if;

  round_name := btrim(split_part(translate(upper(coalesce(new.state->>'seriesRound','')), '·:–—', '||||'), '|', 1));
  if round_name not in ('FINAL','FINALS','FINALEN','GRAND FINAL','GRAND FINALS','STORA FINALEN','MÄSTERSKAPSFINAL','FINALE','ENDSPIEL','FINAALI','FINAALIT','LOPPUOTTELU')
     or round_name <> btrim(split_part(translate(upper(coalesce(old.state->>'seriesRound','')), '·:–—', '||||'), '|', 1))
  then return new; end if;

  win_limit := case coalesce(new.state->>'seriesFormat','5') when '3' then 2 when '5' then 3 when '7' then 4 end;
  before_home := case when coalesce(old.state->>'seriesHome','0') ~ '^[0-4]$' then coalesce(old.state->>'seriesHome','0')::integer end;
  before_away := case when coalesce(old.state->>'seriesAway','0') ~ '^[0-4]$' then coalesce(old.state->>'seriesAway','0')::integer end;
  after_home := case when new.state->>'seriesHome' ~ '^[0-4]$' then (new.state->>'seriesHome')::integer end;
  after_away := case when new.state->>'seriesAway' ~ '^[0-4]$' then (new.state->>'seriesAway')::integer end;
  if win_limit is null or before_home is null or before_away is null or after_home is null or after_away is null
     or greatest(before_home,before_away) >= win_limit
     or greatest(after_home,after_away) <> win_limit or after_home = after_away
  then return new; end if;

  music := case when jsonb_typeof(new.state->'sceneMusic') = 'object' then new.state->'sceneMusic' else '{}'::jsonb end;
  new.state := new.state || jsonb_build_object('scene','series','sceneMusic',music || '{"series":"high","muted":false}'::jsonb);
  return new;
end;
$function$;
revoke all on function broadcast_control.take_champion_on_clinch() from public, anon, authenticated;

drop trigger if exists broadcast_take_champion_on_clinch on public.broadcast_studio_state;
create trigger broadcast_take_champion_on_clinch before update of state on public.broadcast_studio_state
for each row when (old.state is distinct from new.state) execute function broadcast_control.take_champion_on_clinch();
