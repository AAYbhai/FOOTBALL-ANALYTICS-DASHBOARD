
import { useEffect, useMemo, useState } from 'react'
import './DreamXI.css'
import { STRIKERS } from './data/strikers.js'
import { ALL_TIME_POSITION_PLAYERS } from './data/allTimePositionPlayers.js'
import clubLegendPortraitManifest from './assets/club-legends/manifest.json'
import fallbackPlayerPortrait from './assets/player-portrait-fallback.svg'
import { hasTrophyHistory } from './utils/playerTrophies.js'

const clubLegendPortraitAssets = import.meta.glob('./assets/club-legends/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const playerNameKey = (name = '') => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const playerProfileKey = (name = '') => playerNameKey(name.replace(/\s+Jr\.?$/i, ''))
const LOCAL_PLAYER_PORTRAITS = Object.fromEntries(Object.entries(clubLegendPortraitManifest).flatMap(([name, entry]) => {
  const file = typeof entry === 'string' ? entry : entry.file
  const image = clubLegendPortraitAssets[`./assets/club-legends/${file.slice(2)}`]
  return image ? [[playerNameKey(name), image]] : []
}))

const FORMATIONS = {
  '4-3-3': [1, 4, 3, 3],
  '4-2-3-1': [1, 4, 2, 3, 1],
  '4-4-2': [1, 4, 4, 2],
  '3-5-2': [1, 3, 5, 2],
  '3-4-3': [1, 3, 4, 3],
  '5-3-2': [1, 5, 3, 2],
}

// These are historical examples used to keep the picker immediately usable.
const INITIAL_PLAYERS = [
  { id: 'r1', name: 'Cristiano Ronaldo', team: 'Real Madrid', position: 'Attacker' },
  { id: 'r2', name: 'Lionel Messi', team: 'Barcelona', position: 'Attacker' },
  { id: 'r3', name: 'Zinedine Zidane', team: 'Real Madrid', position: 'Midfielder' },
  { id: 'r4', name: 'Ronaldinho', team: 'Barcelona', position: 'Midfielder' },
  { id: 'r5', name: 'Ronaldo Nazario', team: 'Real Madrid', position: 'Attacker' },
  { id: 'r6', name: 'Kaka', team: 'AC Milan', position: 'Midfielder' },
  { id: 'r7', name: 'Andres Iniesta', team: 'Barcelona', position: 'Midfielder' },
  { id: 'r8', name: 'Xavi', team: 'Barcelona', position: 'Midfielder' },
  { id: 'r9', name: 'Sergio Ramos', team: 'Real Madrid', position: 'Defender' },
  { id: 'r10', name: 'Paolo Maldini', team: 'AC Milan', position: 'Defender' },
  { id: 'r11', name: 'Iker Casillas', team: 'Real Madrid', position: 'Goalkeeper' },
  { id: 'r12', name: 'Luka Modric', team: 'Real Madrid', position: 'Midfielder' },
  { id: 'r13', name: 'Karim Benzema', team: 'Real Madrid', position: 'Attacker' },
  { id: 'r14', name: 'Neymar Jr', team: 'Barcelona', position: 'Attacker' },
  { id: 'r15', name: 'Thierry Henry', team: 'Arsenal', position: 'Attacker' },
  { id: 'r16', name: 'Wayne Rooney', team: 'Manchester United', position: 'Attacker' },
  { id: 'r17', name: 'Steven Gerrard', team: 'Liverpool', position: 'Midfielder' },
  { id: 'r18', name: 'Frank Lampard', team: 'Chelsea', position: 'Midfielder' },
  { id: 'r19', name: 'Virgil van Dijk', team: 'Liverpool', position: 'Defender' },
  { id: 'r20', name: 'Manuel Neuer', team: 'Bayern Munich', position: 'Goalkeeper' },
]

function emptyTeam() {
  return Array(11).fill(null)
}

function formationPositions(formation) {
  const rows = FORMATIONS[formation] || FORMATIONS['4-3-3']
  const positions = []
  let slot = 0

  rows.forEach((count, rowIndex) => {
    for (let i = 0; i < count; i++) {
      positions.push({
        slot: slot++,
        row: rowIndex,
        count,
        index: i,
        totalRows: rows.length,
        role:
          rowIndex === 0
            ? 'Goalkeeper'
            : rowIndex === 1
              ? 'Defender'
              : rowIndex === rows.length - 1
                ? 'Attacker'
                : 'Midfielder',
      })
    }
  })

  return positions
}

function playerFitsRole(player, slotRole) {
  const position = String(player.position || '').toLowerCase()
  if (slotRole === 'Goalkeeper') return position.includes('goalkeeper')
  if (slotRole === 'Defender') return position.includes('defender') || position.includes('back')
  if (slotRole === 'Midfielder') return position.includes('midfielder')
  if (slotRole === 'Attacker') return ['attacker', 'striker', 'forward', 'winger'].some((role) => position.includes(role))
  return true
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function PlayerPortrait({ player, small = false }) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [player?.id, player?.photo])

  return (
    <span className={`xi-portrait ${small ? 'xi-portrait-small' : ''}`}>
      {player?.photo && !imageFailed ? (
        <img
          src={player.photo}
          alt={player.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="xi-portrait-fallback">
          {initials(player?.name || '?')}
        </span>
      )}
    </span>
  )
}

function TeamPitch({ name, formation, lineup, onSelect, onClear, tone }) {
  const positions = formationPositions(formation)

  return (
    <section className={`xi-team-card ${tone}`}>
      <div className="xi-team-heading">
        <div>
          <p className="xi-eyebrow">YOUR SQUAD</p>
          <h2>{name || 'Unnamed team'}</h2>
        </div>
        <span className="xi-player-count">
          {lineup.filter(Boolean).length}/11
        </span>
      </div>

      <div className="xi-pitch">
        <div className="xi-pitch-lines">
          <div className="xi-halfway" />
          <div className="xi-centre-circle" />
          <div className="xi-penalty top" />
          <div className="xi-penalty bottom" />
          <div className="xi-small-box top" />
          <div className="xi-small-box bottom" />
        </div>

        <div className="xi-formation">
          {positions.map((position) => {
            const player = lineup[position.slot]
            const left = ((position.index + 1) / (position.count + 1)) * 100
            const top =
              ((position.totalRows - position.row - 0.5) /
                position.totalRows) *
              100

            return (
              <button
                key={position.slot}
                type="button"
                className={`xi-position ${player ? 'filled' : 'empty'}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                onClick={() => onSelect(position.slot, position.role)}
                title={player ? `Change ${player.name}` : `Select ${position.role}`}
              >
                {player ? (
                  <PlayerPortrait player={player} />
                ) : (
                  <span className="xi-shirt">+</span>
                )}

                <span className="xi-position-name">
                  {player ? player.name : position.role}
                </span>

              </button>
            )
          })}
        </div>
      </div>

      <div className="xi-pitch-footer">
        <span>Formation: {formation}</span>
        <button type="button" onClick={onClear}>Clear team</button>
      </div>
    </section>
  )
}

function teamTotals(lineup) {
  const chosen = lineup.filter(Boolean)

  const sumKnown = (field) => {
    const values = chosen
      .map((player) => player[field])
      .filter((value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)))

    return {
      total: values.length ? values.reduce((sum, value) => sum + Number(value), 0) : null,
      known: values.length,
    }
  }

  const goalTotals = sumKnown('careerGoals')
  const appearanceTotals = sumKnown('careerAppearances')
  const trophyPlayers = chosen.filter(hasTrophyHistory)
  const trophyCount = trophyPlayers.reduce(
    (sum, player) => sum + player.trophies.filter((trophy) => trophy.type !== 'individual').length,
    0,
  )

  return {
    chosen,
    goals: goalTotals.total,
    goalsKnown: goalTotals.known,
    appearances: appearanceTotals.total,
    appearancesKnown: appearanceTotals.known,
    trophies: trophyPlayers.length ? trophyCount : null,
    trophiesKnown: trophyPlayers.length,
  }
}

function displayNumber(value) {
  return value == null ? 'Unavailable' : value.toLocaleString()
}

function listedTrophyCount(player) {
  return hasTrophyHistory(player)
    ? player.trophies.filter((item) => item.type !== 'individual').length
    : null
}

function TeamMetrics({ name, lineup, onViewTrophies }) {
  const totals = teamTotals(lineup)

  return (
    <div className="xi-metric-card">
      <h3>{name || 'Unnamed team'}</h3>

      <div className="xi-metric-grid">
        <div>
          <span>Players selected</span>
          <strong>{totals.chosen.length}/11</strong>
        </div>
        <div>
          <span>All-time career goals</span>
          <strong>{displayNumber(totals.goals)}</strong>
          {totals.goalsKnown > 0 && totals.goalsKnown < totals.chosen.length && (
            <small>{totals.goalsKnown}/{totals.chosen.length} player records</small>
          )}
        </div>
        <div>
          <span>Career appearances</span>
          <strong>{displayNumber(totals.appearances)}</strong>
          {totals.appearancesKnown > 0 && totals.appearancesKnown < totals.chosen.length && (
            <small>{totals.appearancesKnown}/{totals.chosen.length} player records</small>
          )}
        </div>
        <div>
          <span>Listed team trophies</span>
          <strong>{displayNumber(totals.trophies)}</strong>
          {totals.trophiesKnown > 0 && totals.trophiesKnown < totals.chosen.length && (
            <small>{totals.trophiesKnown}/{totals.chosen.length} player records</small>
          )}
        </div>
      </div>

      <button
        type="button"
        className="xi-trophy-details-button"
        onClick={onViewTrophies}
      >
        View trophy details →
      </button>

    </div>
  )
}

function TrophyDetails({ name, lineup, onClose }) {
  const players = lineup.filter(Boolean)

  return (
    <div className="xi-modal-backdrop" onClick={onClose}>
      <section
        className="xi-picker xi-trophy-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${name} trophy details`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="xi-picker-heading">
          <div>
            <p className="xi-eyebrow">HONOURS BREAKDOWN</p>
            <h2>{name || 'Unnamed team'} — Trophies</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close trophy details">
            ✕
          </button>
        </div>

        <div className="xi-trophy-list">
          {!players.length ? (
            <p className="xi-empty">Add players to this team to view their honours.</p>
          ) : (
            players.map((player) => (
              <article className="xi-trophy-player" key={player.id}>
                <div className="xi-trophy-player-heading">
                  <PlayerPortrait player={player} small />
                  <div>
                    <strong>{player.name}</strong>
                    <small>{player.team || 'Club unavailable'} · {listedTrophyCount(player) ?? 'Trophy record unavailable'} listed titles</small>
                  </div>
                </div>

                {hasTrophyHistory(player) && player.trophies.length ? (
                  <ul>
                    {player.trophies.map((trophy, index) => (
                      <li key={`${player.id}-${trophy.name}-${index}`}>
                        <span>{trophy.name}</span>
                        <small>
                          {[trophy.category, trophy.season || trophy.year, trophy.wonWith || trophy.club]
                            .filter(Boolean)
                            .join(' · ') || 'Details unavailable'}
                        </small>
                        {trophy.type === 'individual' && (
                          <em>Individual award</em>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : hasTrophyHistory(player) ? (
                  <p className="xi-unavailable">
                    No trophies from the selected categories are recorded for this player.
                  </p>
                ) : (
                  <p className="xi-unavailable">
                    Verified trophy history has not been added for this player yet.
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default function DreamXI() {
  const playerProfiles = new Map()
  ;[...STRIKERS, ...ALL_TIME_POSITION_PLAYERS].forEach((profile) => {
    const key = playerProfileKey(profile.name)
    const previous = playerProfiles.get(key)
    const hasMoreData = (profile.career?.goals != null || profile.career?.appearances != null || hasTrophyHistory(profile))
    const previousHasData = previous && (previous.career?.goals != null || previous.career?.appearances != null || hasTrophyHistory(previous))
    if (!previous || hasMoreData || !previousHasData) playerProfiles.set(key, profile)
  })

  const exampleKeys = new Set(INITIAL_PLAYERS.map((player) => playerProfileKey(player.name)))
  const players = [
    ...INITIAL_PLAYERS.map((example) => {
      const profile = playerProfiles.get(playerProfileKey(example.name))
      return {
        ...profile,
        ...example,
        careerGoals: profile?.career?.goals ?? null,
        careerAppearances: profile?.career?.appearances ?? null,
        goals: profile?.career?.goals ?? example.goals ?? null,
        appearances: profile?.career?.appearances ?? example.appearances ?? null,
        trophies: profile?.trophies || null,
        trophyStatus: profile?.trophyStatus || 'unverified',
        photo: LOCAL_PLAYER_PORTRAITS[playerNameKey(example.name)] || fallbackPlayerPortrait,
      }
    }),
    ...[...playerProfiles.values()]
      .filter((player) => !exampleKeys.has(playerProfileKey(player.name)))
      .map((player) => ({
        id: player.id,
        name: player.name,
        team: player.clubs?.[0]?.name || 'Career legend',
        position: player.role || 'Attacker',
        goals: player.career?.goals ?? null,
        appearances: player.career?.appearances ?? null,
        careerGoals: player.career?.goals ?? null,
        careerAppearances: player.career?.appearances ?? null,
        photo: LOCAL_PLAYER_PORTRAITS[playerNameKey(player.name)] || fallbackPlayerPortrait,
        trophies: player.trophies || null,
        trophyStatus: player.trophyStatus || 'unverified',
      })),
  ]
  const [teamA, setTeamA] = useState(emptyTeam)
  const [teamB, setTeamB] = useState(emptyTeam)
  const [formationA, setFormationA] = useState('4-3-3')
  const [formationB, setFormationB] = useState('4-2-3-1')
  const [nameA, setNameA] = useState('Team A')
  const [nameB, setNameB] = useState('Team B')
  const [activeTeam, setActiveTeam] = useState('A')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedRole, setSelectedRole] = useState('Unknown')
  const [search, setSearch] = useState('')
  const [trophyTeam, setTrophyTeam] = useState(null)
  const sourceMessage = 'Includes the curated striker records, all-time position groups and historical examples.'

  const currentLineup = activeTeam === 'A' ? teamA : teamB

  const eligiblePlayers = useMemo(() => {
    const query = search.toLowerCase().trim()
    const otherTeam = activeTeam === 'A' ? teamB : teamA

    return players.filter((player) => {
      const inCurrent = currentLineup.some(
        (selected) => selected && String(selected.id) === String(player.id),
      )
      const inOther = otherTeam.some(
        (selected) => selected && String(selected.id) === String(player.id),
      )
      const matchesSearch =
        !query ||
        `${player.name} ${player.team || ''} ${player.position || ''}`
          .toLowerCase()
          .includes(query)

      return !inCurrent && !inOther && matchesSearch && playerFitsRole(player, selectedRole)
    })
  }, [players, search, activeTeam, currentLineup, teamA, teamB, selectedRole])

  function openPlayerPicker(team, slot, role) {
    setActiveTeam(team)
    setSelectedSlot(slot)
    setSelectedRole(role)
    setSearch('')
  }

  function choosePlayer(player) {
    const setter = activeTeam === 'A' ? setTeamA : setTeamB

    setter((current) => {
      const next = [...current]
      next[selectedSlot] = {
        ...player,
        // Explicitly preserve the separate career fields.
        careerGoals: player.careerGoals ?? null,
        careerAppearances: player.careerAppearances ?? null,
        trophies: player.trophies ?? null,
      }
      return next
    })

    setSelectedSlot(null)
  }

  function clearTeam(team) {
    if (team === 'A') setTeamA(emptyTeam())
    else setTeamB(emptyTeam())
  }

  function changeFormation(team, formation) {
    if (team === 'A') setFormationA(formation)
    else setFormationB(formation)
  }

  function swapTeams() {
    setTeamA(teamB)
    setTeamB(teamA)
    setFormationA(formationB)
    setFormationB(formationA)
    setNameA(nameB)
    setNameB(nameA)
  }

  function resetTeams() {
    setTeamA(emptyTeam())
    setTeamB(emptyTeam())
    setSelectedSlot(null)
    setTrophyTeam(null)
  }

  return (
    <div className="xi-page">
      <header className="xi-header">
        <div>
          <p className="xi-eyebrow">FAD / SQUAD LAB</p>
          <h1>Dream XI Builder</h1>
          <p className="xi-subtitle">
            Build two football XIs, choose formations, and compare all-time squads.
          </p>
        </div>
        <span className="xi-badge">⚽ INTERACTIVE BUILDER</span>
      </header>

      <div className="xi-controls">
        <label>
          Team A name
          <input value={nameA} onChange={(event) => setNameA(event.target.value)} maxLength={28} />
        </label>

        <label>
          Formation
          <select value={formationA} onChange={(event) => changeFormation('A', event.target.value)}>
            {Object.keys(FORMATIONS).map((formation) => (
              <option key={formation}>{formation}</option>
            ))}
          </select>
        </label>

        <button type="button" className="xi-swap" onClick={swapTeams}>
          ⇄ Swap teams
        </button>

        <label>
          Team B name
          <input value={nameB} onChange={(event) => setNameB(event.target.value)} maxLength={28} />
        </label>

        <label>
          Formation
          <select value={formationB} onChange={(event) => changeFormation('B', event.target.value)}>
            {Object.keys(FORMATIONS).map((formation) => (
              <option key={formation}>{formation}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="xi-pitch-grid">
        <TeamPitch
          name={nameA}
          formation={formationA}
          lineup={teamA}
          tone="xi-green"
          onSelect={(slot, role) => openPlayerPicker('A', slot, role)}
          onClear={() => clearTeam('A')}
        />

        <TeamPitch
          name={nameB}
          formation={formationB}
          lineup={teamB}
          tone="xi-blue"
          onSelect={(slot, role) => openPlayerPicker('B', slot, role)}
          onClear={() => clearTeam('B')}
        />
      </div>

      <section className="xi-comparison">
        <div className="xi-section-heading">
          <div>
            <p className="xi-eyebrow">HEAD TO HEAD</p>
            <h2>Team comparison</h2>
          </div>
          <button type="button" onClick={resetTeams}>Reset both teams</button>
        </div>

        <div className="xi-metrics-grid">
          <TeamMetrics
            name={nameA}
            lineup={teamA}
            onViewTrophies={() => setTrophyTeam({ name: nameA, lineup: teamA })}
          />
          <TeamMetrics
            name={nameB}
            lineup={teamB}
            onViewTrophies={() => setTrophyTeam({ name: nameB, lineup: teamB })}
          />
        </div>
      </section>

      {selectedSlot !== null && (
        <div className="xi-modal-backdrop" onClick={() => setSelectedSlot(null)}>
          <section
            className="xi-picker"
            role="dialog"
            aria-modal="true"
            aria-label="Choose a player"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="xi-picker-heading">
              <div>
                <p className="xi-eyebrow">SELECT PLAYER</p>
                <h2>{selectedRole} · {activeTeam === 'A' ? nameA : nameB}</h2>
              </div>
              <button type="button" onClick={() => setSelectedSlot(null)} aria-label="Close player picker">
                ✕
              </button>
            </div>

            <input
              className="xi-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search player or club…"
              autoFocus
            />

            <p className="xi-source-message">{sourceMessage}</p>

            <div className="xi-player-list">
              {eligiblePlayers.length ? (
                eligiblePlayers.map((player) => (
                  <article className="xi-player-option-card" key={player.id}>
                    <button
                      type="button"
                      className="xi-player-option"
                      onClick={() => choosePlayer(player)}
                    >
                      <PlayerPortrait player={player} small />
                      <span className="xi-option-copy">
                        <strong>{player.name}</strong>
                        <small>{player.team || 'Club unavailable'} · {player.position || 'Position unavailable'}</small>
                      </span>
                      <span className="xi-option-stats">
                        <span>{displayNumber(player.careerGoals)} goals</span>
                        <span>{displayNumber(player.careerAppearances)} appearances</span>
                        <span>{displayNumber(listedTrophyCount(player))} trophies</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="xi-option-trophies"
                      onClick={() => setTrophyTeam({ name: player.name, lineup: [player] })}
                    >
                      View honours
                    </button>
                  </article>
                ))
              ) : (
                <p className="xi-empty">
                  No available players found. Search another name or clear one of the teams.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {trophyTeam && (
        <TrophyDetails
          name={trophyTeam.name}
          lineup={trophyTeam.lineup}
          onClose={() => setTrophyTeam(null)}
        />
      )}
    </div>
  )
}
