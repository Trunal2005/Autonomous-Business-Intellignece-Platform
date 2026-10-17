# Synthetic forecasting and business Word report — verified local handoff

Verified 2026-10-15 (Asia/Kolkata). This report describes the current local implementation, not a remote checkpoint. No commit or publication occurred.

## A. Synthetic data identification

The intended local Olist_Dataset_2016_2021.zip contains nine CSV tables. The already populated Admin bundle Olist_Dataset_2016_2021 now supplies live forecasting. Its equivalent Olist 2016–2021 complete verification copy has SHA256-identical raw CSV content for every table. Neither was reimported. The initial selected older olist dataset had short/gapped history; selecting the actual audited extended bundle and using a separately trained dataset-bound model resolves that specific incompatibility without assuming zero activity.

| Table | Source rows |
|---|---:|
| olist_customers_dataset.csv | 385,650 |
| olist_geolocation_dataset.csv | 1,000,163 |
| olist_order_items_dataset.csv | 437,572 |
| olist_order_payments_dataset.csv | 402,457 |
| olist_order_reviews_dataset.csv | 380,938 |
| olist_orders_dataset.csv | 385,650 |
| olist_products_dataset.csv | 32,951 |
| olist_sellers_dataset.csv | 3,095 |
| product_category_name_translation.csv | 71 |

Total imported rows: **3,028,547**; distinct orders: **385,650**. Purchase-date coverage: **2016-09-04–2021-12-31**, spanning **1,945** calendar days with **1,837** recorded transaction dates. There are **108** dates without recorded transactions and **4** recorded dates without qualifying item revenue. No duplicate order IDs or invalid purchase dates were found. Qualifying item prices total **53,088,558.01 source units**, excluding freight and payments.

The owner explicitly declared coverage unknown. Unknown dates remain NaN, never zero; unknown revenue remains missing. Training consumes the whole extended chronology and excludes only supervised windows that lack a finite target and thirty consecutive past target observations. Live inference uses the actual complete latest thirty-day window. Thus daily inference is possible without a fabricated full-history completeness declaration; observed weekly fallback was not required. This is conditional observed-transaction forecasting, not proof of complete activity.

No generator, seed, row-level real/synthetic origin map or generation unit contract was found in the local repository or ZIP. The entire extended source is labelled synthetic/extended demo data. Original Olist BRL conventions do not establish the synthetic portion’s currency: the live revenue target and document use source revenue units — currency unconfirmed. The inspected ZIP SHA256 is ba2fda12c7a6487112ef0be1c4726959605589177715a1970720cd060649caf2. The actual extended observed aggregate used for training has SHA256 ffb168276a9fd8c716155f11ec493e7e1744d9ed5e4691a4425290ec2d364e83. No short legacy history was substituted.

## B. ML training and evaluation

Three fixed candidates were genuinely trained: StandardScaler + Ridge(alpha=100); RandomForestRegressor(48 trees, depth 7, minimum leaf 8, random seed 42, one worker); HistGradientBoostingRegressor(80 iterations, 7 leaves, learning rate .05, L2=5, seed 42, early stopping disabled). No dependencies were added for training. Native threads are bounded.

Ordered features: lag1, lag7, lag14, lag30, roll7, roll30, std7, std30, weekday_sin, weekday_cos, month_sin, month_cos. Every feature uses the preceding thirty observations or the known prediction date. Ridge scaling is fitted within the past training window. No future actuals enter recursive forecast steps.

Initial training starts 2016-09-04 and ends 2019-12-31 (1,214 calendar positions). Candidate selection uses expanding-origin validation during 2020 (366 days). The selected configuration is frozen before expanding-origin final holdout during 2021 (365 days). At each origin the estimator is refitted only on earlier observations; earlier holdout observations can enter later fits as they would in walk-forward operation. This is not one static model trained once on 2019. Seven/fourteen-day origins use a 28-day stride, thirty/ninety-day origins use their horizon stride. Scored target windows do not overlap within a horizon; unscored days are not claimed as evaluated. Each comparison uses identical dates and units.

