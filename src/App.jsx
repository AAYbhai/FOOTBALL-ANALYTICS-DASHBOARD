import { useCallback, useEffect, useState } from 'react'
import './App.css'
import MatchCentre from './matchcentre.jsx'
import DreamXI from './DreamXI.jsx'
import clubLegendPortraitManifest from './assets/club-legends/manifest.json'
import { STRIKERS } from './data/strikers.js'
import { ALL_TIME_POSITION_PLAYERS, FEATURED_PLAYER_RESEARCH } from './data/allTimePositionPlayers.js'
import { hasTrophyHistory } from './utils/playerTrophies.js'
import fallbackPlayerPortrait from './assets/player-portrait-fallback.svg'
import homeMessi from './assets/home-legends/messi-world-cup.jpg'
import homeRonaldo from './assets/home-legends/ronaldo-match.jpg'
import homePele from './assets/home-legends/pele-1960.jpg'
import homeMaradona from './assets/home-legends/maradona-1986.jpg'
import homeHenry from './assets/home-legends/henry-world-cup.jpg'
import homeRonaldinho from './assets/home-legends/ronaldinho-free-kick.jpg'
import homeCruyff from './assets/home-legends/cruyff-1974.jpg'

const API_URL = 'http://localhost:5000'

const DEFAULT_LEAGUES = [
  { id: 39, name: 'Premier League', category: 'club' },
  { id: 140, name: 'La Liga', category: 'club' },
  { id: 78, name: 'Bundesliga', category: 'club' },
  { id: 135, name: 'Serie A', category: 'club' },
  { id: 61, name: 'Ligue 1', category: 'club' },
  { id: 2, name: 'UEFA Champions League', category: 'international' },
  { id: 5, name: 'UEFA Nations League', category: 'international' },
  { id: 1, name: 'FIFA World Cup', category: 'international' },
  { id: 4, name: 'UEFA European Championship', category: 'international' },
  { id: 9, name: 'Copa América', category: 'international' },
  { id: 307, name: 'Saudi Pro League', category: 'club' },
  { id: 253, name: 'Major League Soccer', category: 'club' },
]

const CURATED_LEAGUE_IDS = new Set(DEFAULT_LEAGUES.map((league) => String(league.id)))

const BACKGROUND_IMAGES = {
  overview: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Cristiano_RonaldoEn_el_Real_Madrid.JPG?width=2200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Cristiano_Ronaldo_%284199158925%29.jpg?width=2200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Cristiano_Ronaldo_%284199159015%29.jpg?width=2200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Cristiano_Ronaldo_%285098228018%29.jpg?width=2200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Cristiano_Ronaldo%2C_2010.jpg?width=2200',
  ],

  players: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Lionel_Messi.jpg?width=2200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Lionel_Messi_Argentina_v_Spain_19_July_2026-046.jpg?width=2200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Lionel_Messi_Argentina_v_Spain_19_July_2026-076.jpg?width=2200',
  ],

  premierLeague: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Erling_Haaland_2023.jpg?width=2200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Luis_D%C3%ADaz_06042025_%281%29.jpg?width=2200',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=2200&q=90',
  ],

  laLiga: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/LamineYamal_-_FCB_-_Partido_Athletic_Club_vs_FC_Barcelona.jpg?width=2200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Lamine_Yamal_in_2025.jpg?width=2200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Kylian_Mbappe_at_Real_Madrid%27s_game_versus_Juventus_Turin_on_22_October_2025_%282%29.jpeg?width=1600',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2200&q=90',
  ],

  bundesliga: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Erling_Haaland_2023.jpg?width=2200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Michael_Olise_bayern_2025.jpg?width=1600',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Luis_D%C3%ADaz_%28portrait%29.jpg?width=1600',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Joshua_Kimmich_Training_2017-05_FC_Bayern_Muenchen-1.jpg?width=1800',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2200&q=90',
  ],

  serieA: [
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2200&q=90',
  ],

  ligue1: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Ousmane_Dembele_paris_derby.jpg?width=1600',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Ousmane_Dembele_France_v_Spain_7.24.26-129.jpg?width=2200',
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=2200&q=90',
  ],

  football: [
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?auto=format&fit=crop&w=2200&q=90',
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=2200&q=90',
  ],
}

const LEAGUE_BACKGROUND_MAP = {
  '39': BACKGROUND_IMAGES.premierLeague,
  '140': BACKGROUND_IMAGES.laLiga,
  '78': BACKGROUND_IMAGES.bundesliga,
  '135': BACKGROUND_IMAGES.serieA,
  '61': BACKGROUND_IMAGES.ligue1,
}

const FEATURE_TILES = [
  { title: 'Players', description: 'Explore football’s biggest names', icon: '♙', page: 'Players', shape: 'tile-player' },
  { title: 'Greatest Clubs', description: 'Explore football’s iconic clubs', icon: '◉', page: 'Teams', shape: 'tile-teams' },
  { title: 'Build Your Dream11', description: 'Pick your all-time XI', icon: '▦', page: 'Dream XI', shape: 'tile-board' },
  { title: 'Live Matches', description: 'Follow the action live', icon: '◷', page: 'Matches', shape: 'tile-live' },
  { title: 'Competition', description: 'Tables and league races', icon: '♜', page: 'Competition', shape: 'tile-competition' },
]

const FEATURED_PLAYER_EXAMPLES = [
  { name: 'Lionel Messi', country: 'Argentina', role: 'Forward', image: BACKGROUND_IMAGES.players[0], detail: 'Eight-time Ballon d’Or winner and World Cup champion, celebrated for his close control, vision and playmaking.' },
  { name: 'Cristiano Ronaldo', country: 'Portugal', role: 'Forward', image: BACKGROUND_IMAGES.overview[0], detail: 'A record-setting forward known for his movement, finishing and longevity at the top of world football.' },
  { name: 'Kylian Mbappé', country: 'France', role: 'Forward', image: BACKGROUND_IMAGES.laLiga[2], detail: 'A World Cup-winning forward whose pace and direct attacking style have made him one of the game’s defining stars.' },
  { name: 'Erling Haaland', country: 'Norway', role: 'Forward', image: BACKGROUND_IMAGES.premierLeague[0], detail: 'A prolific centre-forward renowned for his power, positioning and clinical finishing.' },
  { name: 'Lamine Yamal', country: 'Spain', role: 'Forward', image: BACKGROUND_IMAGES.laLiga[0], detail: 'A creative young winger known for his close control, left foot and ability to make chances from wide areas.' },
  { name: 'Ousmane Dembélé', country: 'France', role: 'Forward', image: BACKGROUND_IMAGES.ligue1[0], detail: 'An unpredictable, two-footed winger with pace and the ability to beat defenders in one-on-one situations.' },
]
const PROFILE_PLAYER_DATA = [...STRIKERS, ...ALL_TIME_POSITION_PLAYERS]
const FEATURED_PLAYERS = FEATURED_PLAYER_EXAMPLES.map((example) => {
  const savedProfile = PROFILE_PLAYER_DATA.find((player) => player.name === example.name)
  const research = FEATURED_PLAYER_RESEARCH[example.name]
  const profile = { ...(savedProfile || {}), ...example, ...(research || {}), ...(savedProfile || {}), ...(research || {}) }
  return {
    ...profile,
    image: example.image,
    role: example.role,
    detail: savedProfile?.detail || example.detail,
    secondarySources: [...(savedProfile?.secondarySources || []), ...(research?.secondarySources || [])].filter((url, index, all) => all.indexOf(url) === index),
  }
}).concat(STRIKERS.map((player) => ({ ...player, image: null })), ALL_TIME_POSITION_PLAYERS.map((player) => ({ ...player, image: null })))

