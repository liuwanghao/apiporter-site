import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { Window } from 'happy-dom'

import { mountClaudeTutorial } from '../../../../../public/tutorials/claude-code/tutorial.js'

const windows = []
function setup(lang = 'zh') {
  const window = new Window({
    url: `https://docs.example.com/tutorials/claude-code/index.html?lang=${lang}`,
  })
  windows.push(window)
  window.matchMedia = () => ({ matches: true })
  window.document.body.innerHTML = '<main id="app" tabindex="-1"></main>'
  mountClaudeTutorial(window)
  return window
}
function click(window, action) {
  const element = window.document.querySelector(action)
  assert.ok(element, `Missing available control ${action}`)
  element.click()
}
function openInstaller(window, platform) {
  click(window, '[data-choice="ready"]')
  click(window, `[data-platform="${platform}"]`)
  if (platform === 'mac') {
    click(window, '[data-action="mac-open-apps"]')
    click(window, '[data-action="mac-type-search"]')
    click(window, '[data-action="mac-open-terminal"]')
  } else {
    click(window, '[data-action="win-open-run"]')
    click(window, '[data-action="win-type-run"]')
    click(window, '[data-action="win-open-powershell"]')
  }
  click(window, '[data-action="install-run"]')
  click(window, '[data-action="install-lang"]')
}
afterEach(() => windows.splice(0).forEach((window) => window.close()))

for (const platform of ['mac', 'windows']) {
  test(`${platform}: Claude installs with Continue, validates Claude models and copies its own installer`, async () => {
    const window = setup()
    const document = window.document
    openInstaller(window, platform)
    assert.equal(
      document.querySelector('[data-action="install-yes"]').textContent,
      '继续'
    )
    assert.doesNotMatch(
      document.querySelector('.term-log').textContent,
      /\[Y\/n\]|Codex|gpt-5/
    )
    click(window, '[data-action="install-yes"]')
    click(window, '[data-action="install-paste"]')
    const log = document.querySelector('.term-log').textContent
    assert.match(log, /claude-opus-4-8/)
    assert.match(log, /claude-sonnet-5/)
    assert.match(log, /然后运行：claude/)
    assert.equal(document.querySelector('input'), null)
    assert.equal(window.localStorage.length, 0)
    click(window, '[data-action="copy-command"]')
    await window.happyDOM.waitUntilComplete()
    assert.equal(
      await window.navigator.clipboard.readText(),
      platform === 'mac'
        ? 'curl -fsSL https://docs.example.com/install/claude.sh | sh'
        : 'irm https://docs.example.com/install/claude.ps1 | iex'
    )
    click(window, '[data-action="finish"]')
    assert.match(
      document.querySelector('.finish-panel').textContent,
      /Claude Code/
    )
    assert.doesNotMatch(document.body.textContent, /Codex/)
    assert.equal(
      document.querySelector('.finish-actions .primary').href,
      'https://docs.example.com/docs/claude-code'
    )
    click(window, '[data-action="restart"]')
    assert.ok(document.querySelector('[data-choice="ready"]'))
  })
}

test('English Claude uses installer option 3 and Enter to continue without requiring Y', () => {
  const window = setup('en')
  openInstaller(window, 'windows')
  assert.equal(
    window.document.querySelector('[data-action="install-yes"]').textContent,
    'Continue'
  )
  window.document.activeElement.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Y', bubbles: true })
  )
  assert.equal(
    window.document.querySelector('[data-action="install-paste"]'),
    null
  )
  window.document.activeElement.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
  )
  assert.ok(window.document.querySelector('[data-action="install-paste"]'))
})

test('Traditional Chinese Claude shows its own installation and completion copy', () => {
  const window = setup('zh-TW')
  openInstaller(window, 'mac')
  assert.equal(window.document.documentElement.lang, 'zh-TW')
  assert.equal(
    window.document.querySelector('[data-action="install-yes"]').textContent,
    '繼續'
  )
  assert.match(window.document.querySelector('h2').textContent, /Claude Code/)
})
