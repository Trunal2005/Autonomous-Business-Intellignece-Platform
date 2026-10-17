# Forecast training and validation report

2026-10-14 — **MODEL TRAINED BUT NOT QUALIFIED FOR PRODUCTION.**

## A. Existing forecast problem

Actual inference works, but artifact availability does not establish accuracy. The legacy recursive Linear Regression uses lag1, lag7, lag14, lag30, roll7 and roll30. Its source has 634 observed dates and 140 missing calendar dates; the original fitted cutoff was never independently persisted. Declared split reconstruction is not a verified fit log.

The new complete-block evaluation uses a different explicitly reserved period. On its same-date final comparison the frozen order model outperforms the selected new forest at every tested horizon. Forest performance varies by target and horizon and fails the defined gate. These measurements establish instability, not a causal explanation attributable specifically to gaps, synthetic records or model capacity. Different evaluation windows must not be compared as a single improvement experiment.

All six existing model/source replays succeeded. Checkout prediction remains a single scenario estimate; customer/product KMeans remain historical assignments; Isolation Forest remains historical anomaly detection. No customer-volume, seller-delay, fraud-probability, profit, inventory or causal model was invented. Missing serving product imputation statistics remain a limitation, not invented replacements.

## B. Training data

User-local supplied Olist-shaped orders and order-item CSVs were read with selected columns. Independent aggregation found 99,441 distinct orders, no duplicate order IDs, 112,650 item rows, no invalid purchase dates, 775 orders without item amounts, and 18 dates without any observed item amount. Daily orders and known item-revenue amounts matched the legacy processed source.

The longest jointly observed consecutive block was chosen by coverage only: **2017-01-05–2018-08-29, 602 days**. Missing dates and all-missing revenue amounts were not filled with zero. The extended synthetic ZIP was not used. No row-level real/synthetic provenance flag or independent original fit log exists, so this is not certified wholly real history.

Target: daily distinct orders; revenue is observed item-price sum at purchase-date grain, excluding freight and payment totals. Revenue uses raw price units; BRL is not independently certified. Revenue training results are numeric experimental diagnostics; live unconfirmed-currency revenue remains blocked.

Orders source SHA-256: 8df58ef3d2d7e9944010f7beecd9b75367f5588ec6e3c91cec19ae3345ef9ecf

Items source SHA-256: 0bc4d068c4fe38cbb01bd90e8746e3c613fe7b4baef75fab7b0e329701c3e279

| Phase | Dates | Observations |
|---|---|---|
| train | 2017-01-05–2018-03-02 | 422 |
| validation | 2018-03-03–2018-05-31 | 90 |
| holdout | 2018-06-01–2018-08-29 | 90 |

First validation fit: 392 scalar supervised rows after 30 history observations. Direct 7/14/30/90 fits use 386/379/363/303 supervised rows. Saved snapshots use the first 512 observations through 2018-05-31: 482 scalar rows; direct rows 476/469/453/393. At each expanding origin, preprocessing and fitting see only observations strictly before that origin, including earlier test actuals once observed. No current-origin future actual enters recursion. Saved artifacts were not refitted through the final holdout.

## C. Candidate models trained

Four fixed configurations per target, eight artifacts. Runtime: Python 3.13.5, sklearn 1.5.2, NumPy 2.1.3, pandas 2.2.3, joblib 1.4.2. Seed 42, one model worker / bounded native threads. No package install or upgrade.

| Candidate | Configuration |
|---|---|
| Ridge recursive | Fold-fitted StandardScaler; Ridge alpha=100 |
| Forest recursive | 64 trees, depth 6, min leaf 8, seed 42, n_jobs=1 |
| Histogram boosting recursive | 80 iterations, 7 leaves, rate .05, L2=5, early_stopping=False, seed 42 |
| Ridge direct | Fold-fitted StandardScaler and Ridge alpha=100; separate multioutput estimator per 7/14/30/90 horizon |

Features in order: lag1, lag7, lag14, lag30, roll7, roll30, std7, std30, weekday_sin, weekday_cos, month_sin, month_cos. Rolling inputs use strictly prior observations. Known calendar features do not require future targets. Direct target windows end before each fitting cutoff. Negative outputs are never clamped.