const FEATURED_TEAMS = [
  ['Manchester United','England',1878,33,'A global club shaped by league-winning eras, academy graduates and memorable European nights.'],
  ['Liverpool','England',1892,40,'Anfield, European success and generations of devoted supporters define this historic club.'],
  ['Arsenal','England',1886,42,'Known for its north London home, elegant attacking sides and an unbeaten league campaign.'],
  ['Chelsea','England',1905,49,'A west London club whose modern history includes domestic titles and major European trophies.'],
  ['Manchester City','England',1880,50,'A Manchester institution that has grown into a dominant force in English and European football.'],
  ['Tottenham Hotspur','England',1882,47,'A north London club with a long tradition of attacking football and a passionate fanbase.'],
  ['Everton','England',1878,45,'One of English football’s founding-era clubs, rooted in the city of Liverpool.'],
  ['Newcastle United','England',1892,34,'The Magpies are central to Tyneside life, with a storied home at St James’ Park.'],
  ['Aston Villa','England',1874,66,'A founding force in English football with a rich history and a famous European triumph.'],
  ['Nottingham Forest','England',1865,65,'A historic club remembered worldwide for winning back-to-back European Cups.'],
  ['West Ham United','England',1895,48,'An east London club known for its academy heritage and claret-and-blue identity.'],
  ['Real Madrid','Spain',1902,541,'One of Europe’s most decorated clubs, with a remarkable record in domestic and continental competition.'],
  ['FC Barcelona','Spain',1899,529,'A Catalan institution famous for its academy, identity and influential possession-based football.'],
  ['Atlético Madrid','Spain',1903,530,'Madrid’s red-and-white side is known for resilience, passionate support and domestic success.'],
  ['Athletic Club','Spain',1898,531,'A historic Basque club with a distinctive local-player tradition and a devoted community.'],
  ['Valencia','Spain',1919,532,'A major Spanish club with a strong regional identity and a proud history of league and European honours.'],
  ['Sevilla','Spain',1890,536,'A storied Andalusian club with a celebrated record in European competition.'],
  ['Bayern Munich','Germany',1900,157,'Germany’s most successful club has dominated the Bundesliga and regularly challenged for Europe’s top honours.'],
  ['Borussia Dortmund','Germany',1909,165,'The Yellow Wall and an energetic football culture make Dortmund one of Europe’s most distinctive clubs.'],
  ['Bayer Leverkusen','Germany',1904,168,'A leading German club known for its modern success and memorable unbeaten league season.'],
  ['VfB Stuttgart','Germany',1893,172,'A historic southern German club with multiple national titles and a loyal regional following.'],
  ['Juventus','Italy',1897,496,'Turin’s black-and-white giants have collected a record number of Italian league titles.'],
  ['AC Milan','Italy',1899,489,'A European powerhouse whose red-and-black identity is tied to generations of celebrated players.'],
  ['Inter Milan','Italy',1908,505,'One of Milan’s great clubs, Inter has won domestic titles and Europe’s biggest prizes.'],
  ['Napoli','Italy',1926,492,'Naples’ beloved club carries the city’s spirit and a legacy of unforgettable championship sides.'],
  ['Roma','Italy',1927,497,'The capital’s Giallorossi are known for their devoted support and deep connection to Rome.'],
  ['Lazio','Italy',1900,487,'One of Rome’s historic clubs, with a proud identity and major domestic honours.'],
  ['Paris Saint-Germain','France',1970,85,'Paris’s leading club has become a major force in French football and European competition.'],
  ['Marseille','France',1899,81,'A historic port-city club with an intense fan culture and a unique French European Cup legacy.'],
  ['Lyon','France',1950,80,'A major French club remembered for a remarkable run of domestic titles and a renowned academy.'],
  ['Monaco','Monaco',1924,91,'Based in the Principality, Monaco has developed generations of talent and won major French honours.'],
  ['Saint-Étienne','France',1919,106,'One of France’s most decorated historic clubs, with generations of passionate green-clad supporters.'],
  ['Ajax','Netherlands',1900,194,'Amsterdam’s celebrated club is renowned for its academy and influence on modern attacking football.'],
  ['PSV Eindhoven','Netherlands',1913,197,'A leading Dutch club with a tradition of league titles and nurturing world-class talent.'],
  ['Feyenoord','Netherlands',1908,209,'Rotterdam’s proud club is built around a fiercely supportive community and major European history.'],
  ['Benfica','Portugal',1904,211,'One of Portugal’s most decorated clubs, famous for its red shirts and enormous supporter base.'],
  ['FC Porto','Portugal',1893,212,'Porto has a rich record of Portuguese titles and memorable European campaigns.'],
  ['Sporting CP','Portugal',1906,228,'A Lisbon institution with a celebrated academy and a long list of domestic honours.'],
  ['Celtic','Scotland',1887,247,'A Glasgow giant with a storied European triumph and one of football’s most passionate support bases.'],
  ['Rangers','Scotland',1872,257,'One of Scotland’s most successful clubs, with a historic home at Ibrox and a vast following.'],
  ['Boca Juniors','Argentina',1905,451,'Buenos Aires’ blue-and-gold icons are known for La Bombonera and an intense football culture.'],
  ['River Plate','Argentina',1901,435,'A historic Buenos Aires club with a celebrated academy and a record of domestic and continental success.'],
  ['Flamengo','Brazil',1895,127,'One of Brazil’s most supported clubs, representing Rio with a rich history of national and continental success.'],
  ['Santos','Brazil',1912,128,'A historic coastal club whose academy and legendary sides have shaped Brazilian football.'],
  ['Palmeiras','Brazil',1914,121,'A São Paulo giant with a long list of national titles and a passionate supporter base.'],
  ['São Paulo','Brazil',1930,126,'A leading Brazilian club with historic continental success and a famous Morumbi home.'],
  ['Galatasaray','Türkiye',1905,645,'Istanbul’s celebrated club has won major domestic titles and made history in European competition.'],
  ['Fenerbahçe','Türkiye',1907,611,'A historic Istanbul club with a huge following and a central place in Turkish football.'],
  ['Al Hilal','Saudi Arabia',1957,2932,'One of Asia’s most decorated clubs, with a record of domestic titles and continental success.'],
  ['Al Nassr','Saudi Arabia',1955,2939,'A Riyadh club with a long Saudi football history and a passionate national following.'],
].map(([name, country, founded, id, history]) => ({
  name, country, founded, history,
  logo: `https://media.api-sports.io/football/teams/${id}.png`,
}))

const CLUB_RECORDS = {
  'Manchester United': ['Wayne Rooney', 'Ryan Giggs'], Liverpool: ['Ian Rush', 'Ian Callaghan'], Arsenal: ['Thierry Henry', 'David O’Leary'], Chelsea: ['Frank Lampard', 'Ron Harris'], 'Manchester City': ['Sergio Agüero', 'Alan Oakes'], 'Tottenham Hotspur': ['Jimmy Greaves', 'Steve Perryman'], Everton: ['Dixie Dean', 'Neville Southall'], 'Newcastle United': ['Alan Shearer', 'Jimmy Lawrence'], 'Aston Villa': ['Billy Walker', 'Charlie Aitken'], 'Nottingham Forest': ['Grenville Morris', 'Bob McKinlay'], 'West Ham United': ['Vic Watson', 'Billy Bonds'],
  'Real Madrid': ['Cristiano Ronaldo', 'Raúl'], 'FC Barcelona': ['Lionel Messi', 'Xavi'], 'Atlético Madrid': ['Antoine Griezmann', 'Koke'], 'Athletic Club': ['Telmo Zarra', 'José Ángel Iribar'], Valencia: ['Mundo', 'Fernando'], Sevilla: ['Guillermo Campanal', 'Jesús Navas'],
  'Bayern Munich': ['Gerd Müller', 'Sepp Maier'], 'Borussia Dortmund': ['Alfred Preißler', 'Michael Zorc'], 'Bayer Leverkusen': ['Ulf Kirsten', 'Rolfes'], 'VfB Stuttgart': ['Karl Allgöwer', 'Karl Allgöwer'],
  Juventus: ['Alessandro Del Piero', 'Alessandro Del Piero'], 'AC Milan': ['Gunnar Nordahl', 'Paolo Maldini'], 'Inter Milan': ['Giuseppe Meazza', 'Javier Zanetti'], Napoli: ['Dries Mertens', 'Marek Hamšík'], Roma: ['Francesco Totti', 'Francesco Totti'], Lazio: ['Ciro Immobile', 'Stefan Radu'],
  'Paris Saint-Germain': ['Kylian Mbappé', 'Marquinhos'], Marseille: ['Gunnar Andersson', 'Steve Mandanda'], Lyon: ['Fleury Di Nallo', 'Serge Chiesa'], Monaco: ['Delio Onnis', 'Jean-Luc Ettori'], 'Saint-Étienne': ['Hervé Revelli', 'Loïc Perrin'],
  Ajax: ['Piet van Reenen', 'Sjaak Swart'], 'PSV Eindhoven': ['Willy van der Kuijlen', 'Willy van der Kuijlen'], Feyenoord: ['Cor van der Gijp', 'Coen Moulijn'], Benfica: ['Eusébio', 'Nené'], 'FC Porto': ['Fernando Gomes', 'João Pinto'], 'Sporting CP': ['Fernando Peyroteo', 'Hilário'], Celtic: ['Jimmy McGrory', 'Billy McNeill'], Rangers: ['Ally McCoist', 'John Greig'],
  'Boca Juniors': ['Martín Palermo', 'Roberto Mouzo'], 'River Plate': ['Ángel Labruna', 'Reinaldo Merlo'], Flamengo: ['Zico', 'Júnior'], Santos: ['Pelé', 'Lima'], Palmeiras: ['Heitor', 'Ademir da Guia'], 'São Paulo': ['Serginho Chulapa', 'Rogério Ceni'], Galatasaray: ['Hakan Şükür', 'Bülent Korkmaz'], 'Fenerbahçe': ['Zeki Rıza Sporel', 'Şeref Has'], 'Al Hilal': ['Salem Al-Dawsari', 'Mohammed Al-Shalhoub'], 'Al Nassr': ['Majed Abdullah', 'Majed Abdullah'],
}

