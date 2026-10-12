$ErrorActionPreference = "Stop"

$DefaultCBAPIOrigin = if ($env:APIPORTER_DEFAULT_ORIGIN) { $env:APIPORTER_DEFAULT_ORIGIN } else { "__APIPORTER_ORIGIN__" }
if ($DefaultCBAPIOrigin.StartsWith("__APIPORTER_")) { $DefaultCBAPIOrigin = "http://localhost:5180" }
$Script:ApiBaseUrl = if ($env:APIPORTER_BASE_URL) { $env:APIPORTER_BASE_URL.TrimEnd("/") } else { "$DefaultCBAPIOrigin/v1" }
$CBAPIModel = if ($env:APIPORTER_CODEX_MODEL) { $env:APIPORTER_CODEX_MODEL } else { "gpt-5.6-sol" }
$CodexHomeDir = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$ConfigFile = Join-Path $CodexHomeDir "config.toml"
$AuthFile = Join-Path $CodexHomeDir "auth.json"
$Utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
$Script:ApiKey = ""
$Script:CodexCommand = ""
$Script:NodeCommand = ""
$Script:NpmCommand = ""

function Normalize-Language {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return "" }
  $normalized = $Value.Trim().Replace("_", "-").ToLowerInvariant()
  if ($normalized -match "^zh($|-)") { return "zh" }
  if ($normalized -match "^ja($|-)") { return "ja" }
  if ($normalized -match "^en($|-)") { return "en" }
  return ""
}

function Get-DefaultLanguage {
  $language = Normalize-Language $PSUICulture
  if ($language) { return $language }
  return "en"
}

function Select-Language {
  $override = Normalize-Language $env:APIPORTER_LANG
  if ($override) { return $override }

  $defaultLanguage = Get-DefaultLanguage
  $defaultChoice = switch ($defaultLanguage) {
    "zh" { "1" }
    "ja" { "2" }
    default { "3" }
  }

  Write-Host "请选择安装语言 / インストール言語を選択 / Select installer language"
  Write-Host "  1) 简体中文"
  Write-Host "  2) 日本語"
  Write-Host "  3) English"
  while ($true) {
    $choice = Read-Host "请选择 1、2 或 3 / 1、2、3 / Choose 1, 2, or 3 [$defaultChoice]"
    switch -Regex ($choice.Trim()) {
      "^$" { return $defaultLanguage }
      "^(1|zh|中文|简体中文)$" { return "zh" }
      "^(2|ja|日本語)$" { return "ja" }
      "^(3|en|english)$" { return "en" }
      default { Write-Host "请输入 1、2 或 3。/ 1、2、3 を入力してください。/ Please enter 1, 2, or 3." }
    }
  }
}

$Script:InstallerLanguage = Select-Language

function Localized {
  param(
    [string]$Zh,
    [string]$Ja,
    [string]$En
  )
  switch ($Script:InstallerLanguage) {
    "zh" { return $Zh }
    "ja" { return $Ja }
    default { return $En }
  }
}

function Say {
  param([string]$Message)
  Write-Host $Message
}

function Warn {
  param([string]$Message)
  Write-Warning $Message
}

function Die {
  param([string]$Message)
  Write-Error $Message
  exit 1
}

function Confirm-Action {
  param(
    [string]$Prompt,
    [bool]$DefaultYes = $true
  )
  $suffix = if ($DefaultYes) { "[Y/n]" } else { "[y/N]" }
  $answer = Read-Host "$Prompt $suffix"
  switch -Regex ($answer.Trim()) {
    "^(y|yes|是|好|确认|はい)$" { return $true }
    "^(n|no|否|不|いいえ)$" { return $false }
    "^$" { return $DefaultYes }
    default { return $DefaultYes }
  }
}

