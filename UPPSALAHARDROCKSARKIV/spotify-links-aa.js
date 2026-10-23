// Spotify Å: original Uppsala psychedelic rock trio, verified 2026-10-24.
// Separate additive supplement avoids rewriting the large A-Z release mapping.
// app.js slugify('Å') === 'a'; do not confuse artist with Wormwood's Å EP.
// Load AFTER spotify-links.js and BEFORE app.js.
window.ARCHIVE_SPOTIFY = window.ARCHIVE_SPOTIFY || { artists: {}, releases: {} };
window.ARCHIVE_SPOTIFY.artists = window.ARCHIVE_SPOTIFY.artists || {};
window.ARCHIVE_SPOTIFY.releases = window.ARCHIVE_SPOTIFY.releases || {};
window.ARCHIVE_SPOTIFY.artists["a"] = "6oxx7e9b265qJCMCdhHUl6";
Object.assign(window.ARCHIVE_SPOTIFY.releases, {
  "c2dfd003-e175-4aaa-b9a5-a46f30cdae9f": {
    id: "3q82xL6rDjR4RMZpZtDhKY",
    note: "Å:s originalalbum 2014 med elva låtar. Bekräftat genom bandets Bandcamp och Spotify; inte Wormwoods senare skiva med samma namn."
  },
  "d2fd6116-5952-4b2b-ae20-79dbe6ed1157": {
    id: "1EWIces986n3s7HllcrXzo",
    note: "Ånyo: originalalbum från Uppsala-bandet Å, fem spår, 30 september 2017. Roland Keijser och Tomas Eriksson medverkar."
  },
  "ac125a76-9355-4cd8-986e-b0473c89d833": {
    id: "2bK9dBUw2KtCqw0lmd7jKf",
    note: "Åtråvärld: Uppsala-trions sexspåriga originalalbum från 17 december 2023."
  }
});
