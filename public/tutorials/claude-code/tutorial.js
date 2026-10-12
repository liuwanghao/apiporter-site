import { mountDesktopTutorial } from '../shared/desktop-tutorial.js'
import { COPY } from './copy.js'

export function mountClaudeTutorial(window) {
  mountDesktopTutorial(window, {
    copy: COPY,
    slug: 'claude-code',
    name: 'Claude Code',
    desktopLabel: 'Claude Setup',
    installer: 'claude',
    confirmInstall: false,
  })
}
