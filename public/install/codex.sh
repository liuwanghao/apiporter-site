#!/bin/sh

set -u

DEFAULT_APIPORTER_ORIGIN="${APIPORTER_DEFAULT_ORIGIN:-__APIPORTER_ORIGIN__}"
case "$DEFAULT_APIPORTER_ORIGIN" in
  __APIPORTER_*) DEFAULT_APIPORTER_ORIGIN="http://localhost:5180" ;;
esac
APIPORTER_BASE_URL="${APIPORTER_BASE_URL:-$DEFAULT_APIPORTER_ORIGIN/v1}"
APIPORTER_MODEL="${APIPORTER_CODEX_MODEL:-gpt-5.6-sol}"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
CONFIG_FILE="$CODEX_HOME_DIR/config.toml"
AUTH_FILE="$CODEX_HOME_DIR/auth.json"
LOCAL_BIN_DIR="$HOME/.local/bin"
TTY_DEVICE="/dev/tty"
TTY_AVAILABLE=0
TTY_STATE=""
API_KEY_VALUE=""
VALIDATION_BODY=""
VALIDATION_HEADERS=""

if ( : <>"$TTY_DEVICE" ) 2>/dev/null && exec 3<>"$TTY_DEVICE"; then
  TTY_AVAILABLE=1
fi

normalize_language() {
  case "$1" in
    zh | zh-* | zh_* | ZH | ZH-* | ZH_*) printf '%s' 'zh' ;;
    ja | ja-* | ja_* | JA | JA-* | JA_*) printf '%s' 'ja' ;;
    en | en-* | en_* | EN | EN-* | EN_*) printf '%s' 'en' ;;
    *) printf '%s' '' ;;
  esac
}

default_language() {
  detected="$(normalize_language "${LC_ALL:-${LC_MESSAGES:-${LANG:-en}}}")"
  [ -n "$detected" ] && printf '%s' "$detected" || printf '%s' 'en'
}

select_language() {
  override="$(normalize_language "${APIPORTER_LANG:-}")"
  if [ -n "$override" ]; then
    printf '%s' "$override"
    return
  fi

  fallback="$(default_language)"
  [ "$TTY_AVAILABLE" -eq 1 ] || {
    printf '%s' "$fallback"
    return
  }

  case "$fallback" in
    zh) default_choice=1 ;;
    ja) default_choice=2 ;;
    *) default_choice=3 ;;
  esac

  printf '%s\n' '请选择安装语言 / インストール言語を選択 / Select installer language' >&3
  printf '%s\n' '  1) 简体中文' '  2) 日本語' '  3) English' >&3
  while :; do
    printf '请选择 1、2 或 3 / 1、2、3 / Choose 1, 2, or 3 [%s]: ' "$default_choice" >&3
    IFS= read -r choice <&3 || choice=""
    case "$choice" in
      '') printf '%s' "$fallback"; return ;;
      1 | zh | ZH | 中文 | 简体中文) printf '%s' 'zh'; return ;;
      2 | ja | JA | 日本語) printf '%s' 'ja'; return ;;
      3 | en | EN | English | english) printf '%s' 'en'; return ;;
      *) printf '%s\n' '请输入 1、2 或 3。/ 1、2、3 を入力してください。/ Please enter 1, 2, or 3.' >&3 ;;
    esac
  done
}

INSTALLER_LANGUAGE="$(select_language)"

text() {
  case "$INSTALLER_LANGUAGE" in
    zh) printf '%s' "$1" ;;
    ja) printf '%s' "$2" ;;
    *) printf '%s' "$3" ;;
  esac
}

say() {
  if [ "$TTY_AVAILABLE" -eq 1 ]; then
    printf '%s\n' "$*" >&3
  else
    printf '%s\n' "$*"
  fi
}

warn() {
  say "$(text '警告' '警告' 'WARNING'): $*"
}

die() {
  say "$(text '错误' 'エラー' 'ERROR'): $*"
  exit 1
}

cleanup() {
  if [ -n "$TTY_STATE" ] && [ "$TTY_AVAILABLE" -eq 1 ]; then
    stty "$TTY_STATE" <&3 2>/dev/null || true
  fi
  [ -z "$VALIDATION_BODY" ] || rm -f "$VALIDATION_BODY" 2>/dev/null || true
  [ -z "$VALIDATION_HEADERS" ] || rm -f "$VALIDATION_HEADERS" 2>/dev/null || true
  API_KEY_VALUE=""
}

trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

need_command() {
  command -v "$1" >/dev/null 2>&1
}

