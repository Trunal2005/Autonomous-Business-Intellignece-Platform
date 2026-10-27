# Vercel preparation verification - October 27, 2026

## A. Implementation summary

Implemented current Services routing, production same-origin API defaults, explicit PostgreSQL/TLS configuration, safe operator bootstrap, bounded synchronous hosted imports, report-response budgets and trusted model-bundle packaging. Existing local large-upload functionality and earlier warehouse/profit-card work are retained. No model retraining, original-data migration or academic-document edit was performed.

## B. Files included in this release

Pre-existing local work is identified separately below. API service changes extend the earlier SQL-panel API additions rather than replacing them.

- `.env.example` - deployment implementation, documentation or regression verification
- `.gitignore` - deployment implementation, documentation or regression verification
- `README.md` - deployment implementation, documentation or regression verification
- `backend/app/api/routes/admin.py` - contains preserved pre-existing work
- `backend/app/api/routes/datasets.py` - deployment implementation, documentation or regression verification
- `backend/app/api/routes/reports.py` - deployment implementation, documentation or regression verification
- `backend/app/core/config.py` - deployment implementation, documentation or regression verification
- `backend/app/database/session.py` - deployment implementation, documentation or regression verification
- `backend/app/main.py` - deployment implementation, documentation or regression verification
- `backend/app/services/bundle_jobs.py` - deployment implementation, documentation or regression verification
- `backend/app/services/datasets.py` - deployment implementation, documentation or regression verification
- `backend/app/services/etl.py` - deployment implementation, documentation or regression verification
- `backend/app/services/ml.py` - deployment implementation, documentation or regression verification
- `backend/app/services/users.py` - deployment implementation, documentation or regression verification
- `backend/requirements.txt` - deployment implementation, documentation or regression verification
- `docs/POSTGRES.md` - deployment implementation, documentation or regression verification
- `frontend/playwright.config.ts` - deployment implementation, documentation or regression verification
- `frontend/src/components/BundleUpload.tsx` - deployment implementation, documentation or regression verification
- `frontend/src/components/DatasetResults.tsx` - contains preserved pre-existing work
- `frontend/src/pages/Dashboard.tsx` - contains preserved pre-existing work
- `frontend/src/pages/Datasets.tsx` - deployment implementation, documentation or regression verification
- `frontend/src/pages/admin/AdminWarehouse.tsx` - contains preserved pre-existing work
- `frontend/src/services/api.ts` - contains preserved pre-existing work
- `frontend/src/services/auth.ts` - deployment implementation, documentation or regression verification
- `frontend/tests/DatasetResults.test.tsx` - deployment implementation, documentation or regression verification
- `frontend/vite.config.ts` - deployment implementation, documentation or regression verification
- `.vercelignore` - deployment implementation, documentation or regression verification
- `backend/.python-version` - deployment implementation, documentation or regression verification
- `backend/app/services/initialize_production.py` - deployment implementation, documentation or regression verification
- `backend/app/services/warehouse_queries.py` - contains preserved pre-existing work
- `backend/build_vercel.py` - deployment implementation, documentation or regression verification
- `backend/constraints-vercel.txt` - deployment implementation, documentation or regression verification
- `backend/tests/production_ui_server.py` - deployment implementation, documentation or regression verification
- `backend/tests/test_admin_bundle_status.py` - contains preserved pre-existing work
- `backend/tests/test_deployment.py` - deployment implementation, documentation or regression verification
- `backend/tests/test_forecast_registry_identity.py` - contains preserved pre-existing work
- `backend/tests/test_hosted_upload.py` - deployment implementation, documentation or regression verification
- `backend/tests/test_warehouse_queries.py` - contains preserved pre-existing work
- `backend/vercel_entry.py` - deployment implementation, documentation or regression verification
- `docs/VERCEL_DEPLOYMENT.md` - deployment implementation, documentation or regression verification
- `frontend/deployment-e2e/production.spec.ts` - deployment implementation, documentation or regression verification
- `frontend/playwright.production.config.ts` - deployment implementation, documentation or regression verification
- `frontend/src/components/WarehouseQueryPanel.tsx` - contains preserved pre-existing work
- `frontend/src/services/base.ts` - deployment implementation, documentation or regression verification
- `frontend/tests/WarehouseQueryPanel.test.tsx` - contains preserved pre-existing work
- `frontend/tests/deployment.test.ts` - deployment implementation, documentation or regression verification
- `scripts/package_serving_models.py` - deployment implementation, documentation or regression verification
- `vercel.json` - deployment implementation, documentation or regression verification
- `docs/VERCEL_VERIFICATION.md` - this verification record

## C. Deployment architecture

One domain routes API/health/documentation requests to the FastAPI service and other paths to the Vite service. Static files precede frontend SPA fallback. ML loads six separately supplied checksum-verified artifacts; no ML training service is exposed. Durable data belongs in externally provisioned PostgreSQL. Local Ollama remains local-only.

## D. Verification results

