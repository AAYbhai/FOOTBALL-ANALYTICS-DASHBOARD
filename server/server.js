
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const axios = require('axios')
const fs = require('fs/promises')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const footballApi = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY },
  timeout: 15000,
})

const highlightlyApi = axios.create({
  baseURL: 'https://soccer.highlightly.net',
  headers: { 'x-rapidapi-key': process.env.HIGHLIGHTLY_API_KEY },
  timeout: 15000,
})

const CLUB_LEAGUES = {
  '39': 'Premier League', '140': 'La Liga', '78': 'Bundesliga',
  '135': 'Serie A', '61': 'Ligue 1', '88': 'Eredivisie',
  '94': 'Primeira Liga', '144': 'Belgian Pro League',
  '179': 'Scottish Premiership', '203': 'Turkish Super Lig',
  '218': 'Austrian Bundesliga', '207': 'Swiss Super League',
  '119': 'Danish Superliga', '103': 'Norwegian Eliteserien',
  '113': 'Swedish Allsvenskan', '106': 'Polish Ekstraklasa',
  '197': 'Greek Super League', '40': 'English Championship',
  '253': 'Major League Soccer', '262': 'Liga MX',
  '71': 'Brazilian Serie A', '128': 'Argentine Primera Division',
  '239': 'Colombian Primera A', '307': 'Saudi Pro League',
  '323': 'Indian Super League', '98': 'J1 League',
  '188': 'Australian A-League', '233': 'Egyptian Premier League',
  '288': 'South African Premiership', '200': 'Moroccan Botola Pro',
}

const INTERNATIONAL_LEAGUES = {
  '2': 'UEFA Champions League', '3': 'UEFA Europa League',
  '848': 'UEFA Conference League', '10': 'International Friendlies',
  '1': 'FIFA World Cup', '4': 'UEFA European Championship',
  '5': 'UEFA Nations League', '6': 'Africa Cup of Nations',
  '9': 'Copa America',
}

const ALL_LEAGUES = { ...CLUB_LEAGUES, ...INTERNATIONAL_LEAGUES }
const ALLOWED_LEAGUE_IDS = new Set(Object.keys(ALL_LEAGUES))
const CURATED_COMPETITION_IDS = [
  '39', '140', '78', '135', '61', '2', '5', '1', '4', '9', '307', '253',
]
const MATCH_COMPETITION_IDS = new Set(CURATED_COMPETITION_IDS)
const PLAYER_SEASONS = new Set(['2022', '2023', '2024', '2025', '2026'])

const cache = new Map()
const pendingApiRequests = new Map()
const pendingStandingsRequests = new Map()
const STANDINGS_FILE = path.join(__dirname, 'data', 'standings-cache.json')
const NATIONS_LEAGUE_SNAPSHOT = require('./data/nations-league-2026-27.json')
const STANDINGS_FEED_CODES = {
  '39': 'PL', '140': 'PD', '78': 'BL1', '135': 'SA', '61': 'FL1', '5': 'UNL',
  '2': 'CL', '1': 'WC', '4': 'EC',
}
const NO_CURRENT_STANDINGS = new Set(['9'])

const TTL = {
  players: 6 * 60 * 60 * 1000,
  standings: 30 * 60 * 1000,
  fixtures: 5 * 60 * 1000,
  live: 60 * 1000,
  matchDetails: 5 * 60 * 1000,
  team: 6 * 60 * 60 * 1000,
}

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null

  if (Date.now() >= entry.expiresAt) {
    cache.delete(key)
    return null
  }

  return entry.value
}

function saveCache(key, value, ttl) {
  cache.set(key, { value, expiresAt: Date.now() + ttl })
}

