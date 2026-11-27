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

### Refreshing new registrations

Cached pages expire after 24 hours. Use `--refresh` to force fresh source pages.
`--cached-only` remains an explicit offline snapshot rebuild and cannot be
combined with `--refresh`. Failed or unreadable fetches are reported without
replacing the previous snapshot. Existing database registrations are retained;
imports only upsert player/source/club records, including several clubs in one
season. Validate generated SQL and review coverage failures before applying it.

### Reviewed match-lineup supplements

History accepts official Swehockey lineup URLs as well as roster pages. A
reviewed lineup supplements a missing club/season; it establishes selection,
not ice time or a transfer date. Verify the exact team block, date, player name
and identity against the registry and an independent club source. The existing
player/source/club upsert keeps roster evidence and supports multiple clubs.
This does not automatically crawl every historical match.

Reviewed example: Viggo Nordström (2003-09-11), Nybro Vikings IF, 2025/26,
HockeyAllsvenskan, official lineup 1005710 (2025-10-04). Nybro's published loan
announcement corroborates identity and the loan to Hudiksvalls HC:
https://www.nybrovikings.com/article/8eeat7d-38k4d/view

Reviewed additions, 2026-11-27: Viggo Nordström / BIK Karlskoga / 2024/25,
OfficialLineup/882590 (2025-01-05); West Kelowna Warriors / BCHL / 2023/24,
https://www.westkelownawarriors.ca/stats/roster/19/55 (exact name and DOB).
The source constraint explicitly permits this official club roster host/path.
Foreign roster evidence is labelled separately in the UI. No statistics are
copied from Elite Prospects; broad historical source crawling is not automatic.

### Historical skater statistics

`import_swehockey_statistics.py PLAYERS_JSON HTML COMPETITION --phase regular|playoffs|qualification --output SQL` reads the complete PlayersByTeam page, using its column headings rather than fixed cell offsets. The explicit source season and competition heading must agree with the requested phase. Goalkeeper rows are skipped; zero-point skaters are retained. Generated SQL accepts only a unique registry-name match with an existing DOB-verified club/season history row and an unchanged registry birth date. Review skipped players rather than guessing identities.

Statistics live in the optional `statistics` JSONB column of `swehockey_player_history`. Sources remain separate by competition URL; the interface labels league and phase and never sums different competitions. A missing statistics row does not mean zero appearances. The existing active-commentator read policy and administrator-only writes remain in force.

2026-11-27: initial SHL import includes regular-season archives 2020/21–2025/26 and five available play-out archives. This is not complete career coverage and does not yet import goalkeeper statistics. Viggo Nordström / Luleå HF / SHL / 2022/23 verified at PlayersByTeam/13469: GP 1, G 0, A 0, TP 0, PIM 0, +/- 0. His SHL roster entry is absent; the existing DOB-verified Luleå junior registration establishes identity for the statistics supplement.

### Competition-wide Swedish history refresh

`refresh_swehockey_statistics.py PLAYERS_JSON --rosters ROSTER_CACHE [FRESH_CACHE] --output-dir OUTPUT --limit 1000` discovers Swedish senior/junior competition sources from previously reviewed roster archives. Reads local snapshots concurrently; network statistics fetches are sequential and spaced by 0.5 seconds, with a 20-second timeout and a 24-hour cache. Failures and missing metadata are recorded; no stale network fallback or database writes happen in this runner.

The matcher indexes all names and birth dates from those historical roster sources and independently validates their club/name/DOB associations using HTMLParser. A statistical name must map uniquely in the player registry and have exactly one historical DOB, matching the registry, with evidence in the same season. Generated SQL additionally requires that exact roster evidence and birth date still exist in the production registry/history. This permits a missing loan club without matching on a name alone. Name collisions and absent same-season evidence are skipped. Transfer asterisks are treated as annotations; no fuzzy name matching is performed.

Competition headings determine phase; generic league labels alone are insufficient. Competition-specific titles are retained, so junior stages and senior leagues stay separate. No cross-competition totals are inferred. Goalkeeper history uses GPI, save percentage, GAA, saves and goals against, separately from skater scoring. Sources without readable statistics remain in the coverage report; no rows are deleted.

Generated SQL/data exports/cached HTML are local review artifacts and must not be committed. This is an on-demand refresh, not a scheduled background service.

If a player appears as both a skater and a (possibly backup) goalkeeper in one source, statistics retain both entries under `kind: dual`. The interface renders separate scoring and goalkeeping tables. The bulk packer merges roles globally before splitting batches, and rejects contradictory figures within the same role rather than overwriting one arbitrarily.
