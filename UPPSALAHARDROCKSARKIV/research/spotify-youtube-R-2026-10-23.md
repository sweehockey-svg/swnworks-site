# Spotify / YouTube – R (2026-10-23)

**Omfattning:** Samtliga 6 band med namn på R i Supabase-projekt `fqygdpzyqqguyaujdhjq`: R.A.W., Råskit, Reptile, Reveal!, Royal Big Band och Rue Morgue. Spotify- och YouTube-källor matchades mot arkivets `bands` / `releases` / `release_bands` och där det fanns låtlistor även `release_tracks`.

**Resultat:** **22 befintliga utgåveposter**, **1 ny Spotify-artist**, **7 Spotify UUID→album-kopplingar** som motsvarar **4 unika album**, **32 YouTube band/release/videokopplingar** som motsvarar **19 unika video-ID:n**. Ingen artist eller utgåva har skapats i Supabase, eftersom arbetsuppgiften här gäller strömning och verifierade medielänkar. Alla kopplingar sparades till GitHub `main` i `UPPSALAHARDROCKSARKIV/spotify-links.js` och `youtube-links.js`. Webbversion: **2.64**.

## Band för band

| Band | Supabase-utgåvor | Spotify | YouTube |
| --- | ---: | --- | --- |
| **R.A.W.** | 8 | Ingen tryggt verifierad R.A.W.-profil för *rätt* svenskt AOR-band | 5 olika videor, 10 utgåvekorskopplingar |
| **Råskit** | 1 | Ingen verifierad exakt Spotifyutgåva | 1 full samlingsskiva innehållande endast 1 låt av Råskit; `multipleArtists:true` |
| **Reptile** | 2 | Ingen verifierad originaldemo | Inga tillräckligt säkra video-ID:n |
| **Reveal!** | 10 | 1 artist, 4 verifierade album över 7 formatposter | 13 olika videor, 21 utgåvekorskopplingar |
| **Royal Big Band** | 0 | Ingen verifierad exakt relaterad profil | Inga |
| **Rue Morgue** | 1 | Ingen verifierad originalinspelning | Inga |

## Reveal! – identitet och Spotify

**Uppsalabandet Reveal!** visas som **Reveal** (utan utropstecken) på Spotify. Identifieringen är starkt verifierad genom de fyra originalalbumens titlar, årtal och **fullständiga spårlistor**, bandets egna Bandcamp, Sepulchral Voice Records och Encyclopaedia Metallum.

Artistprofil: https://open.spotify.com/artist/2dkiROdMEKXaAk4eXHsS6T

| Verifierat album | Album-ID | Arkivposter / originalformat |
| --- | --- | --- |
| *Nocturne of Eyes and Teeth (Original)*, 2011 (7 låtar) | `6Scn8C9CdqACVEAaOPKwUS` | 2011 vinyl `74f9d6d8-d094-41b5-b67e-271fc8ca6dbe`, 2012 CD `5eb1b28a-6a9d-4edd-93c6-0ad8b2fdbf91` |
| *Flystrips*, 2016 (8 låtar) | `5v5O2A2UuW2uZyxycKpxpa` | 2016 digital `bb43d934-b0ea-43e9-a228-e069ff810a9a` |
| *Scissorgod*, 2019 (9 låtar) | `0nv9X4V4o5et55HozfYKk7` | 2019 digital `3952936d-6dd4-4fe6-94e6-b7fc726bc167` |
| *Doppelherz*, 2021 (10 låtar) | `0Dt9yibJgJN5QPRL2Vk47g` | 2021 CD `245f4efc-ff0c-46fc-adb7-17cfc7ab84e4`, vinyl `547aec03-ace3-4a72-afcd-481a2761b097`, digital `3abb38e2-e82b-46ae-9ffb-c023964a501c` |