async function readStandingsCache() {
  try {
    return JSON.parse(await fs.readFile(STANDINGS_FILE, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return {}
    console.error('Could not read saved standings:', error.message)
    return {}
  }
}

async function saveStandingsCache(cacheData) {
  await fs.mkdir(path.dirname(STANDINGS_FILE), { recursive: true })
  const temporaryFile = `${STANDINGS_FILE}.tmp`
  await fs.writeFile(temporaryFile, JSON.stringify(cacheData, null, 2), 'utf8')
  await fs.rename(temporaryFile, STANDINGS_FILE)
}

function standingsRows(data) {
  const standings = data.standings || []
  const totals = standings.filter((standing) => standing.type === 'TOTAL')
  const tables = totals.length ? totals : standings.slice(0, 1)

  return tables.flatMap((standing) => (standing.table || []).map((row) => ({
    rank: row.position ?? null,
    team: {
      id: row.team?.id ?? null,
      name: row.team?.name ?? 'Unknown team',
      logo: row.team?.crest ?? null,
    },
    points: row.points ?? null,
    goalDifference: row.goalDifference ?? null,
    group: row.group ?? standing.group ?? standing.groupName ?? null,
    form: row.form ?? null,
    status: row.status ?? null,
    played: row.playedGames ?? null,
    wins: row.won ?? null,
    draws: row.draw ?? null,
    losses: row.lost ?? null,
    goalsFor: row.goalsFor ?? null,
    goalsAgainst: row.goalsAgainst ?? null,
  })))
}

function nationsLeagueSnapshot() {
  const results = Object.entries(NATIONS_LEAGUE_SNAPSHOT.groups).flatMap(([group, teams]) =>
    teams.map(([name, played, wins, draws, losses, goalsFor, goalsAgainst, goalDifference, points], index) => ({
      rank: index + 1,
      team: { id: `${group}:${name}`, name, logo: null },
      points,
      goalDifference,
      group,
      form: null,
      status: null,
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
    })),
  )

  return {
    results,
    count: results.length,
    league: {
      id: 5,
      name: 'UEFA Nations League',
      logo: null,
      country: 'Europe',
      season: NATIONS_LEAGUE_SNAPSHOT.season,
    },
    source: 'UEFA.com snapshot',
    sourceUrl: NATIONS_LEAGUE_SNAPSHOT.sourceUrl,
    snapshotAsOf: NATIONS_LEAGUE_SNAPSHOT.asOf,
  }
}

async function fetchMlsStandings() {
  const competitionId = 'MLS-COM-000001'
  const seasonResponse = await axios.get(
    `https://stats-api.mlssoccer.com/competitions/${competitionId}/seasons`,
    { timeout: 15000 },
  )
  const seasons = seasonResponse.data?.seasons || []
  const currentYear = new Date().getFullYear()
  const season = seasons.find((item) => Number(item.season) === currentYear)
  if (!season?.season_id) throw new Error('MLS current season was not listed by its official feed.')

  const response = await axios.get(
    `https://stats-api.mlssoccer.com/competitions/${competitionId}/seasons/${season.season_id}/standings`,
    { params: { category: 'conference' }, timeout: 15000 },
  )
  const tables = response.data?.tables || []
  const results = tables.flatMap((table) => (table.entries || []).map((row) => ({
    rank: row.position ?? null,
    team: { id: row.team_id ?? row.club_id ?? null, name: row.team || row.club || 'Unknown team', logo: null },
    points: row.points ?? null,
    goalDifference: row.goals_difference ?? null,
    group: table.group || null,
    form: null,
    status: row.qualification || null,
    played: row.games_played ?? null,
    wins: row.wins ?? null,
    draws: row.draws ?? null,
    losses: row.losses ?? null,
    goalsFor: row.goals_scored ?? null,
    goalsAgainst: row.goals_against ?? null,
  })))
  if (!results.length) throw new Error('MLS official feed returned no standings rows.')

  return {
    results,
    count: results.length,
    league: {
      id: 253,
      name: 'Major League Soccer',
      logo: null,
      country: 'United States',
      season: Number(season.season),
    },
    source: 'MLS official stats',
  }
}

async function fetchSaudiStandings() {
  const baseUrl = 'https://en.fantasy.spl.com.sa/api'
  const [bootstrapResponse, fixturesResponse] = await Promise.all([
    axios.get(`${baseUrl}/bootstrap-static/`, { timeout: 15000 }),
    axios.get(`${baseUrl}/fixtures/`, { timeout: 15000 }),
  ])
  const teams = bootstrapResponse.data?.teams || []
  const fixtures = Array.isArray(fixturesResponse.data)
    ? fixturesResponse.data
    : fixturesResponse.data?.fixtures || []
  const rows = new Map(teams.map((team) => [team.id, {
    rank: null,
    team: { id: team.id, name: team.name || 'Unknown team', logo: null },
    points: 0,
    goalDifference: 0,
    group: null,
    form: null,
    status: null,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  }]))

  for (const fixture of fixtures) {
    if (fixture.finished !== true) continue
    const home = rows.get(fixture.team_h)
    const away = rows.get(fixture.team_a)
    if (fixture.team_h_score == null || fixture.team_a_score == null) continue
    const homeGoals = Number(fixture.team_h_score)
    const awayGoals = Number(fixture.team_a_score)
    if (!home || !away || !Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) continue

    home.played += 1
    away.played += 1
    home.goalsFor += homeGoals
    home.goalsAgainst += awayGoals
    away.goalsFor += awayGoals
    away.goalsAgainst += homeGoals
    if (homeGoals > awayGoals) {
      home.wins += 1
      away.losses += 1
      home.points += 3
    } else if (homeGoals < awayGoals) {
      away.wins += 1
      home.losses += 1
      away.points += 3
    } else {
      home.draws += 1
      away.draws += 1
      home.points += 1
      away.points += 1
    }
  }

  const results = [...rows.values()]
    .map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst }))
    .sort((left, right) => right.points - left.points
      || right.goalDifference - left.goalDifference
      || right.goalsFor - left.goalsFor)
    .map((row, index) => ({ ...row, rank: index + 1 }))
  if (!results.length || !results.some((row) => row.played > 0)) {
    throw new Error('Official Saudi Pro League feed returned no completed results.')
  }

  return {
    results,
    count: results.length,
    league: {
      id: 307,
      name: 'Saudi Pro League',
      logo: null,
      country: 'Saudi Arabia',
      season: `${new Date().getFullYear()}/${String(new Date().getFullYear() + 1).slice(-2)}`,
    },
    source: 'Saudi Pro League official fixture results',
    sourceUrl: 'https://en.fantasy.spl.com.sa/',
  }
}

function apiErrors(data) {
  const errors = data?.errors
  return errors && Object.keys(errors).length ? errors : null
}

