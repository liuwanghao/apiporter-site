import { COPY as CODEX_COPY } from '../codex/copy.js'

export const COPY = {
  zh: {
    ...CODEX_COPY.zh,
    coach_6_title: '安装 Claude Code',
    coach_6_copy:
      '脚本正在通过官方安装器安装 Claude Code。安装完成后点击继续。',
    coach_8_copy: '点击 COPY，把同一条命令粘贴到真实 {app}。',
    script_title: 'ApiPorter Claude Code 一键配置',
    script_intro:
      '脚本会安装 Claude Code（如尚未安装）、合并用户配置，并让你粘贴一次 ApiPorter API Key。请确认 Key 属于可以访问 claude-opus-4-8 和 claude-sonnet-5 的非 default 分组。',
    script_install_continue: '继续',
    script_install_wrong: '这一步请等待官方安装完成，然后点击继续',
    script_installing: '正在通过官方安装器安装 Claude Code...',
    script_detected: '已检测到 Claude Code：claude',
    script_validated:
      'API Key 验证通过：可以访问 claude-opus-4-8 和 claude-sonnet-5。',
    script_complete:
      '配置完成。Claude Code 已配置为通过 ApiPorter 使用，脚本不会自动启动。',
    script_now_run: '请先进入你信任的项目目录，然后运行：claude',
    handoff_mac:
      '一键安装命令已复制。请在真实 Terminal 里粘贴运行，再按刚才的步骤：选 1、点击继续、粘贴你的 API Key。',
    handoff_win:
      '一键安装命令已复制。请在真实电脑按 Windows + R，输入 powershell 后确定，再粘贴运行。然后按刚才的步骤：选 1、点击继续、粘贴你的 API Key。',
    finish_mac:
      '你刚刚练习了在 macOS 中打开 Terminal，并走完 ApiPorter Claude Code 一键配置脚本。',
    finish_win:
      '你刚刚练习了在 Windows 中按 Windows + R 打开 PowerShell，并走完 ApiPorter Claude Code 一键配置脚本。',
  },
  en: {
    ...CODEX_COPY.en,
    coach_6_title: 'Install Claude Code',
    coach_6_copy:
      'The official installer is installing Claude Code. When it finishes, click Continue.',
    coach_8_copy: 'Click COPY and paste the same command into the real {app}.',
    script_title: 'ApiPorter Claude Code setup',
    script_intro:
      'This installs Claude Code when needed, preserves existing user settings, and asks for your ApiPorter API key once. Use a non-default group that can access claude-opus-4-8 and claude-sonnet-5.',
    script_install_continue: 'Continue',
    script_install_wrong:
      'Wait for the official installer, then click Continue',
    script_installing: 'Installing Claude Code with the official installer...',
    script_detected: 'Detected Claude Code: claude',
    script_validated:
      'API key validation passed: claude-opus-4-8 and claude-sonnet-5 are available.',
    script_complete:
      'Setup complete. Claude Code is configured for ApiPorter and was not started.',
    script_now_run: 'Enter a project directory you trust, then run: claude',
    handoff_mac:
      'The install command is copied. Paste it in the real Terminal, then repeat: choose 3, click Continue, paste your API Key.',
    handoff_win:
      'The install command is copied. On a real PC, press Windows + R, type powershell, click OK, then paste and run it. Repeat: choose 3, click Continue, paste your API Key.',
    finish_mac:
      'You just practiced opening Terminal on macOS and walking through the ApiPorter Claude Code installer.',
    finish_win:
      'You just practiced pressing Windows + R to open PowerShell and walking through the ApiPorter Claude Code installer.',
  },
  'zh-TW': {
    ...CODEX_COPY['zh-TW'],
    coach_6_title: '安裝 Claude Code',
    coach_6_copy:
      '指令碼正在透過官方安裝程式安裝 Claude Code。安裝完成後，點選繼續。',
    coach_8_copy: '點選 COPY，將同一條指令貼到實際的 {app} 中。',
    script_title: 'ApiPorter Claude Code 一鍵設定',
    script_intro:
      '指令碼會安裝 Claude Code（若尚未安裝）、合併使用者設定，並請你貼上一次 ApiPorter API Key。請確認 Key 屬於可以存取 claude-opus-4-8 和 claude-sonnet-5 的非 default 群組。',
    script_install_continue: '繼續',
    script_install_wrong: '請等待官方安裝程式完成安裝，再點選繼續',
    script_installing: '正在透過官方安裝程式安裝 Claude Code...',
    script_detected: '已偵測到 Claude Code：claude',
    script_validated:
      'API Key 驗證通過：可以存取 claude-opus-4-8 和 claude-sonnet-5。',
    script_complete:
      '設定完成。Claude Code 已設定為透過 ApiPorter 使用，指令碼不會自動啟動。',
    script_now_run: '請先進入你信任的專案目錄，然後執行：claude',
    handoff_mac:
      '已複製一鍵安裝指令。請在實際的 Terminal 中貼上並執行，再依照剛才的步驟：選 1、點選繼續、貼上你的 API Key。',
    handoff_win:
      '已複製一鍵安裝指令。請在實際電腦上按 Windows + R，輸入 powershell 後點選確定，再貼上並執行指令。接著依照剛才的步驟：選 1、點選繼續、貼上你的 API Key。',
    finish_mac:
      '你剛剛練習了在 macOS 中開啟 Terminal，並完成 ApiPorter Claude Code 一鍵設定指令碼的操作流程。',
    finish_win:
      '你剛剛練習了在 Windows 中按 Windows + R 開啟 PowerShell，並完成 ApiPorter Claude Code 一鍵設定指令碼的操作流程。',
  },
}