// Local, curated record snapshots. Figures are deliberately scoped to the
// competition scope stated by each source; this data does not call any API.
const CLUB_PLAYER_ARCHIVE = {
  'Wayne Rooney|Manchester United': { stats: [['Goals', '253', 'All competitions']], bio: 'Rooney arrived at Old Trafford as a teenager and left as the club’s leading scorer. His United story was written in volleys, fierce runs and moments that seemed to arrive exactly when the crowd needed them.', honors: 'Five Premier League titles · UEFA Champions League · FA Cup · UEFA Europa League', source: ['Manchester United', 'https://www.manutd.com/en/news/steve-coppell-holds-man-utd-record-for-consecutive-league-appearances'] },
  'Ryan Giggs|Manchester United': { stats: [['Appearances', '963', 'All competitions']], bio: 'Giggs grew from a daring young winger into the quiet constant of a changing United. Across more than two decades, his touchline runs became part of the club’s landscape and his name came to stand for an entire era.', honors: '13 Premier League titles · Two UEFA Champions League titles · Four FA Cups', source: ['Manchester United', 'https://www.manutd.com/en/news/steve-coppell-holds-man-utd-record-for-consecutive-league-appearances'] },
  'Ian Rush|Liverpool': { stats: [['Goals', '346', '660 appearances · all competitions'], ['Appearances', '660', 'All competitions']], bio: 'Rush seemed to know where the ball would fall before anyone else did. Through two spells at Anfield, his sharp movement and calm finishing gave Liverpool’s great teams the final touch their football demanded.', honors: 'Five league titles · Three FA Cups · Two European Cups', source: ['Liverpool FC', 'https://www.liverpoolfc.com/info/ian-rush'] },
  'Ian Callaghan|Liverpool': { stats: [['Appearances', '857', 'All competitions']], bio: 'A Liverpool career that began in 1959 and continued through the club’s transformation into a domestic and European force.', honors: 'Five league titles · Two FA Cups · Two European Cups', source: ['Liverpool FC', 'https://www.liverpoolfc.com/info/ian-callaghan'] },
  'Thierry Henry|Arsenal': { stats: [['Goals', '228', 'All competitions']], bio: 'Henry turned the left channel into his own stage: one glide, one pause, then a finish that seemed to bend the match to his will. He became the face of Arsenal’s unbeaten 2003–04 side and the standard every later forward was measured against.', honors: 'Two Premier League titles · Two FA Cups · Invincibles season (2003–04)', source: ['Arsenal', 'https://www.arsenal.com/news/features/20141216/thierry-henry?page=1'] },
  'David O’Leary|Arsenal': { stats: [['Appearances', '722', 'All competitions']], bio: 'A composed central defender whose long Arsenal career spanned the 1970s, 1980s and early 1990s.', honors: 'Two league titles · Two FA Cups · European Cup Winners’ Cup', source: ['Arsenal', 'https://www.arsenal.com/news/news-archive/gallery-david-o-leary'] },
  'Frank Lampard|Chelsea': { stats: [['Appearances', '648', 'All competitions'], ['Goals', '211', 'All competitions']], bio: 'Lampard arrived as a midfielder and kept finding the one place defenders could not follow: the space at the edge of the box, then the run into it. Season after season, those late arrivals became goals, and those goals became Chelsea history.', honors: 'Three Premier League titles · UEFA Champions League · Four FA Cups', source: ['Chelsea FC', 'https://www.chelseafc.com/en/news/article/everything-you-need-to-know-about-frank-lampard'] },
  'Sergio Agüero|Manchester City': { stats: [['Goals', '260', '390 appearances · all competitions'], ['Appearances', '390', 'All competitions']], bio: 'Agüero’s City story has a final line football will never let fade: one touch, one finish, and the title won in stoppage time. Before that instant—and long after it in memory—his movement and goals helped change what the club believed it could become.', honors: 'Five Premier League titles · FA Cup · Six League Cups', source: ['Manchester City annual report', 'https://www.mancity.com/meta/media/f23hdo4c/2021-mancity-annual-report.pdf'] },
  'Alan Oakes|Manchester City': { stats: [['Appearances', '680', 'All competitions'], ['Goals', '34', 'All competitions']], bio: 'A dependable midfielder who served City across the 1950s, 1960s and 1970s and became a central figure in the club’s record books.', honors: 'League title · FA Cup · European Cup Winners’ Cup · Two League Cups', source: ['Manchester City', 'https://beta.mancity.com/news/club/man-city-dna-96-alan-oakes-63724805'] },
  'Jimmy Greaves|Tottenham Hotspur': { stats: [['Goals', '266', '379 appearances · all competitions'], ['Appearances', '379', 'All competitions']], bio: 'A prolific, instinctive finisher who became Tottenham’s leading scorer during the 1960s.', honors: 'FA Cup · European Cup Winners’ Cup · FA Charity Shield', source: ['Tottenham Hotspur', 'https://www.tottenhamhotspur.com/the-club/history/hall-of-fame/?overlayOpen=1090856'] },
  'Steve Perryman|Tottenham Hotspur': { stats: [['Appearances', '854', 'All competitions']], bio: 'A versatile and long-serving captain whose Tottenham career covered more than 17 years.', honors: 'Two FA Cups · UEFA Cup · Two League Cups', source: ['Tottenham Hotspur', 'https://www.tottenhamhotspur.com/the-club/history/legends/steve-perryman'] },
  'Cristiano Ronaldo|Real Madrid': { stats: [['Goals', '451', '438 official appearances']], bio: 'At Madrid, Ronaldo turned ambition into ritual: the sprint, the leap, the shot, repeated until the extraordinary became expected. Night after night in Europe, he carried the white shirt toward the decisive moment and left as the club’s record scorer.', honors: 'Four Champions League titles with Real Madrid · Two La Liga titles · Two Copa del Rey', source: ['Real Madrid', 'https://www.realmadrid.com/es-ES/el-club/historia/leyendas-futbol/cristiano-ronaldo-dos-santos-aveiro'] },
  'Raúl|Real Madrid': { stats: [['Appearances', '741', 'All competitions'], ['Goals', '323', 'All competitions']], bio: 'Raúl grew up inside the Bernabéu and became one of its most trusted voices. His sharp finishes and captain’s armband carried Madrid through a changing generation, making the academy graduate feel inseparable from the club’s identity.', honors: 'Six La Liga titles · Three Champions League titles · Four Spanish Super Cups', source: ['Real Madrid', 'https://www.realmadrid.com/en-US/news/football/first-team/latest-news/historic-goals-raul'] },
  'Lionel Messi|FC Barcelona': { stats: [['Appearances', '778', 'All competitions'], ['Goals', '672', 'All competitions']], bio: 'Messi’s Barcelona years unfolded like a conversation between player and ball—quiet touches, impossible angles, and a finish before the defence understood the question. From La Masia prospect to the club’s record scorer, he became the living thread through its greatest modern team.', honors: '10 La Liga titles · Four Champions League titles · Seven Copa del Rey', source: ['FC Barcelona', 'https://www.fcbarcelona.com/en/news/2070529/leo'] },
  'Xavi|FC Barcelona': { stats: [['Appearances', '767', 'All competitions']], bio: 'Xavi made the pass before the opening appeared. At Barcelona, his calm rhythm turned possession into a language shared by the whole team, and the academy midfielder became the compass of a generation that conquered Europe.', honors: 'Eight La Liga titles · Four Champions League titles · Three Copa del Rey', source: ['FC Barcelona', 'https://www.fcbarcelona.com/en/football/first-team/actualites/2328629/xavi-en-chiffres/featured'] },
  'Telmo Zarra|Athletic Club': { stats: [['Goals', '335', '354 matches · historic club record']], bio: 'Athletic’s legendary centre-forward and six-time Pichichi winner, celebrated for his scoring record and aerial threat.', honors: 'One league title · Five Copa del Rey titles · Six Pichichi awards', source: ['Athletic Club', 'https://www.athletic-club.eus/en/news/2021/01/20/telmo-zarra-100-years-a-legend/'] },
  'José Ángel Iribar|Athletic Club': { stats: [['Appearances', '614', 'Official matches']], bio: 'The iconic goalkeeper and long-time captain became a symbol of Athletic Club and its supporters.', honors: 'One league title · Two Copa del Rey titles', source: ['Athletic Club', 'https://www.athletic-club.eus/en/players/jose-angel-iribar-kortajarena/'] },
  'Gerd Müller|Bayern Munich': { stats: [['Goals', '566', '607 competitive appearances'], ['Appearances', '607', 'Competitive matches']], bio: 'Bayern’s legendary centre-forward, famous for quick movement in the box and a remarkable scoring rate.', honors: 'Four Bundesliga titles · Three European Cups · Four DFB Cups', source: ['FC Bayern', 'https://fcbayern.com/en/club/hall-of-fame/gerd-muller'] },
  'Michael Zorc|Borussia Dortmund': { stats: [['Appearances', '572', 'All competitions'], ['Goals', '159', 'All competitions']], bio: 'A long-serving captain and midfielder who spent his entire playing career at Dortmund before moving into club leadership.', honors: 'Two Bundesliga titles · DFB-Pokal · UEFA Champions League · Intercontinental Cup', source: ['Borussia Dortmund', 'https://www.bvb.de/de/en/news/news-overview/news.html/2022/8/25/Michael-Zorc.html'] },
  'Ulf Kirsten|Bayer Leverkusen': { stats: [['Goals', '238', '446 appearances · all competitions']], bio: 'Leverkusen’s celebrated striker was known for strength, persistence and three Bundesliga top-scorer awards.', honors: 'Three-time Bundesliga top scorer · DFB-Pokal', source: ['Bayer 04 Leverkusen', 'https://www.bayer04.de/en-us/news/bayer04/ulf-kirsten-king-poacher-grouch-and-grafter'] },
  'Alessandro Del Piero|Juventus': { stats: [['Appearances', '705', 'All competitions'], ['Goals', '290', 'All competitions']], bio: 'Del Piero’s story at Juventus was one of elegance held steady through triumph and upheaval. His curling free kicks and instinctive finishes gave the club its record scorer, but his loyalty through its hardest chapter made him captain in the deeper sense too.', honors: 'Six Serie A titles · Coppa Italia · UEFA Champions League · Intercontinental Cup', source: ['Juventus Hall of Fame', 'https://halloffame.juventus.com/en/hall-of-fame/alessandro-del-piero'] },
  'Paolo Maldini|AC Milan': { stats: [['Appearances', '647', 'All competitions']], bio: 'Maldini spent a lifetime in Milan colours, moving from gifted young defender to captain and standard-bearer. His game was built on timing and composure; his legacy is the rare kind that makes loyalty look like an art.', honors: 'Seven Serie A titles · Five European Cups / Champions League titles · Coppa Italia', source: ['AC Milan', 'https://www.acmilan.com/en/club/legends/players/maldini'] },
  'Gunnar Nordahl|AC Milan': { stats: [['Goals', '221', '268 matches · club record']], bio: 'A powerful Swedish striker who became Milan’s most prolific scorer and one of Serie A’s great forwards.', honors: 'Two Serie A titles · Two Capocannoniere awards', source: ['AC Milan', 'https://www.acmilan.com/en/club/legends/players/nordahl'] },
  'Giuseppe Meazza|Inter Milan': { stats: [['Goals', '284', '408 appearances · club record']], bio: 'Inter’s historic scoring icon and a defining Italian forward of the pre-war era.', honors: 'Two league titles · Coppa Italia', source: ['Inter Milan', 'https://www.inter.it/en/club/hall-of-fame/giuseppe-meazza'] },
  'Javier Zanetti|Inter Milan': { stats: [['Appearances', '858', 'All competitions'], ['Goals', '21', 'All competitions']], bio: 'Zanetti seemed to give Inter the same gift every week: another run, another tackle, another promise kept. From young arrival to captain, he became the club’s enduring figure—and lifted the Champions League as the leader of its historic treble side.', honors: 'Five Serie A titles · UEFA Champions League · FIFA Club World Cup · Four Coppa Italia', source: ['Inter Milan', 'https://www.inter.it/en/club/hall-of-fame/javier-zanetti'] },
  'Willy van der Kuijlen|PSV Eindhoven': { stats: [['Goals', '308', 'Eredivisie goals']], bio: 'Known as Mister PSV, he spent 18 seasons with the club and remains its leading scorer.', honors: 'Three league titles · Two KNVB Cups · UEFA Cup', source: ['PSV Eindhoven', 'https://www.psv.nl/en/club/history/mister-psv'] },
  'Nené|Benfica': { stats: [['Appearances', '575', 'All competitions'], ['Goals', '359', 'All competitions']], bio: 'A Benfica forward whose long career made him the club’s most-used player in the historical record.', honors: 'Ten Portuguese league titles · European Cup', source: ['UEFA', 'https://pt.uefa.com/news-media/news/0238-0f8e4f24d096-5316b184fa73-1000--nene-50-anos-de-ligacao-ao-benfica/'] },
  'Fernando Peyroteo|Sporting CP': { stats: [['Goals', '540', '332 official matches']], bio: 'A prolific Sporting centre-forward whose extraordinary scoring record remains one of European football’s most remarkable.', honors: 'Six league titles · Four Portuguese Cups', source: ['Sporting CP', 'https://www.sporting.pt/pt/peyroteo'] },
  'Jimmy McGrory|Celtic': { stats: [['Goals', '468', 'Celtic official club figure']], bio: 'Celtic’s legendary centre-forward and record scorer, renowned for his heading and sharp penalty-box instincts.', honors: 'Two league titles · Three Scottish Cups', source: ['Celtic FC', 'https://www.celticfc.com/players/legends/jimmy-mcgrory'] },
  'Billy McNeill|Celtic': { stats: [['Appearances', '790', 'All competitions']], bio: 'The captain of the Lisbon Lions and a central figure in Celtic’s most celebrated European triumph.', honors: 'Nine league titles · European Cup · Seven Scottish Cups', source: ['Celtic FC', 'https://www.celticfc.com/players/legends/billy-mcneill/'] },
  'Ally McCoist|Rangers': { stats: [['Goals', '355', '581 games · all competitions']], bio: 'Rangers’ leading scorer across two spells, famed for his finishing and success in Old Firm derbies.', honors: 'Ten league titles · Nine League Cups · Scottish Cup', source: ['Rangers FC Museum', 'https://www.rangers.co.uk/article/play-rangers-museum-lotto/2FjEPRWk02ea37JWHkbdaz'] },
  'Rogério Ceni|São Paulo': { stats: [['Appearances', '1,237', 'All competitions']], bio: 'A long-serving goalkeeper and captain who was also renowned for scoring from free kicks and penalties.', honors: 'Three Brazilian league titles · Two Copa Libertadores · FIFA Club World Cup', source: ['São Paulo FC', 'https://www.saopaulofc.net/historico-recordes-individuais-2/'] },
  'Serginho Chulapa|São Paulo': { stats: [['Goals', '242', 'All competitions']], bio: 'A powerful striker and São Paulo’s record scorer, later returning to the club in coaching roles.', honors: 'Brazilian league title · São Paulo state titles', source: ['São Paulo FC', 'https://www.saopaulofc.net/a-estreia-e-a-historia-de-serginho-chulapa-no-tricolor/'] },
}

