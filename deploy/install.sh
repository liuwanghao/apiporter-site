#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" == 0 ]] || { echo '[frontend-install] ERROR: run as root' >&2; exit 1; }
command -v bun >/dev/null || { echo '[frontend-install] ERROR: bun is required' >&2; exit 1; }

install -d -o root -g root -m 0755 /opt/apiporter-site /etc/apiporter
if [[ ! -f /etc/apiporter/site.env ]]; then
  umask 077
  printf 'PUBLIC_API_ORIGIN=same-origin\n' > /etc/apiporter/site.env
fi
chmod 0600 /etc/apiporter/site.env
chown root:root /etc/apiporter/site.env
install -m 0755 "$DEPLOY_DIR/entrypoint.sh" /usr/local/sbin/apiporter-site-deploy
printf '[frontend-install] installed apiporter-site-deploy\n'
