(() => {
  const input = document.getElementById('search')
  const results = document.getElementById('search-results')
  const sections = document.getElementById('role-sections')
  const count = document.getElementById('search-count')
  if (!input || !results || !sections || !count) return

  let roles = []
  const normalize = value => String(value || '').toLocaleLowerCase().trim()
  const score = (role, query) => {
    const names = [role.name, ...role.aliases].map(normalize)
    if (names.includes(query)) return 400
    if (names.some(name => name.startsWith(query))) return 300
    if (names.some(name => name.includes(query))) return 200
    const fields = [role.ability, role.shortRuling, role.howToRun, ...role.interactions, ...role.examples]
    return fields.some(value => normalize(value).includes(query)) ? 100 : 0
  }
  const excerpt = (role, query) => {
    const fields = [role.shortRuling, role.howToRun, ...role.interactions, ...role.examples]
    const found = fields.find(value => normalize(value).includes(query)) || role.shortRuling
    return found.length > 180 ? `${found.slice(0, 177)}…` : found
  }
  const render = () => {
    const query = normalize(input.value)
    sections.hidden = Boolean(query)
    results.hidden = !query
    results.replaceChildren()
    if (!query) { count.textContent = ''; return }
    const matches = roles.map(role => ({ role, rank: score(role, query) })).filter(item => item.rank)
      .sort((a, b) => b.rank - a.rank || a.role.name.localeCompare(b.role.name))
    count.textContent = `${matches.length} ${matches.length === 1 ? 'result' : 'results'}`
    const grid = document.createElement('div')
    grid.className = 'result-grid'
    for (const { role } of matches) {
      const link = document.createElement('a')
      link.className = 'role-card'
      link.href = role.legacyPath
      const type = document.createElement('span')
      type.className = 'role-type'
      type.textContent = role.type
      const title = document.createElement('strong')
      title.textContent = role.name
      const snippet = document.createElement('span')
      snippet.textContent = excerpt(role, query)
      link.append(type, title, snippet)
      grid.append(link)
    }
    results.append(grid)
  }
  input.addEventListener('input', render)
  fetch('reference-bundle.json').then(response => {
    if (!response.ok) throw new Error('Reference bundle could not be loaded')
    return response.json()
  }).then(bundle => {
    roles = bundle.roles
    render()
  }).catch(() => { count.textContent = 'Search is unavailable. Browse roles below.'; sections.hidden = false; results.hidden = true })
})()
