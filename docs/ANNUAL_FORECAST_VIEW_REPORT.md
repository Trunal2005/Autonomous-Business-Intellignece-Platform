# Annual historical and future forecast view

Verified 2026-10-15 (Asia/Kolkata), in the existing local workspace. No retraining, model replacement, publication or dependency changes.

## Cause and verified result

The prior UI initialized the horizon to 30, offered only 7/14/30/90 days, and mapped the complete historical_series to the chart. Thus it displayed 1,945 historical calendar positions beside thirty predictions. The API and legacy model service both enforced a maximum of ninety days; a real pre-change 365-day request returned HTTP 400. Changing chart CSS could not resolve this.

The actual selected source remains **Olist_Dataset_2016_2021**, Bundle overview. Both registered synthetic models remain synthetic-v1:

| Target | Existing model | Displayed history | Historical points | Genuine future | Prediction points |
|---|---|---|---:|---|---:|
| Orders | Ridge regression with fitted standard scaler | 2021-01-01–2021-12-31 | 365 | 2022-01-01–2022-12-31 | 365 |
| Revenue | Histogram Gradient Boosting regression | 2021-01-01–2021-12-31 | 365 | 2022-01-01–2022-12-31 | 365 |

Origin / last actual is **2021-12-31**. The source calendar still contains 1,945 positions, but only the trailing calendar year is plotted. Each serving input tail remains **30 valid consecutive observations**. All 365 values for both targets were produced successfully and compared, point for point, with real read-only inference through the original model pipeline performed before the horizon-validator change.

Both models remain **experimental/unqualified**. Annual accuracy has not been validated; existing offline evidence covers shorter horizons. There are no fabricated intervals or backtest lines. Orders remain expected fractional volume. Revenue remains **source revenue units — currency unconfirmed**. A 2022 forecast is explicitly relative to the stored data endpoint, not current 2026 activity.

## Implementation and calendar policy

- The API and legacy service now accept **1–366 days**, a bounded maximum supporting a calendar year that crosses leap day. The synthetic service also validates this bound before inference. Existing 7/14/30/90-day calls and the API's thirty-day default remain compatible.
- Existing recursive feature construction and estimator calls are reused unchanged. Prior model predictions feed later steps; future actuals never enter. No features, scalers, weights, source mapping, training/evaluation methodology or model registration changed.
- The shared ML Metrics/order/revenue experience defaults to **1 Year (365/366 Days)**. It requests 365 predictions initially; if the actual returned origin requires 366 days, it requests the complete 366-step model output before rendering. It never appends or interpolates the extra point.
- Future end is the UTC calendar anniversary of the actual origin. First future day is origin + one day. Historical start is the previous UTC calendar anniversary + one day, inclusive through origin. February 29 clamps to February 28 when the anniversary year is not leap.
- Examples covered by tests: origin 2021-12-31 gives 2021 history / 2022 predictions, 365 each; origin 2023-12-31 requires 366 predictions through 2024-12-31; origin 2020-12-31 has a 366-position historical year; origin 2024-02-29 displays history from 2023-03-01 and predicts through 2025-02-28.
- Window selection uses UTC date arithmetic and numeric timestamps, not the last 365 array entries, string ordering or hardcoded source years. The full authorized API history remains available for existing callers; inference and display are separate products.
- Both the returned forecast length and actual plotted future-point count must match the requested calendar interval. Existing daily-date alignment, duplicate/nonfinite rejection and missing-input checks remain.
- Unknown history remains null. Coverage is still unconfirmed; absent dates/revenue are not zero-filled. An invalid inference window keeps the available trailing history visible and returns the genuine blocking reason.
- Long provenance warnings are expandable, while model identity/version, unqualified status, units, origin, actual forecast range and unvalidated annual accuracy stay near the chart. Both solid observed and dashed model lines remain distinct. Dense point dots are suppressed for long lines without removing any underlying points or tooltips. No global styles/navigation changed.

## Genuine inference and resource checks

Before extending the API limit, the approved read-only synthetic serving functions generated all 365 finite predictions with unchanged artifacts:

| Target | First prediction | Last prediction | Read-only call time | Python-traced peak |
|---|---:|---:|---:|---:|
| Orders | 181.09 | 284.72 | 7.908s | 44.87 MiB |
| Revenue | 21,906.78 | 27,998.15 | 1.317s | 3.72 MiB |

These are measured calls including loading/aggregation; the second target reused request-local aggregation. They are not a controlled speed comparison or total process RSS. Recursion is bounded at 366 outputs with the existing thirty-value feature window. No external service, paid API or new dependency was introduced.