Baselines: last observed daily target repeated; seasonal naive repeats the preceding seven observed daily targets. Selection minimizes the sum of candidate MAE divided by the stronger baseline MAE over validation horizons 7/14/30; 90-day and final holdout results do not choose a candidate. Qualification requires at least 5% lower MAE than the stronger naive, no more than 5% RMSE regression, at least 60% origin wins, at least three origins, and no negative outputs at every horizon in both phases. Neither selected candidate passed all gates.

MAE = mean absolute error; RMSE = square root of mean squared error; WAPE = 100 × sum absolute error / sum absolute actual; MASE uses the mean absolute seven-day difference from the phase’s preceding history, using only finite pairs. MAPE excludes zero actuals and records exclusions. R² and uncertainty intervals are not invented. The following tables include every candidate’s validation results and the frozen winner’s final results. All scores describe this synthetic source only.

### Orders

Selected candidate: **Ridge**. Final refit through 2021-12-31: 1,792 supervised rows; 123 invalid target/lag windows excluded after the initial thirty-day warm-up, from 1,945 calendar positions. Exclusion follows the declared missing policy, not tuning to improve scores.

| Phase | Horizon | Model | Origins / points | MAE | RMSE | WAPE % | MASE | MAPE % / zero exclusions |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| validation | 7d | Last value | 13 / 91 | 52.429 | 64.531 | 24.316 | 1.059 | 26.771 / 0 |
| validation | 7d | Seasonal naive (7d) | 13 / 91 | 36.582 | 46.816 | 16.967 | 0.739 | 18.683 / 0 |
| validation | 7d | Ridge | 13 / 91 | 28.633 | 37.403 | 13.280 | 0.579 | 15.149 / 0 |
| validation | 7d | Random Forest | 13 / 91 | 31.058 | 40.870 | 14.404 | 0.628 | 16.434 / 0 |
| validation | 7d | Histogram Gradient Boosting | 13 / 91 | 34.695 | 45.499 | 16.091 | 0.701 | 18.517 / 0 |
| validation | 14d | Last value | 13 / 182 | 69.857 | 103.609 | 30.728 | 1.411 | 34.237 / 0 |
| validation | 14d | Seasonal naive (7d) | 13 / 182 | 54.132 | 95.557 | 23.811 | 1.094 | 25.886 / 0 |
| validation | 14d | Ridge | 13 / 182 | 48.285 | 92.140 | 21.239 | 0.976 | 21.985 / 0 |
| validation | 14d | Random Forest | 13 / 182 | 51.292 | 93.114 | 22.562 | 1.036 | 24.036 / 0 |
| validation | 14d | Histogram Gradient Boosting | 13 / 182 | 53.036 | 93.157 | 23.329 | 1.072 | 25.635 / 0 |
| validation | 30d | Last value | 12 / 360 | 69.853 | 96.600 | 31.048 | 1.411 | 41.487 / 0 |
| validation | 30d | Seasonal naive (7d) | 12 / 360 | 66.697 | 94.690 | 29.645 | 1.348 | 37.046 / 0 |
| validation | 30d | Ridge | 12 / 360 | 55.606 | 86.551 | 24.715 | 1.124 | 33.368 / 0 |
| validation | 30d | Random Forest | 12 / 360 | 55.524 | 84.024 | 24.679 | 1.122 | 30.345 / 0 |
| validation | 30d | Histogram Gradient Boosting | 12 / 360 | 50.104 | 78.775 | 22.270 | 1.012 | 28.846 / 0 |
| validation | 90d | Last value | 4 / 360 | 80.869 | 107.742 | 35.944 | 1.634 | 48.075 / 0 |
| validation | 90d | Seasonal naive (7d) | 4 / 360 | 70.225 | 99.845 | 31.213 | 1.419 | 40.107 / 0 |
| validation | 90d | Ridge | 4 / 360 | 64.276 | 94.933 | 28.569 | 1.299 | 40.438 / 0 |
| validation | 90d | Random Forest | 4 / 360 | 51.322 | 80.928 | 22.811 | 1.037 | 29.539 / 0 |
| validation | 90d | Histogram Gradient Boosting | 4 / 360 | 50.376 | 78.780 | 22.391 | 1.018 | 30.331 / 0 |
| holdout | 7d | Last value | 13 / 91 | 57.802 | 76.504 | 26.182 | 1.130 | 26.592 / 0 |
| holdout | 7d | Seasonal naive (7d) | 13 / 91 | 48.549 | 65.302 | 21.991 | 0.949 | 22.633 / 0 |
| holdout | 7d | Ridge | 13 / 91 | 40.631 | 52.223 | 18.404 | 0.795 | 18.709 / 0 |
| holdout | 14d | Last value | 13 / 182 | 63.714 | 85.855 | 29.124 | 1.246 | 31.124 / 0 |
| holdout | 14d | Seasonal naive (7d) | 13 / 182 | 56.187 | 75.563 | 25.683 | 1.099 | 27.847 / 0 |
| holdout | 14d | Ridge | 13 / 182 | 44.353 | 58.194 | 20.274 | 0.867 | 22.325 / 0 |
| holdout | 30d | Last value | 12 / 360 | 58.297 | 92.670 | 26.511 | 1.140 | 29.597 / 0 |
| holdout | 30d | Seasonal naive (7d) | 12 / 360 | 56.967 | 89.605 | 25.906 | 1.114 | 29.528 / 0 |
| holdout | 30d | Ridge | 12 / 360 | 50.577 | 84.135 | 23.000 | 0.989 | 27.331 / 0 |
| holdout | 90d | Last value | 4 / 360 | 78.831 | 110.745 | 35.849 | 1.542 | 42.534 / 0 |
| holdout | 90d | Seasonal naive (7d) | 4 / 360 | 60.458 | 93.232 | 27.494 | 1.182 | 30.817 / 0 |
| holdout | 90d | Ridge | 4 / 360 | 58.658 | 90.089 | 26.675 | 1.147 | 33.666 / 0 |

