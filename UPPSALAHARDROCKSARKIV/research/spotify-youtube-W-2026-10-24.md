# Uppsala Hårdrocksarkiv: Spotify och YouTube – W

**Datum:** 2026-10-24. **Webb:** V2.70. **Databas:** Supabase `fqygdpzyqqguyaujdhjq`. **Kod:** `sweehockey-svg/swnworks-site`, main.

## Granskningsresultat

- **7 band / 37 arkivutgåvor** enligt faktisk databasfråga (inte uppskattat).
- **19 utgåve-UUID → Spotify-album-/singel-ID-kopplingar**, **17 unika Spotify-utgåvor**, **2 verifierade artist-ID:n**: Watain `4OpHsZuhfJMU9PZ3zkyUQX` och Wheel In The Sky `1z42l7pbAEJ5SstTg4JRyg`.
- **40 YouTube-UUID-kopplingar**, **33 unika YouTube-klipp**. Delning av video-ID mellan *olika* originalutgåvor är avsiktlig och innebär inte identiska dubbletter.
- **11 W-videokopplingar med ej fastställt kanalnamn**. Okända visningstal är `null`. Uppgivna visningar är tidigare daterade observationer, inte dagens exakta tal.
- **Inga felaktiga eller saknade utgåve-UUID:n i W-YouTube**, inga ogiltiga 11-teckens video-ID:n, inga identiska `UUID+video-ID`-dubbletter.
- Rättelse mot förra arbetsstatusen: **Wheel In The Sky – Two Hearts Breaking** från 14 februari 2020 har faktiskt publicerad Spotify-länk `6WTazNYSpI4XUgBicNzNVn` för arkiv-UUID `d6fbb0bb-4ad9-43e6-aebb-a1aea42ba0ec`; därför **19**, inte 18, Spotify-UUID-kopplingar.

| Band | Arkivutgåvor | Spotify-kopplingar | YouTube-kopplingar | Unika YouTube-ID:n |
|---|---:|---:|---:|---:|
| Warpath | 1 | 0 | 4 | 4 |
| Watain | 23 | 15 | 28 | 21 |
| Wheel In The Sky | 4 | 4 | 7 | 7 |
| Whimzy | 9 | 0 | 1 | 1 |
| Winding Road | 0 | 0 | 0 | 0 |
| Withered Beauty | 0 | 0 | 0 | 0 |
| Wuthering Heights | 0 | 0 | 0 | 0 |

## Källkontroll, beslut och faktiska luckor

