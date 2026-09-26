import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = JSON.parse(readFileSync(join(root, 'content/role-reference.json'), 'utf8'))
const release = process.argv.includes('--release')

function check(condition, message) {
  if (!condition) throw new Error(message)
}

check(source.schemaVersion === 1, 'Unsupported reference schema')
check(typeof source.contentVersion === 'string' && source.contentVersion.length > 0, 'Missing content version')
check(Array.isArray(source.roles) && source.roles.length === 69, 'Expected all 69 selectable roles')
const ids = new Set()
const names = new Set()
const paths = new Set()
const aliases = new Set()
for (const role of source.roles) {
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(role.id), `Invalid ID: ${role.id}`)
  check(!ids.has(role.id), `Duplicate ID: ${role.id}`)
  ids.add(role.id)
  check(typeof role.name === 'string' && role.name.trim(), `Missing name: ${role.id}`)
  check(!names.has(role.name.toLowerCase()), `Duplicate name: ${role.name}`)
  names.add(role.name.toLowerCase())
  check(['townsfolk', 'outsider', 'minion', 'alpha', 'traveler'].includes(role.type), `Invalid type: ${role.name}`)
  for (const field of ['ability', 'shortRuling', 'howToRun']) {
    check(typeof role[field] === 'string' && role[field].trim(), `Missing ${field}: ${role.name}`)
  }
  for (const field of ['aliases', 'interactions', 'examples', 'tips', 'tipsGood', 'tipsEvil', 'sourceNotes', 'reviewNotes']) {
    check(Array.isArray(role[field]), `Missing ${field}: ${role.name}`)
  }
  check(role.sourceNotes.length > 0, `Missing provenance: ${role.name}`)
  check(['draft', 'approved'].includes(role.reviewStatus), `Invalid review status: ${role.name}`)
  check(/^roles\/[a-z0-9-]+\.html$/.test(role.legacyPath), `Invalid role path: ${role.name}`)
  check(!paths.has(role.legacyPath), `Duplicate role path: ${role.legacyPath}`)
  paths.add(role.legacyPath)
  for (const alias of role.aliases) {
    check(typeof alias === 'string' && alias.trim(), `Blank alias: ${role.name}`)
    const key = alias.toLowerCase()
    check(!aliases.has(key), `Duplicate alias: ${alias}`)
    aliases.add(key)
  }
  if (release) {
    check(role.reviewStatus === 'approved', `Unapproved role: ${role.name}`)
    check(typeof role.reviewedBy === 'string' && role.reviewedBy.trim(), `Missing reviewer: ${role.name}`)
    check(typeof role.reviewedAt === 'string' && !Number.isNaN(Date.parse(role.reviewedAt)), `Missing review date: ${role.name}`)
    check(role.reviewNotes.length === 0, `Unresolved review notes: ${role.name}`)
  }
}
for (const alias of aliases) check(!names.has(alias), `Alias conflicts with a role name: ${alias}`)
const fenrir = source.roles.find(role => role.name === 'Fenrir')
check(fenrir?.aliases.includes('Alpha Wolf') && fenrir.aliases.includes('The Oliver'), 'Missing Fenrir aliases')
check(fenrir.legacyPath === 'roles/alpha-wolf.html', 'Fenrir must preserve the old Alpha Wolf URL')

const checksum = createHash('sha256').update(JSON.stringify(source.roles)).digest('hex')
const bundle = { schemaVersion: 1, contentVersion: source.contentVersion, checksum, roles: source.roles }
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const section = (title, values) => values.length ? `<section><h2>${esc(title)}</h2>${values.map(value => `<p>${esc(value)}</p>`).join('')}</section>` : ''
const css = '<link rel="stylesheet" href="reference.css">'
const localCss = '<link rel="stylesheet" href="../reference.css">'
const siteHeader = prefix => `<header class="site-header"><a class="brand" href="${prefix}index.html">🐺 Wolf's Bane</a><nav><a href="${prefix}index.html">Roles</a><a href="${prefix}kiosk/index.html">Slideshow</a></nav></header>`