Failed qualification checks:

- validation 14d: fewer than 60% origin wins.
- validation 90d: fewer than 60% origin wins.
- holdout 90d: less than 5% MAE improvement.
- holdout 90d: fewer than 60% origin wins.

Artifact: external experiment-v1/synthetic-orders-v1.joblib; identical reviewed serving copy in external registered-synthetic-v1/synthetic-orders-v1.joblib. SHA256: 1ffb35b50c247a91d2247602775e8a2077d645dccd9c99901133407024c7c4a8. Both outputs are outside the repository. The new model is used only through explicit synthetic registration; the six old deployed artifacts and inactive ABI Gradient Boosting candidate remain unchanged.

| Phase | Horizon | Excluded origins | Unscored days | Stronger baseline | Winner origin wins |
|---|---:|---:|---:|---|---:|
| validation | 7d | 0 | 275 | Seasonal naive (7d) | 12/13 |
| validation | 14d | 0 | 184 | Seasonal naive (7d) | 7/13 |
| validation | 30d | 0 | 6 | Seasonal naive (7d) | 10/12 |
| validation | 90d | 0 | 6 | Seasonal naive (7d) | 2/4 |
| holdout | 7d | 0 | 274 | Seasonal naive (7d) | 8/13 |
| holdout | 14d | 0 | 183 | Seasonal naive (7d) | 9/13 |
| holdout | 30d | 0 | 5 | Seasonal naive (7d) | 8/12 |
| holdout | 90d | 0 | 5 | Seasonal naive (7d) | 2/4 |

### Revenue

Selected candidate: **Histogram Gradient Boosting**. Final refit through 2021-12-31: 1,760 supervised rows; 155 invalid target/lag windows excluded after the initial thirty-day warm-up, from 1,945 calendar positions. Exclusion follows the declared missing policy, not tuning to improve scores.

