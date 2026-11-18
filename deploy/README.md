# Frontend deployment

The frontend is built as one static release. Nginx serves the active `dist`
directory and proxies same-origin API requests to the active backend color.

## Server paths

```text
/opt/apiporter-site/source       Git checkout
/opt/apiporter-site/releases     immutable static releases
/opt/apiporter-site/current      symlink to the active release
/opt/apiporter-site/backups      previous static release archives
/etc/apiporter/site.env          build-time API origin selection
```

## Command

```bash
sudo /opt/apiporter-site/source/deploy/install.sh
sudo apiporter-site-deploy
```

The entrypoint uses `git@github.com:liuwanghao/apiporter-site.git` and pulls
the branch selected by `BRANCH` (default: `master`),
installs locked dependencies, typechecks, builds, atomically switches the
`current` symlink, checks Nginx, and restores the old release automatically
when the health check fails.

To deploy another branch for testing:

```bash
sudo env BRANCH=ui/console-refresh apiporter-site-deploy
```

Keep production values in `/etc/apiporter/site.env`; do not commit them.

## Search indexing

Production deployment builds with `SEO_INDEXABLE=true`, then runs
`bun scripts/check-public-seo.ts` before activating the release. The check rejects
preview builds and public pages carrying `noindex`, and verifies that the app
shell and error page remain excluded from indexing.

For a local production build and the same validation:

```bash
SEO_INDEXABLE=true bun run build
bun scripts/check-public-seo.ts
```

Ordinary `bun run build` keeps the preview default. Isolated test environments
also retain their `X-Robots-Tag: noindex, nofollow` response header; do not reuse
that Nginx configuration for the public production hostname.

After deployment, check the public homepage, pricing and documentation URLs:
their HTML must allow indexing and their HTTP responses must not contain an
`X-Robots-Tag: noindex` header. If a CDN caches HTML, purge the affected pages.
In Google Search Console, use URL Inspection's live test, request indexing for
the affected public URLs, and start validation of the exclusion report. Login
and account pages are intentionally excluded and should not be submitted.

The Electron workflow builds the backend from the `main` branch of
`https://github.com/liuwanghao/apiporter-backend.git`.

The isolated SEO test deployment and rollback scripts require
`APIPORTER_TEST_HOST` to match the apiporter test server's hostname. They use
the fixed test release and backup paths declared in those scripts; prepare
those artifacts before running them on a test server.
