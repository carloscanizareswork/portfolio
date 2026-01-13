document.addEventListener('DOMContentLoaded', ()=>{
  // Smooth scroll for in-page links
  document.querySelectorAll('a[href^="#"]').forEach(link=>{
    link.addEventListener('click', e=>{
      const href = link.getAttribute('href')
      if(href.length>1){
        e.preventDefault()
        const el = document.querySelector(href)
        if(el) el.scrollIntoView({behavior:'smooth',block:'start'})
        history.replaceState(null, '', href)
      }
    })
  })

  // Active nav on scroll
  const sections = Array.from(document.querySelectorAll('main section[id], header'))
  const navLinks = document.querySelectorAll('.nav-links a')

  function onScroll(){
    const scrollPos = window.scrollY + 120
    let currentId = '#home'
    sections.forEach(s=>{
      if(s.id && s.offsetTop <= scrollPos) currentId = `#${s.id}`
    })
    navLinks.forEach(a=>{
      a.classList.toggle('active', a.getAttribute('href')===currentId)
    })
  }
  window.addEventListener('scroll', onScroll, {passive:true})
  onScroll()

  // Load JSON data and render Journey + Projects
  async function loadData(){
    try{
      const res = await fetch('data/data.json')
      if(!res.ok) throw new Error('Failed to load data')
      const data = await res.json()
      window.__header = data.header || {}
      renderHeader(data.header||{})
      renderJourney(data.journey||[])
      renderExperience(data.experience||[])
      renderSkills(data.skills||{})
      renderEducation(data.education||[])
      renderLanguages(data.languages||[])
      renderContact(data.contact||{})
      // load i18n and wire settings
      try{
        const ti = await fetch('data/i18n.json')
        if(ti.ok){
          window.__i18n = await ti.json()
          initSettings() // set up theme + language UI
        }
      }catch(e){console.warn('i18n load failed',e)}
    }catch(err){
      console.error('Error loading data.json', err)
    }
  }

  function applyTranslations(lang){
    if(!window.__i18n) return
    const set = window.__i18n[lang] || window.__i18n['en']
    // nav items
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n')
      const parts = key.split('.')
      let cur = set
      for(const p of parts){ if(cur && cur[p]!==undefined) cur = cur[p]; else { cur = null; break } }
      if(cur) el.textContent = cur
    })
    // hero intro
    const intro = set.hero && set.hero.intro
    if(intro){ const el = document.getElementById('hero-intro'); if(el) el.textContent = intro }
  }

  function initSettings(){
    // theme: read from localStorage or prefers-color-scheme
    const savedTheme = localStorage.getItem('site-theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = savedTheme || (prefersDark ? 'dark' : 'light')
    applyTheme(theme)

    // language
    const savedLang = localStorage.getItem('site-lang') || 'es'
    applyTranslations(savedLang)

    // settings menu behaviors
    const toggle = document.getElementById('settings-toggle')
    const menu = document.getElementById('settings-menu')
    if(toggle && menu){
      toggle.addEventListener('click', ()=>{
        const open = toggle.getAttribute('aria-expanded') === 'true'
        toggle.setAttribute('aria-expanded', String(!open))
        menu.style.display = open ? 'none' : 'block'
        menu.setAttribute('aria-hidden', String(open))
      })
      document.addEventListener('click', (e)=>{
        if(!menu.contains(e.target) && !toggle.contains(e.target)){
          menu.style.display = 'none'
          toggle.setAttribute('aria-expanded','false')
        }
      })
    }

    // theme option clicks
    document.querySelectorAll('.theme-option').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const t = btn.getAttribute('data-theme')
        applyTheme(t)
        localStorage.setItem('site-theme', t)
      })
    })

    // language option clicks
    document.querySelectorAll('.lang-option').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const l = btn.getAttribute('data-lang')
        applyTranslations(l)
        localStorage.setItem('site-lang', l)
      })
    })
    // settings menu is positioned by CSS (absolute inside the nav item)
  }

  function applyTheme(name){
    if(name === 'dark') document.documentElement.setAttribute('data-theme','dark')
    else document.documentElement.removeAttribute('data-theme')
  }

  function renderHeader(h){
    console.log('renderHeader called with:', h)
    const nameEl = document.getElementById('hero-name')
    const roleEl = document.getElementById('hero-role')
    const introEl = document.getElementById('hero-intro')
    const linksEl = document.getElementById('hero-links')
    if(nameEl) nameEl.textContent = h.name || nameEl.textContent
    if(roleEl){
      if(h.title){
        let roleHTML = `<span class="role-title">${h.title}</span>`
        if(h.location){
          roleHTML += `<span class="role-location"><svg class="role-location-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg><span>${h.location}</span></span>`
        }
        roleEl.innerHTML = roleHTML
      }
    }
    if(introEl){
      console.log('introEl found, setting text:', h.intro ? h.intro.substring(0, 50) : 'NO INTRO')
      if(h.intro) introEl.textContent = h.intro
    } else {
      console.log('introEl NOT found')
    }
    if(linksEl){
      linksEl.innerHTML = ''
      // CV link
      const cvA = document.createElement('a')
      cvA.className = 'btn'
      cvA.id = 'cv-link'
      cvA.href = 'assets/Carlos_Canizares_CV_LIGHT_SINGLE_PHOTO_REBUILT.pdf'
      cvA.target = '_blank'
      cvA.textContent = 'Descargar CV'
      linksEl.appendChild(cvA)
      // Contact icons container
      const iconContainer = document.createElement('div')
      iconContainer.className = 'contact-icons'
      // LinkedIn icon
      if(window.__header && window.__header.linkedin){
        const linkedinIcon = document.createElement('a')
        linkedinIcon.href = window.__header.linkedin
        linkedinIcon.target = '_blank'
        linkedinIcon.className = 'contact-icon'
        linkedinIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.39v-1.2h-2.84v8.37h2.84v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.84M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>'
        iconContainer.appendChild(linkedinIcon)
      }
      // Gmail icon
      if(window.__header && window.__header.email){
        const gmailIcon = document.createElement('a')
        gmailIcon.href = `mailto:${window.__header.email}`
        gmailIcon.className = 'contact-icon'
        gmailIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'
        iconContainer.appendChild(gmailIcon)
      }
      linksEl.appendChild(iconContainer)
    }
  }

  function renderExperience(items){
    const el = document.getElementById('experience-list')
    if(!el) return
    el.innerHTML = ''
    items.forEach(it=>{
      const card = document.createElement('div')
      card.className = 'card'
      const h3 = document.createElement('h3')
      h3.textContent = `${it.title} — ${it.company}`
      const meta = document.createElement('div')
      meta.className = 'meta'
      meta.textContent = `${it.location || ''} | ${it.date || ''}`
      card.appendChild(h3)
      card.appendChild(meta)
      if(it.bullets && it.bullets.length){
        const ul = document.createElement('ul')
        it.bullets.forEach(b=>{ const li = document.createElement('li'); li.textContent = b; ul.appendChild(li) })
        card.appendChild(ul)
      }
      if(it.stack){ const s = document.createElement('div'); s.className='small'; s.textContent = `Stack: ${it.stack}`; card.appendChild(s) }
      el.appendChild(card)
    })
  }

  function renderSkills(skills){
    const card = document.getElementById('skills-card')
    if(!card) return
    card.innerHTML = ''
    const list = document.createElement('div')
    for(const k of Object.keys(skills)){
      const row = document.createElement('div')
      const label = document.createElement('strong')
      label.textContent = `${k.replace(/([A-Z])/g,' $1')}: `
      const span = document.createElement('span')
      span.textContent = skills[k]
      row.appendChild(label)
      row.appendChild(span)
      row.style.marginBottom = '8px'
      list.appendChild(row)
    }
    card.appendChild(list)
  }

  function renderEducation(items){
    const el = document.getElementById('education-list')
    if(!el) return
    el.innerHTML = ''
    items.forEach(it=>{
      const div = document.createElement('div')
      div.className = 'edu-item'
      div.innerHTML = `<strong>${it.name}</strong> — ${it.school || ''} ${it.year ? `(${it.year})` : ''} ${it.note ? '- ' + it.note : ''}`
      el.appendChild(div)
    })
  }

  function renderLanguages(list){
    const el = document.getElementById('languages-list')
    if(!el) return
    el.innerHTML = ''
    const container = document.createElement('div')
    container.className = 'taglist'
    list.forEach(l=>{ const s = document.createElement('span'); s.className='tag'; s.textContent = l; container.appendChild(s) })
    el.appendChild(container)
  }

  function renderContact(c){
    const el = document.getElementById('contact')
    if(!el) return
    
    // Remove all child nodes except the h2 heading
    Array.from(el.childNodes).forEach(node => {
      if(node.tagName && node.tagName.toLowerCase() !== 'h2') {
        el.removeChild(node)
      }
    })
    
    // Create contact icons container
    const iconContainer = document.createElement('div')
    iconContainer.className = 'contact-icons'
    
    // LinkedIn icon
    if(window.__header && window.__header.linkedin){
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
    if(c.email){
      const a = document.createElement('a')
      a.href = `mailto:${c.email}`
      a.className = 'contact-icon'
      a.title = `Email: ${c.email}`
      a.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`
      iconContainer.appendChild(a)
    }
    
    if(iconContainer.children.length > 0){
      el.appendChild(iconContainer)
    }
  }

  function renderJourney(journey){
    const container = document.getElementById('journey-list')
    if(!container) return
    container.innerHTML = ''
    // add vertical line
    const line = document.createElement('div')
    line.className = 'timeline-line'
    container.appendChild(line)
    // create an observer to reveal rows when they enter viewport
    const obs = new IntersectionObserver((entries, observer)=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          const row = en.target
          const bubbles = row.querySelectorAll('.bubble')
          bubbles.forEach((b,i)=>{
            setTimeout(()=>{
              b.classList.add('visible')
              const marker = row.querySelector('.timeline-marker')
              if(marker) marker.classList.add('visible')
            }, 60 * i)
          })
          observer.unobserve(row)
        }
      })
    },{threshold:0.18,rootMargin:'0px 0px -12% 0px'})

    journey.forEach((item, idx)=>{
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

      const bubble = (entry)=>{
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
        if(entry.bullets && entry.bullets.length){
          const ul = document.createElement('ul')
          entry.bullets.forEach(b=>{ const li = document.createElement('li'); li.textContent = b; ul.appendChild(li) })
          wrap.appendChild(ul)
        }
        if(entry.stack){
          const s = document.createElement('div')
          s.className = 'small'
          s.style.marginTop = '8px'
          s.textContent = `Stack: ${entry.stack}`
          wrap.appendChild(s)
        }
        return wrap
      }

      const content = bubble(item)

      if(idx % 2 === 0){
        leftCol.appendChild(content)
        row.appendChild(leftCol)
        row.appendChild(centerCol)
        row.appendChild(rightCol)
        leftCol.classList.add('left')
      }else{
        rightCol.appendChild(content)
        row.appendChild(leftCol)
        row.appendChild(centerCol)
        row.appendChild(rightCol)
        rightCol.classList.add('right')
      }

      container.appendChild(row)
      // observe the row for reveal (observer will add visible classes)
      try{ obs.observe(row) }catch(e){
        // fallback: reveal immediately
        const bubbles = row.querySelectorAll('.bubble')
        bubbles.forEach((b,i)=> setTimeout(()=> b.classList.add('visible'), 80 * idx + i * 60))
        try{ marker.classList.add('visible') }catch(e){}
      }
    })
    // end journey.forEach
  }

  // Projects removed: no renderProjects function required

  function initMatrixBackground(){
    const canvas = document.getElementById('page-matrix')
    if(!canvas) return
    const ctx = canvas.getContext('2d')
    if(!ctx) return
    const colorParser = document.createElement('canvas').getContext('2d')
    function normalizeColor(str){
      if(!str) return '#6c5ce7'
      try{
        colorParser.fillStyle = '#000'
        colorParser.fillStyle = str
        return colorParser.fillStyle || '#6c5ce7'
      }catch(e){
        return '#6c5ce7'
      }
    }
    function lighten(hex, amt){
      const normalized = normalizeColor(hex).replace('#','')
      const num = parseInt(normalized,16)
      if(Number.isNaN(num)) return '#6c5ce7'
      const r = Math.min(255, (num >> 16) + amt)
      const g = Math.min(255, ((num >> 8) & 255) + amt)
      const b = Math.min(255, (num & 255) + amt)
      return `rgb(${r}, ${g}, ${b})`
    }
    const getAccent = ()=> lighten(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6c5ce7', 40)
    let accentColor = getAccent()
    const observer = new MutationObserver(()=>{ accentColor = getAccent() })
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})

    let width = 0
    let height = 0
    let drops = []

    function createDrop(){
      return {
        x: Math.random()*width,
        y: Math.random()*height,
        len: height*0.25 + Math.random()*80,
        speed: 90 + Math.random()*120,
        thickness: 1 + Math.random()*1.6
      }
    }

    function resize(){
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      const count = Math.max(18, Math.floor(width / 80))
      drops = Array.from({length: count}, ()=>createDrop())
    }

    window.addEventListener('resize', resize)
    resize()

    let last = 0
    function render(now){
      if(!last) last = now
      const delta = (now - last) / 1000
      last = now
      ctx.clearRect(0,0,width,height)

      drops.forEach(drop=>{
        drop.y += drop.speed * delta
        if(drop.y - drop.len > height){
          drop.x = Math.random()*width
          drop.y = -Math.random()*height*0.2
          drop.len = height*0.25 + Math.random()*80
          drop.speed = 90 + Math.random()*120
          drop.thickness = 1 + Math.random()*1.6
        }
        ctx.save()
        ctx.strokeStyle = accentColor
        ctx.globalAlpha = 0.45
        ctx.lineWidth = drop.thickness
        ctx.beginPath()
        ctx.moveTo(drop.x, drop.y)
        ctx.lineTo(drop.x, drop.y - drop.len)
        ctx.stroke()
        ctx.globalAlpha = 0.85
        ctx.fillStyle = accentColor
        ctx.beginPath()
        ctx.arc(drop.x, drop.y, 3, 0, Math.PI*2)
        ctx.fill()
        ctx.restore()
      })
      requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
  }

  initMatrixBackground()
  loadData()

})
