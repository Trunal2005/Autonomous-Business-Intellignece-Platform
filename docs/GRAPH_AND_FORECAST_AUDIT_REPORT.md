# Forensic graph and model validation — 14 October 2026

## A. Graph authenticity inventory

See [GRAPH_AUTHENTICITY_INVENTORY.md](GRAPH_AUTHENTICITY_INVENTORY.md): 41 visualization/KPI/table groups with route, component, source, formula, grain, filters, units, data nature, evidence, verdict and remaining action. VERIFIED is scoped to the stated calculation/test; PARTIALLY VERIFIED does not certify predictive quality, every real-data bucket or arbitrary uploaded semantics. No random/demo chart arrays were found serving as business observations. Static labels, illustrative question examples and chart palettes are not production numerical data.

Two newly proven calculation defects were corrected: selected warehouse category count was the length of the top-20 display list; seller trend leaders were chosen from a truncated set of seller-period rows. Categories now count the full filtered scope. Seller leaders now rank the full filtered item revenue before chart truncation, use full grouping keys, and disclose the 400-point display limit. No data sampling or forecast algorithm replacement was introduced.

## B. Independent KPI and data reconciliation

The current Admin-selected populated bundle has 1,550,922 source rows across nine tables. Independent read-only SQLite queries used profile-to-storage column mappings and separate order/item/customer grains, not production metric functions. All six KPI values matched the authenticated API, and browser order/revenue values, date filter/reset, trend totals and status totals reconciled. Source currency is unconfirmed; values below are source units, not newly certified BRL.

| Metric | All selected records | January 2018 | API/UI result |
|---|---:|---:|---|
| total_orders | 99,441.0000 | 7,269.0000 | Matched; counts exact, money tolerance 0.01 |
| total_revenue | 13,591,643.7000 | 950,030.3600 | Matched; counts exact, money tolerance 0.01 |
| avg_order_value | 136.6805 | 130.6962 | Matched; counts exact, money tolerance 0.01 |
| items_sold | 112,650.0000 | 8,208.0000 | Matched; counts exact, money tolerance 0.01 |
| unique_customers | 96,096.0000 | 7,166.0000 | Matched; counts exact, money tolerance 0.01 |
| active_sellers | 3,095.0000 | 970.0000 | Matched; counts exact, money tolerance 0.01 |

AOV is qualifying item prices divided by matching distinct orders. Item revenue excludes freight and is never added to payments. Payment/review fan-out fixtures remain green. Null revenue periods remain null and are not plotted as observed zeros. Summing known item revenue across returned periods reconciles with the full selected item total.

Independent stable-customer SQL matched 96,096 observed customers, 2,997 repeat customers, and 3.118756% repeat rate. Independent eligible-order SQL matched 96,470 eligible completed deliveries, 8.112367% late and 91.887633% on-time. Valid timestamps and nonnegative purchase/delivery/estimate intervals are required; missing delivery values never become zero-day deliveries.

## C. Actual local model inventory

Only the six previously trusted serving artifacts were deserialized. No candidate artifact was loaded. Every source/artifact hash, runtime preprocessing object and recorded feature schema was inspected. Matching the legacy partial fingerprint and reproducing metrics supports source consistency, not independent proof of the original fit or real/synthetic composition.

