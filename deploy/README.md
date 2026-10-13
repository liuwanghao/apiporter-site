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
the branch selected by `BRANCH` (default: `develop`),
installs locked dependencies, typechecks, builds, atomically switches the
`current` symlink, checks Nginx, and restores the old release automatically
when the health check fails.

To deploy another branch for testing:

```bash
sudo env BRANCH=ui/console-refresh apiporter-site-deploy
```

Keep production values in `/etc/apiporter/site.env`; do not commit them.

The Electron workflow builds the backend from the `main` branch of
`https://github.com/liuwanghao/apiporter-backend.git`.

The isolated SEO test deployment and rollback scripts require
`APIPORTER_TEST_HOST` to match the apiporter test server's hostname. They use
the fixed test release and backup paths declared in those scripts; prepare
those artifacts before running them on a test server.
