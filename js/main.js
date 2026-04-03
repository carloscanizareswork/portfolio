document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for in-page links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href')
      if (href.length > 1) {
        e.preventDefault()
        const el = document.querySelector(href)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        history.replaceState(null, '', href)
      }
    })
  })

  // Active nav on scroll
  const sections = Array.from(document.querySelectorAll('main section[id], header'))
  const navLinks = document.querySelectorAll('.nav-links a')

  function onScroll() {
    const scrollPos = window.scrollY + 120
    let currentId = '#home'
    sections.forEach(s => {
      if (s.id && s.offsetTop <= scrollPos) currentId = `#${s.id}`
    })
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === currentId)
    })
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // Load JSON data and render Journey + Projects
  async function loadData() {
    try {
      // Determine base path for data
      const isSub = window.location.pathname.includes('/stories/')
      const prefix = isSub ? '../' : ''

      const res = await fetch(`${prefix}data/data.json`)
      if (!res.ok) throw new Error('Failed to load data')
      const data = await res.json()
      window.__data = data
      window.__header = data.header || {}
      window.__dataPrefix = prefix

      // Only render these sections if elements exist (main page)
      const savedLang = localStorage.getItem('site-lang') || 'en'
      if (document.getElementById('hero-name')) renderHeader(data.header || {})
      if (document.getElementById('ongoing-projects-grid')) renderOngoingProjects(data.ongoingProjects || [], savedLang)
      if (document.getElementById('journey-list')) renderJourney(data.journey || [], savedLang)
      if (document.getElementById('stories-grid')) renderStories(data.stories || [], prefix, savedLang)
      // renderContact(data.contact || {}) // Skip for now to avoid breaking the manual card

      // load i18n and wire settings
      try {
        const ti = await fetch(`${prefix}data/i18n.json`)
        if (ti.ok) {
          window.__i18n = await ti.json()
          initSettings() // set up theme + language UI
        }
      } catch (e) { console.warn('i18n load failed', e) }
    } catch (err) {
      console.error('Error loading data', err)
    }
  }

  function applyTranslations(lang) {
    if (!window.__i18n) return
    const set = window.__i18n[lang] || window.__i18n['en']
    // nav items
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n')
      const parts = key.split('.')
      let cur = set
      for (const p of parts) { if (cur && cur[p] !== undefined) cur = cur[p]; else { cur = null; break } }
      if (cur) el.textContent = cur
    })
    // hero intro
    const intro = set.hero && set.hero.intro
    if (intro) { const el = document.getElementById('hero-intro'); if (el) el.textContent = intro }
    if (window.__data) {
      if (document.getElementById('ongoing-projects-grid')) renderOngoingProjects(window.__data.ongoingProjects || [], lang)
      if (document.getElementById('journey-list')) renderJourney(window.__data.journey || [], lang)
      if (document.getElementById('stories-grid')) renderStories(window.__data.stories || [], window.__dataPrefix || '', lang)
    }
  }

  function initSettings() {
    // theme: read from localStorage or prefers-color-scheme
    const savedTheme = localStorage.getItem('site-theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = savedTheme || (prefersDark ? 'dark' : 'light')
    applyTheme(theme)

    // language
    const savedLang = localStorage.getItem('site-lang') || 'en'
    applyTranslations(savedLang)
    const currentStory = getCurrentStoryContext()
    updateLangBtn(currentStory ? currentStory.lang : savedLang)

    // Background Toggle
    const bgBtn = document.getElementById('bg-toggle')
    if (bgBtn) {
      const savedBg = localStorage.getItem('bg-enabled')
      const enabled = savedBg === 'true'
      setBackgroundEnabled(enabled)
      updateBgBtn(bgBtn, enabled)
      bgBtn.addEventListener('click', () => {
        const next = !window.__bgEnabled
        setBackgroundEnabled(next)
        updateBgBtn(bgBtn, next)
      })
    }

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle')
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme')
        const isLight = current === 'light'
        const newTheme = isLight ? 'dark' : 'light'
        applyTheme(newTheme)
        localStorage.setItem('site-theme', newTheme)
      })
    }

    // Language Toggle (Cycle EN -> ES -> CA -> EN)
    const langBtn = document.getElementById('lang-toggle')
    if (langBtn) {
      if (currentStory) {
        if (currentStory.availableLanguages.length <= 1) {
          langBtn.style.display = 'none'
        } else {
          langBtn.title = 'Switch Article Language'
          langBtn.addEventListener('click', () => {
            const idx = currentStory.availableLanguages.indexOf(currentStory.lang)
            const currentIdx = idx !== -1 ? idx : 0
            const nextLang = currentStory.availableLanguages[(currentIdx + 1) % currentStory.availableLanguages.length]
            localStorage.setItem('site-lang', nextLang)
            window.location.href = getStoryLink(currentStory.story, nextLang, window.__dataPrefix || '')
          })
        }
      } else {
        langBtn.addEventListener('click', () => {
          const langs = ['en', 'es', 'ca']
          const cur = localStorage.getItem('site-lang') || 'en'
          const idx = langs.indexOf(cur)
          const currentIdx = idx !== -1 ? idx : 0
          const nextIdx = (currentIdx + 1) % langs.length
          const nextLang = langs[nextIdx]

          applyTranslations(nextLang)
          updateLangBtn(nextLang)
          localStorage.setItem('site-lang', nextLang)
        })
      }
    }
  }

  function updateLangBtn(lang) {
    const el = document.querySelector('.lang-text')
    if (el) el.textContent = lang.toUpperCase()
  }

  function updateBgBtn(btn, enabled) {
    btn.classList.toggle('is-off', !enabled)
    btn.title = enabled ? 'Disable Background' : 'Enable Background'
  }

  function setBackgroundEnabled(enabled) {
    window.__bgEnabled = enabled
    localStorage.setItem('bg-enabled', enabled ? 'true' : 'false')
  }

  function applyTheme(name) {
    if (name === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  function renderHeader(header) {
    document.getElementById('hero-name').textContent = header.name;

    const roleEl = document.getElementById('hero-role');
    roleEl.innerHTML = `
    <span class="role-title">${header.title}</span>
    <span class="role-location">
      <svg class="role-location-icon" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
      </svg>
      ${header.location}
    </span>
  `;

    document.getElementById('hero-intro').textContent = header.intro;

    const linksEl = document.getElementById('hero-links');
    // Primary CTA
    const ctaBtn = document.createElement('a');
    ctaBtn.href = "#contact";
    ctaBtn.className = "btn btn-primary btn-glow";
    ctaBtn.innerText = "Collaborate";

    // Secondary / Socials container
    const socialContainer = document.createElement('div');
    socialContainer.className = "contact-icons";

    if (header.linkedin) {
      const li = document.createElement('a');
      li.href = header.linkedin;
      li.target = "_blank";
      li.className = "contact-icon";
      li.innerHTML = `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;
      socialContainer.appendChild(li);
    }

    if (header.github) {
      const gh = document.createElement('a');
      gh.href = header.github;
      gh.target = "_blank";
      gh.className = "contact-icon";
      gh.innerHTML = `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.28 3.438 9.758 8.207 11.34.6.113.82-.262.82-.583 0-.288-.01-1.05-.016-2.06-3.338.744-4.042-1.644-4.042-1.644-.546-1.41-1.333-1.786-1.333-1.786-1.09-.77.082-.754.082-.754 1.205.086 1.84 1.26 1.84 1.26 1.07 1.882 2.807 1.338 3.492 1.023.108-.795.418-1.338.762-1.646-2.665-.312-5.466-1.37-5.466-6.095 0-1.347.465-2.448 1.235-3.31-.124-.312-.536-1.57.116-3.272 0 0 1.008-.33 3.3 1.26a11.235 11.235 0 0 1 3.006-.42c1.02.004 2.047.142 3.006.42 2.29-1.59 3.296-1.26 3.296-1.26.654 1.702.242 2.96.118 3.272.77.862 1.232 1.963 1.232 3.31 0 4.737-2.806 5.78-5.48 6.084.43.38.814 1.13.814 2.28 0 1.646-.015 2.973-.015 3.376 0 .324.216.702.826.582C20.565 22.253 24 17.777 24 12.5 24 5.87 18.627.5 12 .5z"/></svg>`;
      socialContainer.appendChild(gh);
    }

    const emailBtn = document.createElement('a');
    emailBtn.href = `mailto:${header.email}`;
    emailBtn.className = "contact-icon";
    emailBtn.innerHTML = `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
    socialContainer.appendChild(emailBtn);

    linksEl.appendChild(ctaBtn);

    if (header.cv) {
      const cvBtn = document.createElement('a');
      cvBtn.href = header.cv;
      cvBtn.target = "_blank";
      cvBtn.rel = "noopener";
      cvBtn.className = "btn btn-secondary";
      cvBtn.innerText = "Download CV";
      linksEl.appendChild(cvBtn);
    }

    linksEl.appendChild(socialContainer);
  }

  function renderOngoingProjects(items, lang = 'en') {
    const track = document.getElementById('ongoing-projects-grid')
    if (!track || !items) return
    const visibleItems = items.filter(p => !p.hidden)
    track.innerHTML = visibleItems.map(p => {
      let desc = p.description
      if (lang === 'es' && p.description_es) desc = p.description_es
      if (lang === 'ca' && p.description_ca) desc = p.description_ca
      const href = p.url || (p.links && p.links[0] && p.links[0].href) || ''
      const hasLink = Boolean(href && href !== '#')
      const target = hasLink && href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''
      const tag = hasLink ? 'a' : 'div'
      const attrs = hasLink ? ` href="${href}"${target}` : ''
      const classes = `card project-card${hasLink ? ' clickable-card' : ''}`
      return `
        <${tag} class="${classes}"${attrs}>
            ${p.thumbnail ? `<img src="${p.thumbnail}" alt="${p.title}" class="project-thumb">` : '<div class="project-thumb-placeholder"></div>'}
            <div class="card-content">
                <h3>${p.title}</h3>
                <p class="project-desc">${desc}</p>
                <div class="taglist">${p.stack.split(',').map(s => `<span class="tag">${s.trim()}</span>`).join('')}</div>
                <div class="project-links">
                    ${(p.links || []).map(l => `<a href="${l.href}" class="link-btn">${l.label}</a>`).join('')}
                </div>
            </div>
        </${tag}>
    `
    }).join('')

    initSlider(track, visibleItems.length, '.project-prev', '.project-next', 2)
  }

  function getStoryUiCopy(lang) {
    return (window.__i18n && window.__i18n[lang] && window.__i18n[lang].storyUi)
      || (window.__i18n && window.__i18n.en && window.__i18n.en.storyUi)
      || { readMore: 'Read article', availableLanguages: 'Available languages' }
  }

  function getStoryVersion(story, lang = 'en') {
    const translation = lang !== 'en' && story.translations && story.translations[lang]
    if (translation) {
      return {
        lang,
        date: translation.date || story.date,
        title: translation.title || story.title,
        excerpt: translation.excerpt || story.excerpt,
        link: translation.link || story.link
      }
    }

    return {
      lang: 'en',
      date: story.date,
      title: story.title,
      excerpt: story.excerpt,
      link: story.link
    }
  }

  function getStoryLink(story, lang = 'en', prefix = '') {
    const version = getStoryVersion(story, lang)
    return `${prefix}${version.link}`
  }

  function getCurrentStoryContext() {
    const storyId = document.body.dataset.storyId
    const storyLang = document.body.dataset.storyLang || 'en'
    if (!storyId || !window.__data || !Array.isArray(window.__data.stories)) return null

    const story = window.__data.stories.find(item => item.id === storyId)
    if (!story) return null

    return {
      story,
      lang: storyLang,
      availableLanguages: ['en', ...Object.keys(story.translations || {})]
    }
  }

  function bindStoryCardInteractions(grid) {
    grid.querySelectorAll('.story-card[data-href]').forEach(card => {
      const navigate = () => {
        const href = card.getAttribute('data-href')
        const lang = card.getAttribute('data-lang')
        if (!href) return
        if (lang) localStorage.setItem('site-lang', lang)
        window.location.href = href
      }

      card.addEventListener('click', e => {
        if (e.target.closest('a, button')) return
        navigate()
      })

      card.addEventListener('keydown', e => {
        if ((e.key !== 'Enter' && e.key !== ' ') || e.target !== card) return
        e.preventDefault()
        navigate()
      })
    })

    grid.querySelectorAll('.story-card a[data-lang]').forEach(link => {
      link.addEventListener('click', () => {
        const lang = link.getAttribute('data-lang')
        if (lang) localStorage.setItem('site-lang', lang)
      })
    })
  }

  function renderStories(stories, prefix = '', lang = 'en') {
    const grid = document.getElementById('stories-grid')
    if (!grid || !stories) return

    const ui = getStoryUiCopy(lang)
    grid.innerHTML = stories.map(story => {
      const version = getStoryVersion(story, lang)
      const availableLanguages = ['en', ...Object.keys(story.translations || {})]
      const primaryHref = getStoryLink(story, version.lang, prefix)
      const hasLanguageToggle = availableLanguages.length > 1

      return `
        <article class="story-card card clickable-card" role="link" tabindex="0" data-href="${primaryHref}" data-lang="${version.lang}">
          ${story.coverImage ? `<div class="story-cover" style="background-image:url('${prefix}${story.coverImage}');${story.coverSize ? ` background-size:${story.coverSize};` : ''}${story.coverPosition ? ` background-position:${story.coverPosition};` : ''}"></div>` : ''}
          <div class="story-card-meta">
            <div class="story-date">${version.date}</div>
            ${hasLanguageToggle ? `
              <div class="story-lang-toggle" aria-label="${ui.availableLanguages}">
                ${availableLanguages.map(code => `
                  <a
                    class="story-lang-option${code === version.lang ? ' is-active' : ''}"
                    href="${getStoryLink(story, code, prefix)}"
                    data-lang="${code}"
                    aria-current="${code === version.lang ? 'true' : 'false'}"
                  >${code.toUpperCase()}</a>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <h3>${version.title}</h3>
          <p>${version.excerpt}</p>
          <a class="read-more story-primary-link" href="${primaryHref}" data-lang="${version.lang}">${ui.readMore} &rarr;</a>
        </article>
      `
    }).join('')

    bindStoryCardInteractions(grid)
    initSlider(grid, stories.length, '.story-prev', '.story-next', 3)
  }

  function initSlider(track, count, prevSelector, nextSelector, desktopVisible = 2) {
    let index = 0
    const prevControl = document.querySelector(prevSelector)
    const nextControl = document.querySelector(nextSelector)
    if (!prevControl || !nextControl) return

    if (track.__sliderResizeHandler) {
      window.removeEventListener('resize', track.__sliderResizeHandler)
    }

    const prev = prevControl.cloneNode(true)
    const next = nextControl.cloneNode(true)
    prevControl.parentNode.replaceChild(prev, prevControl)
    nextControl.parentNode.replaceChild(next, nextControl)

    function update() {
      const isMobile = window.innerWidth <= 768
      const visible = isMobile ? 1 : desktopVisible
      const max = Math.max(0, count - visible)
      if (index > max) index = max
      if (index < 0) index = 0

      const gap = 32 // 2rem
      const itemWidth = track.firstElementChild ? track.firstElementChild.offsetWidth : 0
      const move = index * (itemWidth + gap)
      track.style.transform = `translateX(-${move}px)`

      prev.style.opacity = index === 0 ? '0.3' : '1'
      prev.style.pointerEvents = index === 0 ? 'none' : 'auto'
      next.style.opacity = index === max ? '0.3' : '1'
      next.style.pointerEvents = index === max ? 'none' : 'auto'
    }

    prev.addEventListener('click', () => { if (index > 0) { index--; update() } })
    next.addEventListener('click', () => {
      const isMobile = window.innerWidth <= 768
      const visible = isMobile ? 1 : desktopVisible
      if (index < count - visible) { index++; update() }
    })

    track.__sliderResizeHandler = update
    window.addEventListener('resize', track.__sliderResizeHandler)
    // Initial update after a small delay to ensure rendering is complete
    setTimeout(update, 100)
  }


  function renderContact(c) {
    const el = document.getElementById('contact')
    if (!el) return

    // Remove all child nodes except the h2 heading
    Array.from(el.childNodes).forEach(node => {
      if (node.tagName && node.tagName.toLowerCase() !== 'h2') {
        el.removeChild(node)
      }
    })

    // Create contact icons container
    const iconContainer = document.createElement('div')
    iconContainer.className = 'contact-icons'

    // LinkedIn icon
    if (window.__header && window.__header.linkedin) {
      const a = document.createElement('a')
      a.href = window.__header.linkedin
      a.target = '_blank'
      a.rel = 'noopener'
      a.className = 'contact-icon'
      a.title = 'LinkedIn'
      a.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.026-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667h-3.554v-11.45h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 9.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 10.019H3.555v-11.45h3.564v11.45zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>`
      iconContainer.appendChild(a)
    }

    // Gmail/Email icon
    if (c.email) {
      const a = document.createElement('a')
      a.href = `mailto:${c.email}`
      a.className = 'contact-icon'
      a.title = `Email: ${c.email}`
      a.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`
      iconContainer.appendChild(a)
    }

    if (iconContainer.children.length > 0) {
      el.appendChild(iconContainer)
    }
  }


  function appendWithLinks(el, text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    let lastIndex = 0
    text.replace(urlRegex, (match, url, offset) => {
      if (offset > lastIndex) {
        appendWithLineBreaks(el, text.slice(lastIndex, offset))
      }
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener'
      link.textContent = url
      el.appendChild(link)
      lastIndex = offset + match.length
      return match
    })
    if (lastIndex < text.length) {
      appendWithLineBreaks(el, text.slice(lastIndex))
    }
  }

  function appendWithLineBreaks(el, text) {
    const parts = text.split('\n')
    parts.forEach((part, idx) => {
      if (part.length) {
        el.appendChild(document.createTextNode(part))
      }
      if (idx < parts.length - 1) {
        el.appendChild(document.createElement('br'))
      }
    })
  }

  function renderJourney(journey, lang = 'en') {
    const container = document.getElementById('journey-list')
    if (!container) return
    container.innerHTML = ''
    // add vertical line
    const line = document.createElement('div')
    line.className = 'timeline-line'
    container.appendChild(line)
    // create an observer to reveal rows when they enter viewport
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const row = en.target
          const bubbles = row.querySelectorAll('.bubble')
          bubbles.forEach((b, i) => {
            setTimeout(() => {
              b.classList.add('visible')
              const marker = row.querySelector('.timeline-marker')
              if (marker) marker.classList.add('visible')
            }, 60 * i)
          })
          observer.unobserve(row)
        }
      })
    }, { threshold: 0.18, rootMargin: '0px 0px -12% 0px' })

    journey.forEach((item, idx) => {
      const row = document.createElement('div')
      row.className = 'timeline-row'

      const leftCol = document.createElement('div')
      const centerCol = document.createElement('div')
      const rightCol = document.createElement('div')

      centerCol.className = 'timeline-center'
      leftCol.className = 'timeline-item'
      rightCol.className = 'timeline-item'

      const marker = document.createElement('div')
      marker.className = 'timeline-marker'
      centerCol.appendChild(marker)

      const bubble = (entry) => {
        const wrap = document.createElement('div')
        wrap.className = 'bubble'
        const title = document.createElement('div')
        title.className = 'title'
        title.textContent = `${entry.title} — ${entry.company}`
        const meta = document.createElement('div')
        meta.className = 'meta'
        meta.textContent = `${entry.location} | ${entry.date}`
        wrap.appendChild(title)
        wrap.appendChild(meta)
        const columns = document.createElement('div')
        columns.className = 'journey-columns'

        const projectCol = document.createElement('div')
        projectCol.className = 'journey-col'
        const labels = (window.__i18n && window.__i18n[lang] && window.__i18n[lang].journeyLabels)
          || (window.__i18n && window.__i18n.en && window.__i18n.en.journeyLabels)
          || { projectsRole: 'Projects & Role', achievements: 'Achievements' }
        const projectTitle = document.createElement('div')
        projectTitle.className = 'journey-col-title'
        projectTitle.textContent = labels.projectsRole
        projectCol.appendChild(projectTitle)
        const projectBody = document.createElement('p')
        let projectText = entry.project
        if (lang === 'es' && entry.project_es) projectText = entry.project_es
        if (lang === 'ca' && entry.project_ca) projectText = entry.project_ca
        appendWithLinks(projectBody, projectText || 'Project summary placeholder.')
        projectCol.appendChild(projectBody)
        const projectSeparator = document.createElement('div')
        projectSeparator.className = 'journey-separator'
        projectSeparator.textContent = '------------'
        projectCol.appendChild(projectSeparator)
        const roleBody = document.createElement('p')
        let roleText = entry.role
        if (lang === 'es' && entry.role_es) roleText = entry.role_es
        if (lang === 'ca' && entry.role_ca) roleText = entry.role_ca
        appendWithLinks(roleBody, roleText || 'Role summary placeholder.')
        projectCol.appendChild(roleBody)

        const achievementsCol = document.createElement('div')
        achievementsCol.className = 'journey-col'
        const achievementsTitle = document.createElement('div')
        achievementsTitle.className = 'journey-col-title'
        achievementsTitle.textContent = labels.achievements
        achievementsCol.appendChild(achievementsTitle)
        let bullets = entry.bullets
        if (lang === 'es' && entry.bullets_es) bullets = entry.bullets_es
        if (lang === 'ca' && entry.bullets_ca) bullets = entry.bullets_ca
        if (bullets && bullets.length) {
          const list = document.createElement('div')
          list.className = 'journey-achievements'
          bullets.forEach((b, index) => {
            const item = document.createElement('p')
            item.textContent = b
            list.appendChild(item)
            if (index < bullets.length - 1) {
              const separator = document.createElement('div')
              separator.className = 'journey-separator'
              separator.textContent = '------------'
              list.appendChild(separator)
            }
          })
          achievementsCol.appendChild(list)
        }

        columns.appendChild(projectCol)
        columns.appendChild(achievementsCol)
        wrap.appendChild(columns)
        if (entry.stack) {
          const s = document.createElement('div')
          s.className = 'small'
          s.style.marginTop = '8px'
          s.textContent = `Stack: ${entry.stack}`
          wrap.appendChild(s)
        }
        return wrap
      }

      const content = bubble(item)

      if (idx % 2 === 0) {
        leftCol.appendChild(content)
        row.appendChild(leftCol)
        row.appendChild(centerCol)
        row.appendChild(rightCol)
        leftCol.classList.add('left')
      } else {
        rightCol.appendChild(content)
        row.appendChild(leftCol)
        row.appendChild(centerCol)
        row.appendChild(rightCol)
        rightCol.classList.add('right')
      }

      container.appendChild(row)
      // observe the row for reveal (observer will add visible classes)
      try { obs.observe(row) } catch (e) {
        // fallback: reveal immediately
        const bubbles = row.querySelectorAll('.bubble')
        bubbles.forEach((b, i) => setTimeout(() => b.classList.add('visible'), 80 * idx + i * 60))
        try { marker.classList.add('visible') } catch (e) { }
      }
    })
    // end journey.forEach
  }

  function initDashesBackground() {
    const canvas = document.getElementById('page-matrix')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let particles = []
    const mouse = { x: -1000, y: -1000, lastMove: 0 }

    // Exact Antigravity Colors
    const tlColor = [66, 133, 244]  // Blue #4285f4
    const trColor = [234, 67, 53]   // Red #ea4335
    const brColor = [251, 188, 5]   // Yellow #fbbc05
    const blColor = [52, 168, 83]   // Green #34a853

    function resize() {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      initParticles()
    }

    function initParticles() {
      particles = []
      const spacing = 32 // Increase spacing slightly

      // Jittered Grid (Simulates Poisson Disk Sampling)
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          // Add organic randomness to position
          const originX = x + (Math.random() - 0.5) * spacing * 0.7
          const originY = y + (Math.random() - 0.5) * spacing * 0.7

          particles.push({
            originX,
            originY,
            x: originX,
            y: originY,
            rotation: 0,
            targetRotation: 0,
            // Random offset for drift phase
            phase: Math.random() * Math.PI * 2,
            // Random jitter for rotation to feel organic
            noiseAngle: (Math.random() - 0.5) * 0.5,
            // Per-particle noise offset for shape distortion
            shapeNoise: Math.random()
          })
        }
      }
    }

    // Bilinear interpolation for color
    function getColor(x, y) {
      const u = x / width
      const v = y / height

      // Mix colors based on position
      const r = (1 - v) * ((1 - u) * tlColor[0] + u * trColor[0]) + v * ((1 - u) * blColor[0] + u * brColor[0])
      const g = (1 - v) * ((1 - u) * tlColor[1] + u * trColor[1]) + v * ((1 - u) * blColor[1] + u * brColor[1])
      const b = (1 - v) * ((1 - u) * tlColor[2] + u * trColor[2]) + v * ((1 - u) * blColor[2] + u * brColor[2])

      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
    }

    function updateParticles(time) {
      particles.forEach(p => {
        // Organic drift animation (Simplex-like motion)
        const driftX = Math.sin(time * 0.001 + p.phase) * 2 + Math.cos(time * 0.002 + p.phase) * 2
        const driftY = Math.cos(time * 0.0015 + p.phase) * 2 + Math.sin(time * 0.0025 + p.phase) * 2

        p.x = p.originX + driftX
        p.y = p.originY + driftY

        // Calculate rotation to face mouse
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y

        // Exact atan2 logic
        p.targetRotation = Math.atan2(dy, dx) + p.noiseAngle

        // Smooth rotation (slower easing for weight)
        let diff = p.targetRotation - p.rotation
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        p.rotation += diff * 0.08 // Slightly slower ease
      })
    }

    // Smoothstep function for soft edges
    function smoothstep(min, max, value) {
      var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
      return x * x * (3 - 2 * x);
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height)
      if (!window.__bgEnabled) return

      const isLight = document.documentElement.getAttribute('data-theme') === 'light'
      // Dynamic stability calculation
      const timeSinceMove = Date.now() - mouse.lastMove
      // 0 = just moved (unstable), 1 = stable logic (after 2s)
      const stability = Math.min(1, timeSinceMove / 2000)
      // Distortion is high when unstable (0), low when stable (1)
      const distortion = 1 - Math.pow(stability, 3) // Cubic ease-out for quick stabilization feel

      const baseMaxDist = Math.min(width, height) * 0.45
      const fadeDist = 100 // Fade width at edge of ring

      particles.forEach(p => {
        // Apply distortion to distance check based on particle's noise
        // When moving: ring is jagged. When stable: ring is perfect.
        const noiseEffect = (p.shapeNoise - 0.5) * 300 * distortion
        const effectiveMaxDist = baseMaxDist + noiseEffect

        // Calculate distance from mouse
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Visibility Ring logic: 1.0 at center, fading out to 0 at maxDist
        // Reverse smoothstep: 1 -> 0
        const alpha = 1 - smoothstep(effectiveMaxDist - fadeDist, effectiveMaxDist, dist)

        if (alpha <= 0.01) return

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        ctx.strokeStyle = getColor(p.x, p.y)
        // Base opacity multiplied by ring alpha
        ctx.globalAlpha = (isLight ? 0.8 : 0.9) * alpha
        ctx.lineWidth = 2.5 // Slightly thicker like source
        ctx.lineCap = 'round'

        ctx.beginPath()
        ctx.moveTo(-6, 0)
        ctx.lineTo(6, 0)
        ctx.stroke()

        ctx.restore()
      })
    }

    function animate(time) {
      updateParticles(time)
      draw(time)
      requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.lastMove = Date.now()
    })

    // Initial setup
    resize()
    requestAnimationFrame(animate)
  }

  initDashesBackground()
  loadData()

})