function requireApiKey(res) {
  if (!process.env.API_FOOTBALL_KEY) {
    res.status(500).json({
      error: 'API_FOOTBALL_KEY is missing from server/.env.',
    })
    return false
  }
  return true
}

function matchProvider() {
  if (process.env.HIGHLIGHTLY_API_KEY) return 'Highlightly'
  if (process.env.API_FOOTBALL_KEY) return 'API-Football'
  return null
}

function requireMatchProvider(res) {
  if (matchProvider()) return true
  res.status(500).json({
    error: 'Add HIGHLIGHTLY_API_KEY or API_FOOTBALL_KEY to the server environment to enable match data.',
  })
  return false
}

function validateMatchCompetition(league) {
  return league === 'all' || MATCH_COMPETITION_IDS.has(league)
}

function filterByLeague(items, league) {
  if (!league || league === 'all') return items
  return items.filter((item) => String(item.league?.id) === league)
}

function mapPlayer(item) {
  const stats = item.statistics?.[0] || {}
  const rating = stats.games?.rating

  return {
    id: item.player?.id ?? null,
    name: item.player?.name || 'Unknown player',
    age: item.player?.age ?? null,
    nationality: item.player?.nationality ?? null,
    photo: item.player?.photo ?? null,
    team: stats.team?.name ?? null,
    teamId: stats.team?.id ?? null,
    teamLogo: stats.team?.logo ?? null,
    position: stats.games?.position ?? null,
    appearances: stats.games?.appearences ?? null,
    goals: stats.goals?.total ?? null,
    assists: stats.goals?.assists ?? null,
    rating:
      rating !== undefined &&
      rating !== null &&
      rating !== '' &&
      Number.isFinite(Number(rating))
        ? Number(rating)
        : null,
    league: stats.league?.name ?? null,
    leagueId: stats.league?.id ?? null,
    season: stats.league?.season ?? null,
  }
}

function mapFixture(item) {
  return {
    id: item.fixture?.id ?? null,
    date: item.fixture?.date ?? null,
    timestamp: item.fixture?.timestamp ?? null,
    venue: item.fixture?.venue?.name ?? null,
    referee: item.fixture?.referee ?? null,
    elapsed: item.fixture?.status?.elapsed ?? null,
    status: item.fixture?.status?.short ?? 'NS',
    statusLong: item.fixture?.status?.long ?? '',

    league: {
      id: item.league?.id ?? null,
      name: item.league?.name || 'Unknown competition',
      country: item.league?.country ?? null,
      logo: item.league?.logo ?? null,
      season: item.league?.season ?? null,
      round: item.league?.round ?? null,
    },

    home: {
      id: item.teams?.home?.id ?? null,
      name: item.teams?.home?.name || 'Home team',
      logo: item.teams?.home?.logo ?? null,
      goals: item.goals?.home ?? null,
      winner: item.teams?.home?.winner ?? null,
    },

    away: {
      id: item.teams?.away?.id ?? null,
      name: item.teams?.away?.name || 'Away team',
      logo: item.teams?.away?.logo ?? null,
      goals: item.goals?.away ?? null,
      winner: item.teams?.away?.winner ?? null,
    },
  }
}

const HIGHLIGHTLY_LEAGUE_IDS = new Map([
  ['premier league', '39'], ['english premier league', '39'],
  ['la liga', '140'], ['laliga', '140'], ['spanish la liga', '140'],
  ['bundesliga', '78'], ['german bundesliga', '78'],
  ['serie a', '135'], ['italian serie a', '135'],
  ['ligue 1', '61'], ['french ligue 1', '61'],
  ['uefa champions league', '2'], ['champions league', '2'],
  ['uefa nations league', '5'], ['nations league', '5'],
  ['fifa world cup', '1'], ['world cup', '1'],
  ['uefa european championship', '4'], ['european championship', '4'], ['euros', '4'],
  ['copa america', '9'], ['conmebol copa america', '9'],
  ['saudi pro league', '307'], ['ros hn league', '307'],
  ['major league soccer', '253'], ['mls', '253'],
])

