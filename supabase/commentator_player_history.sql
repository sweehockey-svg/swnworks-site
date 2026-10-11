create table public.commentator_player_history (
id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
player_id uuid not null references public.players(id) on delete cascade,
season text not null check(length(season) between 1 and 30),
club text not null check(length(club) between 1 and 120),
league text not null default '' check(length(league)<=120),
details text not null default '' check(length(details)<=1200),
source_url text not null check(source_url ~ '^https?://' and length(source_url)<=2000),
checked_on date not null default current_date,
updated_at timestamptz not null default now());
create index commentator_player_history_owner_player on public.commentator_player_history(owner_id,player_id);
alter table public.commentator_player_history enable row level security;
grant select,insert,update,delete on public.commentator_player_history to authenticated;
create policy owner_history_access on public.commentator_player_history for all to authenticated
using(owner_id=(select auth.uid()) and exists(select 1 from public.commentator_access ca where ca.active and lower(ca.email)=lower(coalesce((select auth.jwt())->>'email',''))))
with check(owner_id=(select auth.uid()) and exists(select 1 from public.commentator_access ca where ca.active and lower(ca.email)=lower(coalesce((select auth.jwt())->>'email',''))));