const CLUB_ERA_NOTES = {
  'Manchester United': 'The Busby Babes era, the club’s recovery after Munich, the 1968 European Cup and the 1999 treble are central chapters in United’s story.',
  Liverpool: 'The Shankly and Paisley years built Liverpool into a domestic and European force; the 2005 Istanbul final remains one of football’s defining comebacks.',
  Arsenal: 'Herbert Chapman’s innovations, the 1930s title sides, the 1989 Anfield finish and the 2003–04 unbeaten league season mark landmark eras.',
  Chelsea: 'Chelsea’s modern rise brought its first league title in 50 years in 2005, followed by the 2012 and 2021 Champions League triumphs.',
  'Manchester City': 'From the 1968 league-winning side to the 2023 treble, City’s history spans generations of change and a landmark European breakthrough.',
  'Tottenham Hotspur': 'Spurs won the league and FA Cup double in 1960–61, then became the first British club to win a European trophy in 1963.',
  'Real Madrid': 'The five consecutive European Cups from 1956 to 1960 and the modern Champions League eras form the club’s defining European legacy.',
  'FC Barcelona': 'Johan Cruyff’s Dream Team, the 1992 European Cup and Pep Guardiola’s 2008–12 side shaped Barcelona’s modern football identity.',
  'Bayern Munich': 'Bayern’s European Cup three-peat from 1974 to 1976 and the 2020 continental treble stand among its defining periods.',
  Juventus: 'The 1985 and 1996 European Cup wins bookend decades of Italian dominance, while the 2010s brought a run of consecutive league titles.',
  'AC Milan': 'The Sacchi and Capello teams of the late 1980s and early 1990s, followed by the 2003 and 2007 European titles, define Milan’s European story.',
  'Inter Milan': 'The Grande Inter side of the 1960s and José Mourinho’s 2010 treble are landmark chapters in the Nerazzurri’s history.',
  Ajax: 'Rinus Michels’ Total Football era and three successive European Cups from 1971 to 1973 made Ajax a model for generations of clubs.',
  Celtic: 'The Lisbon Lions won the 1967 European Cup with a team born within a short distance of Celtic Park, a lasting part of the club’s identity.',
  'Boca Juniors': 'The 2000–03 teams and the 2000 Intercontinental Cup win over Real Madrid are celebrated chapters in Boca’s international history.',
  'River Plate': 'River’s La Máquina side of the 1940s and the 2018 Copa Libertadores final win over Boca are defining moments for Los Millonarios.',
  Flamengo: 'The Zico-led 1981 side won the Copa Libertadores and Intercontinental Cup; the 2019 continental title began another celebrated era.',
  'Al Hilal': 'Al Hilal’s record domestic success and repeated Asian titles have made the Riyadh club one of the most decorated sides in the continent.',
  'Al Nassr': 'Al Nassr’s domestic title eras and its role in Saudi football’s growth have made it one of the country’s best-supported clubs.',
  Everton: 'Everton’s nine league championships include the dominant 1984–85 side, which paired the league title with the European Cup Winners’ Cup.',
  'Newcastle United': 'The early 1900s brought four league titles; the Kevin Keegan sides of the 1990s revived a famous attacking tradition.',
  'Aston Villa': 'Villa’s 1980–81 league title was followed by the 1982 European Cup, still the club’s landmark continental moment.',
  'Nottingham Forest': 'Brian Clough’s Forest rose from the Second Division to win the European Cup in 1979 and retain it in 1980.',
  'West Ham United': 'The club’s 1964 FA Cup, 1965 European Cup Winners’ Cup and 1966 World Cup connections are defining parts of its east London heritage.',
  'Atlético Madrid': 'Atlético’s 1974 European Cup final run, 1996 league-and-cup double and 2010s title-winning teams mark distinct eras.',
  'Athletic Club': 'Athletic’s early Copa del Rey dominance and the 1980s league-winning teams sit alongside its distinctive Basque player tradition.',
  Valencia: 'Valencia’s 2000 and 2001 Champions League finals were followed by the 2002 and 2004 league titles and a UEFA Cup win.',
  Sevilla: 'Sevilla’s modern European era began with the 2006 UEFA Cup and grew into a record run of Europa League successes.',
  'Borussia Dortmund': 'The 1997 Champions League win and Jürgen Klopp’s 2011–12 domestic double are standout periods at the Westfalenstadion.',
  'Bayer Leverkusen': 'Leverkusen’s 2002 Champions League final run and 2023–24 unbeaten domestic double are landmark seasons in club history.',
  'VfB Stuttgart': 'The 1983–84, 1991–92 and 2006–07 league-winning teams mark three different generations of Stuttgart success.',
  Napoli: 'Napoli’s 1987 first Scudetto and 1990 title, led by Diego Maradona, remain iconic moments in the city’s football story.',
  Roma: 'Roma’s 1983 league title and the 2001 Scudetto-winning side are central to the club’s history in the capital.',
  Lazio: 'Lazio’s 1974 first league title and Sven-Göran Eriksson’s 1999–2000 double-winning team are landmark eras.',
  Marseille: 'The 1993 European Cup win made Marseille the first French club to lift the trophy; the 2010 league title ended a long wait.',
  Lyon: 'Lyon’s seven consecutive league titles from 2002 to 2008 form one of the most sustained runs in modern French football.',
  Monaco: 'Monaco’s 2003–04 Champions League final run and its 2016–17 title-winning team are celebrated modern chapters.',
  'Saint-Étienne': 'The 1970s green-and-white side won four league titles and reached the 1976 European Cup final, inspiring a generation of supporters.',
  'PSV Eindhoven': 'PSV’s 1988 European Cup win and the 2004–05 Champions League semi-final run are landmark European campaigns.',
  Feyenoord: 'Feyenoord became the first Dutch club to win the European Cup in 1970 and later lifted the UEFA Cup in 2002.',
  Benfica: 'Eusébio’s Benfica won consecutive European Cups in 1961 and 1962, creating a golden era in Lisbon.',
  'FC Porto': 'Porto’s 1987 European Cup and José Mourinho’s 2004 Champions League victory are defining continental moments.',
  'Sporting CP': 'Sporting’s 1964 Cup Winners’ Cup triumph remains a landmark in the Lisbon club’s European history.',
  Rangers: 'Rangers’ 1972 European Cup Winners’ Cup victory and the 1999–2000 domestic treble are celebrated milestones.',
  Santos: 'The Pelé-era sides won consecutive Intercontinental Cups in 1962 and 1963 and made Santos a global football name.',
  Palmeiras: 'Palmeiras’ 1999 Copa Libertadores and the back-to-back continental titles in 2020 and 2021 highlight its modern history.',
  'São Paulo': 'São Paulo won the Intercontinental Cup in 1992 and 1993, then completed a third world title in 2005.',
  Galatasaray: 'The 2000 UEFA Cup and UEFA Super Cup made Galatasaray the first Turkish club to win a major European trophy.',
  'Fenerbahçe': 'Fenerbahçe’s 2007–08 Champions League quarter-final run stands among the club’s strongest European campaigns.',
}

