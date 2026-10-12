$ErrorActionPreference = "Stop"

$DefaultCBAPIOrigin = if ($env:APIPORTER_DEFAULT_ORIGIN) { $env:APIPORTER_DEFAULT_ORIGIN } else { "__APIPORTER_ORIGIN__" }
if ($DefaultCBAPIOrigin.StartsWith("__APIPORTER_")) { $DefaultCBAPIOrigin = "http://localhost:5180" }
$Script:ApiBaseUrl = if ($env:APIPORTER_BASE_URL) { $env:APIPORTER_BASE_URL.TrimEnd("/") } else { $DefaultCBAPIOrigin }
$OpusModel = if ($env:APIPORTER_CLAUDE_OPUS_MODEL) { $env:APIPORTER_CLAUDE_OPUS_MODEL } else { "claude-opus-4-8" }
$SonnetModel = if ($env:APIPORTER_CLAUDE_SONNET_MODEL) { $env:APIPORTER_CLAUDE_SONNET_MODEL } else { "claude-sonnet-5" }
$ClaudeHomeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME ".claude" }
$SettingsFile = Join-Path $ClaudeHomeDir "settings.json"
$Utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
$Script:ApiKey = ""
$Script:ClaudeCommand = ""

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

function Ensure-Environment {
  if ($Script:ApiBaseUrl -notmatch "^https?://") {
    Die (Localized `
      "APIPORTER_BASE_URL 必须是 http(s) 地址。" `
      "APIPORTER_BASE_URL は http(s) URL である必要があります。" `
      "APIPORTER_BASE_URL must be an http(s) URL.")
  }
  $Script:ApiBaseUrl = $Script:ApiBaseUrl.TrimEnd("/")
}

function Resolve-ClaudeCommand {
  $command = Get-Command "claude.exe", "claude.cmd", "claude" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $command) {
    if ($command.Source) { return $command.Source }
    return $command.Name
  }

  $candidates = @(
    (Join-Path $HOME ".local\bin\claude.exe"),
    (Join-Path $HOME ".claude\local\claude.exe")
  )
  if ($env:LOCALAPPDATA) {
    $candidates += (Join-Path $env:LOCALAPPDATA "Programs\Claude\claude.exe")
  }
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
  }
  return ""
}

function Refresh-ClaudeCommand {
  $localBin = Join-Path $HOME ".local\bin"
  if (Test-Path -LiteralPath $localBin -PathType Container) {
    $env:Path = "$localBin;$env:Path"
  }
  $Script:ClaudeCommand = Resolve-ClaudeCommand
}

function Ensure-Claude {
  Refresh-ClaudeCommand
  if ($Script:ClaudeCommand) {
    $version = (& $Script:ClaudeCommand --version 2>$null)
    if (-not $version) { $version = "claude" }
    Say ((Localized "已检测到 Claude Code：{0}" "Claude Code を検出しました: {0}" "Detected Claude Code: {0}") -f $version)
    return
  }

  Say (Localized `
    "正在通过官方安装器安装 Claude Code…" `
    "公式インストーラーで Claude Code をインストールしています…" `
    "Installing Claude Code with the official installer…")
  try {
    $installer = Invoke-RestMethod -Uri "https://claude.ai/install.ps1" -ErrorAction Stop
    Invoke-Expression ([string]$installer)
  } catch {
    Die (Localized `
      "Claude Code 安装失败，请检查网络或按文档手动安装。" `
      "Claude Code のインストールに失敗しました。ネットワークを確認するか、手動手順を使用してください。" `
      "Claude Code installation failed. Check the network or use the manual instructions.")
  }

  Refresh-ClaudeCommand
  if (-not $Script:ClaudeCommand) {
    Die (Localized `
      "安装器已结束，但没有找到 claude 命令；请重新打开 PowerShell 后重试。" `
      "インストーラーは完了しましたが claude コマンドが見つかりません。PowerShell を開き直してください。" `
      "The installer finished, but the claude command was not found. Reopen PowerShell and try again.")
  }
}

function Backup-Settings {
  if (-not (Test-Path -LiteralPath $SettingsFile -PathType Leaf)) { return }
  $backup = "$SettingsFile.backup.$(Get-Date -Format yyyyMMddHHmmss).$PID"
  Copy-Item -LiteralPath $SettingsFile -Destination $backup -Force
  Say ((Localized "已备份现有配置：{0}" "既存設定をバックアップしました: {0}" "Backed up existing settings: {0}") -f $backup)
}

function Set-JsonProperty {
  param(
    [Parameter(Mandatory = $true)][object]$Object,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][AllowEmptyString()][object]$Value
  )
  $property = $Object.PSObject.Properties[$Name]
  if ($null -ne $property) {
    $property.Value = $Value
  } else {
    $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value
  }
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

function Write-ClaudeSettings {
  try {
    New-Item -ItemType Directory -Force $ClaudeHomeDir | Out-Null
  } catch {
    Die ((Localized "无法创建配置目录：{0}" "設定ディレクトリを作成できません: {0}" "Could not create configuration directory: {0}") -f $ClaudeHomeDir)
  }

  Backup-Settings
  $tempFile = "$SettingsFile.tmp.$PID"
  try {
    if (Test-Path -LiteralPath $SettingsFile -PathType Leaf) {
      $raw = [System.IO.File]::ReadAllText($SettingsFile)
      if ([string]::IsNullOrWhiteSpace($raw)) {
        $settings = [pscustomobject]@{}
      } else {
        $settings = $raw | ConvertFrom-Json -ErrorAction Stop
      }
    } else {
      $settings = [pscustomobject]@{}
    }

    if ($null -eq $settings -or $settings -isnot [pscustomobject]) {
      throw "settings root must be an object"
    }
    $envProperty = $settings.PSObject.Properties["env"]
    if ($null -eq $envProperty -or $null -eq $envProperty.Value) {
      $settingsEnvironment = [pscustomobject]@{}
      Set-JsonProperty -Object $settings -Name "env" -Value $settingsEnvironment
    } elseif ($envProperty.Value -is [pscustomobject]) {
      $settingsEnvironment = $envProperty.Value
    } else {
      throw "settings env must be an object"
    }

    Set-JsonProperty $settingsEnvironment "ANTHROPIC_BASE_URL" $Script:ApiBaseUrl
    Set-JsonProperty $settingsEnvironment "ANTHROPIC_AUTH_TOKEN" $Script:ApiKey
    Set-JsonProperty $settingsEnvironment "ANTHROPIC_MODEL" $OpusModel
    Set-JsonProperty $settingsEnvironment "ANTHROPIC_DEFAULT_OPUS_MODEL" $OpusModel
    Set-JsonProperty $settingsEnvironment "ANTHROPIC_DEFAULT_SONNET_MODEL" $SonnetModel
    Set-JsonProperty $settingsEnvironment "ANTHROPIC_DEFAULT_HAIKU_MODEL" $SonnetModel

    $json = $settings | ConvertTo-Json -Depth 100
    [System.IO.File]::WriteAllText($tempFile, "$json`n", $Utf8NoBom)
    Move-Item -LiteralPath $tempFile -Destination $SettingsFile -Force
  } catch {
    Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
    Die (Localized `
      "无法合并现有 settings.json；原文件没有被替换，请确认文件是有效 JSON。" `
      "settings.json を統合できません。元のファイルは置換されていません。有効な JSON か確認してください。" `
      "Existing settings.json could not be merged; the original was not replaced. Confirm that it contains valid JSON.")
  }
  Say ((Localized "已合并用户配置：{0}" "ユーザー設定を統合しました: {0}" "Merged user settings: {0}") -f $SettingsFile)
}

function Validate-ApiKey {
  $modelsUrl = "$($Script:ApiBaseUrl)/v1/models"
  try {
    $response = Invoke-RestMethod -Method Get -Uri $modelsUrl `
      -Headers @{ Authorization = "Bearer $($Script:ApiKey)" } `
      -TimeoutSec 30 -ErrorAction Stop
    $modelIds = @($response.data | ForEach-Object { [string]$_.id })
    if (($modelIds -contains $OpusModel) -and ($modelIds -contains $SonnetModel)) {
      Say ((Localized "API Key 验证通过，可访问：{0}、{1}" "API Key の検証に成功しました。利用可能: {0}, {1}" "API key validation passed; models available: {0}, {1}") -f $OpusModel, $SonnetModel)
    } else {
      Warn ((Localized "接口可访问，但模型列表中没有同时找到：{0}、{1}" "API は利用できますが、両方のモデルが見つかりません: {0}, {1}" "The API is reachable, but both models were not listed: {0}, {1}") -f $OpusModel, $SonnetModel)
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
  Say (Localized "CBAPI Claude Code 一键配置" "CBAPI Claude Code ワンクリック設定" "CBAPI Claude Code setup")
  Say (Localized `
    "脚本会按需安装 Claude Code、保留并合并旧配置，然后验证两个模型。" `
    "Claude Code を必要に応じて導入し、既存設定を保持・統合して 2 モデルを検証します。" `
    "This installs Claude Code when needed, preserves and merges existing settings, then validates both models.")
  Say ""

  Ensure-Claude
  Read-ApiKey
  Write-ClaudeSettings
  Validate-ApiKey

  Say ""
  Say (Localized "配置完成，脚本不会自动启动 Claude Code。" "設定が完了しました。Claude Code は自動起動しません。" "Setup complete. Claude Code was not started.")
  Say (Localized "进入你信任的项目目录后运行：" "信頼できるプロジェクトディレクトリで実行:" "Run this inside a trusted project directory:")
  Say "  claude"
} finally {
  $Script:ApiKey = ""
}