function normalizeName(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function highlightlyLeagueId(item) {
  const name = normalizeName(item.league?.name)
  return HIGHLIGHTLY_LEAGUE_IDS.get(name) || null
}

function parseHighlightlyScore(value) {
  const match = String(value || '').match(/(\d+)\s*[-–:]\s*(\d+)/)
  return match ? [Number(match[1]), Number(match[2])] : [null, null]
}

function mapHighlightlyStatus(description) {
  const status = normalizeName(description)
  const statuses = {
    'not started': 'NS', 'to be announced': 'TBD',
    'first half': '1H', 'half time': 'HT', 'second half': '2H',
    'extra time': 'ET', 'break time': 'BT', penalties: 'P',
    finished: 'FT', 'finished after penalties': 'PEN',
    'finished after extra time': 'AET', postponed: 'PST',
    cancelled: 'CANC', abandoned: 'ABD', suspended: 'SUSP',
    interrupted: 'INT', awarded: 'AWD', 'in progress': 'LIVE', unknown: 'TBD',
  }
  return statuses[status] || 'TBD'
}

function mapHighlightlyFixture(item) {
  const leagueId = highlightlyLeagueId(item)
  if (!leagueId) return null

  const [homeGoals, awayGoals] = parseHighlightlyScore(item.state?.score?.current)
  const date = item.date || null
  const clock = item.state?.clock == null ? null : Number(item.state.clock)

  return {
    id: item.id ?? null,
    date,
    timestamp: date ? Math.floor(new Date(date).getTime() / 1000) : null,
    venue: item.venue?.name ?? null,
    referee: item.referee?.name ?? null,
    elapsed: clock !== null && Number.isFinite(clock) ? clock : null,
    status: mapHighlightlyStatus(item.state?.description),
    statusLong: item.state?.description || 'Unknown',
    league: {
      id: Number(leagueId),
      name: item.league?.name || ALL_LEAGUES[leagueId],
      country: item.country?.name ?? null,
      logo: item.league?.logo ?? null,
      season: item.league?.season ?? null,
      round: item.round ?? null,
    },
    home: {
      id: item.homeTeam?.id ?? null,
      name: item.homeTeam?.name || 'Home team',
      logo: item.homeTeam?.logo ?? null,
      goals: homeGoals,
      winner: null,
    },
    away: {
      id: item.awayTeam?.id ?? null,
      name: item.awayTeam?.name || 'Away team',
      logo: item.awayTeam?.logo ?? null,
      goals: awayGoals,
      winner: null,
    },
  }
}

function mapHighlightlyEvent(item, index) {
  const rawType = item.type || 'Event'
  const type = ['Goal', 'Own Goal', 'Penalty', 'Missed Penalty'].includes(rawType)
    ? 'Goal'
    : ['Yellow Card', 'Red Card'].includes(rawType)
      ? 'Card'
      : rawType === 'Substitution'
        ? 'subst'
        : rawType.startsWith('VAR ')
          ? 'Var'
          : rawType
  const timeParts = String(item.time || '').match(/(\d+)(?:\s*\+\s*(\d+))?/)

  return {
    time: {
      elapsed: timeParts ? Number(timeParts[1]) : null,
      extra: timeParts?.[2] ? Number(timeParts[2]) : null,
    },
    team: item.team ? { id: item.team.id, name: item.team.name, logo: item.team.logo } : null,
    player: item.player ? { id: item.playerId ?? null, name: item.player } : null,
    assist: item.assist
      ? { id: item.assistingPlayerId ?? null, name: item.assist }
      : item.substituted
        ? { id: null, name: item.substituted }
        : null,
    type,
    detail: rawType,
    comments: item.comments || '',
    _highlightlyIndex: index,
  }
}

function mapHighlightlyLineups(payload) {
  return ['homeTeam', 'awayTeam'].flatMap((key) => {
    const source = payload?.[key]
    if (!source) return []
    const startXI = (source.initialLineup || []).flatMap((row, rowIndex) =>
      (Array.isArray(row) ? row : []).map((player, columnIndex) => ({
        player: {
          id: player.id ?? null,
          name: player.name || 'Unknown player',
          number: player.number ?? null,
          pos: player.position ?? null,
          grid: `${rowIndex + 1}:${columnIndex + 1}`,
          photo: player.photo ?? player.logo ?? null,
        },
      })),
    )
    const substitutes = (source.substitutes || []).map((player) => ({
      player: {
        id: player.id ?? null,
        name: player.name || 'Unknown player',
        number: player.number ?? null,
        pos: player.position ?? null,
        photo: player.photo ?? player.logo ?? null,
      },
    }))
    return [{
      team: { id: source.id ?? null, name: source.name || 'Team', logo: source.logo ?? null },
      formation: source.formation || '',
      startXI,
      substitutes,
    }]
  })
}

function mapHighlightlyStatistics(payload) {
  const statisticNames = new Map([
    ['shots on target', 'Shots on Goal'], ['shots on goal', 'Shots on Goal'],
    ['shots off target', 'Shots off Goal'], ['shots off goal', 'Shots off Goal'],
    ['total shots', 'Total Shots'], ['shots inside box', 'Shots insidebox'],
    ['shots outside box', 'Shots outsidebox'], ['corners', 'Corner Kicks'],
    ['corner kicks', 'Corner Kicks'], ['possession', 'Ball Possession'],
    ['ball possession', 'Ball Possession'], ['saves', 'Goalkeeper Saves'],
    ['goalkeeper saves', 'Goalkeeper Saves'], ['passes', 'Total passes'],
    ['total passes', 'Total passes'], ['accurate passes', 'Passes accurate'],
    ['passes accurate', 'Passes accurate'], ['pass accuracy', 'Passes %'],
    ['passes percentage', 'Passes %'], ['yellow cards', 'Yellow Cards'],
    ['red cards', 'Red Cards'], ['offsides', 'Offsides'], ['fouls', 'Fouls'],
    ['blocked shots', 'Blocked Shots'],
  ])

  return (Array.isArray(payload) ? payload : []).map((team) => ({
    team: team.team || {},
    statistics: (team.statistics || []).map((stat) => ({
      type: statisticNames.get(normalizeName(stat.displayName || stat.name)) || stat.displayName || stat.name || 'Statistic',
      value: stat.value ?? null,
    })),
  }))
}

function mapHighlightlyPlayers(payload) {
  return (Array.isArray(payload) ? payload : []).map((team) => ({
    team: { id: team.team?.id ?? null, name: team.team?.name || 'Team', logo: team.team?.logo ?? null },
    players: (team.players || []).map((player) => ({
      player: {
        id: player.id ?? null,
        name: player.name || player.fullName || 'Unknown player',
        number: player.shirtNumber ?? null,
        photo: player.logo || null,
      },
      statistics: [{
        games: { rating: player.matchRating ?? null, position: player.position ?? null },
        goals: { total: player.statistics?.[0]?.goalsScored ?? 0, assists: player.statistics?.[0]?.assists ?? 0 },
      }],
    })),
  }))
}

function todayInIndia() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

async function fetchApi(path, params) {
  const requestKey = JSON.stringify([
    path,
    Object.entries(params || {}).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  ])
  const pendingRequest = pendingApiRequests.get(requestKey)

  if (pendingRequest) return pendingRequest

  const request = footballApi.get(path, { params }).then((response) => {
    const errors = apiErrors(response.data)

    if (errors) {
      const error = new Error('API-Football returned an API error.')
      error.apiErrors = errors
      error.status = 502
      throw error
    }

    return response.data?.response ?? []
  })

  pendingApiRequests.set(requestKey, request)

  try {
    return await request
  } finally {
    if (pendingApiRequests.get(requestKey) === request) {
      pendingApiRequests.delete(requestKey)
    }
  }
}

async function fetchHighlightly(path, params = {}) {
  const requestKey = JSON.stringify(['highlightly', path, Object.entries(params).sort()])
  const pendingRequest = pendingApiRequests.get(requestKey)
  if (pendingRequest) return pendingRequest

  const request = highlightlyApi.get(path, { params }).then((response) => {
    const payload = response.data
    if (payload?.error || payload?.errors) {
      const error = new Error('Highlightly returned an API error.')
      error.status = response.status >= 400 ? response.status : 502
      throw error
    }
    return payload?.data ?? payload
  })

  pendingApiRequests.set(requestKey, request)
  try {
    return await request
  } finally {
    if (pendingApiRequests.get(requestKey) === request) {
      pendingApiRequests.delete(requestKey)
    }
  }
}

async function getHighlightlyFixtures(date) {
  const payload = await fetchHighlightly('/matches', {
    date,
    timezone: 'Asia/Kolkata',
    limit: 100,
  })
  return Array.isArray(payload) ? payload : []
}

async function getHighlightlyDetails(fixtureId, include) {
  const requested = include.filter((section) => section !== 'headtohead')
  const needsMatchRecord = requested.includes('events') || requested.includes('statistics')
  const tasks = []
  if (needsMatchRecord) tasks.push(['matchRecord', fetchHighlightly(`/matches/${fixtureId}`)])
  if (requested.includes('lineups')) tasks.push(['lineups', fetchHighlightly(`/lineups/${fixtureId}`)])
  if (requested.includes('players')) tasks.push(['players', fetchHighlightly(`/box-score/${fixtureId}`)])
  const settled = await Promise.allSettled(tasks.map(([, promise]) => promise))
  const details = {}
  const unavailable = []

  settled.forEach((result, index) => {
    const [task] = tasks[index]
    if (result.status !== 'fulfilled') {
      const failedSections = task === 'matchRecord'
        ? requested.filter((section) => section === 'events' || section === 'statistics')
        : [task]
      for (const section of failedSections) {
        details[section] = null
        unavailable.push({ section, message: 'The provider could not supply this section for the selected match.' })
      }
      return
    }
    const value = result.value
    if (task === 'matchRecord') {
      const record = value?.match || value
      if (requested.includes('events')) {
        const list = Array.isArray(record?.events) ? record.events : []
        details.events = list.map(mapHighlightlyEvent)
      }
      if (requested.includes('statistics')) {
        details.statistics = mapHighlightlyStatistics(record?.statistics)
      }
    } else if (task === 'lineups') {
      details.lineups = mapHighlightlyLineups(value)
    } else if (task === 'players') {
      details.players = mapHighlightlyPlayers(value)
    }
  })

  if (include.includes('headtohead')) {
    details.headtohead = null
    unavailable.push({
      section: 'headtohead',
      message: 'Head-to-head is not included in the current match-centre view.',
    })
  }

  return { details, unavailable }
}

function sendApiError(res, error, fallback) {
  console.error(
    `${fallback}:`,
    error.response?.status || error.message,
  )

  return res.status(error.status || 502).json({
    error: fallback,
    details:
      error.apiErrors ||
      error.response?.data?.errors ||
      undefined,
  })
}

// Home and health
app.get('/', (_req, res) => {
  res.json({
    message: 'FAD Football Analytics API is running!',
    status: 'success',
  })
})

app.get('/api/health', (_req, res) => {
  res.json({
    app: 'FAD',
    server: 'online',
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected',
    footballApiConfigured: Boolean(matchProvider()),
    matchProvider: matchProvider(),
  })
})

// Competitions
app.get('/api/competitions', (_req, res) => {
  const results = CURATED_COMPETITION_IDS.map((id) => ({
    id: Number(id),
    name: ALL_LEAGUES[id],
    category: Object.hasOwn(CLUB_LEAGUES, id) ? 'club' : 'international',
  }))

  res.json({ results, count: results.length })
})

// Players
// /api/players?league=39&season=2024&mode=scorers
// /api/players?league=39&season=2024&mode=assists
// /api/players?league=39&season=2024&mode=search&search=Haaland

app.get('/api/players', async (req, res) => {
  if (!requireApiKey(res)) return

  const league = String(req.query.league || '39')
  const season = String(req.query.season || '2024')
  const search = String(req.query.search || '').trim()
  const mode = String(req.query.mode || 'scorers').toLowerCase()

  const allowedModes = new Set(['scorers', 'assists', 'search'])

  if (!ALLOWED_LEAGUE_IDS.has(league)) {
    return res.status(400).json({
      error: 'Unsupported player competition selected.',
    })
  }

  if (!PLAYER_SEASONS.has(season)) {
    return res.status(400).json({
      error: `Choose a supported season: ${[...PLAYER_SEASONS].join(', ')}.`,
    })
  }

  if (!allowedModes.has(mode)) {
    return res.status(400).json({
      error: 'Mode must be scorers, assists, or search.',
    })
  }

  if (mode === 'search' && search.length < 3) {
    return res.status(400).json({
      error: 'Enter at least 3 characters to search for a player.',
    })
  }

  if (mode !== 'search' && search) {
    return res.status(400).json({
      error: 'Use mode=search when searching for a player.',
    })
  }

  const key = `players:${league}:${season}:${mode}:${search.toLowerCase()}`
  const cached = getCached(key)

  if (cached) {
    return res.json({ ...cached, cached: true })
  }

  try {
    let endpoint
    let params = { league, season }

    if (mode === 'scorers') {
      endpoint = '/players/topscorers'
    } else if (mode === 'assists') {
      endpoint = '/players/topassists'
    } else {
      endpoint = '/players'
      params = { ...params, search }
    }

    const data = await fetchApi(endpoint, params)
    const results = data.map(mapPlayer)

    const payload = {
      results,
      count: results.length,
      source: 'API-Football',
      league: Number(league),
      season: Number(season),
      mode,
      search: mode === 'search' ? search : null,
      cached: false,
      updatedAt: new Date().toISOString(),
    }

    saveCache(key, payload, TTL.players)
    return res.json(payload)
  } catch (error) {
    return sendApiError(
      res,
      error,
      'Could not fetch player data from API-Football.',
    )
  }
})

// Backwards-compatible player search route
app.get('/api/players/search', (req, res) => {
  const params = new URLSearchParams()

  if (req.query.name) {
    params.set('search', String(req.query.name))
    params.set('mode', 'search')
  }

  if (req.query.league) {
    params.set('league', String(req.query.league))
  }

  if (req.query.season) {
    params.set('season', String(req.query.season))
  }

  res.redirect(307, `/api/players?${params.toString()}`)
})

// League standings
app.get('/api/standings', async (req, res) => {
  const league = String(req.query.league || '39')

  if (!ALLOWED_LEAGUE_IDS.has(league)) {
    return res.status(400).json({
      error: 'Unsupported competition selected.',
    })
  }

  const feedCode = STANDINGS_FEED_CODES[league]
  const saved = await readStandingsCache()
  const previous = saved[league]
  const today = todayInIndia()

  if (NO_CURRENT_STANDINGS.has(league)) {
    return res.status(404).json({
      error: 'Copa América has no active edition or current group table in 2026.',
      source: 'CONMEBOL Copa América',
      sourceUrl: 'https://copaamerica.com/en/',
    })
  }

  if (league !== '5' && previous?.refreshedOn === today) {
    return res.json({ ...previous.payload, cached: true })
  }

  if (!feedCode && league !== '253' && league !== '307') {
    if (previous?.payload) {
      return res.json({ ...previous.payload, cached: true, stale: true })
    }
    return res.status(503).json({
      error: league === '307'
        ? 'The Saudi Pro League official page is available, but its current table feed could not be verified. No table is shown until a stable official source is available.'
        : 'A current table source is not configured for this competition yet. The free standings feed does not cover it; official-source support is planned.',
      source: 'official-source-pending',
      sourceUrl: league === '307' ? 'https://www.spl.com.sa/en/standings/index' : undefined,
    })
  }

  if (feedCode && league !== '5' && !process.env.FOOTBALL_DATA_TOKEN) {
    if (previous?.payload) {
      return res.json({ ...previous.payload, cached: true, stale: true })
    }
    return res.status(503).json({
      error: 'Set FOOTBALL_DATA_TOKEN in server/.env to enable current league standings.',
      source: 'football-data.org',
    })
  }

  const pending = pendingStandingsRequests.get(league)
  if (pending) {
    try {
      return res.json({ ...(await pending), cached: true })
    } catch {
      // The initiating request will fall back to its saved snapshot.
    }
  }

  const refresh = (async () => {
    let providerPayload
    if (league === '253') {
      providerPayload = await fetchMlsStandings()
    } else if (league === '307') {
      providerPayload = await fetchSaudiStandings()
    } else if (league === '5') {
      providerPayload = nationsLeagueSnapshot()
    } else {
      const response = await axios.get(
        `https://api.football-data.org/v4/competitions/${feedCode}/standings`,
        {
          headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_TOKEN },
          timeout: 15000,
        },
      )
      const data = response.data
      const results = standingsRows(data)
      if (!results.length) throw new Error('Standings feed returned an empty table.')
      providerPayload = {
        results,
        count: results.length,
        league: {
          id: Number(league),
          name: data.competition?.name || ALL_LEAGUES[league],
          logo: data.competition?.emblem ?? null,
          country: data.competition?.area?.name ?? null,
          season: data.season?.startDate ? Number(data.season.startDate.slice(0, 4)) : null,
          seasonStart: data.season?.startDate ?? null,
          seasonEnd: data.season?.endDate ?? null,
        },
        source: 'football-data.org',
      }
    }

    const payload = {
      ...providerPayload,
      cached: false,
      stale: false,
      updatedAt: new Date().toISOString(),
      refreshedOn: today,
    }

    saved[league] = { refreshedOn: today, payload }
    await saveStandingsCache(saved)
    return payload
  })()

  pendingStandingsRequests.set(league, refresh)
  try {
    return res.json(await refresh)
  } catch (error) {
    console.error('Standings refresh failed:', error.response?.status || error.message)
    if (previous?.payload) {
      return res.json({ ...previous.payload, cached: true, stale: true })
    }
    return res.status(502).json({
      error: `Could not refresh standings from ${league === '253' ? 'the official MLS feed' : league === '307' ? 'the official Saudi Pro League fixture feed' : 'football-data.org'}, and no saved table is available yet.`,
      source: league === '253' ? 'MLS official stats' : league === '307' ? 'Saudi Pro League official fixture results' : 'football-data.org',
    })
  } finally {
    if (pendingStandingsRequests.get(league) === refresh) {
      pendingStandingsRequests.delete(league)
    }
  }
})

