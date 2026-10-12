/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

export type DocText = {
  en: string
  zh: string
}

type ParagraphBlock = {
  type: 'paragraph'
  text: DocText
}

type HeadingBlock = {
  type: 'heading'
  text: DocText
  level?: 3 | 4
  id?: string
}

type LabelBlock = {
  type: 'label'
  text: DocText
}

type CodeBlock = {
  type: 'code'
  code: string
  label?: string
  compact?: boolean
}

type InlineLinkBlock = {
  type: 'inline-link'
  before: DocText
  label: DocText
  after: DocText
  href: string
  external?: boolean
}

type ListBlock = {
  type: 'list'
  ordered?: boolean
  items: readonly DocText[]
}

type NoteBlock = {
  type: 'note'
  title?: DocText
  text: DocText
  tone?: 'default' | 'success' | 'warning'
}

type TableBlock = {
  type: 'table'
  headers: readonly DocText[]
  rows: readonly (readonly DocText[])[]
}

type ActionBlock = {
  type: 'actions'
  actions: readonly ('codex-app' | 'keys' | 'models' | 'usage')[]
}

export type GuideContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | LabelBlock
  | CodeBlock
  | InlineLinkBlock
  | ListBlock
  | NoteBlock
  | TableBlock
  | ActionBlock

export type GuideContentSection = {
  id: string
  eyebrow?: DocText
  level?: 2 | 3
  title: DocText
  blocks: readonly GuideContentBlock[]
}

export type GuideTocItem = {
  id: string
  text: DocText
  depth?: 1 | 2
}

export type GuideDocument = {
  lead?: DocText
  leadItems?: readonly DocText[]
  leadAfter?: DocText
  sections: readonly GuideContentSection[]
  toc?: readonly GuideTocItem[]
}

const text = (en: string, zh: string): DocText => ({ en, zh })

const code = (value: string, label?: string, compact = false): CodeBlock => ({
  type: 'code',
  code: value,
  label,
  compact,
})

const inlineLink = (
  before: readonly [string, string],
  label: readonly [string, string],
  after: readonly [string, string],
  href: string,
  external = false
): InlineLinkBlock => ({
  type: 'inline-link',
  before: text(...before),
  label: text(...label),
  after: text(...after),
  href,
  external,
})

const paragraph = (en: string, zh: string): ParagraphBlock => ({
  type: 'paragraph',
  text: text(en, zh),
})

const heading = (
  en: string,
  zh: string,
  level: HeadingBlock['level'] = 3,
  id?: string
): HeadingBlock => ({
  type: 'heading',
  text: text(en, zh),
  level,
  id,
})

const label = (en: string, zh: string): LabelBlock => ({
  type: 'label',
  text: text(en, zh),
})

const list = (
  items: readonly [string, string][],
  ordered = false
): ListBlock => ({
  type: 'list',
  ordered,
  items: items.map(([en, zh]) => text(en, zh)),
})

const plainNote = (
  textEn: string,
  textZh: string,
  tone: NoteBlock['tone'] = 'default'
): NoteBlock => ({
  type: 'note',
  text: text(textEn, textZh),
  tone,
})

const table = (
  headers: readonly [string, string][],
  rows: readonly (readonly [string, string])[][]
): TableBlock => ({
  type: 'table',
  headers: headers.map(([en, zh]) => text(en, zh)),
  rows: rows.map((row) => row.map(([en, zh]) => text(en, zh))),
})