confirm() {
  prompt="$1"
  default_yes="${2:-1}"
  suffix='[Y/n]'
  [ "$default_yes" -eq 1 ] || suffix='[y/N]'
  say "$prompt $suffix"
  printf '> ' >&3
  IFS= read -r answer <&3 || answer=""
  case "$answer" in
    y | Y | yes | YES | Yes | 是 | 好 | 确认 | はい) return 0 ;;
    n | N | no | NO | No | 否 | 不 | いいえ) return 1 ;;
    '') [ "$default_yes" -eq 1 ] ;;
    *) [ "$default_yes" -eq 1 ] ;;
  esac
}

ensure_environment() {
  [ "$TTY_AVAILABLE" -eq 1 ] || die "$(text \
    '当前终端不支持交互输入。请先下载脚本，再运行 sh codex.sh。' \
    'この端末では対話入力を利用できません。スクリプトを保存して sh codex.sh を実行してください。' \
    'Interactive input is unavailable. Download the script, then run sh codex.sh.')"

  if [ "$(id -u)" -eq 0 ] && [ "${APIPORTER_ALLOW_ROOT:-0}" != "1" ]; then
    die "$(text \
      '当前以 root 运行。普通电脑请不要使用 sudo；VPS、容器环境请在命令中加入 APIPORTER_ALLOW_ROOT=1。' \
      'root で実行中です。通常の PC では sudo を使わず、VPS やコンテナでは APIPORTER_ALLOW_ROOT=1 を指定してください。' \
      'This installer is running as root. Do not use sudo on a personal computer; set APIPORTER_ALLOW_ROOT=1 on a VPS or container.')"
  fi

  case "$APIPORTER_BASE_URL" in
    http://* | https://*) ;;
    *) die "$(text 'APIPORTER_BASE_URL 必须是 http(s) 地址。' 'APIPORTER_BASE_URL は http(s) URL である必要があります。' 'APIPORTER_BASE_URL must be an http(s) URL.')" ;;
  esac
  APIPORTER_BASE_URL="${APIPORTER_BASE_URL%/}"
  export APIPORTER_BASE_URL
}

find_codex() {
  if need_command codex; then
    command -v codex
    return 0
  fi
  for candidate in "$LOCAL_BIN_DIR/codex" /usr/local/bin/codex; do
    if [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

append_path() {
  rc_file="$1"
  [ -n "$rc_file" ] || return 0
  [ -f "$rc_file" ] || : >"$rc_file" 2>/dev/null || return 0
  if grep -F '$HOME/.local/bin' "$rc_file" >/dev/null 2>&1; then
    return 0
  fi
  {
    printf '\n# CBAPI CLI installer PATH\n'
    printf 'export PATH="$HOME/.local/bin:$PATH"\n'
  } >>"$rc_file" 2>/dev/null || return 0
  say "$(text '已更新命令路径：' 'コマンドパスを更新しました: ' 'Updated command path: ')$rc_file"
}

persist_path() {
  case "$(basename "${SHELL:-}")" in
    zsh) append_path "$HOME/.zshrc"; append_path "$HOME/.profile" ;;
    bash) append_path "$HOME/.bashrc"; append_path "$HOME/.profile" ;;
    *) append_path "$HOME/.profile" ;;
  esac

  if [ "$(id -u)" -eq 0 ] && [ -x "$LOCAL_BIN_DIR/codex" ] && [ -w /usr/local/bin ]; then
    ln -sf "$LOCAL_BIN_DIR/codex" /usr/local/bin/codex 2>/dev/null || true
  fi
}

install_with_official_installer() {
  need_command curl || return 1
  say "$(text '正在通过官方安装器安装或更新 Codex CLI…' '公式インストーラーで Codex CLI をインストールまたは更新しています…' 'Installing or updating Codex CLI with the official installer…')"
  if curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh; then
    PATH="$LOCAL_BIN_DIR:$PATH"
    export PATH
    find_codex >/dev/null 2>&1 && {
      persist_path
      return 0
    }
  fi
  return 1
}

install_with_npm() {
  need_command node && need_command npm || return 1
  say "$(text '正在使用 npm 安装 Codex CLI…' 'npm で Codex CLI をインストールしています…' 'Installing Codex CLI with npm…')"
  if npm install -g @openai/codex@latest; then
    persist_path
    return 0
  fi
  if need_command sudo && [ "$(id -u)" -ne 0 ]; then
    warn "$(text \
      'npm 全局目录需要管理员权限；接下来可能要求输入系统密码。' \
      'npm のグローバルディレクトリには管理者権限が必要です。' \
      'The npm global directory requires administrator access.')"
    sudo npm install -g @openai/codex@latest && {
      persist_path
      return 0
    }
  fi
  return 1
}

