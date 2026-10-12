import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { Window } from 'happy-dom'

const stylesheet = readFileSync(
  new URL(
    '../../../../../public/tutorials/shared/tutorial.css',
    import.meta.url
  ),
  'utf8'
)

for (const platform of ['mac', 'win']) {
  test(`${platform}: narrow screens keep the coach below the controls and allow terminal scrolling`, () => {
    const window = new Window({ width: 390, height: 667 })
    try {
      const style = window.document.createElement('style')
      style.textContent = stylesheet
      window.document.head.append(style)
      const terminal = platform === 'mac' ? 'mac-terminal' : 'win-powershell'
      window.document.body.innerHTML = `<section class="os-view ${platform}-view">
        <aside class="os-coach"></aside>
        <div class="${terminal}-window"><div class="${terminal}-body"></div></div>
      </section>`
      const coach = window.getComputedStyle(
        window.document.querySelector('.os-coach')
      )
      assert.equal(coach.top, 'auto')
      assert.ok(Number.parseInt(coach.bottom, 10) >= 76)
      assert.equal(coach.overflowY, 'auto')
      const frame = window.getComputedStyle(
        window.document.querySelector(`.${terminal}-window`)
      )
      assert.equal(Number.parseInt(frame.minHeight, 10), 0)
      const content = window.getComputedStyle(
        window.document.querySelector(`.${terminal}-body`)
      )
      assert.equal(content.overflowY, 'auto')
    } finally {
      window.close()
    }
  })
}
