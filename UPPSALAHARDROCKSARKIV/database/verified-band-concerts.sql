-- Uppsala Hårdrocksarkiv: safely publish sourced, confirmed concerts by band.
-- Applied and updated in Supabase project fqygdpzyqqguyaujdhjq on 2026-11-07.
-- The underlying events, event_bands, venues, claims and sources tables remain private.
-- Structured other_acts (external guest performers) are combined with linked event_bands,
-- excluding the band whose profile is open. No inferred bands from free text.
create or replace function public.get_public_band_concerts(p_band_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'title', e.title,
        'event_date', e.event_date,
        'event_year', e.event_year,
        'date_precision', e.date_precision,
        'venue', v.name,
        'city', coalesce(e.city, v.city),
        'country', e.country,
        'other_bands', (
          select coalesce(jsonb_agg(guest.name order by guest.name), '[]'::jsonb)
          from (
            select distinct names.name
            from (
              select nullif(btrim(act), '') as name
              from unnest(e.other_acts) as act
              union all
              select other_band.canonical_name as name
              from public.event_bands other_event_band
              join public.bands other_band on other_band.id = other_event_band.band_id
              where other_event_band.event_id = e.id
                and other_event_band.band_id <> eb.band_id
            ) names
            where names.name is not null
              and lower(names.name) <> lower(main_band.canonical_name)
          ) guest
        ),
        'description', e.description,
        'verification_status', case when exists (
          select 1
          from public.claim_entities cce
          join public.claims cc on cc.id = cce.claim_id
          join public.claim_sources ccs on ccs.claim_id = cc.id
          join public.sources ss on ss.id = ccs.source_id
          where cce.entity_type = 'event'
            and cce.entity_id = e.id
            and cc.status = 'confirmed'
            and cc.claim_type = 'live_performance'
            and ss.url ~ '^https?://'
        ) then 'confirmed' else 'probable' end,
        'sources', (
          select coalesce(jsonb_agg(jsonb_build_object('title', evidence.title, 'url', evidence.url) order by evidence.title), '[]'::jsonb)
          from (
            select distinct s.title, s.url
            from public.claim_entities ce
            join public.claims c on c.id = ce.claim_id
            join public.claim_sources cs on cs.claim_id = c.id
            join public.sources s on s.id = cs.source_id
            where ce.entity_type = 'event'
              and ce.entity_id = e.id
              and c.status in ('confirmed', 'probable')
              and c.claim_type = 'live_performance'
              and s.url ~ '^https?://'
            order by s.title
            limit 5
          ) evidence
        )
      )
      order by e.event_date nulls last, e.event_year nulls last, e.title
    ), '[]'::jsonb
  )
  from public.event_bands eb
  join public.events e on e.id = eb.event_id
  join public.bands main_band on main_band.id = eb.band_id
  left join public.venues v on v.id = e.venue_id
  where eb.band_id = p_band_id
    and e.event_type in ('concert', 'festival', 'release_party')
    and exists (
      select 1
      from public.claim_entities ce
      join public.claims c on c.id = ce.claim_id
      join public.claim_sources cs on cs.claim_id = c.id
      join public.sources s on s.id = cs.source_id
      where ce.entity_type = 'event'
        and ce.entity_id = e.id
        and c.status in ('confirmed', 'probable')
        and c.claim_type = 'live_performance'
        and s.url ~ '^https?://'
    );
$function$;
revoke execute on function public.get_public_band_concerts(uuid) from public, anon, authenticated;
grant execute on function public.get_public_band_concerts(uuid) to anon, authenticated;
comment on function public.get_public_band_concerts(uuid) is 'Public read-only concert evidence for one band. Only sourced confirmed or probable live_performance claims are shown with verification_status; research notes stay private.';