**Viktigt:** CD och LP betyder inte att Spotify har en separat CD-/LP-master. Länkarna pekar till en gemensam verifierad strömmande inspelning. 2012 är en CD-återutgåva av 2011 års album. 2021 års `Some Marionettes, Some Kites (A Few Knives)` finns som albumspår, men det **bevisar inte** ett separat Spotify-ID för den fysiska 7-tumssingeln. Detsamma gäller 2016 och 2018 års separata Reveal!-vinylsinglar, vars egna Spotifyutgåvor inte har verifierats och därför inte är felmappade till samma låt på ett album.

Primärkällor: https://reveal-svr.bandcamp.com/album/flystrips ; https://reveal-svr.bandcamp.com/album/doppelherz ; https://invictusproductions666.bandcamp.com/album/nocturne-of-eyes-and-teeth ; https://sepulchralvoice.de/index2.htm

Spotify kontrollerat via de exakta inbäddade albumlänkarna:
- https://open.spotify.com/embed/album/6Scn8C9CdqACVEAaOPKwUS
- https://open.spotify.com/embed/album/5v5O2A2UuW2uZyxycKpxpa
- https://open.spotify.com/embed/album/0nv9X4V4o5et55HozfYKk7
- https://open.spotify.com/embed/album/0Dt9yibJgJN5QPRL2Vk47g

### Reveal! – 13 verifierade YouTube-id:n

| Låt / klipp | ID | Typ | Kända visningar vid sökning |
| --- | --- | --- | ---: |
| Nocturne of Eyes and Teeth (hela albumet) | `snpz6d5FfH4` | album | cirka 933 |
| Flowers & Bones (från 2011) | `EQbRSJMIUoA` | låt | inte säkert uppmätt |
| Flystrips (hela albumet) | `zZieCv_eKdk` | album | cirka 13 000 |
| I Am Going To Eat You (2016) | `pY6qBBU-RZc` | låt | cirka 165 |
| Stale Smoke (2016 studioinspelning) | `4Dk78kUHhzQ` | låt | cirka 78 |
| Scissorgod (hela albumet) | `66i9DSwhQnk` | album | cirka 5 600 |
| Scissorgod (albumets titelspår) | `_yp-5kkeJ5s` | låt | ej uppmätt |
| Harder Harder | `VUwBdpxp5T0` | låt / skivbolagsuppladdning | ej uppmätt |
| Clevermouth (officiell video) | `4l7BxuxEo6M` | låt / officiell video | ej uppmätt |
| Decomposer | `Oo-j4STyojc` | låt / inofficiell video | ej uppmätt |
| Doppelherz (hela albumet) | `AV02FItD_l8` | album / officiell skivbolagsuppladdning | cirka 19 000 |
| Cokkkfights | `k_hKC-q6SXo` | låt / officiell skivbolagsuppladdning | cirka 6 700 |
| Inshallah | `bQPoNdm9DQQ` | låt / officiell Topic-distribution | ej uppmätt |

**Bandförhandsvisningen väljer `Cokkkfights`, cirka 6 700 visningar**, högsta registrerade mätbara **enskilda låtklipp** för bandet, inte de hela albumuppladdningarna. Alla utgåvor får klipp som faktiskt hör till deras material. Videovisningar är manuella sökögonblicksbilder och inte livemätning.

## R.A.W. – rätt svenskt band

Det är **R.A.W. från Uppsala** med Bo och Anders Lindmark (tidigare kopplade till Dalton). Inte R.A.W. (DJ/hiphop), inte ett senare tjeckiskt metalband. Originalen är `First` från 1995 och `Now We're Cookin'` från 1997. `First` återutgavs på CD 2004 med två bonuslåtar; andra albumet finns som vanlig och multimedie-CD i arkivet.

- Verifierad originalskiva 1995: https://www.fwoshm.com/index/R/1748-raw-swe/2920-first
- Verifierad skiva 1997 med multimediedel: https://www.fwoshm.com/index/R/1748-raw-swe/2941-now-were-cookin
- 2004-reissue extra spår: https://heavyharmonies.com/cgi-bin/glamcd.cgi?BandNum=2886&CDName=First