### Warpath
Original 1996 års svenska band med Dave Lepard, inte namnlika band. Arkivets EP *Strangers Hount by Demons* har 6 låtar. Fyra låtar har enskilda YouTube-klipp på rätt UUID, men kanalnamn och visningstal är inte bekräftade. *Pathetix* och *Sleeping* saknar separat kvalitetssäkrad video. Ingen original-Spotify-utgåva styrkt. [Originalutgåva och spår](https://www.metal-archives.com/albums/Warpath/Strangers_Hount_by_Demons/315243).

### Watain
23 arkivutgåvor, 15 Spotify-kopplingar och 28 YouTube-kopplingar. De ursprungliga studioalbumens spårordning och valda singlar kopplas utan att bonusutgåvor blandas ihop med originalpressningar. 2010 års *Reaping Death* finns i två arkiverade fysiska format med olika B-sidor, medan den länkade digitala utgåvan har tre spår. 2022 års fysiska *The Howling* har *I Arose* på B-sidan; Spotify-singeln innehåller endast titelspåret. Album, studio, demos och live separeras.

Officiella verifierbara Watain-videoexempel: [Outlaw](https://www.youtube.com/watch?v=DJvTodICIVU), [Nuclear Alchemy](https://www.youtube.com/watch?v=qGPYb2y_PDA), [The Howling](https://www.youtube.com/watch?v=K_oPqu6xQDM). *Outlaw* (historisk källa cirka 2,6 miljoner visningar) är högst belagda **enskilda studiospåret i nuvarande W-lista** och därmed standardförhandsvisning på bandnivå, aldrig ett helt album i dess ställe. *Go Fuck Your Jewish "God"* (1998 demo), *The Misanthropic Ceremonies* (2001 split), *Promo 2002* och *Puzzles ov Flesh* saknar säker länk till exakt originalutgåva. Andra äldre inspelningar kan ha YouTube men sakna en original-Spotify-utgåva. Källor: [Nuclear Blast](https://www.nuclearblast.com/blogs/news/watain-new-album-to-be-released-on-april-29th-30902), [Sony/Century Media](https://www.sonymusic.ca/press_release/watain-launch-pre-order-for-new-album-trident-wolf-eclipse), [Metal Archives](https://www.metal-archives.com/albums/Watain/The_Howling/1015777).

### Wheel In The Sky
Uppsala-bandets fyra registrerade originalutgåvor (2015/2018/2020/2020) är mappade till Spotify och samtliga har också YouTube-klipp. Singlarna *Chariot Of Fire!* (2:40, 2020-12-18) och *Two Hearts Breaking* (3:43, 2020-02-14) bekräftas mot [bandets eget Bandcamp](https://wheelinthesky.bandcamp.com/), [Two Hearts Breaking](https://wheelinthesky.bandcamp.com/album/two-hearts-breaking) och [Apple Music discography](https://music.apple.com/us/album/burn-babylon-burn-single/1380306288). YouTube-uppsättningen har sju länkar: separata låtar och ett helt 2018-album. Ingen av låtarna har tillförlitligt observerat numeriskt visningstal i W-filen, så det går **inte** att påstå vilken av dem som har flest visningar. Förhandsvisningen väljer därför verifierat **enskilt låtklipp** före album.

### Whimzy
Uppsala-bandet hette tidigare Screw/Whimsy; identifierat med [Swedish Hard And Heavy Encyclopedia](https://www.fwoshm.com/index/W/1755-whimzy-swe). Nio registrerade utgåvor, ingen säker original-Spotify-matchning. 1997 års *Heaven Or Hell* har en kontrollerad **fullalbumuppladdning** hos Mr666ironangel; ett individuellt verifierat studiolåtklipp saknas. De åtta övriga utgåvorna har ingen separat säker YouTube-koppling ännu. Kanalens sökresultat antyder en 1994 års *Gambling With The Future*-fullalbumuppladdning, men inget verifierat video-ID kunde styrkas i denna kontroll. [Meshuggah – Attacked By A Shark live](https://www.youtube.com/watch?v=crbp8I2l3zs) är en cover, **inte** Whimzys originalinspelning och kopplas därför inte felaktigt.

### Winding Road
**0 arkivutgåvor**. Melodisk rock från Malung, med musikaliskt personband via Jonas Tyskhagen (också Domino Drive). [Pride & Joy](https://www.prideandjoy.de/domino-drive-smoke-and-mirrors/) ger personkopplingen; [bandets egen Facebook](https://www.facebook.com/WindingRoadSweden/) anger hemorten. Exempel på en utomstående video: [Love's Walking Out Of Sight](https://www.youtube.com/watch?v=874RxfP0yDo). Ingen utgåve-UUID finns att mappa: bandet får inte behandlas som nytt, påhittat Uppsala-album.

### Withered Beauty
**0 arkivutgåvor**. Namngiven metalgrupp är dokumenterad som hemmahörande i **Gävle**. Album 1998 och demos 1994–95 förekommer i externa diskografier; ingen är en registrerad utgåva i nuvarande Uppsala-databas. [TheMetalNet](https://themetalnet.com/band/withered-beauty), [Metal Archives](https://www.metal-archives.com/albums/Withered_Beauty/Through_Silent_Skies/12269). Ingen falsk Spotify-/YouTube-mappning.

### Wuthering Heights
**0 arkivutgåvor**. Danskt/Köpenhamnsbaserat band relaterat genom Uppsalamusikern Teddy Möller. Ingen egen release-UUID i arkivet. Ska inte förväxlas med Kate Bush låt, romanen eller andra namnlika profiler. [Nordic Metal](https://www.nordicmetal.net/band/wuthering-heights/), [AllMusic](https://www.allmusic.com/artist/wuthering-heights-mn0000582754).

## Alla 37 W-utgåvor: UUID, Spotify-ID och antal YouTube-kopplingar

| Band | Originalutgåva | År | UUID | Spotify-ID | YouTube-antal |
|---|---|---:|---|---|---:|
| Warpath | Strangers Hount by Demons | 1996 | `abb4c4c4-f0f7-4a6e-85fa-ef657fefea59` | – | 4 |
| Watain | Go Fuck Your Jewish "God" | 1998 | `235b0f9d-e064-4e2a-8df2-db1a028aa49a` | – | – |
| Watain | Black Metal Sacrifice | 1999 | `fad3dd45-8d46-413d-9ade-ddd3a9835dd0` | – | 1 |
| Watain | The Essence of Black Purity | 1999 | `a083fbcd-33f1-4f0d-ac62-ec741d516bd1` | – | 1 |
| Watain | Rabid Death's Curse | 2000 | `28639908-36c7-46bb-9c3f-76312d8b7bbf` | [`5HudrMtSJIO1gQdYJvazac`](https://open.spotify.com/album/5HudrMtSJIO1gQdYJvazac) | 1 |
| Watain | The Misanthropic Ceremonies | 2001 | `04512705-00c5-4f3a-8cff-49511f442ee6` | – | – |
| Watain | The Ritual Macabre | 2001 | `3c95d8e0-f671-4448-976f-22477e0edab2` | – | 1 |
| Watain | Promo 2002 | 2002 | `82cd6304-8f1b-49f2-a813-5c0542f723d1` | – | – |
| Watain | Puzzles ov Flesh | 2002 | `ef2d631e-20d4-4ca0-9fac-469ae2e9515a` | – | – |
| Watain | Casus Luciferi | 2003 | `f6ef52c8-26b7-4a92-8bbe-05a08dd6be70` | [`7mwSPxDaWlbP5lXTHcsIQB`](https://open.spotify.com/album/7mwSPxDaWlbP5lXTHcsIQB) | 1 |
| Watain | Sworn to the Dark | 2007 | `ac87c59b-f5a1-4731-943e-e1535befa63f` | [`2z6f3UO5OVgP99A4DWByO3`](https://open.spotify.com/album/2z6f3UO5OVgP99A4DWByO3) | 1 |
| Watain | Lawless Darkness | 2010 | `f63a496b-4d3d-493d-bec3-ea81258308bf` | [`2pQr4wN4SN9Ax3gdXDhrRz`](https://open.spotify.com/album/2pQr4wN4SN9Ax3gdXDhrRz) | 3 |
| Watain | Reaping Death | 2010 | `4d67f21c-eef4-44bc-83f0-e09867fd805d` | [`6cDZWsEU4KhNI9ZYZKg0eZ`](https://open.spotify.com/album/6cDZWsEU4KhNI9ZYZKg0eZ) | 1 |
| Watain | Reaping Death | 2010 | `afac031f-bfe8-4689-bd08-748d76acdbdf` | [`6cDZWsEU4KhNI9ZYZKg0eZ`](https://open.spotify.com/album/6cDZWsEU4KhNI9ZYZKg0eZ) | 1 |
| Watain | All That May Bleed | 2013 | `31a7aeda-db60-4df7-8a0d-355e28845226` | [`42RN14SVoQJ06GM1YmOJZ2`](https://open.spotify.com/album/42RN14SVoQJ06GM1YmOJZ2) | 1 |
| Watain | The Wild Hunt | 2013 | `f3be6e53-31db-4119-8d49-8d05bf95efb4` | [`1FCdcUH6lumfoNYHTX5nz1`](https://open.spotify.com/album/1FCdcUH6lumfoNYHTX5nz1) | 3 |
| Watain | Nuclear Alchemy | 2017 | `f464063f-d360-45eb-a9f4-c4f28d46646e` | [`3gViwEIoVGN8WWmKxvxhI7`](https://open.spotify.com/album/3gViwEIoVGN8WWmKxvxhI7) | 1 |
| Watain | Trident Wolf Eclipse | 2018 | `aefe231f-ec7e-43e3-98d7-3a8ac83647a8` | [`5zIMy5QyI1PbvQWBEmdUuV`](https://open.spotify.com/album/5zIMy5QyI1PbvQWBEmdUuV) | 2 |
| Watain | Corona Mortis | 2020 | `988332bf-13e3-4da3-98ae-eac34bada50a` | – | 1 |
| Watain | The Agony & Ecstasy of Watain | 2022 | `0ec1a636-8681-4179-9e13-586e986d94dc` | [`7qmZz6yfRiXAoW4lgOPi4W`](https://open.spotify.com/album/7qmZz6yfRiXAoW4lgOPi4W) | 4 |
| Watain | The Howling | 2022 | `14f60f22-c20b-4732-905f-cab104054228` | [`7iPrKhg1qGiwyAl47UfGfi`](https://open.spotify.com/album/7iPrKhg1qGiwyAl47UfGfi) | 1 |
| Watain | The Howling | 2022 | `b62125ef-b48f-4cf6-80e4-d02ea1d07c28` | [`7iPrKhg1qGiwyAl47UfGfi`](https://open.spotify.com/album/7iPrKhg1qGiwyAl47UfGfi) | 1 |
| Watain | We Remain | 2022 | `a9276a14-9bb4-466f-92fb-8e31e24dcbd4` | [`2WGwuYrFNiQD17C1wkCsXX`](https://open.spotify.com/album/2WGwuYrFNiQD17C1wkCsXX) | 1 |
| Watain | Die in Fire Live in Hell - Agony & Ecstasy over Stockholm | 2023 | `be9f6619-db25-430d-b713-eb97c72a32cc` | [`5IC1bAU58XZrx4G1Pi7vKR`](https://open.spotify.com/album/5IC1bAU58XZrx4G1Pi7vKR) | 2 |
| Wheel In The Sky | Heading For The Night | 2015 | `c1778289-b2f8-4bef-a9b4-97ab45f1b6b5` | [`1BqvyStEp4TOwnXKKof9nA`](https://open.spotify.com/album/1BqvyStEp4TOwnXKKof9nA) | 3 |
| Wheel In The Sky | Beyond The Pale | 2018 | `dda85348-b748-433c-be82-be60ddb70bfc` | [`3vI0cNRQag9Fsbr7wYyG7x`](https://open.spotify.com/album/3vI0cNRQag9Fsbr7wYyG7x) | 2 |
| Wheel In The Sky | Chariot Of Fire! | 2020 | `b6f7dda3-8f51-4404-8170-4337e22cb4c6` | [`1a83Vb3jL2P2TnVdEGwpEy`](https://open.spotify.com/album/1a83Vb3jL2P2TnVdEGwpEy) | 1 |
| Wheel In The Sky | Two Hearts Breaking | 2020 | `d6fbb0bb-4ad9-43e6-aebb-a1aea42ba0ec` | [`6WTazNYSpI4XUgBicNzNVn`](https://open.spotify.com/album/6WTazNYSpI4XUgBicNzNVn) | 1 |
| Whimzy | Inspelning Musikalen | 1992 | `b30f1931-730f-4dc4-b728-3fc898a77a73` | – | – |
| Whimzy | Spit Like This | 1993 | `9e2ec232-fafa-45c9-92be-afb703b1367b` | – | – |
| Whimzy | Flying Away | 1994 | `5111633b-67a4-41c8-997d-fe36613ab47b` | – | – |
| Whimzy | Gambling With The Future | 1994 | `2f95201f-c31e-4cd3-977b-bb5f4ce2253a` | – | – |
| Whimzy | Reasons To..... | 1996 | `55583fde-2f0d-4d68-89f2-aaad7230363e` | – | – |
| Whimzy | Scandinavia Calling 2 | 1996 | `8ddf2f04-a63e-4bae-856f-ffef773f40dd` | – | – |
| Whimzy | Heaven Or Hell | 1997 | `41bca9fa-e9d5-4925-8849-1dded03addda` | – | 1 |
| Whimzy | Angels To Some...Demons To Others | 2004 | `3f8d8caf-2b83-440e-8cd0-b5e4516be46d` | – | – |
| Whimzy | We 3 Are 1 | ? | `6e5d723f-8f6b-46b5-aeb5-038e4f9fe416` | – | – |

## Alla 40 W-YouTube-kopplingar (original-ID, kanal, typ och historiskt visningstal)

| Band | Titel | Video | UUID | Kanal | Typ | Visningar |
|---|---|---|---|---|---|---:|
| warpath | Missed Minded | [`z-9qZWMVlQA`](https://www.youtube.com/watch?v=z-9qZWMVlQA) | `abb4c4c4-f0f7-4a6e-85fa-ef657fefea59` | Inte styrkt | track | Ej styrkt |
| warpath | Zombie of Destruction | [`egRqOxJ6W3U`](https://www.youtube.com/watch?v=egRqOxJ6W3U) | `abb4c4c4-f0f7-4a6e-85fa-ef657fefea59` | Inte styrkt | track | Ej styrkt |
| warpath | Growl In My Toilet | [`vCvRVzyT3K0`](https://www.youtube.com/watch?v=vCvRVzyT3K0) | `abb4c4c4-f0f7-4a6e-85fa-ef657fefea59` | Inte styrkt | track | Ej styrkt |
| warpath | Doom | [`56SsHObKxms`](https://www.youtube.com/watch?v=56SsHObKxms) | `abb4c4c4-f0f7-4a6e-85fa-ef657fefea59` | Inte styrkt | track | Ej styrkt |
| whimzy | Heaven Or Hell (full 1997 album) | [`lM5OHUpF8Xk`](https://www.youtube.com/watch?v=lM5OHUpF8Xk) | `41bca9fa-e9d5-4925-8849-1dded03addda` | Mr666ironangel | album | 753 |
| watain | Black Metal Sacrifice (original 1999 live recording) | [`48WBxGQbEZc`](https://www.youtube.com/watch?v=48WBxGQbEZc) | `fad3dd45-8d46-413d-9ade-ddd3a9835dd0` | BM Promotion | live | 8600 |
| watain | The Essence of Black Purity (original 1999 7-inch full single) | [`hbeyi3Mj27w`](https://www.youtube.com/watch?v=hbeyi3Mj27w) | `a083fbcd-33f1-4f0d-ac62-ec741d516bd1` | Inte styrkt | album | Ej styrkt |
| watain | Rabid Death's Curse | [`Q2lq8mOtxL4`](https://www.youtube.com/watch?v=Q2lq8mOtxL4) | `28639908-36c7-46bb-9c3f-76312d8b7bbf` | Season of Mist | track | 14000 |
| watain | The Ritual Macabre (original 2001 full live set) | [`2DERLtGay-M`](https://www.youtube.com/watch?v=2DERLtGay-M) | `3c95d8e0-f671-4448-976f-22477e0edab2` | Inte styrkt | live | Ej styrkt |
| watain | Casus Luciferi (original 2003 album full stream) | [`sf8_7dgpcR8`](https://www.youtube.com/watch?v=sf8_7dgpcR8) | `f6ef52c8-26b7-4a92-8bbe-05a08dd6be70` | Inte styrkt | album | Ej styrkt |
| watain | Sworn to the Dark (full original album) | [`iUL8TZZqgD8`](https://www.youtube.com/watch?v=iUL8TZZqgD8) | `ac87c59b-f5a1-4731-943e-e1535befa63f` | Black Metal Promotion | album | 24000 |
| watain | Lawless Darkness (full 2010 original album) | [`saJebunVKmo`](https://www.youtube.com/watch?v=saJebunVKmo) | `f63a496b-4d3d-493d-bec3-ea81258308bf` | Inte styrkt | album | Ej styrkt |
| watain | Malfeitor | [`TSYh1mFVyUs`](https://www.youtube.com/watch?v=TSYh1mFVyUs) | `f63a496b-4d3d-493d-bec3-ea81258308bf` | Season of Mist | track | 165000 |
| watain | Reaping Death | [`8pqYK7DKmO8`](https://www.youtube.com/watch?v=8pqYK7DKmO8) | `afac031f-bfe8-4689-bd08-748d76acdbdf` | Season of Mist | track | 43000 |
| watain | Reaping Death | [`8pqYK7DKmO8`](https://www.youtube.com/watch?v=8pqYK7DKmO8) | `4d67f21c-eef4-44bc-83f0-e09867fd805d` | Season of Mist | track | 43000 |
| watain | Reaping Death | [`8pqYK7DKmO8`](https://www.youtube.com/watch?v=8pqYK7DKmO8) | `f63a496b-4d3d-493d-bec3-ea81258308bf` | Season of Mist | track | 43000 |
| watain | Outlaw | [`DJvTodICIVU`](https://www.youtube.com/watch?v=DJvTodICIVU) | `f3be6e53-31db-4119-8d49-8d05bf95efb4` | Century Media Records | track | 2600000 |
| watain | They Rode On | [`29nvdkIxIpY`](https://www.youtube.com/watch?v=29nvdkIxIpY) | `f3be6e53-31db-4119-8d49-8d05bf95efb4` | Ilias Michoulis | track | 578000 |
| watain | All That May Bleed | [`WgKyfrdcDwY`](https://www.youtube.com/watch?v=WgKyfrdcDwY) | `31a7aeda-db60-4df7-8a0d-355e28845226` | Century Media Records | track | 480672 |
| watain | All That May Bleed | [`WgKyfrdcDwY`](https://www.youtube.com/watch?v=WgKyfrdcDwY) | `f3be6e53-31db-4119-8d49-8d05bf95efb4` | Century Media Records | track | 480672 |
| watain | Nuclear Alchemy | [`qGPYb2y_PDA`](https://www.youtube.com/watch?v=qGPYb2y_PDA) | `f464063f-d360-45eb-a9f4-c4f28d46646e` | Century Media Records | track | 1116704 |
| watain | Nuclear Alchemy | [`qGPYb2y_PDA`](https://www.youtube.com/watch?v=qGPYb2y_PDA) | `aefe231f-ec7e-43e3-98d7-3a8ac83647a8` | Century Media Records | track | 1116704 |
| watain | Trident Wolf Eclipse (full 2018 album) | [`tLs8UjJpvjE`](https://www.youtube.com/watch?v=tLs8UjJpvjE) | `aefe231f-ec7e-43e3-98d7-3a8ac83647a8` | Inte styrkt | album | Ej styrkt |
| watain | Corona Mortis (2020 original rehearsal cassette) | [`1wExn5icNMQ`](https://www.youtube.com/watch?v=1wExn5icNMQ) | `988332bf-13e3-4da3-98ae-eac34bada50a` | Inte styrkt | album | Ej styrkt |
| watain | The Agony & Ecstasy of Watain (official full album stream) | [`QPnUoXevAjg`](https://www.youtube.com/watch?v=QPnUoXevAjg) | `0ec1a636-8681-4179-9e13-586e986d94dc` | OfficialWatain / Nuclear Blast | album | Ej styrkt |
| watain | The Howling | [`K_oPqu6xQDM`](https://www.youtube.com/watch?v=K_oPqu6xQDM) | `14f60f22-c20b-4732-905f-cab104054228` | Nuclear Blast Records | track | 829000 |
| watain | The Howling | [`K_oPqu6xQDM`](https://www.youtube.com/watch?v=K_oPqu6xQDM) | `b62125ef-b48f-4cf6-80e4-d02ea1d07c28` | Nuclear Blast Records | track | 829000 |
| watain | The Howling | [`K_oPqu6xQDM`](https://www.youtube.com/watch?v=K_oPqu6xQDM) | `0ec1a636-8681-4179-9e13-586e986d94dc` | Nuclear Blast Records | track | 829000 |
| watain | We Remain | [`u-bNl58mAY8`](https://www.youtube.com/watch?v=u-bNl58mAY8) | `a9276a14-9bb4-466f-92fb-8e31e24dcbd4` | Nuclear Blast Records | track | 713000 |
| watain | We Remain | [`u-bNl58mAY8`](https://www.youtube.com/watch?v=u-bNl58mAY8) | `0ec1a636-8681-4179-9e13-586e986d94dc` | Nuclear Blast Records | track | 713000 |
| watain | Serimosa | [`VFm-ARerxbI`](https://www.youtube.com/watch?v=VFm-ARerxbI) | `0ec1a636-8681-4179-9e13-586e986d94dc` | Nuclear Blast Records | track | 115000 |
| watain | Ecstasies in Night Infinite (Live Stockholm 2022) | [`Vvzmv-JLUXs`](https://www.youtube.com/watch?v=Vvzmv-JLUXs) | `be9f6619-db25-430d-b713-eb97c72a32cc` | Nuclear Blast Records | live | Ej styrkt |
| watain | Before the Cataclysm (Live Stockholm 2022) | [`5UCtdwN-ilU`](https://www.youtube.com/watch?v=5UCtdwN-ilU) | `be9f6619-db25-430d-b713-eb97c72a32cc` | Nuclear Blast Records | live | Ej styrkt |
| wheel-in-the-sky | Jezebel | [`8cHSmz0yILU`](https://www.youtube.com/watch?v=8cHSmz0yILU) | `c1778289-b2f8-4bef-a9b4-97ab45f1b6b5` | The Sign Records | track | Ej styrkt |
| wheel-in-the-sky | Rainbow of Evil | [`-FS6gcN0J-8`](https://www.youtube.com/watch?v=-FS6gcN0J-8) | `c1778289-b2f8-4bef-a9b4-97ab45f1b6b5` | Wheel In The Sky | track | Ej styrkt |
| wheel-in-the-sky | God on High | [`3yY2e4-d_cA`](https://www.youtube.com/watch?v=3yY2e4-d_cA) | `c1778289-b2f8-4bef-a9b4-97ab45f1b6b5` | Inte styrkt | track | Ej styrkt |
| wheel-in-the-sky | Burn Babylon, Burn! | [`pkCVKhlsPd8`](https://www.youtube.com/watch?v=pkCVKhlsPd8) | `dda85348-b748-433c-be82-be60ddb70bfc` | The Sign Records | track | Ej styrkt |
| wheel-in-the-sky | Beyond the Pale (full original 2018 album) | [`2V7aDFX1v3c`](https://www.youtube.com/watch?v=2V7aDFX1v3c) | `dda85348-b748-433c-be82-be60ddb70bfc` | MrDoom | album | 3200 |
| wheel-in-the-sky | Chariot Of Fire! | [`YE245pDE4bQ`](https://www.youtube.com/watch?v=YE245pDE4bQ) | `b6f7dda3-8f51-4404-8170-4337e22cb4c6` | Wheel In The Sky - Topic | track | Ej styrkt |
| wheel-in-the-sky | Two Hearts Breaking | [`9lMdV5xgv1A`](https://www.youtube.com/watch?v=9lMdV5xgv1A) | `d6fbb0bb-4ad9-43e6-aebb-a1aea42ba0ec` | Wheel In The Sky - Topic | track | Ej styrkt |

## Publicering och kontroll

GitHub `main` innehåller `UPPSALAHARDROCKSARKIV/youtube-links-w.js`, som läggs till genom `window.ARCHIVE_YOUTUBE.push` efter A–V. `index.html` laddar `youtube-links.js`, `youtube-links-t.js`, `youtube-links-u.js`, `youtube-links-v.js`, `youtube-links-w.js`, därefter `spotify-links.js?v=2.70` och till sist `app.js`. Den publicerade startsidans sidfot visar **WEBB V2.70**, och [publik W-fil](https://swnworks.se/UPPSALAHARDROCKSARKIV/youtube-links-w.js?v=1) serverar posterna. Koden i `app.js` prioriterar `kind='track'` med belagt högsta visningstal för förhandsvisningen; annars väljs enskilt spår före ett helt album.

**Avgränsningar:** Tidigare noterade kanaler/visningstal återges enligt W-filen från 2026-10-23. Alla 33 enskilda YouTube-ID:n kunde inte återuppspelas och omverifieras live den 24 oktober. Publiceringens URL-/filnivå har kontrollerats; full browserinteraktion/uppspelning ingick inte. Saknade originalutgåvor, formatvariationer och obekräftade homonymer lämnades avsiktligt okopplade.
