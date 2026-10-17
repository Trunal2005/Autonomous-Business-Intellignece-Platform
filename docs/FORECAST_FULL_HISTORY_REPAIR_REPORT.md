# Forecast dataset and complete-history repair

Verified 2026-10-15 (Asia/Kolkata). No retraining, model promotion, commit, push or remote access.

## Root cause

The exact screenshot error was reproduced against the existing **olist dataset**, Bundle overview: its real orders forecast returns Not Applicable because the latest thirty daily observations are not consecutive. It is not the registered five-year model scope.

The persisted Admin selection at the start of this repair was already **Olist_Dataset_2016_2021**, whereas Analyst had a different private fixture selection. The historical screenshot is not presented as current Admin state. Explicit authenticated header comparisons reproduced both cases without changing the saved selection. Request identity and returned dataset identity matched. The correct extended bundle already passed registry/member-revision matching and genuine Ridge inference with origin 2021-12-31. No registry rebinding was necessary.

The second proven defect was the chart contract: responses lacked full history, and the frontend passed only the thirty-point history_tail to the chart. Consequently even correct inference could not display the required six-year history. The confirmed causes are **A + E**, plus absent local server processes at the start; B/C/F were not reproduced. Selected-date mode can intentionally truncate history (D), and is now clearly distinguished from Latest.

Exact selected/request/returned IDs, registered bundle/member identities, expected row counts and revisions are retained in the private identity-and-binding appendix outside the repository. No secret, raw customer row or private source path is published here.

## Repaired end-to-end contract

Active Dataset/Table → existing authenticated DatasetContext/request header → unchanged ownership resolver → exact registered member/revision match → selected-source daily aggregation → independent display history and model input → response identity validation → sorted chart points → actual SVG/tooltip.

- historical_series contains the complete authorized daily display chronology. Absent dates and unknown targets are explicit nulls.
- historical_coverage records actual first/last dates, calendar positions, recorded days, absent dates, unknown targets and zero_filled=0.
- forecast_series contains genuine model predictions, identical to retained forecast.
- history_tail retains its bounded thirty-observation inference meaning.
- selected_scope identifies the actual authorized dataset.
- synthetic_registration explains matches/different_dataset/revision_mismatch/not_configured and lists only the current user's existing verified bundle choices.

No chart imputation enters inference. Features, preprocessing, estimator mathematics, weights, evaluation evidence, qualification and legacy monetary checks remain unchanged. Invalid latest windows still block future inference, while historical visualization can remain available. Gap errors include concrete missing dates/target dates.

Discovery matches exact member IDs, counts and revisions and filters by ownership/READY bundle. It never selects automatically, binds by name or exposes another user's private bundle. The explicit action invokes the existing DatasetContext.select workflow. No duplicate imports, source mutations or registration changes occurred.

## Actual populated-source results

| Target | Calendar positions | Recorded target values | Unknown positions | Origin | Future count | First / last prediction | Model |
|---|---:|---:|---:|---|---:|---|---|
| Orders | 1,945 | 1,837 | 108 | 2021-12-31 | 30 | 2022-01-01 / 2022-01-30 | Ridge with fitted scaler, synthetic-v1 |
| Revenue | 1,945 | 1,833 | 112 | 2021-12-31 | 30 | 2022-01-01 / 2022-01-30 | Histogram Gradient Boosting, synthetic-v1 |

Both historical calendars begin **2016-09-04** and end **2021-12-31**. There are 1,837 recorded transaction dates and 108 absent dates; revenue also has four recorded dates without qualifying item revenue. Coverage remains unknown by the owner's declaration. Unknown dates/targets are never observed zero, interpolated or forward-filled.

The original nine-table, 385,650-order, 3,028,547-source-row extended bundle is the actual source. Only bounded daily aggregates reach the browser. Daily aggregation is reused within the request/session by dataset/revision/owner/filter context; both targets are validated independently. There is no cross-user/request prediction cache. Member revisions are checked on serving compatibility. Query/calendar bounds are 100,000 positions.

Orders retain fractional expected-order units. Revenue retains **source revenue units — currency unconfirmed**. Both models remain **experimental/unqualified**. No interval, fake backtest, customer/seller forecast, profit or real-world accuracy claim was added. Predictions are post-2021 relative to stored history, not forecasts from today in 2026.

## Actual UI and browser verification

The shared ForecastExperience/ForecastChart serves /ml/metrics, /ml/order-forecast and /ml/revenue-forecast. Latest-data forecast is the explicit default: only dates are removed from that request, while selected dataset/table and dimension filters remain. Selected date scope and Historical comparison remain separate modes.

