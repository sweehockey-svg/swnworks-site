# Spotify och YouTube – bokstav O (2026-10-23)

**Status:** Genomgång slutförd för befintliga fem O-band. Obekräftade originalutgåvor hålls öppna som forskningsluckor, inte påhittade länkar.

**Omfattning:** Obnoxious Youth, Offerblod, On Trial (Köpenhamn, relaterat band), One Hour Hell (Södertälje, relaterat band), Ordos.

## Kontroll av befintligt material

- 28 utgåveposter finns kopplade till de fem banden i Supabase (de två relaterade banden saknar ännu registrerade egna utgåvor).
- **23** utgåveposter har redan Spotify-UUID-koppling i `spotify-links.js`. De får inte läggas in en gång till.
- De fem övriga är **Kicked in the Face (2005)**, **Obey Satan! (2009 originaldemo, 2010 Bandcamp-upplaga, 2020 kassettåterutgåva)** och **Ordos House of the Dead (2016 singel)**. Inga säkra edition-specifika Spotify-album-ID:n belagda för dem. Den senare 2017-skivan ska inte felkopplas som originalsingel.
- 42 band-/utgåvekopplingar till YouTube i `youtube-links.js` efter uppdateringen. Återanvändning av ett och samma videoklipp för olika registrerade pressningar är avsiktlig. Ingen exakt dublett för samma (band, utgåva, video) finns och varje kopplat utgåve-UUID finns i Supabase.
- På bandnivå ger detta 7 unika YouTube-klipp för Obnoxious Youth, 5 för Offerblod, 1 för On Trial, 5 för One Hour Hell och 13 för Ordos. Totalen på 31 unika *per band* inkluderar klipp som delas mellan pressningar men räknas endast en gång inom respektive band.
- Spotifys fysiska CD/LP-pressningar kan länka till samma verifierade digitala master, men skiljer sig i utgåvenoteringarna. **Ordos – Four Altars of Sin (2026)** är en fyra-bands-split: endast **Inferno** spelas av Ordos. Hela skivan får inte tillskrivas Ordos.

## Nya och korrigerade YouTube-kopplingar

1. **Obnoxious Youth – Dangerzone**: befintligt verifierat videoklipp `E5l1bTiZLE0` uppdaterat till **1 110 visningar**, avläst på YouTube 2026-10-23. Klippet är dokumenterat som inspelning från Obey Satan, inte 2005-demot. Länken förekommer på 2009/2010/2020-poster för samma låtmaterial.
2. **Ordos – House of the Dead**: befintligt klipp `67VIi0FJBjk` från 2016 singel/2017 album hade felaktigt numeriskt `sourceNote: 22000`. Historiskt registrerade cirka **22 000** visningar har flyttats till `views`, och `sourceNote` beskriver nu upphov/utgåvor. Detta är ett äldre noterat, ungefärligt visningstal, inte ett nytt realtidsavläst värde.
3. **On Trial – Speaking of Witch**: `4H82XKPkVeI`, distributor-/Topic-klipp från **Forever** (2006), verifierat danskt band via Bad Afro Records.
4. **One Hour Hell – Within**: `l5bH5xjSRcQ`, musik-/lyric-video från **Voidwalker** (2019), länkad av samtida musiktidning.
5. **One Hour Hell – Covered in Sin**: `DMmhYyO6fFQ`, officiell 2014-video från **Interfectus**, cirka **4 800** visningar noterade från YouTube-resultat.
6. **One Hour Hell – Interfectus**: `puUTd_QQmRk`, hela albumet (nio låtar) upplagt 2014 av EnshadowedByDemons; **3 377** avlästa visningar.

## Förhandsvisning

Arkivets befintliga regel fungerar: välj låtklipp (`kind: track`) med högst numeriska `views`; utan registrerat visningstal väljs första verifierade låt. På bandsidan är aktuella val:

| Band | Förhandsvisning | Observerade visningar |
| --- | --- | ---: |
| Obnoxious Youth | Burning Savage | cirka 14 600 |
| Offerblod | Vår Digra Törst | cirka 3 600 |
| On Trial | Speaking of Witch | okänt |
| One Hour Hell | Covered in Sin | cirka 4 800 |
| Ordos | The Infernal God | cirka 26 000 |

Bandens olika pressningsposter kan ge en annan förhandsvisning på utgåvesidan. YouTube-visningarna är manuella observationer och uppdateras inte automatiskt.

## Verkliga återstående luckor (behåll öppna)

- **Obnoxious Youth – Kicked in the Face, 2005:** ursprunglig CD-R och sju låtar belagda, men ingen säkert verifierad digital fullinspelning, YouTube-video eller Spotify-upplaga funnen. Inga senare inspelningar ska användas som substitut.
- **Obnoxious Youth – Obey Satan!, 2009/2010/2020:** originaldemots format/master, originalomslag och separat Spotify-utgåva för respektive upplaga kan inte styrkas. Bandets egna åttaspåriga Bandcamp-utgåva är daterad januari 2010. En YouTube-spellista från Robert Black har hittats, men ytterligare videolänkar ska bara läggas till när deras enskilda video-ID och band-/låttillhörighet kan kontrolleras.
- **Obnoxious Youth – Disturbing the Graves, Suck on the Cross och Burning Savage:** flera fysiska upplagor är dokumenterade, men inte separata Spotify-masterversioner för varje färg/pressning. Fortsätt använda de redan verifierade digitala Spotify-utgåvorna och respektive notering; duplicera inte dem.
- **Ordos – House of the Dead, 2016:** originalsingeln är verifierad av bandet men ett särskilt Spotify-album-ID för just 2016-singeln har inte styrkts; 2017 års fullängdare är separat.
- **Offerblod:** alla sex ursprungliga titlar i nuvarande arkivmaterial har befintliga Spotify-kopplingar och de redan insamlade officiella YouTube-klippen används. Separat Spotify-ID för 2023 års CD-pressning av 2022 års EP är inte verifierat; samma digitala master är dokumenterad. CD-exakt datum/TOC kvar i Supabase research_tasks.
- **On Trial och One Hour Hell:** Spotify-profiler finns i befintliga filer, men inga egna album är kopplade i Supabase som release-poster. Länka därför verifierade låtar på bandnivå tills egna utgåvor eventuellt registreras. Förväxla inte On Trial med det engelska punkbandet.

## Centrala källor

- https://www.metal-archives.com/albums/Obnoxious_Youth/Kicked_in_the_face/309106
- https://misarmanufakteriet.blogspot.com/2011/09/intervju-affe-piran.html
- https://obnoxiousyouth.bandcamp.com/album/obey-satan-demo
- https://www.youtube.com/playlist?list=PL149740E2681D0453
- https://www.youtube.com/watch?v=E5l1bTiZLE0
- https://ordosofficial.bandcamp.com/track/house-of-the-dead
- https://theobelisk.net/obelisk/2016/11/23/ordos-house-of-the-dead-premiere/
- https://www.youtube.com/watch?v=67VIi0FJBjk
- https://badafrorecords.bandcamp.com/album/live-at-gutter-island
- https://www.youtube.com/watch?v=4H82XKPkVeI
- https://vampster.com/news/one-hour-hell-lyric-video-vom-melodic-death-album-voidwalker/
- https://www.youtube.com/watch?v=DMmhYyO6fFQ
- https://www.youtube.com/watch?v=puUTd_QQmRk
- https://open.spotify.com/artist/1EvEHe8Re4lFpr0lQat7Yq

**Nästa genomgång:** P. Spotify-ID för on-trial/one-hour-hell är befintliga; ingen utgåva har lagts till utan motsvarande Supabase-UUID.
