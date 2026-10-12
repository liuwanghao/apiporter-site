import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { Window } from 'happy-dom'

import { mountClaudeTutorial } from '../../../../../public/tutorials/claude-code/tutorial.js'
import { mountCodexTutorial } from '../../../../../public/tutorials/codex/tutorial.js'

const stylesheet = ['tutorial.css', 'onboarding.css']
  .map((file) =>
    readFileSync(
      new URL(
        `../../../../../public/tutorials/shared/${file}`,
        import.meta.url
      ),
      'utf8'
    )
  )
  .join('\n')

for (const [product, mount] of [
  ['Codex', mountCodexTutorial],
  ['Claude Code', mountClaudeTutorial],
]) {
  test(`${product}: completion inherits site colors and keeps mobile actions in the page scroll`, async () => {
    const window = new Window({
      url: 'https://docs.example.com/tutorials/index.html?lang=zh',
      width: 390,
      height: 667,
    })
    try {
      const style = window.document.createElement('style')
      style.textContent = stylesheet
      window.document.head.append(style)
      window.document.documentElement.style.setProperty(
        '--site-foreground',
        '#edf4ee'
      )
      window.document.documentElement.style.setProperty(
        '--site-primary',
        '#f27a52'
      )
      window.document.body.innerHTML = '<main id="app" tabindex="-1"></main>'
      const matchMedia = window.matchMedia.bind(window)
      window.matchMedia = (query) =>
        query.includes('prefers-reduced-motion')
          ? { matches: true }
          : matchMedia(query)
      mount(window)
      window.document.querySelector('[data-choice="ready"]').click()
      window.document.querySelector('[data-platform="mac"]').click()
      for (const action of [
        'mac-open-apps',
        'mac-type-search',
        'mac-open-terminal',
        'install-run',
        'install-lang',
        'install-yes',
        'install-paste',
        'copy-command',
      ]) {
        window.document.querySelector(`[data-action="${action}"]`).click()
      }
      await window.happyDOM.waitUntilComplete()
      window.document.querySelector('[data-action="finish"]').click()

      const computed = (selector) =>
        window.getComputedStyle(window.document.querySelector(selector))
      assert.equal(computed('[data-view="finish"]').color, '#edf4ee')
      assert.equal(
        computed('.finish-actions .primary').backgroundColor,
        '#f27a52'
      )
      assert.equal(computed('.finish-overlay').position, 'static')
      assert.equal(computed('.finish-overlay').backdropFilter, 'none')
      assert.match(computed('.finish-panel').boxShadow, /0 1px 3px/)
      assert.doesNotMatch(
        computed('.finish-panel').boxShadow,
        /12px|24px|32px|blur\(/
      )
      assert.equal(computed('.finish-panel').maxHeight, 'none')
      assert.equal(computed('[data-view="finish"]').overflowY, 'auto')
      assert.equal(computed('.finish-actions').flexDirection, 'column')
      assert.equal(computed('.finish-actions .action').whiteSpace, 'normal')
    } finally {
      window.close()
    }
  })
}