function codexDocument(v1Url: string, siteUrl: string): GuideDocument {
  const installBaseUrl = siteUrl.replace(/\/+$/, '')
  const config = `cli_auth_credentials_store = "file"
model_provider = "apiporter"
model = "gpt-5.6-sol"
model_reasoning_effort = "xhigh"
disable_response_storage = true
model_supports_reasoning_summaries = true

[model_providers.apiporter]
name = "CBAPI"
base_url = "${v1Url}"
wire_api = "responses"
requires_openai_auth = true`
  const auth = `{
  "auth_mode": "apikey",
  "OPENAI_API_KEY": "YOUR_APIPORTER_API_KEY"
}`
  const windowsConfig = `$config = @'
${config}
'@
$utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "config.toml"),
  $config,
  $utf8NoBom
)`
  const unixConfig = `cat > config.toml << 'EOF'
${config}
EOF
chmod 600 config.toml`
  const windowsAuth = `$authJson = @'
${auth}
'@
$utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "auth.json"),
  $authJson,
  $utf8NoBom
)`
  const unixAuth = `cat > auth.json << 'EOF'
${auth}
EOF
chmod 600 auth.json`
  const codexCode = (value: string, label?: string) => code(value, label, true)
  const unixQuickSetup = `curl -fsSL ${installBaseUrl}/install/codex.sh | sh`
  const unixRootQuickSetup = `curl -fsSL ${installBaseUrl}/install/codex.sh | APIPORTER_ALLOW_ROOT=1 sh`
  const windowsQuickSetup = `irm ${installBaseUrl}/install/codex.ps1 | iex`

  return {
    lead: text(
      'This guide has one goal: send the first successful Codex request through CBAPI. Choose Method A for the shortest path, or use Method B to create each configuration file yourself.',
      '这篇文档只解决一件事：让 Codex 通过 CBAPI 成功发送第一条请求。想尽快完成可以选择方式 A；希望自己检查配置时，请按方式 B 逐步执行对应系统的命令。'
    ),
    toc: [
      {
        id: 'create-api-key',
        text: text('Step 1: Create an API key', '第一步：创建 API Key'),
      },
      {
        id: 'choose-configuration',
        text: text('Step 2: Choose a setup method', '第二步：选择配置方式'),
      },
      {
        id: 'method-a',
        text: text(
          'Method A: Run the one-click script',
          '方式 A：运行一键脚本'
        ),
        depth: 2,
      },
      {
        id: 'method-b',
        text: text(
          'Method B: Create the Codex configuration manually',
          '方式 B：逐项创建 Codex 配置'
        ),
        depth: 2,
      },
      {
        id: 'verify-connection',
        text: text('Step 3: Verify the connection', '第三步：验证连接'),
      },
      {
        id: 'troubleshooting',
        text: text('Troubleshooting', '常见问题'),
      },
    ],
    sections: [
      {
        id: 'create-api-key',
        title: text('Step 1: Create an API key', '第一步：创建 API Key'),
        blocks: [
          paragraph(
            'Sign in to CBAPI, open API Keys, and create a key assigned to any non-default group that can use gpt-5.6-sol. No single group is required or preferred.',
            '登录 CBAPI 控制台并打开“令牌 / API Keys”，创建一个能够访问 gpt-5.6-sol 的 Key。选择任意包含该模型的非 default 分组即可，不要求使用某个特定分组。'
          ),
          paragraph(
            'Keep the full key available. The one-click and manual paths below produce the same Codex configuration files.',
            '先保存好完整 Key。接下来既可以运行一键脚本，也可以手动创建相同的配置文件。'
          ),
        ],
      },
      {
        id: 'choose-configuration',
        title: text('Step 2: Choose a setup method', '第二步：选择配置方式'),
        blocks: [
          heading(
            'Method A: Run the one-click script',
            '方式 A：运行一键脚本',
            3,
            'method-a'
          ),
          inlineLink(
            ['New to terminal commands? Open the ', '不熟悉终端？可以先查看'],
            ['interactive walkthrough', '互动排练'],
            [
              '. It previews the process on this page and does not change your computer.',
              '。它只在当前页面演示操作，不会修改你的电脑。',
            ],
            '/docs/codex/start'
          ),
          label('macOS or Linux', 'macOS 或 Linux'),
          paragraph(
            'On a regular computer, run the command as the current user without sudo:',
            '普通电脑请使用当前用户直接执行，不要添加 sudo：'
          ),
          codexCode(unixQuickSetup),
          paragraph(
            'If the current session is already logged in as root on a VPS, cloud server, or container, run:',
            '如果当前已经使用 root 登录 VPS、云服务器或容器，请执行：'
          ),
          codexCode(unixRootQuickSetup),
          paragraph(
            'The script lets you choose a language, installs or updates Codex, backs up existing files, securely prompts for the CBAPI API key, writes the provider settings to ~/.codex, and validates gpt-5.6-sol.',
            '脚本会让你选择语言，安装或更新 Codex，备份已有配置，安全输入 CBAPI API Key，把 provider 设置写入 ~/.codex，并验证 gpt-5.6-sol。'
          ),
          label('Windows PowerShell', 'Windows PowerShell'),
          paragraph(
            'Open PowerShell as a regular Windows user and run:',
            '使用普通 Windows 用户打开 PowerShell，然后执行：'
          ),
          codexCode(windowsQuickSetup),
          paragraph(
            'The installer provides the same language selection, secure API key prompt, backups, provider files, and gpt-5.6-sol validation on Windows. Continue to Verify the connection when it finishes.',
            'Windows 安装器同样支持语言选择、安全输入 API Key、配置备份、provider 文件写入和 gpt-5.6-sol 验证。完成后可直接查看“验证连接”。'
          ),
          heading(
            'Method B: create the Codex files manually',
            '方式 B：逐项创建 Codex 配置',
            3,
            'method-b'
          ),
          paragraph(
            'Use the steps below if you do not want to run the CBAPI one-click installer. At each step, execute only the command for your operating system.',
            '不想运行 CBAPI 一键脚本时，请按下面的顺序操作；每一步只执行当前操作系统对应的命令。'
          ),
          plainNote(
            'The user-level .codex directory contains config.toml and auth.json.',
            '方式 B 会在用户级 .codex 目录中创建 config.toml 和 auth.json。'
          ),
          heading('1. Install Codex CLI', '第 1 步：安装 Codex CLI', 4),
          label('Windows PowerShell', 'Windows PowerShell'),
          codexCode(
            'irm https://chatgpt.com/codex/install.ps1 | iex\ncodex --version',
            'PowerShell'
          ),
          label('Linux', 'Linux'),
          codexCode(
            'curl -fsSL https://chatgpt.com/codex/install.sh | sh\ncodex --version'
          ),
          label('macOS', 'macOS'),
          codexCode(
            'curl -fsSL https://chatgpt.com/codex/install.sh | sh\ncodex --version'
          ),
          paragraph(
            'If installation fails, use this fallback command:',
            '如果安装失败，请改用下面的命令：'
          ),
          codexCode(
            'npm install -g @openai/codex@latest --registry=https://registry.npmmirror.com'
          ),
          heading(
            '2. Create and enter the .codex directory',
            '第 2 步：创建并进入 .codex 文件夹',
            4
          ),
          label('Windows PowerShell', 'Windows PowerShell'),
          codexCode(
            'New-Item -ItemType Directory -Force "$HOME\\.codex" | Out-Null\nSet-Location "$HOME\\.codex"',
            'PowerShell'
          ),
          label('Linux', 'Linux'),
          codexCode('mkdir -p ~/.codex\ncd ~/.codex'),
          label('macOS', 'macOS'),
          codexCode('mkdir -p ~/.codex\ncd ~/.codex'),
          heading('3. Create config.toml', '第 3 步：创建 config.toml', 4),
          label('Windows PowerShell', 'Windows PowerShell'),
          codexCode(windowsConfig, 'PowerShell'),
          label('Linux', 'Linux'),
          codexCode(unixConfig, 'Terminal'),
          label('macOS', 'macOS'),
          codexCode(unixConfig, 'Terminal'),
          heading('4. Create auth.json', '第 4 步：创建 auth.json', 4),
          paragraph(
            'Before running the command for your system, replace YOUR_APIPORTER_API_KEY with the complete key created in CBAPI. Keep valid JSON, use the OPENAI_API_KEY field, and do not add a provider auth block. The current Codex API-key flow must keep requires_openai_auth = true.',
            '执行当前系统的命令前，必须把 YOUR_APIPORTER_API_KEY 替换成在 CBAPI 创建的完整 Key。文件必须保持合法 JSON，并使用 OPENAI_API_KEY 字段；不要添加 provider 的 auth 命令块。当前 Codex 的 API Key 配置必须保留 requires_openai_auth = true。'
          ),
          label('Windows PowerShell', 'Windows PowerShell'),
          codexCode(windowsAuth, 'PowerShell'),
          label('Linux', 'Linux'),
          codexCode(unixAuth, 'Terminal'),
          label('macOS', 'macOS'),
          codexCode(unixAuth, 'Terminal'),
          heading('5. Start Codex', '第 5 步：启动 Codex', 4),
          label('Windows PowerShell', 'Windows PowerShell'),
          codexCode(
            'Set-Location $HOME\nNew-Item -ItemType Directory -Force "my-codex-project" | Out-Null\nSet-Location "my-codex-project"\ncodex --model gpt-5.6-sol',
            'PowerShell'
          ),
          label('Linux', 'Linux'),
          codexCode(
            'cd ~\nmkdir -p my-codex-project\ncd my-codex-project\ncodex --model gpt-5.6-sol'
          ),
          label('macOS', 'macOS'),
          codexCode(
            'cd ~\nmkdir -p my-codex-project\ncd my-codex-project\ncodex --model gpt-5.6-sol'
          ),
        ],
      },
      {
        id: 'verify-connection',
        title: text('Step 3: Verify the connection', '第三步：验证连接'),
        blocks: [
          paragraph(
            'After using the one-click installer, fully close any running Codex CLI, IDE, or desktop app. Open a new terminal, enter the project directory, and run:',
            '如果使用了一键脚本，请先完全退出已经打开的 Codex CLI、IDE 或桌面应用，再打开新终端，进入项目目录并执行：'
          ),
          codexCode('codex --model gpt-5.6-sol'),
          inlineLink(
            ['After configuration, you can also ', '完成配置后也可以'],
            ['download the Codex App', '下载 Codex App'],
            [' and use the same setup.', ' 进行使用。'],
            'https://developers.openai.com/codex/app',
            true
          ),
          paragraph('After Codex opens, enter:', '进入 Codex 后输入：'),
          codexCode('请用一句话确认当前使用的模型和 provider。'),
          paragraph(
            'A normal response confirms that the configuration is complete.',
            '能够正常回复，就说明配置完成。'
          ),
        ],
      },
      {
        id: 'troubleshooting',
        title: text('Troubleshooting', '常见问题'),
        blocks: [
          table(
            [
              ['Symptom', '现象'],
              ['What to do', '处理方法'],
            ],
            [
              [
                ['401', '401'],
                [
                  'Copy the API key again and confirm it has not been disabled or deleted.',
                  '重新复制 API Key，并确认 Key 没有被删除或禁用。',
                ],
              ],
              [
                ['model_not_found', 'model_not_found'],
                [
                  'Select a group and key that can access gpt-5.6-sol.',
                  '编辑 API Key，选择一个可以访问 gpt-5.6-sol 的分组。',
                ],
              ],
              [
                [
                  'Codex still asks for ChatGPT sign-in',
                  '仍然出现 ChatGPT 登录',
                ],
                [
                  'Fully close every Codex process and open it again.',
                  '完全退出所有 Codex 进程后重新打开。',
                ],
              ],
              [
                ['codex command not found', '找不到 codex 命令'],
                [
                  'Open a new terminal. On Windows, try codex.cmd as well.',
                  '重新打开终端；Windows 可以尝试运行 codex.cmd。',
                ],
              ],
            ]
          ),
        ],
      },
    ],
  }
}