const CLUB_HONOURS = {
  'Manchester United': 'English league titles · FA Cups · European Cup / UEFA Champions League', Liverpool: 'English league titles · FA Cups · European Cup / UEFA Champions League', Arsenal: 'English league titles · FA Cups · European Cup Winners’ Cup', Chelsea: 'English league titles · FA Cups · UEFA Champions League', 'Manchester City': 'English league titles · FA Cups · UEFA Champions League', 'Tottenham Hotspur': 'English league titles · FA Cups · UEFA Cup / Europa League', Everton: 'English league titles · FA Cups · European Cup Winners’ Cup', 'Newcastle United': 'English league titles · FA Cups · Inter-Cities Fairs Cup', 'Aston Villa': 'English league titles · FA Cups · European Cup', 'Nottingham Forest': 'English league titles · FA Cups · European Cup',
  'Real Madrid': 'Spanish league titles · Copa del Rey · European Cup / UEFA Champions League', 'FC Barcelona': 'Spanish league titles · Copa del Rey · European Cup / UEFA Champions League', 'Atlético Madrid': 'Spanish league titles · Copa del Rey · UEFA Europa League', 'Bayern Munich': 'Bundesliga titles · DFB-Pokal · European Cup / UEFA Champions League', Juventus: 'Serie A titles · Coppa Italia · European Cup / UEFA Champions League', 'AC Milan': 'Serie A titles · Coppa Italia · European Cup / UEFA Champions League', 'Inter Milan': 'Serie A titles · Coppa Italia · European Cup / UEFA Champions League', 'Paris Saint-Germain': 'French league titles · Coupe de France · UEFA Cup Winners’ Cup', Ajax: 'Eredivisie titles · KNVB Cup · European Cup / UEFA Champions League', Benfica: 'Portuguese league titles · Taça de Portugal · European Cup', 'FC Porto': 'Portuguese league titles · Taça de Portugal · European Cup / UEFA Champions League', Celtic: 'Scottish league titles · Scottish Cup · European Cup', Rangers: 'Scottish league titles · Scottish Cup · European Cup Winners’ Cup', 'Boca Juniors': 'Argentine league titles · Copa Libertadores · Intercontinental Cup', 'River Plate': 'Argentine league titles · Copa Libertadores · Intercontinental Cup', Flamengo: 'Brazilian league titles · Copa do Brasil · Copa Libertadores', 'Al Hilal': 'Saudi league titles · King’s Cup · AFC Champions League', 'Al Nassr': 'Saudi league titles · King’s Cup · Asian Cup Winners’ Cup',
  'West Ham United': 'English league history · FA Cup · UEFA Cup Winners’ Cup · UEFA Conference League',
  'Athletic Club': 'Spanish league titles · Copa del Rey · Supercopa de España', Valencia: 'Spanish league titles · Copa del Rey · UEFA Cup / UEFA Europa League', Sevilla: 'Spanish league titles · Copa del Rey · UEFA Cup / UEFA Europa League',
  'Borussia Dortmund': 'Bundesliga titles · DFB-Pokal · European Cup / UEFA Champions League', 'Bayer Leverkusen': 'Bundesliga · DFB-Pokal · UEFA Cup / UEFA Europa League', 'VfB Stuttgart': 'Bundesliga titles · DFB-Pokal',
  Napoli: 'Serie A titles · Coppa Italia · UEFA Cup', Roma: 'Serie A title · Coppa Italia · UEFA Conference League', Lazio: 'Serie A titles · Coppa Italia · UEFA Cup Winners’ Cup',
  Marseille: 'French league titles · Coupe de France · UEFA Champions League', Lyon: 'French league titles · Coupe de France', Monaco: 'French league titles · Coupe de France', 'Saint-Étienne': 'French league titles · Coupe de France',
  'PSV Eindhoven': 'Eredivisie titles · KNVB Cup · European Cup / UEFA Champions League', Feyenoord: 'Eredivisie titles · KNVB Cup · European Cup / UEFA Champions League', 'Sporting CP': 'Portuguese league titles · Taça de Portugal · UEFA Cup Winners’ Cup',
  Santos: 'Brazilian league titles · Copa do Brasil · Copa Libertadores', Palmeiras: 'Brazilian league titles · Copa do Brasil · Copa Libertadores', 'São Paulo': 'Brazilian league titles · Copa do Brasil · Copa Libertadores',
  Galatasaray: 'Turkish league titles · Turkish Cup · UEFA Cup / UEFA Europa League', 'Fenerbahçe': 'Turkish league titles · Turkish Cup',
}

const clubLegendPortraitAssets = import.meta.glob('./assets/club-legends/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const CLUB_RECORD_PHOTOS = Object.fromEntries(Object.entries(clubLegendPortraitManifest)
  .map(([name, entry]) => {
    const file = typeof entry === 'string' ? entry : entry.file
    return [name, clubLegendPortraitAssets[`./assets/club-legends/${file.slice(2)}`]]
  })
  .filter(([, image]) => image))
const playerNameKey = (name = '') => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const NORMALIZED_CLUB_RECORD_PHOTOS = Object.fromEntries(Object.entries(CLUB_RECORD_PHOTOS).map(([name, image]) => [playerNameKey(name), image]))

const groupPlayerTrophies = (trophies = []) => trophies.reduce((groups, trophy) => {
  const category = trophy.category || 'Other major trophies'
  groups[category] ||= []
  groups[category].push(trophy)
  return groups
}, {})

const HOME_LEGEND_FRAMES = [
  { legend: 'Lionel Messi', image: homeMessi, quote: 'Football is a sport that gives you pleasure. You have to try to enjoy it at all times.', sourceUrl: 'https://www.uefa.com/uefachampionsleague/news/01d9-0e7224982224-307b7eb19d62-1000--messi-sets-sights-on-rome/', position: 'center 75%' },
  { legend: 'Cristiano Ronaldo', image: homeRonaldo, quote: 'To be captain of my country was a dream from the start.', sourceUrl: 'https://www.uefa.com/uefaeuro/history/news/0254-0d7e09823c4c-51e5fb13da72-1000--cristiano-ronaldo-answers-your-questions/', position: 'center 35%' },
  { legend: 'Pelé', image: homePele, quote: 'Always think you can learn, that you can get better.', sourceUrl: 'https://www.fourfourtwo.com/features/pele-one-one', position: 'center 35%' },
  { legend: 'Diego Maradona', image: homeMaradona, quote: 'That goal would not have stood if technology had been around.', sourceUrl: 'https://inside.fifa.com/en/news/en/news/maradona-var-would-have-disallowed-my-goal-against-england-2901486', position: 'center 45%' },
  { legend: 'Thierry Henry', image: homeHenry, quote: 'Competition is above all for me. That is what drives me.', sourceUrl: 'https://www.uefa.com/uefachampionsleague/news/025e-0fa273225879-e78d62e57fa1-1000--thierry-henry-on-arsenal-barcelona-and-his-dream-team-mate/', position: 'center 45%' },
  { legend: 'Ronaldinho', image: homeRonaldinho, quote: 'Football is a great love because I was born into a family of players.', sourceUrl: 'https://www.uefa.com/uefachampionsleague/news/01e3-0ea1773c0f3f-779742942597-1000--ronaldinho-plots-rossoneri-recovery/', position: 'center 40%' },
  { legend: 'Johan Cruyff', image: homeCruyff, quote: 'There is only one ball, so you need to have it.', sourceUrl: 'https://www.uefa.com/uefachampionsleague/news/0231-0e94ebe5ab9f-dd3d40b55d6c-1000--in-profile-johan-cruyff/', position: 'center 38%' },
  { legend: 'Lionel Messi', image: homeMessi, quote: 'Football is a sport that gives you pleasure. You have to try to enjoy it at all times.', sourceUrl: 'https://www.uefa.com/uefachampionsleague/news/01d9-0e7224982224-307b7eb19d62-1000--messi-sets-sights-on-rome/', position: 'right 75%' },
]

