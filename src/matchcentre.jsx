
import { useEffect, useState } from 'react'
import './matchcentre.css'

const API = 'http://localhost:5000'

const sectionNames = ['Timeline', 'Lineups', 'Statistics', 'Player ratings']

function formatTime(date) {
  if (!date) return 'Time unavailable'
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function matchStatus(match) {
  if (match.elapsed != null && match.elapsed >= 0) {
    return `${match.elapsed}'`
  }

  const statuses = {
    FT: 'FULL TIME',
    AET: 'AFTER EXTRA TIME',
    PEN: 'PENALTIES',
    NS: formatTime(match.date),
    HT: 'HALF TIME',
    TBD: 'TIME TBD',
    PST: 'POSTPONED',
    CANC: 'CANCELLED',
    ABD: 'ABANDONED',
  }

  return statuses[match.status] || match.statusLong || match.status || 'Scheduled'
}

function SectionMessage({ children }) {
  return <div className="mc-message">{children}</div>
}

function MatchCentre({ initialMatch = null, competitions = [] }) {
  const [league, setLeague] = useState('all')
  const [view, setView] = useState('priority')
  const [showingLive, setShowingLive] = useState(false)
  const [matches, setMatches] = useState([])
  const [selected, setSelected] = useState(initialMatch)
  const [details, setDetails] = useState(null)
  const [activeSection, setActiveSection] = useState('Timeline')
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(Boolean(initialMatch))
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadMatches() {
      setLoadingMatches(true)
      setError('')
      try {
        const getResults = async (endpoint) => {
          const response = await fetch(endpoint, { signal: controller.signal })
          const data = await response.json()
          if (!response.ok) throw new Error(data.error || 'Could not load matches.')
          if (!Array.isArray(data.results)) throw new Error('The matches API returned an unexpected response.')
          return data.results
        }
        const liveEndpoint = `${API}/api/matches/live?league=${league}`
        const todayEndpoint = `${API}/api/matches?league=${league}`
        let results
        if (view === 'priority') {
          const [liveResponse, todayResponse] = await Promise.allSettled([
            getResults(liveEndpoint),
            getResults(todayEndpoint),
          ])
          const liveResults = liveResponse.status === 'fulfilled' ? liveResponse.value : []
          const todayResults = todayResponse.status === 'fulfilled' ? todayResponse.value : []
          if (!liveResults.length && !todayResults.length
            && liveResponse.status === 'rejected' && todayResponse.status === 'rejected') {
            throw liveResponse.reason
          }
          results = liveResults.length ? liveResults : todayResults
          setShowingLive(liveResults.length > 0)
        } else if (view === 'live') {
          results = await getResults(liveEndpoint)
        } else if (view === 'today') {
          results = await getResults(todayEndpoint)
        } else {
          results = await getResults(todayEndpoint)
        }
        const sorted = [...results].sort(
          (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
        )

        setMatches(sorted)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Could not load matches.')
          setMatches([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMatches(false)
        }
      }
    }

    loadMatches()
    return () => controller.abort()
  }, [league, view])

  useEffect(() => {
    if (!selected?.id) return undefined
    const controller = new AbortController()
    fetch(`${API}/api/matches/${selected.id}/details?include=events,lineups,statistics,players`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load match details.')
        setDetails(data)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setDetailError(err.message || 'Could not load match details.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingDetails(false)
      })
    return () => controller.abort()
  }, [selected?.id])

  function openMatch(match) {
    setSelected(match)
    setDetails(null)
    setDetailError('')
    setLoadingDetails(true)
    setActiveSection('Timeline')
  }

  const matchDetails = details?.details || {}
  const events = Array.isArray(matchDetails.events)
    ? [...matchDetails.events].sort(
        (a, b) =>
          (a.time?.elapsed ?? 0) - (b.time?.elapsed ?? 0),
      )
    : []

  const lineups = Array.isArray(matchDetails.lineups)
    ? matchDetails.lineups
    : []

  const teamStats = Array.isArray(matchDetails.statistics)
    ? matchDetails.statistics
    : []

  const playerStats = Array.isArray(matchDetails.players)
    ? matchDetails.players
    : []

  const playerPhotos = new Map(
    playerStats.flatMap((team) => (team.players || [])
      .filter((entry) => entry.player?.id != null && entry.player?.photo)
      .map((entry) => [String(entry.player.id), entry.player.photo])),
  )
  const featuredPlayers = playerStats.flatMap((team) => team.players || [])
    .map((entry) => ({ ...entry.player, photo: entry.player?.photo || playerPhotos.get(String(entry.player?.id)) }))
    .filter((player) => player.id != null && player.photo)
    .slice(0, 8)

  function playerEvents(player) {
    const playerId = String(player?.id ?? '')
    if (!playerId) return []

    return events.flatMap((event, index) => {
      const minute = event.time?.elapsed == null ? '' : `${event.time.elapsed}'`
      const type = String(event.type || '').toLowerCase()
      const detail = String(event.detail || '').toLowerCase()
      if (type === 'goal' && String(event.player?.id) === playerId) {
        return [{ id: `goal-${index}`, icon: '⚽', label: `Goal${minute ? ` · ${minute}` : ''}` }]
      }
      if (type === 'goal' && String(event.assist?.id) === playerId) {
        return [{ id: `assist-${index}`, icon: '🅰', label: `Assist${minute ? ` · ${minute}` : ''}` }]
      }
      if (type === 'card' && String(event.player?.id) === playerId) {
        const red = detail.includes('red')
        return [{ id: `card-${index}`, icon: red ? '🟥' : '🟨', label: `${red ? 'Red' : 'Yellow'} card${minute ? ` · ${minute}` : ''}` }]
      }
      if (type.includes('subst') && String(event.player?.id) === playerId) {
        return [{ id: `out-${index}`, icon: '↗', label: `Substituted out${minute ? ` · ${minute}` : ''}` }]
      }
      if (type.includes('subst') && String(event.assist?.id) === playerId) {
        return [{ id: `in-${index}`, icon: '↙', label: `Substituted in${minute ? ` · ${minute}` : ''}` }]
      }
      return []
    })
  }

  function playerInitials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  }

  function renderPitchPlayer(entry, style) {
    const player = entry.player || {}
    const photo = playerPhotos.get(String(player.id)) || player.photo
    const markers = playerEvents(player)

    return (
      <div
        key={player.id || `${player.name}-${player.number}`}
        className="mc-pitch-player"
        style={style}
        title={`${player.name || 'Player'}${markers.length ? ` · ${markers.map((marker) => marker.label).join(', ')}` : ''}`}
      >
        <span className="mc-pitch-portrait">
          <span>{playerInitials(player.name || 'Player')}</span>
          {photo && <img src={photo} alt={player.name || ''} loading="lazy" onError={(event) => event.currentTarget.remove()} />}
        </span>
        {markers.length > 0 && (
          <span className="mc-player-markers">
            {markers.map((marker) => <small key={marker.id} title={marker.label}>{marker.icon}</small>)}
          </span>
        )}
        <span className="mc-pitch-player-name"><b>{player.number ?? '—'}</b> {player.name || 'Unknown player'}</span>
      </div>
    )
  }

  function renderTimeline() {
    if (!events.length) {
      return (
        <SectionMessage>
          No events are available for this match yet. Events may be missing
          for some competitions or fixtures.
        </SectionMessage>
      )
    }

    return (
      <div className="mc-timeline">
        {events.map((event, index) => {
          const minute =
            event.time?.elapsed == null
              ? '—'
              : `${event.time.elapsed}'${
                  event.time?.extra ? `+${event.time.extra}` : ''
                }`

          return (
            <div className="mc-event" key={`${minute}-${index}`}>
              <span className="mc-event-minute">{minute}</span>
              <span className="mc-event-icon">
                {event.type === 'Goal'
                  ? '⚽'
                  : event.type === 'Card'
                    ? event.detail?.toLowerCase().includes('red')
                      ? '🟥'
                      : '🟨'
                    : event.type === 'subst'
                      ? '🔄'
                      : event.type === 'Var'
                        ? '📺'
                        : '•'}
              </span>
              <div className="mc-event-copy">
                <strong>
                  {event.player?.name || event.type || 'Match event'}
                </strong>
                <span>
                  {event.detail || event.comments || event.type || 'Event'}
                </span>
                {event.assist?.name && (
                  <small>Assist: {event.assist.name}</small>
                )}
              </div>
              <span className="mc-event-team">
                {event.team?.name || ''}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  function renderLineups() {
    if (!lineups.length) {
      return (
        <SectionMessage>
          Lineups are not available yet. They are generally supplied closer
          to kickoff and may be unavailable for some fixtures.
        </SectionMessage>
      )
    }

    return (
      <div className="mc-lineup-grid">
        <div className="mc-lineup-legend">
          <span>⚽ Goal</span><span>🅰 Assist</span><span>🟨 Yellow card</span><span>🟥 Red card</span><span>↙ In</span><span>↗ Out</span>
        </div>
        {lineups.map((team, index) => {
          const starters = team.startXI || []
          const gridRows = starters.map((entry) => Number(String(entry.player?.grid || '').split(':')[0])).filter(Number.isFinite)
          const maxRow = Math.max(1, ...gridRows)
          const hasCompleteGrid = starters.every((entry) => String(entry.player?.grid || '').split(':').length === 2 && String(entry.player.grid).split(':').every((part) => Number(part) > 0))
          const formationRows = String(team.formation || '4-3-3').split('-').map(Number).filter((value) => value > 0)
          const fallbackCounts = [1, ...formationRows]

          return (
            <section className="mc-lineup-card" key={team.team?.id || index}>
              <div className="mc-lineup-heading">
                {team.team?.logo && <img src={team.team.logo} alt="" />}
                <div>
                  <strong>{team.team?.name || 'Team'}</strong>
                  <span>Starting formation · {team.formation || 'Not supplied'}</span>
                </div>
              </div>

              {starters.length ? (
                <div className="mc-tactical-pitch">
                  <div className="mc-pitch-markings">
                    <span className="mc-pitch-halfway" />
                    <span className="mc-pitch-circle" />
                    <span className="mc-pitch-box top" />
                    <span className="mc-pitch-box bottom" />
                    <span className="mc-pitch-goal top" />
                    <span className="mc-pitch-goal bottom" />
                  </div>
                  {starters.map((entry, playerIndex) => {
                    const parts = String(entry.player?.grid || '').split(':').map(Number)
                    let row = parts[0]
                    let column = parts[1]
                    if (!row || !column) {
                      let remaining = playerIndex
                      row = 1
                      while (row < fallbackCounts.length && remaining >= fallbackCounts[row - 1]) {
                        remaining -= fallbackCounts[row - 1]
                        row += 1
                      }
                      column = remaining + 1
                    }
                    const rowPlayers = starters.filter((candidate) => Number(String(candidate.player?.grid || '').split(':')[0]) === row)
                    const rowColumnCount = Math.max(1, ...rowPlayers.map((candidate) => Number(String(candidate.player?.grid || '').split(':')[1]) || 0))
                    const rowCount = rowPlayers.length || fallbackCounts[row - 1] || 1
                    const left = parts[0] && parts[1]
                      ? `${(column / (rowColumnCount + 1)) * 100}%`
                      : `${((column) / (rowCount + 1)) * 100}%`
                    const top = `${100 - ((row - 0.5) / (hasCompleteGrid ? maxRow : fallbackCounts.length)) * 100}%`
                    return renderPitchPlayer(entry, { left, top })
                  })}
                </div>
              ) : (
                <SectionMessage>Starting XI is not available for this match yet.</SectionMessage>
              )}

              <div className="mc-bench-heading">
                <strong>Substitutes</strong>
                <span>In/out markers appear when recorded in match events</span>
              </div>
              {(team.substitutes || []).length ? (
                <div className="mc-bench-list">
                  {team.substitutes.map((entry, subIndex) => {
                    const player = entry.player || {}
                    const photo = playerPhotos.get(String(player.id)) || player.photo
                    const markers = playerEvents(player)
                    return (
                      <div className="mc-bench-player" key={player.id || subIndex}>
                        {photo ? <img src={photo} alt="" loading="lazy" /> : <span className="mc-bench-initials">{playerInitials(player.name || '?')}</span>}
                        <div><strong>{player.number != null ? `${player.number} · ` : ''}{player.name || 'Unknown player'}</strong><small>{player.pos || 'Substitute'}</small></div>
                        <span className="mc-bench-events">{markers.map((marker) => <small key={marker.id} title={marker.label}>{marker.icon}</small>)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="mc-muted">Substitutes unavailable.</p>}
            </section>
          )
        })}
      </div>
    )
  }

  function renderStatistics() {
    if (!teamStats.length) {
      return (
        <SectionMessage>
          Team statistics are unavailable for this fixture.
        </SectionMessage>
      )
    }

    const homeStats = teamStats[0]?.statistics || []
    const awayStats = teamStats[1]?.statistics || []

    const getValue = (list, type) =>
      list.find((item) => item.type === type)?.value ?? null

    const types = [
      'Shots on Goal',
      'Shots off Goal',
      'Total Shots',
      'Blocked Shots',
      'Shots insidebox',
      'Shots outsidebox',
      'Fouls',
      'Corner Kicks',
      'Offsides',
      'Ball Possession',
      'Yellow Cards',
      'Red Cards',
      'Goalkeeper Saves',
      'Total passes',
      'Passes accurate',
      'Passes %',
    ]

    return (
      <div className="mc-statistics">
        <div className="mc-stat-team-head">
          <span>{teamStats[0]?.team?.name || 'Home'}</span>
          <span>{teamStats[1]?.team?.name || 'Away'}</span>
        </div>

        {types.map((type) => {
          const home = getValue(homeStats, type)
          const away = getValue(awayStats, type)

          if (home == null && away == null) return null

          const numeric = (value) =>
            Number(String(value ?? '').replace('%', '')) || 0

          const a = numeric(home)
          const b = numeric(away)
          const total = a + b || 1

          return (
            <div className="mc-stat-row" key={type}>
              <div className="mc-stat-values">
                <strong>{home ?? '—'}</strong>
                <span>{type}</span>
                <strong>{away ?? '—'}</strong>
              </div>
              <div className="mc-stat-bars">
                <div className="mc-stat-track">
                  <span
                    className="mc-stat-fill home"
                    style={{ width: `${(a / total) * 100}%` }}
                  />
                </div>
                <div className="mc-stat-track">
                  <span
                    className="mc-stat-fill away"
                    style={{ width: `${(b / total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function renderPlayerRatings() {
    if (!playerStats.length) {
      return (
        <SectionMessage>
          Individual match ratings are unavailable for this fixture.
        </SectionMessage>
      )
    }

    return (
      <div className="mc-player-ratings">
        {playerStats.map((team, index) => (
          <section className="mc-rating-team" key={team.team?.id || index}>
            <h3>{team.team?.name || 'Team'}</h3>
            {(team.players || []).map((entry, playerIndex) => {
              const player = entry.player || {}
              const stats = entry.statistics?.[0] || {}
              const rating = stats.games?.rating

              return (
                <div
                  className="mc-rating-row"
                  key={player.id || playerIndex}
                >
                  {player.photo ? (
                    <img src={player.photo} alt="" />
                  ) : (
                    <span className="mc-rating-number">
                      {player.number ?? '—'}
                    </span>
                  )}
                  <div className="mc-rating-name">
                    <strong>{player.name || 'Unknown player'}</strong>
                    <small>
                      {stats.games?.position || 'Position unavailable'}
                    </small>
                  </div>
                  <b>
                    {rating != null && rating !== ''
                      ? Number(rating).toFixed(1)
                      : '—'}
                  </b>
                </div>
              )
            })}
          </section>
        ))}
      </div>
    )
  }

  function renderActiveSection() {
    if (loadingDetails) {
      return <SectionMessage>Loading match details…</SectionMessage>
    }

    if (detailError) {
      return <SectionMessage>{detailError}</SectionMessage>
    }

    if (!details) {
      return (
        <SectionMessage>
          Select a match to load its timeline, lineups and statistics.
        </SectionMessage>
      )
    }

    if (activeSection === 'Timeline') return renderTimeline()
    if (activeSection === 'Lineups') return renderLineups()
    if (activeSection === 'Statistics') return renderStatistics()
    return renderPlayerRatings()
  }

  return (
    <div className="mc-page">
      <div className="mc-header">
        <div>
          <p className="mc-eyebrow">FAD / LIVE DATA</p>
          <h2>Match Centre</h2>
          <p className="mc-subtitle">
            Scores, events, lineups and match statistics in one place.
          </p>
        </div>
        <span className="mc-live-badge">
          <i /> API CONNECTED
        </span>
      </div>

      <div className="mc-toolbar">
        <div className="mc-view-switch">
          <button
            className={view === 'live' || (view === 'priority' && showingLive) ? 'active' : ''}
            onClick={() => setView('live')}
          >
            Live matches
          </button>
          <button
            className={view === 'today' || (view === 'priority' && !showingLive) ? 'active' : ''}
            onClick={() => setView('today')}
          >
            Today's fixtures
          </button>
        </div>

        <select
          value={league}
          onChange={(event) => {
            setLeague(event.target.value)
            setView('priority')
          }}
          aria-label="Select competition"
        >
          {[{ id: 'all', name: 'All competitions' }, ...competitions].map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {error && <SectionMessage>{error}</SectionMessage>}

      <div className="mc-layout">
        <aside className="mc-match-list">
          <div className="mc-list-heading">
            <strong>{view === 'live' || (view === 'priority' && showingLive)
              ? 'Live scoreboard'
              : "Today's fixtures"}</strong>
            <span>{loadingMatches ? 'Loading…' : `${matches.length} matches`}</span>
          </div>

          {!loadingMatches && !error && matches.length === 0 && (
            <SectionMessage>
              {view === 'live' || (view === 'priority' && showingLive)
                ? 'No live matches are currently returned for this competition. Try Today’s fixtures.'
                : 'No fixtures were returned for this competition today.'}
            </SectionMessage>
          )}

          {matches.map((match) => (
            <button
              type="button"
              key={match.id}
              className={`mc-match-card ${
                selected?.id === match.id ? 'selected' : ''
              }`}
              onClick={() => openMatch(match)}
            >
              <span className="mc-card-league">
                {match.league?.name || 'Competition'}
              </span>
              <span className="mc-card-team">
                {match.home.logo && <img src={match.home.logo} alt="" />}
                <strong>{match.home.name}</strong>
                <b>{match.home.goals ?? '—'}</b>
              </span>
              <span className="mc-card-team">
                {match.away.logo && <img src={match.away.logo} alt="" />}
                <strong>{match.away.name}</strong>
                <b>{match.away.goals ?? '—'}</b>
              </span>
              <span className="mc-card-status">
                {matchStatus(match)}
              </span>
              {selected?.id === match.id && featuredPlayers.length > 0 && (
                <span className="mc-card-players" aria-label="Available player photos">
                  {featuredPlayers.slice(0, 5).map((player) => <img key={player.id} src={player.photo} alt={player.name || 'Player'} title={player.name} loading="lazy" />)}
                </span>
              )}
            </button>
          ))}
        </aside>

        <section className="mc-details">
          {!selected ? (
            <SectionMessage>
              Choose a match from the left to open its match centre.
            </SectionMessage>
          ) : (
            <>
              <div className="mc-scoreboard">
                <div className="mc-score-meta">
                  <span>{selected.league?.name || 'Football match'}{selected.league?.round ? ` · ${selected.league.round}` : ''}</span>
                  <strong className={['1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT'].includes(selected.status) ? 'is-live' : ''}>
                    {['1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT'].includes(selected.status) ? '● LIVE' : matchStatus(selected)}
                  </strong>
                </div>
                <div className="mc-score-team">
                  {selected.home.logo && (
                    <img src={selected.home.logo} alt="" />
                  )}
                  <strong>{selected.home.name}</strong>
                </div>

                <div className="mc-score-middle">
                  <strong>
                    {selected.home.goals ?? '—'}
                    <i>:</i>
                    {selected.away.goals ?? '—'}
                  </strong>
                  <small>{formatTime(selected.date)}{selected.venue ? ` · ${selected.venue}` : ''}</small>
                </div>

                <div className="mc-score-team">
                  {selected.away.logo && (
                    <img src={selected.away.logo} alt="" />
                  )}
                  <strong>{selected.away.name}</strong>
                </div>
                {featuredPlayers.length > 0 && (
                  <div className="mc-featured-players" aria-label="Players available for this match">
                    {featuredPlayers.map((player) => (
                      <span key={player.id} title={player.name}>
                        <img src={player.photo} alt={player.name || 'Player'} loading="lazy" />
                        <small>{player.name}</small>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mc-tabs">
                {sectionNames.map((section) => (
                  <button
                    key={section}
                    className={activeSection === section ? 'active' : ''}
                    onClick={() => setActiveSection(section)}
                  >
                    {section}
                  </button>
                ))}
              </div>

              <div className="mc-section-content">
                {renderActiveSection()}
              </div>
            </>
          )}
        </section>
      </div>

      <p className="mc-footnote">
        Match information is supplied by API-Football. Availability varies by
        competition, fixture and subscription coverage. Missing statistics
        are shown as unavailable rather than estimated.
      </p>
    </div>
  )
}

export default MatchCentre
