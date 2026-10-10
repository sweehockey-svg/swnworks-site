CREATE OR REPLACE FUNCTION public.seh_admin_publish_player_image_direct(p_player_key text, p_final_path text, p_public_url text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_admin uuid := auth.uid();
  v_role text;
  v_key text := pg_catalog.btrim(coalesce(p_player_key,''));
  v_path text := pg_catalog.btrim(coalesce(p_final_path,''));
  v_url text := pg_catalog.btrim(coalesce(p_public_url,''));
  v_name text;
  v_sg_id text;
  v_keys text[];
begin
  select w.role into v_role
  from public.seh_current_writer() w
  limit 1;

  if pg_catalog.lower(coalesce(v_role,'')) <> 'admin' then
    raise exception 'Adminbehörighet krävs.';
  end if;

  if v_key = '' then
    raise exception 'Välj en spelare.';
  end if;

  select x.display_gamertag
    into v_name
  from (
    select d.display_gamertag, 0 as source_priority, null::timestamptz as updated_at
    from public.app_account_player_directory_cache d
    where d.player_key = v_key

    union all

    select fp.display_gamertag, 1 as source_priority, fp.updated_at
    from public.ehockey_fantasy_player_pool fp
    join public.ehockey_fantasy_competitions fc
      on fc.id = fp.competition_id
     and fc.status in ('setup','open')
    where fp.player_key = v_key
    union all
    select b.display_gamertag, 2 as source_priority, null::timestamptz as updated_at
    from public.v_broadcast_players_public b
    where 'SG:' || b.sports_gamer_player_id::text = v_key
  ) x
  where nullif(pg_catalog.btrim(coalesce(x.display_gamertag,'')),'') is not null
  order by x.source_priority, x.updated_at desc nulls last
  limit 1;

  if v_name is null then
    raise exception 'Spelaren hittades inte i spelarregistret, en aktiv Fantasy-spelarpool eller en Broadcast-trupp.';
  end if;

  if v_path = '' or v_path not like 'published/%' then
    raise exception 'Ogiltig sökväg för spelarbild.';
  end if;

  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'player-profile-images'
      and o.name = v_path
  ) then
    raise exception 'Spelarbilden hittades inte i publik lagring.';
  end if;

  if v_url = ''
     or pg_catalog.strpos(v_url, '/storage/v1/object/public/player-profile-images/' || v_path) = 0 then
    raise exception 'Ogiltig publik bildadress.';
  end if;

  -- Resolve aliases through the registered SportsGamer URL, never GT alone.
  if v_key ~ '^SG:[0-9]+$' then
    v_sg_id := substring(v_key from 4);
  else
    select substring(d.sports_gamer_player_url from '/players/([0-9]+)(?:/|$|[?#])')
    into v_sg_id from public.app_account_player_directory_cache d where d.player_key=v_key;
  end if;
  select array_agg(distinct k) into v_keys from (
    select v_key as k
    union all select 'SG:'||v_sg_id where v_sg_id is not null
    union all select d.player_key from public.app_account_player_directory_cache d
    where v_sg_id is not null and substring(d.sports_gamer_player_url from '/players/([0-9]+)(?:/|$|[?#])')=v_sg_id
  ) aliases;
  insert into public.ehockey_player_self_profiles(
    player_key, image_url, approved_at, approved_by, updated_at
  )
  select k, v_url, pg_catalog.now(), v_admin, pg_catalog.now() from unnest(v_keys) as k
  on conflict (player_key) do update
  set image_url = excluded.image_url,
      approved_at = excluded.approved_at,
      approved_by = excluded.approved_by,
      updated_at = excluded.updated_at;

  update public.app_account_player_directory_cache set player_image=v_url where player_key=any(v_keys);
  update public.app_player_directory_cache set player_image=v_url where player_key=any(v_keys)
    or (v_sg_id is not null and substring(sports_gamer_player_url from '/players/([0-9]+)(?:/|$|[?#])')=v_sg_id);

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'player_key', v_key,
    'display_gamertag', v_name,
    'image_url', v_url
  );
end;
$function$
