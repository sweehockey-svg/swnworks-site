# Remote commentary beta

Studio: https://swnworks.se/broadcast-studio/SV/

Viewer: https://www.svenskehockey.se/match-tv/

1. Put a match on air in the studio.
2. Under **Mikrofon till Match-TV**, create and privately share the commentator link.
3. The remote commentator opens the link, uses headphones, enables match sound and explicitly starts the microphone.
4. Viewers enable commentary separately from match sound. Voice volume and an optional 0–15 second voice delay are independent controls.
5. Stop in the studio to clear the announcement and end the invited session. Stop on the commentator page to stop its microphone and peer connections.

The invitation expires after six hours. Its fragment contains an ephemeral signing key for this audio session; it is not an account login. Only the public verification key and room identifier are included in broadcast state. Signalling offers and studio stop commands are signed. No microphone permissions are requested on page load.

Audio uses WebRTC/Opus with a 24 kbit/s target and one direct connection per listener, capped at 50. Supabase Realtime carries only signalling, and GitHub Pages serves static assets. No schema changes, audio storage or paid services were added. Some network combinations require TURN; no TURN relay is configured, so this is a network-dependent beta, not guaranteed support for 50 listeners.

Timing is manually adjustable, not automatically synchronized to Twitch. The commentator monitors the on-air feed, not the editor draft. Preparing another match does not change the audio session. This audio is currently delivered to Match-TV, not automatically mixed into the existing OBS output or local recording workflow.

Verification: Node VM exercises production program isolation, commentary metadata stop, real WebCrypto offer signatures/tamper rejection, and initial inactive viewer state. A synthetic tone was transmitted between separate Chromium tabs through real Supabase signalling; decoded audio peak was nonzero and mute reduced it to zero. No real microphone was captured. Real cross-network listening and 50-viewer load remain unverified.

Run `node test-commentary.cjs` for the automated checks. `node make-test.cjs` generates disposable local synthetic presenter/viewer harness pages; do not publish those generated pages, which contain test-only invitation keys.