function formatDate(value) {
  if (!value) return 'Date unavailable'

  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function displayNumber(value) {
  return value === null || value === undefined || value === ''
    ? '—'
    : value
}

async function apiGet(path, signal) {
  const response = await fetch(`${API_URL}${path}`, { signal })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Backend request failed (${response.status})`)
  }

  return data
}

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [competitions, setCompetitions] = useState(DEFAULT_LEAGUES)
  const [activeLeague, setActiveLeague] = useState('all')
  const [backgroundIndex, setBackgroundIndex] = useState(0)
  const [standings, setStandings] = useState([])
  const [standingsInfo, setStandingsInfo] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [liveMatches, setLiveMatches] = useState([])
  const [matchToOpen, setMatchToOpen] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)

  const [footballLoading, setFootballLoading] = useState(false)
  const [footballError, setFootballError] = useState('')
  const [competitionError, setCompetitionError] = useState('')

  const [footballSource, setFootballSource] = useState('loading')

  const selectedLeague = competitions.find(
    (league) => String(league.id) === activeLeague,
  )

  const backgroundPool =
    activePage === 'Overview'
      ? BACKGROUND_IMAGES.overview
      : activePage === 'Players'
        ? BACKGROUND_IMAGES.players
      : activePage === 'Teams'
          ? LEAGUE_BACKGROUND_MAP[activeLeague] || BACKGROUND_IMAGES.football
          : BACKGROUND_IMAGES.football

  const backgroundImage =
    backgroundPool[backgroundIndex % backgroundPool.length]

  useEffect(() => {
    setBackgroundIndex((current) => current + 1)
  }, [activePage, activeLeague])

  const loadCompetitions = useCallback(async (signal) => {
    try {
      const data = await apiGet('/api/competitions', signal)

      if (Array.isArray(data.results) && data.results.length) {
        const returnedById = new Map(
          data.results
            .filter((league) => CURATED_LEAGUE_IDS.has(String(league.id)))
            .map((league) => [String(league.id), league]),
        )

        setCompetitions(
          DEFAULT_LEAGUES.map((league) => ({
            ...league,
            ...returnedById.get(String(league.id)),
            id: league.id,
          })),
        )
        setCompetitionError('')
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setCompetitionError(error.message)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadCompetitions(controller.signal)

    return () => controller.abort()
  }, [loadCompetitions])

  useEffect(() => {
    const controller = new AbortController()

    async function loadFootballData() {
      setFootballLoading(true)
      setFootballError('')
      setFootballSource('loading')

      const jobs = await Promise.allSettled([
        apiGet(
          `/api/standings?league=${activeLeague === 'all' ? '39' : activeLeague}`,
          controller.signal,
        ),
        apiGet(
          `/api/matches?${activeLeague === 'all' ? '' : `league=${activeLeague}`}`,
          controller.signal,
        ),
        apiGet(
          `/api/matches/live?league=${activeLeague}`,
          controller.signal,
        ),
      ])

      if (controller.signal.aborted) return

      const errors = []

      if (jobs[0].status === 'fulfilled') {
        setStandings(jobs[0].value.results || [])
        setStandingsInfo(jobs[0].value)
      } else {
        setStandings([])
        setStandingsInfo(null)
        errors.push(`Standings: ${jobs[0].reason.message}`)
      }

      if (jobs[1].status === 'fulfilled') {
        setFixtures(jobs[1].value.results || [])
      } else {
        setFixtures([])
        errors.push(`Fixtures: ${jobs[1].reason.message}`)
      }

      if (jobs[2].status === 'fulfilled') {
        setLiveMatches(jobs[2].value.results || [])
      } else {
        setLiveMatches([])
        errors.push(`Live scores: ${jobs[2].reason.message}`)
      }

      setFootballError(errors.join(' · '))
      setFootballSource(errors.length === 3 ? 'error' : 'api')
      setFootballLoading(false)
    }

    loadFootballData()

    return () => controller.abort()
  }, [activeLeague])

  const visibleFixtures = fixtures.filter((match) => {
    if (activeLeague === 'all') return true
    return String(match.league?.id) === activeLeague
  })

  const visibleLiveMatches = liveMatches.filter((match) => {
    if (activeLeague === 'all') return true
    return String(match.league?.id) === activeLeague
  })

  const priorityMatches = visibleLiveMatches.length
    ? visibleLiveMatches
    : visibleFixtures

  function openMatchInCentre(match) {
    setMatchToOpen(match)
    navigate('Matches')
  }

  function navigate(page) {
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      className="app-shell"
      style={{
        '--fad-background-image': `url("${backgroundImage}")`,
      }}
    >
      <main className="main-content">
        <header className="topbar">
          <button className="topbar-brand" onClick={() => navigate('Overview')} aria-label="Return to dashboard home">
            <span className="brand-icon">⚽</span><span>FAD<span>.</span></span>
          </button>
          {activePage !== 'Overview' && (
            <button className="topbar-back" onClick={() => navigate('Overview')}>
              <span>←</span> Dashboard
            </button>
          )}
          <div className="breadcrumb">
            {activePage === 'Overview' ? 'FOOTBALL ANALYTICS' : <><span>EXPLORE</span> / {activePage}</>}

            {selectedLeague && (
              <span className="breadcrumb-filter">
                {' '}· {selectedLeague.name}
              </span>
            )}
          </div>

          <div className="topbar-right">
            <span className="live-indicator">
              <i />
              {footballSource === 'api'
                ? 'API CONNECTED'
                : 'CHECKING API'}
            </span>

            <div className="avatar">FAD</div>
          </div>
        </header>

        <section className="page-content">
          {activePage === 'Dream XI' ? (
            <DreamXI />
          ) : activePage === 'Matches' ? (
            <MatchCentre initialMatch={matchToOpen} competitions={competitions} />
          ) : activePage === 'Overview' ? (
            <DashboardHome onNavigate={navigate} liveCount={visibleLiveMatches.length} fixtureCount={visibleFixtures.length} />
          ) : activePage === 'Players' ? (
            <PlayerDirectory selectedPlayer={selectedPlayer} onSelect={setSelectedPlayer} onBack={() => setSelectedPlayer(null)} />
          ) : activePage === 'Teams' ? (
            <TeamDirectory selectedTeam={selectedTeam} onSelect={setSelectedTeam} onBack={() => setSelectedTeam(null)} />
          ) : (
            <>
              <div className="welcome-row">
                <div>
                  <p className="eyebrow">
                    THE BEAUTIFUL GAME, BY THE NUMBERS
                  </p>

                  <h1>
                    {activePage === 'Competition' ? 'Competition standings' : activePage}
                  </h1>

                  <p className="subtitle">
                    Real football data from your FAD backend.
                  </p>
                </div>

                {activePage === 'Competition' && standingsInfo?.league?.season && (
                  <span className="period-select" aria-label="Current season">
                    {standingsInfo.league.season} season
                  </span>
                )}
              </div>

              <div className="notice">
                <span>ℹ</span>
                <p>
                  Live scores and today’s fixtures come from the match feed.
                  League tables refresh once daily from their configured data
                  source. Player data will be added in a later phase.
                </p>
              </div>

              {(competitionError || footballError) && (
                <div className="notice" role="status">
                  <span>⚠</span>
                  <p>
                    {[competitionError, footballError]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              )}

              {activePage === 'Legacy Overview' && (
                <>
                  <div className="stats-grid">
                    <StatCard
                      icon="⚽"
                      label="PLAYERS RETURNED"
                      value="—"
                      change="Planned"
                      tone="green"
                    />

                    <StatCard
                      icon="◷"
                      label="TODAY'S FIXTURES"
                      value={footballLoading ? '…' : visibleFixtures.length}
                      change="API data"
                      tone="blue"
                    />

                    <StatCard
                      icon="●"
                      label="LIVE MATCHES"
                      value={footballLoading ? '…' : visibleLiveMatches.length}
                      change="Live feed"
                      tone="purple"
                    />

                    <StatCard
                      icon="♜"
                      label="STANDING ENTRIES"
                      value={footballLoading ? '…' : standings.length}
                      change={standingsInfo?.league?.season || 'Current season'}
                      tone="orange"
                    />
                  </div>

                  <section className="panel players-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>{visibleLiveMatches.length ? 'Live match centre' : "Today's fixtures"}</h3>
                        <p>
                          {footballLoading
                            ? 'Loading live scores and today’s fixtures…'
                            : visibleLiveMatches.length
                              ? 'Live matches across all competitions · select a match for details'
                              : 'No matches live right now · showing today’s fixtures across all competitions'}
                        </p>
                      </div>

                      <button
                        className="text-button"
                        onClick={() => navigate('Matches')}
                      >
                        View matches ↗
                      </button>
                    </div>

                    {priorityMatches.length ? (
                      priorityMatches.slice(0, 12).map((match) => (
                        <MatchRow key={match.id} match={match} onClick={() => openMatchInCentre(match)} />
                      ))
                    ) : (
                      <p className="empty-state">
                        {footballLoading
                          ? 'Checking live scores and fixtures…'
                          : 'No live matches or fixtures were returned for today.'}
                      </p>
                    )}
                  </section>

                  <section className="panel players-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Top scorers</h3>
                        <p>
                          {selectedLeague?.name || 'Premier League'}
                        </p>
                      </div>

                      <button
                        className="text-button"
                        onClick={() => navigate('Players')}
                      >
                        Player directory ↗
                      </button>
                    </div>

                    <p className="empty-state">
                      Curated player data will be added in a later phase.
                    </p>
                  </section>
                </>
              )}

              {activePage === 'Legacy Players' && (
                <section className="panel players-panel">
                  <div className="panel-heading players-heading">
                    <div>
                      <h3>Player directory</h3>
                      <p>Player statistics are reserved for the curated data phase.</p>
                    </div>
                  </div>
                  <p className="empty-state">
                    No player feed is connected. This keeps the match API dedicated
                    to live scores, today’s fixtures, and match details.
                  </p>
                </section>
              )}

              {activePage === 'Competition' && (
                <section className="panel players-panel">
                  <div className="panel-heading players-heading">
                    <div>
                      <h3>
                        {selectedLeague?.name || 'Premier League'} standings
                      </h3>
                      <p>
                        {footballLoading
                          ? 'Loading standings…'
                          : `${standings.length} teams returned · ${standingsInfo?.league?.season || 'current'} season · ${standingsInfo?.source || 'source unavailable'}${standingsInfo?.snapshotAsOf ? ` · snapshot as of ${standingsInfo.snapshotAsOf}` : standingsInfo?.updatedAt ? ` · updated ${formatDate(standingsInfo.updatedAt)}` : ''}${standingsInfo?.stale ? ' · saved table' : ''}`}
                      </p>
                    </div>

                    <select
                      className="period-select competition-select"
                      value={activeLeague === 'all' ? '39' : activeLeague}
                      onChange={(event) => setActiveLeague(event.target.value)}
                      aria-label="Choose standings competition"
                    >
                      {competitions.map((league) => (
                        <option value={league.id} key={league.id}>
                          {league.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {footballLoading ? (
                    <p className="empty-state">Loading standings…</p>
                  ) : standings.length ? (
                    <StandingsTable rows={standings} />
                  ) : (
                    <p className="empty-state">
                      No table is available. Check that the standings feed token
                      is configured, or that this competition has a supported
                      current standings source.
                    </p>
                  )}
                </section>
              )}
            </>
          )}

          <footer className="footer">
            FAD <span>·</span> FOOTBALL ANALYTICS DASHBOARD
          </footer>
        </section>
      </main>
    </div>
  )
}

function DashboardHome({ onNavigate, liveCount, fixtureCount }) {
  const [legendIndex, setLegendIndex] = useState(0)
  const [previousLegendIndex, setPreviousLegendIndex] = useState(null)
  const [isLegendSliding, setIsLegendSliding] = useState(false)
  const legend = HOME_LEGEND_FRAMES[legendIndex]
  const changeLegend = useCallback((direction = 1) => {
    setPreviousLegendIndex(legendIndex)
    setIsLegendSliding(false)
    setLegendIndex((legendIndex + direction + HOME_LEGEND_FRAMES.length) % HOME_LEGEND_FRAMES.length)
    window.requestAnimationFrame(() => setIsLegendSliding(true))
    window.setTimeout(() => {
      setIsLegendSliding(false)
      setPreviousLegendIndex(null)
    }, 2000)
  }, [legendIndex])

  useEffect(() => {
    const timer = window.setInterval(() => changeLegend(1), 7000)
    return () => window.clearInterval(timer)
  }, [changeLegend])

  return (
    <div className="dashboard-home">
      <div className="home-grid">
        <div className="home-explorer">
          <div className="home-intro">
            <p className="eyebrow">THE BEAUTIFUL GAME, REIMAGINED</p>
            <h1>Every side of<br /><span>football.</span></h1>
            <p className="subtitle">Players, clubs, matchdays and the moments that bring them together.</p>
          </div>
          <div className="feature-puzzle">
            {FEATURE_TILES.map((tile, index) => (
              <button key={tile.title} className={`feature-tile ${tile.shape}`} onClick={() => onNavigate(tile.page)}>
                <span className="feature-index">0{index + 1}</span>
                <span className="feature-icon">{tile.icon}</span>
                <strong>{tile.title}</strong>
                <small>{tile.description}</small>
                <span className="feature-arrow">↗</span>
              </button>
            ))}
          </div>
          <div className="home-live-summary">
            <span className="live-pulse" />
            <span><b>{liveCount}</b> live now</span><i />
            <span><b>{fixtureCount}</b> today</span>
            <button onClick={() => onNavigate('Matches')}>Open match centre ↗</button>
          </div>
        </div>
        <aside className="home-cinematic" aria-label="Legends newspaper feature">
          {previousLegendIndex !== null && <img className={`legend-slide-image legend-slide-previous ${isLegendSliding ? 'is-sliding' : ''}`} src={HOME_LEGEND_FRAMES[previousLegendIndex].image} alt="" aria-hidden="true" style={{ objectPosition: HOME_LEGEND_FRAMES[previousLegendIndex].position }} onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />}
          <img key={`${legendIndex}-${legend.image}`} className={`legend-slide-image legend-slide-active ${previousLegendIndex !== null ? 'is-prepared' : ''} ${isLegendSliding ? 'is-sliding' : ''}`} src={legend.image} alt={`${legend.legend} in a historic football moment`} style={{ objectPosition: legend.position }} onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
          <div className="cinematic-grain" />
          <div className="legend-issue-bar"><span>THE FOOTBALL GAZETTE</span><span>EST. MMXXIV · NO. {String(legendIndex + 1).padStart(2, '0')}</span></div>
          <div className="legend-vertical-mark" aria-hidden="true">THE ARCHIVE · FOOTBALL THROUGH TIME</div>
          <article className="legend-newspaper-page" key={`${legendIndex}-quote`}>
            <p className="legend-paper-kicker">AN ARCHIVE OF THE BEAUTIFUL GAME</p>
            <blockquote>“{legend.quote}”</blockquote>
            <div className="legend-paper-footer"><a href={legend.sourceUrl} target="_blank" rel="noreferrer" aria-label="Open quotation source">FROM THE ARCHIVE ↗</a><div className="legend-page-controls"><button type="button" onClick={() => changeLegend(-1)} aria-label="Previous feature">←</button><button type="button" onClick={() => changeLegend(1)} aria-label="Next feature">→</button></div></div>
            <button className="legend-read-more" type="button" onClick={() => onNavigate('Players')}>TURN THE PAGE <span>↗</span></button>
          </article>
        </aside>
      </div>
    </div>
  )
}

function PlayerDirectory({ selectedPlayer, onSelect, onBack }) {
  const [query, setQuery] = useState('')
  const [activePosition, setActivePosition] = useState('All positions')
  const playerFilters = ['All positions', 'Striker', 'Left Winger', 'Right Winger', 'Attacking Midfielder', 'Defensive Midfielder', 'Central Midfielder', 'Left Back', 'Right Back', 'Centre Back', 'Goalkeeper']
  const visiblePlayers = FEATURED_PLAYERS.filter((player) => {
    const matchesRole = activePosition === 'All positions' || player.role === activePosition
    const matchesQuery = `${player.name} ${player.country} ${player.role}`.toLowerCase().includes(query.toLowerCase())
    return matchesRole && matchesQuery
  })
  const playerImage = (player) => CLUB_RECORD_PHOTOS[player.name] || NORMALIZED_CLUB_RECORD_PHOTOS[playerNameKey(player.name)] || player.image || fallbackPlayerPortrait
  const useFallbackPortrait = (event) => {
    event.currentTarget.onerror = null
    event.currentTarget.src = fallbackPlayerPortrait
  }

  if (selectedPlayer) {
    return (
      <section className="directory-page player-profile-page">
        <button className="back-link" onClick={onBack}>← All players</button>
        <div className="player-profile-hero">
          <div className="profile-photo-wrap"><img src={playerImage(selectedPlayer)} alt={selectedPlayer.name} onError={useFallbackPortrait} /></div>
          <div className="profile-identity"><p className="eyebrow">PLAYER PROFILE · FEATURED ICON</p><h1>{selectedPlayer.name}</h1><p>{selectedPlayer.country} <span>·</span> {selectedPlayer.role}</p></div>
        </div>
        <div className="profile-data-grid"><article><small>CLUB APPEARANCES</small><strong>{selectedPlayer.career?.appearances?.toLocaleString() ?? 'Not verified'}</strong></article><article><small>CLUB GOALS</small><strong>{selectedPlayer.career?.goals?.toLocaleString() ?? 'Not verified'}</strong></article><article><small>{selectedPlayer.international?.team || 'NATIONAL TEAM'} APPEARANCES</small><strong>{selectedPlayer.international?.appearances?.toLocaleString() ?? 'Not verified'}</strong></article><article><small>NATIONAL GOALS</small><strong>{selectedPlayer.international?.goals?.toLocaleString() ?? 'Not verified'}</strong></article><article><small>TEAM TITLES LISTED</small><strong>{hasTrophyHistory(selectedPlayer) ? selectedPlayer.trophies.length : 'Not verified'}</strong></article></div>
        {selectedPlayer.careerHighlights?.length > 0 && <section className="player-stat-highlights"><p className="eyebrow">VERIFIED CLUB RECORDS</p>{selectedPlayer.careerHighlights.map((record) => <article key={record.club}><strong>{record.club}</strong><span>{record.appearances.toLocaleString()} appearances</span><span>{record.goals.toLocaleString()} goals</span></article>)}</section>}
        <section className="profile-story">
          <p className="eyebrow">TROPHY CABINET · {hasTrophyHistory(selectedPlayer) ? `${selectedPlayer.trophies.length} TITLES LISTED` : 'RECORD NOT VERIFIED'}</p>
          {hasTrophyHistory(selectedPlayer) && selectedPlayer.trophies.length ? <div className="player-trophy-groups">{Object.entries(groupPlayerTrophies(selectedPlayer.trophies)).map(([category, trophies]) => <section key={category}><h3>{category}<span>{trophies.length}</span></h3><ul className="player-honours">{trophies.map((trophy, index) => <li key={`${trophy.name}-${trophy.season}-${index}`}><strong>{trophy.name}</strong><small>{trophy.season}{trophy.wonWith || trophy.club ? ` · ${trophy.wonWith || trophy.club}` : ''}</small></li>)}</ul></section>)}</div> : <p className="player-data-note">A season-by-season trophy record has not been verified for this profile yet, so no total is shown.</p>}
          {selectedPlayer.trophyStatus === 'partial' && <p className="player-data-note">This count lists verified winning editions available so far; the player’s full career total may be higher.</p>}
          <p className="eyebrow">CAREER & PLAYING STYLE</p><p className="player-biography">{selectedPlayer.detail}</p>
          {selectedPlayer.clubs?.length > 0 && <><p className="eyebrow">CLUB HISTORY · ALL COMPETITIONS</p><div className="player-club-table-wrap"><table className="player-club-table"><thead><tr><th>Club</th><th>Years</th><th>Apps</th><th>Goals</th><th>Assists</th></tr></thead><tbody>{selectedPlayer.clubs.map((club) => <tr key={club.name}><td>{club.name}</td><td>{club.years || '—'}</td><td>{club.appearances?.toLocaleString() ?? '—'}</td><td>{club.goals?.toLocaleString() ?? '—'}</td><td>{club.assists?.toLocaleString() ?? '—'}</td></tr>)}</tbody><tfoot><tr><th>Club total</th><td>—</td><th>{selectedPlayer.career?.appearances?.toLocaleString() ?? '—'}</th><th>{selectedPlayer.career?.goals?.toLocaleString() ?? '—'}</th><th>{selectedPlayer.career?.assists?.toLocaleString() ?? '—'}</th></tr></tfoot></table></div></>}
          <div className="player-assists-note">Assists: — means a dependable career-wide record wasn’t available. Historical assist tracking varies by competition and era.</div>
          <p className="player-data-note">{selectedPlayer.statNote}</p>
          {selectedPlayer.source && <div className="player-sources"><a className="player-source-link" href={selectedPlayer.source} target="_blank" rel="noreferrer">Player reference ↗</a>{selectedPlayer.secondarySources?.map((source) => <a className="player-source-link" key={source} href={source} target="_blank" rel="noreferrer">Additional source ↗</a>)}</div>}
        </section>
      </section>
    )
  }

  return (
    <section className="directory-page">
      <div className="directory-heading"><div><p className="eyebrow">THE PEOPLE WHO DEFINE THE GAME</p><h1>Player directory</h1><p className="subtitle">A hand-picked starting XI of football’s familiar faces. Search to explore a profile.</p></div><label className="directory-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search players" aria-label="Search players" /></label></div>
      <nav className="player-position-filters" aria-label="Filter players by position">{playerFilters.map((role) => <button type="button" key={role} className={activePosition === role ? 'active' : ''} onClick={() => setActivePosition(role)}>{role}</button>)}</nav>
      <div className="player-card-grid">{visiblePlayers.map((player, index) => <button className="featured-player-card" key={`${player.id || player.name}-${index}`} onClick={() => onSelect(player)}><div className="featured-player-image"><img src={playerImage(player)} alt={player.name} loading="lazy" onError={useFallbackPortrait} /><span>{String(index + 1).padStart(2, '0')}</span><i>↗</i></div><div><small>{player.country} · {player.role}</small><strong>{player.name}</strong><em className="player-card-trophy-count">{hasTrophyHistory(player) ? `${player.trophies.length} title${player.trophies.length === 1 ? '' : 's'} listed` : 'Trophy record not verified'}</em></div></button>)}</div>
      {!visiblePlayers.length && <p className="directory-empty">No featured players match “{query}”.</p>}
      <p className="directory-footnote">Profiles are stored locally. The new position groups are ready for verified statistics to be added as sources are confirmed.</p>
    </section>
  )
}

function TeamDirectory({ selectedTeam, onSelect, onBack }) {
  if (selectedTeam) {
    const [recordScorer, recordAppearance] = CLUB_RECORDS[selectedTeam.name] || ['Club legend', 'Club legend']
    const honours = CLUB_HONOURS[selectedTeam.name] || `${selectedTeam.country} domestic league · National cup competitions · Continental honours`
    const recordPhoto = (name) => CLUB_RECORD_PHOTOS[name]
    const clubStory = CLUB_ERA_NOTES[selectedTeam.name] || `Since its founding in ${selectedTeam.founded}, ${selectedTeam.name} has built a distinctive place in ${selectedTeam.country} football. Its identity has been shaped by generations of players, supporters and memorable campaigns.`
    const clubLegends = [
      { name: recordAppearance, title: 'MOST FIRST-TEAM APPEARANCES', statLabel: 'Appearances' },
      { name: recordScorer, title: 'ALL-TIME TOP SCORER', statLabel: 'Goals' },
    ]

    return (
      <section className="directory-page club-archive-page">
        <button className="back-link club-archive-back" onClick={onBack}>← All clubs</button>
        <div className="club-archive-layout">
          <section className="club-side-panel">
            <div className="club-side-hero">
              <img src={selectedTeam.logo} alt={`${selectedTeam.name} crest`} onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
              <div><p className="eyebrow">CLUB ARCHIVE · EST. {selectedTeam.founded}</p><h1>{selectedTeam.name}</h1><span>{selectedTeam.country}</span></div>
            </div>
            <div className="club-side-copy"><p className="eyebrow">HISTORY & IDENTITY</p><p className="club-side-description">{selectedTeam.history}</p><p className="club-side-era">{clubStory}</p></div>
            <div className="club-side-honours"><p className="eyebrow">MAJOR HONOURS</p><div className="honour-chips">{honours.split(' · ').map((honour) => <span key={honour}>✦ {honour}</span>)}</div></div>
            <div className="club-side-founded"><span>FOUNDED</span><strong>{selectedTeam.founded}</strong><span>MEN’S FIRST TEAM · {selectedTeam.country.toUpperCase()}</span></div>
          </section>

          <section className="legend-side-panel">
            <div className="legend-panel-heading"><p className="eyebrow">THE RECORD BOOK</p><h2>Club legends</h2><p>Open a profile to read their story at {selectedTeam.name}.</p></div>
            <div className="legend-profile-halves">{clubLegends.map((player) => {
              const profile = CLUB_PLAYER_ARCHIVE[`${player.name}|${selectedTeam.name}`]
              const stat = profile?.stats.find(([label]) => label.toLowerCase() === player.statLabel.toLowerCase())

              return (
                <article className="legend-profile-half" key={`${selectedTeam.name}-${player.title}`}>
                  <div className="legend-half-identity">
                    <div className="legend-half-photo" data-initials={player.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}>
                      {recordPhoto(player.name) && <img src={recordPhoto(player.name)} alt={player.name} loading="lazy" onError={(event) => { event.currentTarget.remove() }} />}
                    </div>
                    <div><small>{player.title}</small><h3>{player.name}</h3><strong>{stat?.[1] || '—'} <span>{player.statLabel.toLowerCase()}</span></strong></div>
                  </div>
                  <p className="legend-half-story">{profile?.bio || `${player.name} holds a place in ${selectedTeam.name}'s record book. A detailed club-era story and verified figure are not available.`}</p>
                  <small className="legend-half-source">{profile ? <>Record scope: {stat?.[2] || 'historical club record'} · <a href={profile.source[1]} target="_blank" rel="noreferrer">{profile.source[0]} ↗</a></> : 'Historical record · source not yet verified'}</small>
                </article>
              )
            })}</div>
            <small className="legend-panel-note">Historical records are curated and can vary between sources and competition scopes.</small>
          </section>
        </div>
      </section>
    )
  }

  return <section className="directory-page"><div className="directory-heading"><div><p className="eyebrow">BADGES, CITIES, HISTORIES</p><h1>Club directory</h1><p className="subtitle">Explore the stories behind some of football’s best-known clubs.</p></div></div><div className="club-card-grid">{FEATURED_TEAMS.map((team) => <button className="club-card" key={team.name} onClick={() => onSelect(team)}><span className="club-logo"><img src={team.logo} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement.dataset.fallback = team.name.slice(0, 2).toUpperCase() }} /></span><span className="club-card-copy"><strong>{team.name}</strong></span><i>↗</i></button>)}</div></section>
}

