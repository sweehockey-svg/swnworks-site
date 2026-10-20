# Flacken – scenval med Stream Deck (Windows)

Detta byter grafikscen i SWNWORKS Broadcast Studio, inte scen i OBS. Din vanliga OBS-scen och mikrofon ligger kvar. Ingen extra Stream Deck-plugin behövs; använd System → Hotkey.

## Logga in och förbered

1. Öppna https://swnworks.se/broadcast-studio/mobile.html i din vanliga webbläsare på datorn med Stream Deck.
2. Logga in med ditt eget godkända konto. Öppna mejlets inloggningslänk i samma webbläsare. Dela inte länken eller några koder.
3. Eric förbereder matchen i huvudstudion och skickar den till sändning. Vänta tills scenväljaren visar ANSLUTEN och rätt match.
4. Låt scenväljaren vara den aktiva fliken med fokus. Klicka i sidans bakgrund, inte adressfältet. Det räcker INTE att sidan syns på en andra skärm om OBS är det aktiva fönstret.

## Lägg knappar i Stream Deck

Öppna Stream Deck-programmet. Dra **System → Hotkey** till en tom knapp. Ge den ett namn och ange kombinationen nedan. Upprepa för de knappar du vill ha. Använd vanliga Hotkey, inte Hotkey Switch eller OBS Scene.

Alla kombinationer använder **Ctrl + Alt + Shift** tillsammans med siffran på tangentbordets övre sifferrad (inte numpad).

| Knappnamn | Kortkommando |
| --- | --- |
| Opening | Ctrl + Alt + Shift + 1 |
| Match Live | Ctrl + Alt + Shift + 2 |
| Lineup hemma | Ctrl + Alt + Shift + 3 |
| Lineup borta | Ctrl + Alt + Shift + 4 |
| Tabell | Ctrl + Alt + Shift + 5 |
| Stats | Ctrl + Alt + Shift + 6 |
| Lagduell | Ctrl + Alt + Shift + 7 |
| Paus | Ctrl + Alt + Shift + 8 |
| Matchup | Ctrl + Alt + Shift + 9 |

## Test före sändningen

Testa när ni INTE är live: klicka i scenväljaren och tryck kortkommandot på tangentbordet först. Kontrollera aktiv scen på sidan och bilden i OBS. Testa sedan samma knapp på Stream Deck. Testa även hemma/borta separat.

Stream Deck-knapparna visar inte automatiskt aktuell scen. Läs bekräftelsen på scenväljaren och kontrollera OBS. Om både du och Eric byter scen gäller senaste bekräftade scenbytet. Använd båda scenväljaren för scenbyten; samordna övriga ändringar i huvudstudion.

## Om inget händer

- Klicka i scenväljarens sida igen. OBS eller adressfältet får inte ha fokus. Den här första varianten fungerar inte i bakgrunden.
- Kontrollera att sidan visar ANSLUTEN och rätt match. Offline, utloggning eller utgångna matchdata låser knapparna.
- Testa tangentbordskombinationen manuellt. Se till att ingen annan app använder samma genväg.
- Om det fortfarande inte fungerar: använd sidans vanliga scenknappar eller mobilen. Ändra inga kontobehörigheter eller lösenord.

OBS-backupen är separat: din vanliga matchkälla och mikrofon ska finnas kvar. Testa i förväg att dölja SWNWORKS-webbläsarkällan och kontrollera både bild och ljud; undvik dubbelt matchljud.

Tillverkarens guide: https://www.elgato.com/ch/en/explorer/products/stream-deck/how-to-set-up-stream-deck-hotkeys/
