create or replace function public.swn_image_reserve(p_token text,p_gt text,p_filename text,p_mime text,p_size bigint,p_extension text,p_consent_version text,p_consent_text text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare l public.swn_image_links%rowtype; used bigint; submission_id uuid:=gen_random_uuid(); path text; matched_key text;
begin
 select * into l from public.swn_image_links where token=p_token and active for update;
 if l.id is null then raise exception 'This upload link is invalid or closed.'; end if;
 if p_gt is null or p_mime is null or p_size is null or p_extension is null or p_consent_version is null or p_consent_text is null or length(trim(p_gt)) not between 2 and 80 or p_mime not in ('image/jpeg','image/png','image/webp') or p_size not between 1 and 8388608 or p_extension not in ('jpg','png','webp') or p_consent_version<>'swn-portrait-2026-10-10-en-v2' or length(p_consent_text)<30 then raise exception 'Invalid upload details.'; end if;
 update public.swn_image_submissions set status='failed' where link_id=l.id and status='reserved' and created_at<=now()-interval '10 minutes';
 select count(*) into used from public.swn_image_submissions where link_id=l.id and status<>'failed';
 if used>=l.upload_limit then raise exception 'This link has reached its upload limit.'; end if;
 select case when count(distinct p.player_key)=1 then min(p.player_key) end into matched_key from public.swn_image_player_search(p_gt) p where lower(trim(p.display_gamertag))=lower(trim(p_gt));
 path:='swn/'||l.id::text||'/'||submission_id::text||'.'||p_extension;
 insert into public.swn_image_submissions(id,link_id,submitted_gt,player_key,original_path,original_filename,mime_type,size_bytes,consent_version,consent_text)
 values(submission_id,l.id,trim(p_gt),matched_key,path,left(p_filename,255),p_mime,p_size,p_consent_version,p_consent_text);
 return jsonb_build_object('id',submission_id,'original_path',path);
end;
$$;
