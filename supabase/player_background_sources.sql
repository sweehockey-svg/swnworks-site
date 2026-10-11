create table public.player_background_sources (
id uuid primary key default gen_random_uuid(),
player_id uuid not null references public.players(id) on delete cascade,
headline text not null check(length(headline) between 1 and 200),
details text not null check(length(details) between 1 and 2000),
source_label text not null check(length(source_label) between 1 and 200),
source_url text not null check(source_url ~ '^https://www[.]hockeyettan[.]se/' and length(source_url)<=2000),
published_on date,
checked_at timestamptz not null default now(),
unique(player_id,source_url));
create index player_background_sources_player on public.player_background_sources(player_id);
alter table public.player_background_sources enable row level security;
revoke all on public.player_background_sources from anon, authenticated;
grant select on public.player_background_sources to authenticated;
grant all on public.player_background_sources to service_role;
create policy active_commentator_read_background on public.player_background_sources for select to authenticated using(
exists(select 1 from public.commentator_access ca where ca.active and lower(ca.email)=lower(coalesce((select auth.jwt())->>'email',''))));