| Task / serving endpoint | Actual artifact and algorithm | Ordered features / preprocessing | Evaluation and limitations |
|---|---|---|---|
| sales_forecast_orders: `/api/ml/forecast?target=orders` | `sales_forecast_orders.joblib`; LinearRegression (lag/rolling features) | lag1, lag7, lag14, lag30, roll7, roll30 | Daily distinct matching orders; no monetary requirement. Frozen chronological replay below; no independently persisted fit cutoff. |
| sales_forecast_revenue: `/api/ml/forecast?target=revenue` | `sales_forecast_revenue.joblib`; LinearRegression (lag/rolling features) | lag1, lag7, lag14, lag30, roll7, roll30 | Daily qualifying item revenue; trained contract requires confirmed BRL. Current uploaded bundle remains blocked for unconfirmed currency. |
| sales_prediction: `/api/ml/predict/sales` | `sales_prediction.joblib`; best of [LinearRegression, RandomForest] -> linear_regression | purchase_month, purchase_weekday, purchase_hour, n_items, customer_state, product_category_name | One checkout scenario, not a time-series forecast. Saved StandardScaler/OneHotEncoder/LinearRegression pipeline. Replayed random 80/20 seed42; the same test split selected the candidate, no independent final test documented. |
| customer_segmentation: `/api/ml/segments/customers` | `customer_segmentation.joblib`; KMeans (RFM, standardized) | recency_days, frequency, monetary_log | Saved log-monetary transform, StandardScaler and KMeans. Historical assignments only. Silhouette selected k on the same source/sample, not external accuracy or future customer count. |
| product_segmentation: `/api/ml/product-segmentation` | `product_segmentation.joblib`; KMeans (product engagement, standardized) | qty_log, revenue_log, avg_price, product_weight_g | Saved log quantity/revenue, StandardScaler and KMeans. Training imputation statistics are not saved; incomplete weight/price inputs fail honestly. No demand prediction. |
| anomaly_detection: `/api/ml/anomalies` | `anomaly_detection.joblib`; IsolationForest | orders, revenue | Saved IsolationForest on observed daily orders/revenue. Historical decision scores, not fraud probabilities. No labels or independent supervised quality evaluation. |

Artifact checksums (unchanged before/after):

| Artifact | SHA-256 |
|---|---|
| `sales_forecast_orders.joblib` | `95c188d7e35acb244c4fd538e2c50faea9b887956e09da73e71909b7b2f09ed0` |
| `sales_forecast_revenue.joblib` | `070c3cb93115f81638abbaa8638de22a6bd893ec21efdf9e3ed11793a8681a27` |
| `sales_prediction.joblib` | `547f7dff1f4915b515f338b7ea40482dc797d9649c427f972c34d05a7f1c089e` |
| `customer_segmentation.joblib` | `ac18f39a2c4bd7f21650c95a13fa32d231862995932d22f36f2eb62340e17e88` |
| `product_segmentation.joblib` | `6dafbd6e69e8769128efaed7a75dfeb8b3c6b0353bae696cc3a5990d4cf1e996` |
| `anomaly_detection.joblib` | `7408083bf2d54c343ba9ca40a0b67b4b15a0537d44c23122d104fd6843f529c6` |

The Gradient Boosting source candidate remains inactive. Its legitimate training/preprocessing pipeline, composition/provenance, reproducible split and approved serving contract remain unverified. No fabricated training code or accuracy was supplied.

## D. Forecast quality: defensible scope and actual results

Local processed daily source: 634 observed dates, 2016-09-04 through 2018-10-17, with 140 missing calendar days. This is not the user’s extended 2016–2021/approximately eight-year transaction history. The saved artifacts’ exact original fit-data provenance is not independently certified.

The inspected training script builds lag1, lag7, lag14, lag30, roll7 and roll30 from prior observations, then chronologically splits 483 feature rows / 121 test rows (80/20 after removing the initial 30). The reconstructed declared cutoff is 2018-05-17; the held-out source spans 2018-05-18–2018-10-17. Lag features in that legacy training source advance across observed rows, including calendar gaps. There is no saved imputer/scaler for the forecast model. No new fit, model selection or artifact write occurred.

The frozen saved estimator was replayed one step and recursively on disjoint complete-calendar windows entirely after the declared cutoff. Future actuals do not enter a fixed-origin recursive forecast; a later origin may use observations that have become historical by that origin. Each model/baseline row uses the exact same actual dates and target units. This is a source-declared holdout reconstruction, not proof of an independently audited original fit log or selected-dataset accuracy.

| Target | Legacy one-step MAE / RMSE | Reproduced recorded values |
|---|---|---|
| sales_forecast_orders | 35.2808 / 44.0684 | True |
| sales_forecast_revenue | 5390.8137 / 6860.6506 | True |

The legacy revenue MAPE excludes 16 zero actuals. Order MAPE is about 302.93% despite no exact zeros; near-zero actuals can dominate percentage errors. One-step results use observed prior test values and must not be advertised as 30-day recursive quality.

