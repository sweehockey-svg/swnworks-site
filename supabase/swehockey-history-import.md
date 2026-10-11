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

Run parser checks with `python -m unittest test_swehockey_history.py`.
