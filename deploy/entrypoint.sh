#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE_DIR="${SOURCE_DIR:-/opt/apiporter-site/source}"
REPO_URL="${REPO_URL:-git@github.com:liuwanghao/apiporter-site.git}"
BRANCH="${BRANCH:-develop}"
SOURCE_LOCK_FILE="${SOURCE_LOCK_FILE:-/run/lock/apiporter-site-source.lock}"

log() { printf '[frontend-source] %s\n' "$*"; }
die() { printf '[frontend-source] ERROR: %s\n' "$*" >&2; exit 1; }
trap 'die "source update failed at line $LINENO"' ERR

[[ "$(id -u)" == 0 ]] || die "run as root"
command -v git >/dev/null || die "git is required"
command -v flock >/dev/null || die "flock is required"

mkdir -p "$(dirname "$SOURCE_DIR")"
exec 8>"$SOURCE_LOCK_FILE"
flock -n 8 || die "another source update is running"

if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  log "cloning $REPO_URL ($BRANCH)"
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$SOURCE_DIR"
else
  log "updating $BRANCH"
  git -C "$SOURCE_DIR" remote set-url origin "$REPO_URL"
  # The checkout may have been created with --single-branch, so the requested
  # branch is not necessarily available locally yet.
  git -C "$SOURCE_DIR" fetch --prune origin \
    "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
  if git -C "$SOURCE_DIR" show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git -C "$SOURCE_DIR" checkout "$BRANCH"
  else
    git -C "$SOURCE_DIR" checkout --no-track -b "$BRANCH" "origin/$BRANCH"
  fi
  git -C "$SOURCE_DIR" merge --ff-only "origin/$BRANCH"
fi

install -m 0755 "$SOURCE_DIR/deploy/entrypoint.sh" /usr/local/sbin/apiporter-site-deploy
exec env SOURCE_DIR="$SOURCE_DIR" "$SOURCE_DIR/deploy/deploy.sh"
