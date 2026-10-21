// Manually curated, local career records. Club and international figures are
// separate. Assists are null when reliable career-wide records are not available.
// Public career tables differ for historic football; sources are linked per player.
import { trophiesFromLegacyHonors } from '../utils/playerTrophies.js'

const makePlayer = (player) => {
  const clubs = player.clubs.map((club) => ({ assists: null, ...club }))
  const clubCareer = clubs.reduce((sum, club) => ({
    appearances: sum.appearances + club.appearances,
    goals: sum.goals + club.goals,
  }), { appearances: 0, goals: 0 })
  return {
    role: 'Striker',
    ...player,
    trophies: trophiesFromLegacyHonors(player.honors),
    trophyStatus: player.honors?.length ? 'partial' : 'unverified',
    clubs,
    career: { ...clubCareer, assists: null },
    international: { assists: null, ...player.international },
    transferHistory: clubs.map(({ name, years }) => `${name}${years ? ` (${years})` : ''}`),
    statNote: 'Public senior club appearances and goals are compiled by club and added for the club-career total; national-team figures are separate. Historical source definitions can differ. Assists were not recorded consistently across this player’s career.',
  }
}

export const STRIKERS = [
  makePlayer({
    id: 'pele', name: 'Pelé', country: 'Brazil', detail: 'A complete forward with extraordinary balance, acceleration, aerial timing and vision. Pelé combined a striker’s instinct with the range of a playmaker, becoming the central figure in Santos’s touring side and Brazil’s golden World Cup generation.',
    clubs: [{ name: 'Santos', years: '1956–1974', appearances: 666, goals: 644 }, { name: 'New York Cosmos', years: '1975–1977', appearances: 65, goals: 37 }],
    international: { team: 'Brazil', appearances: 92, goals: 77 },
    honors: ['FIFA World Cup (1958, 1962, 1970)', 'Copa Libertadores (1962, 1963)', 'Intercontinental Cup (1962, 1963)', 'Brazilian Championship (1961–1965, 1968)'],
    source: 'https://www.rsssf.org/players/ppeledata.html', secondarySources: ['https://www.santos.sp.gov.br/?q=node%2F147274'],
  }),
  makePlayer({
    id: 'ronaldo-nazario', name: 'Ronaldo Nazário', country: 'Brazil', detail: 'Ronaldo’s explosive first step, close control at full speed and calm one-on-one finishing made him a rare blend of power and finesse. Knee injuries interrupted his prime, but he rebuilt his career and led Brazil to the 2002 World Cup.',
    clubs: [{ name: 'Cruzeiro', years: '1993–1994', appearances: 47, goals: 44 }, { name: 'PSV Eindhoven', years: '1994–1996', appearances: 57, goals: 54 }, { name: 'Barcelona', years: '1996–1997', appearances: 49, goals: 47 }, { name: 'Inter Milan', years: '1997–2001', appearances: 99, goals: 59 }, { name: 'Real Madrid', years: '2002–2006', appearances: 177, goals: 104 }, { name: 'AC Milan', years: '2006–2007', appearances: 20, goals: 9 }, { name: 'Corinthians', years: '2009–2011', appearances: 69, goals: 35 }],
    international: { team: 'Brazil', appearances: 98, goals: 62 },
    honors: ['FIFA World Cup (1994, 2002)', 'Copa América (1997, 1999)', 'FIFA Confederations Cup (1997)', 'UEFA Cup (1998)', 'UEFA Cup Winners’ Cup (1997)', 'La Liga (2003, 2007)', 'Copa do Brasil (1993, 2009)', 'Copa del Rey (1997)', 'KNVB Cup (1996)', 'Intercontinental Cup (2002)', 'Supercopa (1996, 2003)'],
    source: 'https://www.strikerduel.com/players/ronaldo', secondarySources: ['https://palmares.fyi/player/ronaldo-nazario/'],
  }),
  makePlayer({
    id: 'gerd-muller', name: 'Gerd Müller', country: 'Germany', detail: 'The “Bomber” made the penalty area his territory. His low centre of gravity, rapid turns and instinctive finishing helped Bayern rise from regional side to European champion, while his goals powered West Germany to major international titles.',
    clubs: [{ name: 'TSV 1861 Nördlingen', years: '1962–1963', appearances: 31, goals: 51 }, { name: 'Bayern Munich', years: '1964–1978', appearances: 607, goals: 565 }, { name: 'Fort Lauderdale Strikers', years: '1979–1981', appearances: 80, goals: 40 }],
    international: { team: 'West Germany', appearances: 62, goals: 68 },
    honors: ['FIFA World Cup (1974)', 'UEFA European Championship (1972)', 'European Cup (1974, 1975, 1976)', 'Bundesliga (1969, 1972, 1973, 1974)', 'Intercontinental Cup (1976)'],
    source: 'https://www.strikerduel.com/players/gerd-muller', secondarySources: ['https://app.fcbayern.com/en/club/hall-of-fame/gerd-muller', 'https://www.rsssf.org/players/pgmuellerdata.html'],
  }),
  makePlayer({
    id: 'ferenc-puskas', name: 'Ferenc Puskás', country: 'Hungary / Spain', detail: 'Puskás paired a velvet first touch with a thunderous, exceptionally accurate left foot. He was the creative and scoring heart of Hungary’s Mighty Magyars, then reinvented himself at Real Madrid as a prolific leader of a European dynasty.',
    clubs: [{ name: 'Kispest / Budapest Honvéd', years: '1944–1956', appearances: 368, goals: 415 }, { name: 'Real Madrid', years: '1958–1965', appearances: 262, goals: 242 }],
    international: { team: 'Hungary and Spain', appearances: 89, goals: 84 },
    honors: ['European Cup (1959, 1960, 1966)', 'Intercontinental Cup (1960)', 'La Liga (1961–1965)', 'Hungarian League (1949, 1950, 1952, 1954, 1955)'],
    source: 'https://www.strikerduel.com/players/ferenc-puskas', secondarySources: ['https://www.realmadrid.com/en-US/the-club/history/football-legends/ferenc-puskas-biro', 'https://www.puskasferenc.hu/en/cikk25.html'],
  }),
  makePlayer({
    id: 'romario', name: 'Romário', country: 'Brazil', detail: 'A master of the penalty area, Romário used tiny changes of direction, deceptive pauses and a lightning-fast finish to create space where there seemed to be none. He excelled in Brazil and Europe and was the decisive scorer of Brazil’s 1994 World Cup campaign.',
    clubs: [{ name: 'Vasco da Gama', years: '1985–1988, 2000–2002, 2005–2007', appearances: 349, goals: 266 }, { name: 'PSV Eindhoven', years: '1988–1992', appearances: 149, goals: 128 }, { name: 'Barcelona', years: '1993–1994', appearances: 65, goals: 39 }, { name: 'Flamengo', years: '1995–1999', appearances: 209, goals: 184 }, { name: 'Valencia', years: '1996–1997', appearances: 12, goals: 6 }, { name: 'Fluminense', years: '2002–2004', appearances: 75, goals: 47 }, { name: 'Al-Sadd', years: '2002', appearances: 3, goals: 0 }, { name: 'Miami FC', years: '2006', appearances: 26, goals: 19 }, { name: 'Adelaide United', years: '2006', appearances: 4, goals: 1 }, { name: 'America-RJ', years: '2009', appearances: 1, goals: 0 }],
    international: { team: 'Brazil', appearances: 70, goals: 55 },
    honors: ['FIFA World Cup (1994)', 'Copa América (1989, 1997)', 'FIFA Confederations Cup (1997)', 'La Liga (1994)', 'Eredivisie (1989, 1991, 1992)', 'Campeonato Brasileiro (2000)'],
    source: 'https://www.strikerduel.com/players/romario', secondarySources: ['https://players.fcbarcelona.com/en/player/759-romario-romario-souza-faria'],
  }),
  makePlayer({
    id: 'marco-van-basten', name: 'Marco van Basten', country: 'Netherlands', detail: 'A complete, elegant centre-forward with exceptional technique, aerial skill and finishing from difficult angles. At Ajax and AC Milan he made the spectacular look controlled; recurring ankle injuries forced an early retirement at the height of his powers.',
    clubs: [{ name: 'Ajax', years: '1981–1986', appearances: 174, goals: 154 }, { name: 'AC Milan', years: '1987–1994', appearances: 205, goals: 128 }],
    international: { team: 'Netherlands', appearances: 58, goals: 24 },
    honors: ['UEFA European Championship (1988)', 'European Cup (1989, 1990)', 'Intercontinental Cup (1989, 1990)', 'Eredivisie (1982, 1983, 1985)', 'Serie A (1988, 1992, 1993, 1994)'],
    source: 'https://www.strikerduel.com/players/marco-van-basten', secondarySources: ['https://www.acmilan.com/en/club/history/legends/marco-van-basten'],
  }),
  makePlayer({
    id: 'eusebio', name: 'Eusébio', country: 'Portugal', detail: 'Known as the Black Panther, Eusébio fused sprinter’s pace with a powerful shot and fearless forward runs. His goals transformed Benfica into a European force and took Portugal to a historic third place at the 1966 World Cup.',
    clubs: [{ name: 'Sporting de Lourenço Marques', years: '1957–1960', appearances: 42, goals: 77 }, { name: 'Benfica', years: '1960–1974', appearances: 440, goals: 473 }, { name: 'Boston Minutemen', years: '1975', appearances: 8, goals: 2 }, { name: 'Monterrey', years: '1975', appearances: 10, goals: 1 }, { name: 'Toronto Metros-Croatia', years: '1976', appearances: 25, goals: 18 }, { name: 'Beira-Mar', years: '1976', appearances: 12, goals: 3 }, { name: 'Las Vegas Quicksilvers', years: '1977', appearances: 17, goals: 2 }, { name: 'União de Tomar', years: '1977', appearances: 9, goals: 3 }, { name: 'New Jersey Americans', years: '1978–1979', appearances: 9, goals: 2 }, { name: 'Buffalo Stallions', years: '1979', appearances: 5, goals: 1 }],
    international: { team: 'Portugal', appearances: 64, goals: 41 },
    honors: ['European Cup (1962)', 'Portuguese league (1961, 1963, 1964, 1965, 1967, 1968, 1969, 1971, 1972, 1973)', 'World Cup third place (1966)'],
    source: 'https://www.strikerduel.com/players/eusebio', secondarySources: ['https://www.slbenfica.pt/en-us/agora/noticias/2016_2017/06/historia-eusebio/', 'https://www.slbenfica.pt/en-us/agora/noticias/2018-2019/01/25/benfica-eusebio-efemeride-77-anos-nascimento'],
  }),
  makePlayer({
    id: 'alfredo-di-stefano', name: 'Alfredo Di Stéfano', country: 'Argentina / Colombia / Spain', detail: 'Di Stéfano was the prototype of the all-action forward: scorer, creator, presser and organiser in one. His relentless movement and leadership formed the axis of Real Madrid’s five consecutive European Cup wins in the competition’s first era.',
    clubs: [{ name: 'River Plate', years: '1945, 1947–1949', appearances: 75, goals: 55 }, { name: 'Huracán', years: '1946', appearances: 27, goals: 10 }, { name: 'Millonarios', years: '1949–1952', appearances: 111, goals: 93 }, { name: 'Real Madrid', years: '1953–1963', appearances: 396, goals: 308 }, { name: 'Espanyol', years: '1964–1965', appearances: 60, goals: 14 }],
    international: { team: 'Argentina, Colombia and Spain', appearances: 37, goals: 29 },
    honors: ['European Cup (1956–1960)', 'Intercontinental Cup (1960)', 'La Liga (1954, 1955, 1957, 1958, 1961–1964)', 'Colombian league (1949, 1951, 1952)', 'Argentine league (1945, 1947)'],
    source: 'https://www.strikerduel.com/players/alfredo-di-stefano', secondarySources: ['https://www.realmadrid.com/en-US/the-club/history/football-legends/alfredo-di-stefano-laulhe'],
  }),
  makePlayer({
    id: 'robert-lewandowski', name: 'Robert Lewandowski', country: 'Poland', detail: 'A meticulous, two-footed finisher whose timing, body positioning and movement between defenders have made him one of the most dependable scorers of his generation. He won the Champions League with Bayern and continued his scoring run in Spain.',
    clubs: [{ name: 'Delta Warsaw', years: '2004', appearances: 19, goals: 4 }, { name: 'Legia Warsaw II', years: '2005', appearances: 14, goals: 4 }, { name: 'Znicz Pruszków II', years: '2006', appearances: 4, goals: 8 }, { name: 'Znicz Pruszków', years: '2006–2007', appearances: 66, goals: 38 }, { name: 'Lech Poznań', years: '2008–2009', appearances: 82, goals: 41 }, { name: 'Borussia Dortmund', years: '2010–2013', appearances: 187, goals: 103 }, { name: 'Bayern Munich', years: '2014–2021', appearances: 375, goals: 344 }, { name: 'Barcelona', years: '2022–2026', appearances: 191, goals: 119 }, { name: 'Chicago Fire', years: '2026–', appearances: 15, goals: 7 }],
    international: { team: 'Poland', appearances: 167, goals: 89 },
    honors: ['UEFA Champions League (2020)', 'FIFA Club World Cup (2020)', 'Bundesliga (2011, 2012, 2015–2022)', 'La Liga (2023, 2025, 2026)'],
    source: 'https://www.fcbarcelona.com/en/news/4504409/robert-lewandowski-leaving-fc-barcelona-at-the-end-of-the-season', secondarySources: ['https://www.fcbarcelona.com/en/football/first-team/players/5109/robert-lewandowski'],
  }),
  makePlayer({
    id: 'luis-suarez', name: 'Luis Suárez', country: 'Uruguay', detail: 'An inventive, relentless striker whose sharp movement and improvisational finishing are matched by unusual creativity for a number nine. His peak combined prolific scoring at Liverpool and Barcelona with an ability to create chances for teammates.',
    clubs: [{ name: 'Nacional', years: '2005, 2022', appearances: 51, goals: 20 }, { name: 'Groningen', years: '2006', appearances: 37, goals: 15 }, { name: 'Ajax', years: '2007–2010', appearances: 159, goals: 111 }, { name: 'Liverpool', years: '2010–2013', appearances: 133, goals: 82 }, { name: 'Barcelona', years: '2014–2019', appearances: 283, goals: 198 }, { name: 'Atlético Madrid', years: '2020–2021', appearances: 83, goals: 34 }, { name: 'Grêmio', years: '2023', appearances: 54, goals: 29 }, { name: 'Inter Miami', years: '2024–2026', appearances: 111, goals: 55 }],
    international: { team: 'Uruguay', appearances: 143, goals: 69 },
    honors: ['Copa América (2011)', 'UEFA Champions League (2015)', 'FIFA Club World Cup (2015)', 'La Liga (2015, 2016, 2018, 2019, 2021)', 'Eredivisie (2011)', 'MLS Cup (2025)'],
    source: 'https://www.strikerduel.com/players/luis-suarez', secondarySources: ['https://www.fcbarcelona.com/en/football/first-team/players/4138/luis-suarez', 'https://www.intermiamicf.com/players/luis-suarez/stats/'],
  }),
  makePlayer({
    id: 'gabriel-batistuta', name: 'Gabriel Batistuta', country: 'Argentina', detail: 'Batistuta struck the ball with rare force and precision, but his game was more than power: he attacked space early, played with directness and carried a fierce competitive streak. Fiorentina became his home, and he later helped Roma win the league.',
    clubs: [{ name: 'Newell’s Old Boys', years: '1988', appearances: 28, goals: 8 }, { name: 'River Plate', years: '1989', appearances: 23, goals: 4 }, { name: 'Boca Juniors', years: '1990', appearances: 46, goals: 19 }, { name: 'Fiorentina', years: '1991–1999', appearances: 331, goals: 205 }, { name: 'Roma', years: '2000–2002', appearances: 87, goals: 33 }, { name: 'Inter Milan', years: '2002', appearances: 12, goals: 2 }, { name: 'Al-Arabi', years: '2003–2004', appearances: 24, goals: 27 }],
    international: { team: 'Argentina', appearances: 78, goals: 56 },
    honors: ['Copa América (1991, 1993)', 'Serie A (2001)', 'Argentine league (1990)', 'Coppa Italia (1996)'],
    source: 'https://www.strikerduel.com/players/gabriel-batistuta', secondarySources: ['https://www.figc.it/it/full-html?path=%2Fmuseo-del-calcio%2Fhall-of-fame%2Fle-stelle%2Fgabriel-batistuta'],
  }),
  makePlayer({
    id: 'thierry-henry', name: 'Thierry Henry', country: 'France', detail: 'Henry transformed the art of the counterattacking forward with long, gliding runs from the left, quick combinations and composed finishes across goal. At Arsenal he became both the team’s leading scorer and its creative engine.',
    clubs: [{ name: 'Monaco reserves', years: '1994', appearances: 19, goals: 6 }, { name: 'Monaco', years: '1994–1998', appearances: 141, goals: 28 }, { name: 'Juventus', years: '1998–1999', appearances: 20, goals: 3 }, { name: 'Arsenal', years: '1999–2006, 2011', appearances: 377, goals: 228 }, { name: 'Barcelona', years: '2007–2009', appearances: 121, goals: 49 }, { name: 'New York Red Bulls', years: '2010–2014', appearances: 135, goals: 52 }],
    international: { team: 'France', appearances: 123, goals: 51 },
    honors: ['FIFA World Cup (1998)', 'UEFA European Championship (2000)', 'UEFA Champions League (2009)', 'FIFA Club World Cup (2009)', 'Premier League (2002, 2004)', 'La Liga (2009, 2010)'],
    source: 'https://www.fff.fr/equipe-nationale/joueur/9809-henry-thierry/fiche.html', secondarySources: ['https://www.arsenal.com/historic/players/thierry-henry', 'https://www.strikerduel.com/players/thierry-henry'],
  }),
  makePlayer({
    id: 'miroslav-klose', name: 'Miroslav Klose', country: 'Germany', detail: 'A selfless, intelligent striker whose timing in the box and aerial movement made him a constant threat. Klose’s calm finishing carried across four World Cups, where he became the tournament’s record scorer and finished as a champion in 2014.',
    clubs: [{ name: 'FC 08 Homburg', years: '1998', appearances: 18, goals: 1 }, { name: 'Kaiserslautern II', years: '1999–2000', appearances: 50, goals: 26 }, { name: 'Kaiserslautern', years: '1999–2003', appearances: 147, goals: 52 }, { name: 'Werder Bremen', years: '2004–2006', appearances: 132, goals: 63 }, { name: 'Bayern Munich', years: '2007–2010', appearances: 150, goals: 53 }, { name: 'Lazio', years: '2011–2015', appearances: 170, goals: 63 }],
    international: { team: 'Germany', appearances: 137, goals: 71 },
    honors: ['FIFA World Cup (2014)', 'Bundesliga (2008, 2010)', 'DFB-Pokal (2008, 2010)', 'Coppa Italia (2013)'],
    source: 'https://www.strikerduel.com/players/miroslav-klose', secondarySources: ['https://datencenter.dfb.de/datencenter/personen/miroslav-klose/spieler', 'https://www.fussballmuseum.de/en/museum/hall-of-fame/members/the-lord/miroslav-klose'],
  }),
  makePlayer({
    id: 'andriy-shevchenko', name: 'Andriy Shevchenko', country: 'Ukraine', detail: 'Shevchenko combined acceleration, intelligent diagonal runs and a clean, fast strike with equal comfort on either foot. He became a symbol of Dynamo Kyiv’s revival, then a Champions League winner and Ballon d’Or recipient with AC Milan.',
    clubs: [{ name: 'Dynamo Kyiv II', years: '1992–1994, 1996', appearances: 56, goals: 21 }, { name: 'Dynamo Kyiv', years: '1994–1998, 2009–2011', appearances: 249, goals: 124 }, { name: 'AC Milan', years: '1999–2006, 2008', appearances: 322, goals: 175 }, { name: 'Chelsea', years: '2006–2007, 2009', appearances: 77, goals: 22 }],
    international: { team: 'Ukraine', appearances: 111, goals: 48 },
    honors: ['UEFA Champions League (2003)', 'UEFA Super Cup (2003)', 'Serie A (2004)', 'Ukrainian league (1995–1998, 2000, 2009)'],
    source: 'https://www.strikerduel.com/players/andriy-shevchenko', secondarySources: ['https://www.acmilan.com/en/hall-of-fame/inductees/andriy-shevchenko', 'https://www.uefa.com/uefachampionsleague/news/01f2-0e78a3bd'],
  }),
  makePlayer({
    id: 'samuel-etoo', name: 'Samuel Eto’o', country: 'Cameroon', detail: 'Eto’o was a rapid, fiercely focused striker who attacked the line relentlessly and pressed as hard as he finished. He made history as a key scorer in consecutive Barcelona and Inter trebles and led Cameroon to continental and Olympic glory.',
    clubs: [{ name: 'Leganés', years: '1997', appearances: 30, goals: 4 }, { name: 'Real Madrid', years: '1998–1999', appearances: 7, goals: 0 }, { name: 'Espanyol', years: '1998', appearances: 1, goals: 0 }, { name: 'Mallorca', years: '2000–2003', appearances: 152, goals: 64 }, { name: 'Barcelona', years: '2004–2008', appearances: 199, goals: 130 }, { name: 'Inter Milan', years: '2009–2011', appearances: 102, goals: 53 }, { name: 'Anzhi Makhachkala', years: '2011–2013', appearances: 73, goals: 36 }, { name: 'Chelsea', years: '2013', appearances: 35, goals: 12 }, { name: 'Everton', years: '2014', appearances: 20, goals: 4 }, { name: 'Sampdoria', years: '2014', appearances: 18, goals: 2 }, { name: 'Antalyaspor', years: '2015–2017', appearances: 77, goals: 44 }, { name: 'Konyaspor', years: '2017', appearances: 18, goals: 6 }, { name: 'Qatar SC', years: '2018', appearances: 23, goals: 10 }],
    international: { team: 'Cameroon', appearances: 118, goals: 56 },
    honors: ['UEFA Champions League (2006, 2009, 2010)', 'FIFA Club World Cup (2010)', 'La Liga (2005, 2006, 2009)', 'Serie A (2010)', 'Africa Cup of Nations (2000, 2002)', 'Olympic gold (2000)'],
    source: 'https://www.strikerduel.com/players/samuel-etoo', secondarySources: ['https://www.sampdoria.it/en/player/samuel-etoo/'],
  }),
  makePlayer({
    id: 'didier-drogba', name: 'Didier Drogba', country: 'Ivory Coast', detail: 'Drogba was a powerful, technically gifted centre-forward who could hold off defenders, link play and dominate in the air. His authority in high-pressure moments made him Chelsea’s defining striker of the club’s first great European era.',
    clubs: [{ name: 'Le Mans', years: '1998–2001', appearances: 72, goals: 15 }, { name: 'Guingamp', years: '2001–2002', appearances: 50, goals: 24 }, { name: 'Marseille', years: '2003', appearances: 55, goals: 32 }, { name: 'Chelsea', years: '2004–2011, 2014', appearances: 381, goals: 164 }, { name: 'Shanghai Shenhua', years: '2012', appearances: 11, goals: 8 }, { name: 'Galatasaray', years: '2012–2013', appearances: 53, goals: 20 }, { name: 'Montreal Impact', years: '2015–2016', appearances: 41, goals: 23 }, { name: 'Phoenix Rising', years: '2017–2018', appearances: 26, goals: 17 }],
    international: { team: 'Ivory Coast', appearances: 105, goals: 65 },
    honors: ['UEFA Champions League (2012)', 'Premier League (2005, 2006, 2010, 2015)', 'Africa Cup of Nations runner-up (2006, 2012)'],
    source: 'https://www.strikerduel.com/players/didier-drogba', secondarySources: ['https://www.chelseafc.com/en/teams/profile/didier-drogba'],
  }),
  makePlayer({
    id: 'zlatan-ibrahimovic', name: 'Zlatan Ibrahimović', country: 'Sweden', detail: 'A uniquely inventive striker with exceptional strength, acrobatic technique and a gift for the spectacular. Zlatan adapted his game to different leagues and systems, becoming a serial domestic champion and one of Sweden’s defining footballers.',
    clubs: [{ name: 'Malmö FF', years: '1999–2001', appearances: 47, goals: 18 }, { name: 'Ajax', years: '2001–2004', appearances: 110, goals: 48 }, { name: 'Juventus', years: '2004–2005', appearances: 92, goals: 26 }, { name: 'Inter Milan', years: '2006–2008', appearances: 117, goals: 66 }, { name: 'Barcelona', years: '2009–2010', appearances: 46, goals: 22 }, { name: 'AC Milan', years: '2010–2011, 2019–2022', appearances: 163, goals: 93 }, { name: 'Paris Saint-Germain', years: '2012–2015', appearances: 180, goals: 156 }, { name: 'Manchester United', years: '2016–2017', appearances: 53, goals: 29 }, { name: 'LA Galaxy', years: '2018–2019', appearances: 58, goals: 53 }],
    international: { team: 'Sweden', appearances: 122, goals: 62 },
    honors: ['UEFA Europa League (2017)', 'La Liga (2010)', 'Serie A (2007, 2008, 2009, 2011, 2022)', 'Ligue 1 (2013–2016)', 'Eredivisie (2002, 2004)', 'Premier League (2017)'],
    source: 'https://www.strikerduel.com/players/zlatan-ibrahimovic', secondarySources: ['https://www.acmilan.com/en/club/history/legends/zlatan-ibrahimovic'],
  }),
  makePlayer({
    id: 'ruud-van-nistelrooy', name: 'Ruud van Nistelrooy', country: 'Netherlands', detail: 'A specialist in movement and finishing, Van Nistelrooy read the space between defenders and needed little time to get a shot away. He carried his scoring record from the Netherlands to Manchester United and Real Madrid, excelling in the Champions League.',
    clubs: [{ name: 'Den Bosch', years: '1993–1996', appearances: 71, goals: 20 }, { name: 'Heerenveen', years: '1997', appearances: 40, goals: 16 }, { name: 'PSV Eindhoven', years: '1998–2000', appearances: 90, goals: 77 }, { name: 'Manchester United', years: '2001–2005', appearances: 219, goals: 150 }, { name: 'Real Madrid', years: '2006–2009', appearances: 96, goals: 64 }, { name: 'Hamburger SV', years: '2009–2010', appearances: 44, goals: 17 }, { name: 'Málaga', years: '2011', appearances: 32, goals: 5 }],
    international: { team: 'Netherlands', appearances: 70, goals: 35 },
    honors: ['Premier League (2003)', 'La Liga (2007, 2008)', 'Eredivisie (2000, 2001)'],
    source: 'https://www.strikerduel.com/players/ruud-van-nistelrooy', secondarySources: ['https://www.knvb.com/'],
  }),
  makePlayer({
    id: 'gary-lineker', name: 'Gary Lineker', country: 'England', detail: 'Lineker built his career on anticipation, clever movement and exceptionally clean finishing. He rarely needed physical duels to get chances; a sharp change of pace and a composed touch made him prolific in England, Spain and Japan.',
    clubs: [{ name: 'Leicester City', years: '1978–1984', appearances: 216, goals: 103 }, { name: 'Everton', years: '1985', appearances: 57, goals: 40 }, { name: 'Barcelona', years: '1986–1988', appearances: 137, goals: 52 }, { name: 'Tottenham Hotspur', years: '1989–1991', appearances: 138, goals: 80 }, { name: 'Nagoya Grampus Eight', years: '1993–1994', appearances: 24, goals: 8 }],
    international: { team: 'England', appearances: 80, goals: 48 },
    honors: ['Copa del Rey (1988)', 'FA Cup (1991)'],
    source: 'https://www.strikerduel.com/players/gary-lineker', secondarySources: ['https://www.englandfootball.com/england/mens-senior-team/squads/Gary-Lineker'],
  }),
  makePlayer({
    id: 'just-fontaine', name: 'Just Fontaine', country: 'France', detail: 'Fontaine was a direct, opportunistic striker who attacked crosses early and finished quickly with either foot. His 13 goals at the 1958 World Cup remain a tournament record; at Reims he was the focal point of one of France’s great sides.',
    clubs: [{ name: 'USM Casablanca', years: '1950–1953', appearances: 48, goals: 62 }, { name: 'Nice', years: '1953–1956', appearances: 83, goals: 51 }, { name: 'Stade de Reims', years: '1956–1962', appearances: 152, goals: 145 }],
    international: { team: 'France', appearances: 21, goals: 31 },
    honors: ['French league (1956, 1958, 1960, 1962)', 'FIFA World Cup third place (1958)'],
    source: 'https://www.zerozero.pt/jogador/just-fontaine', secondarySources: ['https://www.fff.fr/equipe-nationale/joueur/9771-fontaine-just/fiche.html', 'https://www.ogcnice.com/fr/fiche/3022/just-fontaine.html'],
  }),
]