function Ensure-Environment {
  if ($Script:ApiBaseUrl -notmatch "^https?://") {
    Die (Localized `
      "APIPORTER_BASE_URL 必须是 http(s) 地址。" `
      "APIPORTER_BASE_URL は http(s) URL である必要があります。" `
      "APIPORTER_BASE_URL must be an http(s) URL.")
  }
  $Script:ApiBaseUrl = $Script:ApiBaseUrl.TrimEnd("/")
}

function Resolve-CommandPath {
  param([string[]]$Names)
  foreach ($name in $Names) {
    $command = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $command) {
      if ($command.Source) { return $command.Source }
      return $command.Name
    }
  }
  return ""
}

function Refresh-Commands {
  $localBin = Join-Path $HOME ".local\bin"
  if (Test-Path -LiteralPath $localBin -PathType Container) {
    $env:Path = "$localBin;$env:Path"
  }
  $Script:CodexCommand = Resolve-CommandPath @("codex.cmd", "codex.exe", "codex")
  $Script:NodeCommand = Resolve-CommandPath @("node.exe", "node")
  $Script:NpmCommand = Resolve-CommandPath @("npm.cmd", "npm.exe", "npm")
}

function Install-CodexOfficial {
  Say (Localized `
    "正在通过官方安装器安装或更新 Codex CLI…" `
    "公式インストーラーで Codex CLI をインストールまたは更新しています…" `
    "Installing or updating Codex CLI with the official installer…")
  $previousNonInteractive = $env:CODEX_NON_INTERACTIVE
  try {
    $env:CODEX_NON_INTERACTIVE = "1"
    $installer = Invoke-RestMethod -Uri "https://chatgpt.com/codex/install.ps1" -ErrorAction Stop
    Invoke-Expression ([string]$installer)
    Refresh-Commands
    return -not [string]::IsNullOrWhiteSpace($Script:CodexCommand)
  } catch {
    Warn (Localized `
      "官方安装器不可用，将尝试 npm。" `
      "公式インストーラーを利用できないため npm を試します。" `
      "The official installer is unavailable; npm will be tried.")
    return $false
  } finally {
    if ($null -eq $previousNonInteractive) {
      Remove-Item Env:CODEX_NON_INTERACTIVE -ErrorAction SilentlyContinue
    } else {
      $env:CODEX_NON_INTERACTIVE = $previousNonInteractive
    }
  }
}

function Install-CodexNpm {
  Refresh-Commands
  if (-not $Script:NodeCommand -or -not $Script:NpmCommand) {
    Warn (Localized `
      "未检测到 Node.js/npm。" `
      "Node.js/npm が見つかりません。" `
      "Node.js/npm was not found.")
    return $false
  }
  Say (Localized `
    "正在使用 npm 安装 Codex CLI…" `
    "npm で Codex CLI をインストールしています…" `
    "Installing Codex CLI with npm…")
  & $Script:NpmCommand install -g "@openai/codex@latest"
  Refresh-Commands
  return ($LASTEXITCODE -eq 0) -and $Script:CodexCommand
}

function Ensure-Codex {
  Refresh-Commands
  if ($Script:CodexCommand) {
    $version = (& $Script:CodexCommand --version 2>$null)
    if (-not $version) { $version = "codex" }
    Say ((Localized "已检测到 Codex CLI：{0}" "Codex CLI を検出しました: {0}" "Detected Codex CLI: {0}") -f $version)
    $updatePrompt = Localized "是否更新到最新版 Codex CLI？" "Codex CLI を最新版に更新しますか？" "Update Codex CLI to the latest version?"
    if (Confirm-Action $updatePrompt $true) {
      if (-not ((Install-CodexOfficial) -or (Install-CodexNpm))) {
        Die (Localized `
          "Codex CLI 更新失败，请检查网络后重试。" `
          "Codex CLI の更新に失敗しました。ネットワークを確認してください。" `
          "Codex CLI could not be updated. Check the network and try again.")
      }
    }
    return
  }

  $installPrompt = Localized "未检测到 Codex CLI，是否现在安装？" "Codex CLI が見つかりません。今すぐインストールしますか？" "Codex CLI was not found. Install it now?"
  if (Confirm-Action $installPrompt $true) {
    if (-not ((Install-CodexOfficial) -or (Install-CodexNpm))) {
      Die (Localized `
        "Codex CLI 安装失败。请安装 Node.js LTS，或按文档手动安装。" `
        "Codex CLI のインストールに失敗しました。Node.js LTS を導入するか、手動手順を使用してください。" `
        "Codex CLI installation failed. Install Node.js LTS or use the manual instructions.")
    }
  } else {
    Warn (Localized `
      "已跳过 CLI 安装，将只写入配置。" `
      "CLI のインストールをスキップし、設定のみを書き込みます。" `
      "CLI installation was skipped; only configuration will be written.")
  }
}

function Backup-File {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return }
  $backup = "$Path.backup.$(Get-Date -Format yyyyMMddHHmmss).$PID"
  Copy-Item -LiteralPath $Path -Destination $backup -Force
  Say ((Localized "已备份：{0}" "バックアップしました: {0}" "Backed up: {0}") -f $backup)
}