function claudeDocument(rootUrl: string, siteUrl: string): GuideDocument {
  const installBaseUrl = siteUrl.replace(/\/+$/, '')
  const settings = `{
  "env": {
    "ANTHROPIC_BASE_URL": "${rootUrl}",
    "ANTHROPIC_AUTH_TOKEN": "YOUR_APIPORTER_API_KEY",
    "ANTHROPIC_MODEL": "claude-opus-4-8",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-8",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-sonnet-5"
  }
}`
  const windowsSettings = `$settings = @'
${settings}
'@
$utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "settings.json"),
  $settings,
  $utf8NoBom
)`
  const unixSettings = `cat > settings.json << 'EOF'
${settings}
EOF
chmod 600 settings.json`

  return {
    lead: text(
      'This guide focuses on one outcome: sending the first successful Claude Code request through CBAPI. Choose the quick script in Method A, or follow every operating-system command in Method B.',
      '这篇文档只完成一个目标：让 Claude Code 通过 CBAPI 成功发送第一条请求。想快速完成可使用方式 A；需要逐项配置则按方式 B 执行当前操作系统对应的命令。'
    ),
    toc: [
      {
        id: 'create-api-key',
        text: text('Step 1: Create an API key', '第一步：创建 API Key'),
      },
      {
        id: 'choose-configuration',
        text: text('Step 2: Choose a setup method', '第二步：选择配置方式'),
      },
      {
        id: 'method-a',
        text: text('Method A: Run the quick script', '方式 A：运行一键脚本'),
        depth: 2,
      },
      {
        id: 'method-b',
        text: text(
          'Method B: Configure Claude Code manually',
          '方式 B：手动完成 Claude Code 配置'
        ),
        depth: 2,
      },
      {
        id: 'send-first-request',
        text: text('Step 3: Send the first request', '第三步：发送第一条请求'),
      },
    ],
    sections: [
      {
        id: 'create-api-key',
        title: text('Step 1: Create an API key', '第一步：创建 API Key'),
        blocks: [
          paragraph(
            'Create a non-default CBAPI API key with access to claude-opus-4-8 and claude-sonnet-5. Keep the complete key ready; the quick script asks for it only once.',
            '在 CBAPI 创建一个可以访问 claude-opus-4-8 和 claude-sonnet-5 的非 default 分组 API Key。请先保存完整 Key，一键脚本只会要求粘贴一次。'
          ),
        ],
      },
      {
        id: 'choose-configuration',
        title: text('Step 2: Choose a setup method', '第二步：选择配置方式'),
        blocks: [
          heading(
            'Method A: Run the quick script',
            '方式 A：运行一键脚本',
            3,
            'method-a'
          ),
          inlineLink(
            ['New to the terminal? Open the ', '还不熟悉终端？先打开'],
            ['guided walkthrough', '互动排练'],
            [
              '. It is an on-page visual walkthrough and does not change your computer.',
              '。这是当前页面内的视觉演练，不会修改你的电脑。',
            ],
            '/docs/claude-code/start'
          ),
          label('macOS or Linux', 'macOS 或 Linux'),
          paragraph(
            'On a regular computer, run this as your current user without sudo:',
            '普通电脑请使用当前用户直接执行，不要加 sudo：'
          ),
          code(
            `curl -fsSL ${installBaseUrl}/install/claude.sh | sh`,
            undefined,
            true
          ),
          paragraph(
            'If you are already signed in as root on a VPS, server, or container, run:',
            '如果你本来就是用 root 登录 VPS、云服务器或容器，请使用：'
          ),
          code(
            `curl -fsSL ${installBaseUrl}/install/claude.sh | APIPORTER_ALLOW_ROOT=1 sh`,
            undefined,
            true
          ),
          label('Windows PowerShell', 'Windows PowerShell'),
          paragraph(
            'Open PowerShell as a regular Windows user, then run:',
            '用普通 Windows 用户打开 PowerShell，然后执行：'
          ),
          code(
            `irm ${installBaseUrl}/install/claude.ps1 | iex`,
            undefined,
            true
          ),
          paragraph(
            'The script lets you choose a language, installs the official Claude Code when needed, securely asks for the CBAPI API key once, backs up and merges the existing settings, and validates both Claude models. It does not start Claude Code automatically.',
            '脚本会让你选择语言，在需要时安装官方 Claude Code，只安全输入一次 CBAPI API Key，备份并合并已有配置，然后验证两个 Claude 模型。脚本不会自动启动 Claude Code。'
          ),
          heading(
            'Method B: Configure Claude Code manually',
            '方式 B：手动完成 Claude Code 配置',
            3,
            'method-b'
          ),
          paragraph(
            'Follow the steps in order and run only the command for your operating system.',
            '请按下面的顺序操作，每一步只执行自己操作系统对应的命令。'
          ),
          heading('1. Install Claude Code', '第 1 步：安装 Claude Code', 4),
          label('Windows PowerShell', 'Windows PowerShell'),
          code(
            'irm https://claude.ai/install.ps1 | iex\nclaude --version',
            undefined,
            true
          ),
          label('Linux', 'Linux'),
          code(
            'curl -fsSL https://claude.ai/install.sh | bash\nclaude --version',
            undefined,
            true
          ),
          label('macOS', 'macOS'),
          code(
            'curl -fsSL https://claude.ai/install.sh | bash\nclaude --version',
            undefined,
            true
          ),
          paragraph(
            'If the official installer fails, use this fallback:',
            '如果安装失败，请改用下面的命令：'
          ),
          code(
            'npm install -g @anthropic-ai/claude-code@latest --registry=https://registry.npmmirror.com',
            undefined,
            true
          ),
          heading(
            '2. Create and enter the user settings directory',
            '第 2 步：创建并进入用户配置目录',
            4
          ),
          label('Windows PowerShell', 'Windows PowerShell'),
          code(
            'New-Item -ItemType Directory -Force "$HOME\\.claude" | Out-Null\nSet-Location "$HOME\\.claude"',
            undefined,
            true
          ),
          label('Linux', 'Linux'),
          code('mkdir -p ~/.claude\ncd ~/.claude', undefined, true),
          label('macOS', 'macOS'),
          code('mkdir -p ~/.claude\ncd ~/.claude', undefined, true),
          heading('3. Create settings.json', '第 3 步：创建 settings.json', 4),
          paragraph(
            'Before running the command for your system, replace YOUR_APIPORTER_API_KEY with your complete CBAPI key.',
            '执行自己系统的命令前，必须把 YOUR_APIPORTER_API_KEY 替换成你自己的完整 CBAPI API Key。'
          ),
          label('Windows PowerShell', 'Windows PowerShell'),
          code(windowsSettings, undefined, true),
          label('Linux', 'Linux'),
          code(unixSettings, undefined, true),
          label('macOS', 'macOS'),
          code(unixSettings, undefined, true),
          heading('4. Start Claude Code', '第 4 步：启动 Claude Code', 4),
          label('Windows PowerShell', 'Windows PowerShell'),
          code(
            'Set-Location $HOME\nNew-Item -ItemType Directory -Force "my-claude-project" | Out-Null\nSet-Location "my-claude-project"\nclaude',
            undefined,
            true
          ),
          label('Linux', 'Linux'),
          code(
            'cd ~\nmkdir -p my-claude-project\ncd my-claude-project\nclaude',
            undefined,
            true
          ),
          label('macOS', 'macOS'),
          code(
            'cd ~\nmkdir -p my-claude-project\ncd my-claude-project\nclaude',
            undefined,
            true
          ),
        ],
      },
      {
        id: 'send-first-request',
        title: text('Step 3: Send the first request', '第三步：发送第一条请求'),
        blocks: [
          paragraph(
            'After Method A finishes, enter a trusted project directory and start Claude Code yourself:',
            '方式 A 完成后，请先进入你信任的项目目录，再自行启动 Claude Code：'
          ),
          code('claude', undefined, true),
          paragraph(
            'With either method, send this prompt after Claude Code opens:',
            '无论使用哪种方式，进入后发送：'
          ),
          code('请用一句话确认当前使用的模型。', undefined, true),
          paragraph(
            'A normal reply confirms that the configuration is complete.',
            '能够正常回复，就说明配置完成。'
          ),
        ],
      },
    ],
  }
}