ensure_codex() {
  PATH="$LOCAL_BIN_DIR:$PATH"
  export PATH
  codex_command="$(find_codex 2>/dev/null || true)"
  if [ -n "$codex_command" ]; then
    version="$($codex_command --version 2>/dev/null || true)"
    say "$(text '已检测到 Codex CLI：' 'Codex CLI を検出しました: ' 'Detected Codex CLI: ')${version:-codex}"
    if confirm "$(text '是否更新到最新版 Codex CLI？' 'Codex CLI を最新版に更新しますか？' 'Update Codex CLI to the latest version?')" 1; then
      install_with_official_installer || install_with_npm || die "$(text \
        'Codex CLI 更新失败，请检查网络后重试。' \
        'Codex CLI の更新に失敗しました。ネットワークを確認してください。' \
        'Codex CLI could not be updated. Check the network and try again.')"
    fi
    return
  fi

  if confirm "$(text '未检测到 Codex CLI，是否现在安装？' 'Codex CLI が見つかりません。今すぐインストールしますか？' 'Codex CLI was not found. Install it now?')" 1; then
    install_with_official_installer || install_with_npm || die "$(text \
      'Codex CLI 安装失败。请先安装 Node.js LTS，或按文档手动安装。' \
      'Codex CLI のインストールに失敗しました。Node.js LTS を導入するか、手動手順を使用してください。' \
      'Codex CLI installation failed. Install Node.js LTS or use the manual instructions.')"
  else
    warn "$(text '已跳过 CLI 安装，将只写入配置。' 'CLI のインストールをスキップし、設定のみを書き込みます。' 'CLI installation was skipped; only configuration will be written.')"
  fi
}

backup_file() {
  target="$1"
  [ -f "$target" ] || return 0
  backup="$target.backup.$(date +%Y%m%d%H%M%S).$$"
  cp -p "$target" "$backup" || die "$(text '无法备份：' 'バックアップできません: ' 'Could not back up: ')$target"
  chmod 600 "$backup" 2>/dev/null || true
  say "$(text '已备份：' 'バックアップしました: ' 'Backed up: ')$backup"
}

