import { mountDesktopTutorial } from '../shared/desktop-tutorial.js'
import { COPY } from './copy.js'

export function mountCodexTutorial(window) {
  mountDesktopTutorial(window, {
    copy: COPY,
    slug: 'codex',
    name: 'Codex',
    desktopLabel: 'Codex Setup',
    installer: 'codex',
    confirmInstall: true,
    appDownloadUrl: 'https://developers.openai.com/codex/app',
  })
}