function Read-ApiKey {
  $prompt = Localized `
    "请粘贴 CBAPI API Key（输入不会显示）" `
    "CBAPI API Key を貼り付けてください（入力は表示されません）" `
    "Paste your CBAPI API key (input is hidden)"
  $secureKey = Read-Host $prompt -AsSecureString
  $key = [System.Net.NetworkCredential]::new("", $secureKey).Password
  if ([string]::IsNullOrWhiteSpace($key)) {
    Die (Localized "API Key 不能为空。" "API Key は空にできません。" "API key cannot be empty.")
  }
  $Script:ApiKey = $key.Trim()
  $key = $null
  $secureKey = $null
  Say (Localized "已收到 API Key。" "API Key を受け取りました。" "API key received.")
}

function Write-CodexFiles {
  New-Item -ItemType Directory -Force $CodexHomeDir | Out-Null
  Backup-File $ConfigFile
  Backup-File $AuthFile

  $authTemp = "$AuthFile.tmp.$PID"
  $configTemp = "$ConfigFile.tmp.$PID"
  try {
    $authJson = @{
      auth_mode = "apikey"
      OPENAI_API_KEY = $Script:ApiKey
    } | ConvertTo-Json -Depth 2
    [System.IO.File]::WriteAllText($authTemp, "$authJson`n", $Utf8NoBom)

    $escapedUrl = $Script:ApiBaseUrl.Replace("\", "\\").Replace('"', '\"')
    $configToml = @"
cli_auth_credentials_store = "file"
model_provider = "apiporter"
model = "$CBAPIModel"
model_reasoning_effort = "xhigh"
disable_response_storage = true
model_supports_reasoning_summaries = true

[model_providers.apiporter]
name = "CBAPI"
base_url = "$escapedUrl"
wire_api = "responses"
requires_openai_auth = true
"@
    [System.IO.File]::WriteAllText($configTemp, "$configToml`n", $Utf8NoBom)
    Move-Item -LiteralPath $authTemp -Destination $AuthFile -Force
    Move-Item -LiteralPath $configTemp -Destination $ConfigFile -Force
  } catch {
    Remove-Item -LiteralPath $authTemp, $configTemp -Force -ErrorAction SilentlyContinue
    Die (Localized `
      "无法写入 Codex 配置，原文件没有被替换。" `
      "Codex 設定を書き込めません。元のファイルは置換されていません。" `
      "Codex configuration could not be written; the original files were not replaced.")
  }
}

function Validate-ApiKey {
  $modelsUrl = "$($Script:ApiBaseUrl)/models"
  try {
    $response = Invoke-WebRequest -Uri $modelsUrl `
      -Headers @{ Authorization = "Bearer $($Script:ApiKey)" } `
      -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    if ($response.StatusCode -eq 200 -and $response.Content -like "*$CBAPIModel*") {
      Say ((Localized "API Key 验证通过，可访问模型：{0}" "API Key の検証に成功しました。利用可能なモデル: {0}" "API key validation passed; model available: {0}") -f $CBAPIModel)
    } else {
      Warn ((Localized "接口可访问，但模型列表中未找到：{0}" "API は利用できますが、モデルが見つかりません: {0}" "The API is reachable, but the model was not listed: {0}") -f $CBAPIModel)
    }
  } catch {
    $statusCode = 0
    if ($null -ne $_.Exception.Response -and $null -ne $_.Exception.Response.StatusCode) {
      try { $statusCode = [int]$_.Exception.Response.StatusCode } catch { $statusCode = 0 }
    }
    if (($statusCode -eq 401) -or ($statusCode -eq 403)) {
      Warn ((Localized "API Key 验证失败，HTTP {0}" "API Key の検証に失敗しました。HTTP {0}" "API key validation failed with HTTP {0}") -f $statusCode)
    } elseif ($statusCode -gt 0) {
      Warn ((Localized "在线验证返回 HTTP {0}" "オンライン検証の HTTP ステータス: {0}" "Online validation returned HTTP {0}") -f $statusCode)
    } else {
      Warn (Localized `
        "暂时无法连接 CBAPI，配置已保留并跳过在线验证。" `
        "CBAPI に接続できないため、設定を保持して検証をスキップしました。" `
        "CBAPI could not be reached; configuration was kept and validation was skipped.")
    }
  }
}

try {
  Ensure-Environment
  Say (Localized "CBAPI Codex 一键配置" "CBAPI Codex ワンクリック設定" "CBAPI Codex setup")
  Say (Localized `
    "脚本会安装或更新 Codex，备份旧配置，并验证 API Key。" `
    "Codex の導入・更新、設定のバックアップ、API Key の検証を行います。" `
    "This installs or updates Codex, backs up existing settings, and validates the API key.")
  Say ""

  Ensure-Codex
  Read-ApiKey
  Write-CodexFiles
  Validate-ApiKey

  Say ""
  Say (Localized "配置完成。" "設定が完了しました。" "Setup complete.")
  Say ((Localized "配置文件：{0}" "設定ファイル: {0}" "Configuration file: {0}") -f $ConfigFile)
  Say ((Localized "认证文件：{0}" "認証ファイル: {0}" "Authentication file: {0}") -f $AuthFile)
  Say (Localized "进入项目目录后运行：" "プロジェクトディレクトリで実行:" "Run this inside your project directory:")
  Say "  codex --model $CBAPIModel"
} finally {
  $Script:ApiKey = ""
}