// Fixtures by date
app.get('/api/matches', async (req, res) => {
  if (!requireMatchProvider(res)) return

  const date = String(req.query.date || todayInIndia())
  const league = String(req.query.league || 'all')

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      error: 'Date must use YYYY-MM-DD format.',
    })
  }

  if (!validateMatchCompetition(league)) {
    return res.status(400).json({
      error: 'Unsupported fixture competition.',
    })
  }

  const provider = matchProvider()
  const key = `fixtures:${provider}:${date}`
  let payload = getCached(key)

  if (!payload) {
    try {
      const data = provider === 'Highlightly'
        ? await getHighlightlyFixtures(date)
        : await fetchApi('/fixtures', { date, timezone: 'Asia/Kolkata' })

      const results = (provider === 'Highlightly'
        ? data.map(mapHighlightlyFixture).filter(Boolean)
        : data.map(mapFixture).filter((match) =>
          MATCH_COMPETITION_IDS.has(String(match.league.id)),
        ))

      payload = {
        results,
        count: results.length,
        date,
        source: provider,
        cached: false,
        updatedAt: new Date().toISOString(),
      }

      saveCache(key, payload, TTL.fixtures)
    } catch (error) {
      return sendApiError(
        res,
        error,
        `Could not fetch fixtures from ${provider}.`,
      )
    }
  }

  const results = filterByLeague(payload.results, league)

  return res.json({
    ...payload,
    results,
    count: results.length,
    cached: Boolean(getCached(key)),
  })
})

