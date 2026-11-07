-- Uppsala Hårdrocksarkiv: structured venue and guest-act details for concert rows
-- Applied to the production database on 2026-11-07.
-- Safe to rerun: existing venue IDs, data and guest lists are preserved.
-- Unlike event_bands, other_acts stores names of other performers without
-- creating unrelated external band profiles in this Uppsala-focused archive.
-- Source support is retained in the original events' notes / claims / sources.

begin;
alter table public.events
  add column if not exists other_acts text[] not null default '{}'::text[];

do $$
declare
  rec record;
  venue_uuid uuid;
begin
  for rec in select * from (values
    ('cb77b765-7148-4b55-a34f-450e33f71277'::uuid, 'Odinslund'::text, 'Uppsala'::text),
    ('569c47ec-60fa-4a4e-985c-ce169ec91397'::uuid, 'S:t Eriks torg'::text, 'Uppsala'::text),
    ('b768d6ef-8e24-4c3c-a245-d0b8c8213da5'::uuid, 'Göta Källare'::text, 'Stockholm'::text),
    ('933f1845-d69c-4019-9512-f3ef7f8fc02e'::uuid, 'Tantogården'::text, 'Stockholm'::text),
    ('5ebd633e-18c9-46c8-a3a8-c65a2c65de0b'::uuid, 'Tantogården'::text, 'Stockholm'::text)
  ) as v(event_uuid,venue_name,venue_city)
  loop
    select id into venue_uuid
    from public.venues
    where lower(trim(name)) = lower(trim(rec.venue_name))
      and lower(trim(city)) = lower(trim(rec.venue_city))
    limit 1;

    if venue_uuid is null then
      insert into public.venues (name,city,country,description)
      values (rec.venue_name, rec.venue_city, 'Sweden',
        'Historiskt spelställe för befintlig dokumenterad konsert i arkivet.')
      returning id into venue_uuid;
    end if;

    update public.events
    set venue_id = venue_uuid, updated_at = now()
    where id = rec.event_uuid and venue_id is null;

    venue_uuid := null;
  end loop;
end $$;

-- Supporting information already recorded in the respective concert notes:
-- Hansa Band / Dave & The Mistakes: contemporary review (1981).
-- Stained Red / Nine: setlist.fm event, 2002.
-- Stained Red / Katatonia / PRIME Sth: setlist.fm event, 2004.
-- Stained Red / Slowlife / Subcyde / Calm: setlist.fm event, 2005.
-- The 2001 festival had a two-day lineup, so other acts are not assigned
-- to the exact date without separate supporting evidence.

update public.events
set other_acts = array['Dave & The Mistakes']::text[], updated_at = now()
where id = '562b5404-ad8e-423a-b348-7c3988b059ad'
  and other_acts = '{}'::text[];

update public.events
set other_acts = array['Nine']::text[], updated_at = now()
where id = '569c47ec-60fa-4a4e-985c-ce169ec91397'
  and other_acts = '{}'::text[];

update public.events
set other_acts = array['Katatonia','PRIME Sth']::text[], updated_at = now()
where id = 'b768d6ef-8e24-4c3c-a245-d0b8c8213da5'
  and other_acts = '{}'::text[];

update public.events
set other_acts = array['Slowlife','Subcyde','Calm']::text[], updated_at = now()
where id = '933f1845-d69c-4019-9512-f3ef7f8fc02e'
  and other_acts = '{}'::text[];

commit;
