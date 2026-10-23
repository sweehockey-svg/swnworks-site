# Bokstav Å – Spotify/YouTube-kontroll 2026-10-24

**Uppsala Hårdrocksarkiv** · Supabase `fqygdpzyqqguyaujdhjq` · GitHub `sweehockey-svg/swnworks-site` · Webb V2.74.

## Resultat

Det fanns **0 band på Å** vid start. Ett källstyrkt nytt band **Å** från Uppsala hittades via [bandets egen presentation](https://swedishstream.wordpress.com/about/) och [Bandcamp](https://swedishstream.bandcamp.com/music). Å är en experimentell psykedelisk/progressiv rocktrio från Uppsala. Originalmedlemmarna **Joel Öhlund** (sång/gitarr/bas), **Milovan Fredriksson** (gitarr/bas/sång) och **Erik Wallin** (trummor) har registrerats som personer och bandmedlemmar; exakta bildnings-/medlemsår lämnades öppna.

**1 nytt band** UUID `dae09980-de69-425b-825f-ac8c188855e0`, **3 originalalbum**, **22 låtar med numrering och längd**, **3 Spotify-album**, **1 Spotify-artist** och **3 verifierade helalbumuppladdningar på YouTube**. Inte ett enda YouTube-klipp är felmärkt som en enskild låt.

Spotify-artist: https://open.spotify.com/artist/6oxx7e9b265qJCMCdhHUl6

## Album, UUID och originalkällor

| Originalalbum | Datum | Antal låtar | Supabase UUID | Spotify album-ID | YouTube fullalbum |
|---|---|---:|---|---|---|
| [Å](https://swedishstream.bandcamp.com/album/-) | 2014-05-03 | 11 | `c2dfd003-e175-4aaa-b9a5-a46f30cdae9f` | [3q82xL6rDjR4RMZpZtDhKY](https://open.spotify.com/album/3q82xL6rDjR4RMZpZtDhKY) | [GH93ECg3lC0](https://www.youtube.com/watch?v=GH93ECg3lC0) |
| [Ånyo](https://swedishstream.bandcamp.com/album/nyo) | 2017-09-30 | 5 | `d2fd6116-5952-4b2b-ae20-79dbe6ed1157` | [1EWIces986n3s7HllcrXzo](https://open.spotify.com/album/1EWIces986n3s7HllcrXzo) | [bJpAQ33FyH0](https://www.youtube.com/watch?v=bJpAQ33FyH0) |
| [Åtråvärld](https://swedishstream.bandcamp.com/album/tr-v-rld) | 2023-12-17 | 6 | `ac125a76-9355-4cd8-986e-b0473c89d833` | [2bK9dBUw2KtCqw0lmd7jKf](https://open.spotify.com/album/2bK9dBUw2KtCqw0lmd7jKf) | [wJgxykMskQE](https://www.youtube.com/watch?v=wJgxykMskQE) |

## Källor och utgåveskillnader

Å:s egen Bandcamp fastställer originaldatum och låtordning: *Å* 3 maj 2014 (11 spår), *Ånyo* 30 september 2017 (5 spår) och *Åtråvärld* 17 december 2023 (6 spår). Andra albumet spelades in i Silence studios med gästerna Roland Keijser och Tomas Eriksson; tredje albumet spelades in vid Bewarehouse i Enköping och Kryptonit i Uppsala och mixades av Kristofer Jönson. Bland gästmusikerna finns Roland Keijser och Fredrik Mattsson. Den nya databasen innehåller varje låts originaltitel, ordningsnummer, längd och en Bandcamp-källpost.

**Namnskydd:** Artisten heter bokstavligen Å. Webbplatsens `slugify('Å')` ger `a`, varför Spotify-nyckeln `artists.a` och YouTube-fältet `band:'a'` är korrekta för bandets profil. **Wormwoods EP Å från 2026**, andra artister med bokstavsnamn och senare återutgåvor är inte detta band.

**Video och förhandsvisning:** De tre video-ID:n ovan verifierades mot uppladdningarnas metadata och originalens år/titlar. De är **fullalbum** (`kind: 'album'`), inte enskilda låtar. Daterade sökindex visade ungefär 1 800 visningar för 2014, 2 900 för 2017 och 3 800 för 2023. Det är inte realtidstal. Åtråvärld ligger först som högst observerade fullalbum; om ett verifierat individuellt låtklipp hittas senare går det före albumklipp. Ingen gissad enskild låtvideo läggs in.

## Publicering och öppna forskningsluckor

- `youtube-links-aa.js`: tre verifierade YouTube-ID:n med exakta release-UUID:n, läggs till med `window.ARCHIVE_YOUTUBE.push` utan att radera tidigare A–Z.
- `spotify-links-aa.js`: artist-ID och tre albumkopplingar i egen supplementfil efter `spotify-links.js`, utan att skriva om hela tidigare Spotify-mappningen.
- `index.html`: **WEBB V2.74**, YouTube Å efter Z, Spotify Å efter ordinarie Spotify-fil, båda före `app.js`.
- Supabase är avläst efter inskrivning: **3 album, 22 spår, 3 personer**.
- Forskningsluckor: separata YouTube-låtvideor, säkra bildnings-/medlemsår och 2026-status, bandfoton, originalomslag och komplett källbelagd gästmusiker-credits på personsidor.
- GitHub Pages och de publika filerna kontrolleras efter publicering.

**Å: registrerat och musikgenomgånget. Nästa bokstav Ä.**