// Live scores
app.get('/api/matches/live', async (req, res) => {
  if (!requireMatchProvider(res)) return

  const league = String(req.query.league || 'all')

  if (!validateMatchCompetition(league)) {
    return res.status(400).json({
      error: 'Unsupported live-match competition.',
    })
  }

  const provider = matchProvider()
  const key = `live:${provider}:all`
  let payload = getCached(key)

  if (!payload) {
    try {
      const data = provider === 'Highlightly'
        ? await getHighlightlyFixtures(todayInIndia())
        : await fetchApi('/fixtures', { live: 'all', timezone: 'Asia/Kolkata' })

      const results = (provider === 'Highlightly'
        ? data.map(mapHighlightlyFixture).filter(Boolean)
        : data.map(mapFixture).filter((match) =>
          MATCH_COMPETITION_IDS.has(String(match.league.id)),
        )).filter((match) =>
          provider !== 'Highlightly' || ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(match.status),
        )

      payload = {
        results,
        count: results.length,
        source: provider,
        cached: false,
        updatedAt: new Date().toISOString(),
      }

      saveCache(key, payload, TTL.live)
    } catch (error) {
      return sendApiError(
        res,
        error,
        `Could not fetch live scores from ${provider}.`,
      )
    }
  }

  const results = filterByLeague(payload.results, league)

  return res.json({
    ...payload,
    results,
    count: results.length,
    cached: Boolean(getCached(key)),
  })
})

