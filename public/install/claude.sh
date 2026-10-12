#!/bin/sh

set -u

DEFAULT_APIPORTER_ORIGIN="${APIPORTER_DEFAULT_ORIGIN:-__APIPORTER_ORIGIN__}"
case "$DEFAULT_APIPORTER_ORIGIN" in
  __APIPORTER_*) DEFAULT_APIPORTER_ORIGIN="http://localhost:5180" ;;
esac
APIPORTER_BASE_URL="${APIPORTER_BASE_URL:-$DEFAULT_APIPORTER_ORIGIN}"
OPUS_MODEL="${APIPORTER_CLAUDE_OPUS_MODEL:-claude-opus-4-8}"
SONNET_MODEL="${APIPORTER_CLAUDE_SONNET_MODEL:-claude-sonnet-5}"
CLAUDE_HOME_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SETTINGS_FILE="$CLAUDE_HOME_DIR/settings.json"
LOCAL_BIN_DIR="$HOME/.local/bin"
TTY_DEVICE="/dev/tty"
TTY_AVAILABLE=0
TTY_STATE=""
API_KEY_VALUE=""
INSTALLER_TEMP=""
SETTINGS_TEMP=""
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
  [ -z "$INSTALLER_TEMP" ] || rm -f "$INSTALLER_TEMP" 2>/dev/null || true
  [ -z "$SETTINGS_TEMP" ] || rm -f "$SETTINGS_TEMP" 2>/dev/null || true
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

