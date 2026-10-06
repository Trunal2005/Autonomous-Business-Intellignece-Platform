## Status
- Local checkout location is machine-specific; run commands from the repository root.
- Remote: https://github.com/KshitijK21/Sem-5.git
- Checklist: see docs/CHECKLIST.md

## Warehouse (done)
- Real Olist ETL loaded into the star schema; verified KPIs in docs/KPIs.md.
- Dashboard + Analytics pages wired to real KPI/chart APIs.

## ML (done, parallel track)
- 5 features trained/evaluated on real data; metrics in docs/ML_BASELINES.md.
- Backend serves models via /api/ml (status, forecast, segments, anomalies, predict/sales).
- Frontend `/ml/metrics`, `/ml/revenue-forecast`, `/ml/product-segmentation`:
  offline metric cards and compatible selected-data forecast/segment views.
  All six artifacts retain API inference endpoints; sales prediction uses manual checkout inputs.

## Auth / RBAC (done)
- Two roles only: **admin** + **analyst** (no viewer). Matrix: docs/RBAC.md.
- JWT login with access + refresh tokens, bcrypt-hashed users persisted in the
  `app_user` table, router-level role deps (`require_bi_user` for business
  routers, `require_admin` for `/api/admin`), `AUTH_REQUIRED` default true.
- Single role source of truth (`VALID_ROLES`/`ROLE_RANK` in
  `app/services/users.py`); legacy `viewer` rows migrate to `analyst`.
- Last-active-admin protection (409) on role/status changes; invalid roles rejected.
- User management API (profile/password/role), admin user list.
- Frontend login page, protected routes, `RequireAdmin` + `AccessDenied`,
  auth-aware API client with automatic token refresh on 401; BI vs
  Administration navigation split.

## AI Insights (done)
- Provider-agnostic LLM (Ollama preferred) with deterministic data-grounded fallback.
- Role-scoped controlled context; /insights page with examples and sources.

## Reporting & Admin (done)
- CSV export API (`/api/reports/export`) for KPIs, monthly revenue, revenue by
  category, orders by status; permission-aware.
- Admin API (system status, ETL status, warehouse status, ML status, settings)
  + administration frontend section (`/admin/users`, `/admin/health`,
  `/admin/roles`, `/admin/data`, `/admin/warehouse`, `/admin/ml`, `/admin/settings`).
- Shared URL filters across analytics, reports, ML and assistant. Private uploaded
  datasets use registry/ownership/selection, detected semantics and capabilities;
  the Olist adapter remains a read-only shared reference. See UNIVERSAL_DATASETS.md.

## Quality / tooling (done)
- Dialect-aware warehouse SQL (`month_expr`) with a Postgres migration guide
  (`docs/POSTGRES.md`).
- LLM provider status endpoint (`GET /api/insights/status`).
- ESLint (flat config) enforcing `npm run lint`.
- Route-level code-splitting + vendor/charts/motion chunks (no >500 kB chunk).

## Tests (done)
- Universal baseline: backend 95 passing; four release security regressions bring
  the current collection to 99. Coverage includes auth/refresh, users, RBAC,
  datasets, saved-model inference, analytics, reports, AI and Olist reconciliation.
- ML: 8 passing (feature builders, metrics, metadata).
- Frontend: 28 passing (auth guards, dataset API/results/filters); lint clean;
  build green.
- E2E: 6 passing (landing/login, real admin/analyst access, upload/switch/filter/AI/export flow). E2E surfaced and
  fixed a nested-`<Router>` runtime bug.

## Next
- None required. Optional future work: CI workflow, Docker Compose for
  one-command startup, live Ollama integration test.
