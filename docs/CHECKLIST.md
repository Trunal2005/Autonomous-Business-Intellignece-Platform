# Master Prompt Checklist

## Phase 1 — Environment & Repository Setup
- [x] 1. Confirm OS and current working directory
- [x] 2. Locate Downloads; check sem-5 exists or create
- [x] 3. Inspect olist dataset files (9 CSVs)
- [x] 4. Check Git, Node, Python, pip, Docker installed (gh not used as requested)
- [x] 5. GitHub repo Sem-5 connected via HTTPS (origin set)
- [x] 6. Local Git initialized, main branch, pushed initial work
- [x] 7. Project structure created
- [x] 8. .gitignore, .env.example, README.md created
- [x] 9. Initial commits pushed
- [x] 10. Verify remote and report status

## Phase 2 — Dataset Exploration & Contracts
- [x] 2.1 Dataset inventory (headers/rows)
- [x] 2.2 Profiling: nulls per file, date ranges
- [x] 2.3 Dataset summary/profile/dictionary drafts
- [x] 2.4 Warehouse design draft (facts/dims, grain)
- [x] 2.5 API contracts defined
- [x] 2.6 ML I/O schemas + statuses defined
- [x] 2.7 RBAC matrix draft
- [x] 2.8 Decisions, Project Plan, Status docs

## Phase 3 — Core Frontend & Backend
- [x] 3.1 Design system scaffolds (Tailwind, base styles)
- [x] 3.2 Landing page + routing
- [x] 3.3 Frontend Vite/TS/Tailwind config
- [x] 3.4 Backend FastAPI skeleton (/health)
- [x] 3.5 Backend/ML/frontend requirements
- [x] 3.6 Backend core (config, settings, logging)
- [x] 3.7 Database setup (SQLAlchemy base, session, models init)
- [x] 3.8 Auth & RBAC implemented (JWT login, hashed passwords, role deps, auth_gate, FE login flow)
- [x] 3.9 Dashboard endpoints stubs (real data later)
- [x] 3.10 Frontend layout (shell, nav, theme) + routes
- [x] 3.11 Connect FE to BE health (api service)

## Phase 4 — Warehouse & Descriptive Analytics
- [x] 4.1 ETL implemented (backend/app/services/etl.py) - reads external olist, validates, cleans, loads
- [x] 4.2 Star schema tables created + loaded (SQLAlchemy models)
- [x] 4.3 Data quality checks (ETL warnings) + integrity
- [x] 4.4 Verified KPIs computed from real data (docs/KPIs.md)
- [x] 4.5 Dashboard wired to real KPI/chart APIs (Recharts)