ensure_environment() {
  [ "$TTY_AVAILABLE" -eq 1 ] || die "$(text \
    '当前终端不支持交互输入。请先下载脚本，再运行 sh claude.sh。' \
    'この端末では対話入力を利用できません。スクリプトを保存して sh claude.sh を実行してください。' \
    'Interactive input is unavailable. Download the script, then run sh claude.sh.')"
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

find_claude() {
  if need_command claude; then
    command -v claude
    return 0
  fi
  for candidate in "$LOCAL_BIN_DIR/claude" "$HOME/.claude/local/claude" /usr/local/bin/claude; do
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
}

ensure_claude() {
  PATH="$LOCAL_BIN_DIR:$PATH"
  export PATH
  claude_command="$(find_claude 2>/dev/null || true)"
  if [ -n "$claude_command" ]; then
    version="$($claude_command --version 2>/dev/null || true)"
    say "$(text '已检测到 Claude Code：' 'Claude Code を検出しました: ' 'Detected Claude Code: ')${version:-claude}"
    return
  fi

  need_command curl || die "$(text '未找到 curl，无法下载安装器。' 'curl がないためインストーラーを取得できません。' 'curl was not found, so the installer cannot be downloaded.')"
  need_command bash || die "$(text '未找到 bash，无法运行官方安装器。' 'bash がないため公式インストーラーを実行できません。' 'bash was not found, so the official installer cannot run.')"

  say "$(text '正在通过官方安装器安装 Claude Code…' '公式インストーラーで Claude Code をインストールしています…' 'Installing Claude Code with the official installer…')"
  INSTALLER_TEMP="$(mktemp 2>/dev/null || printf '%s' "$CLAUDE_HOME_DIR/claude-install.$$")"
  curl -fsSL https://claude.ai/install.sh -o "$INSTALLER_TEMP" || die "$(text \
    '下载安装器失败，请检查网络后重试。' \
    'インストーラーを取得できません。ネットワークを確認してください。' \
    'The installer could not be downloaded. Check the network and try again.')"
  bash "$INSTALLER_TEMP" || die "$(text \
    'Claude Code 安装失败，请按文档手动安装。' \
    'Claude Code のインストールに失敗しました。手動手順を使用してください。' \
    'Claude Code installation failed. Use the manual instructions.')"
  rm -f "$INSTALLER_TEMP" 2>/dev/null || true
  INSTALLER_TEMP=""

  PATH="$LOCAL_BIN_DIR:$PATH"
  export PATH
  claude_command="$(find_claude 2>/dev/null || true)"
  [ -n "$claude_command" ] || die "$(text \
    '安装器已结束，但没有找到 claude 命令；请重新打开终端后重试。' \
    'インストーラーは完了しましたが claude コマンドが見つかりません。端末を開き直してください。' \
    'The installer finished, but the claude command was not found. Reopen the terminal and try again.')"
  persist_path
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

backup_settings() {
  [ -f "$SETTINGS_FILE" ] || return 0
  backup="$SETTINGS_FILE.backup.$(date +%Y%m%d%H%M%S).$$"
  cp -p "$SETTINGS_FILE" "$backup" || die "$(text '无法备份现有配置：' '既存設定をバックアップできません: ' 'Could not back up existing settings: ')$SETTINGS_FILE"
  chmod 600 "$backup" 2>/dev/null || true
  say "$(text '已备份现有配置：' '既存設定をバックアップしました: ' 'Backed up existing settings: ')$backup"
}

merge_with_python() {
  APIPORTER_SETTINGS_SOURCE="$SETTINGS_FILE" \
  APIPORTER_SETTINGS_TARGET="$SETTINGS_TEMP" \
  APIPORTER_KEY_VALUE="$API_KEY_VALUE" \
  APIPORTER_URL_VALUE="$APIPORTER_BASE_URL" \
  APIPORTER_OPUS_VALUE="$OPUS_MODEL" \
  APIPORTER_SONNET_VALUE="$SONNET_MODEL" \
    python3 - <<'PY'
import json
import os
import sys

source = os.environ["APIPORTER_SETTINGS_SOURCE"]
target = os.environ["APIPORTER_SETTINGS_TARGET"]
try:
    if os.path.exists(source) and os.path.getsize(source):
        with open(source, encoding="utf-8-sig") as handle:
            settings = json.load(handle)
    else:
        settings = {}
    if not isinstance(settings, dict):
        raise ValueError("settings root must be an object")
    environment = settings.setdefault("env", {})
    if not isinstance(environment, dict):
        raise ValueError("settings env must be an object")
    environment.update({
        "ANTHROPIC_BASE_URL": os.environ["APIPORTER_URL_VALUE"],
        "ANTHROPIC_AUTH_TOKEN": os.environ["APIPORTER_KEY_VALUE"],
        "ANTHROPIC_MODEL": os.environ["APIPORTER_OPUS_VALUE"],
        "ANTHROPIC_DEFAULT_OPUS_MODEL": os.environ["APIPORTER_OPUS_VALUE"],
        "ANTHROPIC_DEFAULT_SONNET_MODEL": os.environ["APIPORTER_SONNET_VALUE"],
        "ANTHROPIC_DEFAULT_HAIKU_MODEL": os.environ["APIPORTER_SONNET_VALUE"],
    })
    with open(target, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(settings, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
except Exception:
    sys.exit(1)
PY
}

merge_with_node() {
  APIPORTER_SETTINGS_SOURCE="$SETTINGS_FILE" \
  APIPORTER_SETTINGS_TARGET="$SETTINGS_TEMP" \
  APIPORTER_KEY_VALUE="$API_KEY_VALUE" \
  APIPORTER_URL_VALUE="$APIPORTER_BASE_URL" \
  APIPORTER_OPUS_VALUE="$OPUS_MODEL" \
  APIPORTER_SONNET_VALUE="$SONNET_MODEL" \
    node <<'NODE'
const fs = require('fs')

try {
  const source = process.env.APIPORTER_SETTINGS_SOURCE
  const target = process.env.APIPORTER_SETTINGS_TARGET
  const raw = fs.existsSync(source) ? fs.readFileSync(source, 'utf8').replace(/^\uFEFF/, '') : ''
  const settings = raw.trim() ? JSON.parse(raw) : {}
  if (!settings || Array.isArray(settings) || typeof settings !== 'object') throw new Error('invalid root')
  if (settings.env == null) settings.env = {}
  if (Array.isArray(settings.env) || typeof settings.env !== 'object') throw new Error('invalid env')
  Object.assign(settings.env, {
    ANTHROPIC_BASE_URL: process.env.APIPORTER_URL_VALUE,
    ANTHROPIC_AUTH_TOKEN: process.env.APIPORTER_KEY_VALUE,
    ANTHROPIC_MODEL: process.env.APIPORTER_OPUS_VALUE,
    ANTHROPIC_DEFAULT_OPUS_MODEL: process.env.APIPORTER_OPUS_VALUE,
    ANTHROPIC_DEFAULT_SONNET_MODEL: process.env.APIPORTER_SONNET_VALUE,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: process.env.APIPORTER_SONNET_VALUE,
  })
  fs.writeFileSync(target, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 })
} catch {
  process.exit(1)
}
NODE
}

merge_with_perl() {
  APIPORTER_SETTINGS_SOURCE="$SETTINGS_FILE" \
  APIPORTER_SETTINGS_TARGET="$SETTINGS_TEMP" \
  APIPORTER_KEY_VALUE="$API_KEY_VALUE" \
  APIPORTER_URL_VALUE="$APIPORTER_BASE_URL" \
  APIPORTER_OPUS_VALUE="$OPUS_MODEL" \
  APIPORTER_SONNET_VALUE="$SONNET_MODEL" \
    perl -MJSON::PP <<'PERL'
use strict;
use warnings;

eval {
  my $settings = {};
  my $source = $ENV{APIPORTER_SETTINGS_SOURCE};
  if (-e $source && -s $source) {
    open my $input, '<:encoding(UTF-8)', $source or die;
    local $/;
    my $raw = <$input>;
    close $input;
    $raw =~ s/^\x{FEFF}//;
    $settings = JSON::PP->new->utf8(0)->decode($raw);
  }
  die unless ref($settings) eq 'HASH';
  $settings->{env} = {} unless exists $settings->{env};
  die unless ref($settings->{env}) eq 'HASH';
  $settings->{env}->{ANTHROPIC_BASE_URL} = $ENV{APIPORTER_URL_VALUE};
  $settings->{env}->{ANTHROPIC_AUTH_TOKEN} = $ENV{APIPORTER_KEY_VALUE};
  $settings->{env}->{ANTHROPIC_MODEL} = $ENV{APIPORTER_OPUS_VALUE};
  $settings->{env}->{ANTHROPIC_DEFAULT_OPUS_MODEL} = $ENV{APIPORTER_OPUS_VALUE};
  $settings->{env}->{ANTHROPIC_DEFAULT_SONNET_MODEL} = $ENV{APIPORTER_SONNET_VALUE};
  $settings->{env}->{ANTHROPIC_DEFAULT_HAIKU_MODEL} = $ENV{APIPORTER_SONNET_VALUE};
  open my $output, '>:encoding(UTF-8)', $ENV{APIPORTER_SETTINGS_TARGET} or die;
  print {$output} JSON::PP->new->utf8(0)->pretty(1)->canonical(1)->encode($settings);
  close $output;
};
exit($@ ? 1 : 0);
PERL
}

write_settings() {
  mkdir -p "$CLAUDE_HOME_DIR" || die "$(text '无法创建配置目录：' '設定ディレクトリを作成できません: ' 'Could not create configuration directory: ')$CLAUDE_HOME_DIR"
  backup_settings
  umask 077
  SETTINGS_TEMP="$(mktemp "$CLAUDE_HOME_DIR/settings.json.tmp.XXXXXX" 2>/dev/null || printf '%s' "$CLAUDE_HOME_DIR/settings.json.tmp.$$")"

  if need_command python3; then
    merge_with_python || die "$(text '无法合并现有 settings.json；原文件没有被替换。' 'settings.json を統合できません。元のファイルは置換されていません。' 'Existing settings.json could not be merged; the original file was not replaced.')"
  elif need_command node; then
    merge_with_node || die "$(text '无法合并现有 settings.json；原文件没有被替换。' 'settings.json を統合できません。元のファイルは置換されていません。' 'Existing settings.json could not be merged; the original file was not replaced.')"
  elif need_command perl && perl -MJSON::PP -e 1 >/dev/null 2>&1; then
    merge_with_perl || die "$(text '无法合并现有 settings.json；原文件没有被替换。' 'settings.json を統合できません。元のファイルは置換されていません。' 'Existing settings.json could not be merged; the original file was not replaced.')"
  else
    die "$(text \
      '系统缺少可用的 JSON 工具（python3、node 或 perl），请使用文档中的手动方式。' \
      'JSON ツール（python3、node、perl）がありません。手動手順を使用してください。' \
      'No supported JSON tool was found (python3, node, or perl). Use the manual instructions.')"
  fi

  chmod 600 "$SETTINGS_TEMP" 2>/dev/null || true
  mv "$SETTINGS_TEMP" "$SETTINGS_FILE" || die "$(text '无法替换 settings.json。' 'settings.json を置換できません。' 'Could not replace settings.json.')"
  SETTINGS_TEMP=""
  chmod 600 "$SETTINGS_FILE" 2>/dev/null || true
  say "$(text '已合并用户配置：' 'ユーザー設定を統合しました: ' 'Merged user settings: ')$SETTINGS_FILE"
}

validate_key() {
  need_command curl || {
    warn "$(text '未找到 curl，已跳过在线验证。' 'curl がないためオンライン検証をスキップしました。' 'curl was not found; online validation was skipped.')"
    return
  }
  VALIDATION_BODY="$(mktemp 2>/dev/null || printf '%s' "$CLAUDE_HOME_DIR/apiporter-models.$$")"
  VALIDATION_HEADERS="$(mktemp 2>/dev/null || printf '%s' "$CLAUDE_HOME_DIR/apiporter-headers.$$")"
  chmod 600 "$VALIDATION_BODY" "$VALIDATION_HEADERS" 2>/dev/null || true
  printf 'Authorization: Bearer %s\n' "$API_KEY_VALUE" >"$VALIDATION_HEADERS" || return
  status="$(curl -sS -o "$VALIDATION_BODY" -w '%{http_code}' -H "@$VALIDATION_HEADERS" "$APIPORTER_BASE_URL/v1/models" 2>/dev/null || true)"
  [ -n "$status" ] || status=000

  case "$status" in
    200)
      if grep -F "$OPUS_MODEL" "$VALIDATION_BODY" >/dev/null 2>&1 && grep -F "$SONNET_MODEL" "$VALIDATION_BODY" >/dev/null 2>&1; then
        say "$(text 'API Key 验证通过，可访问：' 'API Key の検証に成功しました。利用可能: ' 'API key validation passed; models available: ')$OPUS_MODEL, $SONNET_MODEL"
      else
        warn "$(text '接口可访问，但模型列表中没有同时找到：' 'API は利用できますが、両方のモデルが見つかりません: ' 'The API is reachable, but both models were not listed: ')$OPUS_MODEL, $SONNET_MODEL"
      fi
      ;;
    401 | 403) warn "$(text 'API Key 验证失败，HTTP ' 'API Key の検証に失敗しました。HTTP ' 'API key validation failed with HTTP ')$status" ;;
    000) warn "$(text '暂时无法连接 CBAPI，配置已保留并跳过在线验证。' 'CBAPI に接続できないため、設定を保持して検証をスキップしました。' 'CBAPI could not be reached; configuration was kept and validation was skipped.')" ;;
    *) warn "$(text '在线验证返回 HTTP ' 'オンライン検証の HTTP ステータス: ' 'Online validation returned HTTP ')$status" ;;
  esac
}

main() {
  ensure_environment
  say "$(text 'CBAPI Claude Code 一键配置' 'CBAPI Claude Code ワンクリック設定' 'CBAPI Claude Code setup')"
  say "$(text '脚本会按需安装 Claude Code、保留并合并旧配置，然后验证两个模型。' 'Claude Code を必要に応じて導入し、既存設定を保持・統合して 2 モデルを検証します。' 'This installs Claude Code when needed, preserves and merges existing settings, then validates both models.')"
  say ''

  ensure_claude
  read_api_key
  write_settings
  validate_key
  API_KEY_VALUE=""

  say ''
  say "$(text '配置完成，脚本不会自动启动 Claude Code。' '設定が完了しました。Claude Code は自動起動しません。' 'Setup complete. Claude Code was not started.')"
  say "$(text '进入你信任的项目目录后运行：' '信頼できるプロジェクトディレクトリで実行: ' 'Run this inside a trusted project directory:')"
  say '  claude'
}

main "$@"