| Phase | Horizon | Model | Origins / points | MAE | RMSE | WAPE % | MASE | MAPE % / zero exclusions |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| validation | 7d | Last value | 13 / 91 | 8902.525 | 11701.918 | 30.095 | 1.184 | 35.476 / 0 |
| validation | 7d | Seasonal naive (7d) | 13 / 91 | 6036.527 | 7597.225 | 20.406 | 0.803 | 23.048 / 0 |
| validation | 7d | Ridge | 13 / 91 | 5342.054 | 6725.490 | 18.059 | 0.711 | 21.136 / 0 |
| validation | 7d | Random Forest | 13 / 91 | 5422.922 | 6882.693 | 18.332 | 0.721 | 21.571 / 0 |
| validation | 7d | Histogram Gradient Boosting | 13 / 91 | 5069.195 | 6493.446 | 17.136 | 0.674 | 20.123 / 0 |
| validation | 14d | Last value | 13 / 182 | 10827.980 | 15894.767 | 34.621 | 1.440 | 41.998 / 0 |
| validation | 14d | Seasonal naive (7d) | 13 / 182 | 8392.971 | 13894.583 | 26.836 | 1.116 | 30.716 / 0 |
| validation | 14d | Ridge | 13 / 182 | 7568.470 | 13025.772 | 24.199 | 1.007 | 26.856 / 0 |
| validation | 14d | Random Forest | 13 / 182 | 7708.987 | 12967.418 | 24.649 | 1.025 | 28.110 / 0 |
| validation | 14d | Histogram Gradient Boosting | 13 / 182 | 7609.565 | 13087.992 | 24.331 | 1.012 | 27.181 / 0 |
| validation | 30d | Last value | 12 / 360 | 10968.584 | 14425.092 | 35.159 | 1.459 | 47.013 / 0 |
| validation | 30d | Seasonal naive (7d) | 12 / 360 | 10509.550 | 14177.145 | 33.687 | 1.398 | 43.088 / 0 |
| validation | 30d | Ridge | 12 / 360 | 8972.422 | 12983.200 | 28.760 | 1.194 | 39.706 / 0 |
| validation | 30d | Random Forest | 12 / 360 | 8515.673 | 12504.141 | 27.296 | 1.133 | 36.949 / 0 |
| validation | 30d | Histogram Gradient Boosting | 12 / 360 | 8163.332 | 12142.702 | 26.167 | 1.086 | 35.540 / 0 |
| validation | 90d | Last value | 4 / 360 | 11573.841 | 15234.163 | 37.099 | 1.540 | 49.717 / 0 |
| validation | 90d | Seasonal naive (7d) | 4 / 360 | 11502.764 | 15312.966 | 36.871 | 1.530 | 48.614 / 0 |
| validation | 90d | Ridge | 4 / 360 | 10880.501 | 14756.322 | 34.876 | 1.447 | 52.010 / 0 |
| validation | 90d | Random Forest | 4 / 360 | 8824.308 | 12619.159 | 28.285 | 1.174 | 41.128 / 0 |
| validation | 90d | Histogram Gradient Boosting | 4 / 360 | 7932.533 | 11960.895 | 25.427 | 1.055 | 36.993 / 0 |
| holdout | 7d | Last value | 13 / 91 | 9086.663 | 11822.832 | 29.989 | 1.164 | 31.494 / 0 |
| holdout | 7d | Seasonal naive (7d) | 13 / 91 | 7425.958 | 9688.080 | 24.508 | 0.951 | 25.808 / 0 |
| holdout | 7d | Histogram Gradient Boosting | 13 / 91 | 5983.995 | 7577.903 | 19.749 | 0.766 | 20.949 / 0 |
| holdout | 14d | Last value | 13 / 182 | 10064.422 | 13522.914 | 33.364 | 1.289 | 36.619 / 0 |
| holdout | 14d | Seasonal naive (7d) | 13 / 182 | 8467.229 | 11320.977 | 28.069 | 1.084 | 30.992 / 0 |
| holdout | 14d | Histogram Gradient Boosting | 13 / 182 | 6895.765 | 9129.731 | 22.860 | 0.883 | 25.900 / 0 |
| holdout | 30d | Last value | 12 / 360 | 10451.265 | 14306.955 | 34.391 | 1.338 | 40.779 / 0 |
| holdout | 30d | Seasonal naive (7d) | 12 / 360 | 8955.239 | 13311.708 | 29.468 | 1.147 | 34.223 / 0 |
| holdout | 30d | Histogram Gradient Boosting | 12 / 360 | 8240.300 | 11941.682 | 27.115 | 1.055 | 32.912 / 0 |
| holdout | 90d | Last value | 4 / 360 | 12469.090 | 16373.271 | 41.031 | 1.597 | 51.007 / 0 |
| holdout | 90d | Seasonal naive (7d) | 4 / 360 | 9378.479 | 13579.563 | 30.861 | 1.201 | 34.254 / 0 |
| holdout | 90d | Histogram Gradient Boosting | 4 / 360 | 8007.334 | 11478.565 | 26.349 | 1.025 | 33.188 / 0 |

