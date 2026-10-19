# Mobile scene control

URL: `/broadcast-studio/mobile.html` (Swedish), optional `?lang=en`, `?lang=fi`, `?lang=de`. Link in each language studio toolbar. Channels match the OBS outputs exactly. Use this page on both operators' devices; it polls the current program scene every second. No broadcast state is restored from browser storage and no scene is changed on page load.

The page uses the shared login gate in **scene-controller mode**, calling `swn_studio_scene_access(channel)`, not the full-studio admin gate. A signed-out visitor sees the login; an unapproved account is denied. The `obs=1` bypass applies only to the existing language output paths, never to mobile.html. Existing full-studio access stays unchanged. Apply `supabase/broadcast_scene_control.sql` once before publishing the frontend. That SQL deliberately does not create any operator grants.

An administrator may grant a known authenticated user's UUID access to ONE channel using `public.broadcast_scene_access`. Do not share the admin password or grant a commentator full admin. Fläcken's account/email still needs to be identified/created before any grant is added. No account or permissions were assigned to him by this implementation.

The existing `broadcast_studio_set_scene` RPC is now an invoker wrapper around a narrowly scoped function in the non-exposed `broadcast_control` schema. The elevated function explicitly checks auth.uid(), active channel access and valid scene/side, then atomically updates only scene and (for lineup) lineupSide. No client table-update policy is added. Full broadcast-state updates remain admin-only. Two mobile controllers therefore cannot overwrite teams, scores, lineups, data tickets, microphone/audio, stream URL or design. The latest committed scene selection wins.

The full desktop director remains a match-preparation tool and may send full snapshots when its settings change. For shared scene-only control, both operators should use the mobile controller; do not edit desktop program settings concurrently without coordination. This release does not claim conflict-free simultaneous full-director editing.

The UI locks scene buttons while sending, disconnected, hidden, stale (10 seconds), idle/publicNoMatch, or without unexpired transient data. It shows the returned state only after a confirmed write. Poll responses started before a write are ignored. No match fetch is triggered by this controller. Prepare/fetch/take the match in the main studio first; existing Broadcast data validity remains 8 hours.

Tests use isolated local browser fixtures and transactional database changes rolled back before completion. Do not switch the real on-air scene just to test deployment.
