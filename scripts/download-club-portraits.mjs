import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appSource = await readFile(path.join(root, 'src/App.jsx'), 'utf8')
const recordsBlock = appSource.match(/const CLUB_RECORDS = \{([\s\S]*?)\n\}/)?.[1]
if (!recordsBlock) throw new Error('Could not locate CLUB_RECORDS in src/App.jsx')

const names = [...recordsBlock.matchAll(/\[['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\]/g)].flatMap((match) => [match[1], match[2]])
const shorthandNames = [...recordsBlock.matchAll(/(?:^|,\s*)(?:'([^']+)'|([^:,\[\]{}]+)):\s*\['([^']+)',\s*'([^']+)'\]/g)].flatMap((match) => [match[3], match[4]])
const uniqueNames = [...new Set([...names, ...shorthandNames])]
if (process.argv.includes('--list')) {
  console.log(uniqueNames.join('\n'))
  process.exit(0)
}

const assetDirectory = path.join(root, 'src/assets/club-legends')
await mkdir(assetDirectory, { recursive: true })
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const slug = (value) => normalize(value).replaceAll(' ', '-')
if (process.argv.includes('--missing')) {
  const manifest = JSON.parse(await readFile(path.join(assetDirectory, 'manifest.json'), 'utf8').catch(() => '{}'))
  console.log(uniqueNames.filter((name) => !manifest[name]).join('\n'))
  process.exit(0)
}
if (process.argv.includes('--credits')) {
  const manifest = JSON.parse(await readFile(path.join(assetDirectory, 'manifest.json'), 'utf8'))
  const entries = Object.entries(manifest).map(([name, item]) => {
    if (typeof item === 'string') return `- **${name}:** local portrait file; exact original source metadata was unavailable for this previously saved file.`
    return `- **${name}:** [image file and license details](${item.image || item.source}); [source page](${item.source}).`
  })
  const missing = uniqueNames.filter((name) => !manifest[name])
  await writeFile(path.join(assetDirectory, 'ATTRIBUTION.md'), `# Club record portrait credits\n\n${entries.join('\n')}\n\n${missing.length ? `## Portraits without a local photo\n\n${missing.map((name) => `- ${name} (the profile displays its initials instead).`).join('\n')}\n` : ''}`)
  console.log(`Wrote credits for ${entries.length} local portraits.`)
  process.exit(0)
}
if (process.argv.includes('--curated')) {
  const known = {
    'Cristiano Ronaldo': ['https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/legendary-players/cristiano-ronaldo-dos-santos-aveiro/assets/1330603286208.jpg', 'https://www.realmadrid.com/en-US/the-club/history/football-legends/cristiano-ronaldo-dos-santos-aveiro'],
    'Wayne Rooney': ['https://cdn-img.staticzz.com/img/planteis/new/96/29/719629_wayne_rooney_20240909104521.jpg', 'https://www.ogol.com.br/jogador/wayne-rooney/1380'],
    'Thierry Henry': ['https://i.pinimg.com/originals/29/a6/a4/29a6a4b3c458900bd5a9aeeb9b614a2c.jpg', 'https://www.arsenal.com/historic/players/thierry-henry'],
    'Frank Lampard': ['https://3.bp.blogspot.com/-GUtsteeGqWg/T-WyhZVdcYI/AAAAAAAAAC8/LAWByy4hSWw/s1600/frank-lampard-x-98060.jpg', 'https://www.chelseafc.com/en/teams/profile/frank-lampard'],
    'Sergio Agüero': ['https://www.mancity.com/meta/media/ekcdk54z/2019-sergio-aguero_1947.png', 'https://www.mancity.com/players/sergio-aguero'],
    'Lionel Messi': ['https://www.ogol.com.br/img/planteis/new/73/83/1157383_lionel_messi_20240503153854.jpg', 'https://www.ogol.com.br/jogador/lionel-messi?epoca_id=141'],
    'Kylian Mbappé': ['https://cdn-img.staticzz.com/img/planteis/new/76/88/5037688_kylian_mbappe_20250925203508.jpg', 'https://www.ogol.com.br/jogador/kylian-mbappe/394508?epoca_id=149'],
    'Paolo Maldini': ['https://www.soccerzz.com/img/planteis/new/72/03/27203_paolo_maldini_20250423084320.jpg', 'https://www.soccerzz.com/player/paolo-maldini?epoca_id=129'],
    'Eusébio': ['https://img.chelseafc.com/image/upload/f_auto%2Cw_1400%2Cdpr_2.0%2Cq_90/editorial/news/2025/09/04/eusebio-1970.jpg', 'https://www.chelseafc.com/en/news/article/champions-league-logbook-benfica'],
    'Salem Al-Dawsari': ['https://contentfulproxy.stadion.io/eyc25wndlima/5vnkdADwRaBoloY06H2tn6/302259719a80a21bfb2aa947e607b258/Salem_Al-Dawsari.png?f=face&fit=fill&fm=webp&h=3053&w=2016', 'https://alhilal.com/ar/teams/mens-team/salem-aldawsari-profile'],
    'Mohammed Al-Shalhoub': ['https://cloudfront-eu-central-1.images.arcpublishing.com/thenational/AHPX55SGM2W7EZFULM7QJUJMBA.jpg', 'https://www.thenationalnews.com/sport/football/'] ,
    Koke: ['https://assets.laliga.com/squad/2022/t175/p77390/512x556/p77390_t175_2022_1_001_000.png', 'https://www.laliga.com/en-GB/player/koke'],
    'Telmo Zarra': ['https://cdn.resfu.com/media/img_news/telmo-zarra--twitter.jpg?lossy=1&size=1200', 'https://es.besoccer.com/noticia/telmo-zarra-el-cuarto-mejor-jugador-de-la-liga'],
    'Alan Oakes': ['https://shop.memorylane.co.uk/sq/767/alan-oakes-manchester-city-football-player-21583192.jpg.webp', 'https://shop.memorylane.co.uk/mirror/0200to0299-00242/alan-oakes-manchester-city-football-player-maine-21583228.html'],
    Zico: ['https://cdn-img.staticzz.com/img/planteis/new/27/97/12797_zico_20240519215736.jpg', 'https://www.ogol.com.br/jogador/zico?epoca_id=111'],
    'Fernando Gomes': ['https://www.ligaportugal.pt/backoffice/assets/bibota_11_c1c91b06a1.jpg', 'https://www.ligaportugal.pt/news/10377/nota-de-pesar-pelo-falecimento-de-fernando-gomes'],
    Hilário: ['https://4.bp.blogspot.com/-lz5CiNPZvSM/Ud9QeHztnCI/AAAAAAAAu2U/xJzZ6gI9DmA/s1600/sporting%2Bhilario%2B3.jpg', 'https://anotandofutbol.blogspot.com/2013/07/sporting-lisboa-parte-7.html'],
    'Ron Harris': ['https://img.chelseafc.com/image/upload/f_auto%2Cw_1400%2Cdpr_2.0%2Cq_90/editorial/news/2019/2/ron_harris_1963.jpg', 'https://www.chelseafc.com/en/news/article/once-a-blue-ron-harris'],
    'Charlie Aitken': ['https://cdn1.astonvilla.news/uploads/9/2023/07/GettyImages-667606415-scaled.jpg', 'https://www.astonvilla.news/club/legends/'],
    'Guillermo Campanal': ['https://4.bp.blogspot.com/-FY1Vetvfwew/TzLzke2WyUI/AAAAAAAAFVQ/CmFT1InDUzE/s640/campanal.jpg', 'https://voladizodegolsur.blogspot.com/2012/02/centenario-del-nacimiento-de-campanal-i.html'],
    Mundo: ['https://pbs.twimg.com/media/Gh4mWurWMAAyaUk.jpg', 'https://x.com/search?q=edmundo+suarez+trabanco'],
    'Stefan Radu': ['https://s.hs-data.com/gfx/person/cropped/400x400/17384.png?fallback=male', 'https://www.sport.de/fussball/pe17384/stefan-radu/'],
    'Delio Onnis': ['https://www.iffhs.com/storage/img/posts/IMG_5357.jpg', 'https://www.iffhs.com/posts/3827'],
    'Ally McCoist': ['https://i.pinimg.com/736x/d9/96/d1/d996d13ffc1ec763dfde7ca4772aab14.jpg', 'https://uk.pinterest.com/pin/ally-mccoist-of-rangers-in-1993--33284484733159311/'],
    'Jean-Luc Ettori': ['https://i.pinimg.com/736x/6a/c8/36/6ac836c7e4dd96bda289f2835bfed5cc.jpg', 'https://uk.pinterest.com/pin/as-monaco-goalkeeper-jean-luc-ettori-in-1982--132363676536529621/'],
    'Vic Watson': ['https://images.ctfassets.net/zl2jjr3puakk/3NoGlQCvb5xcXEpatncy8m/c9ce13f158d37078ef1f26587e90595e/on-this-day-six-goal-vic-watson-lays-out-leeds-image.jpg?f=face&fit=crop&h=630&w=1200', 'https://www.whufc.com/en/news/day-six-goal-vic-watson-lays-out-leeds'],
    Nené: ['https://i.ebayimg.com/images/g/NhEAAOSwMThjFiA6/s-l1200.jpg', 'https://www.ebay.com.sg/itm/160309980286'],
    'David O’Leary': ['https://static.wixstatic.com/media/a6402e_a9bddfc3ee844808b9743d34727d6fcd~mv2.jpg/v1/fill/w_620%2Ch_430%2Cal_c%2Cq_80%2Cenc_avif%2Cquality_auto/a6402e_a9bddfc3ee844808b9743d34727d6fcd~mv2.jpg', 'https://itsagoal.wixsite.com/home/post/os-60-anos-de-david-o-leary-recordista-em-partidas-pelo-arsenal'],
    'Sjaak Swart': ['https://i.pinimg.com/564x/56/19/20/5619208521a89e05d649cc3f75b3ec19.jpg', 'https://www.pinterest.com/pin/132363676531016452/'],
    'Ademir da Guia': ['https://commons.wikimedia.org/wiki/Special:Redirect/file/Ademir-da-Guia-palmeiras-santos-jan24.jpg', 'https://commons.wikimedia.org/wiki/File:Ademir-da-Guia-palmeiras-santos-jan24.jpg'],
    'Şeref Has': ['https://footiehound.com/wp-content/uploads/2024/09/Seref-Has.jpg', 'https://footiehound.com/10-best-fenerbahce-players-of-all-time/'],
    'Majed Abdullah': ['https://cdn.arageek.com/magazine/2020/01/word-image-7.jpeg', 'https://www.arageek.com/bio/maged-abdullah'],
    'Reinaldo Merlo': ['https://upload.wikimedia.org/wikipedia/commons/5/57/Merlo_river.jpg', 'https://commons.wikimedia.org/wiki/File:Merlo_river.jpg'],
    'Hervé Revelli': ['https://www.asse.fr/img/content/2020/07/herve-revelli-qla-mentalite-drune-equipe-gagnanteq-1837262101.jpg', 'https://www.asse.fr/fr/actualites/herve-revelli-la-mentalite-d-une-equipe-gagnante--ac28526'],
    Heitor: ['https://upload.wikimedia.org/wikipedia/commons/7/7f/Heitor_%28cropped%29.jpg', 'https://commons.wikimedia.org/wiki/File:Heitor_(cropped).jpg'],
    'Zeki Rıza Sporel': ['https://upload.wikimedia.org/wikipedia/commons/7/72/Zekirizasporel.jpg', 'https://commons.wikimedia.org/wiki/File:Zekirizasporel.jpg'],
    'Serginho Chulapa': ['https://lncimg.lance.com.br/uploads/2019/02/27/5c769b547d60f.jpeg', 'https://www.lance.com.br/sao-paulo/sao-paulo-parabeniza-serginho-chulapa-maior-artilheiro-da-historia-do-clube.html'],
    'Grenville Morris': ['https://images.nypl.org/index.php?id=460461&t=w', 'https://digitalcollections.nypl.org/items/8e60f1d0-c534-012f-3ba5-58d385a7bc34'],
    'Ademir da Guia': ['https://jpimg.com.br/uploads/2017/04/2089120640-ademir-da-guia-o-divino-atuando-pelo-palmeiras-em-72.jpeg', 'https://jovempan.com.br/esportes/maior-idolo-da-historia-do-palmeiras-ademir-da-guia-faz-73-anos-veja-imagens.html'],
  }
  const manifestPath = path.join(assetDirectory, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const credits = []
  for (const [name, [url, source]] of Object.entries(known)) {
    if (manifest[name]?.image === url) continue
    try {
      let response = await fetch(url, { headers: { 'User-Agent': 'FootballAnalyticsDashboard/1.0', Referer: source } })
      if (!response.ok) {
        const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`
        response = await fetch(proxiedUrl, { headers: { 'User-Agent': 'FootballAnalyticsDashboard/1.0' } })
      }
      if (!response.ok) throw new Error(`image host returned ${response.status}`)
      const mime = response.headers.get('content-type') || ''
      if (!mime.startsWith('image/')) throw new Error(`source returned ${mime || 'a non-image response'}`)
      const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
      const fileName = `${slug(name)}.${extension}`
      await writeFile(path.join(assetDirectory, fileName), Buffer.from(await response.arrayBuffer()))
      manifest[name] = { file: `./${fileName}`, source, image: url }
      credits.push(`- **${name}:** [portrait source](${source}) · [image file](${url}).`)
      console.log(`Downloaded the club-era portrait for ${name}.`)
    } catch (error) {
      console.log(`Could not download the curated portrait for ${name}: ${error.message}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(path.join(assetDirectory, 'CURATED-SOURCES.md'), `# Curated club-era portraits\n\n${credits.join('\n')}\n`)
  process.exit(0)
}
if (process.argv.includes('--index-local')) {
  const files = await readdir(assetDirectory)
  const manifest = {}
  for (const name of uniqueNames) {
    const fileName = files.find((file) => path.parse(file).name === slug(name) && /\.(jpe?g|png|webp)$/i.test(file))
    if (fileName) manifest[name] = `./${fileName}`
  }
  await writeFile(path.join(assetDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Indexed ${Object.keys(manifest).length}/${uniqueNames.length} local portraits.`)
  process.exit(0)
}
const manifestPath = path.join(assetDirectory, 'manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{}'))
const credits = []
const missing = []

async function fetchJsonWithRetry(url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': 'FootballAnalyticsDashboard/1.0 (local educational project)' } })
    if (response.status !== 429 || attempt === 1) return response
    const retryAfter = Math.min(Number(response.headers.get('retry-after')) || 3, 8)
    console.log(`Source rate limit; waiting ${retryAfter} seconds.`)
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
  }
  throw new Error('Source retry limit reached')
}

if (process.argv.includes('--probe')) {
  const response = await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&titles=Wayne_Rooney&prop=pageimages&piprop=thumbnail&pithumbsize=900', { headers: { 'User-Agent': 'FootballAnalyticsDashboard/1.0' } })
  console.log(`Wikipedia image API probe: ${response.status}`)
  process.exit(0)
}

if (!process.argv.includes('--wikipedia')) {
  console.log('No download mode selected. Use --list, --missing, --credits, --index-local, --curated, --probe, or --wikipedia.')
  process.exit(0)
}

for (let offset = 0; offset < uniqueNames.length; offset += 40) {
  const batch = uniqueNames.slice(offset, offset + 40)
  const api = new URL('https://en.wikipedia.org/w/api.php')
  api.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    redirects: '1',
    titles: batch.join('|'),
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '900',
  })
  const response = await fetchJsonWithRetry(api)
  if (!response.ok) throw new Error(`Wikipedia image lookup returned ${response.status}`)
  const data = await response.json()
  const pages = Object.values(data.query?.pages || {})
  const byTitle = new Map(pages.map((page) => [normalize(page.title), page]))
  for (const redirect of data.query?.redirects || []) {
    const page = byTitle.get(normalize(redirect.to))
    if (page) byTitle.set(normalize(redirect.from), page)
  }

  for (const name of batch) {
    if (manifest[name] && typeof manifest[name] === 'object') {
      console.log(`Keeping curated local portrait for ${name}.`)
      continue
    }
    const page = byTitle.get(normalize(name))
    const imageUrl = page?.thumbnail?.source
    if (!imageUrl) {
      missing.push(name)
      console.log(`No Wikipedia portrait: ${name}`)
      continue
    }
    try {
      const imageResponse = await fetchJsonWithRetry(imageUrl)
      if (!imageResponse.ok) throw new Error(`Image returned ${imageResponse.status}`)
      const mime = imageResponse.headers.get('content-type') || ''
      const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
      const fileName = `${slug(name)}.${extension}`
      await writeFile(path.join(assetDirectory, fileName), Buffer.from(await imageResponse.arrayBuffer()))
      const file = new URL(imageUrl).pathname.split('/').at(-1)
      const fileTitle = decodeURIComponent(file || '').replaceAll('_', ' ')
      const filePage = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileTitle.replaceAll(' ', '_'))}`
      const sourcePage = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`
      manifest[name] = { file: `./${fileName}`, source: sourcePage, image: filePage }
      credits.push(`- **${name}:** [source article](${sourcePage}); [image file and its creator/license details](${filePage}).`)
      console.log(`Downloaded ${name}`)
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    } catch (error) {
      missing.push(name)
      console.log(`Could not download ${name}: ${error.message}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(path.join(assetDirectory, 'ATTRIBUTION.md'), `# Club record portrait image credits\n\n${credits.join('\n')}\n\n${missing.length ? `## Portraits without an article image\n\n${missing.map((name) => `- ${name}`).join('\n')}\n` : ''}`)
console.log(`Finished: ${Object.keys(manifest).length}/${uniqueNames.length} portraits downloaded.`)
