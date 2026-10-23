# Uppsala Hårdrocksarkiv – Spotify och YouTube, bokstav X

**Forskningsdatum:** 2026-10-24  
**Webbversion:** V2.71  
**GitHub:** `sweehockey-svg/swnworks-site`, `main`  
**Supabase:** `fqygdpzyqqguyaujdhjq`  
**Omfattning:** Den faktiskt registrerade bokstaven X i Supabase, inte andra artister vars namn liknar X.

## Sammanfattning

**1 band, 1 arkivutgåva, 4 spår.** Genomgången avser endast **Xtortex** från Uppsala, grundat 1989.

- **Nya Spotify-artistprofiler:** 0
- **Nya Spotify-utgåva–UUID-kopplingar:** 0
- **Nya YouTube-utgåva–video-kopplingar:** 0
- **Verifierade separata YouTube-ID:n:** 0
- **Verifierade YouTube-visningstal:** 0
- **Forskningsluckor:** rätt original-Spotify-profil och digitalutgåva har inte kunnat beläggas; ingen identifierad YouTube-uppladdning med verifierbart originalinnehåll och video-ID har hittats.

**Viktigt:** Noll betyder att ingen *tillräckligt säker* länk kunde verifieras i denna genomgång, inte att inget ljud någonsin har laddats upp eller att digitalisering saknas.

## 1. Xtortex

### Identifiering

