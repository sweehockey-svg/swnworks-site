// Ö / Östra Aros, Uppsala Oi!/punk. Verified 2026-10-24 against band Spotify catalog, Apple, Bandcamp and physical pressings.
// Existing earlier A–Ä mappings stay intact; only five *digital-specific* Spotify release UUIDs mapped.
// Digital original editions: 2018 Upsala, 2019 S/T, 2019 one-track Blåsvarta Bröder, 2022 Stormvarning and 2026 Kollektiv reträtt.
// Do NOT apply these streaming IDs to original 2017/2019/2021 physical vinyl or Tiundaland LP.
// app.js slugify('Östra Aros') normalizes to 'ostra-aros'.
window.ARCHIVE_SPOTIFY = window.ARCHIVE_SPOTIFY || { artists: {}, releases: {} };
window.ARCHIVE_SPOTIFY.artists = window.ARCHIVE_SPOTIFY.artists || {};
window.ARCHIVE_SPOTIFY.releases = window.ARCHIVE_SPOTIFY.releases || {};
window.ARCHIVE_SPOTIFY.artists["ostra-aros"] = "5gq1glQTaal5hEnhuFzPN0";
Object.assign(window.ARCHIVE_SPOTIFY.releases, {
  "da901ea5-1140-40b7-9ea5-112b9527d4e6": { id: "4gP2NBzseRBhwzDDN1ujXt", note: "Upsala 7-track 2018 DIGITAL edition (Jan 17 2018, Switchlight). Original physical RPO 12-inch 2017 separately recorded; streaming 2018 Spotify must not be relabelled 2017 vinyl." },
  "a5ad25a4-7d70-4451-9b7f-42acacfb3188": { id: "5BZA6RUg3yibcsqcnuzmi6", note: "Blåsvarta Bröder DIGITAL one-song single 2019, 4:10. 2021 physical Kjell Hell 7-inch contains additional B-side Sirius är vårt gäng; this Spotify object is NOT the 2021 two-track vinyl edition." },
  "8ef0e3a9-78c4-4218-a113-f81280a770d1": { id: "3u5ACVPOYoBlvpmPlHgGtQ", note: "S/T original 12-song 2019 DIGITAL edition (Spotify July 12 / Bandcamp July 13). Separate original 2019 physical 300-copy 12-inch LP is retained and is not re-labelled with digital release ID." },
  "ba756a66-f1f4-4a70-adf6-06f5eb4e360f": { id: "3lta6KfWb8cLzBBwFBOLq0", note: "Stormvarning DIGITAL eleven-song release 25 Feb 2022 on PST Records; 2021 physical Stormvarning! 500-copy LP is a separate edition, total time discrepancy (29:20 physical vs 29:05 digital) unverified by track." },
  "16c4b7a3-edcf-48c0-ac01-f5289c82cc57": { id: "4kqtOl6rOw9aEzBeKIUI6a", note: "Kollektiv reträtt original one-track digital single released Apr 17 2026, PST Records, 3:55. Song appears on Tiundaland LP but its LP mastering and release date are not confirmed; no duplication." }
});
