create schema if not exists graphics_private;
revoke all on schema graphics_private from public;
grant usage on schema graphics_private to authenticated;
create or replace function graphics_private.weekly_candidates(p_league bigint,p_sunday date)
returns jsonb language plpgsql stable security definer set search_path='' as $body$
declare result jsonb;
begin
 if auth.uid() is null or not public.swn_studio_admin_access() then raise exception 'Admin access required' using errcode='42501'; end if;
 if extract(dow from p_sunday)<>0 or p_sunday<date '2020-01-01' or p_sunday>current_date+7 then raise exception 'Select a Sunday'; end if;
 if p_league<>527 then return jsonb_build_object('supported',false,'message','Matchunderlag saknas för denna turnering'); end if;
 with matches as (
 select distinct on (source_match_id) source_match_id,team1_id,team2_id
 from public.ehockey_fantasy_matches
 where source_league_id=p_league
 and started_at>=p_sunday::timestamp at time zone 'Europe/Stockholm'
 and started_at<(p_sunday+5)::timestamp at time zone 'Europe/Stockholm'
 order by source_match_id,imported_at desc
 ), team_games as (
 select team_id,count(*) games from (select team1_id team_id from matches union all select team2_id from matches)t group by 1
 ), rows as (
 select distinct on(s.source_match_id,s.source_team_id,s.source_player_id)
 s.* from public.ehockey_fantasy_match_player_stats s join matches m using(source_match_id)
 where s.source_league_id=p_league order by s.source_match_id,s.source_team_id,s.source_player_id,s.imported_at desc
 ), stats as (
 select source_team_id,source_player_id,upper(played_position) position,count(distinct source_match_id) games,
 sum(goals) goals,sum(assists) assists,
 sum((raw_stats->'skater'->>'takeaways')::numeric+(raw_stats->'skater'->>'interceptions')::numeric+blocked_shots) defensive_actions,
 bool_and(raw_stats->'skater'->>'takeaways' is not null and raw_stats->'skater'->>'interceptions' is not null and blocked_shots is not null) dim_complete,
 sum(goalie_saves) saves,sum(goalie_goals_allowed) goals_allowed,
 bool_and(goalie_saves is not null and goalie_goals_allowed is not null) goalie_complete
 from rows where (skater_games>0 or goalie_games>0) group by 1,2,3
 ), qualified as (
 select s.*,t.games team_games from stats s join team_games t on t.team_id=s.source_team_id where s.games*2>=t.games and s.games>0
 )
 select jsonb_build_object('supported',true,'start',p_sunday,'end',p_sunday+4,
 'matches',(select count(*) from matches),
 'complete',not exists(select 1 from matches m cross join lateral(values(m.team1_id),(m.team2_id))t(team_id)
 where (select count(distinct r.source_player_id) from rows r where r.source_match_id=m.source_match_id and r.source_team_id=t.team_id and upper(r.played_position) in ('LW','C','RW','LD','RD','G'))<6),
 'candidates',coalesce((select jsonb_agg(to_jsonb(q)) from qualified q),'[]'::jsonb)) into result;
 return result;
end $body$;
revoke all on function graphics_private.weekly_candidates(bigint,date) from public,anon;
grant execute on function graphics_private.weekly_candidates(bigint,date) to authenticated;
create or replace function public.graphics_weekly_candidates(p_league bigint,p_sunday date)
returns jsonb language sql stable security invoker set search_path='' as $body$
 select graphics_private.weekly_candidates(p_league,p_sunday);
$body$;
revoke all on function public.graphics_weekly_candidates(bigint,date) from public,anon;
grant execute on function public.graphics_weekly_candidates(bigint,date) to authenticated;
notify pgrst,'reload schema';
