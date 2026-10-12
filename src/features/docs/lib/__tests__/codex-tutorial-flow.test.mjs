import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { Window } from 'happy-dom'

import { mountCodexTutorial } from '../../../../../public/tutorials/codex/tutorial.js'

const windows = []

function setup(lang = 'zh') {
  const window = new Window({
    url: `https://docs.example.com/tutorials/codex/index.html?lang=${lang}`,
  })
  windows.push(window)
  // Reduced motion is a real supported path and makes auto typing deterministic.
  window.matchMedia = () => ({ matches: true })
  window.document.body.innerHTML = '<main id="app" tabindex="-1"></main>'
  mountCodexTutorial(window)
  return window
}

function click(window, selector) {
  const button = window.document.querySelector(selector)
  assert.ok(button, `Expected available control: ${selector}`)
  button.click()
}

function openTerminal(window, platform) {
  click(window, '[data-choice="ready"]')
  click(window, `[data-platform="${platform}"]`)
  if (platform === 'mac') {
    click(window, '[data-action="mac-open-apps"]')
    click(window, '[data-action="mac-type-search"]')
    assert.equal(window.document.querySelector('input').value, 'terminal')
    click(window, '[data-action="mac-open-terminal"]')
  } else {
    click(window, '[data-action="win-open-run"]')
    click(window, '[data-action="win-type-run"]')
    assert.equal(window.document.querySelector('input').value, 'powershell')
    click(window, '[data-action="win-open-powershell"]')
  }
}

function completeInstall(window, platform = 'mac') {
  openTerminal(window, platform)
  click(window, '[data-action="install-run"]')
  click(window, '[data-action="install-lang"]')
  click(window, '[data-action="install-yes"]')
  click(window, '[data-action="install-paste"]')
}

afterEach(() => {
  windows.splice(0).forEach((window) => window.close())
})

for (const platform of ['mac', 'windows']) {
  test(`${platform}: completing the rehearsal copies the site installer and supports restart`, async () => {
    const window = setup()
    completeInstall(window, platform)
    assert.match(
      window.document.querySelector('.os-progress').textContent,
      /8 \/ 8/
    )
    assert.match(
      window.document.querySelector('.term-log').textContent,
      /配置完成/
    )
    assert.equal(window.document.querySelector('input'), null)
    assert.equal(window.localStorage.length, 0)
    click(window, '[data-action="copy-command"]')
    await window.happyDOM.waitUntilComplete()
    assert.equal(
      await window.navigator.clipboard.readText(),
      platform === 'mac'
        ? 'curl -fsSL https://docs.example.com/install/codex.sh | sh'
        : 'irm https://docs.example.com/install/codex.ps1 | iex'
    )
    assert.equal(
      window.document.querySelector('.os-copy-button').textContent,
      'COPIED'
    )
    click(window, '[data-action="finish"]')
    assert.match(
      window.document.querySelector('h1').textContent,
      /互动排练完成/
    )
    click(window, '[data-action="restart"]')
    assert.equal(
      window.document
        .querySelector('[role="group"]')
        .getAttribute('aria-label'),
      '账号准备状态'
    )
  })
}

test('a new account follows registration and key preparation using local links', () => {
  const window = setup()
  click(window, '[data-choice="new"]')
  assert.equal(
    window.document.querySelector('.action.primary').href,
    'https://docs.example.com/sign-up'
  )
  click(window, '[data-action="signup-done"]')
  assert.equal(
    window.document.querySelector('.action.primary').href,
    'https://docs.example.com/keys'
  )
  click(window, '[data-action="key-ready"]')
  assert.equal(
    window.document.querySelector('[role="group"]').getAttribute('aria-label'),
    '选择电脑系统'
  )
})

test('wrong installer choices show feedback without advancing the current step', () => {
  const window = setup()
  openTerminal(window, 'mac')
  click(window, '[data-action="install-run"]')
  click(window, '.term-choices [data-wrong]')
  assert.match(
    window.document.querySelector('[role="status"]').textContent,
    /请先点 1/
  )
  assert.match(
    window.document.querySelector('.os-progress').textContent,
    /5 \/ 8/
  )
})

test('Escape dismisses the launcher and Back returns to system choice', () => {
  const window = setup()
  click(window, '[data-choice="ready"]')
  click(window, '[data-platform="mac"]')
  click(window, '[data-action="mac-open-apps"]')
  window.document
    .querySelector('#app')
    .dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    )
  assert.equal(window.document.querySelector('.mac-launchpad'), null)
  assert.match(
    window.document.querySelector('.os-progress').textContent,
    /1 \/ 8/
  )
  click(window, '[data-action="back"]')
  assert.ok(window.document.querySelector('[data-platform="windows"]'))
})

test('keyboard Enter, language number and Y advance the focused terminal', () => {
  const window = setup('en')
  openTerminal(window, 'windows')
  for (const key of ['Enter', '3', 'Y']) {
    window.document.activeElement.dispatchEvent(
      new window.KeyboardEvent('keydown', { key, bubbles: true })
    )
  }
  assert.ok(window.document.querySelector('[data-action="install-paste"]'))
  assert.match(
    window.document.querySelector('.os-progress').textContent,
    /7 \/ 8/
  )
})

test('clipboard denial keeps COPY available and never reports success', async () => {
  const window = setup()
  window.navigator.clipboard.writeText = async () => {
    throw new Error('denied')
  }
  window.document.execCommand = () => false
  completeInstall(window)
  click(window, '[data-action="copy-command"]')
  await window.happyDOM.waitUntilComplete()
  assert.equal(
    window.document.querySelector('.os-copy-button').textContent,
    'COPY'
  )
  assert.equal(window.document.querySelector('[data-action="finish"]'), null)
  click(window, '[data-action="manual-copy-done"]')
  assert.ok(window.document.querySelector('[data-action="finish"]'))
})

test('Enter on a native button preserves its action instead of launching the next step', () => {
  const window = setup()
  click(window, '[data-choice="ready"]')
  click(window, '[data-platform="windows"]')
  click(window, '[data-action="win-open-run"]')
  click(window, '[data-action="win-type-run"]')
  const cancel = window.document.querySelector(
    'button[data-action="win-dismiss-run"]'
  )
  cancel.focus()
  const event = new window.KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  })
  cancel.dispatchEvent(event)
  assert.equal(event.defaultPrevented, false)
  assert.ok(window.document.querySelector('.win-run-dialog'))
  assert.equal(window.document.querySelector('.win-powershell-window'), null)
})

test('English uses installer option 3 and Traditional Chinese preserves its locale', () => {
  const english = setup('en')
  openTerminal(english, 'mac')
  click(english, '[data-action="install-run"]')
  assert.equal(
    english.document.querySelector('[data-action="install-lang"]').textContent,
    '3'
  )
  const traditional = setup('zh-TW')
  assert.equal(traditional.document.documentElement.lang, 'zh-TW')
  assert.match(
    traditional.document.querySelector('[data-choice="ready"]').textContent,
    /帳號/
  )
})
