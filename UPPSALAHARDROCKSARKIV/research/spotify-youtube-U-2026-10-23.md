# Spotify och YouTube – Bokstav U (2026-10-23)

**Status: Färdiggenomgången för musiklänkning, inklusive dokumenterade obelagda utgåvor.**

**Projekt:** Uppsala Hårdrocksarkiv, Supabase `fqygdpzyqqguyaujdhjq`, GitHub `sweehockey-svg/swnworks-site` main, https://swnworks.se/UPPSALAHARDROCKSARKIV/ .

**Inventering:** Exakt **4 U-band** i Supabase `bands` (`Unangel`, `Undergång`, `Unpure`, `Usurpress`), sammanlagt **40 relaterade utgåveposter** i `release_bands`, inklusive flera pressningar av samma album.

**Resultat sparat 2026-10-23: 4 Spotify-artistprofiler, 22 verifierade arkivutgåva→Spotify-albumkopplingar (10 unika album/EP-id:n), 79 arkivutgåva→YouTube-videokopplingar (31 unika video-id:n).** Musikdata är skriven på GitHub `main`, inget ändrades i Supabase. Webbsidans källor i `index.html`: `youtube-links.js?v=2.65`, `youtube-links-t.js?v=2`, `youtube-links-u.js?v=1`, `spotify-links.js?v=2.68`, därefter `app.js`. Etikett: **WEBB V2.68**.

## Resultat per band

| Band | Registrerade utgåveposter | Spotify | YouTube | Omfattning |
| --- | ---: | ---: | ---: | --- |
| **Unangel** | 2 | 2 utgåvor, 2 unika Spotify-ID | 6 länkar, 6 unika video-ID | *Amongst Cowards*, *Drunk on Hate*, officiella musikvideor + liveklipp |
| **Undergång** | 14 | 4 utgåvor, 2 unika Spotify-ID | 11 länkar, 5 unika video-ID | *...and You Will Live in Terror*, *The Mother of Armageddon*, 2004 demo och original-label-klipp |
| **Unpure** | 1 | 1 utgåva, 1 unikt Spotify-ID | 5 länkar, 5 unika video-ID | *Prophecies Ablaze* från 2023, licensierade studioinspelningar + separat liveklipp |
| **Usurpress** | 23 | 15 utgåvor, 5 unika Spotify-ID | 57 länkar, 15 unika video-ID | Album 2011–2018 samt separata 2018-singlar via officiella Agonia-uppladdningar |

Videoobjekt kan återkomma för olika utgåve-ID:n om det är samma originalinspelning. Det är medvetet; identiskt `band|release|id` får däremot aldrig dupliceras.

## Unangel (Uppsala)

**Spotifyartist** https://open.spotify.com/artist/3mhPpUhBpSLd4DOtTzLZ9F

| Arkivets utgåva | Arkiv-UUID | Verifierad Spotify-album-ID | Spår | Anmärkning |
| --- | --- | --- | ---: | --- |
| Amongst Cowards (2011) | `6e7e1564-d1cb-4990-9fe9-6fef2e780fc3` | `6BRkWvjtLBw9VUPh4TeuAO` | 7 | Arkivet klassar som EP, Spotify som album; samma sjuspårsprogram |
| Drunk on Hate (2014) | `828fa0e8-d0c2-424b-9056-7e27b7dd131d` | `50UOn5Pb9pEkthGFZFh3qZ` | 6 | Marknadsförd som kommande EP 2013 av bandet; Spotify slututgåva daterad 2014 |