| Target | Horizon / windows / points | Model MAE / RMSE | WAPE % / MASE | Last-value MAE / RMSE | Seasonal naive MAE / RMSE | MAE verdict |
|---|---|---|---|---|---|---|
| orders | 7d / 15 / 105 | 58.0597 / 72.264 | 28.9953 / 1.7945 | 55.2571 / 67.6137 | 61.1619 / 78.7889 | Does not beat both baselines |
| orders | 14d / 7 / 98 | 68.3834 / 81.0208 | 32.4453 / 2.1135 | 72.6224 / 84.9686 | 77.4388 / 92.1792 | Lower than both |
| orders | 30d / 3 / 90 | 69.8957 / 84.8509 | 33.379 / 2.1603 | 49.6 / 59.4486 | 85.2222 / 105.4944 | Does not beat both baselines |
| orders | 90d / 1 / 90 | 65.3355 / 79.0489 | 31.2013 / 2.0193 | 55.9778 / 67.113 | 80.8 / 99.9008 | Does not beat both baselines |
| revenue | 7d / 15 / 105 | 8230.7892 / 10345.8007 | 29.5718 / 1.4819 | 7010.1886 / 8484.8894 | 8610.9344 / 11304.5743 | Does not beat both baselines |
| revenue | 14d / 7 / 98 | 9590.8647 / 11507.9408 | 32.5947 / 1.7268 | 7911.2701 / 9834.7737 | 10924.627 / 13384.9216 | Does not beat both baselines |
| revenue | 30d / 3 / 90 | 9677.4765 / 11718.66 | 32.642 / 1.7424 | 6954.0792 / 8519.5674 | 11687.8747 / 15080.4419 | Does not beat both baselines |
| revenue | 90d / 1 / 90 | 9408.1214 / 11356.6006 | 31.7335 / 1.6939 | 7535.7728 / 9272.2661 | 12127.9622 / 15355.7716 | Does not beat both baselines |

Naive last-value repeats the last observed training/history value over the horizon. Seasonal naive repeats the final seven daily history values. MAE = mean absolute error; RMSE = sqrt mean squared error; WAPE = sum absolute error / sum absolute actual ×100, unavailable with zero denominator; MASE = MAE / mean seven-calendar-day absolute difference in the declared training span, unavailable with invalid/zero scale. MAPE uses only nonzero actuals and reports exclusion counts; near-zero values remain. R² and calibrated intervals were not claimed.

7/14/30/90-day windows contain respectively 105/98/90/90 points; 16/23/31/31 declared holdout observations are outside complete disjoint windows. The 90-day result has one origin only. Explicit start/end dates and all metric/exclusion values are in the external `model-replay-final.json` evidence. Do not compare different horizons as though they shared an identical population.

**Quality conclusion: weak/inconclusive for business deployment.** Orders beat both baselines only at 14 days on this replay; 7/30/90-day orders and all tested revenue horizons lose to last-value MAE. Both targets beat seasonal-naive MAE in these windows. The UI now displays both baselines and an explicit weaker-model message rather than hiding the simpler baseline. Saved models were not replaced. Missing fit/provenance evidence prevents a fully independent out-of-sample quality claim.

Real future inference was verified through the serving API/browser for orders on the populated selected data, with actual history ending 2018-01-31, future predictions beginning 2018-02-01 and real 30→7-day requests. These are future dates relative to the selected forecast origin, not necessarily after today. Both saved order/revenue artifacts also execute in the disposable confirmed-BRL synthetic fixture; this proves execution, not predictive accuracy. The main unconfirmed-currency revenue forecast is correctly blocked. No backtest line, calibrated interval, fake customer forecast or seller-delay prediction is drawn.

## E. Recommendation validation

The selected full-history revenue response has no equal-window cards and no actionable revenue recommendation; incomplete latest observation coverage is not silently zero-filled to generate a tip.

Customer evidence: 93,099 of 96,096 observed customers have one matching order (96.881244%). The deterministic rule requires at least 20 customers and at least 70% single-purchase. It suggests investigating mature acquisition cohorts and categories before testing re-engagement; censoring and filter limitations are stated. No reason for non-return or revenue uplift is invented.