function openCodeDocument(v1Url: string): GuideDocument {
  const config = `{
  "$schema": "https://opencode.ai/config.json",
  "model": "apiporter/gpt-5.6-sol",
  "provider": {
    "apiporter": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "CBAPI",
      "options": { "baseURL": "${v1Url}" },
      "models": {
        "gpt-5.6-sol": { "name": "GPT 5.6 Sol" }
      }
    }
  }
}`
  const windowsConfig = `$config = @'
${config}
'@
$utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "opencode.json"),
  $config,
  $utf8NoBom
)`
  const unixConfig = `cat > opencode.json << 'EOF'
${config}
EOF`

  return {
    toc: [
      {
        id: 'create-api-key',
        text: text('Step 1: Create an API key', '第一步：创建 API Key'),
      },
      {
        id: 'install-opencode',
        text: text('Step 2: Install OpenCode', '第二步：安装 OpenCode'),
      },
      {
        id: 'create-opencode-config',
        text: text(
          'Step 3: Create opencode.json',
          '第三步：创建 opencode.json'
        ),
      },
      {
        id: 'bind-api-key',
        text: text('Step 4: Connect the API key', '第四步：绑定 API Key'),
      },
      {
        id: 'select-model',
        text: text('Step 5: Select and test a model', '第五步：选择模型并测试'),
      },
    ],
    sections: [
      {
        id: 'create-api-key',
        title: text('Step 1: Create an API key', '第一步：创建 API Key'),
        blocks: [
          paragraph(
            'Create a non-default CBAPI API key with access to gpt-5.6-sol.',
            '在 CBAPI 创建一个可以访问 gpt-5.6-sol 的非 default 分组 API Key。'
          ),
        ],
      },
      {
        id: 'install-opencode',
        title: text('Step 2: Install OpenCode', '第二步：安装 OpenCode'),
        blocks: [
          label('Windows PowerShell', 'Windows PowerShell'),
          code('choco install opencode\nopencode --version', undefined, true),
          label('Linux or macOS', 'Linux 或 macOS'),
          code(
            'curl -fsSL https://opencode.ai/install | bash\nopencode --version',
            undefined,
            true
          ),
          paragraph(
            'If installation fails, use this fallback:',
            '如果安装失败，请改用下面的命令：'
          ),
          code(
            'npm install -g opencode-ai@latest --registry=https://registry.npmmirror.com',
            undefined,
            true
          ),
        ],
      },
      {
        id: 'create-opencode-config',
        title: text(
          'Step 3: Create opencode.json',
          '第三步：创建 opencode.json'
        ),
        blocks: [
          paragraph(
            'Enter your project directory, then run the command for your operating system.',
            '进入你的项目目录，然后执行当前系统对应的命令。'
          ),
          label('Windows PowerShell', 'Windows PowerShell'),
          code(windowsConfig, undefined, true),
          label('Linux or macOS', 'Linux 或 macOS'),
          code(unixConfig, undefined, true),
        ],
      },
      {
        id: 'bind-api-key',
        title: text('Step 4: Connect the API key', '第四步：绑定 API Key'),
        blocks: [
          paragraph(
            'Start OpenCode from the same project directory:',
            '在同一个项目目录启动 OpenCode：'
          ),
          code('opencode', undefined, true),
          plainNote(
            'Enter /connect, choose Other, use apiporter as the provider ID, and paste your CBAPI API key.',
            '输入 /connect，选择 Other，把 provider id 填为 apiporter，然后粘贴你的 CBAPI API Key。'
          ),
        ],
      },
      {
        id: 'select-model',
        title: text(
          'Step 5: Select the model and test',
          '第五步：选择模型并测试'
        ),
        blocks: [
          paragraph(
            'Enter /models, select apiporter/gpt-5.6-sol, then send:',
            '输入 /models，选择 apiporter/gpt-5.6-sol，然后发送：'
          ),
          code('请用一句话向我问好。', undefined, true),
          paragraph(
            'A normal response means the setup is complete.',
            '能够正常回复，就说明配置完成。'
          ),
        ],
      },
    ],
  }
}

function grokDocument(v1Url: string): GuideDocument {
  const config = `[models]
default = "apiporter-grok"

[model.apiporter-grok]
model = "grok-4.5"
base_url = "${v1Url}"
name = "CBAPI Grok 4.5"
env_key = "APIPORTER_API_KEY"
api_backend = "responses"`
  const windowsConfig = `New-Item -ItemType Directory -Force "$HOME\\.grok" | Out-Null
Set-Location "$HOME\\.grok"
$config = @'
${config}
'@
$utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "config.toml"),
  $config,
  $utf8NoBom
)`
  const unixConfig = `mkdir -p ~/.grok
cd ~/.grok
cat > config.toml << 'EOF'
${config}
EOF
chmod 600 config.toml`

  return {
    toc: [
      {
        id: 'create-api-key',
        text: text('Step 1: Create an API key', '第一步：创建 API Key'),
      },
      {
        id: 'install-grok-build',
        text: text('Step 2: Install Grok Build', '第二步：安装 Grok Build'),
      },
      {
        id: 'create-grok-config',
        text: text('Step 3: Create config.toml', '第三步：创建 config.toml'),
      },
      {
        id: 'save-grok-key',
        text: text('Step 4: Save the API key', '第四步：保存 API Key'),
      },
      {
        id: 'test-grok-build',
        text: text('Step 5: Start and test', '第五步：启动并测试'),
      },
    ],
    sections: [
      {
        id: 'create-api-key',
        title: text('Step 1: Create an API key', '第一步：创建 API Key'),
        blocks: [
          paragraph(
            'Create a CBAPI API key that can access grok-4.5.',
            '在 CBAPI 创建一个可以访问 grok-4.5 的 API Key。'
          ),
        ],
      },
      {
        id: 'install-grok-build',
        title: text('Step 2: Install Grok Build', '第二步：安装 Grok Build'),
        blocks: [
          label('Windows PowerShell', 'Windows PowerShell'),
          code(
            'irm https://x.ai/cli/install.ps1 | iex\ngrok version',
            undefined,
            true
          ),
          label('Linux or macOS', 'Linux 或 macOS'),
          code(
            'curl -fsSL https://x.ai/cli/install.sh | bash\ngrok version',
            undefined,
            true
          ),
        ],
      },
      {
        id: 'create-grok-config',
        title: text('Step 3: Create config.toml', '第三步：创建 config.toml'),
        blocks: [
          label('Windows PowerShell', 'Windows PowerShell'),
          code(windowsConfig, undefined, true),
          label('Linux or macOS', 'Linux 或 macOS'),
          code(unixConfig, undefined, true),
        ],
      },
      {
        id: 'save-grok-key',
        title: text('Step 4: Save the API key', '第四步：保存 API Key'),
        blocks: [
          paragraph(
            'Replace YOUR_APIPORTER_API_KEY before running the command for your system.',
            '执行命令前，必须把 YOUR_APIPORTER_API_KEY 替换成自己的完整密钥。'
          ),
          label('Windows PowerShell', 'Windows PowerShell'),
          code(
            '[Environment]::SetEnvironmentVariable(\n  "APIPORTER_API_KEY",\n  "YOUR_APIPORTER_API_KEY",\n  "User"\n)\n$env:APIPORTER_API_KEY = "YOUR_APIPORTER_API_KEY"',
            undefined,
            true
          ),
          label('Linux', 'Linux'),
          code(
            'echo \'export APIPORTER_API_KEY="YOUR_APIPORTER_API_KEY"\' >> ~/.bashrc\nsource ~/.bashrc',
            undefined,
            true
          ),
          label('macOS', 'macOS'),
          code(
            'echo \'export APIPORTER_API_KEY="YOUR_APIPORTER_API_KEY"\' >> ~/.zshrc\nsource ~/.zshrc',
            undefined,
            true
          ),
        ],
      },
      {
        id: 'test-grok-build',
        title: text('Step 5: Start and test', '第五步：启动并测试'),
        blocks: [
          label('Windows PowerShell', 'Windows PowerShell'),
          code(
            'Set-Location $HOME\ngrok -p "请只回复：CBAPI connected" -m apiporter-grok\ngrok',
            undefined,
            true
          ),
          label('Linux or macOS', 'Linux 或 macOS'),
          code(
            'cd ~\ngrok -p "请只回复：CBAPI connected" -m apiporter-grok\ngrok',
            undefined,
            true
          ),
        ],
      },
    ],
  }
}