**Verifierade YouTube-videor:** [Sweet Little Sixteen](https://www.youtube.com/watch?v=VZNoybwM7yM) (2011 studio), [Hostiles and Machine](https://www.youtube.com/watch?v=7T-u6A5qrLs) (live 2011), [P.I.N.](https://www.youtube.com/watch?v=litXeWfdQ9M) (live), [Shard](https://www.youtube.com/watch?v=YvmapfdtNrU) (2013 officiell musikvideo för 2014-EP:n), [The Pain Grid](https://www.youtube.com/watch?v=5_g_hrMtE1Q) (officiell bandvideo), [Drunk on Hate – teaser](https://www.youtube.com/watch?v=aG29FiqjKic) (`kind:medley`, inte låt).

**Förhandsvisning:** `Shard`, cirka 2 400 visningar enligt äldre webbindextal (inte en liveuppdatering); `The Pain Grid` cirka 2 200. Kör algoritmen `kind:'track'` med högst uppmätt `views`.

Bandets egen historiska webbplats: https://unangelofficial.wordpress.com/

## Undergång (Uppsala punk/hardcore)

**Spotifyartist** https://open.spotify.com/artist/6nKjA6VxSkmKJ0lGIXRrl7

| Arkivets utgåva | Arkiv-UUID | Spotifyalbum-ID | Anmärkning |
| --- | --- | --- | --- |
| ...and You Will Live in Terror, 2009 7-tums-EP | `eb6467b6-a0c9-47b4-858d-963fb5c198b3` | `0RpMAIbrziOY7S0a2rnkIE` | Samma tio låtar, Spotify anger 2011 för digitalutgåvan |
| The Mother of Armageddon, digital 2011 | `477b2137-5be2-4964-96a1-c26e8413a5f6` | `6elvAg0AJ7GUq2XsC9j2x0` | Samma studioalbum; arkivets 2011 text anger 17 grupperade spår, Spotify separerar 23 låtar |
| The Mother of Armageddon, 2012 original LP | `6e9ebc9b-f038-4d72-8913-7e71c8e6483e` | `6elvAg0AJ7GUq2XsC9j2x0` | 23 originalspår i rätt ordning |
| The Mother of Armageddon, 2013 ny LP | `bcc6725a-f873-404a-b633-4e6bee0d6b75` | `6elvAg0AJ7GUq2XsC9j2x0` | 23 originalspår i rätt ordning, annan pressning |

**Viktig spårlisteskillnad:** Spotify har två digitala listningar för *Mother of Armageddon*. [The Mother of Armageddon 2011](https://open.spotify.com/album/6elvAg0AJ7GUq2XsC9j2x0) visar **23 separata spår** och matchar båda LP-utgåvorna och Metal Archives. [Mother of Armageddon 2012](https://open.spotify.com/album/0qcvabNplnFerGuI8LGjYk) har **21 spår** eftersom t.ex. `Pedophiliac Priest / De-Evolution` och `Skate/Die / D.J.M.T.A.` är hopslagna. Vi länkar 23-spårsversionen och antecknar att en alternativ 21-spårsström finns, men inte är exakt motsvarande spårindex.

**Youtube:** [Putting the ARM in ARMAGEDDON – hela 2004-demon](https://www.youtube.com/watch?v=ure5eoebyjo), [...and You Will Live in Terror – hela 2009-EP:n](https://www.youtube.com/watch?v=vl5q5Y1EbxU), [The Mother of Armageddon – hela studioalbumet](https://www.youtube.com/watch?v=6w5j58NQKj0), [Order of the Armageddon](https://www.youtube.com/watch?v=gxAukR2kk60) (Get This Right Records original LP-låt) och [D.J.M.T.A.](https://www.youtube.com/watch?v=gDPKToYbmC4) (officiell distribuerad ljuduppladdning).

Källor: [Metal Archives original LP/2013 nyutgåva](https://www.metal-archives.com/albums/Underg%C3%A5ng/The_Mother_of_Armageddon/421921); [Get This Right Records katalog via Deathwish](https://deathwishinc.com/collections/music/products/gtrr012v); [Spotifyoriginal 23](https://open.spotify.com/album/6elvAg0AJ7GUq2XsC9j2x0).

**Kvarstående luckor:** 2002 `Pönk`, 2004 `Armageddon Sessions`/`Klipp dig och skaffa dig ett jobb!`, fler äldre demo- och VA-samlingar, 2005 livebootleg, 2006 `Thrash! The Power of Undergång`, 2007 `Apocalypse... Now!`, samt 2022 `Soulseller` har inte säkra original-Spotifyalbum-ID:n. 2007 VA-video [Knävelborr CD-R #1](https://www.youtube.com/watch?v=DcNry2nhynY) innehåller två Undergång-låtar men också andra bands musik; den mappas **inte** felaktigt som full Undergång-EP.

## Unpure (Uppsala)

**Spotifyartist** https://open.spotify.com/artist/6N9kolI2PhxjRyV5F3IvNx

**Originalalbum:** `Prophecies Ablaze`, 2023, UUID `24446222-80a3-4018-9e2a-f9a12d9e1837`. Spotify https://open.spotify.com/album/7sRJoBXFmKoHFoF2MC6EFD, **åtta originalspår**. Invictus Productions originalversion och Spotify tracklist stämmer överens; exempelvis första `Megalithic Gateways` och sista `Endtime Dictator`.

YouTube-uppladdningar av rätt originalinspelning via The Orchard/Invictus Productions: [Megalithic Gateways](https://www.youtube.com/watch?v=HVd_4-TO87k), [Northern Sea Madness](https://www.youtube.com/watch?v=9iyUr7BjIbM), [His Wrath and the Red Soil](https://www.youtube.com/watch?v=5-9MgjBquBo) och [Prophecies Ablaze](https://www.youtube.com/watch?v=NJ9unnsR2-o). [The Witch of Upsala live 2024](https://www.youtube.com/watch?v=dzQR1nIPBfM) ligger som `kind:'live'`, tydligt skilt från studioalbumet.

Primärkälla: https://invictusproductions666.bandcamp.com/album/prophecies-ablaze

## Usurpress (Uppsala dödsmetall)

**Spotifyartist** https://open.spotify.com/artist/5yko5EHt0FxUSLyg7uU8VZ

Arkivet har 23 utgåveposter, inklusive skivformat, split-singlar, demos och promos. Originalalbum på Spotify:

| Inspelning | Spotifyalbum-ID | Arkiv-UUID:n | Skillnader |
| --- | --- | --- | --- |
| *In Permanent Twilight* (2011, Spotify 2012) | `4x6rbspMbjqkrk4i0kEouB` | `3aa40805-32b6-4b4d-94b5-23c5ecb43865`, `0be559ab-4fd6-4329-9a0f-a57e32d97a60` | Åtta spår, samma studioprogram |
| *Trenches of the Netherworld* (2012) | `7AZWqHugwWXc6A8dxDWMWk` | `8c1ff611-8197-4087-a528-a9b6690823fe` | Elva spår |
| *Ordained* (2014) | `31SF9STPZWWuYnj2em77VC` | `ddcfeb29-baa8-4e6c-a500-c79f73eadf8f`, `8d96e44e-2f5b-4752-8ab7-5993d2ecefda`, `440b769f-5005-42c0-bb45-655847d20f48`, `b7739eb2-9e3f-45b0-8306-7e591cd66280` | Tolv originalspår. En arkivpost 2016 anger bonusspår `The Insatiable Sky`, som saknas på tolvlåtars-Spotifyalbumet |
| *The Regal Tribe* (2016) | `7pOL4NoIpj9syhe3AvW4aw` | `3b3dcc95-7875-478b-b969-0a1d05aec6c9`, `f6b0db50-18e7-4ca9-9778-a8280b15d393`, `773e698a-3338-4ef1-9fed-67efade3e033`, `032b1e44-24fe-4446-bfd4-1508fae8608b` | Tio originalspår, fyra arkivformat |
| *Interregnum* (2018) | `79a8SgtojDuGtfRNlyi2Sy` | `e5b518ee-f1d7-4c4e-a53c-e4c82b06cae0`, `9b9f4a42-f9bc-4b2c-a26b-c82d0c69bf1c`, `f9df485a-ab7f-498d-b82d-d56882116d30`, `a13e543d-7111-413d-b2f2-765b2c3a44eb` | Sju originalspår, fyra arkivformat |

**Verifierad YouTube, original och officiellt skivbolag:** 

- *In Permanent Twilight*: [titelspåret, original audio](https://www.youtube.com/watch?v=PoJebcmsHkU) (Spotify-produktion licensierad av CDBaby).
- *Trenches of the Netherworld*: [hela albumet](https://www.youtube.com/watch?v=s-FYApYK1FM) (original 2012).
- *Ordained*: [Fan the Flames of Madness](https://www.youtube.com/watch?v=E2DFP_htnA8), [Storming the Mausoleum](https://www.youtube.com/watch?v=Y8-jE9Eas9I), [Fire in the Minds of Men](https://www.youtube.com/watch?v=ikv_XA-AJQs), [As the Monolith Comes Alive](https://www.youtube.com/watch?v=YhDz63IVWzM).
- *The Regal Tribe*: [officiell Agonia albumström](https://www.youtube.com/watch?v=SF03vIvNVDc) ca 8 200 visningar; [Across the Dying Plains](https://www.youtube.com/watch?v=2c_-n1FS0bU) ca 6 300; [The Mortal Tribes](https://www.youtube.com/watch?v=UGN4cDSwE2Y); [Throwing the Gift Away](https://www.youtube.com/watch?v=WS_uq6vz3Yk); [Beneath the Starless Skies](https://www.youtube.com/watch?v=9VkB6mTRBdo).
- *Interregnum*: [officiell Agonia full albumström](https://www.youtube.com/watch?v=aP2IHYvZ91o) ca 7 800; [Interregnum](https://www.youtube.com/watch?v=_k9voIU84Ck) ca 5 400; [In Books Without Pages](https://www.youtube.com/watch?v=Uq7eEG_F7bU) ca 9 600; [The Iron Gates Will Melt](https://www.youtube.com/watch?v=o3gpEJnymJU) ca 3 400.

De två sistnämnda låtarna har även registrerade **egna singelutgåvor från 2018** i arkivet (UUID `8166b166-48b1-4540-bd16-f928fd49ad40` respektive `279848c7-fe51-4265-948d-59eb84a5b315`). Deras respektive officiella YouTube-video är länkad till **både singelsidan och albumformaten**, utan dubblerade `release+id`-par. Unika Spotify-single-album-ID:n kunde inte bekräftas trots att Spotify listar singlarna, så albumversionens Spotify-ID har inte vilseledande använts som om det vore den separata singeln.

**Bandförhandsvisning:** `In Books Without Pages` (cirka 9 600 observerade visningar) är högst av bandets kända verifierade enskilda videor. Hela albumströmmar och medleys väljs inte som låt om riktig verifierad låt finns.

**Obelagda egna Spotify-utgåvor:** 2010 originaldemo, 2011 *Bombs of Hades / Usurpress* split, 2011 *Tales of Possessors*, 2012 *Usurpress / Pyramido*, 2013/2014 *Usurpress / Bent Sea*, och två 2018 förhandssinglar behöver specifika streamingutgåve-ID:n, inte felaktiga länkar till annat bands spår på samlingsskiva.

Kompletterande översikt med namn, historiska katalogposter och bandkopplingar: https://strahmusic.com/artist/usurpress/ .

## Kvalitetskrav för arkivets låtförhandsvisning

1. Endast verifierade **11-teckens YouTube-video-ID:n** är sparade.
2. Albumsektionerna har samma inspelning på flera olika originalpressnings-/digitalutgåve-UUID:n, men **inget dubblettpar av `band|release|video-id`**.
3. `kind:'track'` med **högst sparade verifierade visningar** prioriteras. Visningar i `views` är daterade sökobservationer, **inte liveuppdaterad statistik**. När siffra inte gått att styrka är `views:null`.
4. Hela album är `kind:'album'`, trailers `kind:'medley'`, liveinspelningar `kind:'live'`. Inga gamla liveklipp har getts ut som autentiska studiomastrar.
5. Originaltitlar och track listings jämfördes med Supabase `release_tracks`, Spotify embed-spårlistor, kända officiella labelklipp och bandens egna/katalogsidor.
6. Ingen Supabase-uppgift har ändrats under Spotify-/YouTube-länkningen.

## Publicering och nästa bokstav

- [U – YouTube, nyskapad källfil](https://github.com/sweehockey-svg/swnworks-site/blob/main/UPPSALAHARDROCKSARKIV/youtube-links-u.js)
- [Spotify för alla bokstäver](https://github.com/sweehockey-svg/swnworks-site/blob/main/UPPSALAHARDROCKSARKIV/spotify-links.js)
- [Sidans scriptordning och cacheversion](https://github.com/sweehockey-svg/swnworks-site/blob/main/UPPSALAHARDROCKSARKIV/index.html)

**Bokstav U är genomgången för denna Spotify-/YouTube-kontroll. Nästa bokstav: V.**