function rolePage(role) {
  const status = role.reviewStatus === 'approved' ? '' : '<p class="draft">Draft guidance — pending Wolf\'s Bane review</p>'
  const review = role.reviewStatus === 'draft' ? section('Editorial review', [...role.reviewNotes, ...role.sourceNotes.map(note => `Source: ${note}`)]) : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(role.name)} | Wolf's Bane</title>${localCss}</head><body>${siteHeader('../')}<main class="role-detail"><a href="../index.html">← All roles</a><p class="eyebrow">${esc(role.type)}</p><h1>${esc(role.name)}</h1>${status}<p class="lead">${esc(role.shortRuling)}</p><section><h2>Storyteller procedure</h2><p>${esc(role.howToRun)}</p></section>${section('Key interactions', role.interactions)}${section('Examples', role.examples)}${section('Tips & tricks', role.tips)}${section('Good traveler tips', role.tipsGood)}${section('Evil traveler tips', role.tipsEvil)}${review}<p class="version">Reference ${esc(source.contentVersion)}</p></main></body></html>\n`
}

const groups = ['townsfolk', 'outsider', 'minion', 'alpha', 'traveler']
const labels = { townsfolk: 'Villagers', outsider: 'Outsiders', minion: 'Minions', alpha: 'Alpha Wolves', traveler: 'Travelers' }
const cards = groups.map(type => `<section class="role-group"><h2>${labels[type]}</h2><div class="role-grid">${source.roles.filter(role => role.type === type).map(role => `<a class="role-card" href="${esc(role.legacyPath)}"><span class="role-type">${esc(role.type)}</span><strong>${esc(role.name)}</strong><span>${esc(role.shortRuling)}</span></a>`).join('')}</div></section>`).join('')
const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wolf's Bane | Storyteller Reference</title>${css}<script src="reference-search.js" defer></script></head><body>${siteHeader('')}<main class="index"><h1>Storyteller reference</h1><p class="lead">Find a role or ruling while you run the game.</p><label for="search">Search roles and rulings</label><input id="search" type="search" autocomplete="off" placeholder="Try Fenrir, poisoned, or execution" aria-controls="search-results"><p id="search-count" aria-live="polite"></p><div id="search-results" hidden></div><div id="role-sections">${cards}</div><p class="version">Reference ${esc(source.contentVersion)}</p></main></body></html>\n`

writeFileSync(join(root, 'reference-bundle.json'), JSON.stringify(bundle, null, 2) + '\n')
const legacy = { villager: [], outsiders: [], minions: [], 'Alpha Wolfs': [], travelers: [] }
for (const role of source.roles) {
  const key = { townsfolk: 'villager', outsider: 'outsiders', minion: 'minions', alpha: 'Alpha Wolfs', traveler: 'travelers' }[role.type]
  legacy[key].push({ name: role.name, type: role.type, summary: role.shortRuling, howToRun: role.howToRun, examples: role.examples, tipsAndTricks: role.tips, tipsAndTricksGood: role.tipsGood, tipsAndTricksEvil: role.tipsEvil })
}
writeFileSync(join(root, 'roles.json'), JSON.stringify(legacy, null, 2) + '\n')
writeFileSync(join(root, 'index.html'), index)
for (const role of source.roles) {
  const path = join(root, role.legacyPath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, rolePage(role))
}
writeFileSync(join(root, 'roles/fenrir.html'), '<!doctype html><meta http-equiv="refresh" content="0;url=alpha-wolf.html"><a href="alpha-wolf.html">Fenrir reference</a>\n')
const publicRoles = source.roles.map(({ id, name, aliases, type, ability, tips, tipsGood, tipsEvil, reviewStatus }) => ({ id, name, aliases, type, ability, tips, tipsGood, tipsEvil, reviewStatus }))
writeFileSync(join(root, 'kiosk/roles-public.json'), JSON.stringify({ schemaVersion: 1, contentVersion: source.contentVersion, checksum, roles: publicRoles }, null, 2) + '\n')
console.log(`Generated ${source.roles.length} role pages and reference bundles (${source.contentVersion}, ${checksum.slice(0, 12)})`)
