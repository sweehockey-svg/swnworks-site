# Swehockey roster history

`swehockey_player_history.sql` defines imported, read-only history for active
commentator accounts. Only the trusted importer writes records. Personal
additions remain in `commentator_player_history`.

Export `id`, `display_name`, `birth_date` from `players` to a local JSON array,
then run `python import_swehockey_history.py players.json --limit 100`.
Review the generated `history-import.sql` and its coverage JSON before applying
the SQL with an administrative database connection. Do not commit player
exports or generated SQL. Reimports upsert the same player/source/club record.

The importer reads public Swehockey roster pages, follows season and division
links, and limits requests per run. It requires a unique match of full name and
birth date. Names with extra annotations or uncertain identity are skipped.
The page budget means history is incomplete. The initial import is a snapshot,
not a scheduled background sync. Increase the limit for broader coverage.

These are registrations, not verified appearances, transfers, or loan dates.
The UI groups season and club while preserving individual source links.
No EliteProspects data is used.

Expanded imports use verified senior division seeds as well as junior archives.
Public HTML is cached with `--cache-dir`; `--cached-only` reparses every cached
page without network requests. Names inside roster annotations are excluded;
Unicode and hyphen/space variants are normalized, but birth dates and unique
identity matches remain mandatory. Empty archives are listed in the coverage
report rather than inferred as evidence that a player was absent.
Validate generated SQL with `validate_swehockey_history.py players.json
history-import.sql CACHE_DIRECTORY`. Its independent HTMLParser checks each
player's birth date and full name beneath the exact club heading. A TeamRoster
URL represents an entire competition and legitimately contains many clubs.

`player_background_sources.sql` adds source-linked club article summaries.
`player-background-reviewed.json` contains reviewed factual paraphrases.
Build their import with `build_player_background_import.py players.json`;
it validates player identity and the allowed source host before generating SQL.
Only active commentators can read this table; only trusted administrators can
write. Article periods are explicit and are not treated as current statistics.
The reviewed article collection and roster imports are snapshots, not scheduled
news crawlers. Keep provenance links and review any future additions.

Run parser checks with `python -m unittest test_swehockey_history.py`.

Verified snapshot, 2026-10-11: 34,631 source registrations for 3,029 players,
representing 16,919 player/club/season combinations from 819 roster sources.
Available records range from 2004/05 to 2026/27; this does not mean every
intervening season or every player is covered. The independent validator passed
every imported association. Empty/missing-season pages were skipped.
The background collection contains 20 reviewed summaries for 19 Väsby players.