Failed qualification checks:

- holdout 30d: fewer than 60% origin wins.

Artifact: external experiment-v1/synthetic-revenue-v1.joblib; identical reviewed serving copy in external registered-synthetic-v1/synthetic-revenue-v1.joblib. SHA256: 78fbdc7037644b8f4cc8d68159da36aea23cb518c9d27433a8b8befd16c2ae68. Both outputs are outside the repository. The new model is used only through explicit synthetic registration; the six old deployed artifacts and inactive ABI Gradient Boosting candidate remain unchanged.

| Phase | Horizon | Excluded origins | Unscored days | Stronger baseline | Winner origin wins |
|---|---:|---:|---:|---|---:|
| validation | 7d | 0 | 275 | Seasonal naive (7d) | 8/13 |
| validation | 14d | 0 | 184 | Seasonal naive (7d) | 8/13 |
| validation | 30d | 0 | 6 | Seasonal naive (7d) | 12/12 |
| validation | 90d | 0 | 6 | Seasonal naive (7d) | 4/4 |
| holdout | 7d | 0 | 274 | Seasonal naive (7d) | 8/13 |
| holdout | 14d | 0 | 183 | Seasonal naive (7d) | 11/13 |
| holdout | 30d | 0 | 5 | Seasonal naive (7d) | 5/12 |
| holdout | 90d | 0 | 5 | Seasonal naive (7d) | 3/4 |

The final serving refit occurs only after frozen evaluation and uses the validation-selected configuration. Its outputs at origins before that cutoff overlap fitted history and are explicitly described as fitted demonstrations, not independent backtests. Neither model establishes real-world Olist accuracy or accuracy for arbitrarily filtered subsets. A large average improvement does not override failed origin-stability gates.

## C. Actual forecast verification

Authenticated real browser/API verification used the selected Olist_Dataset_2016_2021 bundle. Both targets returned synthetic-v1, thirty actual tail points and thirty genuine model estimates, origin **2021-12-31**, forecast **2022-01-01–2022-01-30**. Selecting seven days changed the actual API request and chart to seven future points. Orders use Ridge with its fitted scaler; revenue uses Histogram Gradient Boosting in unconfirmed source units. The chart shows the historical boundary, dates, actual/forecast legend, model, unit, tooltips and explicit experimental status. Neither customer-count nor seller-delay forecasts were invented.

The serving registry binds audited bundle IDs, member IDs, source row counts and revisions; artifacts are hash-checked and feature-checked. Ordinary API requests never train or deserialize an uploaded unknown model. A request-local dataset/filter cache avoids redundant daily scans without cross-user reuse. Registered synthetic compatibility does not weaken legacy monetary-unit requirements for unrelated datasets. Missing/invalid latest windows fail honestly.

Browser evidence contains real route responses and displayed values, horizon changes, hovered future date, actual report download, CSV, and Dashboard order count **385,650**, with **zero page errors**. The last report-download browser workflow took 98.157 seconds. Independent test fixtures also verify dataset/owner separation and stale-result behavior. Latest-origin predictions are beyond the stored data, not beyond today in 2026; no 2026 forecast or current market condition is claimed.

## D. DOCX report generation

Endpoint: GET /api/reports/business-sales.docx. It reuses authenticated selected-dataset ownership and analytics filter dependencies and requires analyst-or-admin access. python-docx 1.2.0 creates valid OOXML; matplotlib 3.9.2 renders actual aggregate-only PNG charts locally. The response is attachment business-sales-analysis.docx with MIME application/vnd.openxmlformats-officedocument.wordprocessingml.document and no-store. The frontend checks MIME and ZIP signature, uses existing refresh transport, rejects changed session/dataset scope before download, and shows busy, success, failure and retry states.