function MatchRow({ match, full = false, onClick }) {
  const home = match.home || {}
  const away = match.away || {}
  const league = match.league || {}

  const isLive = ['1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT'].includes(
    match.status,
  )

  return (
    <button
      type="button"
      className={`match-row ${full ? 'full-match' : ''}`}
      onClick={onClick}
      aria-label={`Open match details: ${home.name || 'Home team'} versus ${away.name || 'Away team'}`}
      style={{ width: '100%', background: 'transparent', border: 0, color: 'inherit', textAlign: 'left' }}
    >
      <div className="team-names">
        {league.name && (
          <small style={{ display: 'block', opacity: 0.65 }}>
            {league.name}
          </small>
        )}

        <strong>{home.name || 'Home team'}</strong>
        <span>vs</span>
        <strong>{away.name || 'Away team'}</strong>

        <small style={{ display: 'block', opacity: 0.65 }}>
          {formatDate(match.date)}
        </small>
      </div>

      <div className="match-result">
        <b>
          {home.goals === null || home.goals === undefined ? '—' : home.goals}
          {' - '}
          {away.goals === null || away.goals === undefined ? '—' : away.goals}
        </b>

        <span>
          {isLive && <i className="status-dot" />}

          {match.elapsed !== null && match.elapsed !== undefined
            ? `${match.elapsed}' · `
            : ''}

          {match.statusLong || match.status || 'Status unavailable'}
        </span>
      </div>
    </button>
  )
}

