# Deploy ABI on Vercel

This guide applies to the root `vercel.json` in this repository. It does not claim
a public deployment or production database has already been created. Keep the
existing local `.env`, populated SQLite database and models unchanged.

## Architecture and verified platform contract

Vercel Services builds `frontend/` (Vite) and `backend/` (FastAPI) separately.
The top-level route table sends `/api`, `/api/*`, `/health`, `/health/*`, `/docs`
and `/openapi.json` to the backend without stripping the original path. ReDoc and
Swagger's auxiliary paths also remain on the backend. Other
requests go to the frontend. Its filesystem-first rule serves real assets before
the SPA fallback, so refresh on `/dashboard` or `/ml/metrics` returns the app.
No API 404 is rewritten to frontend HTML.

The backend export is `vercel_entry:app`; Python is pinned to 3.13, matching the
existing serving environment. It wraps the original app without launching
Uvicorn. Matplotlib uses temporary cache storage. Model training is never exposed
as an HTTP service. Existing route contracts and auth/dataset guards remain.

Official documentation checked October 27, 2026:

- [Services](https://vercel.com/docs/services) currently describes `services` as
  Beta on all plans. This is the current supported configuration, not the older
  `experimentalServices` format. Beta availability is not a GA guarantee.
- [Services configuration](https://vercel.com/docs/services/config-reference)
  places build settings and function settings inside each service.
- [Routing](https://vercel.com/docs/services/routing) preserves the request path.
- [Python](https://vercel.com/docs/functions/runtimes/python) supports ASGI and
  Python 3.13. Standard Python bundles allow 500 MB uncompressed.
- [Function limits](https://vercel.com/docs/functions/limitations) include a
  4.5 MB request/response limit and a 300-second Hobby maximum with Fluid Compute.
  This project does not enable paid/large-function features to conceal limits.

## 1. Verify GitHub

Open https://github.com/Trunal2005/Autonomous-Business-Intellignece-Platform and
select the branch/commit recorded in the implementation verification report.
Confirm root `vercel.json`, `backend/vercel_entry.py`, `backend/build_vercel.py`
and this guide exist. Do not upload `.env`, SQLite files, datasets or trained
binary models to public GitHub. Existing model metadata is not a substitute for
trained artifacts.

## 2. Create persistent PostgreSQL

Choose a legitimate free PostgreSQL plan and do not select an upgrade. For
example [Neon Free](https://neon.com/pricing) currently advertises no credit card
requirement and limited storage/compute. Verify the current plan in your account.
No database has been provisioned by this task. The existing approximately 1 GB
local database is not assumed to fit a free database once uploads, raw source
bytes, indexes and PostgreSQL overhead are included.

Create a database, then copy its **pooled** PostgreSQL URL with TLS into a private
environment variable `DATABASE_URL`. Use `postgresql+psycopg2://...?...sslmode=require`
(use `&sslmode=require` when other query parameters already exist). `postgres://`
URLs are normalized. Do not disable TLS. SQLAlchemy uses NullPool in production
so individual function instances do not retain their own idle connection pools;
the provider's connection pool manages shared capacity.

Use a separate database/branch for Preview deployments. Do not connect unreviewed
preview code to real production records. Uploaded typed rows, raw bytes, schema
metadata and selections are stored in PostgreSQL, not a function's filesystem.
Temporary upload files live only for the active bounded request.

## 3. Initialize schema and the administrator once

Install existing backend requirements in your local environment. Set private
`DATABASE_URL`, `SECRET_KEY` and `ENV=production` in that PowerShell process.
Use your provider's secure connection-variable instructions; never paste a real
credential into a committed script. `SECRET_KEY` must be an independent random
value of at least 32 characters. Keep `AUTH_REQUIRED=true`.

From `backend/`, run:

```powershell
python -m app.services.initialize_production
```

The command prompts for a username and hidden password. Use 16 characters or
more, within bcrypt's 72-byte limit. It creates catalog/auth tables additively and
one administrator. It does not reset an existing user's password, seed public
development accounts, import Olist or drop/rebuild warehouse tables. Create an
Analyst through authenticated User Management afterwards.

Do not run `python -m app.services.etl` against production. Its destructive
warehouse rebuild is explicitly refused in production. Large reference-data
migration requires a separate reviewed offline import, sufficient DB quota and
ownership/provenance checks. Existing local records are not silently migrated.

## 4. Prepare the six trusted model artifacts

The six local serving artifacts are separate from the synthetic/extended preview
registry. Package only reviewed files from `ml/models`; do not use user-uploaded
pickles. From the repository root:

```powershell
python scripts/package_serving_models.py --output "$env:TEMP\abi-serving-models.zip"
```

Choose a new filename if it already exists. The script never trains or loads a
pickle. It includes six `.joblib` files, their metadata and SHA256 manifest, not
training CSVs, credentials or the private synthetic registry. Keep the zip private.
Store it in an operator-controlled private file store offering a direct HTTPS
download URL (a sufficiently long-lived signed URL is acceptable). Do not make
raw datasets or model artifacts public to obtain a URL. No storage service is
automatically provisioned, paid or otherwise. Alternatively use your secure CI
artifact distribution process with an equivalent direct URL.

Set private build variables `ML_ARTIFACT_BUNDLE_URL` and
`ML_ARTIFACT_BUNDLE_SHA256` to the package URL and printed digest. Refresh expired
signed URLs before redeployment. The build refuses missing/incorrect bundles,
unexpected filenames, oversized archives and mismatched checksums. Runtime
checksums are checked again before deserialization. Hashes establish integrity,
not the safety of a model from an untrusted origin.

The external synthetic registry contains local dataset identities and cannot be
copied blindly into a fresh production database. Its two extended-data models
are **not** automatically promoted or replaced by the six legacy artifacts.
Their production use requires a separate reviewed dataset-bound registration.
Legacy metadata metrics do not establish new-upload or annual accuracy.

## 5. Import into Vercel

1. Sign into Vercel and choose **Add New > Project**.
2. Import the GitHub repository above. Select your own **Personal/Hobby** team
   unless your organization has explicitly authorized another team. Do not create
   a paid team for this task.
3. Keep **Root Directory `./`**, the repository root. Do not set it to `frontend`.
4. Let Vercel detect the service configuration. If the import asks for an overall
   preset, use **Other**; service frameworks are explicitly Vite and FastAPI.
5. Do not override the root build/output settings. They belong to each service.
   Frontend uses `npm ci`, `npm run build`, output `dist`. Backend uses the pinned
   requirements and `python build_vercel.py`.
6. Configure the following variables for the intended Production/Preview scope.

| Variable | Scope / value policy |
|---|---|
| `ENV` | Backend: `production` |
| `DATABASE_URL` | Backend private: pooled PostgreSQL URL with TLS |
| `SECRET_KEY` | Backend private: stable random secret, at least 32 characters |
| `AUTH_REQUIRED` | Backend: `true` |
| `VITE_AUTH_REQUIRED` | Frontend public: `true` |
| `ENABLE_LLM_ASSISTANT` | Backend: `false` on Vercel |
| `ML_ARTIFACT_BUNDLE_URL` | Private build-time trusted package URL |
| `ML_ARTIFACT_BUNDLE_SHA256` | Build-time expected package digest |
| `CORS_ORIGINS` | Optional JSON array of exact HTTPS origins; otherwise production uses `[]` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional backend token lifetime |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | Optional backend refresh lifetime |

Leave **`VITE_API_BASE_URL` unset** for same-origin calls. Never copy the local
`http://localhost:8000` value to Vercel. `VITE_*` values are public build inputs;
never put database passwords, signing secrets or artifact URLs in them.
`VERCEL` is platform-supplied. Leave `ML_MODELS_DIR`, `ML_DATA_DIR`,
`ML_SYNTHETIC_REGISTRY`, `OLLAMA_BASE_URL` and `OLIST_DIR` unset unless following a
separately reviewed deployment design. Public dev passwords are not used to seed
production. `BOOTSTRAP_*` variables belong only to the one-time local bootstrap
command and need not be stored in Vercel.

7. Deploy. Inspect both service build logs. Do not treat a green frontend build
   as backend/ML success. Keep the Hobby plan and stay within its quotas.

## 6. Verify the actual deployment

Use the real URL Vercel assigns; this guide does not invent one.

- `/health`: process liveness, expected `{"status":"ok"}`.
- `/health/ready`: database connection and required catalog/auth tables; 503 means
  schema initialization or private DB configuration is incomplete.
- `/docs`: confirm real backend API documentation, not an HTML SPA fallback.
- `/login`: use the privately initialized administrator. Invalid credentials
  must fail. Create an Analyst and verify admin routes reject that role.
- `/datasets`: upload a small deterministic CSV or supported folder/ZIP within
  the displayed hosted limits. Reload/redeploy and confirm it persists.
- `/dashboard`: select that dataset and reconcile observed metrics with its rows.
  Apply/reset supported filters. Refresh the direct URL.
- Warehouse: run read-only SQL reports as Admin. Verify actual queries/results.
- ML Metrics: inspect real artifact/runtime readiness. With a compatible dataset,
  execute supported inference and check dated finite outputs and declared units.
  Missing/unsupported tasks must explain the reason. No synthetic forecast should
  appear merely because a dataset has a similar name.
- Reports: generate a bounded Word report and CSV export. Verify ownership,
  selected scope and formula escaping. Narrow filters if the response is too big.
- Insights: numerical/deterministic answers remain available. A laptop's Ollama
  is not reachable from Vercel; no paid/cloud LLM is silently substituted.
- Log out, refresh and verify protected routes are inaccessible.

## Hosted limits versus local capabilities

The existing 200 MiB local folder/ZIP workflow is preserved. Hosted requests allow
**3 MiB combined file payload**, with 1 MiB reserved for multipart framing below
the platform ceiling. Expanded archives/workbooks are capped at 16 MiB; hosted
imports allow at most 50,000 rows and 500,000 cells overall, with a cooperative
60-second processing budget. All hosted bundle imports finish synchronously and
commit to PostgreSQL; they never return a process-local background job ID.
These budgets are safety ceilings, not performance guarantees.

Large imports require local execution or separately provisioned durable storage
and worker infrastructure. No chunking/object-store workflow is claimed here.
DOCX/CSV responses above 4 MiB fail clearly with a narrower-scope/local-export
instruction. Some other large API responses can still meet the platform limit;
test representative workloads and use bounded scopes. Concurrency/load and
PostgreSQL integration require verification on the actual chosen services.

## Troubleshooting and safe redeployment

| Symptom | Check |
|---|---|
| API returns frontend HTML | Root directory must be `./`; API rewrite precedes catch-all |
| API 404 | Original `/api/...` prefix is preserved; inspect `/docs` |
| Startup/configuration error | PostgreSQL, strong stable secret and authentication are required; no SQLite fallback |
| Readiness 503 | Provider pooled URL, TLS, connectivity, and one-time initialization |
| Login fails after redeploy | Same database and signing secret; existing passwords are never auto-reset |
| Missing model/build failure | Bundle URL expiry, SHA256, exact six-file metadata/artifact pairs and package versions |
| Python bundle too large | Inspect actual uncompressed build size; exclude datasets/tests/caches, keep inference dependencies; do not claim success by removing ML |
| Upload 413 | Select less than the displayed hosted payload limit; large imports remain local |
| Import timeout | Smaller dataset; no guarantee from a successful tiny upload |
| Report 413/timeout | Narrow date/row scope or generate locally |
| Ollama unavailable | Expected hosted limitation; deterministic Insights works without it |

Commit/push reviewed source, then redeploy the same initialized DB and private
variables. Build/runtime never launches destructive ETL. Keep database backups
and an independent Preview DB. Do not automatically import the developer SQLite
file. Existing direct dependency versions are retained. `constraints-vercel.txt`
locks the verified Linux Python 3.13 resolution without removing ML dependencies.
The wheel-size audit is approximately 404.2 MiB expanded, excluding generated
bytecode and deployment overhead; the actual assembled Vercel bundle still needs
an authenticated hosted build check.