## Phase 5 — ML Parallel
- [x] 5.1 ML folder structure complete (src/{common,data_processing,forecasting,prediction,customer_segmentation,product_segmentation,anomaly_detection,evaluation})
- [x] 5.2 Preprocessing implemented (ml/src/data_processing/build_datasets.py -> 4 processed datasets)
- [x] 5.3 Real baselines implemented (no more stubs)
- [x] 5.4 Forecasting, Sales prediction, Customer/Product segmentation, Anomaly all implemented
- [x] 5.5 Training/eval run on real data; metrics in docs/ML_BASELINES.md + ml/models/*.metadata.json
- [x] 5.6 ML backend interfaces + status (backend/app/services/ml.py, /api/ml/*)

## Phase 6 — AI Business Insights
- [x] 6.1 Controlled data retrieval implemented (ai_assistant/context.py; role-scoped, no arbitrary SQL)
- [x] 6.2 LLM integration implemented (provider-agnostic: Ollama + Disabled)
- [x] 6.3 Permission-aware context + deterministic fallback (llm_unavailable summary)
- [x] 6.4 Assistant UI implemented (/insights page with examples)

## Phase 7 — Premium Interactions
- [x] 7.1 Cursor-responsive lighting (design) lighting
- [x] 7.2 Hover cards
- [x] 7.3 Chart animations (Recharts transitions; lightweight)
- [x] 7.4 Scroll-triggered (FadeIn)
- [x] 7.5 Smooth transitions + reduced-motion + a11y (minimal) + reduced-motion + a11y

## Phase 8 — ML Integration
- [x] 8.1 Wire evaluated models (forecast, predict/sales, segments, anomalies endpoints)
- [x] 8.2 Validate schemas, honest statuses (metadata-driven; artifact-aware status)
- [x] 8.3 Wire ML pages in frontend to new endpoints (forecast chart, segments, anomalies, predict form) — /models
- [x] 8.4 Analytics page wired to real /api/analytics series — /analytics

## Phase 9 — Testing & Docs
- [x] 9.1 Backend tests written (auth, users, reports, admin, health, dashboard, ml) + dev requirements
- [x] 9.2 Run tests, fix (26 backend + 8 ML passed)
- [x] 9.3 Complete docs (core docs added), setup verification
- [x] 9.4 Frontend component tests (Vitest, 5) + browser E2E (Playwright, 3)

## Phase 10 — GitHub Completion
- [x] 10.1 Final checks (secrets/dataset excluded; structure clean) (secrets/dataset)
- [x] 10.2 Commits, push, report (pushed incrementally)

## Phase 11 — Extended (no "optional" left)
- [x] 11.1 DB-backed users (app_user table) with seeded admin/analyst
- [x] 11.2 Refresh tokens (access + refresh, `type` claim) + `/api/auth/refresh`
- [x] 11.3 User management API (`/api/users`: me, password, list, role)
- [x] 11.4 CSV reports API (`/api/reports/export`) — permission-aware
- [x] 11.5 Admin API (`/api/admin/system/status`, `/api/admin/data/etl/status`)
- [x] 11.6 Frontend `/reports` and `/admin` pages + nav links (admin-only)
- [x] 11.7 Dashboard date-range + order-status filters
- [x] 11.8 Frontend API client: auto-refresh on 401
- [x] 11.9 Tests expanded: backend 26, ML pipeline 8, frontend 5, E2E 3
- [x] 11.10 Docs updated (API, RBAC, TESTING, STATUS, .env.example)
- [x] 11.11 Postgres-ready dialect-aware SQL (`month_expr`) + docs/POSTGRES.md
- [x] 11.12 LLM provider status endpoint (`GET /api/insights/status`)
- [x] 11.13 ESLint configured (flat config + typescript-eslint) + `npm run lint`
- [x] 11.14 Route code-splitting + vendor/charts/motion chunks (no >500 kB chunk)
- [x] 11.15 Playwright E2E (3) — fixed a nested-<Router> runtime bug
- [x] 11.16 PROJECT_PLAN.md synced to completion

## Phase 12 — Two-role RBAC (admin + analyst, no viewer)
- [x] 12.1 Backend role model: `VALID_ROLES`/`ROLE_RANK`, `validate_role()`, seed admin+analyst, legacy `viewer`→`analyst` migration (never auto-promoted)
- [x] 12.2 Last-admin protection: `LastAdminError` → 409 on role change/demote
- [x] 12.3 Router-level enforcement in `app/main.py`: business routers → `require_bi_user`, `/api/admin` → `require_admin`; `AUTH_REQUIRED` default true
- [x] 12.4 New admin endpoints: warehouse status, ML status, settings (no secrets)
- [x] 12.5 Reports + insights: both roles, backend-authorized (`get_current_user`)
- [x] 12.6 Frontend: role helpers, `RequireAdmin` + `AccessDenied`, AdminLayout, BI/Admin nav split, 6 admin pages, viewer references removed
- [x] 12.7 Tests: backend matrix suite (`test_rbac.py`), rewritten role tests, `RequireAdmin` frontend tests, analyst/admin Playwright flows
- [x] 12.8 Docs: RBAC.md rewritten; README, STATUS, TESTING, API, SRS, DECISIONS, CHECKLIST, .env.example updated



























## Phase 13 � Priority 2 Analytics
- [x] 13.1 Analytics Layout and Routing (6 BI sections)
- [x] 13.2 FilterBar implementation and shared useFilters hook
- [x] 13.3 Filter-aware backend metric layer (metrics.py)
- [x] 13.4 Cross-endpoint metric reconciliation and median SQL fixes
- [x] 13.5 UI pages: Sales, Orders, Customers, Products, Sellers, Delivery

## Phase 14 � Priority 3 ML Integration
- [x] 14.1 Backend Product Segmentation API (/api/ml/product-segmentation) with dynamic K-Means inference
- [x] 14.2 Frontend Product Segmentation UI with filter-aware clustering
- [x] 14.3 Backend Revenue Forecast API support (/api/ml/forecast?target=revenue)
- [x] 14.4 Frontend Revenue Forecast UI with horizon selection
- [x] 14.5 Dedicated ML Metrics section (/ml/metrics) with honest model availability and artifact evaluation metadata
- [x] 14.6 ML Documentation updated to reflect current state