function geminiDocument(rootUrl: string): GuideDocument {
  return {
    toc: [
      {
        id: 'create-api-key',
        text: text('Step 1: Create an API key', '第一步：创建 API Key'),
      },
      {
        id: 'install-gemini-cli',
        text: text('Step 2: Install Gemini CLI', '第二步：安装 Gemini CLI'),
      },
      {
        id: 'configure-gemini',
        text: text('Step 3: Configure CBAPI', '第三步：配置 CBAPI'),
      },
      {
        id: 'test-gemini',
        text: text('Step 4: Start and test', '第四步：启动并测试'),
      },
    ],
    sections: [
      {
        id: 'create-api-key',
        title: text('Step 1: Create an API key', '第一步：创建 API Key'),
        blocks: [
          paragraph('Create a CBAPI API key.', '在 CBAPI 创建一个 API Key。'),
        ],
      },
      {
        id: 'install-gemini-cli',
        title: text('Step 2: Install Gemini CLI', '第二步：安装 Gemini CLI'),
        blocks: [
          code(
            'npm install -g @google/gemini-cli@latest\ngemini --version',
            undefined,
            true
          ),
        ],
      },
      {
        id: 'configure-gemini',
        title: text('Step 3: Configure CBAPI', '第三步：配置 CBAPI'),
        blocks: [
          paragraph(
            'Replace the placeholder with your complete CBAPI API key before running the command.',
            '执行命令前，把 YOUR_APIPORTER_API_KEY 替换成自己的完整 CBAPI API Key。'
          ),
          label('Windows PowerShell', 'Windows PowerShell'),
          code(
            `$env:GEMINI_API_KEY="YOUR_APIPORTER_API_KEY"\n$env:GOOGLE_GEMINI_BASE_URL="${rootUrl}"`,
            undefined,
            true
          ),
          label('Linux or macOS', 'Linux 或 macOS'),
          code(
            `export GEMINI_API_KEY="YOUR_APIPORTER_API_KEY"\nexport GOOGLE_GEMINI_BASE_URL="${rootUrl}"`,
            undefined,
            true
          ),
        ],
      },
      {
        id: 'test-gemini',
        title: text('Step 4: Start and test', '第四步：启动并测试'),
        blocks: [
          paragraph(
            'Replace YOUR_MODEL_ID with a model ID from the model catalog, then run Gemini in the same terminal.',
            '把 YOUR_MODEL_ID 替换成模型目录中的模型 ID，然后在同一个终端启动 Gemini。'
          ),
          code('gemini --model YOUR_MODEL_ID', undefined, true),
          paragraph(
            'If a sign-in method is requested, choose Use Gemini API key, then send:',
            '如果出现登录方式选择，请选择 Use Gemini API key，然后发送：'
          ),
          code('请用一句话确认连接正常。', undefined, true),
          paragraph(
            'A normal response means the setup is complete.',
            '能够正常回复，就说明配置完成。'
          ),
        ],
      },
    ],
  }
}

function seedanceDocument(v1Url: string): GuideDocument {
  return {
    lead: text(
      'Seedance uses an asynchronous Video API: submit a job first, then poll its status with the returned task ID. Do not send video requests to /v1/chat/completions.',
      'Seedance 使用异步 Video API：先提交任务，再使用返回的任务 ID 查询状态。视频请求不要发送到 /v1/chat/completions。'
    ),
    toc: [
      {
        id: 'video-prerequisites',
        text: text('Before you start', '开始前准备'),
      },
      {
        id: 'text-to-video',
        text: text('Text-to-video request', '文生视频请求'),
      },
      {
        id: 'image-to-video',
        text: text('Image-to-video request', '图生视频请求'),
      },
      { id: 'video-response', text: text('Submission response', '提交响应') },
      { id: 'poll-video', text: text('Check task status', '查询任务状态') },
      { id: 'download-video', text: text('Download the video', '下载视频') },
      { id: 'video-fields', text: text('Main request fields', '主要入参') },
    ],
    sections: [
      {
        id: 'video-prerequisites',
        title: text('Before you start', '开始前准备'),
        blocks: [
          paragraph(
            `Create a CBAPI key and use ${v1Url} as the Base URL. Public model IDs are seedance-2.0 and seedance-2.5.`,
            `创建 CBAPI API Key，并使用 ${v1Url} 作为 Base URL。公开模型名为 seedance-2.0 和 seedance-2.5。`
          ),
          inlineLink(
            [
              'Available duration and resolution combinations vary by model; check the ',
              '不同模型可用的时长与分辨率组合可能不同，请在请求前查看',
            ],
            ['model catalog', '模型与价格'],
            [
              ' before sending a request. Seedance 2.0 and 2.5 currently support 480p and 720p.',
              '页面。Seedance 2.0 与 2.5 当前仅支持 480p 和 720p。',
            ],
            '/pricing'
          ),
        ],
      },
      {
        id: 'text-to-video',
        title: text('Text-to-video request', '文生视频请求'),
        blocks: [
          code(
            `curl ${v1Url}/videos \\
  -H "Authorization: Bearer YOUR_APIPORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "seedance-2.5",
    "prompt": "雨夜霓虹街道上，一只白猫向镜头跑来，电影感，低机位跟拍",
    "duration": 4,
    "resolution": "720p"
  }'`,
            undefined,
            true
          ),
        ],
      },
      {
        id: 'image-to-video',
        title: text('Image-to-video request', '图生视频请求'),
        blocks: [
          paragraph(
            'Add an image field containing a publicly reachable HTTPS image URL. The other fields are the same as text-to-video.',
            '增加 image 字段并传入可公开访问的 HTTPS 图片地址，其余字段与文生视频相同。'
          ),
          code(
            `curl ${v1Url}/videos \\
  -H "Authorization: Bearer YOUR_APIPORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "seedance-2.5",
    "prompt": "让画面主体缓慢转向镜头，镜头轻微推进，保持真实摄影风格",
    "image": "https://example.com/reference.png",
    "duration": 4,
    "resolution": "720p"
  }'`,
            undefined,
            true
          ),
        ],
      },
      {
        id: 'video-response',
        title: text('Submission response', '提交响应'),
        blocks: [
          paragraph(
            'A successful submission returns a public task ID. id and task_id identify the same job; save either value for polling.',
            '提交成功后会返回公开任务 ID。id 与 task_id 表示同一个任务，保存任意一个即可继续查询。'
          ),
          code(
            `{
  "id": "task_example_123",
  "task_id": "task_example_123",
  "object": "video",
  "model": "seedance-2.5",
  "status": "queued"
}`,
            undefined,
            true
          ),
        ],
      },
      {
        id: 'poll-video',
        title: text('Check task status', '查询任务状态'),
        blocks: [
          paragraph(
            'Poll every few seconds. Continue while status is queued, pending, processing, or in_progress; stop after completed or failed.',
            '建议每隔数秒查询一次。queued、pending、processing 或 in_progress 表示仍在等待；变为 completed 或 failed 后停止轮询。'
          ),
          code(
            `curl ${v1Url}/videos/task_example_123 \\
  -H "Authorization: Bearer YOUR_APIPORTER_API_KEY"`,
            undefined,
            true
          ),
          paragraph(
            'Example response after the task completes:',
            '任务完成响应示例：'
          ),
          code(
            `{
  "id": "task_example_123",
  "task_id": "task_example_123",
  "object": "video",
  "model": "seedance-2.5",
  "status": "completed",
  "progress": 100,
  "metadata": {
    "url": "https://example.com/generated-video.mp4"
  }
}`,
            undefined,
            true
          ),
        ],
      },
      {
        id: 'download-video',
        title: text('Download the video', '下载视频'),
        blocks: [
          paragraph(
            'After the task completes, download the generated media through the content route.',
            '任务完成后，通过 content 接口下载生成的视频。'
          ),
          code(
            `curl -L ${v1Url}/videos/task_example_123/content \\
  -H "Authorization: Bearer YOUR_APIPORTER_API_KEY" \\
  -o seedance.mp4`,
            undefined,
            true
          ),
        ],
      },
      {
        id: 'video-fields',
        title: text('Main request fields', '主要入参'),
        blocks: [
          list([
            [
              'model: required; use seedance-2.0 or seedance-2.5.',
              'model：必填，使用 seedance-2.0 或 seedance-2.5。',
            ],
            [
              'prompt: required; describe the intended video.',
              'prompt：必填，描述希望生成的视频。',
            ],
            [
              'duration: required integer seconds; the current minimum is 4. seconds is also accepted.',
              'duration：必填，整数秒，当前最短为 4 秒；也兼容 seconds 字段。',
            ],
            [
              'resolution: required; use 480p or 720p.',
              'resolution：必填，仅支持 480p 或 720p。',
            ],
            [
              'image: optional public HTTPS image URL; including it switches to image-to-video.',
              'image：可选，公开可访问的 HTTPS 图片地址；传入后执行图生视频。',
            ],
          ]),
          plainNote(
            '400 usually indicates invalid parameters, 401 an invalid key, and 429 a temporary limit. Retry 5xx responses after backoff.',
            'HTTP 400 通常表示参数不正确，401 表示 API Key 无效，429 表示暂时受限；遇到 5xx 可在退避等待后重试。',
            'warning'
          ),
        ],
      },
    ],
  }
}

