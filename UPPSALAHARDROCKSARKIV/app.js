(() => {
  'use strict';

  const cfg = window.ARCHIVE_CONFIG;
  const releaseCovers = window.ARCHIVE_RELEASE_COVERS || {};
  const app = document.getElementById('app');
  const syncLabel = document.getElementById('sync-label');
  const state = {
    people: [], bands: [], relatedBands: [], allBands: [], memberships: [], releases: [], releaseBands: [], releaseMembers: [],
    relations: [], sources: [], claims: [], claimSources: [], claimEntities: [], uppsalaBandIds: [], mediaItems: [], mediaLinks: []
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
      ['https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Wuthering_Heights_Salt.png/440px-Wuthering_Heights_Salt.png','Wuthering Heights · Salt · Teddy Möller på bas, gitarr, kör och engineering/mix','https://www.metal-archives.com/albums/Wuthering_Heights/Salt/261309','Wuthering Heights / Metal Archives'],
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
    'anima-morte|serpents-in-the-fields-of-sleep':'https://www.progarchives.com/progressive_rock_discography_covers/6589/cover_42188392022_r.jpg',
    'gauntlet-rule|the-plague-court':'https://f4.bcbits.com/img/a0283925770_16.jpg',
    'f-k-u|metal-moshing-mad':'https://i0.wp.com/assets.bigcartel.com/product_images/58355477/R-1449287-1221061884_1_.jpeg?ssl=1',
    'the-hidden|fearful-symmetry':'https://f4.bcbits.com/img/a1140447514_10.jpg',
    'wuthering-heights|the-shadow-cabinet':'https://i.scdn.co/image/ab67616d0000b2735250aa72f96efb7d4ece5664',
    'wuthering-heights|salt':'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Wuthering_Heights_Salt.png/440px-Wuthering_Heights_Salt.png',
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
      ['https://www.progarchives.com/progressive_rock_discography_covers/6589/cover_42188392022_r.jpg','Anima Morte · Serpents in the Fields of Sleep · 2022','https://animamorte.bandcamp.com/album/serpents-in-the-fields-of-sleep','Anima Morte / Bandcamp']
    ],
    'gauntlet-rule': [
      ['https://d2x4qakry0y44a.cloudfront.net/wp-content/uploads/2021/06/18091910/GAUNTLET-RULE.jpg','Gauntlet Rule · Rogga Johansson, Peter Svensson och Teddy Möller','https://tntradiorock.com/rogga-johansson-peter-svensson-y-teddy-moller-unen-fuerzas-en-gauntlet-rule-banda-de-heavy-metal/','TNT Radio Rock'],
      ['https://f4.bcbits.com/img/a0283925770_16.jpg','Gauntlet Rule · The Plague Court · 2022','https://gauntletrulesweden.bandcamp.com/album/the-plague-court','Gauntlet Rule / Bandcamp']
    ],
    'f-k-u': [
      ['https://i.scdn.co/image/ab6761610000e5eb20e6daa5877918a60c401aa0','F.K.Ü. · bandbild','https://open.spotify.com/artist/5h0HlqYN5TvocKVL1NSJ80','Spotify'],
      ['https://www.moshoholics.com/img/banners/tour-2024-xs.jpg','F.K.Ü. · live 2024','https://www.moshoholics.com/tour.php','F.K.Ü. · officiell sida'],
      ['https://i0.wp.com/assets.bigcartel.com/product_images/58355477/R-1449287-1221061884_1_.jpeg?ssl=1','F.K.Ü. · Metal Moshing Mad · 1999','https://www.moshoholics.com/releases.php','F.K.Ü. · officiell diskografi']
    ],
    'the-hidden': [
      ['https://f4.bcbits.com/img/a1140447514_10.jpg','The Hidden · Fearful Symmetry · 2014','https://tribunalrecords.bandcamp.com/album/fearful-symmetry-2','Tribunal / Divebomb Records']
    ],
    'stallion-four': [
      ['https://metal-temple.com/wp-content/uploads/2023/10/Stallion-Four-Rough-Times-album-cover.webp','Stallion Four · Rough Times · albumomslag 2012','https://metal-temple.com/review/stallion-four-rough-times/','Metal Temple'],
    ],
    'wuthering-heights': [
      ['https://i.scdn.co/image/ab67616d0000b2735250aa72f96efb7d4ece5664','Wuthering Heights · The Shadow Cabinet · 2006','https://open.spotify.com/album/7pCdMyoHEukSMz0KcCk65v','Spotify'],
      ['https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Wuthering_Heights_Salt.png/440px-Wuthering_Heights_Salt.png','Wuthering Heights · Salt · 2010','https://www.metal-archives.com/albums/Wuthering_Heights/Salt/261309','Metal Archives']
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
      ['https://i0.wp.com/assets.bigcartel.com/product_images/58355477/R-1449287-1221061884_1_.jpeg?ssl=1','Metal Moshing Mad · 1999','https://www.moshoholics.com/releases.php','F.K.Ü. · officiell diskografi']
    ],
    'the-hidden|fearful-symmetry': [
      ['https://f4.bcbits.com/img/a1140447514_10.jpg','Fearful Symmetry · 2014','https://tribunalrecords.bandcamp.com/album/fearful-symmetry-2','Tribunal / Divebomb Records']
    ],
    'wuthering-heights|the-shadow-cabinet': [
      ['https://i.scdn.co/image/ab67616d0000b2735250aa72f96efb7d4ece5664','The Shadow Cabinet · 2006','https://open.spotify.com/album/7pCdMyoHEukSMz0KcCk65v','Spotify']
    ],
    'wuthering-heights|salt': [
      ['https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Wuthering_Heights_Salt.png/440px-Wuthering_Heights_Salt.png','Salt · 2010','https://www.metal-archives.com/albums/Wuthering_Heights/Salt/261309','Metal Archives']
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
      ['https://www.progarchives.com/progressive_rock_discography_covers/6589/cover_42188392022_r.jpg','Serpents in the Fields of Sleep · 2022','https://animamorte.bandcamp.com/album/serpents-in-the-fields-of-sleep','Anima Morte / Bandcamp']
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
    'https://i0.wp.com/assets.bigcartel.com/product_images/58355477/R-1449287-1221061884_1_.jpeg?ssl=1': {label:'F.K.Ü. · Metal Moshing Mad',sourceUrl:'https://www.moshoholics.com/releases.php'},
    'https://f4.bcbits.com/img/a1140447514_10.jpg': {label:'The Hidden / Tribunal + Divebomb Records · Fearful Symmetry',sourceUrl:'https://tribunalrecords.bandcamp.com/album/fearful-symmetry-2'},
    'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/29/3a/c8/293ac827-51ff-0428-8bfa-f2d2c170c6e1/artwork.jpg/600x600bf-60.jpg': {label:'Anima Morte · The Nightmare Becomes Reality',sourceUrl:'https://animamorte.bandcamp.com/album/the-nightmare-becomes-reality'},
    'https://f4.bcbits.com/img/a0700897435_16.jpg': {label:'Anima Morte / Bandcamp · Upon Darkened Stains',sourceUrl:'https://animamorte.bandcamp.com/album/upon-darkened-stains'},
    'https://www.progarchives.com/progressive_rock_discography_covers/6589/cover_42188392022_r.jpg': {label:'Anima Morte · Serpents in the Fields of Sleep',sourceUrl:'https://animamorte.bandcamp.com/album/serpents-in-the-fields-of-sleep'},
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

  function bandMedia(b) {
    return b ? (BAND_MEDIA[slugify(b.canonical_name)] || '') : '';
  }
  function personMedia(p) {
    return p ? (PERSON_MEDIA[slugify(p.canonical_name)] || '') : '';
  }

  function personGallery(p) {
    return p ? (PERSON_GALLERY[slugify(p.canonical_name)] || []) : [];
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
    return b ? (BAND_GALLERY[slugify(b.canonical_name)] || []) : [];
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
    try {
      const snapshot = await loadArchiveSnapshot();
      Object.keys(state).forEach(key => state[key] = Array.isArray(snapshot?.[key]) ? snapshot[key] : []);
      syncLabel.textContent = `Live från arkivet · ${new Date().toLocaleTimeString('sv-SE', {hour:'2-digit', minute:'2-digit'})}`;
      if (routePath() !== '/kontakt' || !$('.archive-contact-form')) renderRoute();
    } catch (err) {
      console.error(err);
      syncLabel.textContent = 'Kunde inte nå arkivet';
      if (routePath() === '/kontakt') {
        if (!$('.archive-contact-form')) renderRoute();
        return;
      }
      app.innerHTML = `<section class="page page-narrow"><div class="error-box"><strong>Kunde inte hämta arkivet.</strong><br>Kontrollera internetanslutningen och ladda om sidan.<span class="error-detail"> ${escapeHtml(err.message || '')}</span></div></section>`;
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

  function roleSv(role='') {
    return role.replaceAll('Vocals','sång').replaceAll('Guitars','gitarr').replaceAll('Bass','bas').replaceAll('Drums','trummor');
  }
  function statusSv(s) { return ({confirmed:'Bekräftad', probable:'Trolig', unconfirmed:'Obekräftad', disputed:'Omstridd', rejected:'Avfärdad'})[s] || s; }
  function sourceReliabilitySv(s) { return ({high:'Stark källa',medium:'Sekundärkälla',low:'Svag källa',unknown:'Ej bedömd'})[s] || s; }
  function relationSv(s) { return ({formed_from:'Bildades ur',renamed_to:'Bytte namn till',reformed_as:'Återbildades som',side_project:'Sidoprojekt till',successor:'Efterföljare till',predecessor:'Föregångare till',shared_lineup:'Delad lineup med',other:'Koppling till'})[s] || 'Koppling till'; }
  function yearSpan(m) {
    if (!m.joined_year && !m.left_year) return 'Årtal söks';
    if (m.joined_year && m.left_year) return `${m.joined_year}${m.left_year !== m.joined_year ? `–${m.left_year}` : ''}`;
    return String(m.joined_year || m.left_year);
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
  function findPerson(slug) { return state.people.find(x => slugify(x.canonical_name) === slug); }
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

  function renderHome() {
    const john = state.people.find(p => p.canonical_name === 'John S. Swahn');
    const johnBands = john ? membershipsForPerson(john.id).map(m => bandsById().get(m.band_id)).filter(Boolean) : [];
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
          <div class="hero-actions"><a class="button button-primary" href="#/band">Utforska banden</a><a class="button button-ghost" href="#/tidslinje">Se tidslinjen</a></div>
          <div class="hero-stats">
            <div><strong>${archiveBands.length}</strong><span>Uppsala-band</span></div>
            <div><strong>${state.people.length}</strong><span>personer</span></div>
            <div><strong>${state.releases.length}</strong><span>utgåvor</span></div>
            <div><strong>${state.sources.length}</strong><span>källor</span></div>
          </div>
        </div>
      </section>

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

      <section class="feature-story section home-feature">
        <div class="feature-side"><span class="feature-index">01</span><span class="feature-label">FÖRSTA INGÅNGEN</span></div>
        <div class="feature-main">
          <p class="eyebrow">PERSON / JOHN S. SWAHN</p>
          <h2>En tråd genom flera band.</h2>
          <div class="feature-grid">
            <div><p class="feature-lead">John S. Swahn är den första ingången till kartläggningen. Hans bandsida och personprofil blir en knutpunkt där äldre och senare grenar kan byggas ut.</p><a class="button button-dark" href="${john ? personHref(john) : '#/personer'}">Öppna John S. Swahns sida</a></div>
            <div class="john-path">${johnBands.map(b => `<a class="john-path-item" href="${bandHref(b)}"><div class="john-path-year">${b.formed_year || '—'}</div><div><div class="john-path-band">${escapeHtml(b.canonical_name)}</div><div class="john-path-role">${escapeHtml((b.genres || []).join(' / '))}</div></div><div class="john-path-role">Öppna →</div></a>`).join('')}</div>
          </div>
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


  function personCard(p, i = 0) {
    const mems = membershipsForPerson(p.id);
    const names = [...new Set(mems.map(m => bandName(m.band_id)))];
    const media = personMedia(p);
    return `<a class="person-card${media ? ' has-portrait' : ''}" href="${personHref(p)}">
      ${media ? `<div class="person-card-portrait"><img src="${media}" alt="${escapeHtml(p.canonical_name)}" loading="lazy"></div>` : ''}
      <div class="person-card-copy"><div class="person-number">${String(i+1).padStart(2,'0')}</div><h3>${escapeHtml(p.canonical_name)}</h3><div class="person-bands">${escapeHtml(names.join(' · ') || 'Koppling kartläggs')}</div></div>
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


  function renderBandIndex() {
    const ordered = [...uppsalaBands()].sort((a,b) => (a.formed_year || 9999) - (b.formed_year || 9999) || a.canonical_name.localeCompare(b.canonical_name,'sv'));
    app.innerHTML = `${pageHeader('BAND I ARKIVET','Band','Från tidig hårdrock och thrash till death, black och senare grenar av Uppsalas metalscen.')}
      <section class="section page-section first-section">
        <div class="index-toolbar"><label class="search-box"><span>Sök band</span><input id="band-search" type="search" placeholder="Namn, genre eller år…"></label><div class="index-count"><strong id="band-count">${ordered.length}</strong> band</div></div>
        <div class="band-grid" id="band-grid">${ordered.map(bandCard).join('')}</div>
      </section>`;
    const input = $('#band-search');
    input.addEventListener('input', () => {
      const term = input.value.trim().toLocaleLowerCase('sv');
      const filtered = ordered.filter(b => `${b.canonical_name} ${(b.genres||[]).join(' ')} ${b.formed_year || ''}`.toLocaleLowerCase('sv').includes(term));
      $('#band-grid').innerHTML = filtered.map(bandCard).join('');
      $('#band-count').textContent = filtered.length;
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
        <aside class="detail-aside">${bandMedia(b) ? `<figure class="detail-media"><img src="${bandMedia(b)}" alt="${escapeHtml(b.canonical_name)}"></figure>${externalMediaCredit(bandMedia(b))}` : ''}<div class="aside-label">Översikt</div><p>${escapeHtml(b.description || defaultDescription)}</p><div class="aside-facts"><div><span>Status</span><strong>${b.status === 'active' ? 'Aktivt' : b.status === 'inactive' ? 'Inaktivt' : 'Okänt'}</strong></div><div><span>Arkivklass</span><strong>${scopeLabel}</strong></div><div><span>Medlemmar i arkivet</span><strong>${memberGroups.length}</strong></div><div><span>Utgåvor i arkivet</span><strong>${rels.length}</strong></div></div></aside>
        <div class="detail-main">
          <section class="content-section"><div class="content-head"><span>01</span><h2>Medlemmar</h2></div><div class="credit-list">${memberGroups.length ? memberGroups.map(group => { const p=peopleById().get(group.person_id); return `<a href="${personHref(p)}"><strong>${escapeHtml(p.canonical_name)}</strong><span>${escapeHtml(group.roles || 'Roll kartläggs')}</span><em>${escapeHtml(group.periods || 'Årtal söks')}</em></a>`; }).join('') : '<div class="empty-state">Lineup kartläggs.</div>'}</div></section>
          <section class="content-section"><div class="content-head"><span>02</span><h2>Utgåvor</h2></div><div class="release-stack">${rels.length ? rels.map(releaseRow).join('') : '<div class="empty-state">Inga utgåvor registrerade ännu.</div>'}</div></section>
          ${gallery.length ? `<section class="content-section"><div class="content-head"><span>03</span><h2>Bildarkiv</h2></div>${archiveGallery(gallery)}</section>` : ''}
          ${links.length ? `<section class="content-section"><div class="content-head"><span>${gallery.length ? '04':'03'}</span><h2>Kopplingar</h2></div><div class="relation-grid">${links.map(r => { const otherId = r.from_band_id === b.id ? r.to_band_id : r.from_band_id; const other = bandsById().get(otherId); return `<a href="${bandHref(other)}"><span>${escapeHtml(relationSv(r.relation_type))}</span><strong>${escapeHtml(other.canonical_name)}</strong><em>${r.from_year || ''}</em></a>`; }).join('')}</div></section>` : ''}
          <section class="content-section"><div class="content-head"><span>${String(3 + (gallery.length ? 1 : 0) + (links.length ? 1 : 0)).padStart(2,'0')}</span><h2>Källäge</h2></div>${claimList(claims)}</section>
          ${sources.length ? `<section class="content-section"><div class="content-head"><span>${String(4 + (gallery.length ? 1 : 0) + (links.length ? 1 : 0)).padStart(2,'0')}</span><h2>Källor</h2></div>${sourceList(sources)}</section>` : ''}
        </div>
      </section>`;
  }

  function renderPeopleIndex() {
    const ordered = [...state.people].sort((a,b) => a.canonical_name.localeCompare(b.canonical_name,'sv'));
    app.innerHTML = `${pageHeader('MÄNNISKORNA BAKOM BANDEN','Personer','Följ en musiker genom olika band, perioder och dokumenterade utgåvekrediter.')}
      <section class="section page-section first-section"><div class="index-toolbar"><label class="search-box"><span>Sök person</span><input id="people-search" type="search" placeholder="Namn eller band…"></label><div class="index-count"><strong id="people-count">${ordered.length}</strong> personer</div></div><div class="people-grid" id="people-grid">${ordered.map(personCard).join('')}</div></section>`;
    const input = $('#people-search');
    input.addEventListener('input', () => {
      const term = input.value.trim().toLocaleLowerCase('sv');
      const filtered = ordered.filter(p => `${p.canonical_name} ${membershipsForPerson(p.id).map(m => bandName(m.band_id)).join(' ')}`.toLocaleLowerCase('sv').includes(term));
      $('#people-grid').innerHTML = filtered.map(personCard).join('');
      $('#people-count').textContent = filtered.length;
    });
  }

  function renderPersonDetail(p) {
    const mems = membershipsForPerson(p.id).sort((a,b) => (a.joined_year || 9999) - (b.joined_year || 9999));
    const bandGroups = groupedMembershipsForPerson(p.id);
    const credits = state.releaseMembers.filter(x => x.person_id === p.id).map(x => ({...x, release: releasesById().get(x.release_id)})).filter(x => x.release).sort((a,b) => (a.release.release_year || 9999) - (b.release.release_year || 9999));
    const claims = claimsForPerson(p.id);
    const sources = sourcesForClaims(claims);
    const gallery = personGallery(p);
    const uniqueBands = bandGroups.map(group => group.band);
    const meta = uniqueBands.slice(0,5).map(b => `<a href="${bandHref(b)}">${escapeHtml(b.canonical_name)}</a>`).join('');
    const sourceNo = gallery.length ? '05' : '04';
    app.innerHTML = `${breadcrumbs([{label:'Personer',href:'#/personer'},{label:p.canonical_name}])}${pageHeader('PERSON / UPPSALA-SCENEN',escapeHtml(p.canonical_name),'',meta)}
      <section class="section detail-layout first-section">
        <aside class="detail-aside">${personMedia(p) ? `<figure class="detail-media detail-portrait"><img src="${personMedia(p)}" alt="${escapeHtml(p.canonical_name)}"></figure>${externalMediaCredit(personMedia(p))}` : ''}<div class="aside-label">Profil</div><p>${escapeHtml(p.biography || p.uppsala_connection || 'Dokumenterad i Uppsala-scenen.')}</p><div class="aside-facts"><div><span>Bandkopplingar</span><strong>${uniqueBands.length}</strong></div><div><span>Utgåvekrediter</span><strong>${credits.length}</strong></div><div><span>Källkopplade uppgifter</span><strong>${claims.length}</strong></div></div></aside>
        <div class="detail-main">
          <section class="content-section"><div class="content-head"><span>01</span><h2>Band</h2></div><div class="credit-list">${bandGroups.length ? bandGroups.map(group => `<a href="${bandHref(group.band)}"><strong>${escapeHtml(group.band.canonical_name)}</strong><span>${escapeHtml(group.roles)}</span><em>${escapeHtml(group.periods)}</em></a>`).join('') : '<div class="empty-state">Bandkopplingar kartläggs.</div>'}</div></section>
          <section class="content-section"><div class="content-head"><span>02</span><h2>Utgåvekrediter</h2></div><div class="credit-list">${credits.length ? credits.map(x => `<a href="${releaseHref(x.release)}"><div class="credit-release"><strong>${escapeHtml(x.release.title)}</strong><small class="credit-band">${escapeHtml([...new Set(state.releaseBands.filter(rb => rb.release_id === x.release.id).map(rb => rb.credited_as || bandName(rb.band_id)).filter(Boolean))].join(' / '))}</small></div><span>${escapeHtml(roleSv(x.role || ''))}</span><em>${x.release.release_year || '—'}</em></a>`).join('') : '<div class="empty-state">Inga releasecredits registrerade ännu.</div>'}</div></section>
          ${gallery.length ? `<section class="content-section"><div class="content-head"><span>03</span><h2>Relaterade bilder</h2></div><p class="section-intro">Gruppbilder och pressmaterial där personen är säkert knuten till sammanhanget. De används inte som individuella porträtt om bildidentifieringen inte är entydig.</p>${archiveGallery(gallery)}</section>` : ''}
          <section class="content-section"><div class="content-head"><span>${gallery.length ? '04':'03'}</span><h2>Källäge</h2></div>${claimList(claims)}</section>
          ${sources.length ? `<section class="content-section"><div class="content-head"><span>${sourceNo}</span><h2>Källor</h2></div>${sourceList(sources)}</section>` : ''}
        </div>
      </section>`;
  }

  function renderReleasesIndex() {
    const ordered = [...state.releases].sort((a,b) => (a.release_year || 9999) - (b.release_year || 9999) || a.title.localeCompare(b.title,'sv'));
    app.innerHTML = `${pageHeader('DEMOER / KASSETTER / UTGÅVOR','Utgåvor','Utgåvorna är ofta de bästa hållpunkterna för årtal, lineups och hur scenen faktiskt såg ut vid en viss tidpunkt.')}
      <section class="section page-section first-section"><div class="index-toolbar"><label class="search-box"><span>Sök utgåva</span><input id="release-search" type="search" placeholder="Titel, band eller år…"></label><div class="index-count"><strong id="release-count">${ordered.length}</strong> utgåvor</div></div><div class="release-stack" id="release-stack">${ordered.map(releaseRow).join('')}</div></section>`;
    const input = $('#release-search');
    input.addEventListener('input', () => {
      const term = input.value.trim().toLocaleLowerCase('sv');
      const filtered = ordered.filter(r => `${r.title} ${releaseBand(r.id)?.canonical_name || ''} ${r.release_year || ''}`.toLocaleLowerCase('sv').includes(term));
      $('#release-stack').innerHTML = filtered.map(releaseRow).join('');
      $('#release-count').textContent = filtered.length;
    });
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
        <aside class="detail-aside">${releaseMedia(r) ? `<figure class="detail-media release-artwork"><img src="${releaseMedia(r)}" alt="${escapeHtml(r.title)}"></figure>${externalMediaCredit(releaseMedia(r))}` : ''}<div class="aside-label">Utgåva</div><p>${escapeHtml(r.description || `En ${r.release_type || 'utgåva'} från ${r.release_year || 'okänt år'} i arkivet.`)}</p>${band ? `<a class="button button-ghost aside-button" href="${bandHref(band)}">Öppna ${escapeHtml(band.canonical_name)}</a>` : ''}</aside>
        <div class="detail-main">
          <section class="content-section"><div class="content-head"><span>01</span><h2>Krediter</h2></div><div class="credit-list">${credits.length ? credits.map(c => { const p=peopleById().get(c.person_id); return `<a href="${personHref(p)}"><strong>${escapeHtml(c.credited_as || p.canonical_name)}</strong><span>${escapeHtml(roleSv(c.role || ''))}</span><em>${escapeHtml(p.canonical_name)}</em></a>`; }).join('') : '<div class="empty-state">Krediter kartläggs.</div>'}</div></section>
          ${gallery.length ? `<section class="content-section"><div class="content-head"><span>02</span><h2>Omslag & originalmaterial</h2></div>${archiveGallery(gallery)}</section>` : ''}
          <section class="content-section"><div class="content-head"><span>${gallery.length ? '03':'02'}</span><h2>Källäge</h2></div>${claimList(claims)}</section>
          ${sources.length ? `<section class="content-section"><div class="content-head"><span>${gallery.length ? '04':'03'}</span><h2>Källor</h2></div>${sourceList(sources)}</section>` : ''}
        </div>
      </section>`;
  }

  function timelineRows() {
    const rows = [];
    state.releases.forEach(r => {
      const b = releaseBand(r.id);
      const credits = creditsForRelease(r.id).map(c => `${personName(c.person_id)} (${roleSv(c.role)})`);
      rows.push({year:r.release_year, href:releaseHref(r), title:`${b?.canonical_name || 'Okänt band'} — ${r.title}`, text:credits.length ? `Dokumenterade krediter: ${credits.join(', ')}.` : `${r.release_type || 'Utgåva'} i arkivet.`, tags:[r.release_type,r.format].filter(Boolean)});
    });
    state.claims.filter(c => c.claim_type === 'band_formation' && c.from_year).forEach(c => {
      const ent = state.claimEntities.find(e => e.claim_id === c.id && e.entity_type === 'band' && e.entity_role === 'subject');
      const b = ent ? bandsById().get(ent.entity_id) : null;
      rows.push({year:c.from_year, href:b ? bandHref(b) : '#/band', title:b?.canonical_name || 'Ny knutpunkt', text:translateClaim(c.statement), tags:[statusSv(c.status)]});
    });
    return rows.sort((a,b) => (a.year || 9999) - (b.year || 9999) || a.title.localeCompare(b.title,'sv'));
  }

  function renderTimeline() {
    app.innerHTML = `${pageHeader('ÅR FÖR ÅR','Tidslinjen','Utgåvor, bandbildningar och andra hållpunkter samlade kronologiskt.')}
      <section class="section page-section first-section"><div class="timeline">${timelineRows().map(row => `<article class="timeline-row"><div class="timeline-year">${row.year || '—'}</div><div class="timeline-content"><h3><a href="${row.href}">${escapeHtml(row.title)}</a></h3><p>${escapeHtml(row.text)}</p><div class="timeline-tags">${row.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div></div></article>`).join('')}</div></section>`;
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
    app.innerHTML = `${pageHeader('KÄLLLÄGET ÄR EN DEL AV HISTORIEN','Källor','Arkivet skiljer mellan förstahandskällor, bandens egna historieskrivningar och specialistdatabaser.')}
      <section class="section page-section first-section">${sourceList(ordered)}</section>`;
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
      bandPerson.get(bid).push(pid);
      personBands.get(pid).push(bid);
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
          <div class="network-toolbar-row"><div class="network-tabs"><button class="active" data-mode="explore">Utforska</button><button data-mode="all">Hela nätverket</button></div><label class="network-depth-label">Kopplingar <select id="network-depth"><option value="1">1 nivå</option><option value="2">2 nivåer</option></select></label><label class="network-label-toggle"><input id="network-labels" type="checkbox" checked> Visa namn</label><button id="network-fullscreen" class="network-fullscreen-btn" type="button" aria-pressed="false">⛶ Visa helskärm</button></div>
        </div>
        <div class="network-layout"><div class="network-shell"><svg id="network" viewBox="0 0 1200 720" aria-label="Interaktiv karta över band och personer" role="img"><g id="network-scene"></g></svg>
          <div class="network-map-controls"><button id="net-plus" title="Zooma in" aria-label="Zooma in">+</button><button id="net-minus" title="Zooma ut" aria-label="Zooma ut">−</button><button id="net-reset" title="Anpassa nätverket till vyn" aria-label="Visa hela nätverket">⤢</button><span id="net-zoom-level">100%</span></div><div class="network-hint">Scrolla för att zooma · Dra för att flytta</div>
          <div class="network-legend"><span><i class="legend-band"></i> Band</span><span><i class="legend-person"></i> Person</span><span><i class="legend-line"></i> Koppling</span></div>
          </div><aside class="network-details" id="network-details"></aside></div>
        <p class="network-note" id="network-note"></p>
      </section>`;
    const svg = $('#network'), scene = $('#network-scene'), details = $('#network-details');
    const search=$('#network-search');
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
      details.querySelectorAll('[data-person]').forEach(btn=>btn.addEventListener('click',()=>showPerson(personById.get(String(btn.dataset.person)))));
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
    search.addEventListener('change',()=>{
      const term=search.value.trim().toLocaleLowerCase('sv');
      const b=bands.find(x=>x.canonical_name.toLocaleLowerCase('sv')===term);
      const p=people.find(x=>x.canonical_name.toLocaleLowerCase('sv')===term);
      if(b){selected=String(b.id);expandedPerson=null;mode='explore';document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===mode));resetView();draw();}
      else if(p){const linked=personBands.get(String(p.id))||[];if(linked.length){selected=linked[0];mode='explore';resetView();draw();}showPerson(p);}
    });
    draw();
  }

  function renderContact() {
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
    else if (path === '/band') renderBandIndex();
    else if (parts[0] === 'band' && parts[1]) { const b=findBand(parts[1]); b ? renderBandDetail(b) : renderNotFound(); }
    else if (path === '/personer') renderPeopleIndex();
    else if (parts[0] === 'person' && parts[1]) { const p=findPerson(parts[1]); p ? renderPersonDetail(p) : renderNotFound(); }
    else if (path === '/utgavor') renderReleasesIndex();
    else if (parts[0] === 'utgava' && parts[1]) { const r=findRelease(parts[1]); r ? renderReleaseDetail(r) : renderNotFound(); }
    else if (path === '/tidslinje') renderTimeline();
    else if (path === '/natverket') renderNetwork();
    else if (path === '/kallor') renderSources();
    else if (path === '/kontakt') renderContact();
    else renderNotFound();
    window.scrollTo({top:0, behavior:'instant'});
    document.title = `${document.querySelector('.page-hero h1, .hero h1')?.textContent.trim().replace(/\s+/g,' ') || 'Uppsala Hårdrocksarkiv'} – Uppsala Hårdrocksarkiv`;
  }

  document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (!/^https?:/i.test(img.getAttribute('src') || '')) return;
    const wrap = img.closest('.detail-media, .band-card, .person-card-portrait, .release-cover-thumb, .archive-gallery-media');
    if (wrap) wrap.classList.add('external-image-failed');
    img.style.display = 'none';
  }, true);

  window.addEventListener('hashchange', renderRoute);
  $('.nav-toggle').addEventListener('click', e => {
    const nav=$('#site-nav'); nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded',nav.classList.contains('open'));
  });
  if (!location.hash) history.replaceState(null,'','#/');
  if (routePath() === '/kontakt') renderRoute();
  load();
})();
