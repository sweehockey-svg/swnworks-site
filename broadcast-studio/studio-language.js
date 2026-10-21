/* Shared director controls use the same implementation in every language. */
(() => {
 'use strict';
 const lang=(document.documentElement.lang||'sv').slice(0,2).toLowerCase(),index={en:0,fi:1,de:2}[lang];
 const rows={
 'FÖRHANDSVISNING · FÖRBEREDD MATCH':['PREVIEW · PREPARED MATCH','ESIKATSELU · VALMISTELTU OTTELU','VORSCHAU · VORBEREITETES SPIEL'],
 'SÄNDNING · MATCHVAL':['BROADCAST · MATCH SELECTION','LÄHETYS · OTTELUVALINTA','SENDUNG · SPIELAUSWAHL'],
 'Visa förberedd match i sändning':['Take prepared match live','Näytä valmisteltu ottelu lähetyksessä','Vorbereitetes Spiel senden'],
 'Förbered en match och klicka Visa i sändning när den ska visas.':['Prepare a match, then take it live when ready.','Valmistele ottelu ja näytä se lähetyksessä, kun olet valmis.','Spiel vorbereiten und anschließend live senden.'],
 'SPARADE MATCHER':['SAVED MATCHES','TALLENNETUT OTTELUT','GESPEICHERTE SPIELE'],
 'FÖRBERED MATCH':['PREPARE MATCH','VALMISTELE OTTELU','SPIEL VORBEREITEN'],
 'Ny match':['New match','Uusi ottelu','Neues Spiel'],
 'Förbered ny match':['Prepare new match','Valmistele uusi ottelu','Neues Spiel vorbereiten'],
 'Valet här ändrar bara förhandsvisningen. Matchen i sändning ligger kvar tills du klickar Visa i sändning.':['This changes only the preview. The on-air match stays until you take the prepared match live.','Valinta muuttaa vain esikatselua. Lähetyksen ottelu säilyy, kunnes vaihdat sen.','Diese Auswahl ändert nur die Vorschau. Das laufende Spiel bleibt bis zur Übernahme bestehen.'],
 'Design · bakgrund och grafik':['Design · background and graphics','Ulkoasu · tausta ja grafiikka','Design · Hintergrund und Grafik'],
 'Slutspelsserie':['Playoff series','Pudotuspelisarja','Playoff-Serie'],
 'Kommentatorsbilder':['Commentator portraits','Selostajien kuvat','Kommentatorenbilder'],
 'Laguppställningar':['Lineups','Kokoonpanot','Aufstellungen'],
 'Spela in matchen':['Record match','Tallenna ottelu','Spiel aufzeichnen'],
 'Vänteskärm · nästa match':['Waiting screen · next match','Odotusruutu · seuraava ottelu','Wartebild · nächstes Spiel'],
 'Fler scener':['More scenes','Lisää näkymiä','Weitere Szenen'],
 'Sparade matcher · snabbval':['Saved matches · quick selection','Tallennetut ottelut · pikavalinta','Gespeicherte Spiele · Schnellauswahl'],
 'STREAM · FÖRBEREDD MATCH':['STREAM · PREPARED MATCH','STRIIMI · VALMISTELTU OTTELU','STREAM · VORBEREITETES SPIEL'],
 'Ladda streamen och spara tillsammans med lag och resultat ovan.':['Load the stream and save it with the teams and score above.','Lataa striimi ja tallenna se joukkueiden ja tuloksen kanssa.','Stream laden und mit Teams und Ergebnis oben speichern.'],
 'Stream i förhandsvisning':['Stream in preview','Striimi esikatselussa','Stream in der Vorschau'],
 'Förbered Twitch eller direktvideo här. Visa i sändning byter utgående match.':['Prepare Twitch or direct video here. Taking it live changes the on-air match.','Valmistele Twitch tai suora video tässä. Lähetykseen siirto vaihtaa lähetettävän ottelun.','Twitch oder Direktvideo vorbereiten. Erst die Übernahme ändert das gesendete Spiel.'],
 'MATCHFEED · UTAN GRAFIK':['MATCH FEED · WITHOUT GRAPHICS','OTTELUKUVA · ILMAN GRAFIIKKAA','SPIELBILD · OHNE GRAFIK'],
 'Ladda en stream nedan för att följa matchen.':['Load a stream below to follow the match.','Lataa striimi alta seurataksesi ottelua.','Unten einen Stream laden, um das Spiel zu verfolgen.'],
 'Visas bara i studion · fortsätter vid scenbyte · ljud av som standard':['Studio only · continues across scene changes · muted by default','Vain studiossa · jatkuu näkymää vaihdettaessa · oletuksena mykistetty','Nur im Studio · läuft bei Szenenwechsel weiter · standardmäßig stumm'],
 'Avsluta sändning':['End broadcast','Lopeta lähetys','Sendung beenden'],
 'Ingen match just nu · PÅ – klicka för att återgå till sändning':['Waiting screen · ON – click to resume','Odotusruutu · PÄÄLLÄ – jatka napsauttamalla','Wartebild · AN – zum Fortsetzen klicken'],
 'Ingen match just nu · AV':['Waiting screen · OFF','Odotusruutu · POIS','Wartebild · AUS'],
 'Ingen match just nu':['No match right now','Ei ottelua juuri nyt','Derzeit kein Spiel'],
 'Match-TV visar vänteskärm.':['Match-TV is showing the waiting screen.','Match-TV näyttää odotusruudun.','Match-TV zeigt das Wartebild.'],
 'Spara som ny match':['Save as new match','Tallenna uutena otteluna','Als neues Spiel speichern'],
 'Uppdatera vald match':['Update selected match','Päivitä valittu ottelu','Ausgewähltes Spiel aktualisieren'],
 'Alternativa Twitch-kanaler · valfritt':['Alternative Twitch channels · optional','Vaihtoehtoiset Twitch-kanavat · valinnainen','Alternative Twitch-Kanäle · optional'],
 'EN KANAL PER RAD':['ONE CHANNEL PER LINE','YKSI KANAVA RIVILLE','EIN KANAL PRO ZEILE'],
 'MATCHNAMN':['MATCH NAME','OTTELUN NIMI','SPIELNAME'],
 'Hämta från SportsGamer':['Fetch from SportsGamer','Hae SportsGamerista','Von SportsGamer laden'],
 'STATISTIK & TABELL · SÄKER UPPDATERING':['STATISTICS & STANDINGS · SAFE UPDATE','TILASTOT JA SARJATAULUKKO · TURVALLINEN PÄIVITYS','STATISTIK & TABELLE · SICHER AKTUALISIEREN'],
 'Uppdatera statistik & tabell':['Update statistics & standings','Päivitä tilastot ja sarjataulukko','Statistik und Tabelle aktualisieren'],
 'Använd uppdaterad statistik i sändning':['Apply updated statistics on air','Käytä päivitettyjä tilastoja lähetyksessä','Aktualisierte Statistik übernehmen'],
 'Ingen uppdatering väntar.':['No update pending.','Ei odottavaa päivitystä.','Keine Aktualisierung ausstehend.'],
 'Kasta uppdateringen':['Discard update','Hylkää päivitys','Aktualisierung verwerfen'],
 'Granska nytt underlag':['Review new data','Tarkista uudet tiedot','Neue Daten prüfen'],
 'NÄSTA MATCH · ENDAST MATCH-TV':['NEXT MATCH · MATCH-TV ONLY','SEURAAVA OTTELU · VAIN MATCH-TV','NÄCHSTES SPIEL · NUR MATCH-TV'],
 'HEMMALAG':['HOME TEAM','KOTIJOUKKUE','HEIMTEAM'],
 'BORTALAG':['AWAY TEAM','VIERASJOUKKUE','AUSWÄRTSTEAM'],
 'DATUM':['DATE','PÄIVÄMÄÄRÄ','DATUM'],
 'STARTTID · SVENSK TID':['START TIME · SWEDISH TIME','ALKAMISAIKA · RUOTSIN AIKA','BEGINN · SCHWEDISCHE ZEIT'],
 'Visa Nästa match på Match-TV':['Show next match on Match-TV','Näytä seuraava ottelu Match-TV:ssä','Nächstes Spiel auf Match-TV anzeigen'],
 'MIKROFON TILL MATCH-TV · BETA':['MATCH-TV MICROPHONE · BETA','MATCH-TV MIKROFONI · BETA','MATCH-TV MIKROFON · BETA'],
 'Skapa länk till kommentator':['Create commentator link','Luo selostajan linkki','Kommentatorenlink erstellen'],
 'Testa mikrofon här':['Test microphone here','Testaa mikrofonia tässä','Mikrofon hier testen'],
 'Starta kommentering':['Start commentary','Aloita selostus','Kommentar starten'],
 'Mikrofon av':['Microphone off','Mikrofoni pois','Mikrofon aus'],
 'Tysta mikrofon':['Mute microphone','Mykistä mikrofoni','Mikrofon stummschalten'],
 'Stoppa':['Stop','Pysäytä','Stoppen'],
 'Ingen stream laddad':['No stream loaded','Striimiä ei ole ladattu','Kein Stream geladen'],
 'Ingen statistik hämtad. Klicka Hämta från SportsGamer.':['No statistics fetched. Click Fetch from SportsGamer.','Tilastoja ei ole haettu. Napsauta Hae SportsGamerista.','Keine Statistik geladen. Auf Von SportsGamer laden klicken.'],
 'Ingen aktuell statistik i denna session. Hämta från SportsGamer.':['No current statistics in this session. Fetch from SportsGamer.','Tässä istunnossa ei ole ajantasaisia tilastoja. Hae SportsGamerista.','Keine aktuellen Daten in dieser Sitzung. Von SportsGamer laden.'],
 'Hämta i bakgrunden och granska här. Sändningen ändras först när du godkänner. Scen, resultat, laguppställning, bild och ljud behålls.':['Fetch in the background and review here. Nothing goes on air until you approve. Scene, score, lineup, video and audio are preserved.','Hae taustalla ja tarkista tässä. Lähetys muuttuu vasta hyväksynnän jälkeen. Näkymä, tulos, kokoonpano, kuva ja ääni säilyvät.','Im Hintergrund laden und hier prüfen. Erst nach Bestätigung übernehmen. Szene, Ergebnis, Aufstellung, Bild und Ton bleiben erhalten.'],
 'Sändningen är avslutad. Video och kommentering är stoppade. Sparade matcher finns kvar.':['Broadcast ended. Video and commentary have stopped. Saved matches are retained.','Lähetys on päättynyt. Video ja selostus on pysäytetty. Tallennetut ottelut säilyvät.','Sendung beendet. Video und Kommentar sind gestoppt. Gespeicherte Spiele bleiben erhalten.'],
 'Kunde inte avsluta sändningen. Kontrollera anslutningen och försök igen.':['Could not end the broadcast. Check the connection and try again.','Lähetystä ei voitu lopettaa. Tarkista yhteys ja yritä uudelleen.','Sendung konnte nicht beendet werden. Verbindung prüfen und erneut versuchen.'],
 'Pågående sändning återställd. Kontrollera när statistiken hämtades eller hämta på nytt.':['Current broadcast restored. Check the statistics timestamp or fetch again.','Käynnissä oleva lähetys palautettiin. Tarkista tilastojen aikaleima tai hae uudelleen.','Laufende Sendung wiederhergestellt. Datenzeitpunkt prüfen oder erneut laden.'],
 'Förberedd match visas nu i sändningen.':['Prepared match is now on air.','Valmisteltu ottelu näkyy nyt lähetyksessä.','Vorbereitetes Spiel ist jetzt auf Sendung.'],
 'Matchen har inte bytts i sändning. Hämta aktuellt SportsGamer-underlag och försök igen.':['The on-air match was not changed. Fetch current SportsGamer data and try again.','Lähetyksen ottelua ei vaihdettu. Hae ajantasaiset SportsGamer-tiedot ja yritä uudelleen.','Das gesendete Spiel wurde nicht geändert. Aktuelle SportsGamer-Daten laden und erneut versuchen.'],
 'Kommentera i Match-TV':['Commentate on Match-TV','Selosta Match-TV:ssä','Auf Match-TV kommentieren'],
 'Slå på matchljud':['Enable match audio','Ota ottelun ääni käyttöön','Spielton einschalten'],
 'Stäng av matchljud':['Mute match audio','Mykistä ottelun ääni','Spielton ausschalten'],
 'Förbereder: ':['Preparing: ','Valmistellaan: ','In Vorbereitung: '],
 'I sändning: ':['On air: ','Lähetyksessä: ','Auf Sendung: '],
 'Avsluta sändningen? Video och kommentering stoppas i studion, OBS och Match-TV. Twitch-originalet och sparade matcher påverkas inte.':['End the broadcast? Video and commentary will stop in the studio, OBS and Match-TV. The original Twitch stream and saved matches are unaffected.','Lopetetaanko lähetys? Video ja selostus pysähtyvät studiossa, OBS:ssä ja Match-TV:ssä. Alkuperäinen Twitch-striimi ja tallennetut ottelut säilyvät.','Sendung beenden? Video und Kommentar werden im Studio, OBS und Match-TV gestoppt. Der Originalstream auf Twitch und gespeicherte Spiele bleiben unverändert.']
 };
 const text=value=>{
  if(index===undefined)return value;
  const trimmed=value.trim(),row=rows[trimmed];
  if(row)return value.replace(trimmed,row[index]);
  for(const prefix of ['Förbereder: ','I sändning: '])if(value.startsWith(prefix))return rows[prefix][index]+text(value.slice(prefix.length));
  return value;
 };
 window.BroadcastStudioLanguage={text};
 if(index===undefined)return;
 function translate(root){
  if(root.nodeType===3){if(!['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(root.parentElement?.tagName)){const next=text(root.data);if(next!==root.data)root.data=next;}return;}
  if(root.nodeType!==1||['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(root.tagName))return;
  for(const child of [...root.childNodes])translate(child);
 }
 const start=()=>{
  translate(document.body);
  document.documentElement.style.setProperty('--prepared-preview-label',JSON.stringify(rows['FÖRHANDSVISNING · FÖRBEREDD MATCH'][index]));
  new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')translate(record.target);else for(const node of record.addedNodes)translate(node);}}).observe(document.body,{subtree:true,childList:true,characterData:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
