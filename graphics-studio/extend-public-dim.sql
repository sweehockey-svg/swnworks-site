DO $dim$
DECLARE definition text;
BEGIN
  definition := pg_get_viewdef('public.v_broadcast_players_public'::regclass, true);
  IF definition NOT LIKE '%b.regular_takeaways%' THEN
    definition := replace(definition, 'p.playoff_penalty_minutes' || chr(10),
      'p.playoff_penalty_minutes, p.regular_takeaways, p.regular_interceptions, p.regular_blocked_shots, p.playoff_takeaways, p.playoff_interceptions, p.playoff_blocked_shots' || chr(10));
    definition := replace(definition, 'NULL::bigint AS playoff_penalty_minutes' || chr(10),
      'NULL::bigint AS playoff_penalty_minutes, NULL::bigint AS regular_takeaways, NULL::bigint AS regular_interceptions, NULL::bigint AS regular_blocked_shots, NULL::bigint AS playoff_takeaways, NULL::bigint AS playoff_interceptions, NULL::bigint AS playoff_blocked_shots' || chr(10));
    definition := replace(definition, 'b.playoff_penalty_minutes' || chr(10),
      'b.playoff_penalty_minutes, b.regular_takeaways, b.regular_interceptions, b.regular_blocked_shots, b.playoff_takeaways, b.playoff_interceptions, b.playoff_blocked_shots' || chr(10));
    EXECUTE 'CREATE OR REPLACE VIEW public.v_broadcast_players_public AS ' || definition;
  END IF;
END $dim$;
NOTIFY pgrst, 'reload schema';
