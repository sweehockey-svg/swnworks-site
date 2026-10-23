# Uppsala Hårdrocksarkiv – Spotify och YouTube, bokstav T
**Forskningsdatum:** 2026-10-23
**Publicerat:** GitHub `sweehockey-svg/swnworks-site` på `main`, webbplats **WEBB V2.67**.

## Omfattning och slutresultat

- **33 T-band** från public.bands. **84 kopplingar till utgåvor** i public.release_bands, inklusive olika format, samlingsutgåvor och återutgåvor.
- **34 nya Spotify-kopplingar** till arkivets exakta utgåve-UUID:n. De omfattar **24 unika Spotify-utgåve-ID:n** och **8 verifierade bandartistprofiler**. Inga osäkra uppgifter läggs till bara för att ett annat band har samma namn.
- **43 nypublicerade YouTube band-/release-/video-kopplingar**, **34 unika 11-teckens video-ID:n**, lagrade i `youtube-links-t.js`. **56 tidigare Treebeard-kopplingar** från `youtube-links.js` är kvar och dubbleras inte.
- Spotify genom `spotify-links.js?v=2.67`; YouTube bas `youtube-links.js?v=2.65` följt av `youtube-links-t.js?v=2`; därefter laddas app.js.
- **Utgåveskillnader bevaras:** 2014/15 kontra senare Spotifydatum, förstautgåva kontra LP/CD-återutgåva, 13-spårsoriginal kontra digital 23-spårsutgåva. YouTube albumklipp `kind:'album'` räknas inte som enskilda låtar i bandförhandsvisningarna.
- Inga tabeller i Supabase ändrade. Länkarna är del av webbplatsens GitHub-data, medan ursprungliga release-UUID:n hämtats från Supabase.

**Exempel på registrerade YouTube-förhandsvisningar:** The Ghoulies – Reclaim the World (~1 400); The Good Honey Society – Sharpshooter (~3 900); The Mist of Avalon – Sleepless (~6 600); The Unkinds – Unkind Woman (~866); Third Storm – Forgotten Deity (~1 300). Uppgifterna är äldre manuella visningsobservationer, **inte liveuppdaterade**. Treebeards tidigare egna videos används som förut.

**Kontroll för The Search:** `Silhouette` från 2024 har kopplats till både `d814381c-a73f-46b2-a169-4de0eb998f65` och `54b7cde1-fe5e-4671-b190-6819c11a0bcc` i stället för tomt utgåve-ID.

## Genomgång och källkontroll

Taiwaz: I Am All innehåller åtta låtar från original-LP-programmet 2014/15, på Spotify som digital katalogutgåva 2019 https://open.spotify.com/album/4uPJvxc21HeX7mna2QjK1M. The Uninvited Guest är SEXSPÅRIGT originalalbum 2019, digitalt listat 2020 https://open.spotify.com/album/7vV3qV1NWMhOgOSxyzYdf3, mappat till båda albumformat i arkivet. Det är inte 2019 års separat tvåspåriga single med samma namn. Källor: https://electricassaultrecords.bandcamp.com/album/i-am-all och https://taiwaz.bandcamp.com/album/the-uninvited-guestn 2015, Spotify digitalt listad 2019 (de fyra äldre demon spelades in 1988/89); `The Uninvited Guest` år 2019 har sex albumspår och ska inte förväxlas med tvåspårssingel med samma namn. https://electricassaultrecords.bandcamp.com/album/i-am-all

The Ghoulies: svenska punkbandets *Communication* (2002) och *Reclaim the World* (2004), noga kontrollerade mot ghoulies.bandcamp.com. Tjänster kan felaktigt blanda ihop namnet med ett annat amerikanskt poppunkband.

The Good Honey Society: *Finally Something Burned Out Right* (2007) och *When Whenever Is a Dream* (ursprunglig 2008-skiva, Spotify 2017). Källa: https://www.joyzine.se/?p=2969 och upSwedens ursprungliga pressmaterial.

The Mist of Avalon: *Mist of Avalon* 1998, *Sleepless* EP 1999, *Here and After* 2000, *Tears* EP listad 2000/2001, *Dinya* original 2010 / Spotify katalogdatering 2011. Bandet är The Mist of Avalon från Uppsala, inte Alan Stivell eller namnlika artister.

The Unkinds: *Violence Is A Girl's Best Friend* (original 1998, arkiv återutgåva 2001), *Malizia Erotica* (2000) och *Juvenile Battlecries The Lost 97 Session + More* (2023), som innehåller äldre sessioner utan att vara en fysisk 1997-utgåva.

Third Storm: The Grand Manifestation 2018, https://open.spotify.com/album/42z9cl8yDOTgpMWnLyN7A8, och The Locust Mantra 2023, https://open.spotify.com/album/7C7U6OmKThNnE3mDBC0cXb, båda Spotify- och YouTube-mappade. Tarîtîya Me 2015 samt originaldemos 1987/88 saknar tillräckligt säker exakt streamingutgåva. Källa: https://darkdescentrecords.bandcamp.com/album/the-grand-manifestationnd Manifestation* 2018; tidigare *Tarîtîya Me* och senare *The Locust Mantra* 2023 ska ha unika utgåvekopplingar när exakta UUID:n har verifierats. https://darkdescentrecords.bandcamp.com/album/the-grand-manifestation

