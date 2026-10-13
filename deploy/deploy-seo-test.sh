#!/usr/bin/env bash
set -euo pipefail
# Execute on the apiporter test host after uploading the isolated release and config.
test_host="${APIPORTER_TEST_HOST:?APIPORTER_TEST_HOST must name the apiporter test host}"
[ "$(hostname)" = "$test_host" ]
release=/opt/apiporter-site/releases/seo-20260915
backup=/opt/apiporter-site/seo-backup-20260915
[ -f "$release/dist/seo-manifest.json" ]
mkdir -p "$backup"
cp -an /etc/nginx/conf.d/apiporter.conf "$backup/apiporter.conf"
if [ ! -f "$backup/previous-release" ]; then readlink /opt/apiporter-site/current > "$backup/previous-release"; fi
cp "$release/deploy/nginx-seo-test.conf" /etc/nginx/conf.d/apiporter.conf
if ! nginx -t; then cp "$backup/apiporter.conf" /etc/nginx/conf.d/apiporter.conf; exit 1; fi
ln -s "$release" /opt/apiporter-site/current-seo-next
mv -Tf /opt/apiporter-site/current-seo-next /opt/apiporter-site/current
if ! systemctl reload nginx; then
  cp "$backup/apiporter.conf" /etc/nginx/conf.d/apiporter.conf
  ln -s "$(< "$backup/previous-release")" /opt/apiporter-site/current-seo-rollback
  mv -Tf /opt/apiporter-site/current-seo-rollback /opt/apiporter-site/current
  nginx -t && systemctl reload nginx
  exit 1
fi
curl -fsSI http://127.0.0.1/ | grep -i 'x-robots-tag: noindex'