// Match centre details
app.get('/api/matches/:id/details', async (req, res) => {
  if (!requireMatchProvider(res)) return

  const fixtureId = String(req.params.id)

  if (!/^\d+$/.test(fixtureId)) {
    return res.status(400).json({
      error: 'Match ID must be numeric.',
    })
  }

  const allowed = new Set([
    'events',
    'lineups',
    'statistics',
    'players',
    'headtohead',
  ])

  const include = String(
    req.query.include || 'events,lineups,statistics',
  )
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(
      (part, index, list) =>
        allowed.has(part) && list.indexOf(part) === index,
    )

  if (!include.length) {
    return res.status(400).json({
      error: 'Choose supported sections: events,lineups,statistics,players,headtohead.',
    })
  }

  const key =
    `match-details:${fixtureId}:${[...include].sort().join(',')}`

  const cached = getCached(key)

  if (cached) {
    return res.json({ ...cached, cached: true })
  }

  const provider = matchProvider()
  if (provider === 'Highlightly') {
    try {
      const { details, unavailable } = await getHighlightlyDetails(fixtureId, include)
      const payload = {
        fixtureId: Number(fixtureId),
        requested: include,
        details,
        unavailable,
        source: provider,
        cached: false,
        updatedAt: new Date().toISOString(),
      }
      saveCache(key, payload, TTL.matchDetails)
      return res.json(payload)
    } catch (error) {
      return sendApiError(res, error, 'Could not fetch match details from Highlightly.')
    }
  }

  const endpoints = {
    events: ['/fixtures/events', { fixture: fixtureId }],
    lineups: ['/fixtures/lineups', { fixture: fixtureId }],
    statistics: ['/fixtures/statistics', { fixture: fixtureId }],
    players: ['/fixtures/players', { fixture: fixtureId }],
  }

  const requested = include.filter(
    (section) => section !== 'headtohead',
  )

  const tasks = requested.map((section) => [
    section,
    ...endpoints[section],
  ])

  try {
    const settled = await Promise.allSettled(
      tasks.map(([, path, params]) => fetchApi(path, params)),
    )

    const details = {}
    const unavailable = []

    settled.forEach((result, index) => {
      const section = tasks[index][0]

      if (result.status === 'fulfilled') {
        details[section] = result.value
      } else {
        details[section] = null
        unavailable.push({
          section,
          message: 'The API could not provide this section for the requested match.',
        })
      }
    })

    if (include.includes('headtohead')) {
      details.headtohead = null
      unavailable.push({
        section: 'headtohead',
        message: 'Head-to-head needs both team IDs and is not implemented in this endpoint yet.',
      })
    }

    const payload = {
      fixtureId: Number(fixtureId),
      requested: include,
      details,
      unavailable,
      source: provider,
      cached: false,
      updatedAt: new Date().toISOString(),
    }

    saveCache(key, payload, TTL.matchDetails)
    return res.json(payload)
  } catch (error) {
    return sendApiError(res, error, 'Could not fetch match details.')
  }
})