read_api_key() {
  say "$(text \
    '请粘贴 CBAPI API Key（输入不会显示），然后按 Enter：' \
    'CBAPI API Key を貼り付けて Enter を押してください（入力は表示されません）:' \
    'Paste your CBAPI API key (input is hidden), then press Enter:')"
  printf '> ' >&3
  TTY_STATE="$(stty -g <&3 2>/dev/null || true)"
  [ -z "$TTY_STATE" ] || stty -echo <&3
  IFS= read -r API_KEY_VALUE <&3 || API_KEY_VALUE=""
  [ -z "$TTY_STATE" ] || stty "$TTY_STATE" <&3
  TTY_STATE=""
  printf '\n' >&3
  [ -n "$API_KEY_VALUE" ] || die "$(text 'API Key 不能为空。' 'API Key は空にできません。' 'API key cannot be empty.')"
  say "$(text '已收到 API Key。' 'API Key を受け取りました。' 'API key received.')"
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

toml_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

write_files() {
  mkdir -p "$CODEX_HOME_DIR" || die "$(text '无法创建目录：' 'ディレクトリを作成できません: ' 'Could not create directory: ')$CODEX_HOME_DIR"
  backup_file "$CONFIG_FILE"
  backup_file "$AUTH_FILE"
  umask 077

  auth_tmp="$(mktemp "$CODEX_HOME_DIR/auth.json.tmp.XXXXXX" 2>/dev/null || printf '%s' "$CODEX_HOME_DIR/auth.json.tmp.$$")"
  config_tmp="$(mktemp "$CODEX_HOME_DIR/config.toml.tmp.XXXXXX" 2>/dev/null || printf '%s' "$CODEX_HOME_DIR/config.toml.tmp.$$")"
  escaped_key="$(json_escape "$API_KEY_VALUE")"
  escaped_url="$(toml_escape "$APIPORTER_BASE_URL")"

  if ! printf '{\n  "auth_mode": "apikey",\n  "OPENAI_API_KEY": "%s"\n}\n' "$escaped_key" >"$auth_tmp"; then
    rm -f "$auth_tmp" "$config_tmp" 2>/dev/null || true
    die "$(text '无法写入 Codex 认证文件。' 'Codex 認証ファイルを書き込めません。' 'Could not write the Codex authentication file.')"
  fi

  if ! {
    printf '%s\n' \
      'cli_auth_credentials_store = "file"' \
      'model_provider = "apiporter"' \
      "model = \"$APIPORTER_MODEL\"" \
      'model_reasoning_effort = "xhigh"' \
      'disable_response_storage = true' \
      'model_supports_reasoning_summaries = true' \
      '' \
      '[model_providers.apiporter]' \
      'name = "CBAPI"' \
      "base_url = \"$escaped_url\"" \
      'wire_api = "responses"' \
      'requires_openai_auth = true' >"$config_tmp"
  }; then
    rm -f "$auth_tmp" "$config_tmp" 2>/dev/null || true
    die "$(text '无法写入 Codex 配置文件。' 'Codex 設定ファイルを書き込めません。' 'Could not write the Codex configuration file.')"
  fi

  chmod 600 "$auth_tmp" "$config_tmp" 2>/dev/null || true
  mv "$auth_tmp" "$AUTH_FILE" || die "$(text '无法替换认证文件。' '認証ファイルを置換できません。' 'Could not replace the authentication file.')"
  mv "$config_tmp" "$CONFIG_FILE" || die "$(text '无法替换配置文件。' '設定ファイルを置換できません。' 'Could not replace the configuration file.')"
  chmod 600 "$AUTH_FILE" "$CONFIG_FILE" 2>/dev/null || true
}

validate_key() {
  need_command curl || {
    warn "$(text '未找到 curl，已跳过在线验证。' 'curl がないためオンライン検証をスキップしました。' 'curl was not found; online validation was skipped.')"
    return
  }

  VALIDATION_BODY="$(mktemp 2>/dev/null || printf '%s' "$CODEX_HOME_DIR/apiporter-models.$$")"
  VALIDATION_HEADERS="$(mktemp 2>/dev/null || printf '%s' "$CODEX_HOME_DIR/apiporter-headers.$$")"
  chmod 600 "$VALIDATION_BODY" "$VALIDATION_HEADERS" 2>/dev/null || true
  printf 'Authorization: Bearer %s\n' "$API_KEY_VALUE" >"$VALIDATION_HEADERS" || return
  status="$(curl -sS -o "$VALIDATION_BODY" -w '%{http_code}' -H "@$VALIDATION_HEADERS" "$APIPORTER_BASE_URL/models" 2>/dev/null || true)"
  [ -n "$status" ] || status=000

  case "$status" in
    200)
      if grep -F "$APIPORTER_MODEL" "$VALIDATION_BODY" >/dev/null 2>&1; then
        say "$(text 'API Key 验证通过，可访问模型：' 'API Key の検証に成功しました。利用可能なモデル: ' 'API key validation passed; model available: ')$APIPORTER_MODEL"
      else
        warn "$(text '接口可访问，但模型列表中未找到：' 'API は利用できますが、モデルが見つかりません: ' 'The API is reachable, but the model was not listed: ')$APIPORTER_MODEL"
      fi
      ;;
    401 | 403) warn "$(text 'API Key 验证失败，HTTP ' 'API Key の検証に失敗しました。HTTP ' 'API key validation failed with HTTP ')$status" ;;
    000) warn "$(text '暂时无法连接 CBAPI，配置已保留并跳过在线验证。' 'CBAPI に接続できないため、設定を保持して検証をスキップしました。' 'CBAPI could not be reached; configuration was kept and validation was skipped.')" ;;
    *) warn "$(text '在线验证返回 HTTP ' 'オンライン検証の HTTP ステータス: ' 'Online validation returned HTTP ')$status" ;;
  esac
}

main() {
  ensure_environment
  say "$(text 'CBAPI Codex 一键配置' 'CBAPI Codex ワンクリック設定' 'CBAPI Codex setup')"
  say "$(text '脚本会安装或更新 Codex，备份旧配置，并验证 API Key。' 'Codex の導入・更新、設定のバックアップ、API Key の検証を行います。' 'This installs or updates Codex, backs up existing settings, and validates the API key.')"
  say ''

  ensure_codex
  read_api_key
  write_files
  validate_key
  API_KEY_VALUE=""

  say ''
  say "$(text '配置完成。' '設定が完了しました。' 'Setup complete.')"
  say "$(text '配置文件：' '設定ファイル: ' 'Configuration file: ')$CONFIG_FILE"
  say "$(text '认证文件：' '認証ファイル: ' 'Authentication file: ')$AUTH_FILE"
  say "$(text '进入项目目录后运行：' 'プロジェクトディレクトリで実行: ' 'Run this inside your project directory:')"
  say "  codex --model $APIPORTER_MODEL"
}

main "$@"
