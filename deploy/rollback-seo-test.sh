#!/usr/bin/env bash
set -euo pipefail
# Restore the previous release on the apiporter test host.
test_host="${APIPORTER_TEST_HOST:?APIPORTER_TEST_HOST must name the apiporter test host}"
[ "$(hostname)" = "$test_host" ]
backup=/opt/apiporter-site/seo-backup-20260915
cp "$backup/apiporter.conf" /etc/nginx/conf.d/apiporter.conf
python3 - <<'PY'
from pathlib import Path
p = Path('/etc/nginx/conf.d/apiporter.conf')
s = p.read_text().replace('    client_max_body_size 100m;', '    client_max_body_size 100m;\n    add_header X-Robots-Tag "noindex, nofollow" always;')
p.write_text(s)
PY
nginx -t
ln -s "$(< "$backup/previous-release")" /opt/apiporter-site/current-seo-rollback
mv -Tf /opt/apiporter-site/current-seo-rollback /opt/apiporter-site/current
systemctl reload nginx
# The old routing configuration is restored with the test noindex guard retained.