function imagesDocument(rootUrl: string, v1Url: string): GuideDocument {
  return {
    lead: text(
      'This page covers two independent image protocols. GPT Image 2 uses OpenAI-compatible Images routes, while the Gemini image models use native generateContent. They share one CBAPI key but their request and response formats cannot be mixed.',
      '本页包含两套彼此独立的图片生成协议：GPT Image 2 使用 OpenAI 兼容 Images API，Gemini 图片模型使用原生 generateContent。两者共用 CBAPI API Key，但请求与响应格式不能混用。'
    ),
    leadItems: [
      text(
        'gpt-image-2 uses the OpenAI-compatible /v1/images/generations and /v1/images/edits routes.',
        'gpt-image-2 使用 OpenAI 兼容的 /v1/images/generations 与 /v1/images/edits 协议。'
      ),
      text(
        'gemini-3-pro-image and gemini-3.1-flash-image use the native Gemini generateContent protocol.',
        'gemini-3-pro-image 与 gemini-3.1-flash-image 使用 Gemini 原生 generateContent 协议。'
      ),
    ],
    leadAfter: text(
      'Choose the model family before copying an example. Do not send Gemini fields to the GPT routes or GPT Images fields to Gemini routes.',
      '复制示例前请先选择模型系列；不要向 GPT 端点发送 Gemini 字段，也不要向 Gemini 端点发送 GPT Images 字段。'
    ),
    toc: [
      {
        id: 'gpt-image-api',
        text: text(
          '1. GPT Image 2 — OpenAI-compatible Images API',
          '1. GPT Image 2 — OpenAI 兼容 Images API'
        ),
      },
      {
        id: 'gpt-entry-mode',
        text: text('Choose an endpoint and mode', '选择入口和模式'),
        depth: 2,
      },
      {
        id: 'gpt-sync',
        text: text('Synchronous request', '同步请求'),
        depth: 2,
      },
      {
        id: 'gpt-edit',
        text: text('Edit a reference image', '编辑参考图'),
        depth: 2,
      },
      {
        id: 'gpt-stream',
        text: text('Streaming request', '流式请求'),
        depth: 2,
      },
      {
        id: 'gpt-image-fields',
        text: text('Supported fields', '支持字段'),
        depth: 2,
      },
      {
        id: 'gemini-image-api',
        text: text(
          '2. Gemini images — native Gemini API',
          '2. Gemini 图片 — Gemini 原生 API'
        ),
      },
      {
        id: 'gemini-endpoints',
        text: text('Endpoints and long requests', '端点与长请求模式'),
        depth: 2,
      },
      {
        id: 'gemini-stream',
        text: text('Streaming request', '流式请求'),
        depth: 2,
      },
      {
        id: 'gemini-response',
        text: text('Response format', '响应格式'),
        depth: 2,
      },
      {
        id: 'gemini-image-models',
        text: text('Models, resolution, and price', '模型、分辨率与预估价格'),
        depth: 2,
      },
    ],
    sections: [
      {
        id: 'gpt-image-api',
        title: text(
          '1. GPT Image 2 — OpenAI-compatible Images API',
          '1. GPT Image 2 — OpenAI 兼容 Images API'
        ),
        blocks: [
          paragraph(
            'Use gpt-image-2 to generate one PNG or edit public and uploaded reference images. The API supports medium or high quality, signed URLs or base64 output, and optional SSE.',
            '通过 gpt-image-2 生成 PNG，或基于公网 URL、本地上传的参考图进行编辑。每个请求返回一张图片，支持 medium / high 画质、签名 URL 或 base64 输出，以及可选 SSE。'
          ),
          heading(
            'Choose an endpoint and mode',
            '选择入口和模式',
            3,
            'gpt-entry-mode'
          ),
          list([
            [
              `Use ${v1Url} for a standard JSON request.`,
              `普通同步 JSON 请求使用 ${v1Url}。`,
            ],
            [
              `For a long-running request, keep ${v1Url} and set stream=true.`,
              `长时间请求继续使用 ${v1Url}，并设置 stream=true。`,
            ],
          ]),
          paragraph(
            'Choose the request mode before submitting; do not redirect an in-progress POST between origins.',
            '请在提交前选定请求模式，不要在请求进行中跨域重定向 POST。'
          ),
          heading('Synchronous request', '同步请求', 3, 'gpt-sync'),
          code(
            `curl ${v1Url}/images/generations \\
  -H "Authorization: Bearer YOUR_APIPORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-image-2",
    "prompt": "黎明时安静的湖畔木屋，电影感自然光",
    "n": 1,
    "quality": "medium",
    "size": "1024x1024",
    "response_format": "url",
    "output_format": "png"
  }'`,
            undefined,
            true
          ),
          paragraph(
            'A URL response contains a private signed CBAPI link that expires after one hour:',
            'URL 响应包含一个一小时后过期的 CBAPI 私有签名链接：'
          ),
          code(
            '{"created":1710000000,"data":[{"url":"https://example.com/v1/images/assets/.../content?expires=...&signature=..."}]}',
            undefined,
            true
          ),
          paragraph(
            'Set response_format to b64_json to receive the validated PNG directly instead of a temporary URL.',
            '将 response_format 设为 b64_json，可直接获得验证后的 PNG，而不持久化 API 输出对象。'
          ),
          paragraph(
            'Billing uses the actual quality and dimensions in the request. The final charge is recorded in the usage log.',
            '计费以请求中的实际画质和尺寸为准，最终费用会记录在用量日志中。'
          ),
          heading('Edit a reference image', '编辑参考图', 3, 'gpt-edit'),
          paragraph(
            'Send one or more publicly reachable HTTP(S) image URLs to POST /v1/images/edits. Each images item contains one image_url.',
            '向 POST /v1/images/edits 传入一个或多个公网可访问的 HTTP(S) 图片 URL；images 数组每一项只包含一个 image_url。'
          ),
          code(
            `curl ${v1Url}/images/edits \\
  -H "Authorization: Bearer YOUR_APIPORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-image-2",
    "prompt": "把背景改成干净的白色摄影棚",
    "images": [{"image_url": "https://example.cn/input.png"}],
    "size": "2048x2048",
    "response_format": "url"
  }'`,
            undefined,
            true
          ),
          paragraph(
            'You can also upload one local PNG, JPEG, or WebP file as multipart/form-data:',
            '也可以通过 multipart/form-data 上传一个本地 PNG、JPEG 或 WebP 文件：'
          ),
          code(
            `curl ${v1Url}/images/edits \\
  -H "Authorization: Bearer YOUR_APIPORTER_API_KEY" \\
  -F "model=gpt-image-2" \\
  -F "prompt=把背景改成干净的白色摄影棚" \\
  -F "image=@/path/to/input.png" \\
  -F "size=2048x2048" \\
  -F "response_format=url"`,
            undefined,
            true
          ),
          plainNote(
            'A multipart request accepts exactly one PNG, JPEG, or WebP file and the total body must stay under 20 MiB. Reference URLs must remain available while the upstream provider reads them; CBAPI does not retain reference inputs as output assets.',
            'multipart 请求必须且只能包含一个 PNG、JPEG 或 WebP 文件，总请求体不得超过 20 MiB。参考图 URL 在上游读取期间必须保持可访问；CBAPI 不会把参考图输入保存为输出资产。',
            'warning'
          ),
          heading('Streaming request', '流式请求', 3, 'gpt-stream'),
          code(
            `curl -N ${v1Url}/images/generations \\
  -H "Authorization: Bearer YOUR_APIPORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-image-2","prompt":"一只白猫在雨中的霓虹街道上奔跑","n":1,"quality":"high","size":"1024x1024","response_format":"url","stream":true}'`,
            undefined,
            true
          ),
          paragraph(
            'SSE comments are transport heartbeats, not model output. Stop after image_generation.completed and data: [DONE].',
            'SSE 注释只是传输保活，不代表模型已经输出。收到 image_generation.completed 和 data: [DONE] 后结束。'
          ),
        ],
      },
      {
        id: 'gpt-image-fields',
        level: 3,
        title: text('Supported fields', '支持字段'),
        blocks: [
          list([
            [
              'model: required and currently gpt-image-2 only.',
              'model：必填，目前只能是 gpt-image-2。',
            ],
            [
              'prompt: required, up to 32,000 Unicode characters.',
              'prompt：必填，最多 32,000 个 Unicode 字符。',
            ],
            ['n: optional and currently must be 1.', 'n：可选，目前只能是 1。'],
            [
              'quality: medium by default, or high.',
              'quality：默认 medium，也可以使用 high。',
            ],
            [
              'size: WIDTHxHEIGHT; both values must be multiples of 16.',
              'size：WIDTHxHEIGHT，宽高均为 16 的倍数，最大边 3840 px，宽高比不超过 3:1，总像素范围为 0.66–8.29 MP。',
            ],
            [
              'response_format: url by default, or b64_json.',
              'response_format：默认 url，也可以使用 b64_json。',
            ],
            ['output_format: PNG only.', 'output_format：目前只支持 png。'],
            ['stream: optional boolean.', 'stream：可选布尔值。'],
            [
              'images: required by JSON edits and contains public HTTP(S) image_url objects.',
              'images：JSON 编辑接口必填，每项包含公网 HTTP(S) image_url。',
            ],
            [
              'image: multipart edit input; exactly one PNG, JPEG, or WebP.',
              'image：multipart 编辑输入，必须且只能上传一个 PNG、JPEG 或 WebP 文件。',
            ],
          ]),
          plainNote(
            'Image generation rejects reference images. The edit route accepts public URL inputs or one multipart file. Multiple uploads, data/base64 references, masks, input_fidelity, variations, partial images, and unknown fields are rejected. Validation or upstream failures are returned as errors instead of successful image objects.',
            '图片生成请求不接受参考图。编辑接口支持公网 URL 或一个 multipart 本地文件；多个上传文件、data/base64 输入、mask、input_fidelity、变体、局部图及未知字段都会被拒绝。校验或上游失败会返回错误，不会伪装成成功图片。'
          ),
          paragraph(
            'Use a standard CBAPI API key and make sure model restrictions include gpt-image-2.',
            '请使用普通 CBAPI API Key；启用模型限制时，必须包含 gpt-image-2。'
          ),
        ],
      },
      {
        id: 'gemini-image-api',
        title: text(
          '2. Gemini images — native Gemini API',
          '2. Gemini 图片 — Gemini 原生 API'
        ),
        blocks: [
          paragraph(
            'Nano Banana Pro and Nano Banana 2 use native Gemini request and response shapes. They do not use /v1/images/generations.',
            'Nano Banana Pro 与 Nano Banana 2 使用 Gemini 原生请求和响应格式，不使用 /v1/images/generations。'
          ),
          heading(
            'Endpoints and long-request mode',
            '端点与长请求模式',
            3,
            'gemini-endpoints'
          ),
          list([
            [
              `Synchronous: POST ${rootUrl}/v1beta/models/{model}:generateContent`,
              `同步：POST ${rootUrl}/v1beta/models/{model}:generateContent`,
            ],
            [
              `Recommended for image generation: POST ${rootUrl}/v1beta/models/{model}:streamGenerateContent?alt=sse`,
              `生图推荐：POST ${rootUrl}/v1beta/models/{model}:streamGenerateContent?alt=sse`,
            ],
          ]),
          paragraph(
            'Use the primary CBAPI domain for native Gemini requests and prefer the streaming endpoint for long image jobs.',
            'Gemini 原生请求请使用 CBAPI 主域名；耗时较长的生图任务优先使用流式端点。'
          ),
          heading('Streaming request', '流式请求', 3, 'gemini-stream'),
          paragraph(
            'This example uses Nano Banana 2. Replace the model in the URL with gemini-3-pro-image to use Nano Banana Pro.',
            '以下示例使用 Nano Banana 2；把 URL 中的模型替换为 gemini-3-pro-image 即可使用 Nano Banana Pro。'
          ),
          code(
            `curl -N "${rootUrl}/v1beta/models/gemini-3.1-flash-image:streamGenerateContent?alt=sse" \\
  -H "x-goog-api-key: YOUR_APIPORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "Create a clean blue circle centered on a white background. No text."}]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"],
      "imageConfig": {"aspectRatio": "1:1", "imageSize": "1K"}
    }
  }'`,
            undefined,
            true
          ),
          heading('Response format', '响应格式', 3, 'gemini-response'),
          paragraph(
            'Each SSE data event is native Gemini JSON and may include text parts. Read image base64 from candidates[].content.parts[].inlineData.data and the MIME type from inlineData.mimeType. Stop after finishReason=STOP or when the connection closes; Gemini does not emit the GPT image_generation.completed event.',
            '每个 SSE data 事件都是 Gemini 原生 JSON，也可能包含文本 part。图片 base64 位于 candidates[].content.parts[].inlineData.data，MIME 类型位于 inlineData.mimeType；收到 finishReason=STOP 或连接关闭后结束，Gemini 不会出现 GPT 的 image_generation.completed 事件。'
          ),
        ],
      },
      {
        id: 'gemini-image-models',
        level: 3,
        title: text(
          'Models, resolution, and estimated price',
          '模型、分辨率与预估价格'
        ),
        blocks: [
          table(
            [
              ['Model', '模型'],
              ['Resolution', '分辨率'],
              ['Estimated price per image', '预估每张价格'],
            ],
            [
              [
                ['Nano Banana Pro', 'Nano Banana Pro'],
                ['1K / 2K', '1K / 2K'],
                ['US$0.06720', 'US$0.06720'],
              ],
              [
                ['Nano Banana Pro', 'Nano Banana Pro'],
                ['4K', '4K'],
                ['US$0.12000', 'US$0.12000'],
              ],
              [
                ['Nano Banana 2', 'Nano Banana 2'],
                ['0.5K', '0.5K'],
                ['US$0.02241', 'US$0.02241'],
              ],
              [
                ['Nano Banana 2', 'Nano Banana 2'],
                ['1K', '1K'],
                ['US$0.03360', 'US$0.03360'],
              ],
              [
                ['Nano Banana 2', 'Nano Banana 2'],
                ['2K', '2K'],
                ['US$0.05040', 'US$0.05040'],
              ],
              [
                ['Nano Banana 2', 'Nano Banana 2'],
                ['4K', '4K'],
                ['US$0.07560', 'US$0.07560'],
              ],
            ]
          ),
          paragraph(
            'Use uppercase K in imageSize. Prices are estimates per image; final usage is recorded in the usage log.',
            'imageSize 中的 K 必须大写。以上为单张图片预估价格，最终费用会记录在用量日志中。'
          ),
          plainNote(
            'Pass a standard CBAPI API key through x-goog-api-key. The key must include the Gemini image group and, when model restrictions are enabled, the selected Gemini image model.',
            '通过 x-goog-api-key 传入普通 CBAPI API Key。该密钥必须包含 Gemini 图片分组；启用模型限制时，还必须包含所选 Gemini 图片模型。',
            'warning'
          ),
        ],
      },
    ],
  }
}