// Team season summary
app.get('/api/teams/:id', async (req, res) => {
  if (!requireApiKey(res)) return

  const teamId = String(req.params.id)
  const season = String(req.query.season || '2024')
  const league = String(req.query.league || '39')

  if (!/^\d+$/.test(teamId)) {
    return res.status(400).json({ error: 'Team ID must be numeric.' })
  }

  if (!ALLOWED_LEAGUE_IDS.has(league)) {
    return res.status(400).json({ error: 'Unsupported competition selected.' })
  }

  if (!/^\d{4}$/.test(season)) {
    return res.status(400).json({ error: 'Season must be a four-digit year.' })
  }

  const key = `team:${teamId}:${league}:${season}`
  const cached = getCached(key)

  if (cached) {
    return res.json({ ...cached, cached: true })
  }

  try {
    const [teamData, fixtureData] = await Promise.all([
      fetchApi('/teams', { id: teamId }),
      fetchApi('/fixtures', { team: teamId, league, season }),
    ])

    const team = teamData[0] || null
    const fixtures = fixtureData.map(mapFixture)
    const finished = fixtures.filter((match) =>
      ['FT', 'AET', 'PEN'].includes(match.status),
    )

    let wins = 0
    let draws = 0
    let losses = 0
    let goalsFor = 0
    let goalsAgainst = 0
    let scoresKnown = true

    for (const match of finished) {
      const isHome = String(match.home.id) === teamId
      const scored = isHome ? match.home.goals : match.away.goals
      const conceded = isHome ? match.away.goals : match.home.goals

      if (scored === null || conceded === null) {
        scoresKnown = false
        continue
      }

      goalsFor += scored
      goalsAgainst += conceded

      if (scored > conceded) wins += 1
      else if (scored === conceded) draws += 1
      else losses += 1
    }

    const payload = {
      team: team
        ? {
            id: team.team?.id ?? Number(teamId),
            name: team.team?.name ?? null,
            logo: team.team?.logo ?? null,
            country: team.team?.country ?? null,
            founded: team.team?.founded ?? null,
            national: team.team?.national ?? null,
            venue: team.venue ?? null,
          }
        : null,

      season: Number(season),
      league: {
        id: Number(league),
        name: ALL_LEAGUES[league],
      },

      record: {
        played: finished.length,
        wins,
        draws,
        losses,
        goalsFor: scoresKnown ? goalsFor : null,
        goalsAgainst: scoresKnown ? goalsAgainst : null,
        goalDifference: scoresKnown ? goalsFor - goalsAgainst : null,
      },

      fixtures,
      source: 'API-Football',
      cached: false,
      updatedAt: new Date().toISOString(),
    }

    saveCache(key, payload, TTL.team)
    return res.json(payload)
  } catch (error) {
    return sendApiError(res, error, 'Could not fetch team season data.')
  }
})

// Start server and connect MongoDB
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from server/.env')
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    })

    console.log('✅ MongoDB connected successfully')

    app.listen(PORT, () => {
      console.log(`⚽ FAD API running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Startup failed:', error.message)
    process.exit(1)
  }
}

startServer()