Document sections: cover; executive summary; selected/full source scope and coverage; KPI definitions/table; observed revenue/orders; categories and product revenue/quantity tables; order status/cancellation; customer frequency and returning revenue; sample-qualified seller/delivery evidence; actual forecast and separate model-quality discussion; recommendations; methodology; processing diagram and appendix.

The downloaded real document contains **11 embedded images**: revenue, distinct orders, category revenue, status counts, purchase frequency, first/returning revenue, delivery rates, delivery duration, cancellation rate, actual order forecast, and aggregate processing workflow. It has **11 rendered pages**; native Word opened it successfully and all pages were visually inspected for clipping/overlap and readable tables. ZIP corruption test returned none; python-docx and browser XML/media tests parse the real downloaded body. LibreOffice is unavailable, so QA used installed Microsoft Word read-only/hidden plus PDF rasterization; Word is not a server dependency.

The delivered example applies **2021-01-01–2021-12-31**. Verified scope figures: **80,279 distinct orders**, **11,094,838.48 item revenue**, **138.20 AOV**, **91,190 item units**, **79,855 observed customers**, **421 repeat customers**, **2,446 active sellers**, **74,721 eligible completed deliveries**, **7.50% late**, and **389/80,279 canceled (0.48%)**. Source currency remains unconfirmed. Full-source coverage and selected scope are separate; historical totals exclude forecasts. Recommendations use actual structured evidence: 79,434/79,855 customers made one matching purchase (99.47%); investigate mature cohort retention with limitations, not guaranteed uplift. Seller investigation uses sufficient samples and makes no causal claim.

Missing cost/inventory semantics keep profit, margin, ROI and stockout claims unavailable. Raw customer IDs, seller UUIDs, private dataset IDs, local paths and credentials are excluded from document content. Generic non-sales data produces an honest profile. Duplicate-order single-table rows do not masquerade as distinct status/order counts. Final rendered QA exposed that safeguard also hiding valid bundle charts; the fix confines it to single-table data and adds a real nine-table report regression. CSV export implementation is preserved; actual filtered monthly CSV and synthetic fixture CSV still download with correct scope.

Reports use bounded aggregates, at most two concurrent generation jobs, a chart lock and a 120-second SQL budget with an actionable narrower-date-range retry. Existing interactive evidence retains its default query behavior. Opt-in report CTE materialization preserves calculations (exact regression equality); it addresses large repeated customer-query expansion. Measured runs varied with machine load: one full snapshot 102.94s including customer evidence 37.96s; earlier report download 72.185s, final corrected download 98.157s. These are observations, not a controlled optimization percentage. Long full-history requests can exceed the budget; choose a supported narrower period.

## E. Test results

Commands below run with the installed project Python (the preserved sanitized-tree virtual environment) or frontend installed Node dependencies. In command paths, external denotes the private task-evidence directory named abi-synthetic-word-20261015; replace it with that local absolute directory. Tests create disposable databases; the main populated bundle was not reimported or deleted.

| Working directory / command | Actual result |
|---|---|
| backend: python -m pytest tests -q (baseline) | 368 passed, 15 skipped |
| frontend: npx vitest run (baseline) | 95 passed, 19 files |
| ml: python -m pytest tests -q (baseline) | 21 passed |
| backend: python -m pytest tests -q (final corrected source) | 382 passed, 15 skipped; 185.50s |
| backend: python -m pytest tests/test_business_word.py tests/test_synthetic_serving.py -q (after final chart correction) | 13 passed |
| ml: python -m pytest tests -q | 28 passed |
| frontend: npx vitest run | 100 passed, 21 files |
| frontend: npx tsc -b | Passed |
| frontend: npx vite build | Passed; 54.37s |
| frontend: npx eslint . | Passed |
| browser: npx playwright test --config external/playwright.config.cjs | 28 passed, 2 gated skips; no added skips |
| browser: npx playwright test e2e/business-word.spec.ts --config external/playwright.config.cjs | 1 passed; actual DOCX/CSV/UI verification |
| backend: python -m pytest tests/test_free_api_policy.py --free-only-network -q | 25 passed; non-loopback traffic denied |
| node external/verify-main.cjs | Passed again after final correction: real selected-source forecasts, actual Word download, CSV, Dashboard and zero page errors |
| git diff --check | Passed |