The Search: rätt Uppsalaband grundat av Razmig Tekeyan, verifierat genom bandets egen Bandcamp och Aenaos Records. Spotify-artist https://open.spotify.com/artist/1qKeXgsFl1puFe0uU6lCZz. 12 arkivutgåve-ID:n kopplade till 9 verifierade Spotify-originalalbum eller återutgåvor (2006, 2007/10, 2008, 2011, 2012, 2014, 2017, 2022 och 2024). Även YouTube Silhouette nu kopplad direkt till båda 2024-utgåvorna. Det namngivna 2004-debutalbumet och 2011 The Search For Connection Contact And Community saknar fortfarande säkert unikt Spotify-ID. Källa: https://thesearch.bandcamp.com/album/extras och https://aenaos-records.com/artists/the-search/

The 21st Impact: Sex arkivposter Spotify-mappade. Originalspåren från Second To None är exakt tio och finns på https://open.spotify.com/album/5G55W00SMSOljarWqrDQLo (ursprung 2002/04). By All Means Necessary är ursprungligen 13 spår och utgör SPÅR 1–13 i 23-spårsutgåvan https://open.spotify.com/album/7yTDpHEWbAfBigFMXmqfoK, där spår 14–23 är tidigare Second To None. Två fysiska 2006-utgåvor får tydlig notering att streamen är en utökad version. Arkivets 2008 kombinationsutgåva har samma kompletta 23-spårsprogram.nslagen tjugotrespårsström för *By All Means Necessary*/*Second To None*. Den är kopplad till arkivets kombinerade post, inte ursprungliga självständiga skivor.

The Next Autumn Soundtrack: 2003 split med Jeniferever, med två spår av Jeniferever och tre av The Next Autumn Soundtrack. Ingen full Spotifyalbum-id har tilldelats, eftersom andra bandets två spår inte får förvandlas till eget material. https://bsmrocks.bandcamp.com/album/split-ep

Totalitär: externt Hudiksvallband med en äldre split-LP i arkivet; nytt album 2026 får inte automatiskt mappas till äldre 1995 splitten. https://totalitaer.bandcamp.com/album/s-t

Treebeard: redan 56 band-/albumkopplade klipp på SwahnSong Productions, bibehålls oförändrade; inga dubbletter skapade.

The Spacebitch: 2000–2002 fyra registrerade utgåvor; inget tillräckligt unikt direkt Spotify/YouTube-ID upphittades, trots identifierade originalpressningar och medverkan på Turbonegro-tributskivor.

Övriga T-band: Taiwaz, Team Custard, Terminal Function, The 21st Impact, The Appelkarters, The Depth Consists, The Dishonest Few, The Everdawn, The Ghoulies, The Good Honey Society, The Hidden, The Lurking Fear, The Mist of Avalon, The Next Autumn Soundtrack, The Royal Beat Conspiracy, The Search, The Spacebitch, The Temple, The Unkinds, The Wheeler and the Farmer, Third Storm, Three Mile Smile, Thy Steamroller, Times Square Preachers, Tina & Teddy, Totalitär, Totuus, Tradore, Trapdoor Fucking Exit, Treebeard, Trigger Happy, TT Reuter, Twilight. Vissa är externa relaterade band eller saknar egen utgåva. Lämna dem omappade tills unik album-/medie-ID kan beläggas.


## Dokumenterade kvarstående forskningsluckor

Fullständig strömning finns inte för samtliga 84 originalposter. Äldre demo- och splitkassetter från The Spacebitch, Team Custard, Taiwaz tidiga inspelningar, Third Storm 1987/88 och några andra T-band är inte falskt kopplade till nyare album. Externa relaterade band eller T-band utan registrerade album lämnas också utan gissade original-Spotify-ID:n.

**Särskilt:** The Next Autumn Soundtracks 2003 delade EP med Jeniferever innehåller musik från två band och får inte behandlas som enbart The Next Autumn Soundtracks inspelning. The Searchs namnlika debut 2004 saknar exakt verifierat Spotify-ID. Third Storm *Tarîtîya Me* saknar exakt säkert Spotify-utgåve-ID. *The Mist of Avalon – Sleepless* har korrekt verifierad originalvideo men separat Spotify-EP-ID kunde inte styrkas. The Unkinds äldre album har autentiska YouTube-uppladdningar men saknar verifierade egna original-Spotifyalbum-ID:n.

## Kod och publicering

- [Spotify: huvuddatan](https://github.com/sweehockey-svg/swnworks-site/blob/main/UPPSALAHARDROCKSARKIV/spotify-links.js)
- [YouTube: T-komplettering](https://github.com/sweehockey-svg/swnworks-site/blob/main/UPPSALAHARDROCKSARKIV/youtube-links-t.js)
- [YouTube: befintlig katalog inklusive Treebeard](https://github.com/sweehockey-svg/swnworks-site/blob/main/UPPSALAHARDROCKSARKIV/youtube-links.js)
- [Publicerad HTML](https://github.com/sweehockey-svg/swnworks-site/blob/main/UPPSALAHARDROCKSARKIV/index.html)
- [Arkivet](https://swnworks.se/UPPSALAHARDROCKSARKIV/)

**Status:** Bokstav T är genomgången för musiklänkning. Alla belagda kopplingar ovan ligger i GitHub och kan läsas genom publicerade JS-filer. Dokumenterade forskningsluckor kvarstår för material som inte går att verifiera. **Nästa bokstav: U.**
