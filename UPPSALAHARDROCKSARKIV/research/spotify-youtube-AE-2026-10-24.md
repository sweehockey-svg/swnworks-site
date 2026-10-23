# Uppsala Hårdrocksarkiv – Spotify och YouTube: bokstav Ä

**Forskningsdag:** 2026-10-24  
**Supabase-projekt:** `fqygdpzyqqguyaujdhjq`  
**GitHub:** `sweehockey-svg/swnworks-site`, `main`  
**Webbversion:** V2.75  
**Bokstav efter Ä:** Ö

## Resultat

Vid kontroll mot den verkliga Supabase-databasen gav `left(lower(b.canonical_name),1) = 'ä'` **0 registrerade band** och därför **0 utgåvor**. Ingen alternativ Uppsalaanknuten hårdrocks-/metal-/punk-/hardcoregrupp med bandnamn på Ä kunde beläggas tillräckligt säkert genom extern band- och lokalarkivforskning.

| Kontroll | Antal |
|---|---:|
| Registrerade Ä-band vid start | 0 |
| Nya verifierat lokala Ä-band | 0 |
| Ä-utgåvor och arkivspår | 0 |
| Nya Spotify-artist-ID:n | 0 |
| Nya Spotify-album/UUID-kopplingar | 0 |
| Nya YouTube-video/UUID-kopplingar | 0 |

Noll avser **verifierade fynd i denna genomgång**, inte ett historiskt bevis för att inga Ä-band någonsin funnits i Uppsala. Om ett sådant band dokumenteras framöver ska Ä öppnas igen.

## Kontrollerade kandidater och namnförväxlingar

### Änglagård – ej registrerad som Uppsalaband

Den mest framträdande moderna Ä-träffen var progressiva rockbandet **Änglagård**, grundat **1991 i Stockholm** av Tord Lindman och Johan Högberg. Bandet spelade i **Ekeby/Disponentvillans park i Uppsala den 3 juli 1993**, men en Uppsala-konsert är inte belägg för Uppsalaursprung eller stadigvarande Uppsalakoppling på arkivets geografiska nivå.

- [Progressive Circus – Änglagård grundat i Stockholm](https://progressivecircus.com/pc-museum/announcements/anglagard/)
- [AllMusic – Änglagård, bildat 1991 i Stockholm](https://www.allmusic.com/artist/%EF%BF%BDnglag%C3%A5rd-mn0000308316)
- [Concert Archives – Änglagårds spelning i Uppsala 3 juli 1993](https://www.concertarchives.org/bands/anglagard?year=1993)

**Beslut:** Änglagårds Spotify, deras album *Hybris*, *Epilog* och *Viljans öga*, och deras videor ska **inte** läggas in som om bandet vore från Uppsala. En eventuell framtida person- eller konsertkoppling får undersökas separat.

### Övrig sökning

Sökt på kombinationer av **Ä**, **Uppsala**, **Uppland**, punk, rock, metal, hardcore, bandcamp, band samt namnvarianter såsom *Äckel*, *Ägg*, *Ärret*, *Ättestupa*, *Ängel*, *Ändhållplats* och *Ängst*. Resultaten gav huvudsakligen låttitlar, icke-musikaliska objekt, textrader, spelningar i Uppsala av andra orters band eller irrelevanta homonymer. Ingen verifierbar lokal originaldiskografi med Ä som första bokstav identifierades. Urvalsfrågan är därför lämnad öppen som forskningslucka utan påhittade uppgifter.

## Webbplats och teknisk detalj

GitHub innehåller två granskningstillägg:

- `UPPSALAHARDROCKSARKIV/youtube-links-ae.js` initierar `window.ARCHIVE_YOUTUBE` och anropar `push(...[])` utan nya videoposter. Äldre A–Å-kopplingar sparas.
- `UPPSALAHARDROCKSARKIV/spotify-links-ae.js` är avsiktligt utan nya artist- och albummappningar och lämnar tidigare Spotify-filer oförändrade.
- `UPPSALAHARDROCKSARKIV/index.html` höjt till **WEBB V2.75** och laddar de två Ä-filerna i bokstavsordning efter Å, före `app.js`.

### Viktig framtida kollisionsrisk: Å kontra Ä

Nuvarande `app.js` använder följande normalisering:

```js
function slugify(value = '') {
  return String(value).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' och ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
```

Detta gör att **`slugify('A')`, `slugify('Å')` och `slugify('Ä')` alla blir `a`**. Bandet Å lades in i föregående bokstav, och dess verifierade Spotify-ID ligger i `artists.a` samt YouTube-videorna har `band:'a'`. Ä-bokstavens tomma filer stör inte Å, men **ett framtida nytt band Ä får inte automatiskt tilldelas samma `artists.a` och video-slug**. Innan ett faktiskt Ä-band med namnkollision läggs till måste bandidentifieraren skiljas från den generiska normaliserade sluggen, exempelvis via exakt UUID eller en specifik musikslug för diakritiska enbokstavsnamn. Då måste länkarna för redan inlagda Å migreras konsekvent utan att påverka tidigare A–Z.

**Inget riskabelt generellt slug-/routing-ingrepp gjordes för en bokstav med noll band.**

## Kvalitetssäkring och nästa steg

- Supabase frågades direkt för alla band med originalnamn som börjar på Ä och visade tomt resultat.
- Publicerade musikfiler för A–Å ska bibehållas oförändrade; Ä-filerna ger noll nya matchningar.
- Spotify/YouTube original-ID hittades inte, alltså finns inga visningstal att ranka och ingen förhandsvisningslåt.
- Vid framtida lokal nykällforskning på Ä: kontrollera bandursprung, genre, originalmedlemmar och minst en utgåva innan skapande, sedan spårordning och digital identitet för utgåvans UUID.
- **Nästa alfabetbokstav: Ö.** Kontrollera den mot Supabase först.

**Slutsats: bokstav Ä är systematiskt granskad med dokumenterad nollträff, och nästa bokstav är Ö.**