The external Playwright configuration targets only the disposable test API on 8001 and existing test frontend on 5174; exact project test specifications are used. Browser execution sets PLAYWRIGHT_BROWSERS_PATH to the installed local cache and NODE_OPTIONS=--dns-result-order=ipv4first. The two gated cases require explicit private full ZIP reimport/persisted archive verification and were intentionally not enabled against the original populated database. Backend skips retain existing reference-data gates. No assertion was weakened or new failure converted to skip.

Covered regressions include folder/ZIP/single-file upload, multi-table selection/inspector/ownership, Admin/Analyst login, refresh/logout/route protection, filters and reset, Dashboard/customer/seller evidence, CSV, ML metrics/forecasts, segmentation/anomalies and local policy. Additional tests exercise real trained artifacts/features, unknown gaps, checksum failure, revision binding, MIME, DOCX content/media/scope, generic/duplicate grain, SQL deadline and semaphore cleanup. Intermediate fixture mistakes and localhost IPv6 connection failures were corrected; a sandbox temp-directory cleanup restriction required approved normal fixture execution. They are not hidden as skips.

## F. Files changed

Comparison is against the pre-task snapshot of 274 files, not against Git HEAD: older dirty source/tests/reports remain. Existing staged diff was empty and remains empty. This task changed the following existing local files:

| File | Reason |
|---|---|
| backend/app/analytics/business.py | Opt-in report SQL materialization; existing callers retain the same default. Exact fixture equality verifies unchanged evidence calculations. |
| backend/app/api/routes/ml.py | Additive dataset-bound synthetic inference and selected-model evidence; unmatched datasets retain existing serving compatibility. |
| backend/app/api/routes/reports.py | Add authenticated, authorized DOCX endpoint; existing CSV export implementation unchanged. |
| backend/requirements.txt | Declare only essential pinned local DOCX/plotting runtime packages. |
| frontend/src/components/ForecastQuality.tsx | Show selected synthetic model quality, baselines, failed gates, units and provenance distinctly from legacy offline evidence. |
| frontend/src/pages/Reports.tsx | Add genuine Word download, scope, busy/error/retry and success states; retain CSV controls. |
| frontend/src/pages/ml/RevenueForecast.tsx | Display actual selected synthetic model, target units and experimental warnings while retaining legacy route behavior. |
| frontend/src/services/api.ts | Add authenticated scope-safe binary DOCX download with MIME/ZIP checks and existing refresh transport. |
| frontend/tests/ForecastQuality.test.tsx | Verify explicit synthetic/unqualified quality display. |

New task files:

| File | Reason |
|---|---|
| backend/app/services/business_report.py | Read-only aggregate snapshot, actual charts, scoped recommendations, report deadline/concurrency bounds; correct bundle versus single-table grain. |
| backend/app/services/synthetic_features.py | One shared past-only feature/recursive prediction contract for offline training and live inference. |
| backend/app/services/synthetic_forecast.py | Explicit local registry, member/revision binding, checksum-verified new artifacts, complete latest daily window and honest unit/quality metadata. |
| backend/app/services/word_document.py | Pure in-memory formatted OOXML document builder from real bounded aggregates and chart media. |
| backend/tests/test_business_word.py | Real DOCX, filter values, owner/auth, CSV, generic/duplicate-grain honesty, bundle charts and report cleanup tests. |
| backend/tests/test_synthetic_serving.py | Real fitted artifact/checksum, dataset/revision binding, missing-value and request-cache contracts. |
| frontend/e2e/business-word.spec.ts | Actual browser download and document XML/media/filter values against a disposable uploaded fixture; CSV/Dashboard preservation. |
| frontend/tests/BusinessReport.test.tsx | Word-generation button busy, success/error and retry behavior. |
| frontend/tests/word-download.test.ts | MIME/ZIP validation and stale-session/dataset rejection in binary download. |
| ml/src/forecasting/train_synthetic.py | Reproducible bounded offline three-candidate temporal experiment on the full extended source; no serving-file writes. |
| ml/tests/test_synthetic_training.py | Past-only windows, unknown gaps, real estimator fits, equal evaluation dates and external output protection. |
| docs/SYNTHETIC_FORECAST_AND_WORD_REPORT.md | This sanitized implementation/evaluation/test/preservation handoff. |