Seller evidence: highest qualifying group has 24 eligible orders, 9 late (37.5%), mean positive lateness 7.6186 days, versus the 8.112367% dataset baseline. Minimum sample is 20, and the recommendation requires at least baseline+10 percentage points. Seller identity is deliberately omitted here. Association does not assign seller responsibility; multi-seller orders count once per seller but once in the dataset baseline. No carrier/inventory causation is asserted.

All recommendations use structured deterministic business evidence, work with paid services and Ollama disabled, and preserve no-action states. Synthetic threshold/chronology/no-fanout fixtures and independent real-data customer/seller aggregates support the rules.

## F. Tests and real browser verification

Baseline before authored fixes: backend 357 passed / 15 skipped; frontend 88 passed / 17 files. ML initially had 6 passed / 2 sandbox temporary-directory setup errors; rerun outside that sandbox passed 8/8 without code changes.

Final commands (working directories in parentheses; existing installed Python/Node runtimes were used, no dependency installation):

| Command | Actual result | Evidence log |
|---|---|---|
| `python -m pytest -q --free-only-network` (backend) | 359 passed, 15 skipped; includes free-only policy tests | backend-complete.log |
| `python -m pytest -q tests/test_graph_audit.py tests/test_model_audit.py` (backend) | 11 passed | targeted-final.log |
| `python -m pytest -q tests/test_analytics.py tests/test_dashboard.py tests/test_reports.py tests/test_dataset_regression.py --reference-db <original-reference-db> --free-only-network` (backend) | 18 passed on disposable read-only-source backup | reference-graphs.log |
| `python -m pytest -q` (ml) | 8 passed; no training | baseline-ml-verified.log |
| `node node_modules/vitest/vitest.mjs run` (frontend) | 91 passed, 18 files | frontend-complete.log |
| `npm run lint` (frontend) | Exit 0 | lint-complete.log |
| `npm run build` (frontend; includes tsc -b) | Exit 0 | build-complete.log |
| `node node_modules/@playwright/test/cli.js test --workers=1 --config <evidence>/playwright.config.cjs --output <evidence>/browser-final-output` (frontend; backend port8001) | 27 passed, 2 gated archive cases skipped | browser-final.log |
| `node <evidence>/verify-main.cjs` | Independent SQL/API/rendered KPI check, date/reset, actual forecast boundaries/horizons, correct currency block, session reload and folder/ZIP controls | main-browser-final.log |
| `node <evidence>/verify-model-audit.cjs` | Real model-detail replay API, actual quality table and visible weak-baseline verdict | model-audit-browser-final.log |

The original reference warehouse is opened mode=ro by tests.database_fixture, backed up into temporary storage, and private users/selections/uploads are stripped from that copy. Tests never mutate the original. Reference graph group passed before the final seller-trend query revision; the final complete browser suite and exact seller-limit fixture cover that revision.

The two browser skips are deliberately gated new full-size archive import and historical complete-bundle identity cases. The currently selected populated bundle was verified separately above; no real archive was reimported. The existing separate fresh-clone portability suite was not run in this local audit. Backend artifact/reference gates are disclosed rather than counted as successes.

Intermediate failures: the added version display initially replaced an existing exact model label, which broke the unchanged browser assertion. The label was restored and serving version/warnings added separately; the full suite then passed. An external main-browser currency regex used incorrect capitalization and an external audit-table role lookup did not find its horizontally scrollable header; corrected literal/DOM selectors verified the actual behavior. No existing assertions were weakened or converted into skips.

Performance: independent six-KPI SQL aggregate pass took 1.703 seconds. Measured current API elapsed seconds: all=7.971, date_filtered=1.562, reset=9.339, revenue=3.945, customers=9.356, sellers=2.927. These are local observed timings under concurrent test load, not a controlled before/after optimization claim. Model audit remains explicit/on-demand. No source rows or coverage were reduced to claim speed.

## G. Changed files and pre-existing work

At task start: eight modified tracked files and four untracked files, all preserved in a 263-file source snapshot outside the repository. This included earlier analytical fixes and the model-audit implementation; they are not claimed as authored by this run.