The real browser opened ML Metrics, verified the saved selection, explicitly selected the older bundle through Active Dataset, and saw its own **774 historical calendar positions with zero future points**. The exact compatible bundle appeared as a safe explicit selection action. The dataset stayed old until that action was clicked. Request header, returned ID and displayed source then matched the extended bundle. Returning to the old bundle removed prior synthetic predictions and restored the truthful incompatibility state.

For both targets, actual response and rendered SVG checks verified all 1,945 historical positions, earliest/latest dates, thirty genuine future values, next-day 2022 boundary, solid/dashed styles, real table values and multiple disconnected SVG segments across unknowns. Hovered tooltips showed exact observed dates, No recorded target value on nulls, selected scope, model/version, units and unqualified status. Observed zero is a distinct renderer state, verified with a deterministic fixture. Full-page screenshots were visually inspected and no horizontal overflow occurred.

Changing 30 → 7 days altered the real request and returned/rendered exactly seven predictions. A supported selected cutoff of **2020-12-31** produced predictions beginning **2021-01-01**; Latest restored the full source chronology and 2022 boundary. An earlier attempted 2018 revenue cutoff honestly blocked inference because of missing target data; it was not claimed as a successful forecast.

The main browser run also verified Dashboard **385,650 distinct orders**, Dataset Manager folder/ZIP controls, Reports Word/CSV controls and **zero page errors**. The original per-user dataset selections were restored in the verifier's finally block.

## Tests

Project Python means the existing installed project virtual environment. Node commands use installed frontend dependencies. All mutation tests use disposable databases; populated data was neither reimported nor reset.

| Directory / command | Actual result |
|---|---|
| backend: python -m pytest tests -q — baseline | 382 passed, 15 existing skips; 70.36s |
| frontend: node node_modules/vitest/vitest.mjs run — baseline | 100 passed, 21 files |
| backend: python -m pytest tests/test_forecast_history.py -q | 2 passed; real fitted disposable estimator and genuine nine-table aggregation |
| backend: python -m pytest tests -q — final | 384 passed, 15 existing skips; 72.71s |
| frontend: node node_modules/vitest/vitest.mjs run — final | 105 passed, 22 files |
| frontend: node node_modules/typescript/bin/tsc -b | Passed |
| frontend: node node_modules/vite/bin/vite.js build | Passed; 21.51s |
| frontend: node node_modules/eslint/bin/eslint.js . | Passed, including final origin-mode assertions |
| ml: python -m pytest tests -q | 28 passed; 10.09s |
| backend: python -m pytest tests/test_free_api_policy.py --free-only-network -q | 25 passed; non-loopback access denied |
| frontend: node node_modules/@playwright/test/cli.js test --workers=1 --config external/playwright.config.cjs | 28 passed, 2 existing gated skips; 3.5m |
| node external/verify-full-history.cjs | Passed against main populated app: actual JSON, full SVG/tooltip values, explicit source selection, horizon/cutoff changes and protected pages |
| git diff --check | Passed |

Here external denotes private local evidence: the full-history repair folder holds the main verifier; the previous synthetic-word evidence folder provides the existing Playwright config. Browser environment used SEM5_E2E_BACKEND_PORT=8001, SEM5_E2E_FRONTEND_PORT=5174, NODE_OPTIONS=--dns-result-order=ipv4first and the installed browser cache. Browser-test mutations affected a fresh disposable reference copy only.

Protected regressions cover Admin/Analyst login, refresh/logout/invalid sessions, RBAC/ownership, nested folder/ZIP/single-file upload, 200 MiB controls/import limits, bundle/table/schema selection, Dashboard/business evidence, actual scoped CSV and parsed DOCX downloads with media, segmentation/anomalies and ML routes. The two existing gated browser cases require explicit full private ZIP reimport/persisted archive verification and were not enabled against the populated database. No new skips or weakened assertions were introduced.

Intermediate failures remain documented. The initial eight-worker browser run had **19 passed / 9 failed / 2 skipped**, with shared account/selection conflicts and a missing temporary table, plus assertions assuming the old default mode. A fresh serial run passed all enabled cases. Existing exact date expectations were retained after explicitly choosing Selected date scope; additional assertions verify Latest. An early main-browser locator matched legend SVGs too and was narrowed. An ineligible 2018 revenue cutoff was correctly rejected. A five-second chart assertion raced a larger query/stale response; final verification used an appropriate UI wait and request correlation. No failing inference was replaced by mock values.

## Files changed relative to the pre-repair snapshot

