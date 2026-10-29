const INTERNATIONAL_CUP = /world cup|european championship|euros|nations league|copa am[eé]rica|africa cup of nations|asian cup|gold cup|ofc nations cup|confederations cup/i
const UEFA_CLUB = /^(?:uefa )?(?:champions league|european cup|cup winners(?:'|’)? cup|europa league|uefa cup|conference league|super cup|intertoto cup)$/i
const WORLD_CLUB = /^(?:fifa )?club world cup$|^(?:fifa )?intercontinental cup$/i
const DOMESTIC_CUP = /^(?:league cup|efl cup|carabao cup|fa cup|copa del rey|coppa italia|copa do brasil|coupe de france|dfb-pokal|dfl-pokal|community shield|supercopa|supercoppa|superta[cç]a|troph[eé]e des champions)$/i
const LEAGUE = /^(?:premier league|english first division|la liga|serie a|bundesliga|ligue 1|french league|eredivisie|primeira liga|s[aã]o paulo state league|campeonato brasileiro s[eé]rie a|brasileir[aã]o|argentine primera divisi[oó]n|major league soccer|saudi pro league|russian premier league|soviet top league|scottish premiership|scottish football league|turkish super lig|super lig|jupiler pro league|belgian first division|greek super league|liga portugal|championnat de france|division 1|serie a brazil|campeonato carioca|campeonato paulista|campeonato uruguaio|yugoslav first league|primera divisi[oó]n)$/i
const SUPER_CUP = /super cup|supercopa|supercoppa|superta[cç]a|troph[eé]e des champions|community shield/i
const CONTINENTAL_CLUB = /copa libertadores|recopa|caf champions|afc champions|concacaf champions|intercontinental cup|club world cup/i

function categoryFor(name) {
  if (INTERNATIONAL_CUP.test(name)) return 'International cups'
  if (SUPER_CUP.test(name)) return 'Super cups'
  if (UEFA_CLUB.test(name) || CONTINENTAL_CLUB.test(name)) return 'Continental club trophies'
  if (LEAGUE.test(name)) return 'Leagues'
  return 'Domestic cups and other major trophies'
}

const MAJOR_TROPHY = /^(?:fifa )?world cup$|^(?:uefa )?(?:european championship|european football championship|euros|nations league)$|^copa am[eé]rica$|^africa cup of nations$|^(?:afc )?asian cup$|^(?:concacaf )?gold cup$|^ofc nations cup$|^fifa confederations cup$/i

export function isMajorTrophy(trophy) {
  if (!trophy) return false
  const name = typeof trophy === 'string' ? trophy : trophy.name
  const normalized = name?.trim()
  if (!normalized || DOMESTIC_CUP.test(normalized)) return false
  return LEAGUE.test(normalized) || UEFA_CLUB.test(normalized) || WORLD_CLUB.test(normalized) || MAJOR_TROPHY.test(normalized)
}

function parseEditions(value) {
  const years = value.match(/\d{4}(?:\s*[–-]\s*\d{2,4})?/g) || []
  return years.flatMap((yearSpan) => {
    const parts = yearSpan.split(/[–-]/).map((part) => part.trim())
    if (parts.length < 2) return [parts[0]]
    const start = Number(parts[0])
    const endText = parts[1]
    const end = Number(endText.length === 2 ? `${parts[0].slice(0, 2)}${endText}` : endText)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start > 30) return [yearSpan.replace(/\s/g, '')]
    return Array.from({ length: end - start + 1 }, (_, index) => String(start + index))
  })
}

// Legacy honors were hand-curated as competition names followed by the winning years.
// Convert them to individual wins so the profile total is calculated from its details.
export function trophiesFromLegacyHonors(honors = []) {
  if (!Array.isArray(honors)) return []
  return honors.flatMap((honor) => {
    if (typeof honor !== 'string' || /runner[- ]up|third place|bronze|silver medal/i.test(honor)) return []
    const match = honor.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
    if (!match || /olympic gold/i.test(match[1])) return []
    const name = match[1].trim()
    if (!isMajorTrophy(name)) return []
    return parseEditions(match[2]).map((season) => ({
      name,
      season,
      category: categoryFor(name),
      type: 'team',
    }))
  })
}

export function hasTrophyHistory(player) {
  return ['verified', 'curated', 'partial'].includes(player?.trophyStatus) && Array.isArray(player.trophies)
}
