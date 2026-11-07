-- Uppsala Hårdrocksarkiv: safely publish sourced, confirmed concerts by band.
-- Applied to Supabase project fqygdpzyqqguyaujdhjq on 2026-11-07.
-- The underlying events, event_bands, venues, claims and sources tables remain private.
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
        'description', e.description,
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
              and c.status = 'confirmed'
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
  left join public.venues v on v.id = e.venue_id
  where eb.band_id = p_band_id
    and e.event_type = 'concert'
    and exists (
      select 1
      from public.claim_entities ce
      join public.claims c on c.id = ce.claim_id
      join public.claim_sources cs on cs.claim_id = c.id
      join public.sources s on s.id = cs.source_id
      where ce.entity_type = 'event'
        and ce.entity_id = e.id
        and c.status = 'confirmed'
        and c.claim_type = 'live_performance'
        and s.url ~ '^https?://'
    );
$function$;
revoke execute on function public.get_public_band_concerts(uuid) from public, anon, authenticated;
grant execute on function public.get_public_band_concerts(uuid) to anon, authenticated;
comment on function public.get_public_band_concerts(uuid) is 'Public read-only concert evidence for one band. Only sourced confirmed live_performance claims are shown; no research notes or unpublished events.';