| Check | Total | Passed | Failed | Skipped / blocked |
|---|---:|---:|---:|---|
| Baseline backend | 410 | 395 | 0 | 15 existing optional-reference skips |
| Baseline frontend | 115 | 113 | 2 | 0 |
| Final backend | 424 | 409 | 0 | 15 existing optional-reference skips |
| Final frontend | 117 | 117 | 0 | 0 |
| ML units (unchanged training code) | 28 | 28 | 0 | 0 |
| Free-only guarded subset (also included in backend suite) | 25 | 25 | 0 | 0 |
| Existing browser suite | 30 | 28 | 0 | 2 existing exact-private-archive cases without opt-in fixture |
| Built frontend / same-origin browser checks | 3 | 3 | 0 | 0 |
| ESLint / TypeScript / production Vite build | 3 commands | 3 | 0 | 0 |
| Official Vercel configuration schema | 1 | 1 | 0 | Upstream draft mismatch required disabling schema meta-validation, not config validation |
| Vercel CLI 65.4.0 local build | 1 | 0 | 0 | Authentication unavailable: CLI reported invalid token; no hosted build/deploy claimed |
| Actual PostgreSQL integration | Not run | - | - | No provisioned database; local Docker daemon unavailable |

Commands used:

```powershell
cd backend
python -m pytest -q -p no:cacheprovider --tb=short
python -m pytest tests/test_free_api_policy.py -q --free-only-network -p no:cacheprovider --tb=short
cd ../ml
python -m pytest -q -p no:cacheprovider --tb=short
cd ../frontend
node node_modules/vitest/vitest.mjs run --maxWorkers=2 --minWorkers=1
npm run lint
npm run build
node node_modules/typescript/bin/tsc -b
node node_modules/@playwright/test/cli.js test --workers=1
node node_modules/@playwright/test/cli.js test --config playwright.production.config.ts
```

Browser tests used separate ports and disposable synthetic databases. Existing tests referring to January 2018 needed a date-compatible fixture and the existing reviewed candidate-report path. The first misconfigured run returned 24 passed, 4 failed, 2 skipped; after supplying those prerequisites the unchanged assertions returned 28 passed, 2 skipped. No new skip or weakened assertion was introduced. The new same-origin harness required correcting its Windows path/SPA handling before all three checks passed.

The two baseline frontend failures were the stale expectation that deliberately removed profit cards still appear, and Blob.arrayBuffer compatibility in Word-download validation. The card test now verifies their required absence while retaining category/status checks. FileReader fallback preserves real document validation.

## E. Database and ML readiness

Production rejects SQLite, missing/weak signing configuration and disabled authentication. Catalog/admin initialization is additive and explicit; requests do not seed public development users. TLS and serverless connection options are tested; an actual remote PostgreSQL connection is not verified.

Six local serving artifacts were packaged without retraining, and round-trip hashes, actual loader/contracts and tamper rejection passed. Real existing-model inference was exercised through browser/API tests, including the built same-origin client. The private synthetic registry remains separate and cannot be copied to fresh cloud dataset identities. No cloud inference or annual-accuracy qualification is claimed.

Linux CPython 3.13 wheel availability was checked including uvicorn's Linux-only uvloop dependency. The conservative 58-wheel expanded total is 404.23 MiB, excluding generated bytecode and Vercel assembly overhead. Existing direct version pins are unchanged; transitive constraints capture that resolution. The final deployed bundle remains unverified.

Hosted file payloads are capped at 3 MiB combined, expanded inputs at 16 MiB, 50,000 rows/500,000 cells overall and cooperative 60-second import processing. Hosted imports finish in-request and persist in PostgreSQL. Local 200 MiB folder/ZIP workflow is retained. Reports/CSV above 4 MiB are rejected with narrower-scope guidance. No large cloud-ingestion worker/object-store workflow is fabricated.

## F. GitHub status

Target repository: https://github.com/Trunal2005/Autonomous-Business-Intellignece-Platform . The work began on `integrate/abi-ml-backend` at `3d348fc7576749e36685826656055c20861d9fab`; remote main and integration refs matched that base during review. The final response records the actual resulting commit and verified push. No force push, destructive checkout, reset, clean or branch switch is authorized or used.

## G. Vercel setup and H. Manual actions

Follow [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md). Choose your Personal/Hobby team, root `./`, service-aware detection (Other overall preset if prompted), Vite frontend and FastAPI backend. Provision PostgreSQL, initialize the administrator, supply private model-bundle URL/checksum and configure private backend variables. Leave `VITE_API_BASE_URL` unset. No public live URL exists from this task.

## I. Limitations and preservation

Not yet certified production-ready: hosted PostgreSQL, Vercel build/actual bundle size, public URL, representative hosted load and external service quotas require verification after account setup. Services is currently Beta. Existing model-quality/provenance limitations remain. This is functional deployment preparation, not a penetration-test or accuracy certification.

The original `.env` and six serving model hashes are unchanged. Pre-existing Dashboard removal and warehouse source files were preserved. Read-only catalog checks still show nine source tables and 3,028,547 rows in the original extended Olist bundle. The running database prevented an initial byte hash, so no unsupported before/after byte-identity claim is made. Tests did not migrate, reset or reimport that database. No database, credential, raw data or trained binary belongs in the Git commit.
