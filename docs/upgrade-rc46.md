# APIPorter frontend: New API v1.0.0-rc.46

Upstream source: `7d8b91268dab69d7150f345c448b5e250163146a`, official `web/` tree.
Previous local frontend: `ea20182bc51880e1de9ef54606ad99ffbdd8f902`.
Integration reuses the verified common changes from the sibling product while
retaining APIPorter Git history and local product behavior.

APIPorter public pages, navigation, blue brand/theme, support/legal documents,
SEO, simplified Chinese, promotion/commission, error centre and independent API
origin are retained. Model plaza original-price comparisons still use the local
6.5 multiplier; this is display only and does not change billing. Official Alipay
configuration, quotations and payments remain available, preferred over Epay
Alipay when configured; subscriptions retain the domestic payment filtering.

Security, scoped management access tokens, audit logs, task plugins, request
policies and upgraded management editors use the existing product components.
Logs use official NDJSON export and official CSV conversion; the old paginated
export request is removed. Export honours configured API origin and rejects
truncated responses. Authentication uses rc.46 login challenges and single-use
proofs while retaining local referral precedence (`ref` before `aff`). Old profile
security controls are replaced by the Security & Access page.

Deploy with the matching backend. Live payment callbacks and browser visual
acceptance remain release validation items. No deployment is part of this change.

## Verification

The integration owner verified 16 focused files (94 cases) covering independent
Alipay settings/quote/checkout/failure boundaries, subscription gateway selection,
domestic CNY recharge, branding/cache, public legal pages, Chinese-only startup,
6.5 original-price comparisons with unchanged group prices, task pricing,
shared status caching and official export with independent API origin.
Typecheck, repository lint, protected-header formatting and production build
passed. Repository-wide regression batches are recorded by the upgrade report.