| Existing local file | Focused change |
|---|---|
| backend/app/api/routes/ml.py | Add authorized full-history/forecast aliases, selected identity and registration context to both available and unavailable responses. |
| backend/app/services/synthetic_forecast.py | Bounded null-preserving chart history, request-local aggregate reuse, owned registration discovery and specific gap dates; retain matching/hash/feature checks. |
| frontend/src/components/ForecastChart.tsx | Full continuous date axis, disconnected gaps, real tooltip metadata, separate forecast and history-only state. |
| frontend/src/pages/ml/RevenueForecast.tsx | Full-history response consumption, explicit scope action, latest default, blocked-inference history and stale scope rejection. |
| frontend/src/services/api.ts | Forecast response/types only; authentication/upload/CSV/Word transport unchanged. |
| frontend/src/services/forecast.ts | Separate full-history validator; existing strict input-tail validator retained. |
| frontend/tests/ForecastExperience.test.tsx | Retain stale/scoped assertions; add full history, latest default, explicit selection and no auto-switch checks. |
| frontend/e2e/abi-integration.spec.ts | Assert latest default then explicitly choose the original date scope; retain existing model/auth checks. |
| frontend/e2e/api-connectivity.spec.ts | Verify latest date removal and retain exact selected-scope forecast assertion. |
| frontend/e2e/forecast-evidence.spec.ts | Require more than thirty history points and full-history first tooltip; explicitly choose selected mode for cutoffs. |

| New file | Purpose |
|---|---|
| backend/tests/test_forecast_history.py | Real registered test model/full 2016–2021 bundle, missing values, scope/cutoff/ownership/revision/inference contracts. |
| frontend/tests/FullForecast.test.tsx | Actual SVG path gaps, unknown versus zero, separate future/history-only rendering and invalid-data rejection. |
| docs/FORECAST_FULL_HISTORY_REPAIR_REPORT.md | This evidence and preservation report. |

All earlier dirty source, tests and reports remain. Upload/auth implementation, AppLayout/selection architecture, limits, schema mapping, Dashboard/business evidence, Word generation, CSV export, dependencies, features/training and evaluation evidence were not changed.

## Preservation

Branch **integrate/abi-ml-backend** and HEAD **fb5ed5608410dd8ce633eb0ff709e770ef2e872b** remain unchanged. All **286** pre-repair files remain. All **31 protected paths** match before/after SHA256, size and modification time: original .env, developer database, six deployed artifacts and related metadata/preprocessing inputs, inactive ABI candidate/support files, and two synthetic artifacts plus registry. No model was retrained, replaced, promoted or overwritten; inactive ABI candidate remains inactive.

The main verification database path was retained. Exact dataset identity/name/owner/count/revision inventory, bundle membership and per-user selection inventory match the starting snapshot after restoration. Normal authentication/session records may change, so a byte-identical whole active WAL database is not claimed. The original developer database is byte-identical. **33 protected implementation/source files** match the snapshot. CSV/Word/auth/upload transport regions in the API module also match.

No destructive Git command, branch switch, reset, cleanup, stash/restore, fetch, pull, clone, remote inspection, commit, amend or push occurred. Staging is empty; no private data/model was staged. Detailed hashes, original dirty status, request/binding identities and a repair-only patch remain in local evidence outside the repository. Test JWTs were redacted from failure logs.

## Live local URLs

- **LIVE** http://localhost:5173/ml/metrics — full shared forecast and explicit compatible-bundle action.
- **LIVE** http://localhost:5173/ml/order-forecast — full orders chronology and actual predictions.
- **LIVE** http://localhost:5173/ml/revenue-forecast — full revenue chronology, units and warnings.
- **LIVE** http://localhost:5173/datasets — existing import/schema flows.
- **LIVE** http://localhost:5173/dashboard — actual populated source verified.
- **LIVE** http://localhost:5173/reports — CSV/Word preserved; actual downloads passed disposable browser tests.
- **LIVE** http://localhost:8000/health — main API health verified.

These states are supported by real workflows and JSON checks above, not only SPA HTTP status. Main 8000/5173 remain running with the preserved database/registry. Task-owned test 8001/5174 were stopped after tests. If a session predates the API restart, sign in again.

Generator provenance, transaction completeness and synthetic currency remain unknown. Both forecasts remain experimental/unqualified. Full-source business-evidence queries retain their existing cost; no protected business formula was changed as a performance workaround.

**COMPLETE: registered-dataset full history and real post-2021 forecast verified. Model qualification remains unchanged and unqualified.**
