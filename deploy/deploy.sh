#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/opt/apiporter-site}"
SOURCE_DIR="${SOURCE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
LOCK_FILE="${LOCK_FILE:-/run/lock/apiporter-site-deploy.lock}"
PUBLIC_API_ORIGIN="${PUBLIC_API_ORIGIN:-}"
if [[ -z "$PUBLIC_API_ORIGIN" && -f /etc/apiporter/site.env ]]; then
  # shellcheck disable=SC1091
  source /etc/apiporter/site.env
fi
PUBLIC_API_ORIGIN="${PUBLIC_API_ORIGIN:-same-origin}"

log() { printf '[frontend] %s\n' "$*"; }
die() { printf '[frontend] ERROR: %s\n' "$*" >&2; exit 1; }
trap 'die "deployment failed at line $LINENO"' ERR

[[ "$(id -u)" == 0 ]] || die "run as root"
command -v git >/dev/null || die "git is required"
command -v tar >/dev/null || die "tar is required"
command -v bun >/dev/null || die "bun is required"

mkdir -p "$APP_ROOT"/{releases,backups}
exec 9>"$LOCK_FILE"
flock -n 9 || die "another frontend deployment is running"

timestamp="$(date -u +%Y%m%d%H%M%S)"
release="$APP_ROOT/releases/$timestamp"
mkdir -p "$release/src"
commit="$(git -C "$SOURCE_DIR" rev-parse HEAD)"
git -C "$SOURCE_DIR" archive --format=tar "$commit" | tar -xf - -C "$release/src"
cd "$release/src"
if [[ "$PUBLIC_API_ORIGIN" == "same-origin" ]]; then
  rm -f .env.production
else
  printf 'VITE_API_BASE_URL=%s\n' "$PUBLIC_API_ORIGIN" > .env.production
fi
log "installing dependencies for $commit"
bun install --frozen-lockfile
log "typechecking frontend"
bun run typecheck
log "building frontend"
bun run build
[[ -f dist/index.html ]] || die "frontend build did not create dist/index.html"
mv dist "$release/dist"
printf '%s\n' "$commit" > "$release/COMMIT"
cd "$APP_ROOT"
rm -rf "$release/src"

previous=""
if [[ -L "$APP_ROOT/current" ]]; then
  previous="$(readlink -f "$APP_ROOT/current")"
  tar -C "$previous" -czf "$APP_ROOT/backups/${timestamp}-previous.tar.gz" COMMIT dist
fi
ln -sfn "$release" "$APP_ROOT/current.next"
mv -Tf "$APP_ROOT/current.next" "$APP_ROOT/current"

if ! curl -fsS --max-time 5 http://127.0.0.1/ >/dev/null; then
  log "frontend health check failed; rolling back"
  if [[ -n "$previous" && -d "$previous" ]]; then
    ln -sfn "$previous" "$APP_ROOT/current.next"
    mv -Tf "$APP_ROOT/current.next" "$APP_ROOT/current"
  else
    rm -f "$APP_ROOT/current"
    die "no previous release available"
  fi
  die "new frontend release did not become healthy"
fi

mapfile -t releases < <(find "$APP_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -nr | tail -n +$((KEEP_RELEASES + 1)) | cut -d' ' -f2-)
for old in "${releases[@]}"; do rm -rf -- "$old"; done
mapfile -t backups < <(find "$APP_ROOT/backups" -mindepth 1 -maxdepth 1 -type f -printf '%T@ %p\n' | sort -nr | tail -n +$((KEEP_RELEASES + 1)) | cut -d' ' -f2-)
for old in "${backups[@]}"; do rm -f -- "$old"; done
log "deployed frontend $commit"
