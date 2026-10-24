(() => {
  'use strict';

  const cfg = window.ARCHIVE_CONFIG;
  const releaseCovers = window.ARCHIVE_RELEASE_COVERS || {};
  const app = document.getElementById('app');
  const syncLabel = document.getElementById('sync-label');
  const state = {
    people: [], bands: [], relatedBands: [], allBands: [], memberships: [], releases: [], releaseBands: [], releaseMembers: [],
    relations: [], familyRelations: [], sources: [], claims: [], claimSources: [], claimEntities: [], uppsalaBandIds: [], mediaItems: [], mediaLinks: []
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const byId = arr => new Map(arr.map(x => [x.id, x]));
  const peopleById = () => byId(state.people);
  const allBandRows = () => state.allBands.length ? state.allBands : [...state.bands, ...state.relatedBands];
  const bandsById = () => byId(allBandRows());
  const releasesById = () => byId(state.releases);

  // Curated local archive media. These files come from the John Swahn / Desecrate archive
  // and are only used where the identity or release match is already established.
  const BAND_MEDIA = {
    'haerdsmaelta':'assets/haerdsmaelta/press-2026.svg',
    'love':'assets/archive-media/bands/love.jpg',
    'don-quixote':'assets/archive-media/bands/don-quixote.jpg',
    'twilight':'assets/archive-media/bands/twilight.png',
    'equinox':'assets/archive-media/bands/equinox.png',
    'desecrate':'assets/archive-media/bands/desecrate.png',
    'develop':'assets/archive-media/bands/develop.png',
    'xtortex':'assets/archive-media/bands/xtortex.png',
    'big-november':'assets/archive-media/bands/big-november.png',
    'john-swahn-s-big-november':'assets/archive-media/bands/big-november.png',
    'almost-human':'assets/archive-media/bands/almost-human.gif',
    'the-unkinds':'assets/archive-media/bands/the-unkinds.jpg',
    'treebeard':'assets/archive-media/bands/treebeard.jpg',
    'aphophis':'assets/archive-media/bands/aphophis.jpg',
    'loch-vostok':'https://mhf-mag.com/wp-content/uploads/2021/09/loch_vostok_1_primary-1024x576.jpg',
    'skromta':'https://www.mattinorlin.com/en/Skromta_files/shapeimage_3.png',
    'hexed':'https://images.zoogletools.com/s%3Abzglfiles/u/367807/55e459a70356e2fa6a44e2dedba5e176b606505c/original/hexed-press-pis-1.jpg/%21%21/meta%3AeyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ%3D%3D.jpg',
    'anima-morte':'https://www.earsplitcompound.com/site/wp-content/uploads/2022/08/ANIMA-MORTE-February-2022-by-Martin-Gustafsson-scaled.jpg',
    'gauntlet-rule':'https://d2x4qakry0y44a.cloudfront.net/wp-content/uploads/2021/06/18091910/GAUNTLET-RULE.jpg',
    'f-k-u':'https://i.scdn.co/image/ab6761610000e5eb20e6daa5877918a60c401aa0',
    'the-hidden':'https://f4.bcbits.com/img/a1140447514_10.jpg',
    'stallion-four':'https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp',
    'wuthering-heights':'https://i.scdn.co/image/ab67616d0000b2735250aa72f96efb7d4ece5664',
    'one-hour-hell':'https://electricvinylrecords.com/4444-large_default/one-hour-hell-voidwalker-2-lp-double-green-vinyl-limited-edition-of-200-copies.jpg',
    'flagellation':'https://metal-temple.com/wp-content/uploads/2023/10/Flagellation-Incinerate-Disintegrate-album-cover.webp',
    'tradore':'https://www.fwoshm.com/images/artists/1739998100_tradorefoto.png',
    'mellow-poetry':'https://www.fwoshm.com/images/artists/mpswedenuppsala.png'
  };

  const PERSON_MEDIA = {
    'john-s-swahn':'assets/archive-media/people/john-s-swahn.gif',
    'john-swahn':'assets/archive-media/people/john-s-swahn.gif',
    'henri-d-ranged':'assets/archive-media/people/henri-d-ranged.gif',
    'hendri-d-ranged':'assets/archive-media/people/henri-d-ranged.gif',
    'johan-asp':'assets/archive-media/people/johan-asp.gif',
    'martin-olsson':'assets/archive-media/people/martin-olsson.gif',
    'teddy-moller':'https://pbcdn1.podbean.com/imglogo/ep-logo/pbblog1333327/Teddy_Pic.jpg'
  };

  // Relaterade bilder på personsidorna. Gruppbilder används som gruppbilder –
  // de behandlas inte som individuella porträtt om personen inte är entydigt identifierad.
  const PERSON_GALLERY = {
    'teddy-moller': [
      ['https://mhf-mag.com/wp-content/uploads/2021/09/loch_vostok_1_primary-1024x576.jpg','Loch Vostok · promo 2021 · Teddy Möller med bandet','https://mhf-mag.com/i-formed-the-band-of-my-dreams-interview-with-loch-vostok/','Metalheads Forever'],
      ['https://d2x4qakry0y44a.cloudfront.net/wp-content/uploads/2021/06/18091910/GAUNTLET-RULE.jpg','Gauntlet Rule · Rogga Johansson, Peter Svensson och Teddy Möller','https://tntradiorock.com/rogga-johansson-peter-svensson-y-teddy-moller-unen-fuerzas-en-gauntlet-rule-banda-de-heavy-metal/','TNT Radio Rock'],
      ['https://i.scdn.co/image/ab6761610000e5eb20e6daa5877918a60c401aa0','F.K.Ü. · bandbild','https://www.moshoholics.com/band.php','F.K.Ü. / officiell sida'],
      ['https://www.earsplitcompound.com/site/wp-content/uploads/2022/08/ANIMA-MORTE-February-2022-by-Martin-Gustafsson-scaled.jpg','Anima Morte · pressbild 2022','https://www.earsplitcompound.com/anima-morte-swedish-cinematic-instrumental-prog-outfit-to-release-serpents-in-the-fields-of-sleep-lp-via-cadabra-records-the-sleeping-shaman-premieres-blood-of-the-iconoclast-video/','EarSplit Compound · foto Martin Gustafsson'],
      ['https://i.scdn.co/image/ab67616d0000b2735250aa72f96efb7d4ece5664','Wuthering Heights · The Shadow Cabinet · Teddy Möller på bas / engineering','https://open.spotify.com/album/7pCdMyoHEukSMz0KcCk65v','Spotify / Wuthering Heights'],
      ['https://metal-temple.com/wp-content/uploads/2023/10/Flagellation-Incinerate-Disintegrate-album-cover.webp','Flagellation · Incinerate Disintegrate · Teddy Möller på gitarr och sång','https://metal-temple.com/review/flagellation-incinerate-disintegrate/','Metal Temple'],
      ['https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Wuthering_Heights_Salt.png/500px-Wuthering_Heights_Salt.png','Wuthering Heights · Salt · Teddy Möller på bas, gitarr, kör och engineering/mix','https://www.metal-archives.com/albums/Wuthering_Heights/Salt/261309','Wuthering Heights / Metal Archives'],
      ['https://electricvinylrecords.com/4444-large_default/one-hour-hell-voidwalker-2-lp-double-green-vinyl-limited-edition-of-200-copies.jpg','One Hour Hell · Voidwalker · Teddy Möller på bas','https://www.metal-archives.com/albums/One_Hour_Hell/Voidwalker/789098','One Hour Hell / Metal Archives'],
      ['https://www.fwoshm.com/images/artists/1739998100_tradorefoto.png','Tradore · Uppsala 1980-tal · Teddy Möller på trummor','https://www.fwoshm.com/index/T/1587-tradore-swe','Swedish Hard And Heavy Encyclopedia'],
      ['https://www.fwoshm.com/images/artists/mpswedenuppsala.png','Mellow Poetry · Uppsala · Teddy Möller på trummor','https://www.fwoshm.com/index/M/1647-mellow-poetry-swe','Swedish Hard And Heavy Encyclopedia']
    ],
    'tina-moller': [
      ['https://www.fwoshm.com/images/artists/1739998100_tradorefoto.png','Tradore · Tina Möller på sång','https://www.fwoshm.com/index/T/1587-tradore-swe','Swedish Hard And Heavy Encyclopedia'],
      ['https://images.zoogletools.com/s%3Abzglfiles/u/367807/55e459a70356e2fa6a44e2dedba5e176b606505c/original/hexed-press-pis-1.jpg/%21%21/meta%3AeyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ%3D%3D.jpg','HEXED · officiell pressbild · Tina Gunnarsson / Tina Möller på sång','https://hexed.se/biography','HEXED · officiell biografi']
    ],
    'eric-grandin': [
      ['https://www.fwoshm.com/images/artists/mpswedenuppsala.png','Mellow Poetry · Eric Grandin på bas','https://www.fwoshm.com/index/M/1647-mellow-poetry-swe','Swedish Hard And Heavy Encyclopedia']
    ],
    'fredrik-kjorling': [
      ['https://www.fwoshm.com/images/artists/mpswedenuppsala.png','Mellow Poetry · Fredrik Kjörling på gitarr','https://www.fwoshm.com/index/M/1647-mellow-poetry-swe','Swedish Hard And Heavy Encyclopedia']
    ],
    'jonas-hagg': [
      ['https://www.fwoshm.com/images/artists/mpswedenuppsala.png','Mellow Poetry · Jonas Hägg på keyboard','https://www.fwoshm.com/index/M/1647-mellow-poetry-swe','Swedish Hard And Heavy Encyclopedia']
    ],
    'bjorn-holmquist': [
      ['https://www.fwoshm.com/images/artists/mpswedenuppsala.png','Mellow Poetry · Björn Holmquist på sång','https://www.fwoshm.com/index/M/1647-mellow-poetry-swe','Swedish Hard And Heavy Encyclopedia']
    ],
    'michael-hahne': [
      ['https://www.fwoshm.com/images/artists/1739998100_tradorefoto.png','Tradore · Michael Hahne på gitarr','https://www.fwoshm.com/index/T/1587-tradore-swe','Swedish Hard And Heavy Encyclopedia']
    ],
    'stefan-fagerlund': [
      ['https://www.fwoshm.com/images/artists/1739998100_tradorefoto.png','Tradore · Stefan Fagerlund på gitarr','https://www.fwoshm.com/index/T/1587-tradore-swe','Swedish Hard And Heavy Encyclopedia']
    ],
    'patrik-nilsson': [
      ['https://www.fwoshm.com/images/artists/1739998100_tradorefoto.png','Tradore · Patrik Nilsson på bas','https://www.fwoshm.com/index/T/1587-tradore-swe','Swedish Hard And Heavy Encyclopedia']
    ],
    'marten-korkman': [
      ['https://www.mattinorlin.com/en/Skromta_files/shapeimage_3.png','Skrömta · Mårten Korkmans folkrockgren','https://www.mattinorlin.com/en/Skromta.html','Matti Norlin / Skrömta']
    ],
    'peter-druck': [
      ['https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp','Stallion Four · Rough Times · Peter Druck på gitarr','https://metal-temple.com/review/stallion-four-rough-times/','Metal Temple']
    ],
    'gustav-ljung': [
      ['https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp','Stallion Four · Rough Times · Gustav Ljung på bas','https://metal-temple.com/review/stallion-four-rough-times/','Metal Temple']
    ],
    'bjorn-fors': [
      ['https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp','Stallion Four · Rough Times · Björn Fors på sång','https://metal-temple.com/review/stallion-four-rough-times/','Metal Temple']
    ],
    'markus-berg': [
      ['https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp','Stallion Four · Rough Times · Markus Berg på gitarr','https://metal-temple.com/review/stallion-four-rough-times/','Metal Temple']
    ],
    'markus-miljand': [
      ['https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp','Stallion Four · Rough Times · Markus Miljand på trummor','https://metal-temple.com/review/stallion-four-rough-times/','Metal Temple']
    ]
  };

  const RELEASE_MEDIA = {
    'twilight|rock-you':'assets/archive-media/releases/rock-you.png',
    'equinox|kidkkus':'assets/archive-media/releases/kidkkus.png',
    'equinox|zzzzzzyzzzzzz':'assets/archive-media/releases/zzzzzzyzzzzzz.png',
    'desecrate|we-only-make-jokes-we-made-you':'assets/archive-media/releases/we-only-make-jokes-we-made-you.png',
    'desecrate|arranger-of-disorder':'assets/archive-media/releases/arranger-of-disorder.png',
    'desecrate|lonely-disgrace':'assets/archive-media/releases/lonely-disgrace.png',
    'desecrate|second-death':'assets/archive-media/releases/second-death.png',
    'develop|fret':'assets/archive-media/releases/fret.png',
    'xtortex|twisted':'assets/archive-media/releases/twisted.png',
    'big-november|mirrors-do-the-talkin':'assets/archive-media/releases/mirrors-do-the-talkin.png',
    'big-november|nyby-fritidsgard':'assets/archive-media/releases/mirrors-do-the-talkin.png',
    'john-swahn-s-big-november|mirrors-do-the-talkin':'assets/archive-media/releases/mirrors-do-the-talkin.png',
    'john-swahn-s-big-november|nyby-fritidsgard':'assets/archive-media/releases/mirrors-do-the-talkin.png',
    'big-november|wonders-of-devotion-i-ii':'assets/archive-media/releases/wonders-of-devotion-i-ii.png',
    'john-swahn-s-big-november|wonders-of-devotion-i-ii':'assets/archive-media/releases/wonders-of-devotion-i-ii.png',
    'almost-human|the-sweet-revenge-of-mitzi-dupree':'assets/archive-media/releases/the-sweet-revenge-of-mitzi-dupree.gif',
    'almost-human|the-playground':'assets/archive-media/releases/the-playground.gif',
    'almost-human|green-all-over':'assets/archive-media/releases/green-all-over.gif',
    'almost-human|eaten-by-the-machine':'assets/archive-media/releases/eaten-by-the-machine.gif',
    'almost-human|left-overs':'assets/archive-media/releases/left-overs.png',
    'the-unkinds|almost-human':'assets/archive-media/releases/the-unkinds-almost-human.jpg',
    'the-unkinds|live-at-fellini-uppsala-02-20':'assets/archive-media/releases/live-at-fellini-uppsala-02-20.gif',
    'treebeard|the-eldest':'assets/archive-media/releases/the-eldest.jpg',
    'treebeard|no-padre-yes-padre':'assets/archive-media/releases/no-padre-yes-padre.gif',
    'treebeard|anguish-on-parade':'assets/archive-media/releases/anguish-on-parade.gif',
    'treebeard|not-for-sale':'assets/archive-media/releases/not-for-sale.gif',
    'treebeard|may-contain-small-bones':'assets/archive-media/releases/may-contain-small-bones.gif',
    'treebeard|admiration':'assets/archive-media/releases/admiration.jpg',
    'treebeard|bulletin-board':'assets/archive-media/releases/bulletin-board.gif',
    'treebeard|don-t-judge-an-album-by-its-cover':'assets/archive-media/releases/dont-judge-an-album-by-its-cover.png',
    'treebeard|best-of-2010':'assets/archive-media/releases/best-of-2010.png',
    'treebeard|vii':'assets/archive-media/releases/vii.jpg',
    'aphophis|principle-of-evil':'assets/archive-media/releases/principle-of-evil.gif',
    'aphophis|principle-of-evil-bonus-trax':'assets/archive-media/releases/principle-of-evil.gif',
    'aphophis|the-books-of-overthrowing-apep':'assets/archive-media/releases/the-books-of-overthrowing-apep.gif',
    'aphophis|sarcophagus':'assets/archive-media/releases/sarcophagus.jpg',
    'aphophis|hieroglyphs':'assets/archive-media/releases/hieroglyphs.jpg',
    'aphophis|symphony-for-the-devil':'assets/archive-media/releases/symphony-for-the-devil.jpg',
    'aphophis|the-spherical-waltz':'assets/archive-media/releases/the-spherical-waltz.jpg',
    'aphophis|exit-space-left':'assets/archive-media/releases/exit-space-left.jpg',
    'aphophis|exit-space-leftovers':'assets/archive-media/releases/exit-space-leftovers.jpg',
    'aphophis|through-the-hourglass':'assets/archive-media/releases/through-the-hourglass.jpg',
    'aphophis|dynasties':'assets/archive-media/releases/dynasties.jpg',
    'aphophis|the-aphophis-universe-phase-one':'assets/archive-media/releases/the-aphophis-universe-phase-one.jpg',
    'aphophis|the-aphophis-universe-phase-two':'assets/archive-media/releases/the-aphophis-universe-phase-two.jpg',
    'aphophis|chronophobia':'assets/archive-media/releases/chronophobia.jpg',
    'loch-vostok|dark-logic':'https://f4.bcbits.com/img/a3613833612_10.jpg',
    'loch-vostok|destruction-time-again':'https://f4.bcbits.com/img/a3397032421_10.jpg',
    'loch-vostok|reveal-no-secrets':'https://f4.bcbits.com/img/a3386423578_10.jpg',
    'loch-vostok|v-the-doctrine-decoded':'https://f4.bcbits.com/img/a3841962841_10.jpg',
    'loch-vostok|strife':'https://f4.bcbits.com/img/a0751177761_10.jpg',
    'loch-vostok|opus-ferox-the-great-escape':'https://f4.bcbits.com/img/0035597054_10.jpg',
    'loch-vostok|opus-ferox-ii-mark-of-the-beast':'https://f4.bcbits.com/img/a0034220659_16.jpg',
    'stallion-four|rough-times|2012':'https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp',
    'hexed|netherworld':'https://f4.bcbits.com/img/a0128858293_10.jpg',
    'hexed|pagans-rising':'https://f4.bcbits.com/img/a0742732570_10.jpg',
    'anima-morte|face-the-sea-of-darkness':'https://f4.bcbits.com/img/a3943680144_10.jpg',
    'anima-morte|the-nightmare-becomes-reality':'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/29/3a/c8/293ac827-51ff-0428-8bfa-f2d2c170c6e1/artwork.jpg/600x600bf-60.jpg',
    'anima-morte|upon-darkened-stains':'https://f4.bcbits.com/img/a0700897435_16.jpg',
    'anima-morte|serpents-in-the-fields-of-sleep':'https://f4.bcbits.com/img/a3325705352_10.jpg',
    'gauntlet-rule|the-plague-court':'https://f4.bcbits.com/img/a0283925770_16.jpg',
    'f-k-u|metal-moshing-mad':'https://www.moshoholics.com/img/releases/metal-moshing-mad.jpg',
    'the-hidden|fearful-symmetry':'https://f4.bcbits.com/img/a1140447514_10.jpg',
    'wuthering-heights|the-shadow-cabinet':'https://i.scdn.co/image/ab67616d0000b2735250aa72f96efb7d4ece5664',
    'wuthering-heights|salt':'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Wuthering_Heights_Salt.png/500px-Wuthering_Heights_Salt.png',
    'one-hour-hell|voidwalker':'https://electricvinylrecords.com/4444-large_default/one-hour-hell-voidwalker-2-lp-double-green-vinyl-limited-edition-of-200-copies.jpg',
    'flagellation|incinerate-disintegrate':'https://metal-temple.com/wp-content/uploads/2023/10/Flagellation-Incinerate-Disintegrate-album-cover.webp'
  };


  const BAND_GALLERY = {
    'haerdsmaelta':[
      ['assets/haerdsmaelta/press-2026.svg','Haerdsmaelta · pressbild publicerad av ICEA, juni 2026','https://icea.se/blogs/news/haerdsmaelta-unleash-new-single-enjoy-the-feast-first-taste-of-upcoming-album-haerdrock-released-june-12th-via-icons-creating-evil-art','Icons Creating Evil Art'],
      ['assets/haerdsmaelta/photo-2026.svg','Haerdsmaelta · foto: Simon Wettervik · publicerad augusti 2026','https://www.rockbladet.se/2026/08/haerdsmaelta-omfamnar-artificial-ignorance-pa-nya-singeln/','Rockbladet / Simon Wettervik']
    ],
    'love': [
      ['assets/archive-media/gallery/love/love-band-photo.jpg','L.O.V.E. · bandfoto']
    ],
    'don-quixote': [
      ['assets/archive-media/gallery/don-quixote/don-quixote-band-photo.jpg','Don Quixote · bandfoto']
    ],
    'almost-human': [
      ['assets/archive-media/gallery/almost-human/almost-human-band-photo.gif','Almost Human · bandfoto']
    ],
    'desecrate': [
      ['assets/archive-media/gallery/desecrate/1988-band-photo-collage.png','Desecrate · bandbilder 1988'],
      ['assets/archive-media/gallery/desecrate/storvreta-show-flyer.png','Desecrate · flyer från Storvreta'],
      ['assets/archive-media/gallery/desecrate/press-fanzine-interview.png','Desecrate · fanzineintervju'],
      ['assets/archive-media/gallery/desecrate/1988-we-only-make-jokes-review.png','Desecrate · recension'],
      ['assets/archive-media/gallery/desecrate/archive-live-portrait.png','Desecrate · livebild ur arkivet']
    ],
    'equinox': [
      ['assets/archive-media/gallery/equinox/1988-zzzzzz-full-front.png','Equinox · Zzzzzzyzzzzzz · full front'],
      ['assets/archive-media/gallery/equinox/1988-zzzzzz-inside.png','Equinox · Zzzzzzyzzzzzz · insida'],
      ['assets/archive-media/gallery/equinox/1988-zzzzzz-cassette-side-a.png','Equinox · kassett sida A'],
      ['assets/archive-media/gallery/equinox/1988-zzzzzz-cassette-side-b.png','Equinox · kassett sida B']
    ],
    'big-november': [
      ['assets/archive-media/gallery/big-november/1991-nyby-fritidsgard-front.png','Big November · Nyby Fritidsgård · framsida'],
      ['assets/archive-media/gallery/big-november/1991-nyby-fritidsgard-back.png','Big November · Nyby Fritidsgård · baksida'],
      ['assets/archive-media/gallery/big-november/1991-wonders-of-devotion-front.png','Big November · Wonders Of Devotion · framsida'],
      ['assets/archive-media/gallery/big-november/1991-wonders-of-devotion-back.png','Big November · Wonders Of Devotion · baksida']
    ],
    'john-swahn-s-big-november': [
      ['assets/archive-media/gallery/big-november/1991-nyby-fritidsgard-front.png','Big November · Nyby Fritidsgård · framsida'],
      ['assets/archive-media/gallery/big-november/1991-nyby-fritidsgard-back.png','Big November · Nyby Fritidsgård · baksida'],
      ['assets/archive-media/gallery/big-november/1991-wonders-of-devotion-front.png','Big November · Wonders Of Devotion · framsida'],
      ['assets/archive-media/gallery/big-november/1991-wonders-of-devotion-back.png','Big November · Wonders Of Devotion · baksida']
    ],
    'the-unkinds': [
      ['assets/archive-media/gallery/the-unkinds/2003-almost-human-front.jpg','The Unkinds · Almost Human · framsida'],
      ['assets/archive-media/gallery/the-unkinds/2003-almost-human-spread.jpg','The Unkinds · Almost Human · spread'],
      ['assets/archive-media/gallery/the-unkinds/2003-live-at-fellini-front.gif','The Unkinds · Live at Fellini · framsida'],
      ['assets/archive-media/gallery/the-unkinds/2003-live-at-fellini-back.gif','The Unkinds · Live at Fellini · baksida']
    ],
    'treebeard': [
      ['assets/archive-media/gallery/treebeard/treebeard-2004-header.jpg','Treebeard · arkivbild 2004'],
      ['assets/archive-media/gallery/treebeard/additional-cover-creature.jpg','Treebeard · alternativt omslagsmaterial'],
      ['assets/archive-media/gallery/treebeard/additional-cover-autumn-tree.jpg','Treebeard · alternativt omslagsmaterial'],
      ['assets/archive-media/gallery/treebeard/additional-cover-kali.gif','Treebeard · alternativt omslagsmaterial']
    ],
    'aphophis': [
      ['assets/archive-media/gallery/aphophis/2026-chronophobia-full-spread.jpg','Aphophis · Chronophobia · full spread'],
      ['assets/archive-media/gallery/aphophis/2026-chronophobia-inner.jpg','Aphophis · Chronophobia · inner'],
      ['assets/archive-media/gallery/aphophis/2024-exit-space-left-inside.jpg','Aphophis · Exit Space Left · insida'],
      ['assets/archive-media/gallery/aphophis/2024-through-the-hourglass-inside.jpg','Aphophis · Through The Hourglass · insida']
    ],
    'loch-vostok': [
      ['https://mhf-mag.com/wp-content/uploads/2021/09/loch_vostok_1_primary-1024x576.jpg','Loch Vostok · promo 2021 · Niklas Kupper, Teddy Möller, Jonas Radehorn, Patrik Janson, Lawrence Dinamarca','https://mhf-mag.com/i-formed-the-band-of-my-dreams-interview-with-loch-vostok/','Metalheads Forever'],
      ['https://mhf-mag.com/wp-content/uploads/2021/09/loch_vostok_3-683x1024.jpg','Loch Vostok · promo 2021','https://mhf-mag.com/i-formed-the-band-of-my-dreams-interview-with-loch-vostok/','Metalheads Forever'],
      ['https://mhf-mag.com/wp-content/uploads/2021/09/loch_vostok_2-1024x663.jpg','Loch Vostok · promo 2021','https://mhf-mag.com/i-formed-the-band-of-my-dreams-interview-with-loch-vostok/','Metalheads Forever']
    ],
    'tradore': [
      ['https://www.fwoshm.com/images/artists/1739998100_tradorefoto.png','Tradore · Uppsala · bandfoto','https://www.fwoshm.com/index/T/1587-tradore-swe','Swedish Hard And Heavy Encyclopedia'],
      ['https://www.metal-archives.com/images/6/8/6/7/68676_photo.jpg','Tradore · bandfoto från Metal Archives','https://www.metal-archives.com/bands/Tradore/68676','Metal Archives'],
      ['https://www.fwoshm.com/images/artists/1739998159_tradorelogga.png','Tradore · logotyp','https://www.fwoshm.com/index/T/1587-tradore-swe','Swedish Hard And Heavy Encyclopedia']
    ],
    'mellow-poetry': [
      ['https://www.fwoshm.com/images/artists/mpswedenuppsala.png','Mellow Poetry · Uppsala · bandfoto','https://www.fwoshm.com/index/M/1647-mellow-poetry-swe','Swedish Hard And Heavy Encyclopedia'],
      ['https://www.metal-archives.com/images/3/5/4/0/3540276885_photo.jpg','Mellow Poetry · bandfoto från Metal Archives','https://www.metal-archives.com/bands/Mellow_Poetry/3540276885','Metal Archives']
    ],
    'skromta': [
      ['https://www.mattinorlin.com/en/Skromta_files/shapeimage_3.png','Skrömta · bild från bandets officiella arkivsida','https://www.mattinorlin.com/en/Skromta.html','Matti Norlin / Skrömta']
    ],
    'hexed': [
      ['https://images.zoogletools.com/s%3Abzglfiles/u/367807/55e459a70356e2fa6a44e2dedba5e176b606505c/original/hexed-press-pis-1.jpg/%21%21/meta%3AeyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ%3D%3D.jpg','HEXED · officiell pressbild','https://hexed.se/biography','HEXED · officiell biografi']
    ],
    'anima-morte': [
      ['https://www.earsplitcompound.com/site/wp-content/uploads/2022/08/ANIMA-MORTE-February-2022-by-Martin-Gustafsson-scaled.jpg','Anima Morte · pressbild 2022 · foto Martin Gustafsson','https://www.earsplitcompound.com/anima-morte-swedish-cinematic-instrumental-prog-outfit-to-release-serpents-in-the-fields-of-sleep-lp-via-cadabra-records-the-sleeping-shaman-premieres-blood-of-the-iconoclast-video/','EarSplit Compound'],
      ['https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/29/3a/c8/293ac827-51ff-0428-8bfa-f2d2c170c6e1/artwork.jpg/600x600bf-60.jpg','Anima Morte · The Nightmare Becomes Reality · 2011','https://animamorte.bandcamp.com/album/the-nightmare-becomes-reality','Anima Morte / Bandcamp'],
      ['https://f4.bcbits.com/img/a0700897435_16.jpg','Anima Morte · Upon Darkened Stains · 2014','https://animamorte.bandcamp.com/album/upon-darkened-stains','Anima Morte / Bandcamp'],
      ['https://f4.bcbits.com/img/a3325705352_10.jpg','Anima Morte · Serpents in the Fields of Sleep · 2022','https://animamorte.bandcamp.com/album/serpents-in-the-fields-of-sleep','Anima Morte / Bandcamp']
    ],
    'gauntlet-rule': [
      ['https://d2x4qakry0y44a.cloudfront.net/wp-content/uploads/2021/06/18091910/GAUNTLET-RULE.jpg','Gauntlet Rule · Rogga Johansson, Peter Svensson och Teddy Möller','https://tntradiorock.com/rogga-johansson-peter-svensson-y-teddy-moller-unen-fuerzas-en-gauntlet-rule-banda-de-heavy-metal/','TNT Radio Rock'],
      ['https://f4.bcbits.com/img/a0283925770_16.jpg','Gauntlet Rule · The Plague Court · 2022','https://gauntletrulesweden.bandcamp.com/album/the-plague-court','Gauntlet Rule / Bandcamp']
    ],
    'f-k-u': [
      ['https://i.scdn.co/image/ab6761610000e5eb20e6daa5877918a60c401aa0','F.K.Ü. · bandbild','https://open.spotify.com/artist/5h0HlqYN5TvocKVL1NSJ80','Spotify'],
      ['https://www.moshoholics.com/img/banners/tour-2024-xs.jpg','F.K.Ü. · live 2024','https://www.moshoholics.com/tour.php','F.K.Ü. · officiell sida'],
      ['https://www.moshoholics.com/img/releases/metal-moshing-mad.jpg','F.K.Ü. · Metal Moshing Mad · 1999','https://www.moshoholics.com/releases.php','F.K.Ü. · officiell diskografi']
    ],
    'the-hidden': [
      ['https://f4.bcbits.com/img/a1140447514_10.jpg','The Hidden · Fearful Symmetry · 2014','https://tribunalrecords.bandcamp.com/album/fearful-symmetry-2','Tribunal / Divebomb Records']
    ],
    'stallion-four': [
      ['https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp','Stallion Four · Rough Times · albumomslag 2012','https://metal-temple.com/review/stallion-four-rough-times/','Metal Temple'],
    ],
    'wuthering-heights': [
      ['https://i.scdn.co/image/ab67616d0000b2735250aa72f96efb7d4ece5664','Wuthering Heights · The Shadow Cabinet · 2006','https://open.spotify.com/album/7pCdMyoHEukSMz0KcCk65v','Spotify'],
      ['https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Wuthering_Heights_Salt.png/500px-Wuthering_Heights_Salt.png','Wuthering Heights · Salt · 2010','https://www.metal-archives.com/albums/Wuthering_Heights/Salt/261309','Metal Archives']
    ],
    'one-hour-hell': [
      ['https://electricvinylrecords.com/4444-large_default/one-hour-hell-voidwalker-2-lp-double-green-vinyl-limited-edition-of-200-copies.jpg','One Hour Hell · Voidwalker · 2019','https://www.metal-archives.com/albums/One_Hour_Hell/Voidwalker/789098','Metal Archives']
    ],
    'flagellation': [
      ['https://metal-temple.com/wp-content/uploads/2023/10/Flagellation-Incinerate-Disintegrate-album-cover.webp','Flagellation · Incinerate Disintegrate · 2007','https://metal-temple.com/review/flagellation-incinerate-disintegrate/','Metal Temple']
    ],
    'xtortex': [
      ['assets/archive-media/gallery/xtortex/1990-twisted-full-inlay.png','Xtortex · Twisted · full inlay']
    ],
    'develop': [
      ['assets/archive-media/gallery/develop/1990-fret-back.png','Develop · Fret · baksida']
    ]
  };

  const RELEASE_GALLERY = {
    'loch-vostok|opus-ferox-the-great-escape': [
      ['https://f4.bcbits.com/img/0035597054_10.jpg','Opus Ferox – The Great Escape · 2021','https://lochvostok.bandcamp.com/album/opus-ferox-the-great-escape','Loch Vostok / Bandcamp']
    ],
    'stallion-four|rough-times|2012': [
      ['https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp','Stallion Four · Rough Times · album 2012','https://metal-temple.com/review/stallion-four-rough-times/','Metal Temple']
    ],
    'gauntlet-rule|the-plague-court': [
      ['https://f4.bcbits.com/img/a0283925770_16.jpg','The Plague Court · officiellt Bandcamp-omslag','https://gauntletrulesweden.bandcamp.com/album/the-plague-court','Gauntlet Rule / Bandcamp']
    ],
    'f-k-u|metal-moshing-mad': [
      ['https://www.moshoholics.com/img/releases/metal-moshing-mad.jpg','Metal Moshing Mad · 1999','https://www.moshoholics.com/releases.php','F.K.Ü. · officiell diskografi']
    ],
    'the-hidden|fearful-symmetry': [
      ['https://f4.bcbits.com/img/a1140447514_10.jpg','Fearful Symmetry · 2014','https://tribunalrecords.bandcamp.com/album/fearful-symmetry-2','Tribunal / Divebomb Records']
    ],
    'wuthering-heights|the-shadow-cabinet': [
      ['https://i.scdn.co/image/ab67616d0000b2735250aa72f96efb7d4ece5664','The Shadow Cabinet · 2006','https://open.spotify.com/album/7pCdMyoHEukSMz0KcCk65v','Spotify']
    ],
    'wuthering-heights|salt': [
      ['https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Wuthering_Heights_Salt.png/500px-Wuthering_Heights_Salt.png','Salt · 2010','https://www.metal-archives.com/albums/Wuthering_Heights/Salt/261309','Metal Archives']
    ],
    'one-hour-hell|voidwalker': [
      ['https://electricvinylrecords.com/4444-large_default/one-hour-hell-voidwalker-2-lp-double-green-vinyl-limited-edition-of-200-copies.jpg','Voidwalker · 2019','https://www.metal-archives.com/albums/One_Hour_Hell/Voidwalker/789098','Metal Archives']
    ],
    'flagellation|incinerate-disintegrate': [
      ['https://metal-temple.com/wp-content/uploads/2023/10/Flagellation-Incinerate-Disintegrate-album-cover.webp','Incinerate Disintegrate · 2007','https://metal-temple.com/review/flagellation-incinerate-disintegrate/','Metal Temple']
    ],
    'anima-morte|the-nightmare-becomes-reality': [
      ['https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/29/3a/c8/293ac827-51ff-0428-8bfa-f2d2c170c6e1/artwork.jpg/600x600bf-60.jpg','The Nightmare Becomes Reality · 2011','https://animamorte.bandcamp.com/album/the-nightmare-becomes-reality','Anima Morte / Bandcamp']
    ],
    'anima-morte|upon-darkened-stains': [
      ['https://f4.bcbits.com/img/a0700897435_16.jpg','Upon Darkened Stains · 2014','https://animamorte.bandcamp.com/album/upon-darkened-stains','Anima Morte / Bandcamp']
    ],
    'anima-morte|serpents-in-the-fields-of-sleep': [
      ['https://f4.bcbits.com/img/a3325705352_10.jpg','Serpents in the Fields of Sleep · 2022','https://animamorte.bandcamp.com/album/serpents-in-the-fields-of-sleep','Anima Morte / Bandcamp']
    ],
    'hexed|netherworld': [
      ['https://f4.bcbits.com/img/a0128858293_10.jpg','Netherworld · officiellt omslag','https://hexedmetal.bandcamp.com/album/netherworld','HEXED / Bandcamp']
    ],
    'hexed|pagans-rising': [
      ['https://f4.bcbits.com/img/a0742732570_10.jpg','Pagans Rising · officiellt omslag','https://hexedmetal.bandcamp.com/album/pagans-rising','HEXED / Bandcamp']
    ],
    'anima-morte|face-the-sea-of-darkness': [
      ['https://f4.bcbits.com/img/a3943680144_10.jpg','Face The Sea Of Darkness · officiellt omslag','https://animamorte.bandcamp.com/album/face-the-sea-of-darkness','Anima Morte / Bandcamp']
    ],
    'loch-vostok|dark-logic': [
      ['https://f4.bcbits.com/img/a3613833612_10.jpg','Dark Logic · officiellt Bandcamp-omslag','https://lochvostok.bandcamp.com/album/dark-logic','Loch Vostok / Bandcamp']
    ],
    'loch-vostok|destruction-time-again': [
      ['https://f4.bcbits.com/img/a3397032421_10.jpg','Destruction Time Again! · officiellt Bandcamp-omslag','https://lochvostok.bandcamp.com/album/destruction-time-again','Loch Vostok / Bandcamp']
    ],
    'loch-vostok|reveal-no-secrets': [
      ['https://f4.bcbits.com/img/a3386423578_10.jpg','Reveal No Secrets · officiellt Bandcamp-omslag','https://lochvostok.bandcamp.com/album/reveal-no-secrets','Loch Vostok / Bandcamp']
    ],
    'loch-vostok|v-the-doctrine-decoded': [
      ['https://f4.bcbits.com/img/a3841962841_10.jpg','V – The Doctrine Decoded · officiellt Bandcamp-omslag','https://lochvostok.bandcamp.com/album/v-the-doctrine-decoded','Loch Vostok / Bandcamp']
    ],
    'loch-vostok|strife': [
      ['https://f4.bcbits.com/img/a0751177761_10.jpg','Strife · officiellt Bandcamp-omslag','https://lochvostok.bandcamp.com/album/strife','Loch Vostok / Bandcamp']
    ],
    'loch-vostok|opus-ferox-ii-mark-of-the-beast': [
      ['https://f4.bcbits.com/img/a0034220659_16.jpg','Opus Ferox II – Mark of the Beast · omslag','https://lochvostok.bandcamp.com/album/opus-ferox-ii-mark-of-the-beast','Loch Vostok / Bandcamp']
    ],
    'equinox|kidkkus': [
      ['assets/archive-media/gallery/equinox/1987-kidkkus-back.gif','Kidkkus! · baksida']
    ],
    'equinox|zzzzzzyzzzzzz': [
      ['assets/archive-media/gallery/equinox/1988-zzzzzz-full-front.png','Zzzzzzyzzzzzz · full front'],
      ['assets/archive-media/gallery/equinox/1988-zzzzzz-inside.png','Zzzzzzyzzzzzz · insida'],
      ['assets/archive-media/gallery/equinox/1988-zzzzzz-inlay-credits.png','Zzzzzzyzzzzzz · credits'],
      ['assets/archive-media/gallery/equinox/1988-zzzzzz-inlay-tracklist.png','Zzzzzzyzzzzzz · låtlista'],
      ['assets/archive-media/gallery/equinox/1988-zzzzzz-cassette-side-a.png','Zzzzzzyzzzzzz · kassett sida A'],
      ['assets/archive-media/gallery/equinox/1988-zzzzzz-cassette-side-b.png','Zzzzzzyzzzzzz · kassett sida B']
    ],
    'desecrate|we-only-make-jokes-we-made-you': [
      ['assets/archive-media/gallery/desecrate/1988-we-only-make-jokes-cassette.png','We Only Make Jokes... We Made You! · kassett'],
      ['assets/archive-media/gallery/desecrate/1988-we-only-make-jokes-review.png','Samtida recension']
    ],
    'desecrate|arranger-of-disorder': [
      ['assets/archive-media/gallery/desecrate/1989-arranger-of-disorder-cassette.png','Arranger of Disorder · kassett'],
      ['assets/archive-media/gallery/desecrate/1989-arranger-of-disorder-inlay.png','Arranger of Disorder · inlay'],
      ['assets/archive-media/gallery/desecrate/1989-arranger-of-disorder-full-inlay.png','Arranger of Disorder · full inlay']
    ],
    'develop|fret': [
      ['assets/archive-media/gallery/develop/1990-fret-back.png','Fret · baksida']
    ],
    'xtortex|twisted': [
      ['assets/archive-media/gallery/xtortex/1990-twisted-full-inlay.png','Twisted · full inlay']
    ],
    'big-november|nyby-fritidsgard': [
      ['assets/archive-media/gallery/big-november/1991-nyby-fritidsgard-front.png','Nyby Fritidsgård · framsida'],
      ['assets/archive-media/gallery/big-november/1991-nyby-fritidsgard-back.png','Nyby Fritidsgård · baksida']
    ],
    'john-swahn-s-big-november|nyby-fritidsgard': [
      ['assets/archive-media/gallery/big-november/1991-nyby-fritidsgard-front.png','Nyby Fritidsgård · framsida'],
      ['assets/archive-media/gallery/big-november/1991-nyby-fritidsgard-back.png','Nyby Fritidsgård · baksida']
    ],
    'big-november|wonders-of-devotion-i-ii': [
      ['assets/archive-media/gallery/big-november/1991-wonders-of-devotion-front.png','Wonders Of Devotion I & II · framsida'],
      ['assets/archive-media/gallery/big-november/1991-wonders-of-devotion-back.png','Wonders Of Devotion I & II · baksida']
    ],
    'john-swahn-s-big-november|wonders-of-devotion-i-ii': [
      ['assets/archive-media/gallery/big-november/1991-wonders-of-devotion-front.png','Wonders Of Devotion I & II · framsida'],
      ['assets/archive-media/gallery/big-november/1991-wonders-of-devotion-back.png','Wonders Of Devotion I & II · baksida']
    ],
    'the-unkinds|almost-human': [
      ['assets/archive-media/gallery/the-unkinds/2003-almost-human-front.jpg','Almost Human · framsida'],
      ['assets/archive-media/gallery/the-unkinds/2003-almost-human-spread.jpg','Almost Human · spread']
    ],
    'the-unkinds|live-at-fellini-uppsala-02-20': [
      ['assets/archive-media/gallery/the-unkinds/2003-live-at-fellini-front.gif','Live at Fellini Uppsala 02-20 · framsida'],
      ['assets/archive-media/gallery/the-unkinds/2003-live-at-fellini-back.gif','Live at Fellini Uppsala 02-20 · baksida']
    ],
    'treebeard|admiration': [
      ['assets/archive-media/gallery/treebeard/2008-admiration-inside.gif','Admiration · insida'],
      ['assets/archive-media/gallery/treebeard/2008-admiration-back.gif','Admiration · baksida']
    ],
    'treebeard|bulletin-board': [
      ['assets/archive-media/gallery/treebeard/2008-bulletin-board-back.gif','Bulletin Board · baksida']
    ],
    'aphophis|principle-of-evil': [
      ['assets/archive-media/gallery/aphophis/2008-principle-of-evil-back.gif','Principle of Evil · baksida']
    ],
    'aphophis|sarcophagus': [
      ['assets/archive-media/gallery/aphophis/2010-sarcophagus-back.jpg','Sarcophagus · baksida']
    ],
    'aphophis|the-spherical-waltz': [
      ['assets/archive-media/gallery/aphophis/2016-the-spherical-waltz-back.jpg','The Spherical Waltz · baksida']
    ],
    'aphophis|exit-space-left': [
      ['assets/archive-media/gallery/aphophis/2024-exit-space-left-inside.jpg','Exit Space Left · insida'],
      ['assets/archive-media/gallery/aphophis/2024-exit-space-left-back.jpg','Exit Space Left · baksida']
    ],
    'aphophis|through-the-hourglass': [
      ['assets/archive-media/gallery/aphophis/2024-through-the-hourglass-inside.jpg','Through The Hourglass · insida'],
      ['assets/archive-media/gallery/aphophis/2024-through-the-hourglass-back.jpg','Through The Hourglass · baksida']
    ],
    'aphophis|chronophobia': [
      ['assets/archive-media/gallery/aphophis/2026-chronophobia-full-spread.jpg','Chronophobia · full spread'],
      ['assets/archive-media/gallery/aphophis/2026-chronophobia-inner.jpg','Chronophobia · inner'],
      ['assets/archive-media/gallery/aphophis/2026-chronophobia-back.jpg','Chronophobia · baksida']
    ]
  };

  const HOME_ARCHIVE_MEDIA = [
    ['assets/archive-media/gallery/desecrate/1988-band-photo-collage.png','Desecrate · 1988'],
    ['assets/archive-media/gallery/equinox/1988-zzzzzz-full-front.png','Equinox · 1988'],
    ['assets/archive-media/gallery/almost-human/almost-human-band-photo.gif','Almost Human'],
    ['assets/archive-media/gallery/the-unkinds/2003-almost-human-spread.jpg','The Unkinds · 2003'],
    ['assets/archive-media/gallery/big-november/1991-nyby-fritidsgard-front.png','Big November · 1991'],
    ['assets/archive-media/gallery/aphophis/2026-chronophobia-full-spread.jpg','Aphophis · 2026'],
    ['https://d2x4qakry0y44a.cloudfront.net/wp-content/uploads/2021/06/18091910/GAUNTLET-RULE.jpg','Gauntlet Rule · Teddy Möller-grenen','https://tntradiorock.com/rogga-johansson-peter-svensson-y-teddy-moller-unen-fuerzas-en-gauntlet-rule-banda-de-heavy-metal/','TNT Radio Rock'],
    ['https://i.scdn.co/image/ab6761610000e5eb20e6daa5877918a60c401aa0','F.K.Ü. · Uppsala thrash','https://www.moshoholics.com/band.php','F.K.Ü.'],
    ['https://f4.bcbits.com/img/a1140447514_10.jpg','The Hidden · Fearful Symmetry','https://tribunalrecords.bandcamp.com/album/fearful-symmetry-2','Tribunal / Divebomb Records'],
    ['https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp','Stallion Four · Rough Times · 2012','https://metal-temple.com/review/stallion-four-rough-times/','Metal Temple'],
    ['https://images.zoogletools.com/s%3Abzglfiles/u/367807/55e459a70356e2fa6a44e2dedba5e176b606505c/original/hexed-press-pis-1.jpg/%21%21/meta%3AeyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ%3D%3D.jpg','HEXED · officiell pressbild','https://hexed.se/biography','HEXED'],
    ['https://www.earsplitcompound.com/site/wp-content/uploads/2022/08/ANIMA-MORTE-February-2022-by-Martin-Gustafsson-scaled.jpg','Anima Morte · 2022','https://www.earsplitcompound.com/anima-morte-swedish-cinematic-instrumental-prog-outfit-to-release-serpents-in-the-fields-of-sleep-lp-via-cadabra-records-the-sleeping-shaman-premieres-blood-of-the-iconoclast-video/','EarSplit Compound'],
    ['https://www.fwoshm.com/images/artists/1739998100_tradorefoto.png','Tradore · Uppsala 1980-tal','https://www.fwoshm.com/index/T/1587-tradore-swe','Swedish Hard And Heavy Encyclopedia'],
    ['https://www.fwoshm.com/images/artists/mpswedenuppsala.png','Mellow Poetry · Uppsala 1990-tal','https://www.fwoshm.com/index/M/1647-mellow-poetry-swe','Swedish Hard And Heavy Encyclopedia']
  ];

  // Externa bilder visas endast när bandet/personen/utgåvan är säkert identifierad.
  // Källsidan visas alltid på detaljsidan så att bildens ursprung går att följa.
  const EXTERNAL_MEDIA_META = {
    'https://pbcdn1.podbean.com/imglogo/ep-logo/pbblog1333327/Teddy_Pic.jpg': {
      label:'Rockpodden · Teddy Möller, 2017',
      sourceUrl:'https://rockpodden.podbean.com/e/rockpodden-39-teddy-moller/'
    },
    'https://mhf-mag.com/wp-content/uploads/2021/09/loch_vostok_1_primary-1024x576.jpg': {
      label:'Metalheads Forever · Loch Vostok, 2021',
      sourceUrl:'https://mhf-mag.com/i-formed-the-band-of-my-dreams-interview-with-loch-vostok/'
    },
    'https://www.mattinorlin.com/en/Skromta_files/shapeimage_3.png': {
      label:'Matti Norlin / Skrömta · officiell bandsida',
      sourceUrl:'https://www.mattinorlin.com/en/Skromta.html'
    },
    'https://f4.bcbits.com/img/a0034220659_16.jpg': {
      label:'Loch Vostok / Bandcamp · officiellt omslag',
      sourceUrl:'https://lochvostok.bandcamp.com/album/opus-ferox-ii-mark-of-the-beast'
    },
    'https://images.zoogletools.com/s%3Abzglfiles/u/367807/55e459a70356e2fa6a44e2dedba5e176b606505c/original/hexed-press-pis-1.jpg/%21%21/meta%3AeyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ%3D%3D.jpg': {
      label:'HEXED · officiell pressbild', sourceUrl:'https://hexed.se/biography'
    },
    'https://www.earsplitcompound.com/site/wp-content/uploads/2022/08/ANIMA-MORTE-February-2022-by-Martin-Gustafsson-scaled.jpg': {
      label:'Anima Morte · pressbild 2022 · foto Martin Gustafsson', sourceUrl:'https://www.earsplitcompound.com/anima-morte-swedish-cinematic-instrumental-prog-outfit-to-release-serpents-in-the-fields-of-sleep-lp-via-cadabra-records-the-sleeping-shaman-premieres-blood-of-the-iconoclast-video/'
    },
    'https://f4.bcbits.com/img/a0128858293_10.jpg': {label:'HEXED / Bandcamp · Netherworld',sourceUrl:'https://hexedmetal.bandcamp.com/album/netherworld'},
    'https://f4.bcbits.com/img/a0742732570_10.jpg': {label:'HEXED / Bandcamp · Pagans Rising',sourceUrl:'https://hexedmetal.bandcamp.com/album/pagans-rising'},
    'https://f4.bcbits.com/img/a3943680144_10.jpg': {label:'Anima Morte / Bandcamp · Face The Sea Of Darkness',sourceUrl:'https://animamorte.bandcamp.com/album/face-the-sea-of-darkness'},
    'https://f4.bcbits.com/img/a3613833612_10.jpg': {label:'Loch Vostok / Bandcamp · Dark Logic',sourceUrl:'https://lochvostok.bandcamp.com/album/dark-logic'},
    'https://f4.bcbits.com/img/a3397032421_10.jpg': {label:'Loch Vostok / Bandcamp · Destruction Time Again!',sourceUrl:'https://lochvostok.bandcamp.com/album/destruction-time-again'},
    'https://f4.bcbits.com/img/a3386423578_10.jpg': {label:'Loch Vostok / Bandcamp · Reveal No Secrets',sourceUrl:'https://lochvostok.bandcamp.com/album/reveal-no-secrets'},
    'https://f4.bcbits.com/img/a3841962841_10.jpg': {label:'Loch Vostok / Bandcamp · V – The Doctrine Decoded',sourceUrl:'https://lochvostok.bandcamp.com/album/v-the-doctrine-decoded'},
    'https://f4.bcbits.com/img/a0751177761_10.jpg': {label:'Loch Vostok / Bandcamp · Strife',sourceUrl:'https://lochvostok.bandcamp.com/album/strife'},
    'https://f4.bcbits.com/img/0035597054_10.jpg': {label:'Loch Vostok / Bandcamp · Opus Ferox – The Great Escape',sourceUrl:'https://lochvostok.bandcamp.com/album/opus-ferox-the-great-escape'},
    'https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp': {label:'Metal Temple · Stallion Four – Rough Times',sourceUrl:'https://metal-temple.com/review/stallion-four-rough-times/'},
    'https://d2x4qakry0y44a.cloudfront.net/wp-content/uploads/2021/06/18091910/GAUNTLET-RULE.jpg': {label:'TNT Radio Rock · Gauntlet Rule',sourceUrl:'https://tntradiorock.com/rogga-johansson-peter-svensson-y-teddy-moller-unen-fuerzas-en-gauntlet-rule-banda-de-heavy-metal/'},
    'https://f4.bcbits.com/img/a0283925770_16.jpg': {label:'Gauntlet Rule / Bandcamp · The Plague Court',sourceUrl:'https://gauntletrulesweden.bandcamp.com/album/the-plague-court'},
    'https://i.scdn.co/image/ab6761610000e5eb20e6daa5877918a60c401aa0': {label:'F.K.Ü. · artistbild',sourceUrl:'https://www.moshoholics.com/band.php'},
    'https://www.moshoholics.com/img/banners/tour-2024-xs.jpg': {label:'F.K.Ü. · officiell sida · live 2024',sourceUrl:'https://www.moshoholics.com/tour.php'},
    'https://www.moshoholics.com/img/releases/metal-moshing-mad.jpg': {label:'F.K.Ü. · Metal Moshing Mad',sourceUrl:'https://www.moshoholics.com/releases.php'},
    'https://f4.bcbits.com/img/a1140447514_10.jpg': {label:'The Hidden / Tribunal + Divebomb Records · Fearful Symmetry',sourceUrl:'https://tribunalrecords.bandcamp.com/album/fearful-symmetry-2'},
    'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/29/3a/c8/293ac827-51ff-0428-8bfa-f2d2c170c6e1/artwork.jpg/600x600bf-60.jpg': {label:'Anima Morte · The Nightmare Becomes Reality',sourceUrl:'https://animamorte.bandcamp.com/album/the-nightmare-becomes-reality'},
    'https://f4.bcbits.com/img/a0700897435_16.jpg': {label:'Anima Morte / Bandcamp · Upon Darkened Stains',sourceUrl:'https://animamorte.bandcamp.com/album/upon-darkened-stains'},
    'https://f4.bcbits.com/img/a3325705352_10.jpg': {label:'Anima Morte · Serpents in the Fields of Sleep',sourceUrl:'https://animamorte.bandcamp.com/album/serpents-in-the-fields-of-sleep'},
    'https://www.fwoshm.com/images/artists/1739998100_tradorefoto.png': {label:'Swedish Hard And Heavy Encyclopedia · Tradore bandfoto',sourceUrl:'https://www.fwoshm.com/index/T/1587-tradore-swe'},
    'https://www.metal-archives.com/images/6/8/6/7/68676_photo.jpg': {label:'Metal Archives · Tradore bandfoto',sourceUrl:'https://www.metal-archives.com/bands/Tradore/68676'},
    'https://www.fwoshm.com/images/artists/1739998159_tradorelogga.png': {label:'Swedish Hard And Heavy Encyclopedia · Tradore logotyp',sourceUrl:'https://www.fwoshm.com/index/T/1587-tradore-swe'},
    'https://www.fwoshm.com/images/artists/mpswedenuppsala.png': {label:'Swedish Hard And Heavy Encyclopedia · Mellow Poetry bandfoto',sourceUrl:'https://www.fwoshm.com/index/M/1647-mellow-poetry-swe'},
    'https://www.metal-archives.com/images/3/5/4/0/3540276885_photo.jpg': {label:'Metal Archives · Mellow Poetry bandfoto',sourceUrl:'https://www.metal-archives.com/bands/Mellow_Poetry/3540276885'}
  };

  function slugify(value = '') {
    return String(value)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/&/g, ' och ')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function bandPhoto(b) {
    if (!b) return null;
    const linkedPhotos = state.mediaLinks
      .filter(link => link.entity_type === 'band' && link.entity_id === b.id && link.relation === 'band_photo')
      .map(link => state.mediaItems.find(item => item.id === link.media_id))
      .filter(item => item?.media_type === 'photo' && typeof item.original_url === 'string' && /^https:\/\//i.test(item.original_url));
    return linkedPhotos[0] || null;
  }

  function bandMedia(b) {
    if (!b) return '';
    // Först arkivets källkopplade gruppfoto, därefter lokalt arkivfoto.
    return bandPhoto(b)?.original_url || BAND_MEDIA[slugify(b.canonical_name)] || '';
  }
  function personPhotos(p) {
    if (!p) return [];
    return state.mediaLinks
      .filter(link => link.entity_type === 'person' && link.entity_id === p.id && ['person_photo', 'portrait'].includes(link.relation))
      .map(link => state.mediaItems.find(item => item.id === link.media_id))
      .filter(item => item?.media_type === 'photo' && typeof item.original_url === 'string' && /^https:\/\//i.test(item.original_url));
  }

  function personMedia(p) {
    if (!p) return '';
    return personPhotos(p)[0]?.original_url || PERSON_MEDIA[slugify(p.canonical_name)] || '';
  }

  function personGallery(p) {
    if (!p) return [];
    const curated = PERSON_GALLERY[slugify(p.canonical_name)] || [];
    const photos = personPhotos(p).map(item => {
      const source = state.sources.find(source => source.id === item.source_id);
      return [item.original_url, item.title || p.canonical_name, source?.url || '', source?.title || ''];
    });
    const seen = new Set();
    return [...curated, ...photos].filter(item => {
      if (!item?.[0] || seen.has(item[0])) return false;
      seen.add(item[0]);
      return true;
    });
  }

  function releaseMedia(r) {
    if (!r) return '';
    const currentCover = releaseCovers[r.id]?.src || r.cover_url;
    if (typeof currentCover === 'string' && /^(https?:\/\/|assets\/)/i.test(currentCover)) return currentCover;
    const b = releaseBand(r.id);
    const bandSlug = b ? slugify(b.canonical_name) : '';
    const titleSlug = slugify(r.title);
    const yearKey = `${bandSlug}|${titleSlug}|${r.release_year || ''}`;
    return RELEASE_MEDIA[yearKey] || RELEASE_MEDIA[`${bandSlug}|${titleSlug}`] || '';
  }

  function bandGallery(b) {
    if (!b) return [];
    const curated = BAND_GALLERY[slugify(b.canonical_name)] || [];
    const linked = state.mediaLinks
      .filter(link => link.entity_type === 'band' && link.entity_id === b.id && link.relation === 'band_photo')
      .map(link => state.mediaItems.find(item => item.id === link.media_id))
      .filter(item => item?.media_type === 'photo' && typeof item.original_url === 'string' && /^https?:\/\//i.test(item.original_url))
      .map(item => {
        const source = state.sources.find(source => source.id === item.source_id);
        return [item.original_url, item.title || ('Bandfoto: ' + b.canonical_name), source?.url || '', source?.title || ''];
      });
    // Bevara den gamla samlingen och komplettera med alla källkopplade foton.
    const seen = new Set();
    return [...curated, ...linked].filter(item => {
      if (!item?.[0] || seen.has(item[0])) return false;
      seen.add(item[0]);
      return true;
    });
  }

  function releaseGallery(r) {
    if (!r) return [];
    const b = releaseBand(r.id);
    const bandSlug = b ? slugify(b.canonical_name) : '';
    const titleSlug = slugify(r.title);
    const yearKey = `${bandSlug}|${titleSlug}|${r.release_year || ''}`;
    return RELEASE_GALLERY[yearKey] || RELEASE_GALLERY[`${bandSlug}|${titleSlug}`] || [];
  }

  function externalMediaMeta(src='') {
    if (src === 'assets/haerdsmaelta/press-2026.svg') return {sourceUrl:'https://icea.se/blogs/news/haerdsmaelta-unleash-new-single-enjoy-the-feast-first-taste-of-upcoming-album-haerdrock-released-june-12th-via-icons-creating-evil-art',label:'Icons Creating Evil Art · Haerdsmaelta pressbild 2026'};
    const localCover = Object.values(releaseCovers).find(cover => cover.src === src);
    if (localCover) return {sourceUrl:localCover.sourceUrl, label:localCover.label};
    const media = state.mediaItems.find(item => item.original_url === src);
    const source = media && state.sources.find(item => item.id === media.source_id);
    if (source?.url) return {sourceUrl:source.url, label:source.title};
    return EXTERNAL_MEDIA_META[src] || null;
  }

  function externalMediaCredit(src='') {
    const meta = externalMediaMeta(src);
    if (!meta) return '';
    return `<a class="external-media-credit" href="${escapeHtml(meta.sourceUrl)}" target="_blank" rel="noopener">Extern bildkälla: ${escapeHtml(meta.label)} ↗</a>`;
  }

  function archiveGallery(items, title = 'Bildarkiv') {
    if (!items?.length) return '';
    return `<div class="archive-gallery">${items.map(item => {
      const [src,caption,itemSourceUrl,itemSourceLabel] = item;
      const meta = externalMediaMeta(src);
      const sourceUrl = itemSourceUrl || meta?.sourceUrl || '';
      const sourceLabel = itemSourceLabel || meta?.label || '';
      return `<article class="archive-gallery-item${sourceUrl ? ' external-media' : ''}"><a class="archive-gallery-image-link" href="${src}" target="_blank" rel="noopener"><div class="archive-gallery-media"><img src="${src}" alt="${escapeHtml(caption)}" loading="lazy"></div></a><span>${escapeHtml(caption)}</span>${sourceUrl ? `<a class="archive-source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">Källa: ${escapeHtml(sourceLabel || 'extern källa')} ↗</a>` : ''}</article>`;
    }).join('')}</div>`;
  }

  function routePath() {
    const raw = location.hash.replace(/^#/, '') || '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  async function loadArchiveSnapshot() {
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/get_public_archive`, {
      method: 'POST',
      headers: { apikey: cfg.publishableKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{}'
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  }

  async function load() {
    let archiveLoaded = false;
    try {
      const snapshot = await loadArchiveSnapshot();
      archiveLoaded = true;
      Object.keys(state).forEach(key => state[key] = Array.isArray(snapshot?.[key]) ? snapshot[key] : []);
      try { const response=await fetch(`${cfg.supabaseUrl}/rest/v1/person_family_relations?select=person_a_id,person_b_id,relation_type,source_id,note`,{headers:{apikey:cfg.publishableKey,Accept:'application/json'}}); if(response.ok)state.familyRelations=await response.json(); } catch(error) { console.warn('Familjekopplingar kunde inte hämtas',error); }
      syncLabel.textContent = `Live från arkivet · ${new Date().toLocaleTimeString('sv-SE', {hour:'2-digit', minute:'2-digit'})}`;
      if (routePath() !== '/kontakt' || !$('.archive-contact-form')) renderRoute();
    } catch (err) {
      console.error(err);
      syncLabel.textContent = archiveLoaded ? 'Kunde inte visa arkivet' : 'Kunde inte nå arkivet';
      if (routePath() === '/kontakt') {
        if (!$('.archive-contact-form')) renderRoute();
        return;
      }
      app.innerHTML = `<section class="page page-narrow"><div class="error-box"><strong>${archiveLoaded ? 'Kunde inte visa arkivet.' : 'Kunde inte hämta arkivet.'}</strong><br>${archiveLoaded ? 'Ett fel uppstod när sidan skulle visas. Prova att ladda om.' : 'Kontrollera internetanslutningen och ladda om sidan.'}<span class="error-detail"> ${escapeHtml(err.message || '')}</span></div></section>`;
    }
  }

  function bandName(id) { return bandsById().get(id)?.canonical_name || 'Okänt band'; }
  function personName(id) { return peopleById().get(id)?.canonical_name || 'Okänd person'; }
  function releaseBand(releaseId) { const rb = state.releaseBands.find(x => x.release_id === releaseId); return rb ? bandsById().get(rb.band_id) : null; }
  function membershipsForBand(id) { return state.memberships.filter(x => x.band_id === id); }
  function membershipsForPerson(id) { return state.memberships.filter(x => x.person_id === id); }
  function isUppsalaBand(b) {
    if (!b) return false;

    // Supabase skickar en separat lista med de band som faktiskt klassas som
    // Uppsala-band. Den är facit för index/listor/statistik. Externa band finns
    // fortfarande kvar i state.bands så att personprofiler och direktlänkar
    // kan visa deras information utan att de hamnar på Uppsala-bandsidan.
    if (Array.isArray(state.uppsalaBandIds) && state.uppsalaBandIds.length) {
      return state.uppsalaBandIds.includes(b.id);
    }

    // Bakåtkompatibel fallback om en äldre RPC-version används. Om
    // archive_scope finns är den auktoritativ och vi ignorerar ett eventuellt
    // gammalt is_uppsala_band-värde.
    if (typeof b.archive_scope === 'string' && b.archive_scope) {
      return b.archive_scope === 'uppsala';
    }

    return b.is_uppsala_band === true;
  }
  function uppsalaBands() {
    // Ny RPC: state.bands innehåller bara Uppsala-band. Fallbacken behåller
    // stöd för äldre snapshots där alla band låg i samma array.
    return state.bands.every(b => b.archive_scope === 'uppsala' || b.is_uppsala_band === true)
      ? state.bands
      : state.bands.filter(isUppsalaBand);
  }
  function groupedMembershipsForBand(id) {
    const groups = new Map();
    membershipsForBand(id).forEach(m => {
      if (!groups.has(m.person_id)) groups.set(m.person_id, { person_id: m.person_id, memberships: [] });
      groups.get(m.person_id).memberships.push(m);
    });

    return [...groups.values()].map(group => {
      const memberships = [...group.memberships].sort((a,b) =>
        (a.joined_year || a.left_year || 9999) - (b.joined_year || b.left_year || 9999) ||
        (a.left_year || a.joined_year || 9999) - (b.left_year || b.joined_year || 9999)
      );
      const roles = [...new Set(memberships.map(m => roleSv(m.role || '')).filter(Boolean))];
      const periods = [...new Set(memberships.map(yearSpan))];
      const firstYear = memberships.reduce((min,m) => {
        const y = m.joined_year || m.left_year || 9999;
        return Math.min(min,y);
      },9999);
      return {
        person_id: group.person_id,
        roles: roles.join(' · '),
        periods: periods.join(' · '),
        firstYear
      };
    }).sort((a,b) => a.firstYear - b.firstYear || personName(a.person_id).localeCompare(personName(b.person_id),'sv'));
  }
  function groupedMembershipsForPerson(id) {
    const groups = new Map();
    membershipsForPerson(id).forEach(m => {
      const band = bandsById().get(m.band_id);
      const key = band ? `band:${band.id}` : `missing:${m.band_id}`;
      if (!groups.has(key)) groups.set(key, { band_id: m.band_id, band, memberships: [] });
      groups.get(key).memberships.push(m);
    });

    return [...groups.values()].map(group => {
      const memberships = [...group.memberships].sort((a,b) =>
        (a.joined_year || a.left_year || 9999) - (b.joined_year || b.left_year || 9999) ||
        (a.left_year || a.joined_year || 9999) - (b.left_year || b.joined_year || 9999)
      );
      const roles = [...new Set(memberships.map(m => roleSv(m.role || '')).filter(Boolean))];
      const periods = [...new Set(memberships.map(yearSpan).filter(Boolean))];
      const firstYear = memberships.reduce((min,m) => {
        const y = m.joined_year || m.left_year || 9999;
        return Math.min(min,y);
      },9999);
      return {
        band_id: group.band_id,
        band: group.band || bandsById().get(group.band_id),
        roles: roles.join(' · '),
        periods: periods.join(' · '),
        firstYear
      };
    }).filter(group => group.band).sort((a,b) =>
      a.firstYear - b.firstYear || a.band.canonical_name.localeCompare(b.band.canonical_name,'sv')
    );
  }

  function releasesForBand(id) {
    const ids = new Set(state.releaseBands.filter(x => x.band_id === id).map(x => x.release_id));
    return state.releases.filter(x => ids.has(x.id));
  }
  function creditsForRelease(id) { return state.releaseMembers.filter(x => x.release_id === id); }

  function claimsForEntity(type, id) {
    const ids = new Set(state.claimEntities.filter(x => x.entity_type === type && x.entity_id === id).map(x => x.claim_id));
    return state.claims.filter(c => ids.has(c.id));
  }

  function claimsForPerson(id) {
    const membershipIds = new Set(membershipsForPerson(id).map(x => x.id));
    return state.claims.filter(c => state.claimEntities.some(e => e.claim_id === c.id && ((e.entity_type === 'person' && e.entity_id === id) || (e.entity_type === 'membership' && membershipIds.has(e.entity_id)))));
  }

  function sourcesForClaims(claims) {
    const claimIds = new Set(claims.map(c => c.id));
    const sourceIds = new Set(state.claimSources.filter(cs => claimIds.has(cs.claim_id)).map(cs => cs.source_id));
    return state.sources.filter(s => sourceIds.has(s.id));
  }

  function roleSv(role = '') {
    const terms = {"member (role unresolved)":"medlem (roll ej fastställd)","performer (unspecified)":"medverkande (roll ej angiven)","band member":"bandmedlem","featured artist":"gästartist","cover artwork":"omslagsillustration","cover art":"omslagsillustration","cover design":"omslagsdesign","sleeve design":"omslagsdesign","lead guitars":"sologitarr","lead guitar":"sologitarr","rhythm guitars":"kompgitarr","rhythm guitar":"kompgitarr","backing vocals":"körsång","lead vocals":"huvudsång","guest vocals":"gästsång","all instruments":"alla instrument","co-producer":"medproducent","co-songwriting":"medverkan i låtskrivande","recorded bass":"inspelad bas","guitars":"gitarr","guitar":"gitarr","vocals":"sång","bass":"bas","drums":"trummor","keyboards":"keyboard","percussion":"slagverk","photography":"fotografi","production":"produktion","producer":"producent","mixing":"mixning","recording":"inspelning","engineering":"inspelningsteknik","engineer":"inspelningstekniker","songwriting":"låtskrivande","songwriter":"låtskrivare","lyrics":"sångtext","composition":"komposition","composer":"kompositör","contributor":"medverkande","member":"medlem","music":"musik","artwork":"illustration","design":"formgivning","programming":"programmering","synthesizers":"synthar","synthesizer":"synth","effects":"effekter","arrangements":"arrangemang","arrangement":"arrangemang","narration":"berättarröst","writer":"författare","session":"studio","guest":"gäst","additional":"extra","acoustic":"akustisk","electric":"elektrisk","female":"kvinnlig","male":"manlig","backing":"kör","lead":"solo","tracks":"spår","track":"spår","on":"på","and":"och"};
    const pattern = new RegExp("\\b(?:member \\(role unresolved\\)|performer \\(unspecified\\)|featured artist|all instruments|rhythm guitars|backing vocals|co-songwriting|cover artwork|sleeve design|rhythm guitar|recorded bass|cover design|lead guitars|guest vocals|synthesizers|arrangements|band member|lead guitar|lead vocals|co-producer|photography|engineering|songwriting|composition|contributor|programming|synthesizer|arrangement|percussion|production|songwriter|additional|cover art|keyboards|recording|narration|producer|engineer|composer|acoustic|electric|guitars|artwork|effects|session|backing|guitar|vocals|mixing|lyrics|member|design|writer|female|tracks|drums|music|guest|track|bass|male|lead|and|on)(?![a-z])", 'gi');
    return String(role).replace(pattern, match => terms[match.toLowerCase()]);
  }
  function statusSv(s) { return ({confirmed:'Bekräftad', probable:'Trolig', unconfirmed:'Obekräftad', disputed:'Omstridd', rejected:'Avfärdad'})[s] || s; }
  function sourceReliabilitySv(s) { return ({high:'Stark källa',medium:'Sekundärkälla',low:'Svag källa',unknown:'Ej bedömd'})[s] || s; }
  function relationSv(s) { return ({formed_from:'Bildades ur',renamed_to:'Bytte namn till',reformed_as:'Återbildades som',side_project:'Sidoprojekt till',successor:'Efterföljare till',predecessor:'Föregångare till',shared_lineup:'Delad lineup med',other:'Koppling till'})[s] || 'Koppling till'; }
  function yearSpan(m) {
    if (!m.joined_year && !m.left_year) return 'Årtal söks';
    if (m.joined_year && m.left_year) return `${m.joined_year}${m.left_year !== m.joined_year ? `–${m.left_year}` : ''}`;
    if (m.joined_year) return `Från ${m.joined_year} (slutår okänt)`;
    return `Till ${m.left_year} (startår okänt)`;
  }
  function archiveTextSv(text = '') {
    const translations = {"Documented in Uppsala hard rock/metal context.":"Dokumenterad i Uppsalas hårdrocks- och metalscen.","Documented in Uppsala hard rock/metal scene":"Dokumenterad i Uppsalas hårdrocks- och metalscen.","Documented in Uppsala metal-band context.":"Dokumenterad i samband med metalband från Uppsala.","Documented in Uppsala music archive":"Dokumenterad i Uppsalas musikarkiv.","Musician in Uppsala metal scene":"Musiker i Uppsalas metalscen.","Born in Uppsala; active in multiple Uppsala bands.":"Född i Uppsala och verksam i flera Uppsala-band.","Uppsala death metal band formed in 2005 by Hampus Eriksson, Emil Svensson and Rickard Höggren after Degial of Embos split.":"Death metal-band från Uppsala, bildat 2005 av Hampus Eriksson, Emil Svensson och Rickard Höggren efter att Degial of Embos splittrades.","Uppsala glam/hard rock band formed in early 1992.":"Glam- och hårdrocksband från Uppsala, bildat i början av 1992.","Uppsala thrash metal duo formed in 2020.":"Thrash metal-duo från Uppsala, bildad 2020.","Uppsala crossover/hardcore band formed in 2007.":"Crossover- och hardcoreband från Uppsala, bildat 2007.","Uppsala death metal band formed in 2021.":"Death metal-band från Uppsala, bildat 2021.","Uppsala black/death metal band formed in 2019.":"Black- och death metal-band från Uppsala, bildat 2019.","Uppsala hardcore band formed in spring 2019.":"Hardcoreband från Uppsala, bildat våren 2019.","Uppsala death metal band active 2004-2005.":"Death metal-band från Uppsala, verksamt 2004–2005.","Uppsala hardcore/crust band formed in 1992.":"Hardcore- och crustband från Uppsala, bildat 1992.","Uppsala crust/d-beat band active 1994-1999, with a 2004 reunion recording.":"Crust- och d-beat-band från Uppsala, verksamt 1994–1999, med en återföreningsinspelning 2004.","Uppsala stoner rock band formed in 1998.":"Stonerrockband från Uppsala, bildat 1998.","Uppsala melodic hard rock band active from 1992.":"Melodiskt hårdrocksband från Uppsala, verksamt från 1992.","Uppsala melodic hard rock band active in the 1980s.":"Melodiskt hårdrocksband från Uppsala, verksamt under 1980-talet.","Uppsala death/thrash metal band active 1999–2009.":"Death- och thrash metal-band från Uppsala, verksamt 1999–2009."};
    return translations[text] || text;
  }

  function translateClaim(s='') {
    const map = [
      [/was formed in Uppsala in (\d{4})\./, 'bildades i Uppsala $1.'],
      [/was a thrash metal band from Uppsala\./, 'var ett thrash metal-band från Uppsala.'],
      [/is listed as Vocals, Guitars in/, 'är listad som sångare och gitarrist i'],
      [/is listed as Vocals in/, 'är listad som sångare i'],
      [/is listed as Guitars in/, 'är listad som gitarrist i'],
      [/is listed as Bass in/, 'är listad som basist i'],
      [/is listed as Drums in/, 'är listad som trummis i']
    ];
    let out = s;
    map.forEach(([re, rep]) => { if (re.test(out)) out = out.replace(re, rep); });
    if (out.startsWith('Desecrate released the demo Lonely Disgrace')) return 'Desecrate gav ut demon Lonely Disgrace i december 1989 och spelade enligt nuvarande källa in den i Enköping den 3 och 6 december 1989.';
    if (out.startsWith('Sarcasm was formed')) return 'Sarcasm bildades i Uppsala 1990 ur musiker med bakgrund i Third Storm och Embalmed.';
    if (out.startsWith("Sarcasm's early 1990 lineup")) return 'Sarcasms tidiga lineup 1990 bestod av Heval Bozarslan (sång), Fredrik Wallenberg (gitarr), Henrik Forslund (trummor) och Dave Janney (bas).';
    return out;
  }

  function bandHref(b) { return `#/band/${slugify(b.canonical_name)}`; }
  function personHref(p) { return `#/person/${slugify(p.canonical_name)}`; }
  function releaseHref(r) { return `#/utgava/${slugify(`${r.title}-${r.release_year || ''}`)}`; }

  function findBand(slug) { return allBandRows().find(x => slugify(x.canonical_name) === slug); }
  function findPerson(slug) {
    // Preserve incoming links when verified duplicate profiles are merged.
    const aliases = {'john-s-swahn':'john-swahn', 'affe-piran':'afshin-affe-piran', 'spine':'lukas-hager', 'set-teitan':'davide-totaro', 'tina-gunnarsson':'tina-moller', 'henry-bowers':'nils-jansson', 'j-meggido':'joel-lindholm', 'hans-bruniusson':'hasse-bruniusson'};
    return state.people.find(x => slugify(x.canonical_name) === (aliases[slug] || slug));
  }
  function findRelease(slug) { return state.releases.find(x => slugify(`${x.title}-${x.release_year || ''}`) === slug); }

  function pageHeader(kicker, title, lead = '', meta = '') {
    return `<header class="page-hero">
      <div class="page-hero-inner">
        <div class="section-kicker">${escapeHtml(kicker)}</div>
        <h1>${title}</h1>
        ${lead ? `<p class="page-lead">${escapeHtml(lead)}</p>` : ''}
        ${meta ? `<div class="page-meta">${meta}</div>` : ''}
      </div>
    </header>`;
  }

  function breadcrumbs(items) {
    return `<nav class="breadcrumbs" aria-label="Brödsmulor">${items.map((x,i) => i === items.length - 1 ? `<span>${escapeHtml(x.label)}</span>` : `<a href="${x.href}">${escapeHtml(x.label)}</a><i>/</i>`).join('')}</nav>`;
  }

  function bandGaps(b) {
    const gaps = [];
    if (!b.formed_year) gaps.push('Bildningsår');
    if (!membershipsForBand(b.id).length) gaps.push('Medlemmar');
    if (!bandMedia(b) && !bandGallery(b).length) gaps.push('Bilder');
    return gaps;
  }

  function bandTipHref(b) {
    return '#/kontakt/' + encodeURIComponent(slugify(b.canonical_name));
  }

  function archiveGapsSection() {
    const candidates = uppsalaBands().map(b => ({band:b, gaps:bandGaps(b)}))
      .filter(item => item.gaps.length)
      .sort((a,b) => b.gaps.length - a.gaps.length || a.band.canonical_name.localeCompare(b.band.canonical_name, 'sv'));
    if (!candidates.length) return '';
    return `<section class="section archive-gaps">
      <div class="section-kicker">DIN KUNSKAP KAN GÖRA SKILLNAD</div>
      <div class="section-head compact-head"><h2>Hjälp oss fylla luckorna</h2><a class="text-link" href="#/kontakt">Alla tips är välkomna →</a></div>
      <p>Här saknar arkivet uppgifter eller bilder. Känner du till något om banden? Ett årtal, ett namn eller ett gammalt foto kan föra historien vidare.</p>
      <div class="gap-grid">${candidates.slice(0,6).map(({band:b,gaps}) => `<article class="gap-card">
        <h3><a href="${bandHref(b)}">${escapeHtml(b.canonical_name)}</a></h3>
        <p class="gap-label">Vi söker</p><ul>${gaps.map(gap => `<li>${escapeHtml(gap)}</li>`).join('')}</ul>
        <a class="button button-ghost" href="${bandTipHref(b)}">Jag vet mer <span aria-hidden="true">→</span></a>
      </article>`).join('')}</div>
      <p class="gap-note">Saknas i arkivet betyder att uppgiften ännu inte har registrerats här.</p>
    </section>`;
  }

  function searchText(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('sv');
  }

  function archiveSearch(query) {
    const terms = searchText(query).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return {bands:[], people:[], releases:[]};
    const matches = text => terms.every(term => searchText(text).includes(term));
    const people = peopleById(), bands = bandsById();
    const bandPeople = new Map(), personBands = new Map(), releasePeople = new Map(), releaseBandNames = new Map();
    const add = (map,id,value) => map.set(id,[...(map.get(id) || []),value]);
    state.memberships.forEach(m => {
      add(bandPeople,m.band_id,people.get(m.person_id)?.canonical_name || '');
      add(personBands,m.person_id,bands.get(m.band_id)?.canonical_name || '');
    });
    state.releaseMembers.forEach(c => add(releasePeople,c.release_id,
      (people.get(c.person_id)?.canonical_name || '') + ' ' + (c.credited_as || '')));
    state.releaseBands.forEach(c => add(releaseBandNames,c.release_id,bands.get(c.band_id)?.canonical_name || ''));
    const order = (items,name) => items.sort((a,b) => {
      const q = searchText(query).trim();
      const score = item => searchText(name(item)) === q ? 0 : searchText(name(item)).startsWith(q) ? 1 : 2;
      return score(a)-score(b) || name(a).localeCompare(name(b),'sv');
    });
    return {
      bands:order(allBandRows().filter(b => matches([b.canonical_name,(b.genres || []).join(' '),b.city,b.formed_year,(bandPeople.get(b.id) || []).join(' ')].join(' '))),b=>b.canonical_name),
      people:order(state.people.filter(p => matches([p.canonical_name,(personBands.get(p.id) || []).join(' ')].join(' '))),p=>p.canonical_name),
      releases:order(state.releases.filter(r => matches([r.title,r.release_year,(releaseBandNames.get(r.id) || []).join(' '),(releasePeople.get(r.id) || []).join(' ')].join(' '))),r=>r.title)
    };
  }

  function renderSearch(initialQuery = '') {
    app.innerHTML = pageHeader('HELA ARKIVET','Sök i arkivet','Hitta band, personer och utgåvor. Sök på ett namn, en titel, en genre eller ett årtal.')
      + '<section class="section first-section archive-search"><form class="archive-search-form" role="search">'
      + '<label class="search-box" for="archive-search-input"><span>Sök i hela arkivet</span>'
      + '<input id="archive-search-input" type="search" placeholder="Band, person eller utgåva…" autocomplete="off" maxlength="200"></label>'
      + '<button class="button button-primary" type="submit">Sök</button></form>'
      + '<p id="archive-search-status" role="status" aria-live="polite"></p><div id="archive-search-results"></div></section>';
    const input = $('#archive-search-input');
    input.value = initialQuery.slice(0,200);
    const renderResults = () => {
      const query = input.value.trim(), results = archiveSearch(query);
      const total = results.bands.length + results.people.length + results.releases.length;
      $('#archive-search-status').textContent = query ? total + ' träffar: ' + results.bands.length + ' band, ' + results.people.length + ' personer, ' + results.releases.length + ' utgåvor.' : 'Börja skriva för att söka i hela arkivet.';
      const group = (title,items,row) => '<section class="search-result-group"><h2>' + title + ' <span>(' + items.length + ')</span></h2>'
        + (items.length ? '<ul>' + items.map(item=>'<li>' + row(item) + '</li>').join('') + '</ul>' : '<p class="search-no-results">Inga träffar i denna kategori.</p>') + '</section>';
      const row = (href,title,meta) => '<a href="' + href + '"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(meta) + '</span></a>';
      $('#archive-search-results').innerHTML = !query ? '' : !total
        ? '<div class="empty-state">Inga träffar. Prova ett kortare namn, en annan stavning eller ett annat sökord.</div>'
        : group('Band',results.bands,b=>row(bandHref(b),b.canonical_name,[isUppsalaBand(b) ? 'Uppsala-band' : 'Relaterat band',b.formed_year ? 'Bildat ' + b.formed_year : '',(b.genres || []).join(' / ')].filter(Boolean).join(' · ')))
        + group('Personer',results.people,p=>row(personHref(p),p.canonical_name,[...new Set(membershipsForPerson(p.id).map(m=>bandsById().get(m.band_id)?.canonical_name).filter(Boolean))].join(' · ')))
        + group('Utgåvor',results.releases,r=>row(releaseHref(r),r.title,[releaseBand(r.id)?.canonical_name,r.release_year].filter(Boolean).join(' · ')));
    };
    input.addEventListener('input',renderResults);
    $('.archive-search-form').addEventListener('submit',event=>{
      event.preventDefault();
      history.replaceState(null,'', '#/sok' + (input.value.trim() ? '/' + encodeURIComponent(input.value.trim()) : ''));
      renderResults();
    });
    renderResults();
  }

  function renderHome() {
    const archiveBands = uppsalaBands();
    const earlyBands = [...archiveBands].sort((a,b) => (a.formed_year || 9999) - (b.formed_year || 9999)).slice(0, 6);
    const recentReleases = [...state.releases].sort((a,b) => (a.release_year || 9999) - (b.release_year || 9999)).slice(0, 6);
    const counts = state.claims.reduce((acc,c) => ((acc[c.status] = (acc[c.status] || 0) + 1), acc), {});

    app.innerHTML = `
      <section class="hero home-hero">
        <div class="hero-backdrop" aria-hidden="true"><div class="hero-word">UPPSALA</div><div class="hero-number">018</div></div>
        <div class="hero-inner">
          <p class="eyebrow">ETT LEVANDE ARKIV ÖVER EN SCEN</p>
          <h1>Där banden<br><span>hänger ihop.</span></h1>
          <p class="hero-lead">En växande kartläggning av Uppsalas hårdrock och metal — människorna, banden, demokassetterna och vägarna mellan dem.</p>
          <div class="hero-actions"><a class="button button-primary" href="#/sok">Sök i arkivet</a><a class="button button-ghost" href="#/band">Utforska banden</a><a class="button button-ghost" href="#/tidslinje">Se tidslinjen</a></div>
          <div class="hero-stats">
            <div><strong>${archiveBands.length}</strong><span>Uppsala-band</span></div>
            <div><strong>${state.people.length}</strong><span>personer</span></div>
            <div><strong>${state.releases.length}</strong><span>utgåvor</span></div>
            <div><strong>${state.sources.length}</strong><span>källor</span></div>
          </div>
        </div>
      </section>

      ${archiveGapsSection()}

      <section class="section home-intro">
        <div class="section-kicker">UPPSALA / FRÅN 1980-TALET OCH FRAMÅT</div>
        <div class="intro-grid">
          <h2>Inte en lista.<br>En <em>historia</em> om en scen.</h2>
          <div class="intro-copy">
            <p>Arkivet följer hur musiker rörde sig mellan band, hur nya konstellationer uppstod och hur en lokal scen växte fram.</p>
            <p>Varje band, person och utgåva får en egen sida. Där samlas tidslinje, medlemskap, krediter, kopplingar och källäge utan att allt hamnar i ett enda långt flöde.</p>
          </div>
        </div>
        <div class="confidence-strip">
          <div class="confidence-card"><strong class="verified">${counts.confirmed || 0}</strong><span>bekräftade uppgifter</span></div>
          <div class="confidence-card"><strong>${counts.probable || 0}</strong><span>troliga uppgifter</span></div>
          <div class="confidence-card"><strong>${state.claims.length}</strong><span>källkopplade uppgifter</span></div>
        </div>
      </section>

      <section class="section home-grid-section">
        <div class="section-head compact-head"><div><div class="section-kicker">TIDIGA KNUTPUNKTER</div><h2>Band</h2></div><a class="text-link" href="#/band">Alla band →</a></div>
        <div class="band-grid band-grid-preview">${earlyBands.map((b,i) => bandCard(b,i)).join('')}</div>
      </section>

      <section class="section home-grid-section">
        <div class="section-head compact-head"><div><div class="section-kicker">DEMOER / KASSETTER / UTGÅVOR</div><h2>Första spåren</h2></div><a class="text-link" href="#/utgavor">Alla utgåvor →</a></div>
        <div class="release-stack">${recentReleases.map(releaseRow).join('')}</div>
      </section>

      <section class="section home-grid-section archive-showcase-section">
        <div class="section-head compact-head"><div><div class="section-kicker">ORIGINALMATERIAL</div><h2>Ur bildarkivet</h2></div><span class="archive-count">${HOME_ARCHIVE_MEDIA.length} nedslag</span></div>
        ${archiveGallery(HOME_ARCHIVE_MEDIA)}
      </section>`;
  }

  function bandCard(b, i = 0) {
    const mems = membershipsForBand(b.id);
    const personIds = [...new Set(mems.map(m => m.person_id))];
    const names = personIds.slice(0,4).map(personName);
    const extra = personIds.length > 4 ? ` +${personIds.length - 4}` : '';
    const media = bandMedia(b);
    return `<a class="band-card${media ? ' has-media' : ''}" href="${bandHref(b)}" data-index="${String(i+1).padStart(2,'0')}">
      ${media ? `<img class="band-card-image" src="${media}" alt="${escapeHtml(b.canonical_name)}" loading="lazy"><div class="band-card-shade"></div>` : ''}
      <div class="band-meta"><span>${b.formed_year ? `Bildat ${b.formed_year}` : 'Årtal söks'}</span><span>${escapeHtml(b.city || '')}</span></div>
      <h3 class="band-title">${escapeHtml(b.canonical_name)}</h3>
      <div class="band-genre">${escapeHtml((b.genres || []).join(' / '))}</div>
      <div class="band-members">${escapeHtml(names.length ? names.join(' · ') + extra : 'Lineup kartläggs')}</div>
    </a>`;
  }


  function isDeceased(p) { return Boolean(p && (p.death_year || p.death_date)); }
  function deathYear(p) { return p.death_year || (p.death_date ? Number(String(p.death_date).slice(0,4)) : null); }
  function personLifeLabel(p) {
    const year = deathYear(p);
    if (!year) return '';
    return p.birth_year ? `${p.birth_year}–${year}` : String(year);
  }

  function personCard(p, i = 0) {
    const mems = membershipsForPerson(p.id);
    const names = [...new Set(mems.map(m => bandName(m.band_id)))];
    const media = personMedia(p);
    return `<a class="person-card${media ? ' has-portrait' : ''}" href="${personHref(p)}">
      ${media ? `<div class="person-card-portrait"><img src="${media}" alt="${escapeHtml(p.canonical_name)}" loading="lazy"></div>` : ''}
      <div class="person-card-copy"><div class="person-number">${String(i+1).padStart(2,'0')}</div><h3>${escapeHtml(p.canonical_name)}${isDeceased(p) ? '<span class="person-deceased-mark" aria-label="Avliden" title="Avliden">†</span>' : ''}</h3><div class="person-bands">${escapeHtml(names.join(' · ') || 'Koppling kartläggs')}</div></div>
    </a>`;
  }


  function releaseRow(r) {
    const band = releaseBand(r.id);
    const credits = creditsForRelease(r.id).slice(0,4).map(x => `${personName(x.person_id)} — ${roleSv(x.role)}`);
    const cover = releaseMedia(r);
    return `<a class="release-row${cover ? ' has-cover' : ''}" href="${releaseHref(r)}">
      <div class="release-cover-thumb">${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(r.title)}" loading="lazy">` : '<span>UHA</span>'}</div>
      <div class="release-year">${r.release_year || '—'}</div>
      <div><div class="release-title">${escapeHtml(r.title)}</div><span class="release-kind">${escapeHtml([r.release_type, r.format].filter(Boolean).join(' · '))}</span></div>
      <div class="release-band">${escapeHtml(band?.canonical_name || 'Band kartläggs')}</div>
      <div class="release-credits">${escapeHtml(credits.join(' · ') || 'Krediter kartläggs')}${creditsForRelease(r.id).length > 4 ? ' …' : ''}</div>
    </a>`;
  }



  function normalizedFilterText(value) {
    return String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  }

  function genreFilterLabel(value) {
    return normalizedFilterText(value).toLocaleLowerCase('sv')
      .replace(/\s*\/\s*/g, ' / ')
      .split(' ').map(word => word === 'aor' ? 'AOR' : word.charAt(0).toLocaleUpperCase('sv') + word.slice(1)).join(' ');
  }

  function cityFilterLabel(value) {
    const places = normalizedFilterText(value).split('/').map(part => normalizedFilterText(part).toLocaleLowerCase('sv'))
      .filter(Boolean);
    return [...new Set(places)].sort((a,b) => a === b ? 0 : a === 'uppsala' ? -1 : b === 'uppsala' ? 1 : a.localeCompare(b,'sv'))
      .map(place => place.replace(/(^|[\s-])\p{L}/gu, letter => letter.toLocaleUpperCase('sv'))).join(' / ');
  }

  function renderBandIndex() {
    const bands = uppsalaBands();
    const byName = (a, b) => a.canonical_name.localeCompare(b.canonical_name, 'sv', { sensitivity: 'base' });
    const selectOptions = values => values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    const genres = [...new Set(bands.flatMap(b => Array.isArray(b.genres) ? b.genres.map(genreFilterLabel) : []).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'sv'));
    const cities = [...new Set(bands.map(b => cityFilterLabel(b.city)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'sv'));
    const decades = [...new Set(bands.map(b => Number(b.formed_year))
      .filter(year => Number.isInteger(year) && year >= 1900)
      .map(year => Math.floor(year / 10) * 10))].sort((a, b) => a - b);
    const releaseIds = new Map();
    state.releaseBands.forEach(link => {
      if (!releaseIds.has(link.band_id)) releaseIds.set(link.band_id, new Set());
      releaseIds.get(link.band_id).add(link.release_id);
    });
    const releaseCount = band => releaseIds.get(band.id)?.size || 0;
    const hasPhoto = band => Boolean(bandPhoto(band) ||
      /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(BAND_MEDIA[slugify(band.canonical_name)] || ''));

    app.innerHTML = `${pageHeader('BAND I ARKIVET','Band','Från tidig hårdrock och thrash till death, black och senare grenar av Uppsalas metalscen.')}
      <section class="section page-section first-section">
        <div class="index-toolbar">
          <label class="search-box"><span>Sök band</span><input id="band-search" type="search" placeholder="Namn, genre, ort eller år…" autocomplete="off"></label>
          <div class="index-count"><strong id="band-count" aria-live="polite">${bands.length}</strong> band</div>
        </div>
        <div class="band-filter-bar" aria-label="Filtrera och sortera band">
          <label class="band-filter-field"><span>Sortera</span><select id="band-sort">
            <option value="oldest">Äldsta först</option>
            <option value="newest">Nyaste först</option>
            <option value="name-asc">Namn A–Ö</option>
            <option value="name-desc">Namn Ö–A</option>
            <option value="releases">Flest utgåvor</option>
          </select></label>
          <label class="band-filter-field"><span>Genre</span><select id="band-genre"><option value="">Alla genrer</option>${selectOptions(genres)}</select></label>
          <label class="band-filter-field"><span>Årtionde</span><select id="band-decade"><option value="">Alla årtionden</option>${decades.map(year => `<option value="${year}">${year}-talet</option>`).join('')}</select></label>
          <label class="band-filter-field"><span>Ort</span><select id="band-city"><option value="">Alla orter</option>${selectOptions(cities)}</select></label>
        </div>
        <div class="band-filter-actions">
          <label class="band-photo-toggle"><input id="band-photo-only" type="checkbox"><span>Endast band med foto</span></label>
          <button class="band-filter-reset" id="band-filter-reset" type="button" hidden>Rensa filter <span aria-hidden="true">×</span></button>
        </div>
        <div class="band-grid" id="band-grid"></div>
      </section>`;

    const input = $('#band-search');
    const sort = $('#band-sort');
    const genre = $('#band-genre');
    const decade = $('#band-decade');
    const city = $('#band-city');
    const photoOnly = $('#band-photo-only');
    const reset = $('#band-filter-reset');
    const grid = $('#band-grid');
    const count = $('#band-count');

    const update = () => {
      const term = input.value.trim().toLocaleLowerCase('sv');
      const selectedGenre = genre.value;
      const selectedDecade = decade.value;
      const selectedCity = city.value;
      const filtered = bands.filter(b => {
        if (term && !`${b.canonical_name} ${(b.genres || []).join(' ')} ${b.city || ''} ${cityFilterLabel(b.city)} ${b.formed_year || ''}`.toLocaleLowerCase('sv').includes(term)) return false;
        if (selectedGenre && !(b.genres || []).some(value => genreFilterLabel(value) === selectedGenre)) return false;
        if (selectedDecade && Math.floor(Number(b.formed_year) / 10) * 10 !== Number(selectedDecade)) return false;
        if (selectedCity && cityFilterLabel(b.city) !== selectedCity) return false;
        if (photoOnly.checked && !hasPhoto(b)) return false;
        return true;
      });
      const year = b => Number(b.formed_year) >= 1900 ? Number(b.formed_year) : null;
      filtered.sort((a, b) => {
        if (sort.value === 'name-asc') return byName(a, b);
        if (sort.value === 'name-desc') return byName(b, a);
        if (sort.value === 'releases') return releaseCount(b) - releaseCount(a) || byName(a, b);
        if (sort.value === 'newest') return (year(b) ?? -Infinity) - (year(a) ?? -Infinity) || byName(a, b);
        return (year(a) ?? Infinity) - (year(b) ?? Infinity) || byName(a, b);
      });
      grid.innerHTML = filtered.length
        ? filtered.map((band, index) => bandCard(band, index)).join('')
        : '<div class="band-filter-empty"><strong>Inga band hittades.</strong><span>Prova en annan sökning eller rensa filtren.</span></div>';
      count.textContent = filtered.length;
      reset.hidden = !(term || sort.value !== 'oldest' || selectedGenre || selectedDecade || selectedCity || photoOnly.checked);
    };

    input.addEventListener('input', update);
    [sort, genre, decade, city, photoOnly].forEach(control => control.addEventListener('change', update));
    reset.addEventListener('click', () => {
      input.value = '';
      sort.value = 'oldest';
      genre.value = '';
      decade.value = '';
      city.value = '';
      photoOnly.checked = false;
      update();
      input.focus();
    });
    update();
  }


  // Videoarkivet återanvänder de källkontrollerade YouTube-kopplingarna.
  // Årtionden baseras på utgåvans år, aldrig YouTubes uppladdningsdatum.
  function archiveVideoCatalog() {
    const bands = new Map(allBandRows().map(b => [slugify(b.canonical_name), b]));
    const bandIds = bandsById();
    const releases = releasesById();
    const releaseBandIds = new Map(state.releaseBands.map(rb => [rb.release_id, rb.band_id]));
    const unique = new Map();
    (window.ARCHIVE_YOUTUBE || []).forEach(item => {
      if (!/^[A-Za-z0-9_-]{11}$/.test(item?.id || '')) return;
      const release = releases.get(item.release) || null;
      const band = bands.get(item.band) || bandIds.get(releaseBandIds.get(item.release)) || null;
      const yearValue = Number(release?.release_year);
      const year = Number.isInteger(yearValue) && yearValue >= 1950 && yearValue <= 2100 ? yearValue : null;
      const kind = ['track','album','live','medley','interview'].includes(item.kind) ? item.kind : 'other';
      const record = {
        id:item.id, title:String(item.title || release?.title || 'Arkivklipp'), band, release,
        bandName:band?.canonical_name || String(item.band || 'Okänt band').replace(/-/g,' '),
        year, kind, channel:String(item.channel || '')
      };
      const previous = unique.get(item.id);
      if (!previous || (!isUppsalaBand(previous.band) && isUppsalaBand(band))) unique.set(item.id,record);
    });
    return [...unique.values()];
  }

  function renderVideos(initialVideoId = '') {
    const videos = archiveVideoCatalog();
    const byVideoId = new Map(videos.map(video => [video.id,video]));
    const categories = {
      track:'Låt / inspelning', album:'Hela utgåvan', live:'Live',
      medley:'Medley', interview:'Intervju', other:'Övrigt'
    };
    const decadeValues = [...new Set(videos.filter(v=>v.year).map(v=>Math.floor(v.year/10)*10))].sort((a,b)=>a-b);
    const options = decadeValues.map(y=>'<option value="' + y + '">' + y + '-talet</option>').join('');
    const bandTotal = new Set(videos.map(v=>v.band?.id || v.bandName)).size;
    app.innerHTML = pageHeader('MUSIK / FILM / ARKIV','Videor','Musik, fullängdare, liveupptagningar och sällsynta inspelningar från band i och kring Uppsalas hårdrocksscen.',
      '<span>' + videos.length.toLocaleString('sv-SE') + ' unika klipp</span><span>' + bandTotal + ' band</span>')
      + '<section class="section first-section video-page">'
      + '<div class="video-roulette" id="video-roulette">'
      + '<div class="video-roulette-top"><div><span class="section-kicker">HÅRDROCKSROULETTE / TIDSMASKINEN</span><h2>Slumpa ett fynd.</h2>'
      + '<p>Välj ett årtionde nedan, tryck på knappen och se var i musikhistorien du hamnar. Årtal avser utgåvan, inte videons uppladdning.</p></div>'
      + '<div class="video-roulette-actions"><button class="button button-primary video-roulette-button" type="button" id="video-random">▶ ÖVERRASKA MIG</button>'
      + '<button class="button button-ghost video-marathon-start" type="button" id="video-marathon-start">♫ STARTA ARKIVMARATON</button></div></div>'
      + '<div class="video-journey" aria-label="Din upptäcktsrunda">'
      + '<div class="video-journey-info"><strong id="video-journey-count">0 klipp upptäckta</strong><span id="video-journey-bands">0 band upptäckta</span></div>'
      + '<div class="video-journey-controls"><button type="button" id="video-back" disabled>← Tillbaka</button><button type="button" id="video-forward" disabled>Framåt →</button><button type="button" id="video-restart">Börja om ↺</button></div>'
      + '<div class="video-journey-progress" aria-hidden="true"><span id="video-journey-bar"></span></div></div>'
      + '<div class="video-marathon" id="video-marathon" hidden>'
      + '<div class="video-marathon-copy"><span class="section-kicker">ARKIVMARATON / FEM FYND</span><strong id="video-marathon-status" role="status">Klipp 1 av 5</strong>'
      + '<span id="video-marathon-band">Fem olika band. Fem oväntade stopp.</span></div>'
      + '<div class="video-marathon-controls"><button type="button" id="video-marathon-next">Nästa klipp →</button><button type="button" id="video-marathon-stop">Avsluta ✕</button></div>'
      + '<div class="video-marathon-progress" id="video-marathon-progress" aria-label="Maratonets framsteg"></div>'
      + '</div>'
      + '<div class="video-spotlight" id="video-spotlight" aria-live="polite"></div></div>'
      + '<div class="video-catalog-head"><div><span class="section-kicker">UTFORSKA ARKIVET</span><h2>Alla videor</h2></div><p id="video-count" role="status"></p></div>'
      + '<div class="video-filters">'
      + '<label class="video-field video-field-search"><span>Sök band, låt eller utgåva</span><input id="video-search" type="search" maxlength="160" placeholder="Exempel: Watain, demo, live…" autocomplete="off"></label>'
      + '<label class="video-field"><span>Videotyp</span><select id="video-type"><option value="">Alla typer</option><option value="track">Låtar</option><option value="album">Hela utgåvor</option><option value="live">Live</option><option value="medley">Medley</option><option value="interview">Intervjuer</option><option value="other">Övrigt</option></select></label>'
      + '<label class="video-field"><span>Tidsmaskin · utgåveår</span><select id="video-decade"><option value="">Alla årtionden</option>' + options + '<option value="unknown">Okänt år</option></select></label>'
      + '<label class="video-field"><span>Sortera</span><select id="video-order"><option value="old">Äldsta först</option><option value="new">Nyaste först</option><option value="band">Band A–Ö</option></select></label>'
      + '<button class="video-reset" type="button" id="video-reset">Rensa filter ↺</button></div>'
      + '<div class="video-grid" id="video-grid"></div>'
      + '<div class="video-more-wrap"><button class="button button-ghost" type="button" id="video-more">Visa fler videor ↓</button></div>'
      + '<p class="video-archive-note">Videorna ligger kvar på YouTube och laddas här först när du väljer att spela upp dem. Saknas något? <a href="#/kontakt">Tipsa arkivet.</a></p>'
      + '</section>';
    const search = $('#video-search'), type = $('#video-type'), decade = $('#video-decade'), order = $('#video-order');
    const grid = $('#video-grid'), spotlight = $('#video-spotlight'), roulette = $('#video-random'), more = $('#video-more');
    const marathonStart = $('#video-marathon-start'), marathonArea = $('#video-marathon');
    const marathonNext = $('#video-marathon-next'), marathonStop = $('#video-marathon-stop');
    const marathonStatus = $('#video-marathon-status'), marathonBand = $('#video-marathon-band'), marathonProgress = $('#video-marathon-progress');
    let marathonQueue = [], marathonIndex = -1;
    const bandKey = video => String(video.band?.id || video.bandName).toLocaleLowerCase('sv');
    const updateMarathon = () => {
      const active = marathonQueue.length > 0 && marathonIndex >= 0;
      marathonArea.hidden = !active;
      const availableBands = new Set(filtered.map(bandKey)).size;
      marathonStart.disabled = availableBands < 2;
      marathonStart.title = availableBands < 2 ? 'Välj ett urval med minst två olika band' : 'Fem slumpade klipp från olika band';
      if (!active) return;
      marathonStatus.textContent = 'Klipp ' + (marathonIndex + 1) + ' av ' + marathonQueue.length;
      marathonBand.textContent = marathonQueue[marathonIndex].bandName + ' · ' + (marathonQueue.length - marathonIndex - 1) + ' fynd kvar';
      marathonNext.textContent = marathonIndex >= marathonQueue.length - 1 ? 'MARATONET KLART ✓' : 'NÄSTA KLIPP →';
      marathonNext.disabled = marathonIndex >= marathonQueue.length - 1;
      marathonProgress.innerHTML = marathonQueue.map((video,i) => '<span class="' + (i < marathonIndex ? 'is-complete' : i === marathonIndex ? 'is-current' : '') + '" aria-hidden="true"></span>').join('');
      marathonProgress.setAttribute('aria-label', (marathonIndex + 1) + ' av ' + marathonQueue.length + ' klipp');
    };
    const endMarathon = () => { marathonQueue = []; marathonIndex = -1; updateMarathon(); };
    // Local-only discovery progress, with safe fallback when browser storage is disabled.
    const journeyStorageKey = 'uppsala-hardrocksarkiv-videojourney-v1';
    const savedJourney = (() => {
      try {
        const value = JSON.parse(localStorage.getItem(journeyStorageKey) || 'null');
        return value && Array.isArray(value.seen) && Array.isArray(value.journey) ? value : null;
      } catch { return null; }
    })();
    const seen = new Set((savedJourney?.seen || []).filter(id => byVideoId.has(id)));
    const journey = (savedJourney?.journey || []).filter(id => byVideoId.has(id)).slice(-1500);
    let journeyIndex = journey.length
      ? Math.max(0, Math.min(Number.isInteger(savedJourney?.index) ? savedJourney.index : journey.length - 1, journey.length - 1))
      : -1;
    const persistJourney = () => {
      try {
        localStorage.setItem(journeyStorageKey, JSON.stringify({
          seen:[...seen], journey, index:journeyIndex
        }));
      } catch { /* The roulette still works when storage is unavailable. */ }
    };
    let filtered = [], displayed = 24, selected = byVideoId.get(journey[journeyIndex]) || null;
    const back = $('#video-back'), forward = $('#video-forward'), restart = $('#video-restart');
    const journeyCount = $('#video-journey-count'), journeyBands = $('#video-journey-bands'), journeyBar = $('#video-journey-bar');
    const updateJourney = () => {
      const discoveredBands = new Set([...seen].map(id => byVideoId.get(id)?.band?.id || byVideoId.get(id)?.bandName).filter(Boolean)).size;
      const unseenInFilter = filtered.filter(video => !seen.has(video.id)).length;
      journeyCount.textContent = seen.size.toLocaleString('sv-SE') + ' av ' + videos.length.toLocaleString('sv-SE') + ' klipp upptäckta';
      journeyBands.textContent = discoveredBands.toLocaleString('sv-SE') + ' av ' + bandTotal.toLocaleString('sv-SE') + ' band';
      journeyBar.style.width = (videos.length ? Math.min(100, seen.size / videos.length * 100) : 0) + '%';
      roulette.disabled = unseenInFilter === 0;
      const filtersActive = Boolean(search.value.trim() || type.value || decade.value);
      roulette.textContent = !filtered.length ? 'INGA KLIPP ATT SLUMPA' : unseenInFilter
        ? '▶ ÖVERRASKA MIG · ' + unseenInFilter.toLocaleString('sv-SE') + ' KVAR' + (filtersActive ? ' I URVALET' : '')
        : 'ALLA KLIPP I URVALET UPPTÄCKTA ✓';
      roulette.title = filtersActive ? unseenInFilter + ' oupptäckta klipp inom nuvarande filter (' + filtered.length + ' klipp i urvalet).' : unseenInFilter + ' oupptäckta klipp i hela arkivet.';
      back.disabled = journeyIndex <= 0;
      forward.disabled = journeyIndex >= journey.length - 1;
      restart.disabled = seen.size === 0;
    };
    const sv = (a,b) => a.localeCompare(b,'sv',{sensitivity:'base'});
    const kindName = video => categories[video.kind] || categories.other;
    const meta = video => [video.release?.title, video.year || 'År okänt'].filter(Boolean).join(' · ');
    const safeVideoLink = video => 'https://www.youtube.com/watch?v=' + video.id;

    const feature = (video, remember = true) => {
      if (!video) {
        selected = null;
        spotlight.innerHTML = '<div class="video-spotlight-empty">Inga klipp matchar dina filter. Prova en annan tidsresa.</div>';
        updateJourney();
        return;
      }
      selected = video;
      seen.add(video.id);
      if (remember && journey[journeyIndex] !== video.id) {
        journey.splice(journeyIndex + 1);
        journey.push(video.id);
        journeyIndex = journey.length - 1;
      }
      persistJourney();
      updateJourney();
      const bandUrl = video.band ? bandHref(video.band) : '';
      const releaseUrl = video.release ? releaseHref(video.release) : '';
      spotlight.innerHTML = '<div class="video-feature-copy">'
        + '<span class="video-feature-label">ARKIVFYND <span aria-hidden="true">✦</span> ' + escapeHtml(kindName(video)) + '</span>'
        + '<h3>' + escapeHtml(video.title) + '</h3>'
        + '<p class="video-feature-band">' + escapeHtml(video.bandName) + '</p>'
        + '<p class="video-feature-meta">' + escapeHtml(meta(video)) + '</p>'
        + '<div class="video-feature-links">'
        + (bandUrl ? '<a href="' + bandUrl + '">Bandsida ↗</a>' : '')
        + (releaseUrl ? '<a href="' + releaseUrl + '">Utgåvan ↗</a>' : '')
        + '<a href="' + safeVideoLink(video) + '" target="_blank" rel="noopener noreferrer">YouTube ↗</a>'
        + '<button type="button" id="video-share">Kopiera arkivlänk ↗</button></div>'
        + (video.channel ? '<p class="video-feature-channel">YouTube-kanal: ' + escapeHtml(video.channel) + '</p>' : '')
        + '</div><div class="video-feature-media"><div class="youtube-preview" data-youtube-id="' + video.id + '">'
        + '<button type="button" class="youtube-play" aria-label="' + escapeHtml('Spela '+ video.title) + '">'
        + '<span aria-hidden="true">▶</span><strong>' + escapeHtml(video.title) + '</strong>'
        + '<span>Spela videon</span><img class="youtube-thumbnail" src="https://i.ytimg.com/vi/' + video.id + '/hqdefault.jpg" alt="" loading="lazy" referrerpolicy="no-referrer">'
        + '</button></div></div>';
      $('#video-share')?.addEventListener('click', async event => {
        const url = location.href.split('#')[0] + '#/videor/' + video.id;
        try {
          if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(url);
          event.currentTarget.textContent = 'Länken kopierad ✓';
        } catch (e) {
          window.prompt('Kopiera länken till arkivklippet:', url);
        }
      });
      bindYoutubePreviews();
      $$('.video-card').forEach(card=>card.classList.toggle('is-current',card.dataset.videoId===video.id));
    };
    const card = video => '<button type="button" class="video-card' + (selected?.id===video.id ? ' is-current' : '') + '" data-video-id="' + video.id + '" aria-label="' + escapeHtml('Visa '+video.title+' med '+video.bandName) + '">'
      + '<span class="video-card-media"><img loading="lazy" src="https://i.ytimg.com/vi/' + video.id + '/mqdefault.jpg" alt="">'
      + '<span class="video-card-play" aria-hidden="true">▶</span><span class="video-card-kind">' + escapeHtml(kindName(video)) + '</span></span>'
      + '<span class="video-card-copy"><span class="video-card-band">' + escapeHtml(video.bandName) + '</span>'
      + '<strong>' + escapeHtml(video.title) + '</strong><small>' + escapeHtml(meta(video)) + '</small></span></button>';
    const updateGrid = () => {
      grid.innerHTML = filtered.length
        ? filtered.slice(0,displayed).map(card).join('')
        : '<div class="video-empty">Inga videor matchar sökningen. Testa färre filter.</div>';
      $('#video-count').textContent = filtered.length.toLocaleString('sv-SE') + ' videor · visar ' + Math.min(displayed,filtered.length).toLocaleString('sv-SE');
      more.hidden = filtered.length <= displayed;
    };
    const update = (reset = true) => {
      if (reset) displayed = 24;
      const query = search.value.trim().toLocaleLowerCase('sv');
      const decadeFilter = decade.value;
      filtered = videos.filter(video => (!type.value || video.kind===type.value)
        && (!decadeFilter || (decadeFilter==='unknown' ? !video.year : video.year && Math.floor(video.year/10)*10===Number(decadeFilter)))
        && (!query || [video.title,video.bandName,video.release?.title,video.channel,String(video.year || '')]
          .join(' ').toLocaleLowerCase('sv').includes(query)));
      filtered.sort((a,b) => order.value==='band'
        ? sv(a.bandName,b.bandName) || sv(a.title,b.title)
        : order.value==='new'
          ? (b.year || -1)-(a.year || -1) || sv(a.bandName,b.bandName)
          : (a.year || 9999)-(b.year || 9999) || sv(a.bandName,b.bandName));
      if (!selected || !filtered.some(video=>video.id===selected.id)) {
        // Ett stabilt dagens fynd, slumpknappen ger därefter nya överraskningar.
        const day = Math.floor(Date.now()/86400000);
        feature(filtered.length ? filtered[(day * 7919) % filtered.length] : null);
      }
      updateGrid();
      updateJourney();
      updateMarathon();
    };
    [search,type,decade,order].forEach(input=>input.addEventListener(input===search ? 'input' : 'change',()=>{endMarathon();update();}));
    $('#video-reset').addEventListener('click',()=>{
      search.value='';type.value='';decade.value='';order.value='old';selected=null;endMarathon();update();search.focus();
    });
    const randomDiscovery = () => {
      const unseen = filtered.filter(video => !seen.has(video.id));
      if (!unseen.length) return;
      feature(unseen[Math.floor(Math.random() * unseen.length)]);
      updateGrid();
    };
    roulette.addEventListener('click',()=>{endMarathon();randomDiscovery();});
    // Five genuinely different bands, sampled from the active video filters.
    // A queue only advances after the visitor chooses the next discovery.
    marathonStart.addEventListener('click',()=>{
      const shuffled = [...filtered];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];
      }
      const pickedBands = new Set();
      marathonQueue = shuffled.filter(video=>{
        const key = bandKey(video);
        if (pickedBands.has(key) || pickedBands.size >= 5) return false;
        pickedBands.add(key);
        return true;
      });
      if (marathonQueue.length < 2) { endMarathon(); return; }
      marathonIndex = 0;
      feature(marathonQueue[marathonIndex]);
      updateGrid();
      updateMarathon();
      spotlight.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    marathonNext.addEventListener('click',()=>{
      if (marathonIndex < 0 || marathonIndex >= marathonQueue.length - 1) return;
      marathonIndex++;
      feature(marathonQueue[marathonIndex]);
      updateGrid();
      updateMarathon();
      spotlight.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    marathonStop.addEventListener('click',endMarathon);
    back.addEventListener('click',()=>{
      if (journeyIndex <= 0) return;
      endMarathon();
      journeyIndex--;
      feature(byVideoId.get(journey[journeyIndex]),false);
      updateGrid();
    });
    forward.addEventListener('click',()=>{
      if (journeyIndex >= journey.length - 1) return;
      endMarathon();
      journeyIndex++;
      feature(byVideoId.get(journey[journeyIndex]),false);
      updateGrid();
    });
    restart.addEventListener('click',()=>{
      endMarathon();
      seen.clear(); journey.length = 0; journeyIndex = -1;
      persistJourney();
      selected = null;
      randomDiscovery();
      updateJourney();
    });
    grid.addEventListener('click',event=>{
      const button=event.target.closest('button[data-video-id]');
      const video=byVideoId.get(button?.dataset.videoId);
      if (!video) return;
      endMarathon();
      feature(video);
      updateGrid();
      spotlight.scrollIntoView({behavior:'smooth',block:'center'});
    });
    more.addEventListener('click',()=>{displayed+=24;updateGrid();});
    if (initialVideoId && byVideoId.has(initialVideoId)) selected = byVideoId.get(initialVideoId);
    update();
    if (selected) feature(selected);

  }

  function spotifyLink(band, releaseId) {
    const data = window.ARCHIVE_SPOTIFY || {};
    const release = releaseId ? data.releases?.[releaseId] : null;
    const id = releaseId ? release?.id : data.artists?.[slugify(band?.canonical_name || '')];
    if (!/^[A-Za-z0-9]{22}$/.test(id || '')) return '';
    return '<a class="spotify-link" href="https://open.spotify.com/' + (releaseId ? 'album/' : 'artist/') + id
      + '" target="_blank" rel="noopener noreferrer">' + (releaseId ? 'Öppna utgåvan på Spotify ↗' : 'Lyssna på Spotify ↗')
      + '</a>' + (release?.note ? '<small class="spotify-edition">' + escapeHtml(release.note) + '</small>' : '');
  }

  function youtubeItems(band, releaseId) {
    const items = (window.ARCHIVE_YOUTUBE || []).filter(item => /^[A-Za-z0-9_-]{11}$/.test(item.id)
      && (releaseId ? item.release === releaseId : item.band === slugify(band?.canonical_name || '') && !item.multipleArtists));
    return [...new Map(items.map(item=>[item.id,item])).values()];
  }

  function youtubeTrackLink(releaseId, title) {
    const normalize = value => String(value || '').normalize('NFC').toLocaleLowerCase('sv').trim().replace(/\s+/g,' ');
    const item = youtubeItems(null,releaseId).find(item => (item.kind === 'track' || item.kind === 'medley') && [item.title,...(item.trackTitles || [])].some(value=>normalize(value) === normalize(title)));
    return item ? '<a class="youtube-track-link" href="https://www.youtube.com/watch?v=' + item.id
      + '" target="_blank" rel="noopener noreferrer" aria-label="' + escapeHtml(title + ' på YouTube (öppnas i ny flik)') + '">YouTube ↗</a>' : '';
  }

  function youtubeSection(band, releaseId) {
    const items = youtubeItems(band,releaseId);
    if (!items.length) return '';
    const songs = items.filter(item=>item.kind === 'track');
    const ranked = songs.filter(item=>Number.isFinite(item.views)).sort((a,b)=>b.views-a.views);
    const featured = ranked[0] || songs[0] || items.find(item => item.kind === 'album') || items.find(item => item.kind === 'medley');
    if (!featured) return '';
    return '<section class="content-section youtube-section"><h2>Lyssna på YouTube</h2>'
      + (featured ? '<div class="youtube-preview" data-youtube-id="' + featured.id + '"><button type="button" class="youtube-play" aria-label="'
      + escapeHtml('Spela ' + featured.title) + '"><span aria-hidden="true">▶</span><strong>' + escapeHtml(featured.title)
      + '</strong><span>Klicka för att ladda videon</span><img class="youtube-thumbnail" src="https://i.ytimg.com/vi/' + featured.id + '/hqdefault.jpg" alt="" loading="lazy" referrerpolicy="no-referrer"></button></div>'
      + '<p class="youtube-caption">' + (featured.kind === 'track' ? 'Verifierat låtklipp ur arkivet.' : featured.kind === 'medley' ? 'Verifierat klipp med flera låtar.' : 'Verifierad inspelning av utgåvan.')
      + (featured.views != null ? ' Cirka ' + featured.views.toLocaleString('sv-SE') + ' visningar, kontrollerat ' + featured.checked + '.' : '')
      + (featured.channel ? ' Kanal: ' + escapeHtml(featured.channel) + '.' : '') + '</p>' : '')
      + '</section>';
  }

  function bindYoutubePreviews() {
    $$('.youtube-preview button').forEach(button=>{
      if (button.dataset.youtubeBound) return;
      button.dataset.youtubeBound = '1';
      button.addEventListener('click',()=>{
      const holder = button.parentElement;
      const id = holder.dataset.youtubeId;
      if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
      const frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1';
      frame.title = button.getAttribute('aria-label');
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      holder.replaceChildren(frame);
      });
    });
  }

  function renderBandDetail(b) {
    const mems = membershipsForBand(b.id);
    const memberGroups = groupedMembershipsForBand(b.id);
    const rels = releasesForBand(b.id).sort((a,c) => (a.release_year || 9999) - (c.release_year || 9999));
    const claims = claimsForEntity('band', b.id);
    const sources = sourcesForClaims(claims);
    const links = state.relations.filter(r => r.from_band_id === b.id || r.to_band_id === b.id);
    const gallery = bandGallery(b);
    const uppsalaBand = isUppsalaBand(b);
    const bandKicker = uppsalaBand ? 'BAND / UPPSALA' : (b.archive_scope === 'external' ? 'RELATERAT BAND' : 'BAND / OKLASSIFICERAT');
    const bandPlace = b.city || (uppsalaBand ? 'Uppsala' : 'Ort söks');
    const defaultDescription = uppsalaBand
      ? `Ett dokumenterat band i Uppsala-scenen. Arkivet bygger successivt ut historik, lineups, utgåvor och kopplingar kring ${b.canonical_name}.`
      : `Ett relaterat band i person- och meritnätverket. ${b.canonical_name} klassas inte som ett Uppsala-band, men finns med för att visa dokumenterade bandhistoriker och kopplingar.`;
    const scopeLabel = uppsalaBand ? 'Uppsala-band' : (b.archive_scope === 'external' ? 'Relaterat band' : 'Oklassificerat');
    const meta = [b.formed_year ? `Bildat ${b.formed_year}` : 'Bildningsår söks', bandPlace, ...(b.genres || [])].map(x => `<span>${escapeHtml(x)}</span>`).join('');
    app.innerHTML = `${breadcrumbs([{label:'Band',href:'#/band'},{label:b.canonical_name}])}${pageHeader(bandKicker,escapeHtml(b.canonical_name),'',meta)}
      <section class="section detail-layout first-section">
        <aside class="detail-aside">${bandMedia(b) ? `<figure class="detail-media"><img src="${bandMedia(b)}" alt="${escapeHtml(b.canonical_name)}"></figure>${externalMediaCredit(bandMedia(b))}` : ''}${spotifyLink(b)}<div class="aside-label">Översikt</div><p>${escapeHtml(archiveTextSv(b.description || defaultDescription))}</p><div class="aside-facts"><div><span>Status</span><strong>${b.status === 'active' ? 'Aktivt' : b.status === 'inactive' ? 'Inaktivt' : 'Okänt'}</strong></div><div><span>Arkivklass</span><strong>${scopeLabel}</strong></div><div><span>Medlemmar i arkivet</span><strong>${memberGroups.length}</strong></div><div><span>Utgåvor i arkivet</span><strong>${rels.length}</strong></div></div></aside>
        <div class="detail-main">
          <section class="band-tip-panel"><div class="section-kicker">HJÄLP ARKIVET VÄXA</div><h2>Vet du mer om detta band?</h2>
            <p>${bandGaps(b).length ? 'Vi söker: ' + bandGaps(b).map(escapeHtml).join(', ') + '.' : 'Har du en rättelse, ett minne eller material som kompletterar bandets historia?'}</p>
            <a class="button button-primary" href="${bandTipHref(b)}">Tipsa om ${escapeHtml(b.canonical_name)}</a>
          </section>
          <section class="content-section"><div class="content-head"><span>01</span><h2>Medlemmar</h2></div><div class="credit-list">${memberGroups.length ? memberGroups.map(group => { const p=peopleById().get(group.person_id); return `<a href="${personHref(p)}"><strong>${escapeHtml(p.canonical_name)}</strong><span>${escapeHtml(group.roles || 'Roll kartläggs')}</span><em>${escapeHtml(group.periods || 'Årtal söks')}</em></a>`; }).join('') : '<div class="empty-state">Lineup kartläggs.</div>'}</div></section>
          <section class="content-section"><div class="content-head"><span>02</span><h2>Utgåvor</h2></div><div class="release-stack">${rels.length ? rels.map(releaseRow).join('') : '<div class="empty-state">Inga utgåvor registrerade ännu.</div>'}</div></section>
          ${youtubeSection(b)}
          ${gallery.length ? `<section class="content-section"><div class="content-head"><span>03</span><h2>Bildarkiv</h2></div>${archiveGallery(gallery)}</section>` : ''}
          ${links.length ? `<section class="content-section"><div class="content-head"><span>${gallery.length ? '04':'03'}</span><h2>Kopplingar</h2></div><div class="relation-grid">${links.map(r => { const otherId = r.from_band_id === b.id ? r.to_band_id : r.from_band_id; const other = bandsById().get(otherId); return `<a href="${bandHref(other)}"><span>${escapeHtml(relationSv(r.relation_type))}</span><strong>${escapeHtml(other.canonical_name)}</strong><em>${r.from_year || ''}</em></a>`; }).join('')}</div></section>` : ''}
          <section class="content-section"><div class="content-head"><span>${String(3 + (gallery.length ? 1 : 0) + (links.length ? 1 : 0)).padStart(2,'0')}</span><h2>Källäge</h2></div>${claimList(claims)}</section>
          ${sources.length ? `<section class="content-section"><div class="content-head"><span>${String(4 + (gallery.length ? 1 : 0) + (links.length ? 1 : 0)).padStart(2,'0')}</span><h2>Källor</h2></div>${sourceList(sources)}</section>` : ''}
        </div>
      </section>`;
  }


  function registryOptions(values) {
    return values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
  }

  function registryFooter() {
    return '<div class="registry-footer"><p id="registry-status" role="status"></p><button id="registry-more" class="button button-dark" type="button">Visa fler</button></div>';
  }

  function bindRegistry(getRows, renderRows, listId, controls) {
    const list = $('#'+listId), more = $('#registry-more');
    let limit = 48;
    function update(append = false) {
      const rows = getRows(), shown = rows.slice(0,limit);
      const previousCount = list.querySelectorAll('a').length;
      list.innerHTML = shown.length ? renderRows(shown) : '<div class="empty-state">Inga träffar. Prova ett annat sökord eller rensa filtren.</div>';
      $('#registry-count').textContent = rows.length;
      $('#registry-status').textContent = `Visar ${shown.length} av ${rows.length} träffar`;
      more.hidden = shown.length >= rows.length;
      more.textContent = `Visa fler (${Math.min(48,rows.length-shown.length)})`;
      if (append && more.hidden) {
        const next = list.querySelectorAll('a')[previousCount];
        if (next) next.focus();
      }
    }
    controls.forEach(([element,event]) => element.addEventListener(event,()=> { limit=48; update(); }));
    more.addEventListener('click',()=> { limit+=48; update(true); });
    update();
    return () => { limit=48; update(); };
  }

  function renderPeopleIndex() {
    const ordered = [...state.people].sort((a,b) => a.canonical_name.localeCompare(b.canonical_name,'sv'));
    const names = new Map(ordered.map(p => [p.id, membershipsForPerson(p.id).map(m => bandName(m.band_id)).join(' ')]));
    const initial = p => p.canonical_name.trim().charAt(0).toLocaleUpperCase('sv');
    const letters = [...new Set(ordered.map(initial))].sort((a,b)=>a.localeCompare(b,'sv'));
    app.innerHTML = `${pageHeader('MÄNNISKORNA BAKOM BANDEN','Personer','Följ en musiker genom olika band, perioder och dokumenterade utgåvekrediter.')}
      <section class="section page-section first-section">
        <div class="index-toolbar"><label class="search-box"><span>Sök person</span><input id="people-search" type="search" placeholder="Namn eller band…"></label><div class="index-count"><strong id="registry-count"></strong> personer</div></div>
        <div class="registry-letters" role="group" aria-label="Första bokstaven i personens namn"><button type="button" data-letter="" aria-pressed="true">Alla</button>${letters.map(letter=>`<button type="button" data-letter="${escapeHtml(letter)}" aria-pressed="false">${escapeHtml(letter)}</button>`).join('')}</div>
        <button class="band-filter-reset registry-reset" id="registry-reset" type="button">Rensa filter</button>
        <div class="people-grid" id="people-grid"></div>${registryFooter()}
      </section>`;
    const input = $('#people-search');
    let selected = '';
    const update = bindRegistry(() => {
      const term=input.value.trim().toLocaleLowerCase('sv');
      return ordered.filter(p => (!selected || initial(p)===selected) && `${p.canonical_name} ${names.get(p.id)}`.toLocaleLowerCase('sv').includes(term));
    }, rows => rows.map(personCard).join(''), 'people-grid', [[input,'input']]);
    const buttons = [...document.querySelectorAll('[data-letter]')];
    function selectLetter(letter) {
      selected=letter;
      buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.letter===letter)));
      update();
    }
    buttons.forEach(button=>button.addEventListener('click',()=>selectLetter(button.dataset.letter)));
    $('#registry-reset').addEventListener('click',()=> { input.value=''; selectLetter(''); });
  }

  // Graph edges represent documented membership in the same band, not
  // proof that two musicians played in that band at the same time.
  function colleagueIndex() {
    const people=new Map(state.people.map(p=>[String(p.id),p]));
    const bands=new Map(allBandRows().map(b=>[String(b.id),b]));
    const membershipsByBand=new Map();
    state.memberships.forEach(m=>{
      const bid=String(m.band_id),pid=String(m.person_id);
      if(!people.has(pid)||!bands.has(bid))return;
      if(!membershipsByBand.has(bid))membershipsByBand.set(bid,new Set());
      membershipsByBand.get(bid).add(pid);
    });
    const neighbors=new Map([...people.keys()].map(id=>[id,new Map()]));
    membershipsByBand.forEach((ids,bid)=>{
      const arr=[...ids];
      for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
        if(!neighbors.get(arr[i]).has(arr[j]))neighbors.get(arr[i]).set(arr[j],[]);
        if(!neighbors.get(arr[j]).has(arr[i]))neighbors.get(arr[j]).set(arr[i],[]);
        neighbors.get(arr[i]).get(arr[j]).push(bands.get(bid));
        neighbors.get(arr[j]).get(arr[i]).push(bands.get(bid));
      }
    });
    return {people,neighbors};
  }

  function shortestColleaguePath(graph,start,end) {
    if(start===end)return [start];
    const queue=[start],from=new Map([[start,null]]);
    for(let i=0;i<queue.length;i++){
      const id=queue[i];
      for(const next of graph.neighbors.get(id)?.keys()||[]){
        if(from.has(next))continue;
        from.set(next,id);
        if(next===end){
          const path=[end];let current=end;
          while(from.get(current)!==null){current=from.get(current);path.unshift(current);}
          return path;
        }
        queue.push(next);
      }
    }
    return null;
  }

  function renderPersonDetail(p) {
    const mems = membershipsForPerson(p.id).sort((a,b) => (a.joined_year || 9999) - (b.joined_year || 9999));
    const bandGroups = groupedMembershipsForPerson(p.id);
    const credits = state.releaseMembers.filter(x => x.person_id === p.id).map(x => ({...x, release: releasesById().get(x.release_id)})).filter(x => x.release).sort((a,b) => (a.release.release_year || 9999) - (b.release.release_year || 9999));
    const claims = claimsForPerson(p.id);
    const sources = sourcesForClaims(claims);
    const gallery = personGallery(p);
    const uniqueBands = bandGroups.map(group => group.band);
    const meta = [isDeceased(p) ? `<span class="profile-deceased-meta">† Avliden · ${escapeHtml(personLifeLabel(p))}</span>` : '', ...uniqueBands.slice(0,5).map(b => `<a href="${bandHref(b)}">${escapeHtml(b.canonical_name)}</a>`)].filter(Boolean).join('');
    const colleagueGraph=colleagueIndex();
    const colleagues=[...(colleagueGraph.neighbors.get(String(p.id))||new Map())].map(([id,bands])=>({person:colleagueGraph.people.get(id),bands})).filter(x=>x.person).sort((a,b)=>a.person.canonical_name.localeCompare(b.person.canonical_name,'sv'));
    const family=state.familyRelations.filter(link=>String(link.person_a_id)===String(p.id)||String(link.person_b_id)===String(p.id)).map(link=>{
      const otherId=String(link.person_a_id)===String(p.id)?link.person_b_id:link.person_a_id;
      return {...link,relative:state.people.find(x=>String(x.id)===String(otherId)),source:state.sources.find(x=>String(x.id)===String(link.source_id))};
    }).filter(x=>x.relative);
    const sourceNo = gallery.length ? '05' : '04';
    app.innerHTML = `${breadcrumbs([{label:'Personer',href:'#/personer'},{label:p.canonical_name}])}${pageHeader('PERSON / UPPSALA-SCENEN',escapeHtml(p.canonical_name),'',meta)}
      <section class="section detail-layout first-section">
        <aside class="detail-aside">${personMedia(p) ? `<figure class="detail-media detail-portrait"><img src="${personMedia(p)}" alt="${escapeHtml(p.canonical_name)}"></figure>${externalMediaCredit(personMedia(p))}` : ''}<div class="aside-label">Profil</div><p>${escapeHtml(archiveTextSv(p.biography || p.uppsala_connection || 'Dokumenterad i Uppsala-scenen.'))}</p><div class="aside-facts">${isDeceased(p) ? `<div><span>Avliden</span><strong>${escapeHtml(String(deathYear(p)))}</strong></div>${p.birth_year ? `<div><span>Född</span><strong>${escapeHtml(String(p.birth_year))}</strong></div>` : ''}` : ''}<div><span>Bandkopplingar</span><strong>${uniqueBands.length}</strong></div><div><span>Utgåvekrediter</span><strong>${credits.length}</strong></div><div><span>Källkopplade uppgifter</span><strong>${claims.length}</strong></div></div></aside>
        <div class="detail-main">
          <section class="content-section"><div class="content-head"><span>01</span><h2>Band</h2></div><div class="credit-list">${bandGroups.length ? bandGroups.map(group => `<a href="${bandHref(group.band)}"><strong>${escapeHtml(group.band.canonical_name)}</strong><span>${escapeHtml(group.roles)}</span><em>${escapeHtml(group.periods)}</em></a>`).join('') : '<div class="empty-state">Bandkopplingar kartläggs.</div>'}</div></section>
          ${family.length?`<section class="content-section family-section"><div class="content-head"><span>♥</span><h2>Dokumenterade släktkopplingar</h2></div><p class="section-intro">Bara offentligt godkända och källbelagda familjerelationer. De påverkar inte beräkningen av musikaliska steg.</p><div class="colleague-grid">${family.map(x=>`<div class="colleague-item"><a href="${personHref(x.relative)}"><strong>${escapeHtml(x.relative.canonical_name)}</strong></a><span>${x.relation_type==='sibling' ? (/tvilling/i.test(x.note||'')?'Tvillingbror':'Syskon') :x.relation_type==='parent_child'?'Förälder / barn':x.relation_type==='spouse_partner'?'Gift / partner':x.relation_type==='sibling_in_law'?'Svåger / svägerska':'Familjerelation'}</span>${x.source?`<span>Källa: ${escapeHtml(x.source.title)}</span>`:''}</div>`).join('')}</div></section>`:''}
          <section class="content-section colleague-section"><div class="content-head"><span>↔</span><h2>Har varit med i samma band som</h2></div><p class="section-intro">Dokumenterat medlemskap i samma band. Det innebär inte nödvändigtvis att de spelade samtidigt.</p><div class="colleague-grid">${colleagues.length?colleagues.map(x=>`<div class="colleague-item"><a href="${personHref(x.person)}"><strong>${escapeHtml(x.person.canonical_name)}</strong></a><span>${x.bands.map(b=>`<a href="${bandHref(b)}">${escapeHtml(b.canonical_name)}</a>`).join(', ')}</span></div>`).join(''):'<div class="empty-state">Inga gemensamma bandmedlemskap dokumenterade ännu.</div>'}</div><a class="network-profile-link" href="#/natverket">Utforska kopplingar i Nätverket ↗</a></section>
          <section class="content-section"><div class="content-head"><span>02</span><h2>Utgåvekrediter</h2></div><div class="credit-list">${credits.length ? credits.map(x => `<a href="${releaseHref(x.release)}"><div class="credit-release"><strong>${escapeHtml(x.release.title)}</strong><small class="credit-band">${escapeHtml([...new Set(state.releaseBands.filter(rb => rb.release_id === x.release.id).map(rb => rb.credited_as || bandName(rb.band_id)).filter(Boolean))].join(' / '))}</small></div><span>${escapeHtml(roleSv(x.role || ''))}</span><em>${x.release.release_year || '—'}</em></a>`).join('') : '<div class="empty-state">Inga releasecredits registrerade ännu.</div>'}</div></section>
          ${gallery.length ? `<section class="content-section"><div class="content-head"><span>03</span><h2>Relaterade bilder</h2></div><p class="section-intro">Gruppbilder och pressmaterial där personen är säkert knuten till sammanhanget. De används inte som individuella porträtt om bildidentifieringen inte är entydig.</p>${archiveGallery(gallery)}</section>` : ''}
          <section class="content-section"><div class="content-head"><span>${gallery.length ? '04':'03'}</span><h2>Källäge</h2></div>${claimList(claims)}</section>
          ${sources.length ? `<section class="content-section"><div class="content-head"><span>${sourceNo}</span><h2>Källor</h2></div>${sourceList(sources)}</section>` : ''}
        </div>
      </section>`;
  }

  function renderReleasesIndex() {
    const types = [...new Set(state.releases.map(r=>r.release_type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'sv'));
    const decades = [...new Set(state.releases.filter(r=>r.release_year).map(r=>Math.floor(r.release_year/10)*10))].sort((a,b)=>a-b);
    app.innerHTML = `${pageHeader('DEMOER / KASSETTER / UTGÅVOR','Utgåvor','Utgåvorna är ofta de bästa hållpunkterna för årtal, lineups och hur scenen faktiskt såg ut vid en viss tidpunkt.')}
      <section class="section page-section first-section">
        <div class="index-toolbar"><label class="search-box"><span>Sök utgåva</span><input id="release-search" type="search" placeholder="Titel, band eller år…"></label><div class="index-count"><strong id="registry-count"></strong> utgåvor</div></div>
        <div class="band-filter-bar">
          <label class="band-filter-field"><span>Utgåvetyp</span><select id="release-type"><option value="">Alla typer</option>${registryOptions(types)}</select></label>
          <label class="band-filter-field"><span>Årtionde</span><select id="release-decade"><option value="">Alla årtionden</option>${decades.map(year=>`<option value="${year}">${year}-talet</option>`).join('')}<option value="unknown">Årtal saknas</option></select></label>
          <label class="band-filter-field"><span>Sortera</span><select id="release-sort"><option value="oldest">Äldsta först</option><option value="newest">Nyaste först</option><option value="title">Titel A–Ö</option><option value="band">Band A–Ö</option></select></label>
        </div>
        <button class="band-filter-reset registry-reset" id="registry-reset" type="button">Rensa filter</button>
        <div class="release-stack" id="release-stack"></div>${registryFooter()}
      </section>`;
    const input=$('#release-search'), type=$('#release-type'), decade=$('#release-decade'), sort=$('#release-sort');
    const bandNames=new Map(state.releases.map(r=>[r.id,releaseBand(r.id)?.canonical_name || '']));
    const update=bindRegistry(()=> {
      const term=input.value.trim().toLocaleLowerCase('sv');
      return state.releases.filter(r=>
        `${r.title} ${bandNames.get(r.id)} ${r.release_year||''}`.toLocaleLowerCase('sv').includes(term) &&
        (!type.value || r.release_type===type.value) &&
        (!decade.value || (decade.value==='unknown' ? !r.release_year : r.release_year && Math.floor(r.release_year/10)*10===Number(decade.value)))
      ).sort((a,b)=> {
        if(sort.value==='title') return a.title.localeCompare(b.title,'sv');
        if(sort.value==='band') return bandNames.get(a.id).localeCompare(bandNames.get(b.id),'sv') || a.title.localeCompare(b.title,'sv');
        const yearA=a.release_year || (sort.value==='newest' ? -1 : 9999);
        const yearB=b.release_year || (sort.value==='newest' ? -1 : 9999);
        return (sort.value==='newest' ? yearB-yearA : yearA-yearB) || a.title.localeCompare(b.title,'sv');
      });
    },rows=>rows.map(releaseRow).join(''),'release-stack',[[input,'input'],[type,'change'],[decade,'change'],[sort,'change']]);
    $('#registry-reset').addEventListener('click',()=> { input.value=''; type.value=''; decade.value=''; sort.value='oldest'; update(); });
  }

  // Public, read-only track metadata. Fetch only the release being viewed to
  // avoid downloading thousands of tracks in the archive snapshot.
  function groupTrackNotes(tracks) {
    const groups = new Map();
    tracks.forEach(track => {
      const note = String(track.notes || '').trim();
      if (note) groups.set(note, [...(groups.get(note) || []), track]);
    });
    return groups;
  }

  function sharedTrackNotes(groups, tracks) {
    const shared = [...groups].filter(([,items]) => items.length > 1);
    if (!shared.length) return '';
    const multiDisc = new Set(tracks.map(track => track.disc_number || 1)).size > 1;
    return '<details class="tracklist-shared-notes"><summary>Gemensamma anteckningar (' + shared.length + ')</summary>'
      + shared.map(([note,items]) => {
        const scope = items.length === tracks.length ? 'Alla spår' : 'Spår ' + items.map(track =>
          (multiDisc ? (track.disc_number || 1) + ':' : '') + String(track.track_number).padStart(2,'0')).join(', ');
        return '<div class="release-track-note"><strong>' + escapeHtml(scope) + '</strong><p>' + escapeHtml(note) + '</p></div>';
      }).join('') + '</details>';
  }

  async function renderReleaseTracklist(releaseId) {
    const holder = $('#release-tracklist');
    if (!holder || holder.dataset.releaseId !== String(releaseId)) return;
    const activeHolder = () => {
      const current = $('#release-tracklist');
      return current?.dataset.releaseId === String(releaseId) ? current : null;
    };
    try {
      const query = `${cfg.supabaseUrl}/rest/v1/release_tracks?select=id,disc_number,track_number,title,duration_seconds,source_id,notes&release_id=eq.${encodeURIComponent(releaseId)}&order=disc_number.asc,track_number.asc`;
      const headers = {apikey: cfg.publishableKey, Accept: 'application/json'};
      const res = await fetch(query, {headers});
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const tracks = await res.json();
      if (!Array.isArray(tracks)) throw new Error('Ogiltigt svar');
      if (!activeHolder()) return;
      if (!tracks.length) {
        renderReleaseSources(releaseId, [], [], 'ready');
        activeHolder().innerHTML = '<div class="empty-state">Låtlistan kartläggs.</div>';
        return;
      }

      let credits = [];
      try {
        const ids = tracks.map(track => track.id).join(',');
        const creditsUrl = `${cfg.supabaseUrl}/rest/v1/release_track_credits?select=track_id,person_id,role,credited_as,source_id,notes&track_id=in.(${ids})`;
        const creditRes = await fetch(creditsUrl, {headers});
        if (creditRes.ok) credits = await creditRes.json();
      } catch (error) {
        console.warn('Spårcredits kunde inte hämtas', error);
      }
      if (!activeHolder()) return;
      renderReleaseSources(releaseId, tracks, Array.isArray(credits) ? credits : [], 'ready');
      const byTrack = new Map();
      (Array.isArray(credits) ? credits : []).forEach(credit => {
        if (!byTrack.has(credit.track_id)) byTrack.set(credit.track_id, []);
        byTrack.get(credit.track_id).push(credit);
      });
      const noteGroups = groupTrackNotes(tracks);
      const formatDuration = seconds => {
        if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) return '';
        const total = Number(seconds);
        return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
      };
      activeHolder().innerHTML = `<ol class="release-tracks">${tracks.map(track => {
        const displayCredits = (byTrack.get(track.id) || []).map(credit => {
          const person = peopleById().get(credit.person_id);
          const name = credit.credited_as || person?.canonical_name || 'Okänd';
          return `${escapeHtml(name)} · ${escapeHtml(roleSv(credit.role || ''))}`;
        }).join(' · ');
        const note = String(track.notes || '').trim();
        const notes = note && noteGroups.get(note).length === 1 ? `<span class="release-track-note">${escapeHtml(note)}</span>` : '';
        return `<li class="release-track">
          <span class="release-track-number">${String(track.track_number).padStart(2,'0')}</span>
          <span class="release-track-main"><strong>${escapeHtml(track.title)}</strong>
            ${displayCredits ? `<span class="release-track-credit">${displayCredits}</span>` : ''}
            ${notes}
            ${youtubeTrackLink(releaseId, track.title)}
          </span>
          <span class="release-track-duration">${formatDuration(track.duration_seconds)}</span>
        </li>`;
      }).join('')}</ol>${sharedTrackNotes(noteGroups, tracks)}`;
    } catch (error) {
      console.warn('Låtlistan kunde inte hämtas', error);
      if (activeHolder()) {
        activeHolder().innerHTML = '<div class="empty-state">Låtlistan kunde inte hämtas just nu.</div>';
        renderReleaseSources(releaseId, [], [], 'error');
      }
    }
  }

  function renderReleaseSources(releaseId, tracks = [], trackCredits = [], status = 'loading') {
    const holder = $('#release-sources');
    if (!holder || holder.dataset.releaseId !== String(releaseId)) return;
    const claims = claimsForEntity('release', releaseId);
    const known = new Map(state.sources.map(source => [source.id, source]));
    const claimSources = sourcesForClaims(claims);
    const trackSourceIds = new Set(tracks.map(track => track.source_id).filter(Boolean));
    const creditSourceIds = new Set(trackCredits.map(credit => credit.source_id).filter(Boolean));
    const sources = new Map(claimSources.map(source => [source.id, source]));
    [...trackSourceIds, ...creditSourceIds].forEach(id => {
      if (known.has(id)) sources.set(id, known.get(id));
    });
    const sourcedTracks = tracks.filter(track => known.has(track.source_id)).length;
    const sourcedCredits = trackCredits.filter(credit => known.has(credit.source_id)).length;
    const summary = [];
    if (sourcedTracks) summary.push(sourcedTracks + ' av ' + tracks.length + ' spår har registrerad källa');
    if (sourcedCredits) summary.push(sourcedCredits + ' av ' + trackCredits.length + ' spårkrediter har registrerad källa');
    const note = status === 'loading' ? 'Källor för låtlistan hämtas…'
      : status === 'error' ? 'Källor för låtlistan kunde inte kontrolleras just nu.'
      : summary.length ? summary.join('. ') + '. Källhänvisningarna gäller dessa uppgifter, inte automatiskt hela utgåvan.'
      : 'Inga källkopplingar är registrerade för låtlistans spår. Det betyder inte att källor saknas utanför arkivet.';
    const context = $('#release-source-status');
    if (context) context.innerHTML = (claims.length ? claimList(claims) : '')
      + '<p class="empty-state">' + escapeHtml(note) + '</p>';
    holder.innerHTML = sources.size ? [...sources.values()].map(source => {
      const scope = [];
      if (claimSources.some(item => item.id === source.id)) scope.push('Källkopplade faktauppgifter');
      if (trackSourceIds.has(source.id)) scope.push('Låtlista: ' + tracks.filter(track => track.source_id === source.id).map(track => track.title).join(', '));
      if (creditSourceIds.has(source.id)) scope.push('Spårkrediter');
      return sourceList([source]) + '<p class="release-track-note">' + escapeHtml(scope.join(' · ')) + '</p>';
    }).join('') : '<div class="empty-state">' + (status === 'loading' ? 'Hämtar källhänvisningar…' : 'Inga källhänvisningar att visa för de inlästa uppgifterna.') + '</div>';
  }

  function renderReleaseDetail(r) {
    const band = releaseBand(r.id);
    const credits = creditsForRelease(r.id);
    const claims = claimsForEntity('release', r.id);
    const sources = sourcesForClaims(claims);
    const gallery = releaseGallery(r);
    const meta = [r.release_year || 'Årtal söks', r.release_type, r.format, band?.canonical_name].filter(Boolean).map(x => `<span>${escapeHtml(x)}</span>`).join('');
    app.innerHTML = `${breadcrumbs([{label:'Utgåvor',href:'#/utgavor'},{label:r.title}])}${pageHeader('UTGÅVA / ARKIVPOST',escapeHtml(r.title),'',meta)}
      <section class="section detail-layout first-section">
        <aside class="detail-aside">${releaseMedia(r) ? `<figure class="detail-media release-artwork"><img src="${releaseMedia(r)}" alt="${escapeHtml(r.title)}"></figure>${externalMediaCredit(releaseMedia(r))}` : ''}${spotifyLink(band, r.id)}<div class="aside-label">Utgåva</div><p>${escapeHtml(r.description || `En ${r.release_type || 'utgåva'} från ${r.release_year || 'okänt år'} i arkivet.`)}</p>${band ? `<a class="button button-ghost aside-button" href="${bandHref(band)}">Öppna ${escapeHtml(band.canonical_name)}</a>` : ''}</aside>
        <div class="detail-main">

          <section class="content-section"><div class="content-head"><span>01</span><h2>Låtlista</h2></div><div id="release-tracklist" class="release-tracklist" data-release-id="${escapeHtml(r.id)}"><div class="empty-state">Hämtar låtlistan…</div></div></section>
          ${youtubeSection(band, r.id)}
          <section class="content-section"><div class="content-head"><span>02</span><h2>Krediter</h2></div><div class="credit-list">${credits.length ? credits.map(c => { const p=peopleById().get(c.person_id); return `<a href="${personHref(p)}"><strong>${escapeHtml(c.credited_as || p.canonical_name)}</strong><span>${escapeHtml(roleSv(c.role || ''))}</span><em>${escapeHtml(p.canonical_name)}</em></a>`; }).join('') : '<div class="empty-state">Krediter kartläggs.</div>'}</div></section>
          ${gallery.length ? `<section class="content-section"><div class="content-head"><span>03</span><h2>Omslag & originalmaterial</h2></div>${archiveGallery(gallery)}</section>` : ''}
          <section class="content-section"><div class="content-head"><span>${gallery.length ? '04':'03'}</span><h2>Källäge</h2></div><div id="release-source-status"></div></section>
          <section class="content-section"><div class="content-head"><span>${gallery.length ? '05':'04'}</span><h2>Källor</h2></div><div id="release-sources" data-release-id="${escapeHtml(r.id)}"></div></section>
        </div>
      </section>`;
    renderReleaseSources(r.id);
    renderReleaseTracklist(r.id);
  }

  function timelineRows() {
    const rows = [], localIds = new Set(uppsalaBands().map(b=>b.id));
    const releaseLocal = new Set(state.releaseBands.filter(link=>localIds.has(link.band_id)).map(link=>link.release_id));
    state.releases.forEach(r => {
      const b = releaseBand(r.id);
      const credits = creditsForRelease(r.id).map(c => `${personName(c.person_id)} (${roleSv(c.role)})`);
      rows.push({year:r.release_year, kind:'release', local:releaseLocal.has(r.id) || localIds.has(b?.id),
        href:releaseHref(r), title:`${b?.canonical_name || 'Okänt band'} — ${r.title}`,
        text:'Utgåva i arkivet.', credits:credits.join(', '), tags:[r.release_type,r.format].filter(Boolean)});
    });
    const bandMap = bandsById();
    state.claims.filter(c => c.claim_type === 'band_formation' && c.from_year).forEach(c => {
      const ent = state.claimEntities.find(e => e.claim_id === c.id && e.entity_type === 'band' && e.entity_role === 'subject');
      const b = ent ? bandMap.get(ent.entity_id) : null;
      rows.push({year:c.from_year, kind:'formation', local:localIds.has(b?.id), href:b ? bandHref(b) : '#/band',
        title:b?.canonical_name || 'Ny knutpunkt', text:translateClaim(c.statement), tags:['Bandbildning',statusSv(c.status)]});
    });
    return rows.sort((a,b) => (a.year || 9999) - (b.year || 9999) || a.title.localeCompare(b.title,'sv'));
  }

  function groupTimelineRows(rows) {
    const groups = new Map();
    rows.forEach(row => {
      const year = row.year ? String(row.year) : '';
      if (!groups.has(year)) groups.set(year, {year, events:[]});
      groups.get(year).events.push(row);
    });
    return [...groups.values()];
  }

  function renderTimeline() {
    const rows = timelineRows();
    const decades = [...new Set(rows.filter(row=>row.year).map(row=>Math.floor(row.year/10)*10))].sort((a,b)=>a-b);
    const event = row => '<article class="timeline-content"><h3><a href="' + escapeHtml(row.href) + '">' + escapeHtml(row.title)
      + '</a></h3><p>' + escapeHtml(row.text) + '</p>'
      + (row.credits ? '<details class="timeline-credits"><summary>Visa dokumenterade krediter</summary><p>' + escapeHtml(row.credits) + '</p></details>' : '')
      + '<div class="timeline-tags">' + row.tags.map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join('') + '</div></article>';
    app.innerHTML = `${pageHeader('ÅR FÖR ÅR','Tidslinjen','Utgåvor och dokumenterade bandbildningar samlade kronologiskt. Årtal utan dokumenterad uppgift visas sist.')}
      <section class="section page-section first-section">
        <div class="index-toolbar"><label class="search-box"><span>Sök i tidslinjen</span><input id="timeline-search" type="search" placeholder="Band, utgåva, person eller år…"></label><div class="index-count"><strong id="timeline-count"></strong> händelser</div></div>
        <div class="band-filter-bar">
          <label class="band-filter-field"><span>Årtionde</span><select id="timeline-decade"><option value="">Alla årtionden</option>${decades.map(year=>`<option value="${year}">${year}-talet</option>`).join('')}<option value="unknown">Årtal saknas</option></select></label>
          <label class="band-filter-field"><span>Händelsetyp</span><select id="timeline-kind"><option value="">Alla händelser</option><option value="release">Utgåvor</option><option value="formation">Bandbildningar</option></select></label>
          <label class="band-filter-field"><span>Bandkoppling</span><select id="timeline-scope"><option value="">Alla band i arkivet</option><option value="uppsala">Endast klassade Uppsala-band</option></select></label>
        </div>
        <button id="timeline-reset" class="band-filter-reset registry-reset" type="button">Rensa filter</button>
        <div class="timeline" id="timeline-results"></div>
        <div class="registry-footer"><p id="timeline-status" role="status"></p><button id="timeline-more" class="button button-dark" type="button">Visa fler år</button></div>
      </section>`;
    const input=$('#timeline-search'), decade=$('#timeline-decade'), kind=$('#timeline-kind'), scope=$('#timeline-scope'), more=$('#timeline-more');
    let limit=8;
    function update(append=false) {
      const term=input.value.trim().toLocaleLowerCase('sv');
      const filtered=rows.filter(row=>
        (!kind.value || row.kind===kind.value) && (!scope.value || row.local) &&
        (!decade.value || (decade.value==='unknown' ? !row.year : row.year && Math.floor(row.year/10)*10===Number(decade.value))) &&
        `${row.title} ${row.text} ${row.credits || ''} ${row.year || ''} ${row.tags.join(' ')}`.toLocaleLowerCase('sv').includes(term));
      const groups=groupTimelineRows(filtered), visible=groups.slice(0,limit), holder=$('#timeline-results');
      const previous=holder.querySelectorAll('.timeline-year-group').length;
      holder.innerHTML=visible.length ? visible.map(group=>'<section class="timeline-row timeline-year-group" aria-label="' + escapeHtml(group.year || 'Årtal saknas')
        + '"><h2 class="timeline-year">' + escapeHtml(group.year || 'Årtal saknas') + '</h2><div class="timeline-events">'
        + group.events.map(event).join('') + '</div></section>').join('') : '<div class="empty-state">Inga träffar. Prova ett annat sökord eller rensa filtren.</div>';
      $('#timeline-count').textContent=filtered.length;
      $('#timeline-status').textContent=`Visar ${visible.reduce((sum,group)=>sum+group.events.length,0)} av ${filtered.length} händelser · ${visible.length} av ${groups.length} årsgrupper`;
      more.hidden=visible.length>=groups.length;
      if(append && more.hidden) holder.querySelectorAll('.timeline-year-group')[previous]?.querySelector('a')?.focus();
    }
    [[input,'input'],[decade,'change'],[kind,'change'],[scope,'change']].forEach(([control,eventName])=>control.addEventListener(eventName,()=> {limit=8;update();}));
    more.addEventListener('click',()=> {limit+=8;update(true);});
    $('#timeline-reset').addEventListener('click',()=> {input.value='';decade.value='';kind.value='';scope.value='';limit=8;update();});
    update();
  }

  function claimList(claims) {
    if (!claims.length) return '<div class="empty-state">Fler uppgifter ska källkopplas.</div>';
    return `<div class="claim-list">${claims.sort((a,b) => (b.confidence || 0) - (a.confidence || 0)).map(c => `<article><div><span class="status-pill ${escapeHtml(c.status)}">${escapeHtml(statusSv(c.status))}</span>${c.confidence != null ? `<small>${c.confidence}%</small>` : ''}</div><p>${escapeHtml(translateClaim(c.statement))}</p></article>`).join('')}</div>`;
  }

  function sourceList(sources) {
    return `<div class="sources-list">${sources.map((s,i) => `<a class="source-row" href="${escapeHtml(s.url || '#') }" ${s.url ? 'target="_blank" rel="noopener"' : ''}><div class="source-index">${String(i+1).padStart(2,'0')}</div><div class="source-title">${escapeHtml(s.title)}</div><div class="source-publisher">${escapeHtml(s.publisher || s.source_type || '')}</div><div class="source-quality ${escapeHtml(s.reliability)}">${escapeHtml(sourceReliabilitySv(s.reliability))}</div></a>`).join('')}</div>`;
  }

  function renderSources() {
    const ordered = [...state.sources].sort((a,b) => (a.reliability === 'high' ? -1 : 1) - (b.reliability === 'high' ? -1 : 1) || a.title.localeCompare(b.title,'sv'));
    const qualities = [...new Set(ordered.map(s=>s.reliability || 'unknown'))];
    app.innerHTML = `${pageHeader('KÄLLLÄGET ÄR EN DEL AV HISTORIEN','Källor','Arkivet skiljer mellan förstahandskällor, bandens egna historieskrivningar och specialistdatabaser.')}
      <section class="section page-section first-section">
        <div class="index-toolbar"><label class="search-box"><span>Sök källa</span><input id="source-search" type="search" placeholder="Titel, utgivare eller webbadress…"></label><div class="index-count"><strong id="registry-count"></strong> källor</div></div>
        <div class="band-filter-bar"><label class="band-filter-field"><span>Källbedömning</span><select id="source-quality"><option value="">Alla bedömningar</option>${qualities.map(q=>`<option value="${escapeHtml(q)}">${escapeHtml(sourceReliabilitySv(q))}</option>`).join('')}</select></label></div>
        <button class="band-filter-reset registry-reset" id="registry-reset" type="button">Rensa filter</button>
        <div id="source-results"></div>${registryFooter()}
      </section>`;
    const input=$('#source-search'), quality=$('#source-quality');
    const update=bindRegistry(()=> {
      const term=input.value.trim().toLocaleLowerCase('sv');
      return ordered.filter(s=>(!quality.value || (s.reliability || 'unknown')===quality.value) &&
        `${s.title} ${s.publisher||''} ${s.url||''}`.toLocaleLowerCase('sv').includes(term));
    },sourceList,'source-results',[[input,'input'],[quality,'change']]);
    $('#registry-reset').addEventListener('click',()=> { input.value=''; quality.value=''; update(); });
  }

  function renderNetwork() {
    const bands = uppsalaBands().slice().sort((a,b) => a.canonical_name.localeCompare(b.canonical_name,'sv'));
    const people = state.people;
    const bandById = new Map(bands.map(b => [String(b.id), b]));
    const personById = new Map(people.map(p => [String(p.id), p]));
    const memberships = state.memberships || [];
    const relationEdges = state.relations.filter(r => bandById.has(String(r.from_band_id)) && bandById.has(String(r.to_band_id)));
    const bandPerson = new Map(bands.map(b => [String(b.id), []]));
    const personBands = new Map(people.map(p => [String(p.id), []]));
    memberships.forEach(m => {
      const bid=String(m.band_id), pid=String(m.person_id);
      if (!bandById.has(bid) || !personById.has(pid)) return;
      if (!bandPerson.get(bid).includes(pid)) bandPerson.get(bid).push(pid);
      if (!personBands.get(pid).includes(bid)) personBands.get(pid).push(bid);
    });
    const query = new URLSearchParams(location.hash.split('?')[1] || '');
    let selected = query.get('band') && bandById.has(query.get('band')) ? query.get('band') : (bands.find(b=>bandPerson.get(String(b.id)).length>1)?.id || bands[0]?.id);
    selected = String(selected || '');
    let mode = 'explore', depth = 1, showLabels = true;
    let expandedPerson = null;
    let transform={x:0,y:0,k:1}, drag=null;
    app.innerHTML = `${pageHeader('VEM LEDER VIDARE TILL VEM?','Nätverket','Utforska banden, musikerna och deras dokumenterade kopplingar. Välj ett band eller sök efter en person för att börja.')}
      <section class="section page-section first-section network-page">
        <div class="network-toolbar">
          <label class="network-search-label" for="network-search">SÖK BAND ELLER PERSON</label>
          <input id="network-search" type="search" list="network-options" placeholder="Sök bland alla dokumenterade band och personer…" autocomplete="off">
          <datalist id="network-options">${[...bands.map(b=>b.canonical_name),...people.map(p=>p.canonical_name)].map(n=>`<option value="${escapeHtml(n)}">`).join('')}</datalist>
          <div class="network-random-actions"><span>Upptäck något nytt</span><button id="network-random-band" type="button">⚄ Slumpa band</button><button id="network-random-person" type="button">⚄ Slumpa person</button><span id="network-random-status" class="network-random-status" role="status" aria-live="polite"></span></div>
          <div class="network-toolbar-row"><div class="network-tabs"><button class="active" data-mode="explore">Utforska</button><button data-mode="all">Hela nätverket</button></div><label class="network-depth-label">Kopplingar <select id="network-depth"><option value="1">1 nivå</option><option value="2">2 nivåer</option></select></label><label class="network-label-toggle"><input id="network-labels" type="checkbox" checked> Visa namn</label><button id="network-fullscreen" class="network-fullscreen-btn" type="button" aria-pressed="false">⛶ Visa helskärm</button></div>
        </div>
        <div class="degrees-panel">
          <div class="degrees-header"><span class="section-kicker">UPPSALA DEGREES OF METAL</span><h2>Hur många steg skiljer er åt?</h2><p>Sök den kortaste dokumenterade kedjan via gemensamma bandmedlemskap.</p></div>
          <div class="degrees-form"><label>Från musiker<input id="degrees-from" list="degrees-people" placeholder="Välj person" autocomplete="off"></label><label>Till musiker<input id="degrees-to" list="degrees-people" placeholder="Välj person" autocomplete="off"></label><datalist id="degrees-people">${people.map(p=>`<option value="${escapeHtml(p.canonical_name)}"></option>`).join('')}</datalist><button id="degrees-find" type="button">Hitta kopplingen →</button></div>
          <div id="degrees-result" class="degrees-result" role="status" aria-live="polite"></div>
        </div>
        <div class="network-layout"><div class="network-shell"><svg id="network" viewBox="0 0 1200 720" aria-label="Interaktiv karta över band och personer" role="img"><g id="network-scene"></g></svg>
          <div class="network-map-controls"><button id="net-plus" title="Zooma in" aria-label="Zooma in">+</button><button id="net-minus" title="Zooma ut" aria-label="Zooma ut">−</button><button id="net-reset" title="Anpassa nätverket till vyn" aria-label="Visa hela nätverket">⤢</button><span id="net-zoom-level">100%</span></div><div class="network-hint">Scrolla för att zooma · Dra för att flytta</div>
          <div class="network-legend"><span><i class="legend-band"></i> Band</span><span><i class="legend-person"></i> Person</span><span><i class="legend-line"></i> Koppling</span></div>
          </div><aside class="network-details" id="network-details"></aside></div>
        <p class="network-note" id="network-note"></p>
      </section>`;
    const svg = $('#network'), scene = $('#network-scene'), details = $('#network-details');
    const search=$('#network-search');
    const randomPeople=people.filter(p=>(personBands.get(String(p.id))||[]).length);
    $('#network-random-band').disabled=!bands.length;
    $('#network-random-person').disabled=!randomPeople.length;
    function focusNetwork(band,person=null){
      selected=String(band.id);
      expandedPerson=person?String(person.id):null;
      mode='explore';
      $('#network-depth').disabled=false;
      document.querySelectorAll('[data-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===mode));
      search.value=(person||band).canonical_name;
      draw();
      if(person)showPerson(person);
    }
    function randomItem(items,currentId){
      const alternatives=items.filter(item=>String(item.id)!==String(currentId));
      const pool=alternatives.length?alternatives:items;
      return pool.length?pool[Math.floor(Math.random()*pool.length)]:null;
    }
    $('#network-random-band').addEventListener('click',()=>{
      const band=randomItem(bands,selected);
      if(!band)return;
      focusNetwork(band);
      $('#network-random-status').textContent=`Valt band: ${band.canonical_name}`;
    });
    $('#network-random-person').addEventListener('click',()=>{
      const person=randomItem(randomPeople,expandedPerson);
      if(!person)return;
      const linked=personBands.get(String(person.id));
      focusNetwork(bandById.get(linked[0]),person);
      $('#network-random-status').textContent=`Vald person: ${person.canonical_name}`;
    });
    const colleagueGraph=colleagueIndex();
    const fromInput=$('#degrees-from'),toInput=$('#degrees-to'),degreesResult=$('#degrees-result');
    function findDegrees(){
      const resolve=value=>people.find(p=>p.canonical_name.toLocaleLowerCase('sv')===value.trim().toLocaleLowerCase('sv'));
      const from=resolve(fromInput.value),to=resolve(toInput.value);
      if(!from||!to){degreesResult.textContent='Välj två personer från arkivets lista.';return;}
      const path=shortestColleaguePath(colleagueGraph,String(from.id),String(to.id));
      if(!path){degreesResult.textContent='Ingen dokumenterad koppling hittades mellan dessa personer.';return;}
      const steps=path.length-1;
      const chain=path.map((id,i)=>{
        const person=colleagueGraph.people.get(id);
        const bands=i<path.length-1?(colleagueGraph.neighbors.get(id)?.get(path[i+1])||[]):[];
        return `<div class="degrees-chain-node"><a href="${personHref(person)}">${escapeHtml(person.canonical_name)}</a></div>${bands.length?`<div class="degrees-chain-link">↓ Gemensamt band: ${bands.map(b=>`<a href="${bandHref(b)}">${escapeHtml(b.canonical_name)}</a>`).join(' / ')}</div>`:''}`;
      }).join('');
      degreesResult.innerHTML=`<strong>${steps} ${steps===1?'steg':'steg'} mellan ${escapeHtml(from.canonical_name)} och ${escapeHtml(to.canonical_name)}</strong><p>Kortaste kedjan utifrån registrerade medlemskap. Samtidig aktivitet är inte verifierad.</p><div class="degrees-chain">${chain}</div>`;
    }
    $('#degrees-find').addEventListener('click',findDegrees);
    [fromInput,toInput].forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findDegrees();}}));

    const networkPage=$('.network-page');
    const fullscreenBtn=$('#network-fullscreen');
    function setFullscreen(enabled){
      networkPage.classList.toggle('network-is-fullscreen',enabled);
      document.body.classList.toggle('network-body-fullscreen',enabled);
      fullscreenBtn.textContent=enabled?'✕ Stäng helskärm':'⛶ Visa helskärm';
      fullscreenBtn.setAttribute('aria-pressed',String(enabled));
      fullscreenBtn.setAttribute('aria-label',enabled?'Stäng helskärmsvyn':'Öppna nätverket i helskärm');
      resetView();
    }
    fullscreenBtn.addEventListener('click',()=>setFullscreen(!networkPage.classList.contains('network-is-fullscreen')));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&networkPage.isConnected&&networkPage.classList.contains('network-is-fullscreen'))setFullscreen(false);});

    function focusedGraph() {
      const bandIds=new Set([selected]),peopleIds=new Set(bandPerson.get(selected)||[]),edges=[];
      if(expandedPerson && personById.has(expandedPerson)){
        peopleIds.add(expandedPerson);
        (personBands.get(expandedPerson)||[]).forEach(bid=>bandIds.add(bid));
      }
      if(depth===2){
        peopleIds.forEach(pid=>(personBands.get(pid)||[]).forEach(bid=>bandIds.add(bid)));
        relationEdges.forEach(r=>{
          if(String(r.from_band_id)===selected)bandIds.add(String(r.to_band_id));
          if(String(r.to_band_id)===selected)bandIds.add(String(r.from_band_id));
        });
      }
      const nodes=[...bandIds].map(id=>({id:'b'+id,type:'band',ref:bandById.get(id),focus:id===selected}))
        .concat([...peopleIds].map(id=>({id:'p'+id,type:'person',ref:personById.get(id)})));
      const ids=new Set(nodes.map(n=>n.id));
      bandIds.forEach(bid=>(bandPerson.get(bid)||[]).forEach(pid=>{
        if(ids.has('p'+pid))edges.push({a:'b'+bid,b:'p'+pid});
      }));
      relationEdges.forEach(r=>{
        const a='b'+r.from_band_id,b='b'+r.to_band_id;
        if(ids.has(a)&&ids.has(b))edges.push({a,b,relation:true});
      });
      return {nodes,edges};
    }
    function entireGraph() {
      const nodes=bands.map(b=>({id:'b'+b.id,type:'band',ref:b,focus:String(b.id)===selected}));
      const edges=relationEdges.map(r=>({a:'b'+r.from_band_id,b:'b'+r.to_band_id,relation:true}));
      const joined = new Map();
      personBands.forEach(bs=>{
        for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){
          const a='b'+bs[i],b='b'+bs[j];if(a===b)continue;
          const key=[a,b].sort().join('|');if(!joined.has(key)){joined.set(key,true);edges.push({a,b,shared:true});}
        }
      });
      return {nodes,edges};
    }
    function layout(graph) {
      const positions=new Map();
      if(mode==='explore'){
        const otherBands=graph.nodes.filter(n=>n.type==='band'&&!n.focus);
        const members=graph.nodes.filter(n=>n.type==='person');
        if(expandedPerson && members.some(n=>String(n.ref.id)===expandedPerson)){
          // Keep the selected band, the expanded musician and their other bands
          // in distinct columns to avoid placing a person on top of a band.
          positions.set('b'+selected,{x:235,y:360});
          positions.set('p'+expandedPerson,{x:575,y:360});
          const connected=otherBands.filter(n=>(personBands.get(expandedPerson)||[]).includes(String(n.ref.id)));
          const remaining=otherBands.filter(n=>!connected.includes(n));
          connected.forEach((n,i)=>{
            const offset=i-(connected.length-1)/2;
            positions.set(n.id,{x:920+(i%2)*32,y:360+offset*Math.min(138,580/Math.max(1,connected.length))});
          });
          remaining.forEach((n,i)=>{
            const angle=-Math.PI/2+i*2*Math.PI/Math.max(1,remaining.length);
            positions.set(n.id,{x:810+Math.cos(angle)*95,y:360+Math.sin(angle)*270});
          });
          const others=members.filter(n=>String(n.ref.id)!==expandedPerson);
          others.forEach((n,i)=>{
            const y=360+(i-(others.length-1)/2)*Math.min(145,540/Math.max(1,others.length));
            positions.set(n.id,{x:380,y});
          });
          return positions;
        }
        positions.set('b'+selected,{x:600,y:360});
        // Put the outer bands on a stable ring, then position musicians
        // towards the bands they connect, rather than by their list order.
        otherBands.forEach((n,i)=>{
          const angle=-Math.PI/2+i*Math.PI*2/Math.max(1,otherBands.length);
          positions.set(n.id,{x:600+Math.cos(angle)*440,y:360+Math.sin(angle)*290});
        });
        const buckets=new Map();
        members.forEach((n,i)=>{
          const linked=(personBands.get(String(n.ref.id))||[])
            .filter(id=>id!==selected&&positions.has('b'+id))
            .map(id=>positions.get('b'+id));
          let x,y;
          if(linked.length){
            const bx=linked.reduce((sum,p)=>sum+p.x,0)/linked.length;
            const by=linked.reduce((sum,p)=>sum+p.y,0)/linked.length;
            // Balance towards the selected band without losing the direction
            // of the person's other documented band connections.
            x=600+(bx-600)*.58;
            y=360+(by-360)*.58;
          }else{
            const angle=-Math.PI/2+i*Math.PI*2/Math.max(1,members.length);
            x=600+Math.cos(angle)*165;
            y=360+Math.sin(angle)*140;
          }
          const key=Math.round(x/65)+','+Math.round(y/65);
          const count=buckets.get(key)||0;
          buckets.set(key,count+1);
          if(count){
            const angle=count*2.399963229728653;
            x+=Math.cos(angle)*Math.sqrt(count)*48;
            y+=Math.sin(angle)*Math.sqrt(count)*43;
          }
          positions.set(n.id,{x,y});
        });
        if(expandedPerson && positions.has('p'+expandedPerson)){
          const anchor=positions.get('p'+expandedPerson);
          const expandedBands=otherBands.filter(n=>(personBands.get(expandedPerson)||[]).includes(String(n.ref.id)));
          expandedBands.forEach((n,i)=>{
            const a=-Math.PI/2+(i-(expandedBands.length-1)/2)*Math.min(.58,2.7/Math.max(1,expandedBands.length));
            const distance=190+Math.min(i%3,2)*20;
            positions.set(n.id,{x:anchor.x+Math.cos(a)*distance,y:anchor.y+Math.sin(a)*distance});
          });
        }
        return positions;
      }
      const {nodes,edges}=graph, N=nodes.length;
      nodes.forEach((n,i)=>{
        const angle=i*2.399963229728653,r=Math.sqrt((i+.5)/Math.max(N,1))*285;
        positions.set(n.id,{x:600+Math.cos(angle)*r*1.6,y:360+Math.sin(angle)*r});
      });
      for(let step=0;step<150;step++){
        const move=new Map(nodes.map(n=>[n.id,{x:0,y:0}]));
        for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){
          const a=positions.get(nodes[i].id),b=positions.get(nodes[j].id);
          let dx=a.x-b.x,dy=a.y-b.y,d2=Math.max(150,dx*dx+dy*dy),d=Math.sqrt(d2);
          const f=Math.min(9,9000/d2);
          move.get(nodes[i].id).x+=dx/d*f;move.get(nodes[i].id).y+=dy/d*f;
          move.get(nodes[j].id).x-=dx/d*f;move.get(nodes[j].id).y-=dy/d*f;
        }
        edges.forEach(e=>{
          const a=positions.get(e.a),b=positions.get(e.b);if(!a||!b)return;
          const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy));
          const force=(d-140)*.018;
          move.get(e.a).x+=dx/d*force;move.get(e.a).y+=dy/d*force;
          move.get(e.b).x-=dx/d*force;move.get(e.b).y-=dy/d*force;
        });
        nodes.forEach(n=>{
          const p=positions.get(n.id),v=move.get(n.id);
          p.x+=Math.max(-11,Math.min(11,v.x+(600-p.x)*.006));
          p.y+=Math.max(-11,Math.min(11,v.y+(360-p.y)*.006));
        });
      }
      return positions;
    }
    function draw() {
      const graph=mode==='all'?entireGraph():focusedGraph(), pos=layout(graph);
      const radius = mode==='all'?11:19;
      let html='<g class="network-edges">';
      graph.edges.forEach(e=>{const a=pos.get(e.a),b=pos.get(e.b);if(a&&b)html+=`<line class="net-line ${e.relation?'relation':''}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"></line>`;});
      html+='</g>';
      graph.nodes.forEach(n=>{
        const p=pos.get(n.id),isBand=n.type==='band',r=isBand?radius*(n.focus?1.45:1):(mode==='all'?0:6);
        if(!r)return;
        const name=escapeHtml(n.ref.canonical_name);
        html+=`<g class="${isBand?'net-band':'net-person'} ${n.focus?'network-focus':''}" data-node="${n.id}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" tabindex="0" role="button" aria-label="${name}"><title>${name}</title><circle r="${r}"></circle>${showLabels&&(n.focus || (mode==='explore' && (isBand || graph.nodes.length<=20)))?`<text class="network-node-name" y="${r+15}">${name}</text>`:''}</g>`;
      });
      scene.innerHTML=html;
      resetView();
      $('#network-note').textContent=mode==='all'?`Visar alla ${bands.length} dokumenterade Uppsalaband och deras kända bandkopplingar. Klicka på ett band för att utforska dess medlemmar.`:`Visar ${graph.nodes.filter(n=>n.type==='band').length} band och ${graph.nodes.filter(n=>n.type==='person').length} personer. Kopplingarna bygger på arkivets dokumenterade uppgifter.`;
      scene.querySelectorAll('[data-node]').forEach(el=>{
        const activate=()=>{const id=el.dataset.node;if(id[0]==='b'){selected=id.slice(1);expandedPerson=null;mode='explore';$('#network-depth').disabled=false;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));resetView();draw();}else{const p=personById.get(id.slice(1));if(p){expandedPerson=String(p.id);mode='explore';document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));draw();showPerson(p);}}};
        el.addEventListener('click',activate);
        el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
      });
      showBand(bandById.get(selected));
    }
    function showBand(b){
      if(!b)return;
      const members=(bandPerson.get(String(b.id))||[]).map(id=>personById.get(id)).filter(Boolean);
      details.innerHTML=`<div class="section-kicker">VALT BAND</div><h2>${escapeHtml(b.canonical_name)}</h2><p>${members.length} dokumenterade personer</p><a class="network-profile-link" href="${bandHref(b)}">Öppna bandsidan ↗</a><div class="network-detail-heading">MEDLEMMAR & KOPPLINGAR</div>${members.length?members.map(p=>`<button class="network-person-link" data-person="${p.id}">${escapeHtml(p.canonical_name)} <span>↗</span></button>`).join(''):'<p>Inga dokumenterade medlemmar ännu.</p>'}`;
      details.querySelectorAll('[data-person]').forEach(btn=>btn.addEventListener('click',()=>focusNetwork(b,personById.get(String(btn.dataset.person)))));
    }
    function showPerson(p){
      if(!p)return;
      const related=(personBands.get(String(p.id))||[]).map(id=>bandById.get(id)).filter(Boolean);
      details.innerHTML=`<div class="section-kicker">PERSON</div><h2>${escapeHtml(p.canonical_name)}</h2><a class="network-profile-link" href="${personHref(p)}">Öppna personsidan ↗</a><div class="network-detail-heading">BANDKOPPLINGAR</div>${related.map(b=>`<button class="network-person-link" data-band="${b.id}">${escapeHtml(b.canonical_name)} <span>→</span></button>`).join('') || '<p>Ingen dokumenterad bandkoppling.</p>'}`;
      details.querySelectorAll('[data-band]').forEach(btn=>btn.addEventListener('click',()=>{selected=String(btn.dataset.band);expandedPerson=null;mode='explore';resetView();draw();}));
    }
    function applyTransform(){scene.setAttribute('transform',`translate(${transform.x} ${transform.y}) scale(${transform.k})`);const label=$('#net-zoom-level');if(label)label.textContent=Math.round(transform.k*100)+'%';}
    function resetView(){const box=scene.getBBox();if(!box.width||!box.height){transform={x:0,y:0,k:1};applyTransform();return;}const k=Math.max(.25,Math.min(2.2,Math.min(1100/(box.width+75),625/(box.height+75))));transform={k,x:600-(box.x+box.width/2)*k,y:360-(box.y+box.height/2)*k};applyTransform();}
    function zoom(factor,center={x:600,y:360}){const k=Math.max(.2,Math.min(8,transform.k*factor));const ratio=k/transform.k;transform.x=center.x-(center.x-transform.x)*ratio;transform.y=center.y-(center.y-transform.y)*ratio;transform.k=k;applyTransform();}
    $('#net-plus').addEventListener('click',()=>zoom(1.25));
    $('#net-minus').addEventListener('click',()=>zoom(.8));
    $('#net-reset').addEventListener('click',resetView);
    svg.addEventListener('wheel',e=>{e.preventDefault();const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(svg.getScreenCTM().inverse());zoom(e.deltaY<0?1.13:.885,{x:p.x,y:p.y});},{passive:false});
    svg.addEventListener('pointerdown',e=>{if(e.target.closest('[data-node]'))return;drag={x:e.clientX,y:e.clientY};svg.setPointerCapture(e.pointerId);});
    svg.addEventListener('pointermove',e=>{if(!drag)return;const rect=svg.getBoundingClientRect();transform.x+=(e.clientX-drag.x)*1200/rect.width;transform.y+=(e.clientY-drag.y)*720/rect.height;drag={x:e.clientX,y:e.clientY};applyTransform();});
    svg.addEventListener('pointerup',()=>drag=null);
    svg.addEventListener('pointercancel',()=>drag=null);
    document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{
      mode=btn.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b===btn));
      $('#network-depth').disabled=mode==='all';resetView();draw();
    }));
    $('#network-depth').addEventListener('change',e=>{depth=Number(e.target.value);resetView();draw();});
    $('#network-labels').addEventListener('change',e=>{showLabels=e.target.checked;draw();});
    function exploreSearch(){
      const term=search.value.trim().toLocaleLowerCase('sv');
      const b=bands.find(x=>x.canonical_name.toLocaleLowerCase('sv')===term);
      const p=people.find(x=>x.canonical_name.toLocaleLowerCase('sv')===term);
      if(b)focusNetwork(b);
      else if(p){const linked=personBands.get(String(p.id))||[];if(linked.length)focusNetwork(bandById.get(linked[0]),p);else showPerson(p);}
    }
    search.addEventListener('change',exploreSearch);
    search.addEventListener('input',exploreSearch);
    search.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();exploreSearch();}});
    draw();
  }

  function renderContact(band) {
    const email = cfg.contactEmail || 'info@swnworks.se';
    app.innerHTML = `${pageHeader('HJÄLP OSS ATT FYLLA LUCKORNA','Kontakt','Har du ett tips, en rättelse eller material från Uppsalas hårdrockshistoria? Hör av dig och hjälp arkivet att växa.')}
      <section class="section first-section contact-section">
        <div class="contact-intro"><div class="section-kicker">DIN HISTORIA HÖR HIT</div><h2>Vad saknas i arkivet?</h2>
          <p>Berätta om ett band, en spelning eller en person. Vi tar gärna emot tips om skivor, fotografier, affischer och andra källor.</p>
          <p>Har du bilder eller inskannat material? Beskriv vad du har, så tar vi det vidare via e-post.</p>
        </div>
        <form class="archive-contact-form" action="https://formsubmit.co/ajax/${escapeHtml(email)}" method="post">
          <div class="contact-fields">
            <label for="contact-name">Namn<input id="contact-name" name="name" autocomplete="name" placeholder="Ditt namn" maxlength="150" required></label>
            <label for="contact-email">E-post<input id="contact-email" type="email" name="email" autocomplete="email" placeholder="din@epost.se" maxlength="254" required></label>
          </div>
          <label for="contact-subject">Ämne<input id="contact-subject" name="subject" placeholder="Ett band, en rättelse eller något annat?" maxlength="200" required></label>
          <label for="contact-message">Meddelande<textarea id="contact-message" name="message" rows="7" placeholder="Berätta vad du vet. Lägg gärna med en källhänvisning eller länk." maxlength="12000" required></textarea></label>
          <input type="hidden" name="_subject" value="Uppsala Hårdrocksarkiv – nytt meddelande">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_captcha" value="false">
          <div class="contact-honey" aria-hidden="true"><label>Webbplats<input name="_honey" tabindex="-1" autocomplete="off"></label></div>
          <div class="contact-actions"><button class="button button-primary" type="submit">Skicka meddelande <span aria-hidden="true">→</span></button><span>Eller mejla direkt: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></span></div>
          <p class="contact-privacy">Ditt meddelande skickas till arkivet via FormSubmit. Namn och e-postadress publiceras inte i arkivet.</p>
          <p class="contact-status" role="status" aria-live="polite"></p>
        </form>
      </section>`;
    const form = $('.archive-contact-form');
    if (band) {
      const gaps = bandGaps(band);
      $('#contact-subject', form).value = 'Tips om ' + band.canonical_name;
      $('#contact-message', form).value = 'Band: ' + band.canonical_name + '\nBandsida: ' + location.href.split('#')[0] + bandHref(band) + '\n'
        + (gaps.length ? '\nArkivet söker: ' + gaps.join(', ') + '.\n' : '')
        + '\nMitt tips eller min rättelse:\n\n\nKälla eller länk (om du har):\n';
    }
    const status = $('.contact-status', form);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (form.dataset.sending === 'true') return;
      if (form.elements._honey.value) return;
      const button = $('button[type="submit"]', form);
      form.dataset.sending = 'true';
      button.disabled = true;
      button.textContent = 'Skickar…';
      status.textContent = '';
      status.className = 'contact-status';
      try {
        const response = await fetch(form.action, {
          method: 'POST', body: new FormData(form), headers: {Accept: 'application/json'},
          signal: AbortSignal.timeout(20000)
        });
        const result = await response.json();
        if (!response.ok || (result.success !== true && result.success !== 'true')) throw new Error('send failed');
        form.reset();
        status.textContent = 'Tack! Ditt meddelande har skickats till arkivet.';
        status.classList.add('success');
      } catch (error) {
        status.textContent = `Vi kunde inte bekräfta att meddelandet skickades. Texten finns kvar – försök igen eller mejla ${email}.`;
        status.classList.add('error');
      } finally {
        form.dataset.sending = 'false';
        button.disabled = false;
        button.innerHTML = 'Skicka meddelande <span aria-hidden="true">→</span>';
      }
    });
  }

  function renderNotFound() {
    app.innerHTML = `${pageHeader('404','Sidan hittades inte','Länken pekar inte på någon registrerad sida i arkivet.')}<section class="section first-section"><a class="button button-primary" href="#/">Till startsidan</a></section>`;
  }

  function updateNav(path) {
    $$('#site-nav a').forEach(a => {
      const r=a.dataset.route;
      const active = r === '/' ? path === '/' : path === r || path.startsWith(`${r}/`) || (r === '/band' && path.startsWith('/band/')) || (r === '/personer' && path.startsWith('/person/')) || (r === '/utgavor' && path.startsWith('/utgava/'));
      a.classList.toggle('active', active);
    });
  }

  function renderRoute() {
    const path = routePath();
    updateNav(path);
    $('#site-nav')?.classList.remove('open');
    $('.nav-toggle')?.setAttribute('aria-expanded','false');
    const parts = path.split('/').filter(Boolean);
    if (path === '/') renderHome();
    else if (parts[0] === 'sok') { let query = ''; try { query = decodeURIComponent(parts.slice(1).join('/')); } catch {} renderSearch(query); }
    else if (path === '/videor' || parts[0] === 'videor' && parts[1]) renderVideos(parts[1] || '');
    else if (path === '/band') renderBandIndex();
    else if (parts[0] === 'band' && parts[1]) { const b=findBand(parts[1]); b ? renderBandDetail(b) : renderNotFound(); }
    else if (path === '/personer') renderPeopleIndex();
    else if (parts[0] === 'person' && parts[1]) { const p=findPerson(parts[1]); p ? renderPersonDetail(p) : renderNotFound(); }
    else if (path === '/utgavor') renderReleasesIndex();
    else if (parts[0] === 'utgava' && parts[1]) { const r=findRelease(parts[1]); r ? renderReleaseDetail(r) : renderNotFound(); }
    else if (path === '/tidslinje') renderTimeline();
    else if (path === '/natverket') renderNetwork();
    else if (path === '/kallor') renderSources();
    else if (path === '/kontakt' || (parts[0] === 'kontakt' && parts[1])) renderContact(parts[1] ? findBand(decodeURIComponent(parts[1])) : null);
    else renderNotFound();
    bindYoutubePreviews();
    window.scrollTo({top:0, behavior:'instant'});
    document.title = `${document.querySelector('.page-hero h1, .hero h1')?.textContent.trim().replace(/\s+/g,' ') || 'Uppsala Hårdrocksarkiv'} – Uppsala Hårdrocksarkiv`;
  }

  function handleArchiveImageError(img) {
    if (!(img instanceof HTMLImageElement)) return;
    const wrap = img.closest('.detail-media, .band-card, .person-card-portrait, .release-cover-thumb, .archive-gallery-media');
    if (!wrap) return;
    img.style.display = 'none';
    // Failed band photos should behave like the existing text-only band cards.
    if (wrap.classList.contains('band-card')) {
      wrap.classList.remove('has-media');
      const shade = wrap.querySelector('.band-card-shade');
      if (shade) shade.hidden = true;
      return;
    }
    wrap.classList.add('external-image-failed');
    if (wrap.querySelector('.image-unavailable')) return;
    const message = document.createElement('span');
    message.className = 'image-unavailable';
    message.textContent = wrap.classList.contains('release-cover-thumb') ? 'UHA' : 'Bild ej tillgänglig';
    wrap.appendChild(message);
  }

  document.addEventListener('error', e => handleArchiveImageError(e.target), true);

  window.addEventListener('hashchange', renderRoute);
  $('.nav-toggle').addEventListener('click', e => {
    const nav=$('#site-nav'); nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded',nav.classList.contains('open'));
  });
  if (!location.hash) history.replaceState(null,'','#/');
  if (routePath() === '/kontakt') renderRoute();
  load();
})();
