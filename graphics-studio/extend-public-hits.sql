-- Append existing public sporting statistics only; preserve approved portraits,
-- existing columns, league filters, ownership and grants. No duplicate storage.
DO $hits$
DECLARE definition text; revised text;
BEGIN
  definition := pg_get_viewdef('public.v_broadcast_players_public'::regclass, true);
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='v_broadcast_players_public' AND column_name='regular_hits') THEN
    revised := replace(definition, 'p.playoff_blocked_shots' || chr(10),
      'p.playoff_blocked_shots, p.regular_hits, p.playoff_hits' || chr(10));
    revised := replace(revised, 'NULL::bigint AS playoff_blocked_shots' || chr(10),
      'NULL::bigint AS playoff_blocked_shots, NULL::bigint AS regular_hits, NULL::bigint AS playoff_hits' || chr(10));
    revised := replace(revised, 'b.playoff_blocked_shots' || chr(10),
      'b.playoff_blocked_shots, b.regular_hits, b.playoff_hits' || chr(10));
    IF revised=definition OR position('b.regular_hits' IN revised)=0 THEN
      RAISE EXCEPTION 'Expected Broadcast view anchors missing';
    END IF;
    EXECUTE 'CREATE OR REPLACE VIEW public.v_broadcast_players_public AS ' || revised;
  END IF;
END $hits$;
NOTIFY pgrst, 'reload schema';
