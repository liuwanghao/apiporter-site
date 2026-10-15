/** Mount a product-specific walkthrough using the shared simulated desktop. */
export function mountDesktopTutorial(window, options) {
  const COPY = options.copy
  const document = window.document
  const navigator = window.navigator
  const Element = window.Element
  const HTMLInputElement = window.HTMLInputElement
  const app = document.querySelector('#app')

  const SIGN_UP_URL = `${window.location.origin}/sign-up`
  const API_KEYS_URL = `${window.location.origin}/keys`
  const DOCS_URL = `${window.location.origin}/docs/${options.slug}`
  const WEB_URL = window.location.origin
  const appDownloadUrl = options.appDownloadUrl
  const INSTALL_COMMANDS = {
    mac: `curl -fsSL ${window.location.origin}/install/${options.installer}.sh | sh`,
    windows: `irm ${window.location.origin}/install/${options.installer}.ps1 | iex`,
  }

  const state = {
    view: 'language',
    lang: null,
    platform: null,
    signupStep: 0,
    desktopStep: 0,
    installStep: 0,
    query: '',
    typedCommand: '',
    toastTimer: null,
    typeTimer: null,
    typing: false,
    manualCopy: false,
    pointerDownInsideSurface: false,
  }

  const escapeHtml = (value) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')

  function isEn() {
    return state.lang === 'en'
  }

  function t(key, vars) {
    const table = COPY[state.lang] ?? COPY.zh
    let text = table[key] ?? COPY.zh[key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([name, value]) => {
        text = text.replaceAll(`{${name}}`, value)
      })
    }
    return text
  }

  function attr(key) {
    return escapeHtml(t(key))
  }

  function appHintMarkup(className) {
    if (!appDownloadUrl) return ''
    return `${t('also_app_before')}<a class="${className}" href="${appDownloadUrl}" target="_blank" rel="noreferrer">${t('also_app_link')}</a>${t('also_app_after')}`
  }

  function syncDocumentLang() {
    document.documentElement.lang = state.lang || 'zh'
    if (state.lang) {
      document.title = isEn()
        ? `${options.name} Quick Setup – Interactive Guide | ApiPorter`
        : `${options.name} 快速配置：互动教学 | ApiPorter`
    }
  }

  function installerLangKey() {
    return isEn() ? '3' : '1'
  }

  function logoMarkup() {
    return '<img class="brand-symbol" src="/brand/apiporter-logo.png" alt="" width="64" height="64" />'
  }

  function systemLogoMarkup(platform, className = 'system-logo') {
    if (platform === 'mac') {
      return `
        <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="currentColor"/>
        </svg>
      `
    }
    return `
      <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z" fill="currentColor"/>
      </svg>
    `
  }

  function systemUiIconMarkup(name) {
    const icons = {
      search:
        '<svg class="system-ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.75" stroke="currentColor" stroke-width="1.8"/><path d="m15 15 4.25 4.25" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/></svg>',
      folder:
        '<svg class="system-ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.75 6.5A2.5 2.5 0 0 1 5.25 4h4l2 2h7.5a2.5 2.5 0 0 1 2.5 2.5v8.75a2.75 2.75 0 0 1-2.75 2.75h-13a2.75 2.75 0 0 1-2.75-2.75V6.5Z" fill="#f5c64d"/><path d="M2.75 9h18.5v8.25A2.75 2.75 0 0 1 18.5 20h-13a2.75 2.75 0 0 1-2.75-2.75V9Z" fill="#ffd971"/></svg>',
      browser:
        '<svg class="system-ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="#0b82d8"/><path d="M4.2 14.8c1.5 3.8 6.3 5.9 10.4 3.9 2.6-1.3 3.7-3.5 3.4-5.2-.5 1.5-2.2 2.6-4.4 2.6-2.9 0-4.9-1.6-4.9-3.7 0-2.5 2.3-4.8 6.9-4.4-4.1-2.5-9.6-.5-11.2 3.9-.4 1-.5 2-.2 2.9Z" fill="#18c5b4"/><path d="M8.7 12.4c0 2.1 2 3.7 4.9 3.7 2.2 0 3.9-1.1 4.4-2.6.6-2.1-.7-4.3-2.4-5.5-4.6-.4-6.9 1.9-6.9 4.4Z" fill="#eaf8ff"/></svg>',
      computer:
        '<svg class="system-ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3.5" width="18" height="13" rx="1.8" fill="#7ac7f5" stroke="#eaf8ff"/><path d="M8 20.5h8M10 16.5l-.8 4M14 16.5l.8 4" stroke="#eaf8ff" stroke-linecap="round" stroke-width="1.5"/></svg>',
      setup:
        '<svg class="system-ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h3.4l2 2H19a2 2 0 0 1 2 2v9.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z" fill="#f2c14e"/><path d="m12 9 1 2 2.2.3-1.6 1.6.4 2.1-2-1-2 1 .4-2.1-1.6-1.6 2.2-.3 1-2Z" fill="#fff"/></svg>',
      run: '<svg class="system-ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h18M7 6h.01M10 6h.01" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"/><path d="m10 11 5 2.5-5 2.5v-5Z" fill="currentColor"/></svg>',
      drive:
        '<svg class="system-ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="#d9e2ef" stroke="#fff"/><path d="M6 15h12" stroke="#75869e" stroke-linecap="round"/><circle cx="17.5" cy="16.5" r="1" fill="#34c759"/></svg>',
      package:
        '<svg class="system-ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.75 8 4.5v9.5l-8 4.5-8-4.5v-9.5l8-4.5Z" fill="#c9935b"/><path d="m4.5 7.5 7.5 4.25 7.5-4.25M12 11.75v8.75" fill="none" stroke="#fff4e8" stroke-width="1.35"/></svg>',
    }
    return icons[name] || ''
  }

  function brandMarkup() {
    return `<a class="brand-lockup" href="${WEB_URL}" data-action="home" aria-label="ApiPorter">${logoMarkup()}</a>`
  }

  function backMarkup(action = 'back') {
    return `<button class="corner-action" type="button" data-action="${action}" aria-label="${attr('back')}">${t('back')}</button>`
  }

  function showToast(message) {
    document.querySelector('.toast')?.remove()
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.setAttribute('role', 'status')
    toast.textContent = message
    document.body.append(toast)
    window.clearTimeout(state.toastTimer)
    state.toastTimer = window.setTimeout(() => toast.remove(), 2800)
  }

  function installCommand() {
    return state.platform === 'windows'
      ? INSTALL_COMMANDS.windows
      : INSTALL_COMMANDS.mac
  }

  async function copyCommand() {
    const command = installCommand()
    let copied = false
    try {
      await navigator.clipboard.writeText(command)
      copied = true
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = command
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.append(textarea)
      textarea.select()
      try {
        copied = document.execCommand('copy')
      } catch {
        copied = false
      }
      textarea.remove()
      app.focus({ preventScroll: true })
    }
    showToast(t(copied ? 'copied' : 'copy_failed'))
    return copied
  }

  function navigate(path) {
    if (window.parent === window) {
      window.location.assign(path)
    } else {
      window.parent.postMessage(
        { type: `apiporter:${options.slug}-navigate`, path },
        window.location.origin
      )
    }
  }

  function stopMacTyping() {
    window.clearInterval(state.typeTimer)
    state.typeTimer = null
    state.typing = false
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function startMacSearchType() {
    if (state.platform !== 'mac' || state.desktopStep !== 1 || state.typing) {
      return
    }
    const text = 'terminal'
    if (prefersReducedMotion()) {
      state.query = text
      state.desktopStep = 2
      render()
      return
    }
    state.typing = true
    state.query = ''
    const input = document.querySelector('[data-os-search]')
    if (input instanceof HTMLInputElement) {
      input.value = ''
      input.focus()
    }
    let index = 0
    state.typeTimer = window.setInterval(() => {
      index += 1
      state.query = text.slice(0, index)
      const live = document.querySelector('[data-os-search]')
      if (live instanceof HTMLInputElement) {
        live.value = state.query
        live.focus()
        live.setSelectionRange(state.query.length, state.query.length)
      }
      if (index >= text.length) {
        stopMacTyping()
        state.desktopStep = 2
        render()
      }
    }, 70)
  }

  function startWinRunType() {
    if (
      state.platform !== 'windows' ||
      state.desktopStep !== 1 ||
      state.typing
    ) {
      return
    }
    const text = 'powershell'
    if (prefersReducedMotion()) {
      state.query = text
      state.desktopStep = 2
      render()
      return
    }
    state.typing = true
    state.query = ''
    const input = document.querySelector('[data-os-search]')
    if (input instanceof HTMLInputElement) {
      input.value = ''
      input.focus()
    }
    let index = 0
    state.typeTimer = window.setInterval(() => {
      index += 1
      state.query = text.slice(0, index)
      const live = document.querySelector('[data-os-search]')
      if (live instanceof HTMLInputElement) {
        live.value = state.query
        live.focus()
        live.setSelectionRange(state.query.length, state.query.length)
      }
      if (index >= text.length) {
        stopMacTyping()
        state.desktopStep = 2
        render()
      }
    }, 70)
  }

  function resetInstall() {
    stopMacTyping()
    state.manualCopy = false
    state.installStep = 0
    state.typedCommand = ''
  }

  function reset(options = {}) {
    resetInstall()
    const keepLang = Boolean(options.keepLang && state.lang)
    state.view = keepLang ? 'welcome' : 'language'
    if (!keepLang) state.lang = null
    state.platform = null
    state.signupStep = 0
    state.desktopStep = 0
    state.query = ''
    syncDocumentLang()
    render()
  }

  function showPlatform() {
    resetInstall()
    state.view = 'platform'
    state.platform = null
    state.desktopStep = 0
    state.query = ''
    render()
  }

  function chooseRoute(route) {
    resetInstall()
    state.desktopStep = 0
    state.query = ''
    if (route === 'ready') {
      showPlatform()
    } else {
      state.view = 'signup'
      state.signupStep = 0
      render()
    }
  }

  function choosePlatform(platform) {
    resetInstall()
    state.platform = platform
    state.view = 'desktop'
    state.desktopStep = 0
    state.query = ''
    render()
  }

  function startInstallCommandType() {
    const text = installCommand()
    if (prefersReducedMotion()) {
      state.typedCommand = text
      render()
      return
    }
    stopMacTyping()
    state.typing = true
    state.typedCommand = ''
    let index = 0
    state.typeTimer = window.setInterval(() => {
      index += 1
      state.typedCommand = text.slice(0, index)
      const live = document.querySelector('[data-install-command]')
      if (live) live.textContent = state.typedCommand
      if (index >= text.length) {
        stopMacTyping()
        showInstallRunChoice()
      }
    }, 28)
  }

  function showInstallRunChoice() {
    const log = document.querySelector('.term-log')
    if (!log || log.querySelector('[data-action="install-run"]')) return
    const wrap = document.createElement('div')
    wrap.className = 'term-choices'
    const button = document.createElement('button')
    button.className = 'term-choice os-target'
    button.type = 'button'
    button.dataset.action = 'install-run'
    button.textContent = t('enter_key')
    wrap.append(button)
    const firstLine = log.querySelector('.term-line')
    if (firstLine) firstLine.after(wrap)
    else log.append(wrap)
  }

  function eventElement(event) {
    const target = event.target
    if (target instanceof Element) return target
    return target instanceof Node ? target.parentElement : null
  }

  function desktopOverlay(element) {
    return (
      element?.closest(
        [
          '.mac-launchpad',
          '.mac-terminal-window',
          '.win-run-dialog',
          '.win-hotkeys',
          '.win-powershell-window',
          '.os-coach',
          '.os-handoff',
        ].join(', ')
      ) || null
    )
  }

  function dismissDesktopOverlay() {
    if (state.view !== 'desktop') return false
    if (
      state.platform === 'mac' &&
      state.desktopStep >= 1 &&
      state.desktopStep < 4
    ) {
      stopMacTyping()
      state.desktopStep = 0
      state.query = ''
      render()
      return true
    }
    if (
      state.platform === 'windows' &&
      state.desktopStep >= 1 &&
      state.desktopStep < 4
    ) {
      stopMacTyping()
      state.desktopStep = 0
      state.query = ''
      render()
      return true
    }
    return false
  }

  function openInstallTerminal() {
    resetInstall()
    state.desktopStep = 4
    render()
    startInstallCommandType()
  }

  function renderLanguage() {
    return `
      <section class="view welcome-view site-onboarding is-active" data-view="language">
        ${brandMarkup()}
        <div class="welcome-frame">
          <div class="choice-grid" role="group" aria-label="选择语言 Choose language">
            <button class="choice" type="button" data-lang="zh">
              <span class="choice-index" aria-hidden="true">01 / 02</span>
              <span class="choice-title">简体中文</span>
              <span class="choice-sub">使用中文继续</span>
            </button>
            <button class="choice" type="button" data-lang="en">
              <span class="choice-index" aria-hidden="true">02 / 02</span>
              <span class="choice-title">English</span>
              <span class="choice-sub">Continue in English</span>
            </button>
          </div>
        </div>
      </section>
    `
  }

  function preferredLangFromQuery() {
    try {
      const lang = new URLSearchParams(window.location.search).get('lang')
      if (!lang) return null
      const lower = lang.toLowerCase()
      if (lower === 'en' || lower.startsWith('en-')) return 'en'
      if (['zh-tw', 'zh-hant', 'zh-hk'].includes(lower)) return 'zh-TW'
      if (lower === 'zh' || lower.startsWith('zh')) return 'zh'
      return null
    } catch {
      return null
    }
  }

  function preferredLangFromPath() {
    const segment = window.location.pathname.split('/').find(Boolean)
    if (!segment) return null
    const lower = segment.toLowerCase()
    if (lower === 'en' || lower.startsWith('en-')) return 'en'
    if (['zh-tw', 'zh-hant', 'zh-hk'].includes(lower)) return 'zh-TW'
    if (lower === 'zh' || lower.startsWith('zh')) return 'zh'
    return null
  }

  function preferredLangFromLocation() {
    return preferredLangFromQuery() || preferredLangFromPath()
  }

  function chooseLanguage(lang) {
    state.lang = Object.hasOwn(COPY, lang) ? lang : 'zh'
    state.view = 'welcome'
    syncDocumentLang()
    render()
  }

  function renderWelcome() {
    return `
      <section class="view welcome-view site-onboarding is-active" data-view="welcome">
        ${brandMarkup()}
        ${backMarkup('back')}
        <div class="welcome-frame">
          <div class="platform-kicker">${escapeHtml(options.name)} · ${t('tutorial_label')}</div>
          <h1 class="platform-title">${t('account_status')}</h1>
          <div class="choice-grid" role="group" aria-label="${attr('account_status')}">
            <button class="choice" type="button" data-choice="ready">
              <span class="choice-index" aria-hidden="true">01 / 02</span>
              <span class="choice-title">${t('ready')}</span>
            </button>
            <button class="choice" type="button" data-choice="new">
              <span class="choice-index" aria-hidden="true">02 / 02</span>
              <span class="choice-title">${t('not_ready')}</span>
            </button>
          </div>
          <p class="onboarding-note">${t('term_note')}</p>
        </div>
      </section>
    `
  }

  function renderSignup() {
    const isKeyStep = state.signupStep === 1
    const content = isKeyStep
      ? `
          <div class="signup-mark">${logoMarkup()}</div>
          <h1>${t('create_key_title')}</h1>
          <p class="signup-instruction">${t('create_key_copy')}</p>
          <div class="signup-action-row">
            <a class="action primary" href="${API_KEYS_URL}" target="_blank" rel="noreferrer">${t('open_keys')}</a>
            <button class="action" type="button" data-action="key-ready">${t('key_ready')}</button>
          </div>
        `
      : `
          <div class="signup-mark">${logoMarkup()}</div>
          <h1>${t('join_title')}</h1>
          <p class="signup-instruction">${t('join_copy')}</p>
          <div class="signup-action-row">
            <a class="action primary" href="${SIGN_UP_URL}" target="_blank" rel="noreferrer">${t('go_signup')}</a>
            <button class="action" type="button" data-action="signup-done">${t('signup_done')}</button>
          </div>
        `

    return `
      <section class="view signup-view site-onboarding is-active" data-view="signup">
        ${brandMarkup()}
        ${backMarkup('back')}
        <div class="browser-window">
          <div class="window-bar"><span class="traffic-lights"><i></i><i></i><i></i></span><span>${escapeHtml(window.location.host)}</span><span>SIMULATED</span></div>
          <div class="signup-content">${content}</div>
        </div>
      </section>
    `
  }

  function renderPlatform() {
    return `
      <section class="view platform-view site-onboarding is-active" data-view="platform">
        ${brandMarkup()}
        ${backMarkup('back')}
        <div class="platform-frame">
          <div class="platform-kicker">${escapeHtml(options.name)} · ${t('tutorial_label')}</div>
          <h1 class="platform-title">${t('your_computer')}</h1>
          <div class="platform-grid" role="group" aria-label="${attr('choose_os')}">
            <button class="platform-choice" type="button" data-platform="mac">
              <div class="platform-choice-head">
                <span class="platform-icon mac" aria-hidden="true">${systemLogoMarkup('mac')}</span>
                <span class="platform-kicker">01 / DESKTOP</span>
              </div>
              <div>
                <h2>macOS</h2>
                <p>${t('mac_desc')}</p>
                <div class="platform-shortcut">${t('mac_shortcut')}</div>
              </div>
            </button>
            <button class="platform-choice" type="button" data-platform="windows">
              <div class="platform-choice-head">
                <span class="platform-icon windows" aria-hidden="true">${systemLogoMarkup('windows')}</span>
                <span class="platform-kicker">02 / DESKTOP</span>
              </div>
              <div>
                <h2>Windows</h2>
                <p>${t('win_desc')}</p>
                <div class="platform-shortcut">${t('win_shortcut')}</div>
              </div>
            </button>
          </div>
        </div>
      </section>
    `
  }

  function coachMarkup(platform, step) {
    const appName = platform === 'mac' ? 'Terminal' : 'PowerShell'
    const steps =
      platform === 'mac'
        ? [
            ['1 / 8', t('coach_mac_1_title'), t('coach_mac_1_copy')],
            ['2 / 8', t('coach_mac_2_title'), t('coach_mac_2_copy')],
            ['3 / 8', t('coach_mac_3_title'), t('coach_mac_3_copy')],
          ]
        : [
            ['1 / 8', t('coach_win_1_title'), t('coach_win_1_copy')],
            ['2 / 8', t('coach_win_2_title'), t('coach_win_2_copy')],
            ['3 / 8', t('coach_win_3_title'), t('coach_win_3_copy')],
          ]
    steps.push(
      ['4 / 8', t('coach_4_title'), t('coach_4_copy')],
      ['5 / 8', t('coach_5_title'), t('coach_5_copy')],
      ['6 / 8', t('coach_6_title'), t('coach_6_copy')],
      ['7 / 8', t('coach_7_title'), t('coach_7_copy')],
      ['8 / 8', t('coach_8_title'), t('coach_8_copy', { app: appName })]
    )
    let index = Math.min(3 + state.installStep, 7)
    if (state.desktopStep >= 5) index = 7
    if (step <= 2) index = step
    const [progress, title, copy] = steps[index]
    return `
      <aside class="os-coach" aria-live="polite">
        <div class="os-kicker">${platform === 'mac' ? 'macOS' : 'WINDOWS'} · FOLLOW ALONG</div>
        <h2>${title}</h2>
        <p>${copy}</p>
        <div class="os-progress"><i></i><span>${progress}</span></div>
      </aside>
    `
  }

  function macDockIcon(name) {
    const icons = {
      apps: `
        <svg class="mac-dock-icon" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="1.5" y="1.5" width="61" height="61" rx="16" fill="#f3f5f8"/>
          <rect x="10" y="10" width="18" height="18" rx="5" fill="#5b9dff"/>
          <rect x="36" y="10" width="18" height="18" rx="5" fill="#34d59a"/>
          <rect x="10" y="36" width="18" height="18" rx="5" fill="#ff8a4c"/>
          <rect x="36" y="36" width="18" height="18" rx="5" fill="#a78bfa"/>
        </svg>`,
      safari: `
        <svg class="mac-dock-icon" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="#2f9ef0"/>
          <circle cx="32" cy="32" r="23.5" fill="#f4f9ff"/>
          <circle cx="32" cy="32" r="19.5" fill="#64b7ff"/>
          <path d="M32 11.5 37.4 32 32 52.5 26.6 32Z" fill="#e23d3d"/>
          <path d="M32 11.5 26.6 32 32 23Z" fill="#fff"/>
        </svg>`,
      messages: `
        <svg class="mac-dock-icon" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#32c75b"/>
          <path d="M18 23.5h28a7 7 0 0 1 7 7v9a7 7 0 0 1-7 7H29l-9 7.5V46.5h-2a7 7 0 0 1-7-7v-9a7 7 0 0 1 7-7Z" fill="#fff"/>
        </svg>`,
      mail: `
        <svg class="mac-dock-icon" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#5aa7f6"/>
          <rect x="12" y="19" width="40" height="27" rx="4" fill="#fff"/>
          <path d="M14 21.5 32 34l18-12.5" fill="none" stroke="#5aa7f6" stroke-width="2.4" stroke-linecap="round"/>
        </svg>`,
      photos: `
        <svg class="mac-dock-icon" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#eef4fb"/>
          <circle cx="44" cy="20" r="7" fill="#f2c14e"/>
          <path d="M6 42.5 22 28l12 10 10-14 14 18v12a10 10 0 0 1-10 10H16A10 10 0 0 1 6 54V42.5Z" fill="#5bb56f"/>
          <path d="M6 48 24 33l11 9 11-13 12 15v10a10 10 0 0 1-10 10H16A10 10 0 0 1 6 54V48Z" fill="#3e9458"/>
        </svg>`,
      music: `
        <svg class="mac-dock-icon" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#ff5c86"/>
          <circle cx="24" cy="43" r="7" fill="#fff"/>
          <path d="M30 43V18.5l16-3V37" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
          <circle cx="46" cy="37" r="7" fill="#fff"/>
        </svg>`,
      settings: `
        <svg class="mac-dock-icon" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#8d94a3"/>
          <circle cx="32" cy="32" r="11" fill="none" stroke="#fff" stroke-width="5"/>
          <path d="M32 12v6M32 46v6M12 32h6M46 32h6M18 18l4.2 4.2M41.8 41.8 46 46M18 46l4.2-4.2M41.8 22.2 46 18" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        </svg>`,
      trash: `
        <svg class="mac-dock-icon" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#d7dbe3"/>
          <path d="M20 24h24l-2.2 24H22.2Z" fill="#9aa3b2"/>
          <path d="M18 20h28M26 20V16h12v4" fill="none" stroke="#6f7786" stroke-width="3" stroke-linecap="round"/>
        </svg>`,
    }
    return icons[name] || ''
  }

  function macLaunchpadMarkup() {
    const hasResult = state.desktopStep === 2
    const typed = state.query.trim()
    const categories = [
      t('cat_social'),
      t('cat_productivity'),
      'Developer Tools',
      t('cat_tools'),
      t('cat_entertainment'),
      t('cat_creative'),
      t('cat_other'),
    ]
    const decoys = [
      [t('dock_messages'), 'messages'],
      [t('dock_mail'), 'mail'],
      [t('dock_photos'), 'photos'],
      [t('dock_music'), 'music'],
      [t('dock_settings'), 'settings'],
      [t('decoy_browser'), 'safari'],
    ]
    let body
    if (hasResult) {
      body = `<button class="mac-launch-app is-terminal os-target" type="button" data-action="mac-open-terminal">
          <span class="mac-launch-term-icon" aria-hidden="true"><span class="mac-terminal-glyph">›_</span></span>
          <span>${t('terminal_app')}</span>
        </button>`
    } else if (typed) {
      body = `<div class="mac-launch-empty">${t('launch_empty')}</div>`
    } else {
      body = decoys
        .map(
          ([label, icon]) => `
            <button class="mac-launch-app is-decoy" type="button" data-wrong="${attr('launch_wrong')}">
              ${macDockIcon(icon)}
              <span>${label}</span>
            </button>`
        )
        .join('')
    }
    return `
      <div class="mac-launch-scrim" data-action="mac-dismiss-launcher"></div>
      <div class="mac-launchpad" aria-label="${attr('launch_label')}">
        <div class="mac-launch-search ${state.desktopStep === 1 ? 'os-target is-action' : ''}" ${state.desktopStep === 1 ? 'data-action="mac-type-search" role="button" tabindex="0"' : ''}>
          <span class="mac-launch-mark" aria-hidden="true">${systemUiIconMarkup('search')}</span>
          <div class="mac-launch-field">
            <label class="sr-only" for="mac-os-search">${t('launch_search')}</label>
            <input id="mac-os-search" class="mac-launch-input" data-os-search type="text" value="${escapeHtml(state.query)}" placeholder="${attr('launch_placeholder')}" autocomplete="off" spellcheck="false" readonly tabindex="-1" />
            ${hasResult ? `<span class="mac-launch-hint">${t('launch_hint')}</span>` : ''}
          </div>
          <div class="mac-launch-tools">
            ${hasResult ? `<span class="mac-launch-tool" aria-hidden="true">&gt;_</span>` : ''}
            <span class="mac-launch-tool" aria-hidden="true">···</span>
          </div>
        </div>
        <div class="mac-launch-cats">
          ${categories.map((label) => `<span class="mac-launch-cat ${hasResult && label === 'Developer Tools' ? 'is-active' : ''}">${label}</span>`).join('')}
        </div>
        <div class="mac-launch-grid">${body}</div>
      </div>
    `
  }

  function installConfirmationMarkup(step) {
    if (!options.confirmInstall) {
      return `<div class="term-line">${t('script_installing')}</div>
        ${step === 2 ? `<div class="term-choices"><button class="term-choice os-target" type="button" data-action="install-yes">${t('script_install_continue')}</button></div>` : ''}`
    }
    return `<div class="term-line">${t('script_install_prompt')}</div>
      <div class="term-line">&gt; ${step > 2 ? 'Y' : ''}</div>
      ${
        step === 2
          ? `<div class="term-choices">
        <button class="term-choice os-target" type="button" data-action="install-yes">Y</button>
        <button class="term-choice" type="button" data-wrong="${attr('script_install_wrong')}">n</button>
      </div>`
          : ''
      }`
  }

  function installLogMarkup() {
    const isWin = state.platform === 'windows'
    const prompt = isWin
      ? '<span class="win-powershell-prompt">PS C:\\Users\\Guest&gt;</span>'
      : '<span class="mac-terminal-prompt">guest@Mac ~ %</span>'
    const command = installCommand()
    const typed = escapeHtml(state.typedCommand)
    const step = state.installStep
    const copied = state.desktopStep >= 5
    const commandReady = state.typedCommand === command
    const langKey = installerLangKey()
    const langButtons = ['1', '2', '3']
      .map((value) =>
        value === langKey
          ? `<button class="term-choice os-target" type="button" data-action="install-lang">${value}</button>`
          : `<button class="term-choice" type="button" data-wrong="${attr('lang_wrong')}">${value}</button>`
      )
      .join('')
    return `
      <div class="term-log">
        <div class="term-line">${prompt} <span data-install-command>${typed}</span></div>
        ${
          step === 0 && commandReady
            ? `<div class="term-choices"><button class="term-choice os-target" type="button" data-action="install-run">${t('enter_key')}</button></div>`
            : ''
        }
        ${
          step >= 1
            ? `
          <div class="term-line term-gap">请选择安装语言 / インストール言語を選択 / Select installer language</div>
          <div class="term-line">  1) 简体中文</div>
          <div class="term-line">  2) 日本語</div>
          <div class="term-line">  3) English</div>
          <div class="term-line">${t('lang_prompt_tail')} ${step > 1 ? langKey : ''}</div>
          ${step === 1 ? `<div class="term-choices">${langButtons}</div>` : ''}
        `
            : ''
        }
        ${
          step >= 2
            ? `
          <div class="term-line term-gap">${t('script_title')}</div>
          <div class="term-line term-dim">${t('script_intro')}</div>
          ${installConfirmationMarkup(step)}
        `
            : ''
        }
        ${
          step >= 3
            ? `
          ${options.confirmInstall ? `<div class="term-line term-dim">${t('script_installing')}</div>` : ''}
          <div class="term-line">${t('script_detected')}</div>
          <div class="term-line">${t('script_key_prompt')}</div>
          <div class="term-line">&gt; ${step > 3 ? 'sk-••••demo••••' : ''}</div>
          ${
            step === 3
              ? `<div class="term-choices">
            <button class="term-choice os-target" type="button" data-action="install-paste">${t('script_paste')}</button>
          </div>`
              : ''
          }
        `
            : ''
        }
        ${
          step >= 4
            ? `
          <div class="term-line">${t('script_key_received')}</div>
          <div class="term-line">${t('script_validated')}</div>
          <div class="term-line">${t('script_complete')}</div>
          <div class="term-line term-dim">${t('script_now_run')}</div>
          ${appDownloadUrl ? `<div class="term-line">${appHintMarkup('term-app-link')}</div>` : ''}
        `
            : ''
        }
      </div>
      ${
        step >= 4
          ? `
        <div class="os-command-block">
          <div class="os-command ${isWin ? 'win-command' : ''} ${!copied ? 'os-target' : ''}">
            <span>${escapeHtml(command)}</span>
            <button class="os-copy-button" type="button" data-action="copy-command">${copied ? 'COPIED' : 'COPY'}</button>
          </div>
          ${appDownloadUrl ? `<p class="os-command-hint">${appHintMarkup('')}</p>` : ''}
          ${state.manualCopy ? `<button class="term-choice" type="button" data-action="manual-copy-done">${t('manual_copy_done')}</button>` : ''}
        </div>
      `
          : ''
      }
      <div class="os-terminal-note">${t('term_note')}</div>
    `
  }

  function macTerminalMarkup() {
    return `
      <div class="mac-terminal-window" aria-label="${attr('terminal_window')}">
        <div class="mac-terminal-titlebar">
          <span class="mac-traffic" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>guest — zsh — 80×24</span>
          <span>⌘</span>
        </div>
        <div class="mac-terminal-body">${installLogMarkup()}</div>
      </div>
    `
  }

  function macDockMarkup() {
    const teaching = state.desktopStep === 0
    let wrong = t('mac_wrong_term')
    if (state.desktopStep < 4) wrong = t('mac_wrong_search')
    if (teaching) wrong = t('mac_wrong_dock')
    const items = [
      { id: 'apps', label: t('dock_apps'), action: 'mac-open-apps' },
      { id: 'safari', label: 'Safari', wrong },
      { id: 'messages', label: t('dock_messages'), wrong },
      { id: 'mail', label: t('dock_mail'), wrong },
      { id: 'photos', label: t('dock_photos'), wrong },
      { id: 'music', label: t('dock_music'), wrong },
      { id: 'settings', label: t('dock_settings'), wrong },
      { id: 'trash', label: t('dock_trash'), wrong, separator: true },
    ]
    return `
      <nav class="mac-dock" aria-label="${attr('dock')}">
        ${items
          .map(
            (item) => `
          ${item.separator ? '<span class="mac-dock-sep" aria-hidden="true"></span>' : ''}
          <button
            class="mac-dock-item is-${item.id} ${item.id === 'apps' && teaching ? 'os-target is-teaching' : ''}"
            type="button"
            ${item.action ? `data-action="${item.action}"` : `data-wrong="${escapeHtml(item.wrong)}"`}
            aria-label="${escapeHtml(item.label)}"
          >
            ${macDockIcon(item.id)}
            <span class="mac-dock-label">${item.label}</span>
            ${item.id === 'apps' ? '<span class="mac-dock-dot" aria-hidden="true"></span>' : ''}
          </button>
        `
          )
          .join('')}
      </nav>
    `
  }

  function macHandoffMarkup() {
    return `
      <div class="os-handoff">
        <div class="os-handoff-copy"><strong>${t('handoff_kicker')}</strong><span>${t('handoff_mac')}</span></div>
        <button class="action primary" type="button" data-action="finish">${t('finish_cta')}</button>
      </div>
    `
  }

  function renderMacDesktop() {
    const step = state.desktopStep
    return `
      <section class="view os-view mac-view is-active" data-view="desktop" data-platform="mac" data-step="${step}">
        ${brandMarkup()}
        ${backMarkup('back')}
        <div class="mac-menubar">
          <div class="mac-menu-left">
            <span class="mac-apple" aria-hidden="true">${systemLogoMarkup('mac')}</span>
            <span class="mac-menu-item active">${step >= 1 && step < 4 ? 'App' : t('finder')}</span>
            <span class="mac-menu-item">${t('menu_file')}</span>
            <span class="mac-menu-item">${t('menu_edit')}</span>
            <span class="mac-menu-item">${t('menu_view')}</span>
            <span class="mac-menu-item">${t('menu_window')}</span>
          </div>
          <div class="mac-menu-right">
            <span class="mac-status-icon mac-wifi" aria-hidden="true"></span>
            <span class="mac-status-icon mac-battery" aria-hidden="true"></span>
            <span class="mac-status-icon mac-control" aria-hidden="true"><i></i><i></i></span>
            <button class="mac-spotlight-trigger" type="button" data-wrong="${attr(step < 1 ? 'mac_wrong_spotlight_app' : 'mac_wrong_spotlight_search')}" aria-label="${attr('menubar_search')}">${systemUiIconMarkup('search')}</button>
            <span>${t('menubar_clock')}</span>
          </div>
        </div>
        <div class="mac-desktop-icons">
          <button class="mac-desktop-icon" type="button" data-wrong="${attr('mac_wrong_icon')}"><span class="mac-drive-icon">${systemUiIconMarkup('drive')}</span><span>Macintosh HD</span></button>
          <button class="mac-desktop-icon" type="button" data-wrong="${attr('mac_wrong_later')}"><span class="mac-drive-icon">${systemUiIconMarkup('package')}</span><span>${options.desktopLabel}</span></button>
        </div>
        ${coachMarkup('mac', step)}
        ${step >= 1 && step < 4 ? macLaunchpadMarkup() : ''}
        ${step >= 4 ? macTerminalMarkup() : ''}
        ${macDockMarkup()}
        ${step >= 5 ? macHandoffMarkup() : ''}
      </section>
    `
  }

  function winHotkeysMarkup() {
    return `
      <button class="win-hotkeys os-target" type="button" data-action="win-open-run" aria-label="${attr('win_hotkeys')}">
        <span class="win-hotkeys-row">
          <span class="win-hotkey-wrap">
            <span class="win-hotkey is-win" aria-hidden="true"><span class="win-logo"></span></span>
            <span class="win-hotkey-name">${t('win_key')}</span>
          </span>
          <span class="win-hotkeys-plus" aria-hidden="true">+</span>
          <span class="win-hotkey-wrap">
            <span class="win-hotkey is-r" aria-hidden="true"><span class="win-hotkey-letter">R</span></span>
            <span class="win-hotkey-name">R</span>
          </span>
        </span>
        <span class="win-hotkeys-caption">Windows + R</span>
      </button>
    `
  }

  function winRunDialogMarkup() {
    const ready = state.desktopStep === 2
    return `
      <div class="win-run-scrim" data-action="win-dismiss-run"></div>
      <div class="win-run-dialog" aria-label="${attr('win_run_label')}">
        <div class="win-run-titlebar">
          <span>${t('win_run_title')}</span>
          <button class="win-run-close" type="button" data-action="win-dismiss-run" aria-label="${attr('win_run_close')}">×</button>
        </div>
        <div class="win-run-body">
          <div class="win-run-lead">
            <span class="win-run-glyph" aria-hidden="true">${systemUiIconMarkup('run')}</span>
            <p>${t('win_run_lead')}</p>
          </div>
          <div class="win-run-row">
            <span class="win-run-label" id="win-run-open-label">${t('win_run_open')}</span>
            <div class="win-run-field ${state.desktopStep === 1 ? 'os-target is-action' : ''}" ${state.desktopStep === 1 ? 'data-action="win-type-run" role="button" tabindex="0"' : ''}>
              <input id="win-os-search" data-os-search type="text" value="${escapeHtml(state.query)}" placeholder="" autocomplete="off" readonly tabindex="-1" aria-labelledby="win-run-open-label" />
            </div>
          </div>
          <div class="win-run-actions">
            <button class="win-run-button is-ok ${ready ? 'os-target' : ''}" type="button" ${ready ? 'data-action="win-open-powershell"' : `data-wrong="${attr('win_wrong_ok')}"`}>${t('win_ok')}</button>
            <button class="win-run-button" type="button" data-action="win-dismiss-run">${t('win_cancel')}</button>
            <button class="win-run-button" type="button" data-wrong="${attr('win_wrong_browse')}">${t('win_browse')}</button>
          </div>
        </div>
      </div>
    `
  }

  function winPowerShellMarkup() {
    return `
      <div class="win-powershell-window" aria-label="${attr('powershell')}">
        <div class="win-powershell-titlebar">
          <span class="win-ps-app"><span class="win-ps-glyph" aria-hidden="true">›_</span>Windows PowerShell</span>
          <div class="win-caption" aria-hidden="true">
            <span>—</span>
            <span>□</span>
            <button type="button" data-wrong="${attr('win_wrong_start2')}">×</button>
          </div>
        </div>
        <div class="win-powershell-body">${installLogMarkup()}</div>
      </div>
    `
  }

  function winTaskbarMarkup() {
    let startWrong = attr('win_wrong_start2')
    if (state.desktopStep < 4) startWrong = attr('win_wrong_start1')
    if (state.desktopStep === 0) startWrong = attr('win_wrong_start0')
    return `
      <div class="win-taskbar">
        <div class="win-taskbar-inner">
          <button class="win-start-button" type="button" data-wrong="${startWrong}" aria-label="${attr('start_menu')}"><span class="win-logo"></span></button>
          <button class="win-task-icon search" type="button" data-wrong="${startWrong}" aria-label="${attr('search')}">${systemUiIconMarkup('search')}</button>
          <button class="win-task-icon folder" type="button" data-wrong="${startWrong}" aria-label="${attr('explorer')}">${systemUiIconMarkup('folder')}</button>
          <button class="win-task-icon edge" type="button" data-wrong="${startWrong}" aria-label="${attr('browser')}">${systemUiIconMarkup('browser')}</button>
          ${
            state.desktopStep >= 4
              ? `<button class="win-task-icon powershell is-open" type="button" data-wrong="${startWrong}" aria-label="PowerShell">›_</button>`
              : ''
          }
        </div>
        <div class="win-tray" aria-hidden="true"><span>▲</span><span>⌁</span><span>▮</span></div>
        <div class="win-clock"><span>10:24</span><span>2026/08/30</span></div>
      </div>
    `
  }

  function winCoachMarkup() {
    return coachMarkup('windows', state.desktopStep)
  }

  function winHandoffMarkup() {
    return `
      <div class="os-handoff">
        <div class="os-handoff-copy"><strong>${t('handoff_kicker')}</strong><span>${t('handoff_win')}</span></div>
        <button class="action primary" type="button" data-action="finish">${t('finish_cta')}</button>
      </div>
    `
  }

  function renderWindowsDesktop() {
    const step = state.desktopStep
    return `
      <section class="view os-view win-view is-active" data-view="desktop" data-platform="windows" data-step="${step}">
        ${brandMarkup()}
        ${backMarkup('back')}
        <div class="win-desktop-icons">
          <button class="win-desktop-icon" type="button" data-wrong="${attr('win_wrong_icon')}"><span class="win-folder-icon">${systemUiIconMarkup('computer')}</span><span>This PC</span></button>
          <button class="win-desktop-icon" type="button" data-wrong="${attr('mac_wrong_later')}"><span class="win-folder-icon">${systemUiIconMarkup('setup')}</span><span>${options.desktopLabel}</span></button>
        </div>
        ${winCoachMarkup()}
        ${step === 0 ? winHotkeysMarkup() : ''}
        ${step >= 1 && step < 4 ? winRunDialogMarkup() : ''}
        ${step >= 4 ? winPowerShellMarkup() : ''}
        ${winTaskbarMarkup()}
        ${step >= 5 ? winHandoffMarkup() : ''}
      </section>
    `
  }

  function renderDesktop() {
    return state.platform === 'windows'
      ? renderWindowsDesktop()
      : renderMacDesktop()
  }

  function renderFinish() {
    const isMac = state.platform === 'mac'
    const appName = isMac ? 'Terminal' : 'PowerShell'
    return `
      <section class="view finish-os-view site-onboarding is-active" data-view="finish" data-platform="${isMac ? 'mac' : 'windows'}">
        ${brandMarkup()}
        ${backMarkup('back')}
        <div class="finish-overlay">
          <div class="finish-panel">
            <div class="finish-mark">✓</div>
            <h1>${t('finish_title')}</h1>
            <p>${t(isMac ? 'finish_mac' : 'finish_win')}${t('finish_tail', { app: appName })}</p>
            ${appDownloadUrl ? `<p class="finish-app-hint">${appHintMarkup('')}${isEn() ? '.' : '。'}</p>` : ''}
            <div class="finish-actions">
              ${appDownloadUrl ? `<a class="action primary" href="${appDownloadUrl}" target="_blank" rel="noreferrer">${t('download_app')}</a>` : ''}
              <a class="action ${appDownloadUrl ? '' : 'primary'}" href="${DOCS_URL}" target="_blank" rel="noreferrer">${t('open_docs')}</a>
              <a class="action" href="${WEB_URL}" target="_blank" rel="noreferrer">${t('web_try')}</a>
              <button class="action" type="button" data-action="restart">${t('restart')}</button>
            </div>
          </div>
        </div>
      </section>
    `
  }

  function render() {
    const hadFocus = app.contains(document.activeElement)
    const current = app.querySelector('.view.is-active')
    const sameView =
      current?.dataset.view === state.view &&
      (state.view !== 'desktop' || current.dataset.platform === state.platform)
    const previousStep = Number(current?.dataset.step)
    const launchpadWasOpen =
      sameView &&
      state.platform === 'mac' &&
      previousStep >= 1 &&
      previousStep < 4 &&
      state.desktopStep >= 1 &&
      state.desktopStep < 4
    const runWasOpen =
      sameView &&
      state.platform === 'windows' &&
      previousStep >= 1 &&
      previousStep < 4 &&
      state.desktopStep >= 1 &&
      state.desktopStep < 4
    const termWasOpen = sameView && previousStep >= 4 && state.desktopStep >= 4
    document.documentElement.classList.toggle(
      'keep-mac-launch',
      launchpadWasOpen
    )
    document.documentElement.classList.toggle('keep-win-run', runWasOpen)
    document.documentElement.classList.toggle('keep-os-term', termWasOpen)

    const renderers = {
      language: renderLanguage,
      welcome: renderWelcome,
      signup: renderSignup,
      platform: renderPlatform,
      finish: renderFinish,
      desktop: renderDesktop,
    }
    app.innerHTML = renderers[state.view]()

    const view = app.querySelector('.view')
    if (hadFocus || state.view === 'desktop') app.focus({ preventScroll: true })
    if (sameView) view?.classList.add('is-static')
    if (launchpadWasOpen) view?.classList.add('is-launch-static')
    if (runWasOpen) view?.classList.add('is-run-static')
    if (termWasOpen) view?.classList.add('is-term-static')
    if (state.view === 'desktop' && state.desktopStep >= 4) {
      window.requestAnimationFrame(() => {
        const log = document.querySelector('.term-log')
        if (log) log.scrollTop = log.scrollHeight
      })
    }
  }

  app.addEventListener('pointerdown', (event) => {
    state.pointerDownInsideSurface = Boolean(
      desktopOverlay(eventElement(event))
    )
  })

  app.addEventListener('click', async (event) => {
    const element = eventElement(event)
    const startedInside = state.pointerDownInsideSurface
    state.pointerDownInsideSurface = false

    if (startedInside && !desktopOverlay(element)) {
      return
    }

    const target = element?.closest(
      '[data-choice], [data-platform], [data-lang], [data-action], [data-wrong]'
    )
    if (!target) {
      if (!startedInside) dismissDesktopOverlay()
      return
    }

    if (target.dataset.wrong) {
      if (!startedInside) dismissDesktopOverlay()
      showToast(target.dataset.wrong)
      return
    }

    if (target.dataset.lang) {
      chooseLanguage(target.dataset.lang)
      return
    }

    if (target.dataset.choice) {
      chooseRoute(target.dataset.choice === 'ready' ? 'ready' : 'new')
      return
    }

    if (target.dataset.platform) {
      if (state.view === 'platform') {
        choosePlatform(target.dataset.platform)
      } else if (!startedInside) {
        dismissDesktopOverlay()
      }
      return
    }

    const action = target.dataset.action
    if (action === 'home') {
      event.preventDefault()
      navigate('/')
      return
    }
    if (action === 'restart') {
      reset({ keepLang: true })
      return
    }
    if (action === 'back') {
      if (state.view === 'desktop' || state.view === 'finish') {
        showPlatform()
      } else if (state.view === 'welcome') {
        navigate(`/docs/${options.slug}`)
      } else if (state.view === 'platform' || state.view === 'signup') {
        resetInstall()
        state.view = 'welcome'
        state.platform = null
        state.signupStep = 0
        render()
      } else {
        reset()
      }
      return
    }
    if (action === 'signup-done') {
      state.signupStep = 1
      render()
      return
    }
    if (action === 'key-ready') {
      showPlatform()
      return
    }
    if (action === 'mac-dismiss-launcher') {
      dismissDesktopOverlay()
      return
    }
    if (action === 'mac-open-apps') {
      if (state.platform === 'mac' && state.desktopStep === 0) {
        state.desktopStep = 1
        state.query = ''
        render()
      } else if (state.desktopStep >= 1 && state.desktopStep < 4) {
        dismissDesktopOverlay()
      } else {
        showToast(t('mac_wrong_term'))
      }
      return
    }
    if (action === 'mac-type-search') {
      startMacSearchType()
      return
    }
    if (action === 'mac-open-terminal') {
      if (state.platform === 'mac' && state.desktopStep === 2) {
        openInstallTerminal()
      }
      return
    }
    if (action === 'install-run') {
      if (
        state.desktopStep === 4 &&
        state.installStep === 0 &&
        state.typedCommand === installCommand()
      ) {
        state.installStep = 1
        render()
      }
      return
    }
    if (action === 'install-lang') {
      if (state.installStep === 1) {
        state.installStep = 2
        render()
      }
      return
    }
    if (action === 'install-yes') {
      if (state.installStep === 2) {
        state.installStep = 3
        render()
      }
      return
    }
    if (action === 'install-paste') {
      if (state.installStep === 3) {
        state.installStep = 4
        render()
      }
      return
    }
    if (action === 'win-open-run') {
      if (state.platform === 'windows' && state.desktopStep === 0) {
        state.desktopStep = 1
        state.query = ''
        render()
      }
      return
    }
    if (action === 'win-type-run') {
      startWinRunType()
      return
    }
    if (action === 'win-dismiss-run') {
      dismissDesktopOverlay()
      return
    }
    if (action === 'win-open-powershell') {
      if (state.platform === 'windows' && state.desktopStep === 2) {
        openInstallTerminal()
      }
      return
    }
    if (action === 'copy-command') {
      const copiedPlatform = state.platform
      const copied = await copyCommand()
      if (
        state.view === 'desktop' &&
        state.platform === copiedPlatform &&
        state.installStep === 4
      ) {
        state.manualCopy = !copied
        if (copied) state.desktopStep = 5
        render()
      }
      return
    }
    if (
      action === 'manual-copy-done' &&
      state.manualCopy &&
      state.installStep === 4
    ) {
      state.manualCopy = false
      state.desktopStep = 5
      render()
      return
    }
    if (action === 'finish') {
      state.view = 'finish'
      render()
    }
  })

  app.addEventListener('input', (event) => {
    const element = event.target instanceof Element ? event.target : null
    const input = element?.closest('[data-os-search]')
    if (!input || state.view !== 'desktop') return
    input.value = state.query
  })

  app.addEventListener('keydown', (event) => {
    if (state.view !== 'desktop') return
    const element = event.target instanceof Element ? event.target : null
    // Keep native buttons and links keyboard-operable; shortcuts belong to the desktop surface.
    if (event.key !== 'Escape' && element?.closest('button, a')) return
    if (
      event.key === 'Enter' &&
      state.platform === 'windows' &&
      state.desktopStep === 2
    ) {
      event.preventDefault()
      openInstallTerminal()
      return
    }
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      element?.closest('[data-action="mac-type-search"]')
    ) {
      event.preventDefault()
      startMacSearchType()
      return
    }
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      element?.closest('[data-action="win-type-run"]')
    ) {
      event.preventDefault()
      startWinRunType()
      return
    }
    if (state.desktopStep === 4) {
      if (
        event.key === 'Enter' &&
        state.installStep === 0 &&
        state.typedCommand === installCommand()
      ) {
        event.preventDefault()
        state.installStep = 1
        render()
        return
      }
      if (event.key === installerLangKey() && state.installStep === 1) {
        event.preventDefault()
        state.installStep = 2
        render()
        return
      }
      const confirmKey = options.confirmInstall
        ? event.key.toLowerCase() === 'y'
        : event.key === 'Enter'
      if (confirmKey && state.installStep === 2) {
        event.preventDefault()
        state.installStep = 3
        render()
        return
      }
    }
    if (event.key === 'Escape') {
      if (
        state.platform === 'mac' &&
        state.desktopStep >= 1 &&
        state.desktopStep < 4
      ) {
        stopMacTyping()
        state.desktopStep = 0
        state.query = ''
        render()
      } else if (
        state.platform === 'windows' &&
        state.desktopStep >= 1 &&
        state.desktopStep < 4
      ) {
        stopMacTyping()
        state.desktopStep = 0
        state.query = ''
        render()
      }
    }
  })

  const preferredLang = preferredLangFromLocation() || 'zh'
  if (preferredLang) {
    state.lang = preferredLang
    state.view = 'welcome'
  }
  syncDocumentLang()
  render()
}
