// Uppsala Hårdrocksarkiv – letter Å (stored as file suffix aa), checked 2026-10-24.
// Å was missing from Supabase; three original studio albums 2014, 2017, 2023 now registered with full 22-song catalog.
// Only complete verified album videos recovered. No falsely labelled 'most viewed track': they are kind=album.
// The homepage band fallback picks the first album, so list follows approx historical indexed view order (2023 > 2017 > 2014).
// app.js slugify('Å') => 'a'; this is intentionally the exact band slug for the one-character name.
// Other artists named Å and the 2026 Wormwood Å release are unrelated. Historical YouTube views, not current.
// Do not overwrite T–Z video links.
window.ARCHIVE_YOUTUBE = window.ARCHIVE_YOUTUBE || [];
window.ARCHIVE_YOUTUBE.push(...[
  {
    "band": "a",
    "release": "ac125a76-9355-4cd8-986e-b0473c89d833",
    "title": "Åtråvärld (hela albumet, 2023)",
    "id": "wJgxykMskQE",
    "views": 3800,
    "channel": "",
    "kind": "album",
    "checked": "2026-10-24",
    "sourceNote": "Uploader describes original Uppsala trio Å 2023 full six-track progressive/psychedelic album with Bandcamp sequence starting Fredmans epistel 9 and Gånglåt i femtakt. Approximately 3.8K historical indexed views from YouTube Albums collection, not real-time. Channel not independently confirmed."
  },
  {
    "band": "a",
    "release": "d2fd6116-5952-4b2b-ae20-79dbe6ed1157",
    "title": "Ånyo (hela albumet, 2017)",
    "id": "bJpAQ33FyH0",
    "views": 2900,
    "channel": "",
    "kind": "album",
    "checked": "2026-10-24",
    "sourceNote": "YouTube full original 2017 Ånyo, exact five tracks En orm, Satan på gatan, Uti vår hage, Följer du med mig?, Rustem; source description links correct band original Spotify profile. About 2.9K historical indexed views, not live."
  },
  {
    "band": "a",
    "release": "c2dfd003-e175-4aaa-b9a5-a46f30cdae9f",
    "title": "Å (hela albumet, 2014)",
    "id": "GH93ECg3lC0",
    "views": 1800,
    "channel": "",
    "kind": "album",
    "checked": "2026-10-24",
    "sourceNote": "Video explicitly titled Å – Å Full Album 2014, Swedish experimental psychedelic progressive rock; band 2014 original eleven-track debut. Approximately 1.8K historical indexed views from album collection. Distinct from unrelated Swedish metal band Wormwood's later album Å."
  }
]);
