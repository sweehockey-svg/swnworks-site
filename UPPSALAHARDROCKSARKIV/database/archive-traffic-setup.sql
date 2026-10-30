-- Aggregate-only archive traffic. No visitor IDs, IP addresses, raw referrers or event timestamps.
create table public.archive_traffic_counts (
  day date not null,
  metric text not null check (metric in ('entry','pageview')),
  page_path text not null check (length(page_path) between 1 and 180),
  source text not null check (source in ('direct','internal','google','bing','duckduckgo','facebook','instagram','youtube','reddit','other','-')),
  total bigint not null default 1 check (total > 0),
  primary key (day,metric,page_path,source)
);
comment on table public.archive_traffic_counts is 'Privata, aggregerade räknare. entry = ny dokumentöppning, inklusive omladdning. Inga unika personer eller identifierare mäts.';
alter table public.archive_traffic_counts enable row level security;
revoke all on public.archive_traffic_counts from public, anon, authenticated;
grant select,insert,update on public.archive_traffic_counts to service_role;

create function public.record_archive_traffic(p_path text,p_source text,p_entry boolean default false)
returns void
language plpgsql
security invoker
set search_path = ''
set statement_timeout = '3s'
as $$
declare
  traffic_day date := (now() at time zone 'Europe/Stockholm')::date;
begin
  if p_path is null or not (
    p_path in ('/','/band','/personer','/utgavor','/videor','/tidslinje','/natverket','/kallor','/kontakt','/om','/sok','/404')
    or p_path ~ '^/(band|person|utgava)/[a-z0-9][a-z0-9-]{0,159}$'
    or p_path ~ '^/videor/[A-Za-z0-9_-]{11}$'
  ) then raise exception 'Invalid archive route' using errcode='22023'; end if;
  if p_source is null or p_source not in ('direct','internal','google','bing','duckduckgo','facebook','instagram','youtube','reddit','other')
    then raise exception 'Invalid traffic source' using errcode='22023'; end if;
  insert into public.archive_traffic_counts as counts(day,metric,page_path,source,total)
    values(traffic_day,'pageview',p_path,'-',1)
    on conflict(day,metric,page_path,source) do update set total=counts.total+1;
  if coalesce(p_entry,false) then
    insert into public.archive_traffic_counts as counts(day,metric,page_path,source,total)
      values(traffic_day,'entry',p_path,p_source,1)
      on conflict(day,metric,page_path,source) do update set total=counts.total+1;
  end if;
end;
$$;
revoke all on function public.record_archive_traffic(text,text,boolean) from public, anon, authenticated;
grant execute on function public.record_archive_traffic(text,text,boolean) to service_role;

create view public.archive_traffic_daily with (security_invoker=true) as
  select day as datum,
    coalesce(sum(total) filter(where metric='entry'),0)::bigint as besok,
    coalesce(sum(total) filter(where metric='pageview'),0)::bigint as sidvisningar
  from public.archive_traffic_counts group by day order by day desc;

create view public.archive_traffic_weekly with (security_invoker=true) as
  select date_trunc('week',datum)::date as veckostart,
    sum(besok)::bigint as besok,sum(sidvisningar)::bigint as sidvisningar
  from public.archive_traffic_daily group by 1 order by 1 desc;

create view public.archive_traffic_monthly with (security_invoker=true) as
  select date_trunc('month',datum)::date as manad,
    sum(besok)::bigint as besok,sum(sidvisningar)::bigint as sidvisningar
  from public.archive_traffic_daily group by 1 order by 1 desc;

create view public.archive_traffic_overview with (security_invoker=true) as
  with today as (select (now() at time zone 'Europe/Stockholm')::date as day),
  periods as (
    select 'Idag'::text as period,day as fran,1 as sortering from today union all
    select 'Senaste 7 dagarna',day-6,2 from today union all
    select 'Senaste 30 dagarna',day-29,3 from today union all
    select 'Denna månad',date_trunc('month',day)::date,4 from today
  )
  select p.period,p.fran,
    coalesce(sum(d.besok),0)::bigint as besok,coalesce(sum(d.sidvisningar),0)::bigint as sidvisningar
  from periods p left join public.archive_traffic_daily d on d.datum>=p.fran
  group by p.period,p.fran,p.sortering order by p.sortering;

create view public.archive_traffic_pages with (security_invoker=true) as
  select page_path as sida,
    case when page_path like '/band/%' then 'Band'
      when page_path like '/person/%' then 'Person'
      when page_path like '/utgava/%' then 'Utgåva'
      when page_path like '/videor%' then 'Videor' else 'Övrigt' end as kategori,
    sum(total)::bigint as sidvisningar,
    sum(total) filter(where day >= (now() at time zone 'Europe/Stockholm')::date-29)::bigint as senaste_30_dagarna,
    'https://swnworks.se/UPPSALAHARDROCKSARKIV/#'||page_path as lank
  from public.archive_traffic_counts where metric='pageview'
  group by page_path order by sidvisningar desc,sida;

create view public.archive_traffic_sources with (security_invoker=true) as
  select case source when 'direct' then 'Direkt / okänd källa'
    when 'internal' then 'Från swnworks.se' when 'google' then 'Google'
    when 'bing' then 'Bing' when 'duckduckgo' then 'DuckDuckGo'
    when 'facebook' then 'Facebook' when 'instagram' then 'Instagram'
    when 'youtube' then 'YouTube' when 'reddit' then 'Reddit' else 'Övriga webbplatser' end as kalla,
    sum(total)::bigint as besok,
    coalesce(sum(total) filter(where day >= (now() at time zone 'Europe/Stockholm')::date-29),0)::bigint as senaste_30_dagarna
  from public.archive_traffic_counts where metric='entry'
  group by source order by besok desc,kalla;

revoke all on public.archive_traffic_daily,public.archive_traffic_weekly,public.archive_traffic_monthly,
  public.archive_traffic_overview,public.archive_traffic_pages,public.archive_traffic_sources from public,anon,authenticated;
grant select on public.archive_traffic_daily,public.archive_traffic_weekly,public.archive_traffic_monthly,
  public.archive_traffic_overview,public.archive_traffic_pages,public.archive_traffic_sources to service_role;

comment on view public.archive_traffic_overview is 'Privat översikt. Besök räknar öppningar inklusive omladdningar, inte unika personer. Tidszon Europe/Stockholm.';
comment on view public.archive_traffic_pages is 'Privata sidvisningar; sökord, formulärinnehåll och URL-parametrar sparas aldrig.';
