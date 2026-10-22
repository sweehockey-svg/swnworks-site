# Två kommentatorer i Match-TV

1. Visa först en match i sändning. Under scenknapparna finns **Kommentator 1** och **Kommentator 2**.
2. Skapa en länk i varje panel och skicka en länk privat till varje person. Länkarna är personliga mikrofonbehörigheter för respektive plats. Dela dem inte i chatten eller sändningen.
3. Varje person öppnar sin egen länk, använder hörlurar och klickar **Starta kommentering**. Ingen mikrofon startar automatiskt.
4. På kommentatorsidan: klicka **Lyssna på kommentering** under **Medhörning · kollegan**. Där hörs bara den andra kommentatorn. Den egna rösten matas inte tillbaka digitalt. Hörlurar behövs för att undvika akustiskt eko.
5. Studion kan styra varje mikrofons nivå och mute separat så länge fliken som skapade länkarna är kvar. Kommentatorn kan också tysta sin egen mikrofon. Medhörningens volymreglage ändrar bara den egna lyssningen.
6. Tittarna kan välja **Lyssna på båda kommentatorerna** och justera röstvolym och eventuell fördröjning per röst. Rösterna blandas med gemensam dynamikbegränsning.
7. **Stoppa** i en studiopanel avslutar bara den platsen och återkallar länken. **Avsluta sändning** avslutar båda. Kommentatorsidor kontrollerar återkallade platser var tredje sekund. Länkar gäller i högst sex timmar.

## Viktigt

- Detta skickar kommentatorsljud till **Match-TV**. OBS/Twitchs vanliga mikrofonkanaler ändras inte. Skicka inte samma röst via både matchstreamen och den separata kommenteringen; det kan ge dubbelt ljud.
- **Starta mikrofon här** i studion är en riktig sändande mikrofon, inte en lokal provlyssning. Använd högst en lokal mikrofonplats i samma studioflik. Skicka den andra länken till kollegan.
- En länk ska bara användas i en sändande flik åt gången. Försök med samma plats i en andra flik blockeras när en befintlig mikrofon upptäcks.
- Efter omladdning kan mikrofonen behöva startas igen. Studion sparar inga privata signeringsnycklar. Vill du skapa nya länkar efter omladdning får du bekräfta att den gamla tvåkommentatorsessionen ersätts. Avsluta sändning fungerar även då.
- Källans videofördröjning kan skilja mellan datorer. Gör ett riktigt prov med båda personerna och en tittare före matchen. Medhörningen är direkt och ska inte fördröjas tillsammans med tittarljudet.
- Testat med syntetiska röster över riktiga lokala WebRTC-anslutningar. Realtime och TURN-svar var mockade i det automatiska testet. Testet verifierar inte verklig nätfördröjning, headset eller TURN-relä genom olika internetanslutningar.

## Teknik

Två separat signerade mikrofonplatser använder samma befintliga signaleringsrum. Varje plats har egen ECDSA-nyckel. TURN-förfrågningar signeras med rummets befintliga överordnade behörighet. Publikt tillstånd innehåller bara rums-ID, publika nycklar och giltighetstid; privata nycklar finns endast i minnet och privata länkfragment. Inga nya databasbehörigheter, tabeller eller lagrade ljudfiler införs.

