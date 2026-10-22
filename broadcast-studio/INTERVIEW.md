# Ljudintervju i Match-TV

Två kommentatorer kan vara kvar medan en tredje person intervjuas. Ingen kamera används.

1. Visa en match i sändning. Under **INTERVJUGÄST**, välj **Skapa intervjulänk** och skicka den privat till gästen.
2. Gästen öppnar länken och startar mikrofonen. Hörlurar krävs för alla.
3. Kommentatorerna slår på **MEDHÖRNING · INTERVJUGÄST** på sina privata sidor. Gästen slår på medhörningen för de två kommentatorerna. Egen röst skickas aldrig tillbaka digitalt till den egna medhörningen.
4. Gästen börjar i väntrummet. Tittarna hör inte gästen där. **Kommentatorernas röster är fortfarande live** – diskutera inte privata uppgifter via deras mikrofoner utan att först tysta dem.
5. Välj **Ta in i sändning** när gästen ska höras. Tittaren använder **Lyssna på kommentering och intervju**, eller slår på intervjugästens röst separat. Röstfördröjning justeras separat hos tittaren.
6. **Ta ur sändning** tystar gästen hos tittarna men behåller privat medhörning. **Stoppa** på intervjuplatsen avslutar gästens länk/mikrofon utan att stoppa kommentatorerna. Avsluta sändning stoppar alla tre.

Behåll studiofliken öppen. Efter omladdning saknas de privata styrnycklarna; skapa nya länkar vid behov. Efter gästens egen mikrofonomstart måste studion först ta ur gästen ur sändning innan mikrofonen får startas igen.

Detta är Match-TV:s separata ljud. OBS/Twitchs mikrofonmix är oförändrad. Gör ett riktigt ljud- och synkprov från de aktuella uppkopplingarna före sändning. En extra röst kräver mer uppladdning och fler peeranslutningar. Gästmedhörningen räknas mot samma gräns på 50 anslutningar per mikrofon.

## Säkerhet och drift

- Inga mikrofoner startas vid sidladdning. Privata nycklar finns bara i minnet och länkfragmentet, aldrig i den offentliga sändningsinformationen.
- Gästplatsen är slot 2 och börjar alltid utanför sändning. Väntrummets mottagare måste signera både anslutning och SDP-svar med en aktuell kommentatorsnyckel. Ett offentligt `backstage:true` ger ingen åtkomst.
- Sändningsbeslut signeras med en separat producentnyckel som inte delas i någon inbjudan. TURN-rummets befintliga relänyckel ger inte rätt att ta in gästen. Gamla styrbeslut och fördröjda databasläsningar får inte upphäva ett senare ta-ur-beslut.
- Gästens utgående ljudspår är separata per mottagare. Ta ur sändning spärrar de offentliga spåren vid avsändaren, inte bara med en dold lyssnarknapp. Transport-/uppspelningsbuffertar kan ge en kort eftersläpning.
- Varje medhörning är en separat mottagare och blandas aldrig in i mikrofonens utgående signal. Fysiskt högtalarläckage förebyggs med hörlurar.
- Nyckelbyte, avslutad plats och sex timmars giltighet återanvänder befintlig återkallning. Avslutade kommentatorsnycklar förlorar även gästens privata medhörning vid nästa kontroll (normalt tre sekunder).
- Ingen databasändring, ny behörighet eller förändring av befintlig TURN-tjänst krävs. Lokala tester använder syntetiska toner och en simulerad signalserver, inte riktiga mikrofoner eller produktionsskrivningar. Riktig TURN/NAT och mänsklig ljudkvalitet måste provas separat.
