-- Preserve the existing admin-only aggregation and legacy weekly API.
do $migration$
declare definition text;
begin
 definition := pg_get_functiondef('graphics_private.weekly_candidates(bigint,date)'::regprocedure);
 if position('graphics_private.sports_matches' in definition)=0 then
  raise exception 'Shared SCL/FCL/WV match sources must be installed first';
 end if;
 definition := replace(definition,'weekly_candidates(p_league bigint, p_sunday date)','period_candidates(p_league bigint, p_start date, p_end date)');
 definition := replace(definition,
  'if extract(dow from p_sunday)<>0 or p_sunday<date ''2020-01-01'' or p_sunday>current_date+7 then raise exception ''Select a Sunday''; end if;',
  'if p_start is null or p_end is null or p_start<date ''2020-01-01'' or p_end<p_start or p_end>current_date+7 then raise exception ''Select valid start and end dates'' using errcode=''22023''; end if;');
 definition := replace(definition,'(p_sunday+5)','(p_end+1)');
 definition := replace(definition,'''end'',p_sunday+4','''end'',p_end');
 definition := replace(definition,'p_sunday','p_start');
 if position('period_candidates(p_league bigint, p_start date, p_end date)' in definition)=0 or position('p_end+1' in definition)=0 then
  raise exception 'Unexpected weekly function definition';
 end if;
 execute definition;
end $migration$;
revoke all on function graphics_private.period_candidates(bigint,date,date) from public,anon;
grant execute on function graphics_private.period_candidates(bigint,date,date) to authenticated;
create or replace function public.graphics_period_candidates(p_league bigint,p_start date,p_end date)
returns jsonb language sql stable security invoker set search_path='' as $body$
 select graphics_private.period_candidates(p_league,p_start,p_end);
$body$;
revoke all on function public.graphics_period_candidates(bigint,date,date) from public,anon;
grant execute on function public.graphics_period_candidates(bigint,date,date) to authenticated;
notify pgrst,'reload schema';
