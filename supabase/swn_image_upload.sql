create table public.swn_image_links (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 100),
 token text not null unique check(token ~ '^[a-f0-9]{48}$'),
 upload_limit integer not null check(upload_limit between 1 and 500),
 preset_gts text[] not null default '{}',
 active boolean not null default true,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create table public.swn_image_submissions (
 id uuid primary key default gen_random_uuid(),
 link_id uuid not null references public.swn_image_links(id),
 submitted_gt text not null check(length(submitted_gt) between 2 and 80),
 player_key text,
 original_path text not null unique,
 original_filename text,
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
 size_bytes bigint not null check(size_bytes between 1 and 8388608),
 consent_version text not null,
 consent_text text not null,
 consent_at timestamptz not null default now(),
 status text not null default 'reserved' check(status in ('reserved','failed','pending','editing','published','rejected')),
 created_at timestamptz not null default now(),
 uploaded_at timestamptz,
 final_path text,
 published_url text,
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id)
);
create index swn_image_submissions_link_status on public.swn_image_submissions(link_id,status,created_at);
alter table public.swn_image_links enable row level security;
alter table public.swn_image_submissions enable row level security;
revoke all on public.swn_image_links,public.swn_image_submissions from public,anon,authenticated;
grant select on public.swn_image_links,public.swn_image_submissions to authenticated;
grant all on public.swn_image_links,public.swn_image_submissions to service_role;
create policy swn_image_links_owner_read on public.swn_image_links for select to authenticated using ((select public.swn_studio_admin_access()));
create policy swn_image_submissions_owner_read on public.swn_image_submissions for select to authenticated using ((select public.swn_studio_admin_access()));

create function public.swn_image_link_counts() returns table(link_id uuid,used bigint)
language sql stable security invoker set search_path='' as $$
 select l.id,count(s.id) from public.swn_image_links l left join public.swn_image_submissions s
 on s.link_id=l.id and (s.status not in ('reserved','failed') or (s.status='reserved' and s.created_at>now()-interval '10 minutes')) group by l.id;
$$;
create function public.swn_image_link_info(p_token text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare l public.swn_image_links%rowtype; used bigint;
begin
 select * into l from public.swn_image_links where token=p_token and active;
 if l.id is null then raise exception 'Länken är ogiltig eller stängd.'; end if;
 select c.used into used from public.swn_image_link_counts() c where c.link_id=l.id;
 return jsonb_build_object('name',l.name,'limit',l.upload_limit,'remaining',greatest(0,l.upload_limit-used),'presets',l.preset_gts);
end;
$$;
create function public.swn_image_player_search(p_query text) returns table(player_key text,display_gamertag text)
language sql stable security invoker set search_path='' as $$
 select distinct d.player_key,d.display_gamertag from (
  select a.player_key,a.display_gamertag from public.app_account_player_directory_cache a
  union select 'SG:'||b.sports_gamer_player_id::text,b.display_gamertag from public.v_broadcast_players_public b
  union select p.player_key,p.display_gamertag from public.ehockey_fantasy_player_pool p
 ) d where length(trim(p_query))>=2 and d.display_gamertag ilike '%'||replace(replace(replace(trim(p_query),'\','\\'),'%','\%'),'_','\_')||'%' escape '\'
 order by d.display_gamertag,d.player_key limit 50;
$$;
create function public.swn_image_reserve(p_token text,p_gt text,p_filename text,p_mime text,p_size bigint,p_extension text,p_consent_version text,p_consent_text text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare l public.swn_image_links%rowtype; used bigint; submission_id uuid:=gen_random_uuid(); path text; matched_key text;
begin
 select * into l from public.swn_image_links where token=p_token and active for update;
 if l.id is null then raise exception 'Länken är ogiltig eller stängd.'; end if;
 if p_gt is null or p_mime is null or p_size is null or p_extension is null or p_consent_version is null or p_consent_text is null or length(trim(p_gt)) not between 2 and 80 or p_mime not in ('image/jpeg','image/png','image/webp') or p_size not between 1 and 8388608 or p_extension not in ('jpg','png','webp') or p_consent_version<>'swn-portrait-2026-10-10-v1' or length(p_consent_text)<30 then raise exception 'Ogiltiga uppladdningsuppgifter.'; end if;
 update public.swn_image_submissions set status='failed' where link_id=l.id and status='reserved' and created_at<=now()-interval '10 minutes';
 select count(*) into used from public.swn_image_submissions where link_id=l.id and status<>'failed';
 if used>=l.upload_limit then raise exception 'Länkens uppladdningsgräns är nådd.'; end if;
 select case when count(distinct p.player_key)=1 then min(p.player_key) end into matched_key from public.swn_image_player_search(p_gt) p where lower(trim(p.display_gamertag))=lower(trim(p_gt));
 path:='swn/'||l.id::text||'/'||submission_id::text||'.'||p_extension;
 insert into public.swn_image_submissions(id,link_id,submitted_gt,player_key,original_path,original_filename,mime_type,size_bytes,consent_version,consent_text)
 values(submission_id,l.id,trim(p_gt),matched_key,path,left(p_filename,255),p_mime,p_size,p_consent_version,p_consent_text);
 return jsonb_build_object('id',submission_id,'original_path',path);
end;
$$;
revoke all on function public.swn_image_link_counts(),public.swn_image_link_info(text),public.swn_image_player_search(text),public.swn_image_reserve(text,text,text,text,bigint,text,text,text) from public,anon,authenticated;
grant execute on function public.swn_image_link_counts(),public.swn_image_link_info(text),public.swn_image_player_search(text),public.swn_image_reserve(text,text,text,text,bigint,text,text,text) to service_role;

grant select on public.v_broadcast_players_public,public.app_account_player_directory_cache,public.ehockey_fantasy_player_pool to service_role;