Backend tests wrap an actual fitted disposable estimator and record every real predict call/output: 365 calls match all 365 response values; step two consumes prediction one, and step thirty-one uses prediction one as lag30. Prefixes match 7/14/30/90-day inference. The registered source/member/revision/checksum checks, ownership and legacy BRL compatibility remain active. Wrong or insufficient history still blocks inference.

## Actual browser acceptance

The verified main app requests the selected authenticated bundle and periods=365, receives 365 genuine future points, and renders exactly 365 historical positions plus 365 future positions. For **both targets**, six exact date/value tooltips were checked: 2021-01-01, 2021-06-15, 2021-12-31 and 2022-01-01, 2022-06-15, 2022-12-31.

All returned predictions match the pre-extension real-model inference arrays. The browser checked the boundary, dashed future style, units/currency, visible unqualified status, no horizontal overflow, 30-day → one-year round trips and stale-prediction removal when switching to the incompatible older bundle. Full-page orders/revenue screenshots were inspected. Final verification recorded **zero page errors and zero network failures** and restored the original persisted selection.

## Commands and actual outcomes

Project Python denotes the existing project virtual environment; frontend commands use installed Node dependencies. Tests that upload/change/delete data use disposable databases.

| Directory / command | Result |
|---|---|
| backend: python -m pytest tests -q — baseline | 384 passed, 15 existing skips; 56.24s |
| frontend: node node_modules/vitest/vitest.mjs run — baseline | 105 passed |
| backend: python -m pytest tests/test_annual_forecast.py tests/test_forecast_history.py tests/test_synthetic_serving.py -q | 10 passed; genuine registered/disposable estimators and API aggregation |
| backend: python -m pytest tests -q — final | 387 passed, 15 existing skips; 298.34s under combined load |
| frontend: node node_modules/vitest/vitest.mjs run --maxWorkers=2 --minWorkers=1 | 112 passed, 23 files; 60.21s |
| frontend: node node_modules/typescript/bin/tsc -b | Passed |
| frontend: node node_modules/vite/bin/vite.js build | Passed; 1m13s under combined load |
| frontend: node node_modules/eslint/bin/eslint.js . | Passed, including final E2E assertions |
| frontend: node node_modules/@playwright/test/cli.js test --workers=1 --config external/playwright.config.cjs | Final stable run: 28 passed, 2 existing gated skips; 4.0m |
| node external/verify-year-dedicated.cjs | Passed: genuine 365+365 charts for both targets, all prediction values, twelve exact tooltips, horizon round trips, source switching, zero page/network errors |
| git diff --check | Passed |

external refers to private local evidence directories, not a remote source. Browser regressions use disposable 8001/5174 services, the installed Playwright cache and NODE_OPTIONS=--dns-result-order=ipv4first. Main populated data is not reimported.

Protected browser cases cover folder/nested folder, ZIP/single-file imports and 200 MiB controls; login/refresh/logout, ownership/RBAC; Dashboard/business evidence; real filtered CSV and parsed DOCX downloads with embedded media; and existing ML tasks. The two existing gated cases require explicit full private archive reimport/persisted archive checks and remain disabled against the protected real database. No new skip or weakened assertion was introduced.

Intermediate failures are retained. A new test's unstable filter mock caused repeated effects and was fixed without changing production logic. The initial unconstrained frontend run had 110 passed / 2 five-second timeouts during heavy simultaneous load; the bounded run passed all 112. The first browser suite had 27 passed / 1 outdated thirty-row-default expectation / 2 skips; the original thirty-row assertion remains after explicitly selecting thirty days, with an added annual-default check. A later run was interrupted by external service/port changes; the stable final run passed all 28 enabled cases. Main-browser pointer pixel rounding and a caption locator were corrected while keeping exact date/value assertions. No fake successful inference was substituted.

## Files changed by this task

Comparison is against the **289-file pre-task local snapshot**, not the existing dirty Git diff.

