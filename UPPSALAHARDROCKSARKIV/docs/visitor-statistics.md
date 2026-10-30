# Privat besöksstatistik för Uppsala Hårdrocksarkiv

Statistiken samlas från och med aktiveringen 2026-10-30. Äldre besök återskapas inte.

## Öppna statistiken

Logga in på [Supabase-projektet](https://supabase.com/dashboard/project/fqygdpzyqqguyaujdhjq/editor).
I Table Editor, välj schemat public och någon av vyerna:

- archive_traffic_overview: idag, senaste 7 och 30 dagarna, denna månad.
- archive_traffic_daily: besök och sidvisningar per datum.
- archive_traffic_weekly: per vecka, med måndag som start.
- archive_traffic_monthly: per månad.
- archive_traffic_pages: populära sidor, kategori och länk till sidan.
- archive_traffic_sources: hänvisande tjänster som Google och Facebook.

Alternativt öppna [SQL Editor](https://supabase.com/dashboard/project/fqygdpzyqqguyaujdhjq/sql/new) och kör:

```sql
select * from public.archive_traffic_overview;
select * from public.archive_traffic_pages limit 30;
select * from public.archive_traffic_sources;
```

Vyerna kan läsas av projektets administratörer i Supabase. De kan inte läsas med webbplatsens publika nyckel eller av en vanlig inloggad webbplatsanvändare.

## Vad siffrorna betyder

- **Besök:** en ny öppning av dokumentet, även vid omladdning. Inga unika personer eller sessioner identifieras.
- **Sidvisning:** den första sidan plus faktiska ändringar av arkivets hash-adress. Två signaler för samma adress räknas bara en gång.
- Språkbyte, filter och sökningar räknas inte som nya besök.
- Söksidan lagras endast som /sok, utan sökord. Kontaktvägar sammanförs till /kontakt.
- Dokumentöppningar som sker genom direktlänk till en bandsida hör också till besöken.
- Datum följer Europe/Stockholm, inklusive sommartid.
- En utebliven referrer visas som Direkt / okänd källa. Webbläsare och appar kan dölja den riktiga källan.
- Do Not Track, Global Privacy Control och blockerad mätning gör att vissa besök inte räknas.
- Egna kontroller och automatiserade webbläsare kan ingå. Siffrorna är användningsstatistik, inte ett exakt personantal.

## Data och åtkomst

Endast dag, typ av räknare, sanerad sidväg, källkategori och totalsumma sparas. Inga råa händelser, besökar-ID:n, IP-adresser, fullständiga hänvisningsadresser, sökord eller formulärtexter lagras i statistiken.

Inga mätcookies eller andra mätidentifierare skapas i webbläsaren. Driftleverantörens tekniska loggar är separata från denna statistik.

Edge-funktionen archive-traffic validerar sidans befintliga publika API-nyckel, Origin, metod, storlek och innehåll. Den använder backend-nyckeln endast på servern. Det publika gränssnittet kan bara lämna räknaruppgifter; det lämnar aldrig ut statistik eller arkivdata.

Tabellen har RLS, saknar publika policyer och har inga läs- eller skrivrättigheter för anon eller authenticated. Databasfunktionen är SECURITY INVOKER, körbar endast av service_role. Vyerna är security_invoker och privata. verify_jwt är false för Edge-funktionen eftersom den befintliga klientnyckeln är en sb_publishable-nyckel, inte en JWT; nyckeln kontrolleras i funktionen enligt Supabase-modellen för nya nycklar.

Källfiler: traffic.js, functions/archive-traffic/index.ts och database/archive-traffic-setup.sql.