New changes authored in this run:

- `backend/app/analytics/metrics.py`: full-scope category count; full-scope seller ranking before bounded trend rows, full seller grouping keys.
- `backend/app/services/model_audit.py`: add 90-day evaluation, actual evaluated end date and excluded-point counts.
- `frontend/src/components/ModelAudit.tsx`: show naive/seasonal baselines, MASE, defined metric policies, honest MAE comparison, evaluated dates and schema-version invalidation.
- `frontend/src/pages/ml/RevenueForecast.tsx`, `frontend/src/services/api.ts`: expose actual serving model version and backend warnings, retain original model label and chart behavior.
- `frontend/src/pages/analytics/Sellers.tsx`: disclose complete ranking scope and latest chart-point cap.
- `backend/tests/test_graph_audit.py`: exact 22-versus-top20 category and older high-revenue seller fixtures.
- `backend/tests/test_model_audit.py`: extend existing chronology/window assertions without weakening them.
- `frontend/tests/ModelAudit.test.tsx`, `frontend/tests/ForecastExperience.test.tsx`: weak-baseline/no-window/schema-change/version-warning checks.
- `docs/GRAPH_AUTHENTICITY_INVENTORY.md`, this report: evidence and explicit limits.

Folder upload, ZIP parsing, authentication/session implementation, upload limits, dependency files, .env, original database, trained artifacts and metadata were not authored or rewritten by this task.

## H. Preservation and local running state

Branch remains `integrate/abi-ml-backend`; HEAD remains `fb5ed5608410dd8ce633eb0ff709e770ef2e872b`. No commit, push, fetch, pull, clone, merge, rebase or branch switch occurred. Nothing was staged. All task-start files remain; unrelated modifications were not reset. Original .env, developer database and all protected serving/candidate/model-metadata hashes, sizes and modification times are checked against task-start records.

The same existing populated serving DB was retained. Main-app analysis used read-only aggregate operations; no real bundle import, deletion, schema/currency edit, migration or destructive test occurred. Its file-wide hash was not captured at this task start, so no unsupported bit-identical serving-DB claim is made; selected data reconciles independently before/after. Disposable uploads were confined to the synthetic API fixture.

The backend was normally restarted on the verified same populated DB. Only process-local ML_DATA_DIR now points to the fingerprint-matching local processed training sources so read-only model audit can run; .env and those files are unchanged. Forecast/segmentation inference remains scoped to selected database data, not those offline CSVs. A fresh signing key means old sessions must sign in again.

Local links, verified through real login/protected requests: [Login](http://localhost:5173/login), [Dashboard](http://localhost:5173/dashboard), [Dataset Manager](http://localhost:5173/datasets), [ML Metrics](http://localhost:5173/ml/metrics), [health](http://localhost:8000/health), [API docs](http://localhost:8000/docs). Main services are left running on 5173/8000. Temporary API8001 is stopped after checks; the already-present test UI5174 is not treated as a task-owned process to kill.

External evidence directory is task-owned and contains baseline/final logs, snapshots, independent aggregate calculations, model replay JSON, sanitized failure traces and browser screenshots. Credential-bearing trace content is redacted before handoff; reports contain no tokens, passwords or raw customer records.

## I. Readiness verdict

**NOT READY — GRAPH OR MODEL VALIDATION REMAINS INCOMPLETE.**

The implemented graph defects are fixed and tested, and the local application remains operational for review. This verdict concerns analytical/model certification: original fit provenance and cutoff are not independently established, the legacy training series contains calendar gaps, simple last-value forecasts outperform most evaluated horizons, 90-day quality has only one replay origin, and several inventory rows remain only partially independently verified. Current model inference is genuine but not a guarantee of useful future performance.

To change that verdict, obtain legitimate training-data/provenance and original fit/split evidence, or authorize a separate temporal retraining/evaluation study with an untouched final holdout and appropriate baselines. Do not automatically promote an experimental model. Independently resolve the remaining inventory limitations before claiming every graph/model is certified. No customer-volume/seller-delay model, profit/margin, causal explanation, confidence band or accuracy result was fabricated.
