# Local setup

## Runtime and dependencies

Release verification used Node.js 20.19.4 and Python 3.13.5 on Windows.
Use the repository's pinned dependencies; Python 3.14 is not required for this
release. Docker and PostgreSQL are optional. From the repository root:

```powershell
cd backend
python -m pip install -r requirements-dev.txt
cd ../ml
python -m pip install -r requirements-dev.txt
cd ../frontend
npm install
cd ..
```

## Environment

Copy `.env.example` to an ignored `.env` if needed. Its example DATABASE_URL
targets PostgreSQL; for the verified SQLite workflow set
`DATABASE_URL=sqlite:///./sem5.db` and always start the API from `backend`.
Choose a local signing key and local account passwords. Existing users keep their
stored password hashes; changing seed settings does not reset existing accounts.
Never commit `.env`, private uploads, databases or raw datasets.

## API and frontend

In one terminal, from the repository root:

```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

In another terminal:

```powershell
cd frontend
npm run dev
```

UI: http://localhost:5173. API health: http://localhost:8000/health.
API docs: http://localhost:8000/docs. Default local demonstration accounts are
listed in README.md. Both Admin and Analyst can upload/select private datasets
in Dataset Manager. No reference warehouse or training is required for uploaded
analytics; missing model artifacts are reported honestly.

## Optional Olist reference and existing models

Place the reference CSVs outside the repository at
`%USERPROFILE%\Downloads\olist`, or set `OLIST_DIR` to their directory. From
`backend`, explicitly run `python -m app.services.etl` to load the reference.
This reads source data without modifying it. Use the already trained local
`ml/models/*.joblib` artifacts for ML. These binaries are intentionally ignored.
Only when artifacts are absent and reference training is explicitly intended,
run `python run_all.py` from `ml`. The six artifacts cover five feature families;
uploads and release tests never invoke training.

## Verification

See TESTING.md for all test commands. Full reference/model verification requires
the loaded reference and local saved binaries; a fresh clone alone is insufficient.
Playwright's existing launcher uses a disposable SQLite backup. Known upload,
model and environment boundaries are documented in UNIVERSAL_DATASETS.md.