function StatCard({ icon, label, value, change, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <p>{label}</p>

      <div className="stat-bottom">
        <strong>{value}</strong>
        <span className="change">{change}</span>
      </div>
    </div>
  )
}

function StandingsTable({ rows }) {
  const groups = rows.some((row) => row.group)
    ? rows.reduce((collected, row) => {
      const groupName = row.group || 'Other teams'
      if (!collected.has(groupName)) collected.set(groupName, [])
      collected.get(groupName).push(row)
      return collected
    }, new Map())
    : new Map([['', rows]])

  return (
    <div className={`standings-groups ${groups.size > 1 ? 'has-groups' : ''}`}>
      {[...groups.entries()].map(([groupName, groupRows]) => (
        <section className="standings-group" key={groupName || 'overall'}>
          {groupName && <h3>{groupName}</h3>}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>TEAM</th><th>PLAYED</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {groupRows.map((row, index) => (
                  <tr key={row.team?.id || index}>
                    <td>{displayNumber(row.rank)}</td>
                    <td>
                      <div className="player-name">
                        {row.team?.logo && <img src={row.team.logo} alt="" loading="lazy" style={{ width: 25, height: 25, objectFit: 'contain' }} />}
                        <span><strong>{row.team?.name || 'Unknown team'}</strong></span>
                      </div>
                    </td>
                    <td>{displayNumber(row.played)}</td><td>{displayNumber(row.wins)}</td><td>{displayNumber(row.draws)}</td><td>{displayNumber(row.losses)}</td>
                    <td>{displayNumber(row.goalsFor)}</td><td>{displayNumber(row.goalsAgainst)}</td><td>{displayNumber(row.goalDifference)}</td>
                    <td><strong>{displayNumber(row.points)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}

export default App
