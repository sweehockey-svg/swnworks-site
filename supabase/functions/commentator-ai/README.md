# Commentator AI

The deployed function uses manual Bearer-token validation through Supabase Auth and checks the authenticated user's existing team, league, or global administrator access. Keep the existing gateway setting `verify_jwt=false`; the function itself rejects missing or invalid sessions. The service-role key and OpenAI key stay in Edge Function secrets.

Deploy `index.ts` and `evidence.ts` together. No database migration is needed.

Normal requests return brief points with source snapshots selected from a server-built catalog. Model-provided references are restricted by the response schema and validated again on the server. Private notes are loaded only for the authenticated owner and remain explicitly editorial.

`action: "extract_report"` accepts a report of 40–12,000 characters and returns up to five proposed observations and preset tags. The server retains only proposals whose quoted evidence appears in the pasted report. Analysis never writes to `commentator_notes`. The browser saves a proposal only after the user reviews and submits it; source name and excerpt use the existing note body field. Existing note IDs and content are untouched.

Run from the repository root with Node 24:

```text
node tests/report-sources.test.cjs
node tests/editorial-tags.test.cjs
node tests/cockpit-reliability.test.cjs
```

The server integration tests mock Supabase and OpenAI, including authorization denial, league boundaries, rate limits, invalid references, and absence of note writes.