Pre-existing untracked ForecastQuality and its test were modified additively above; they were not newly created by this task. Other earlier dirty analytics, model audit, forecast quality, customer/seller pages, tests and reports were retained unchanged relative to the local snapshot. Task-specific diff and full original dirty-tree inventory are saved in private local evidence. The only manifest change is backend/requirements.txt with python-docx==1.2.0 and matplotlib==3.9.2. Only python-docx and its required new lxml transitive package were installed; matplotlib was already installed and no existing package was broadly upgraded. No frontend lockfile changed.

## G. Preservation report

Branch: **integrate/abi-ml-backend**. HEAD: **fb5ed5608410dd8ce633eb0ff709e770ef2e872b**. No branch switch, reset, clean, stash, merge, rebase, commit, amend, push, fetch, pull or remote repository inspection occurred. All **274 baseline files** remain present. All **28 protected file hashes, sizes and modification timestamps** match: .env, original backend/sem5.db, six deployed serving weights and metadata, processed source CSVs, and inactive ABI Gradient Boosting candidate/support files. The candidate remains inactive. **27 upload/auth-related snapshot files** are unchanged; upload limits and authentication architecture were not edited. Git staging remains empty and diff --check passes.

The serving populated verification database remained in place and was inspected read-only for source/metrics. Its final SQLite quick_check is **ok** and it contains **80** app_dataset records. Main Admin selection was intentionally switched using the existing select workflow; authentication/session state can also change normally. A byte-identical whole active WAL database is not claimed. Source CSV equality was independently hashed for all nine tables; original developer database is byte-identical. Synthetic mutation tests used disposable copies/databases. Experiment weights, private registry and aggregate training/evaluation evidence are outside the tracked repository. Report generation is read-only and uses no persistent raw report file server-side. Test tokens were redacted from task failure logs.

## H. Localhost links

Main frontend on 5173 and main API on 8000 remain running with the preserved populated database and explicit process-local synthetic registry. The unrelated existing test frontend is preserved. Task-owned test API on 8001 is stopped after tests.

- http://localhost:5173/login — frontend login; actual Admin and Analyst authentication tested.
- http://localhost:5173/dashboard — actual populated selected-bundle Dashboard verified.
- http://localhost:5173/datasets — folder/ZIP controls and existing import routes retained.
- http://localhost:5173/ml/metrics — selected model/evaluation evidence.
- http://localhost:5173/ml/order-forecast — real experimental synthetic orders.
- http://localhost:5173/ml/revenue-forecast — real experimental synthetic source-unit revenue.
- http://localhost:5173/reports?date_from=2021-01-01&date_to=2021-12-31 — verified Word-report example scope.
- http://localhost:8000/health and http://localhost:8000/docs — live API.

After a future backend restart, preserve the current DATABASE_URL and trusted ML_DATA_DIR and set ML_SYNTHETIC_REGISTRY to the external registered-synthetic-v1/registry.json before running python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 from backend. This task deliberately did not put private paths in .env. The private restart helper contains the current audited local paths and defaults, not publication material. New signing keys invalidate old browser sessions; log in again if needed. Frontend startup from frontend remains npm run dev -- --host 127.0.0.1 --port 5173 --strictPort. Existing listeners must be identified before any restart; do not kill unrelated processes.

## I. Remaining blockers / limits

Both selected models are **experimental/unqualified** under the declared gates; that does not block clearly labelled demo inference. Generator metadata, row-level origin provenance, transaction completeness and synthetic currency contract are missing. Historical gaps remain unknown. No calibrated interval or customer/seller future model is provided. Current stored source ends in 2021; changing filters can yield earlier origins or different scale, for which selected-scope quality is not established. A local explicit external registration is needed for future serving restarts/fresh clones; external private source bindings and artifacts are not silently published. Large report scopes may require narrowing because of the documented SQL deadline. These limits are visible rather than replaced by fake success.

## J. Final verdict

**SYNTHETIC FORECAST RUNS BUT IS EXPERIMENTAL/UNQUALIFIED; WORD REPORT VERIFIED.**
