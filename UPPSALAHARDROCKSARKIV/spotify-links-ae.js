// Letter Ä Spotify verification audit 2026-10-24: no Uppsala-area qualifying Ä act in Supabase or verified off-database research.
// Zero verified artist profiles, zero release UUIDs, zero Spotify album IDs. Unrelated Änglagård originates in Stockholm, not Uppsala.
// Existing A–Å Spotify IDs are NOT modified; this audited empty supplement is loaded before app.js.
// IMPORTANT for future additions: current app.js slugify('Å') === slugify('Ä') === 'a'. Adding Ä using artists.a would overwrite Å's real Spotify artist. Fix the slugging identity first.
window.ARCHIVE_SPOTIFY = window.ARCHIVE_SPOTIFY || { artists: {}, releases: {} };
