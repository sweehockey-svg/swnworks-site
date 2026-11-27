create table public.swehockey_player_history (
id uuid primary key default gen_random_uuid(),
player_id uuid not null references public.players(id) on delete cascade,
season text not null, club text not null, league text not null,
source_url text not null check(source_url ~ '^https://stats[.]swehockey[.]se/(Teams/Info/(TeamRoster|PlayersByTeam)|Game/Reports/OfficialLineup)/[0-9]+$' or source_url ~ '^https://www[.]westkelownawarriors[.]ca/stats/roster/[0-9]+/[0-9]+$'),
statistics jsonb check(statistics is null or jsonb_typeof(statistics)='object'),
checked_at timestamptz not null default now(),
unique(player_id,source_url,club));
create index swehockey_player_history_player on public.swehockey_player_history(player_id);
alter table public.swehockey_player_history enable row level security;
grant select on public.swehockey_player_history to authenticated;
create policy active_commentator_read_history on public.swehockey_player_history for select to authenticated using(
exists(select 1 from public.commentator_access ca where ca.active and lower(ca.email)=lower(coalesce((select auth.jwt())->>'email',''))));