| File | Reason |
|---|---|
| backend/app/api/routes/ml.py | Bounded annual/leap-year horizon and explicit long-horizon uncertainty warning; response defaults/aliases retained. |
| backend/app/services/ml.py | Only extend the existing forecast horizon validator from 90 to 366; feature/preprocessing/inference logic unchanged. |
| backend/app/services/synthetic_forecast.py | Add explicit local 1–366 horizon validation; same registered model recursion. |
| frontend/src/services/forecast.ts | UTC anniversary calculation and trailing-calendar-year display selection. |
| frontend/src/pages/ml/RevenueForecast.tsx | Annual default, real 365/366 requests, exact horizon validation, year display and concise/expandable warnings. |
| frontend/src/components/ForecastChart.tsx | Suppress dense future dots for long series while retaining every model point, dashed line and actual tooltip. |
| frontend/tests/ForecastExperience.test.tsx | Retain shorter-horizon, stale/error, scope and comparison assertions; exercise annual default and expandable warnings. |
| frontend/tests/AnnualForecast.test.tsx | New UTC/leap/inclusive-window, gap/zero, exact model-point preservation and 365/366 request tests. |
| backend/tests/test_annual_forecast.py | New real prediction-call/input audit, 365/366 and short horizons, dates, missing data, currency and ownership tests. |
| frontend/e2e/abi-integration.spec.ts | Verify annual default, then explicitly choose thirty days and retain original model/auth assertions. |
| frontend/e2e/api-connectivity.spec.ts | Verify 365 rows first, then preserve the original explicit thirty-row assertion. |
| frontend/e2e/forecast-evidence.spec.ts | Exercise annual default before the original short-horizon tooltip/filter scenarios. |
| frontend/e2e/olist-bundle.spec.ts | Expect the actual new default 365 model points; retain finiteness, scope and workflow checks. |
| frontend/e2e/regression-recovery.spec.ts | Check annual default and explicit thirty-day compatibility; retain upload/auth/export workflow. |
| docs/ANNUAL_FORECAST_VIEW_REPORT.md | This directly relevant implementation/verification report. |

Older modified/untracked work remains. No ingestion/authentication/report implementation, global date filter, Dashboard calculation, business-evidence rule, dependency manifest/lockfile, trained weight, scaler, training script or evaluation evidence was edited.

## Preservation and runtime

Branch **integrate/abi-ml-backend**, HEAD **fb5ed5608410dd8ce633eb0ff709e770ef2e872b** remain unchanged. All **289 baseline files** remain present. All **31 protected artifact/configuration paths** match before/after SHA256, size and modification time, including .env, original developer database, six serving artifacts and metadata/preprocessing inputs, inactive ABI candidate/support files, and two registered synthetic artifacts plus their registry. No training or promotion occurred. The inactive candidate remains inactive.

Exact populated verification-database dataset identity/name/owner/count/revision inventory, bundle membership and per-user selections match the initial snapshot. Normal authentication/session records may change; a byte-identical whole active WAL database is not claimed. No upload, deletion, migration or reimport was performed against populated source data. Protected implementation files and CSV/Word/auth/upload transport regions remain unchanged. No commit, push, branch switch, remote access, reset, cleanup, merge or rebase occurred; staging is empty. Detailed before/after hashes and a task-only diff are retained privately.

During verification, **another local project took ports 5173/8000**. Its processes were identified and left untouched. This workspace therefore runs on **5175/8002**, with its original verification database and approved registry. A private launch-only wrapper permits exactly localhost:5175 in the in-memory CORS middleware, following the existing isolated-test launch pattern; protected app source and .env are unchanged. A copied launcher's relative registry path was corrected to the original unchanged registry. These runtime accommodations do not alter ownership, tokens, role checks, upload rules or model registration.

## Verified local URLs

| URL | Status |
|---|---|
| http://localhost:5175/login | LIVE — correct workspace |
| http://localhost:5175/ml/metrics | LIVE — annual shared forecast experience verified |
| http://localhost:5175/ml/order-forecast | LIVE — 365 history + 365 genuine orders predictions verified |
| http://localhost:5175/ml/revenue-forecast | LIVE — annual source-unit revenue and warnings verified |
| http://localhost:5175/datasets | LIVE — original import/selection code; protected browser workflows passed |
| http://localhost:5175/dashboard | LIVE — original analytics code/database preserved; protected workflows passed |
| http://localhost:5175/reports | LIVE — original CSV/DOCX implementation; actual download regressions passed |
| http://localhost:8002/health | LIVE — correct workspace API |
| http://localhost:5173 and http://localhost:8000 | OTHER PROJECT — not claimed as this workspace's verified annual view |

Main 5175/8002 services are left running. Disposable test services are stopped after verification. The private start-dedicated.ps1 launcher preserves the original database/model environment; frontend 5175 uses VITE_API_BASE_URL=http://localhost:8002 as a process variable. A session predating a backend restart may require signing in again.

**Complete: one trailing calendar year of actual history plus one calendar year of genuine existing-model predictions. Models remain experimental/unqualified; annual accuracy is not established.**
