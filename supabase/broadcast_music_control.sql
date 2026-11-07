-- The mobile controller may only change music for the current on-air scene.
create or replace function broadcast_control.set_music(p_channel text, p_scene text, p_mode text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare result jsonb;
begin
  if auth.uid() is null or not coalesce(public.swn_studio_scene_access(p_channel), false) then
    raise exception 'Scene access required' using errcode = '42501';
  end if;
  if p_scene is null or p_scene not in (
    'opening','matchup','series','lineup','stats','table','teamcompare','scorers','formguide',
    'offense','defenseleaders','goalieleaders','road','leaders','intermission','lowerthird',
    'forwards','defense','goalies','keymatchup','spotlight'
  ) or p_mode is null or p_mode not in ('high','low','off') then
    raise exception 'Invalid music setting' using errcode = '22023';
  end if;

  update public.broadcast_studio_state
  set state = jsonb_set(
    state, '{sceneMusic}',
    (case when jsonb_typeof(state->'sceneMusic') = 'object' then state->'sceneMusic' else '{}'::jsonb end)
      || jsonb_build_object(p_scene, p_mode),
    true
  ), updated_at = clock_timestamp()
  where channel = p_channel
    and state->>'scene' = p_scene
    and (state->'publicNoMatch') is distinct from 'true'::jsonb
    and (state#>>'{transientSource,expires_at}')::timestamptz > clock_timestamp()
  returning state into result;

  if result is null then
    raise exception 'Scene no longer on air or match data has expired' using errcode = 'P0002';
  end if;
  return result;
end;
$function$;

revoke all on function broadcast_control.set_music(text,text,text) from public, anon, authenticated;
grant execute on function broadcast_control.set_music(text,text,text) to authenticated;

create or replace function public.broadcast_studio_set_music(p_channel text, p_scene text, p_mode text)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select broadcast_control.set_music(p_channel,p_scene,p_mode);
$function$;

revoke all on function public.broadcast_studio_set_music(text,text,text) from public, anon, authenticated;
grant execute on function public.broadcast_studio_set_music(text,text,text) to authenticated;
