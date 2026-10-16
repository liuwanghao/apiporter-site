# New API Frontend

This repository contains the React dashboard for New API. The Go API gateway
and its database, relay, authentication, and billing services live in the
separate `apiporter-backend` repository.

## Development

```bash
bun install
bun run dev
```

The development server proxies `/api`, `/v1`, `/mj`, and `/pg` to
`http://localhost:3000` by default. Set `VITE_API_BASE_URL` in `.env` when the
backend runs elsewhere. The frontend development server listens on
`http://localhost:5180`. `VITE_REACT_APP_SERVER_URL` remains supported as a
legacy alias.

## Production

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run build
```

Set `VITE_API_BASE_URL` at build time when the site and API use different
origins. For cookie-based dashboard authentication, the recommended deployment
is a same-origin reverse proxy from the site host to the backend API. The
backend accepts `FRONTEND_BASE_URL` to redirect browser page routes it does not
serve. For a cross-origin deployment, also configure the backend's
`CORS_ALLOWED_ORIGINS` and `SESSION_COOKIE_TRUSTED_URL` with the exact frontend
HTTPS origin. The refresh cookie uses `SameSite=Strict`, so the frontend and
API must still be same-site (for example, HTTPS subdomains of one parent
domain); use a same-origin reverse proxy when they are on unrelated domains.

To expose operator-managed SEO values in the initial HTML response seen by
search engines, run the optional SEO server in front of `dist/`:

```bash
SEO_BACKEND_URL=https://api.example.com SEO_PORT=8080 bun run serve:seo
```

Point the public site reverse proxy at port `8080`. The server fetches the
public `/api/status` configuration for public page requests and injects the
title, description, keywords, canonical URL, Open Graph, and Twitter tags.
When the backend is unavailable, it falls back to the build-time defaults.

## Official Alipay payments

Open **Billing & Payment → Alipay Official** at
`/system-settings/billing/alipay-official`. This page configures direct Alipay
Website Payment in RSA2 public-key mode, independently of the Epay gateway.
Use an approved Alipay application with Website Payment enabled, its App ID,
merchant PID, application private key and Alipay public key. The server does
not return the private key; leaving its field blank preserves the saved key.

Set the public HTTPS origin used for payment notifications. Wallet and
subscription notification URLs are generated from this origin and must be
reachable by Alipay. The CNY price converts each USD of wallet balance or a
subscription plan's USD price into the amount collected. Existing wallet
group ratios and preset discounts apply to wallet top-ups only. The payment
compliance confirmation on the Payment Gateway page remains required.

Enabling official Alipay makes it the wallet and subscription payment option.
Sandbox mode is available only to root administrators and records test credits
or subscriptions in their own account. Orders retain their original merchant
and Alipay public-key snapshot so pending payments can settle after settings
change. Only verified asynchronous notifications grant credits or subscriptions;
the browser return page does not settle an order.

## Electron desktop app

The `electron/` wrapper belongs to this frontend repository. Its production
build bundles `dist/` and starts a backend binary built from the sibling
`apiporter-backend` repository. Run `electron/build.sh` from this repository;
set `BACKEND_DIR` when the backend checkout is elsewhere.

## Project layout

```text
src/routes/      TanStack Router route definitions
src/features/    Feature modules and API calls
src/components/  Shared UI components
src/stores/      Zustand client state
src/lib/         API client, auth, caching, and utilities
src/i18n/        i18next locale resources
```