| Låt | YouTube-ID | Ca visningar | Kopplade till |
| --- | --- | ---: | --- |
| Don't Tell Me Lies | `06y0vXW57hQ` | 6 100 | First 1995 och återutgåvan 2004 |
| Ran Out Of Love | `OSxdbdqihls` | 3 800 | First 1995 och återutgåvan 2004 |
| Too Hot To Handle | `KuTCaYVaGsg` | 1 700 | First 1995 och återutgåvan 2004 |
| Touch Of Love (med Zia Lindberg) | `uZp-ro832fk` | 652 | First 1995 och återutgåvan 2004 |
| 7 Wonders | `rp4ptgJg-pA` | 1 100 | Now We're Cookin' 1997 (båda CD-varianterna) |

**Bandförhandsvisningen blir `Don't Tell Me Lies`, cirka 6 100 visningar.** Spotify: samtliga R.A.W.-identiteter som gav träffar granskades mot bandets verkliga medlemmar, album och årtal, men inget säkert originalalbum-ID för denna grupp fanns; inget Spotify-ID hittades på.

## Råskit – 1996 samlingsskiva

- Registrerad originalutgåva: `Uppsala Crust Compilation`, 1996, UUID `e83e585d-5273-4d20-b080-0650d20d37e9`.
- Verifierad full uppladdning av samlingsskivan: https://www.youtube.com/watch?v=h2FYEBNWEic
- Råskit har **endast spår 15 `Maze Of Pain`** på 15-spårsutgåvan; övriga spår hör till andra band.
- YouTube-länken är därför `kind:'album', multipleArtists:true`: den får finnas på **utgåvesidan**, men får inte generera en bandförhandsvisning som felaktigt utger alla kompilationens låtar för Råskit.
- Ingen verifierad Spotifyprofil eller Spotifyalbum-ID för denna exakta compilation. Källor: https://rateyourmusic.com/release/ep/various-artists/uppsala-crust-compilation/ och https://colnect.com/et/music_records/music_record/1107216-Various_Uppsala_Crust_Compilation .

## Reptile

1982 och 1984 demo från **Uppsala**, inte namnlika senare artister från Portugal, Ukraina och Sydamerika. Demokassetterna är dokumenterade i https://www.metal-archives.com/bands/Reptile/3540274040 och http://heavymetalrarities.com/forum/viewtopic.php?f=19&t=19131 . 1984-demon har osäkra enskilda titlar (`Killer` och `Nuclear War` har cirkulerat). Inga säkra unika Spotifyalbum-ID:n eller YouTube-video-ID:n för inspelningarna hittades.

## Rue Morgue

Från Uppsala, efterföljare till **Tradore** 1988. Den 4-spåriga PortaStudio-demon *Pavor Nocturnus* omnämns i *Metal Guardians* fanzine; **The Defcon Five** är belagt som första spår. Ingen uppenbart identisk Spotify/YouTube-originalinspelning identifierad. Använd inte senare `Rue Morgue`-namnliknande soundtrack, filmer eller helt andra band.

Källa: https://www.metal-archives.com/bands/Tradore/68676

## Royal Big Band

Ett externt, Stockholmsbaserat band som finns som relaterad person-/bandkoppling utan några registrerade utgåvor. Inga verifierade originalskivor eller digitala Spotify-/YouTube-ID:n. Ingen gissning.

## Framåtblick och status

**Bokstav R är genomgången** för Spotify/YouTube-länkning och forskningsluckor. Avsaknad av originalstream för Reptile, Rue Morgue, Royal Big Band och de äldre enskilda 7-tumssinglarna markeras som just avsaknad, inte som en färdigställd fullständig inspelningsdiskografi. 

**Nästa bokstav: S.**