- **Fullständigt namn:** Xtortex
- **Ursprung:** Uppsala, Sverige
- **Bildat:** 1989
- **Genre:** Thrash metal
- **Status:** Upplöst enligt Metal Archives
- **Supabase band-UUID:** `192e137b-a142-4078-a24f-8bcda6471f4c`
- **Supabase release-UUID:** `fefcd58c-5a9c-4299-bc64-6917f436c63e`
- **Arkivutgåva:** *Twisted*, demo, kassett, 1990 (egenutgiven)
- **Källor:** [Metal Archives – Xtortex](https://www.metal-archives.com/bands/Xtortex/3540365310), [Metal Archives – Twisted](https://www.metal-archives.com/albums/Xtortex/Twisted/), [Strah – Xtortex](https://strahmusic.com/artist/xtortex/), [Discogs – Twisted, release 27579804](https://www.discogs.com/release/27579804-Xtortex-Twisted) (Discogs-läsning blockerades; länk/ID framgår av databasens befintliga spårnotering).

### Originalkassettens fyra spår

| Sida/position | Registrerat originalspår | Kommentar |
|---|---|---|
| A1 | Intro / Sacrifice | *Intro* ligger ihop med *Sacrifice*, ingen fristående arkivspårpost |
| A2 | Fatal Chaos | Speltid inte dokumenterad |
| B1 | Humanity of Society | Speltid inte dokumenterad |
| B2 | Fascist Rise / Outro | *Outro* ligger ihop med *Fascist Rise* |

Spåren ligger sedan tidigare som **fyra** poster i `release_tracks` i Supabase. Ingen felaktig uppdelning av intro/outro har gjorts. Originalkassettens låtordning och sidor stöds av [Metal Archives albumuppgifter](https://www.metal-archives.com/albums/Xtortex/Twisted/). Inspelning och mixning anges där ha gjorts på **Farozon Studios i november 1990**.

### Verifierade medlemmar

| Person | Funktion |
|---|---|
| Henrik Lindahl | Sång; dessutom ljudtekniker för demon |
| John S. Swahn | Gitarr |
| Anders Stub | Gitarr |
| Viktor Ahnfelt | Bas; logotyp krediterad V. Ahnfelt |
| Thomas Engstrand | Trummor |

**Övriga credits:** D. Giese är angiven för omslag och specialeffektredigering hos Metal Archives. Uppgifterna om enskilda medlemmars exakta tjänstgöringsperioder är fortfarande osäkra och bör inte härledas enbart från 1990 års enda belagda demo. [Primär katalogkälla](https://www.metal-archives.com/albums/Xtortex/Twisted/).

### Ytterligare utgivningsspår: Kattetejpen 2 – The Return

Metal Archives dokumenterar att **Sacrifice** ingår på samlingskassetten *Kattetejpen 2 – The Return*. Även Discogs har en katalogpost [Various – Kattetejpen 2 – The Return](https://www.discogs.com/release/12360173-Various-Kattetejpen-2-The-Return). Det är **inte** en extra registrerad Xtortex-utgåva i den aktuella Supabase-release-tabellen. Det finns inte heller tillräcklig beläggning för att ett eventuellt samlingsklipp är exakt samma ljudmaster som 1990 års demo.

**Beslut:** Ingen YouTube- eller Spotify-länk kopplas via samlingskassetten genom antaganden.

### Spotify-kontroll

Sökt på kombinationerna Xtortex, Twisted, Uppsala, Sacrifice, Fatal Chaos och demo 1990, samt artist-/albumprofiler via sökmotorer. Ingen originalartist-ID eller utgåve-ID med säker identitet för Uppsala-bandet hittades.

**Viktiga homonymer att utesluta:** `XT`, som är ett annat svenskt metalband (Göteborg, bildat 1991); `X-Vortex` med musik på Spotify; samt varierande *Twisted*-titlar utan Xtortex-credits. Jämför [XT](https://www.metal-archives.com/bands/XT/69609) och [X-Vortex på Spotify](https://open.spotify.com/artist/3RYqHFheouKw5rWB34SRJo). Ingen av dessa identiteter får läggas in för Xtortex.

**Resultat Spotify:** inga nya poster i `ARCHIVE_SPOTIFY.artists` eller `ARCHIVE_SPOTIFY.releases`; endast dokumentationskommentar om genomförd X-kontroll.

### YouTube-kontroll

Separat sökning gjord för bandnamn, demo, originalalbum och alla fyra låttitlar samt *Sacrifice* från samlingskassetten. Även SoundCloud/Bandcamp och [Heavy Metal Rarities: efterlysning av Twisted-demon](https://heavymetalrarities.com/forum/viewtopic.php?f=136&t=71257) kontrollerades. Forum- och Discogs-sidor kunde inte läsas direkt på grund av robotblockering, men forumträffens sökutdrag gav en **efterlysning**, inte en verifierad stream.

Det hittades ingen video där både video-ID, bandidentitet och korrekt *Twisted* 1990-inspelning säkert kunde beläggas. Därför finns **ingen förhandsvisningslåt**. Eftersom ingen enskild video är verifierad går det inte heller att ranka låtar efter visningar.

**Resultat YouTube:** `youtube-links-x.js` initierar listan utan att införa falska video-ID:n. `window.ARCHIVE_YOUTUBE.push(...[])` är avsiktligt tomt. Tidigare länkar ligger kvar.

## Publicering och kontroll

- `UPPSALAHARDROCKSARKIV/youtube-links-x.js` skapad och laddas efter `youtube-links-w.js`.
- `UPPSALAHARDROCKSARKIV/spotify-links.js` har fått en X-kontrollkommentar; alla tidigare Spotify-mappningar behålls.
- `UPPSALAHARDROCKSARKIV/index.html` innehåller **WEBB V2.71** och `spotify-links.js?v=2.71`; X-filen laddas **före** `app.js`.
- Utgåvans UUID och samtliga fyra spår avstämda mot Supabase. Varken felkopplade ID:n eller konstruerade visningstal har publicerats.
- Webbserververifiering redovisas separat om webbserverns cache inte ännu levererar den senaste committen.

## Fortsatta forskningsluckor (specificerade)

1. Säkert originalspår från *Twisted* på Spotify eller YouTube, inklusive ett **verifierat URL/video-ID**.
2. Om kassettens ljud eller dess *Sacrifice*-spår är digitaliserat i privatarkiv eller av de fem musikerna.
3. En oberoende kontroll av exakt antal kassettexemplar och övriga publicerade utgåvor, om belägg dyker upp.
4. Ljudmässig jämförelse mellan demon och *Kattetejpen 2*, om originalen blir tillgängliga.

**Bokstav X: alla befintliga arkivposter genomgångna, verifierat inga säkra nya Spotify- eller YouTube-ID:n. Forskningsluckor dokumenterade i stället för påhittade länkar.**