function ccSwitchDocument(rootUrl: string, siteUrl: string): GuideDocument {
  return {
    lead: text(
      'Connect CC-Switch to CBAPI either by importing an API key directly or by creating a unified custom gateway manually.',
      '本指南介绍两种 CC-Switch 接入方式：从 API Keys 页面直接导入，或在 CC-Switch 中手动添加统一自定义网关。'
    ),
    toc: [
      {
        id: 'create-api-key',
        text: text('Step 1: Create an API key', '第一步：创建 API Key'),
      },
      {
        id: 'install-cc-switch',
        text: text('Step 2: Install CC-Switch', '第二步：下载安装 CC-Switch'),
      },
      {
        id: 'choose-cc-switch-method',
        text: text(
          'Step 3: Choose an integration method',
          '第三步：选择接入方式'
        ),
      },
      {
        id: 'cc-method-a',
        text: text('Method A: Import from CBAPI', '方式 A：从 CBAPI 直接导入'),
        depth: 2,
      },
      {
        id: 'cc-method-b',
        text: text(
          'Method B: Add a unified provider',
          '方式 B：手动添加统一供应商'
        ),
        depth: 2,
      },
    ],
    sections: [
      {
        id: 'create-api-key',
        title: text('Step 1: Create an API key', '第一步：创建 API Key'),
        blocks: [
          inlineLink(
            ['Sign in to CBAPI, open ', '登录 CBAPI，打开'],
            ['API Keys', '令牌 / API Keys'],
            [
              ', and create a non-default key with access to the models required by your application.',
              '页面，创建一个可以访问目标模型的非 default 分组 API Key。',
            ],
            '/keys'
          ),
        ],
      },
      {
        id: 'install-cc-switch',
        title: text(
          'Step 2: Download and install CC-Switch',
          '第二步：下载安装 CC-Switch'
        ),
        blocks: [
          inlineLink(
            ['Follow the ', '按照'],
            ['official CC-Switch installation guide', 'CC-Switch 官方安装说明'],
            [
              ' to install version 3.17.0 or later, then open the application at least once.',
              '下载并安装 3.17.0 或更高版本，然后至少打开一次应用。',
            ],
            'https://ccswitch.io/en/docs?section=getting-started',
            true
          ),
        ],
      },
      {
        id: 'choose-cc-switch-method',
        title: text(
          'Step 3: Choose an integration method',
          '第三步：选择接入方式'
        ),
        blocks: [
          heading(
            'Method A: import from CBAPI',
            '方式 A：从 CBAPI 直接导入',
            3,
            'cc-method-a'
          ),
          list(
            [
              [
                'Return to API Keys and locate the key you want to use.',
                '返回 API Keys 页面，找到需要使用的密钥。',
              ],
              [
                'Open its action menu and choose Import to CC Switch.',
                '打开该密钥的操作菜单，点击“导入到 CC Switch”。',
              ],
              [
                'Choose Claude Code or Codex and confirm the primary model.',
                '选择 Claude Code 或 Codex，然后确认主模型。',
              ],
              [
                'Open CC-Switch and approve the imported profile.',
                '打开 CC-Switch，并确认导入的配置。',
              ],
            ],
            true
          ),
          paragraph(
            'CBAPI fills the Base URL and API key automatically, enables usage lookup, and refreshes it every 30 minutes. The provider card shows the account wallet balance plus account-wide total and used quota, not an individual key limit. Import Claude Code and Codex separately when both are needed; re-import older profiles to add usage lookup.',
            'CBAPI 会自动填写正确的 Base URL 和 API Key，同时启用用量查询并每 30 分钟刷新。供应商卡片会显示当前账户的钱包余额，以及账户口径的总额度与已用额度，不显示单个 API Key 的额度上限。Claude Code 与 Codex 都需要配置时请分别导入；旧配置需重新导入后才能获得用量查询配置。'
          ),
          heading(
            'Method B: add a unified provider manually',
            '方式 B：手动添加统一供应商',
            3,
            'cc-method-b'
          ),
          list(
            [
              [
                'Click + in the upper-right corner of CC-Switch.',
                '点击 CC-Switch 主界面右上角的 +。',
              ],
              ['Choose Add unified provider.', '选择“添加统一供应商”。'],
              [
                'Choose Custom gateway as the preset type.',
                '在预设类型中选择“自定义网关”。',
              ],
            ],
            true
          ),
          paragraph('Fill in these values:', '填写以下内容：'),
          list([
            [`API address: ${rootUrl}`, `API 地址：${rootUrl}`],
            [
              'API key: paste the key created in Step 1',
              'API Key：粘贴第一步创建的 CBAPI API Key',
            ],
            [`Website: ${siteUrl}`, `官网地址：${siteUrl}`],
          ]),
          paragraph(
            'Select the applications that should use CBAPI under Enabled applications, then click Add.',
            '在“启用的应用”中勾选需要使用 CBAPI 的应用，然后点击“添加”。'
          ),
        ],
      },
    ],
  }
}

export function buildGuideDocument(
  slug: string,
  rootUrl: string,
  v1Url: string,
  siteUrl = rootUrl
): GuideDocument {
  switch (slug) {
    case 'codex':
      return codexDocument(v1Url, siteUrl)
    case 'claude-code':
      return claudeDocument(rootUrl, siteUrl)
    case 'opencode':
      return openCodeDocument(v1Url)
    case 'grok-build':
      return grokDocument(v1Url)
    case 'gemini-cli':
      return geminiDocument(rootUrl)
    case 'seedance':
      return seedanceDocument(v1Url)
    case 'images':
      return imagesDocument(rootUrl, v1Url)
    case 'cc-switch':
      return ccSwitchDocument(rootUrl, siteUrl)
    default:
      return { sections: [] }
  }
}
