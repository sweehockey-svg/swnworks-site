# Uppsala Hårdrocksarkiv: Spotify och YouTube – bokstav Y

**Granskning:** 24 oktober 2026 · **Databas:** Supabase `fqygdpzyqqguyaujdhjq` · **Kod:** `sweehockey-svg/swnworks-site`, `main` · **Webbversion:** V2.72.

## Sammanfattning och kritiskt nytt fynd

Den ursprungliga Supabase-frågan `canonical_name ILIKE 'Y%'` gav **0 band**. Extern förstahandskällkontroll identifierade **Yersinia, ett hardcore-/metalcore-band grundat i Uppsala 2008**, varför det inte skulle vara korrekt att avsluta Y som tom. Bandet har nu registrerats med sex utgåvor och 34 originalspår, samtliga med längder och originalutgivningsdatum belagda på **bandets egen Bandcamp**.

- **1 Y-band**: Yersinia (Supabase UUID `48483406-df56-4854-a61d-566b76f19456`).
- **6 arkivutgåvor**, 1 album och 5 EP, alla exakt matchade till samma originalband.
- **34 spår** med originalspårordning och durationssekunder i `release_tracks`.
- **6 Spotify-utgåva/UUID-kopplingar** (6 unika Spotify-album-ID:n), **1 Spotify-artistprofil**: [Yersinia](https://open.spotify.com/artist/203FoNMgybnorIBb8KAJoW).
- **13 YouTube-/UUID-kopplingar**, 13 unika videor, fördelade på alla sex utgåvor.
- **Ingen dubblett** av video-ID på samma UUID; samtliga UUID:n kontrollerade mot databasen.
- Registrerade källposter för **bandets sex officiella Bandcamp-utgåvor**.
- **A–X är bevarat.** X-filen med dokumenterade nollkopplingar laddas före Y; sedan `spotify-links.js?v=2.72` och `app.js`.

## Bandidentitet och kronologi

[High 5ive Music, publicerat 2021-12-22](https://www.mynewsdesk.com/se/high-5ive-music/pressreleases/hardcore-legender-aaterfoerenas-foer-en-exklusiv-spelning-i-sommar-3152695) bekräftar att Yersinia bildades i Uppsala **2008**, splittrades **2015**, men återförenades inför en spelning **2022**. [Concert Archives](https://www.concertarchives.org/bands/yersinia) visar även framträdanden 2025 (förbehåll: konserthistorik är sekundärkällor; bandets nuvarande framtidsplaner är inte säkerställda). Bandet framför texter på svenska. Musiker/credits belagda på Bandcamp omfattar sång/text **Mattis Erngren**, produktion **Daniel Bergstrand**, mastering **Peter In De Betou**, senare kompositionsbidrag **Pär Svensson** och produktion **Dennis Bertilsson**. Detta är release-credits, inte automatiskt medlemskapstider.

**Identitetsvarning:** skilj Uppsala Yersinia från tysk namne (black metal), polsk Yersinia (black/punk) och bakteriesläktet. Spotify-profilen `203FoNMgybnorIBb8KAJoW` har exakt Uppsala-bandets sex utgåvor och svenska spår.

## Fullständig Spotify-mappning och originalutgåvor

| Originalutgåva | Originaldatum | Spår | UUID | Spotify-utgåva |
|---|---|---:|---|---|
| [Yersinia](https://yersinia.bandcamp.com/album/yersinia) | 2008-12-01 | 4 | `41df07a9-e89a-41f1-b0d7-ac3ee60398fb` | [`4s8tEVHDGxfr7bXoYP6mKk`](https://open.spotify.com/album/4s8tEVHDGxfr7bXoYP6mKk) |
| [Lejonhjärta](https://yersinia.bandcamp.com/album/lejonhj-rta) | 2009-06-20 | 4 | `509f1336-78ee-4c5e-963b-3ba85788080f` | [`6PilngeJi3DhPDqdnOOjQh`](https://open.spotify.com/album/6PilngeJi3DhPDqdnOOjQh) |
| [Efter Oss Syndafloden](https://yersinia.bandcamp.com/album/efter-oss-syndafloden) | 2010-12-08 | 11 | `cb224081-b3c2-4a88-93d4-15e5f100eba4` | [`3vuQ4l2HvhT98pT4W7cugG`](https://open.spotify.com/album/3vuQ4l2HvhT98pT4W7cugG) |
| [Aldrig Mera Vinter](https://yersinia.bandcamp.com/album/aldrig-mera-vinter) | 2011-09-27 | 5 | `510d588e-6293-4725-a6d4-7807b64c85cb` | [`0L0mZiuPctXVVdExEYJXRO`](https://open.spotify.com/album/0L0mZiuPctXVVdExEYJXRO) |
| [Fraktaler](https://yersinia.bandcamp.com/album/fraktaler) | 2012-05-11 | 5 | `c927ab31-a263-4d85-a811-daa30cb102de` | [`0G1xA1Q1xdMzKCusVhCz5s`](https://open.spotify.com/album/0G1xA1Q1xdMzKCusVhCz5s) |
| [Påfågeltronen](https://yersinia.bandcamp.com/album/p-f-geltronen) | 2015-04-20 | 5 | `d0f5445c-a50a-40f4-8d88-8ce130301739` | [`3MGYCQzQbjQrsFO1hgdJfq`](https://open.spotify.com/album/3MGYCQzQbjQrsFO1hgdJfq) |

**Viktiga format- och editionsskillnader**

- Bandets **Yersinia EP** släpptes 2008-12-01 enligt Bandcamp. Vissa äldre YouTube-videobeskrivningar anger 2008-12-12; originalsidans datum har valts och avvikelsen noteras här.
- **Lejonhjärta** har **fyra originalspår** och behandlas i arkivet som EP, även om Spotify kategoriserar den som `single`. Bandcamp anger **2009-06-20**; Apple Music visar också ett digitalt septemberdatum, vilket inte får förväxlas med originalet.
- **Efter Oss Syndafloden** utgavs 2010-12-08 med **11 spår**, inte 2015. Senare digitala butikskataloger kan visa 2015 års distributionsuppgift.
- **Påfågeltronen** innehåller **fem** originalspår och är en EP även om Spotify kategoriserar albumobjektet som `single`.
- **Fraktaler** förekommer i Spotify med både `0G1xA1Q1xdMzKCusVhCz5s` och `6bfj1A3bJ4xjejOtUTWpAZ` enligt sökindex. Båda verkar avse samma femspårsprogram; bara ett ID mappas för att undvika dubbelutgåva. Full digital editionshistorik är inte oberoende verifierad.

## YouTube: alla 13 spårskopplingar

**Förhandsvisning:** den bäst belagda enskilda originalstudiosången bland källornas observerade visningstal är **Den sista sång jag skriver till dig** (`qlY2laM_Di4`) med cirka **66 000** indexerade visningar på bandets video. Den ersätter inte ett helt album och kan ändras om en annan Yersinia-originalvideo får högre bestyrkt visningsantal.

| Originalutgåva | Låttitel | YouTube-video | Kanal | Typ | Historiskt observerade visningar |
|---|---|---|---|---|---:|
| Yersinia | För Evigt Ung | [`4m9tr2F6SBg`](https://www.youtube.com/watch?v=4m9tr2F6SBg) | adollarshort | track | 7 300 (cirka) |
| Yersinia | Krigsidyll | [`j_JE7ZejTCE`](https://www.youtube.com/watch?v=j_JE7ZejTCE) | adollarshort | track | 2 800 (cirka) |
| Lejonhjärta | Mitt Enda Hopp | [`0TgcVoD64-c`](https://www.youtube.com/watch?v=0TgcVoD64-c) | adollarshort | track | 32 000 (cirka) |
| Efter Oss Syndafloden | Den sista sång jag skriver till dig | [`qlY2laM_Di4`](https://www.youtube.com/watch?v=qlY2laM_Di4) | adollarshort | track | 66 000 (cirka) |
| Efter Oss Syndafloden | Det vi gav till havet | [`MtciugKXsz0`](https://www.youtube.com/watch?v=MtciugKXsz0) | adollarshort | track | 5 900 (cirka) |
| Efter Oss Syndafloden | Hågadalen | [`2eSRzimJRwU`](https://www.youtube.com/watch?v=2eSRzimJRwU) | adollarshort | track | Ej verifierat |
| Aldrig Mera Vinter | Vapenbröder | [`UI0k9-u1sQo`](https://www.youtube.com/watch?v=UI0k9-u1sQo) | snappingfingers | track | Ej verifierat |
| Aldrig Mera Vinter | Glaspärlespel | [`2M06DQbKrs0`](https://www.youtube.com/watch?v=2M06DQbKrs0) | Olsson96 | track | 2 900 (cirka) |
| Aldrig Mera Vinter | Mitt bästa misstag | [`RTKxuXKsuls`](https://www.youtube.com/watch?v=RTKxuXKsuls) | Viking Music | track | Ej verifierat |
| Fraktaler | Du hade mig vid sans-serif | [`ulDh2zTM32k`](https://www.youtube.com/watch?v=ulDh2zTM32k) | Viking Music | track | Ej verifierat |
| Påfågeltronen | Gammalt blod i nya flaskor | [`WiGJ_S8sgBU`](https://www.youtube.com/watch?v=WiGJ_S8sgBU) | adollarshort | track | 250 (cirka) |
| Påfågeltronen | Svart himmel / vitt helvete | [`AmmA8zxslAM`](https://www.youtube.com/watch?v=AmmA8zxslAM) | adollarshort | track | 243 (cirka) |
| Påfågeltronen | Färjesång | [`Kiqzkr6PwYk`](https://www.youtube.com/watch?v=Kiqzkr6PwYk) | adollarshort | track | 2 100 (cirka) |

**Videoåtskillnad:** `adollarshort` har ursprungliga officiella band-/promovideor från 2008–2015. `snappingfingers` publicerade den officiella *Vapenbröder*-videon för 2011 års EP. Låtklipp från `Olsson96` och `Viking Music` beskrivs som tredjepartsuppladdningar med identifierade ursprungsinspelningar, inte felaktigt som bandets egna videor. Ett verifierat sökindex visade *Det vi gav till havet* som originalalbumets spår och originalpromo, men direktavläsning av videosidan fick timeout. Denna begränsning är antecknad i filen och ska inte döljas.

**Visningstal:** inte aktuella realtidsvärden; ungefärliga historiska uppgifter från daterade webbsökträffar. `null` används när siffran inte är belagd. Inga helalbum rankas framför verifierade enskilda låtar.

## Förstahandskällor och forskningsnoteringar

- [Yersinias samtliga originalutgåvor på Bandcamp](https://yersinia.bandcamp.com/music)
- [Yersinia (2008)](https://yersinia.bandcamp.com/album/yersinia): 4 spår, inspelad av Daniel Bergstrand vid Dug Out.
- [Lejonhjärta (2009)](https://yersinia.bandcamp.com/album/lejonhj-rta): 4 spår; bandet anger sångtext av Mattis Erngren, omslagsmålning Linnea Strid, viss produktion i Flogsta.
- [Efter Oss Syndafloden (2010)](https://yersinia.bandcamp.com/album/efter-oss-syndafloden): 11 spår; inspelad med Daniel Bergstrand och Rickard Sporrong vid Dug Out Studios, Uppsala.
- [Aldrig Mera Vinter (2011)](https://yersinia.bandcamp.com/album/aldrig-mera-vinter): 5 spår; Snapping Fingers Snapping Necks.
- [Fraktaler (2012)](https://yersinia.bandcamp.com/album/fraktaler): 5 spår; Daniel Bergstrand, Peter In De Betou, Mattis Erngren.
- [Påfågeltronen (2015)](https://yersinia.bandcamp.com/album/p-f-geltronen): 5 spår; Dennis Bertilsson, Mattis Erngren, Pär Svensson, omslagsbild Sarah Zucca.
- [High 5ive Music pressmeddelande](https://www.mynewsdesk.com/se/high-5ive-music/pressreleases/hardcore-legender-aaterfoerenas-foer-en-exklusiv-spelning-i-sommar-3152695), [festivalrapport om Påfågeltronen](https://festivalrykten.se/lyssna-yersinia-farjesang/), [Ergo recension 2010](https://ergo.nu/musik/20101208-yersinia-efter-oss-syndafloden).

## Tekniska kontroller och återstående luckor

- Sex Spotify-album-ID:n och artist-ID:t har publicerats i `UPPSALAHARDROCKSARKIV/spotify-links.js`.
- 13 YouTube-spår är inskrivna i `UPPSALAHARDROCKSARKIV/youtube-links-y.js`, vilken använder `window.ARCHIVE_YOUTUBE.push` utan att skriva över befintliga videor.
- `UPPSALAHARDROCKSARKIV/index.html` visar **WEBB V2.72**, laddar W, X och Y i ordning och uppdaterar Spotify-cacheversionen.
- Fortsatt att granska: övriga studiolåtar utan enskilt YouTube-ID, historisk video-statistik där endast indexvärden finns, full editionsskillnad mellan två Spotify-ID:n för *Fraktaler*, och kompletta ursprungliga bandmedlemskap med årtal (ingår inte i streamingkopplingskontrollen).
- Verifiering av **publik GitHub Pages-driftsättning** görs separat efter commit, eftersom versionsuppdatering i repot inte ensam styrker att webbservern redan publicerat filerna.

**Y: 1 band, 6 arkivutgåvor, 34 låtar, 6 Spotify-utgåvekopplingar, 1 artistprofil, 13 YouTube-kopplingar.**