Authoritative artifacts live outside source/deployed directories in **experiment-v2/** under the external task evidence directory delivered separately. Protocol, selection files, aligned actual/predicted series, results and checksums are retained there. The first attempt stopped at JSON serialization after order fitting; it remains in experiment-v1. The complete rerun fixed serialization/feature-name handling and added aligned output evidence, without changing estimator settings, splits or selection rules. No tuning used final-period scores.

| External artifact within experiment-v2/ | Bytes | SHA-256 |
|---|---|---|
| orders-ridge_recursive-v1.joblib | 1767 | 4e0bb7b6ab901881941b46614ce4b689395d768bdbcf157e0fdefa67aa28d5da |
| orders-forest_recursive-v1.joblib | 256618 | 3d86f6091d6487fa3642c1c9271d612c0d9a93cb0ede70608f78e9ecf6cc26db |
| orders-boost_recursive-v1.joblib | 92697 | c3c586999f4cf8cf1fe182d87788b0e120b11db7eb62e4752ca8f33b576b4dce |
| orders-ridge_direct-v1.joblib | 18577 | 685896b7bc32752f527c2d39f29fe3cafa47d5a817f43e035ea6a7037d611b1c |
| revenue-ridge_recursive-v1.joblib | 1767 | 9c88984304745933c590ac516f7579c62df131e7da9fe72b04d97dcaed619116 |
| revenue-forest_recursive-v1.joblib | 259498 | bc12b2e5993fb93cbbc6530fe47ea81aa4f52a9919ecaaca0fa26f562ec00ea4 |
| revenue-boost_recursive-v1.joblib | 93417 | 6d787e39a7b2c0f5bf97e2ce9319c32de8861a6c89d6109134f7356daeff7559 |
| revenue-ridge_direct-v1.joblib | 18593 | 1982ac4615541769c25c9d9a76cf1eac196ed09686520c31378f303601c33f0e |

## D. Objective comparison

The protocol was written before fitting. Validation alone selected the minimum summed candidate MAE / strongest-naive MAE across 7, 14 and 30 days. Both targets selected **forest_recursive**. Only that selected candidate was evaluated on the reserved final period, against both simple baselines, refitted legacy LR and the frozen deployed LR.

Disjoint windows within each horizon use identical dates for every method. Different horizons reuse dates and are not independent replications. Last-value repeats the last actual; weekly naive repeats the preceding seven consecutive days. Earlier validation uses a refitted legacy algorithm because frozen legacy has a later declared fit span. Frozen legacy is evaluated only after its declared cutoff; its original fit provenance remains unverified.

Each cell below is **MAE / RMSE / WAPE% / MASE**. MAE is mean absolute error, RMSE square-root mean squared error, WAPE sum absolute error / sum absolute actual ×100 (null for zero denominator), MASE MAE / initial phase-training seven-day absolute-difference mean (null for zero scale). External MAPE excludes exact-zero actuals explicitly; near-zero observations remain. No training R² is presented as test accuracy.

### Orders — validation

| Days | Origins / points / excluded | Last value | Weekly naive | Legacy refitted | Selected forest |
|---|---|---|---|---|---|
| 7 | 12 / 84 / 6 | 49.833 / 60.486 / 21.231 / 1.537 | 39.810 / 55.462 / 16.961 / 1.228 | 43.388 / 55.611 / 18.485 / 1.338 | 36.088 / 50.153 / 15.375 / 1.113 |
| 14 | 6 / 84 / 6 | 54.500 / 65.365 / 23.220 / 1.681 | 41.119 / 57.708 / 17.519 / 1.268 | 45.660 / 57.153 / 19.453 / 1.408 | 35.155 / 45.655 / 14.978 / 1.084 |
| 30 | 3 / 90 / 0 | 57.733 / 68.953 / 25.371 / 1.780 | 46.278 / 59.844 / 20.337 / 1.427 | 47.938 / 60.658 / 21.066 / 1.478 | 43.054 / 55.575 / 18.920 / 1.328 |
| 90 | 1 / 90 / 0 | 57.333 / 71.864 / 25.195 / 1.768 | 50.300 / 65.849 / 22.104 / 1.551 | 51.965 / 67.052 / 22.836 / 1.602 | 50.120 / 64.329 / 22.025 / 1.546 |

### Orders — holdout

| Days | Origins / points / excluded | Last value | Weekly naive | Legacy frozen | Selected forest |
|---|---|---|---|---|---|
| 7 | 12 / 84 / 6 | 54.655 / 66.839 / 24.683 / 1.619 | 49.464 / 61.692 / 22.339 / 1.466 | 47.794 / 57.962 / 21.584 / 1.416 | 49.519 / 63.749 / 22.363 / 1.467 |
| 14 | 6 / 84 / 6 | 71.000 / 84.012 / 32.065 / 2.104 | 68.095 / 78.991 / 30.753 / 2.018 | 60.757 / 72.285 / 27.439 / 1.800 | 68.019 / 80.340 / 30.718 / 2.015 |
| 30 | 3 / 90 / 0 | 78.267 / 98.798 / 37.140 / 2.319 | 68.867 / 82.385 / 32.680 / 2.041 | 63.630 / 76.231 / 30.195 / 1.885 | 74.374 / 93.512 / 35.293 / 2.204 |
| 90 | 1 / 90 / 0 | 89.311 / 105.397 / 42.381 / 2.646 | 96.033 / 108.863 / 45.571 / 2.846 | 75.545 / 89.160 / 35.849 / 2.238 | 92.005 / 104.454 / 43.659 / 2.726 |

Promotion failures:

- validation 7d: improvement unstable across origins.
- holdout 7d: less than 5% MAE improvement.
- holdout 7d: improvement unstable across origins.
- holdout 14d: less than 5% MAE improvement.
- holdout 14d: improvement unstable across origins.
- holdout 30d: less than 5% MAE improvement.
- holdout 30d: material RMSE regression.
- Original real/synthetic provenance is not independently certified.

### Revenue — validation

| Days | Origins / points / excluded | Last value | Weekly naive | Legacy refitted | Selected forest |
|---|---|---|---|---|---|
| 7 | 12 / 84 / 6 | 7603.830 / 9274.698 / 22.969 / 1.393 | 7093.101 / 9517.814 / 21.426 / 1.299 | 6866.952 / 8712.029 / 20.743 / 1.258 | 6230.916 / 7956.221 / 18.821 / 1.141 |
| 14 | 6 / 84 / 6 | 8359.347 / 10261.888 / 25.251 / 1.531 | 7710.753 / 10274.926 / 23.292 / 1.412 | 7183.805 / 9132.447 / 21.700 / 1.316 | 6035.078 / 7726.911 / 18.230 / 1.105 |
| 30 | 3 / 90 / 0 | 7658.624 / 9403.164 / 23.728 / 1.403 | 7212.956 / 9300.886 / 22.347 / 1.321 | 7279.836 / 9482.134 / 22.554 / 1.333 | 6327.714 / 8103.993 / 19.604 / 1.159 |
| 90 | 1 / 90 / 0 | 7315.852 / 9149.224 / 22.666 / 1.340 | 6862.814 / 8965.795 / 21.262 / 1.257 | 8528.536 / 11302.545 / 26.423 / 1.562 | 6288.178 / 8070.731 / 19.482 / 1.152 |

### Revenue — holdout

| Days | Origins / points / excluded | Last value | Weekly naive | Legacy frozen | Selected forest |
|---|---|---|---|---|---|
| 7 | 12 / 84 / 6 | 6750.128 / 8291.812 / 22.007 / 1.180 | 7206.598 / 9243.326 / 23.496 / 1.259 | 6903.969 / 8544.271 / 22.509 / 1.207 | 6286.399 / 7844.910 / 20.496 / 1.099 |
| 14 | 6 / 84 / 6 | 7635.328 / 9631.206 / 24.893 / 1.334 | 9699.508 / 11599.536 / 31.623 / 1.695 | 8532.096 / 10348.003 / 27.817 / 1.491 | 7841.788 / 9482.662 / 25.567 / 1.370 |
| 30 | 3 / 90 / 0 | 10665.080 / 14019.861 / 36.701 / 1.864 | 8960.580 / 11716.942 / 30.836 / 1.566 | 8952.583 / 11144.374 / 30.808 / 1.565 | 8315.097 / 10891.013 / 28.614 / 1.453 |
| 90 | 1 / 90 / 0 | 8783.931 / 11161.846 / 30.228 / 1.535 | 11526.351 / 13468.204 / 39.665 / 2.014 | 10296.323 / 12368.176 / 35.432 / 1.799 | 10591.227 / 12609.691 / 36.447 / 1.851 |

Promotion failures:

- holdout 14d: less than 5% MAE improvement.
- holdout 14d: improvement unstable across origins.
- Original real/synthetic provenance is not independently certified.
- Revenue training currency is not independently certified.

The gate requires >=5% MAE improvement over the stronger naive at every primary horizon in validation and final holdout, <=5% RMSE regression, >=60% origin wins, adequate origins, no negative-output concern, certified provenance and applicable units. Neither target passes. One 90-day origin per phase cannot justify a general long-horizon quality claim.

All-candidate validation comparisons follow (MAE / RMSE). Final-period scores were not used to choose among these configurations.

| Target / days | Ridge recursive | Forest recursive | Boost recursive | Ridge direct |
|---|---|---|---|---|
| orders / 7 | 42.040 / 53.846 | 36.088 / 50.153 | 38.224 / 53.357 | 42.656 / 54.597 |
| orders / 14 | 43.730 / 55.534 | 35.155 / 45.655 | 36.000 / 45.458 | 42.956 / 54.900 |
| orders / 30 | 48.120 / 61.264 | 43.054 / 55.575 | 42.786 / 54.446 | 45.344 / 57.595 |
| orders / 90 | 53.199 / 71.833 | 50.120 / 64.329 | 42.450 / 55.310 | 44.927 / 58.164 |
| revenue / 7 | 6740.348 / 8647.686 | 6230.916 / 7956.221 | 7010.718 / 8862.888 | 6809.569 / 8698.360 |
| revenue / 14 | 7077.345 / 9085.647 | 6035.078 / 7726.911 | 6852.679 / 8614.744 | 6684.964 / 8638.582 |
| revenue / 30 | 7659.940 / 9918.963 | 6327.714 / 8103.993 | 7050.198 / 8690.645 | 7576.471 / 9552.613 |
| revenue / 90 | 9317.037 / 12206.826 | 6288.178 / 8070.731 | 7867.957 / 9733.348 | 7497.890 / 9753.852 |

## E. Production integration

**No promotion.** Existing sales_forecast_orders and sales_forecast_revenue remain version **0.1.0**, LinearRegression lag/rolling artifacts. No rollback is necessary; all six serving files were preserved with external backups. The original inactive ABI Gradient Boosting candidate was never activated or deserialized.

ML_EXPERIMENT_REPORT_PATH optionally points, in the process only, to the reviewed external results JSON. The model-detail endpoint validates bounded aggregate report data, dates and comparable sample counts. It never reads candidate binaries, trains during requests or promotes from a report flag. Missing/invalid evidence gives an honest unavailable state. Fresh clones without that local report remain functional with no invented scores.

Forecast responses add horizon, daily frequency, observed coverage and a distinct unqualified selected-dataset evaluation status. Existing fields remain compatible. No upload/auth/session architecture, parser, registry, budget or ownership implementation changed.

## F. Future-prediction UX

Visible quality evidence accompanies the chart: same-date naive/current/candidate comparisons, origin counts, failed gates and provenance limits. Artifact presence, contract compatibility, executed inference and quality qualification are separate.

Selected date scope sets the historical forecast origin. Latest-data mode removes only date filters while retaining dataset/dimension scope; an incomplete latest window blocks honestly. Historical comparison requests later actuals with the same dimensions and matches by date, leaving missing dates unavailable. The unverified original fit cutoff prevents calling this independent holdout validation. It is a real comparison table, not a fabricated backtest line.

History stays solid, future model output dashed, with a dated boundary and real tooltips. No uncertainty interval is invented. Changing dataset, mode, target, horizon or filters hides old results and rejects late responses.

Main populated-data browser reconciled 99,441 orders against API values. Origin **2018-01-31**, 30-day predictions **2018-02-01–2018-03-02**, plus genuine 7-day requests. Table/tooltip/chart dates and visible candidate metrics matched API output. The old-data warning states that 2018-origin forecasts do not establish 2026 business activity. Incomplete latest history and unconfirmed-currency revenue block honestly. Disposable complete data also verifies successful latest mode and real later-observation comparison.

## G. Regression results

All mutating tests used disposable databases. Main populated data was not reimported, deleted or schema-confirmed. Login/session use was necessary for actual browser validation.

| Command using installed runtime | Actual result |
|---|---|
| backend: python -m pytest -q --free-only-network (baseline) | 359 passed, 15 skipped |
| ml: python -m pytest -q (baseline) | 8 passed |
| frontend: node node_modules/vitest/vitest.mjs run (baseline) | 91 assertions passed; one unhandled timer cleanup error, not clean |
| backend: python -m pytest -q --free-only-network (first full post-change) | 366 passed, 15 skipped |
| backend: python -m pytest -q --free-only-network tests/test_forecast_quality.py (strict count/date hardening) | 9 passed |
| backend: python -m pytest -q --free-only-network (final delivered code) | 368 passed, 15 skipped |
| ml: python -m pytest -q (final) | 21 passed |
| frontend: node node_modules/vitest/vitest.mjs run (final) | 95 passed, 19 files; no unhandled errors |
| frontend: node node_modules/typescript/bin/tsc -b; node node_modules/vite/bin/vite.js build | Passed |
| frontend: node node_modules/eslint/bin/eslint.js . | Passed |
| frontend: node node_modules/@playwright/test/cli.js test --workers=1 --config <external>/playwright.config.cjs; SEM5_E2E_BACKEND_PORT=8001; PLAYWRIGHT_BROWSERS_PATH=<installed cache> | 27 passed, 2 gated skips |
| node <external>/verify-main.cjs | Main populated API/chart/tooltips, quality/origin/modes, currency block, reload and upload controls passed; zero page errors |

Browser skips are the explicitly gated private exact-ZIP reimport and persisted exact-archive scenario. Those gates were not enabled to avoid another real import. Synthetic nine-table/folder/ZIP/single-file scenarios and a separate existing populated-data browser scenario did run. Backend skips remain pre-existing fixture/optional cases; failures were not converted to skips and assertions were not weakened.

Intermediate issues are retained in logs: sandbox temp-directory permissions required disposable tests outside the sandbox; report serialization was fixed; mock-effect/duplicate-cell test selectors were corrected; the first E2E run used a mismatched direct API port and requests were unauthorized, then explicitly isolated. Adding a visible quality table made three old browser selectors count all tables; they now target the accessible Forecast data table while retaining the exact 7/30-row assertions. Final complete browser run passed. Download-test timers flush before URL mocks restore; production export transport is untouched.

## H. Preservation

Initial/final branch **integrate/abi-ml-backend**, HEAD **fb5ed5608410dd8ce633eb0ff709e770ef2e872b**. No commit, push, fetch, pull, remote repository inspection, reset, stash, merge, rebase or branch switch. No dependency manifest/lock change.

Task start already had 11 modified tracked files and eight untracked files. A 267-file snapshot plus complete inventories and staged/unstaged patches was retained before edits. Every prior file remains; task-specific changes are compared with that snapshot separately from the full dirty Git diff.

All 23 protected environment/developer-database/model/metadata/processed-source entries retain their SHA-256, size and mtime. Original .env and developer database were not edited. The populated serving SQLite file was locked; an initial Get-FileHash attempt failed, so no initial whole-file hash is falsely claimed. Read-only SQLite quick_check returned ok, registry remains 70 records, and main API/browser aggregates reconcile.

Changed relative to task start:

- backend/app/api/routes/ml.py
- backend/app/services/ml.py
- frontend/e2e/abi-integration.spec.ts
- frontend/e2e/api-connectivity.spec.ts
- frontend/e2e/forecast-evidence.spec.ts
- frontend/src/pages/ml/RevenueForecast.tsx
- frontend/tests/ForecastExperience.test.tsx
- frontend/tests/api-connectivity.test.ts

New this task:

- ml/src/forecasting/evaluate_candidates.py
- ml/tests/test_forecast_candidates.py
- backend/app/services/forecast_quality.py
- backend/tests/test_forecast_quality.py
- frontend/src/components/ForecastQuality.tsx
- frontend/tests/ForecastQuality.test.tsx
- docs/FORECAST_TRAINING_AND_VALIDATION_REPORT.md

The API route adds diagnostics; the serving service adds response metadata only. Upload/auth implementations and shared production API transport remain identical to task start. External aggregate inputs, trained binaries, protocol and reports were not staged.

## I. Local verification links

- LIVE — VERIFIED: http://localhost:5173/login
- LIVE — VERIFIED: http://localhost:5173/dashboard
- LIVE — VERIFIED: http://localhost:5173/datasets
- LIVE — VERIFIED: http://localhost:5173/ml/metrics?date_from=2018-01-01&date_to=2018-01-31
- LIVE — VERIFIED: http://localhost:8000/health
- LIVE — VERIFIED: http://localhost:8000/docs

Frontend 5173 and main API 8000 remain running against the populated database and preserved model directory. Diagnostics are process-local; .env is unchanged. The private external restart helper retains exact original runtime paths. Restarting that helper creates a new local signing key, so sign in again if an earlier session expires.

Reproducible training command from the repository root, using the installed Python runtime and the delivered external aggregate/provenance files:

```powershell
python ml/src/forecasting/evaluate_candidates.py --source <external>/training-observed-block.csv --provenance <external>/data-audit.json --output <new-external-directory> --legacy-models ml/models
```

The output directory must be new and outside the repository. This command never overwrites serving artifacts. To expose the reviewed diagnostics after a manual API restart, set ML_EXPERIMENT_REPORT_PATH to the external experiment-v2/results.json in that process only; absent evidence remains honestly unavailable.

## J. Final verdict

**MODEL TRAINED BUT NOT QUALIFIED FOR PRODUCTION.** Order candidates failed measured holdout improvement/stability, including a 30-day RMSE regression; revenue failed 14-day improvement/stability. Both have unverified real/synthetic provenance, and revenue also has unverified currency. Existing serving models remain operational, but reliable current-day forecasting is not established by old data. Promotion needs certified lineage, confirmed units, relevant recent coverage and consistent improvement across additional chronological origins.
