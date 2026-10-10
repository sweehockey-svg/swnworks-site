create table public.commentator_lineup_overrides (
owner_id uuid not null references auth.users(id) on delete cascade,
game_id uuid not null references public.games(id) on delete cascade,
team_id uuid not null references public.teams(id) on delete cascade,
players jsonb not null check(jsonb_typeof(players)='array' and jsonb_array_length(players)<=100),
updated_at timestamptz not null default now(),
primary key(owner_id,game_id,team_id));
alter table public.commentator_lineup_overrides enable row level security;
grant select,insert,update,delete on public.commentator_lineup_overrides to authenticated;
create policy owner_lineup_access on public.commentator_lineup_overrides for all to authenticated
using (owner_id=(select auth.uid()) and exists(select 1 from public.commentator_access ca where ca.active and lower(ca.email)=lower(coalesce((select auth.jwt())->>'email',''))))
with check (owner_id=(select auth.uid()) and exists(select 1 from public.commentator_access ca where ca.active and lower(ca.email)=lower(coalesce((select auth.jwt())->>'email',''))) and exists(select 1 from public.games g where g.id=game_id and team_id in(g.home_team_id,g.away_team_id)));
