#!/usr/bin/env bash
set -euo pipefail
# Execute on cbapi-test only, after uploading the isolated release and config.
[ "$(hostname)" = C20260914726127 ]
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
