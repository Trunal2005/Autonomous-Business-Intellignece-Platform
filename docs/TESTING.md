# TESTING.md

## Approach
- Backend API contract tests via `fastapi.testclient` (auth, users, reports,
  admin, health, dashboard, ML, insights).
- ML unit tests use small synthetic DataFrames (no dataset/artifacts required).
- Frontend component tests via Vitest + Testing Library (jsdom).
- Browser E2E via Playwright against a real backend + Vite dev server.
- Backend tests always use disposable storage. The default run seeds a small
  synthetic warehouse; exact Olist checks require an explicit read-only snapshot.
- Run tests after changes; do not assume pass.

## Running
```powershell
# Backend (disposable synthetic database; no developer DB dependency)
cd backend
pip install -r requirements-dev.txt
python -m pytest -q

# Full Olist baseline checks (151 tests with local saved model artifacts).
# Only warehouse tables are copied; application users/uploads are excluded.
python -m pytest tests -q --reference-db sem5.db

# ML pipeline units (8 tests)
cd ml
pip install -r requirements-dev.txt
python -m pytest -q

# Frontend unit/component/API (42 tests), lint, build
cd frontend
npm install
npm test
npm run lint
npm run build

# Browser E2E (6 tests); install Chromium once
npm run e2e:install
npm run e2e

# If your app is already running, keep tests on separate ports:
$env:SEM5_E2E_BACKEND_PORT = '8001'
$env:SEM5_E2E_FRONTEND_PORT = '5174'
npm run e2e
```

## Backend suite (`backend/tests/`)
| File | Covers |
|---|---|
| test_health.py | `/health` |
| test_auth.py | login, `/me`, role enforcement (analyst BI 200 / admin 200 / anon 401) |
| test_refresh.py | refresh flow; access token rejected as refresh |
| test_users.py | `/me`, admin list, register (analyst/admin only), password change, role change + last-admin 409 |
| test_rbac.py | full permission matrix: business endpoints (both roles), admin endpoints (403 for analyst), 401 anonymous |
| test_reports.py | CSV exports; both roles; unknown report 404 |
| test_admin.py | system status + ETL status + warehouse/ML/settings; analyst 403; no secrets |
| test_dashboard.py | real KPIs + monthly series (skips if ETL not run) |
| test_analytics_dialect.py | dialect-aware month expression (SQLite/Postgres) |
| test_ml.py | `/api/ml/status` lists all features with valid statuses |
| test_insights.py | `/api/insights/query` answer; empty 422; `/status` |
| test_analytics.py | shared reference metric/filter reconciliation |
| test_datasets.py | 35 ingestion, ownership, switching, semantics, report, AI and real saved-model integration cases |
| test_dataset_regression.py | Olist baseline and filtered report/AI reconciliation |
| test_release_security.py | inactive login/access/refresh and last active Admin protections, isolated user database |
| test_password_limits.py | UTF-8 byte boundaries, request validation, existing bcrypt/login compatibility |
| test_filtered_metrics.py | first-ever customer scope and independent item/order/customer monetary assertions |
| test_upload_statistics.py | normal/missing/empty values, non-finite input and calculated overflow, JSON-safe metadata |
| test_ai_intents.py | grouped revenue, correct metric units, explicit unsupported numerical intents |
| test_test_isolation.py | disposable storage, cleanup, source users/roles/database preservation |

## ML suite (`ml/tests/`)
| File | Covers |
|---|---|
| test_pipeline.py | feature builders, `make_features` lags, `regression_metrics`, metadata schema/validation |

## Frontend suite (`frontend/tests/`)
| File | Covers |
|---|---|
| auth.test.ts | login stores tokens/user; invalid creds; logout clears; role helpers (`isAdmin`, `isAnalyst`, `isAdminOrAnalyst`); auth-required default; unknown roles ignored |
| RequireAuth.test.tsx | redirect to `/login`; passthrough when auth off |
| RequireAdmin.test.tsx | analyst gets `AccessRestricted`; admin passes; backend role re-checked against cached role; redirect to `/login` when anonymous |
| dataset-api.test.ts | dataset headers, stale user/dataset responses, concurrent reads, uploads and errors |
| DatasetResults.test.tsx | observed measures, unavailable and empty states |
| FilterBar.test.tsx | dataset-derived filters, URL reset and errors |
| Insights.test.tsx | out-of-order question/filter/dataset/session responses and answer invalidation |
| ml-contracts.test.ts | customer/anomaly inference, Not Applicable and HTTP error contracts; compile with `tsc --noEmit -p tsconfig.contracts.json` |

## E2E suite (`frontend/e2e/`)
| File | Covers |
|---|---|
| smoke.spec.ts | landing hero; login form; real `admin` sign-in → `/dashboard`; admin sees Administration + opens user management; real `analyst` sign-in → BI works, Administration hidden, direct `/admin/users` blocked in UI |
| datasets.spec.ts | real uploads, known sums, switching, filtered AI, ML applicability and downloaded CSV isolation |

Playwright starts both servers automatically (`frontend/playwright.config.ts`):
backend on :8000 through `tests/e2e_server.py` (a disposable SQLite backup)
and Vite dev on :5173. Both servers must be test-owned; an existing application
server is never reused. The optional port variables above also configure API
requests and cleanup, while test-only CORS permits the matching frontend origin.
The loaded reference and local saved model artifacts are
needed for the complete reference/model regression run. No training runs in tests.

The universal implementation baseline was **backend 95 passed**, **ML 8 passed**,
**frontend 28 passed**, **E2E 6 passed**, with lint/build passing. Four release
security regression cases extended the backend collection to 99. Targeted F1–F9
regressions now extend collection to 151 backend and 42 frontend tests. The default
synthetic run skips 15 exact-reference cases; use `tests --reference-db sem5.db`
for full reference verification. Rerun commands rather than treating historical
counts as proof. Temporary test databases are removed after the run; mutations
occur only there. The application database is never used as writable test storage.

## Notes
- Warehouse tests can skip without the reference. Saved-model integration cases
  require the ignored artifacts to be supplied locally; do not interpret a partial
  fresh-clone run as full verification. See SETUP.md for optional reference/model preparation.
- The E2E sign-in tests exercise the real seeded `admin`/`admin123` and
  `analyst`/`analyst123` users.
- Hiding navigation in the UI is UX only: `test_rbac.py` proves the backend
  returns 403 for every admin endpoint regardless of what the UI shows.
- The initial JS bundle is split (`vendor` / `charts` / `motion` + lazy routes),
  with a charts chunk of approximately 434 kB in the verified build.
