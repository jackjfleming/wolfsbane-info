document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('slides-container')
  const filter = document.getElementById('role-filter')
  const previous = document.getElementById('prev-btn')
  const next = document.getElementById('next-btn')
  const playPause = document.getElementById('play-pause-btn')
  const playIcon = document.getElementById('play-icon')
  const pauseIcon = document.getElementById('pause-icon')
  const progress = document.getElementById('progress-bar')
  const newRoles = new Set(['Artist', 'Evil Twin', 'Gangster', 'Butcher', 'Klutz', 'Professor'])
  const duration = 20000
  let allSlides = Array.from(container.querySelectorAll('.slide'))
  let visibleSlides = allSlides
  let current = 0
  let playing = true
  let startedAt = Date.now()

  const show = index => {
    visibleSlides.forEach(slide => slide.classList.remove('active'))
    current = (index + visibleSlides.length) % visibleSlides.length
    visibleSlides[current].classList.add('active')
    startedAt = Date.now()
    progress.style.width = '0%'
  }
  const syncPlayIcon = () => {
    playIcon.classList.toggle('hidden', playing)
    pauseIcon.classList.toggle('hidden', !playing)
    playPause.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow')
  }
  const applyFilter = () => {
    const choice = filter.value
    visibleSlides = allSlides.filter(slide => !slide.dataset.roleName || choice === 'all' || (choice === 'new') === (slide.dataset.roleType === 'new'))
    allSlides.forEach(slide => { slide.style.display = 'none' })
    visibleSlides.forEach(slide => { slide.style.display = 'flex' })
    show(0)
  }
  const text = (tag, content, className) => {
    const element = document.createElement(tag)
    element.textContent = content
    if (className) element.className = className
    return element
  }

  try {
    const response = await fetch('roles-public.json')
    if (!response.ok) throw new Error('Could not load role slides')
    const bundle = await response.json()
    for (const role of bundle.roles) {
      const slide = document.createElement('section')
      slide.className = 'slide'
      slide.dataset.roleName = role.name
      slide.dataset.roleType = newRoles.has(role.name) ? 'new' : 'standard'
      const body = document.createElement('div')
      body.className = 'm-auto text-center max-w-4xl slide-content'
      body.append(text('h1', role.name, 'text-4xl md:text-6xl font-bold mb-4'))
      body.append(text('p', role.type, 'text-xl mb-6 text-gray-400'))
      body.append(text('p', role.ability, 'text-2xl md:text-3xl leading-relaxed'))
      const tips = [...role.tips, ...role.tipsGood, ...role.tipsEvil]
      if (tips.length) body.append(text('p', tips[Math.floor(Math.random() * tips.length)], 'text-lg mt-8 text-gray-300'))
      slide.append(body)
      container.append(slide)
    }
    allSlides = Array.from(container.querySelectorAll('.slide'))
    applyFilter()
  } catch (error) {
    const notice = text('p', 'Role slides are unavailable. Check the reference bundle.', 'text-center text-xl text-red-300')
    container.append(notice)
  }

  previous.setAttribute('aria-label', 'Previous slide')
  next.setAttribute('aria-label', 'Next slide')
  previous.addEventListener('click', () => show(current - 1))
  next.addEventListener('click', () => show(current + 1))
  playPause.addEventListener('click', () => { playing = !playing; startedAt = Date.now(); syncPlayIcon() })
  filter.addEventListener('change', applyFilter)
  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') show(current + 1)
    if (event.key === 'ArrowLeft') show(current - 1)
    if (event.key === ' ' && event.target === document.body) { event.preventDefault(); playing = !playing; startedAt = Date.now(); syncPlayIcon() }
  })
  syncPlayIcon()
  setInterval(() => {
    if (!playing || !visibleSlides.length) return
    const elapsed = Date.now() - startedAt
    if (elapsed >= duration) show(current + 1)
    else progress.style.width = `${elapsed / duration * 100}%`
  }, 100)
})
