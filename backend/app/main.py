from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.deps import auth_gate, require_bi_user, require_admin
from app.api.routes import dashboard, ml, insights, analytics, auth, users, reports, admin, datasets
from app.core.upload_budget import UploadBudgetMiddleware
from app.core.config import settings

app = FastAPI(title="Sem5 BI Platform", version="0.1.0")
app.add_middleware(UploadBudgetMiddleware)

if settings.production:
    @app.exception_handler(Exception)
    async def production_error(_request, exc):
        import logging
        from fastapi.responses import JSONResponse
        logging.getLogger("abi").error("Request failed (%s); check configured services.", type(exc).__name__)
        return JSONResponse({"detail": "Service operation failed. Check deployment health and retry."}, status_code=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_protected = [Depends(auth_gate)]

# Business intelligence routers: admin + analyst (anonymous -> 401).
_bi = [Depends(auth_gate), Depends(require_bi_user), Depends(datasets.dataset_context)]
# Platform administration routers: admin only (analyst -> 403).
_admin = [Depends(auth_gate), Depends(require_admin)]

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"], dependencies=_bi)
app.include_router(ml.router, prefix="/api/ml", tags=["ml"], dependencies=_bi)
app.include_router(insights.router, prefix="/api/insights", tags=["insights"], dependencies=_bi)
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"], dependencies=_bi)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"], dependencies=_protected)
app.include_router(reports.router, prefix="/api/reports", tags=["reports"], dependencies=_bi)
app.include_router(admin.router, prefix="/api/admin", tags=["admin"], dependencies=_admin)
app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"], dependencies=[Depends(auth_gate), Depends(require_bi_user)])

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/ready")
def readiness():
    from sqlalchemy import inspect, text
    from fastapi.responses import JSONResponse
    from app.database.session import engine
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            required = {"app_user", "app_dataset", "app_dataset_selection", "app_dataset_bundle_table"}
            if not required.issubset(inspect(connection).get_table_names()):
                return JSONResponse({"status": "not_ready", "reason": "Database schema needs operator initialization."}, status_code=503)
        return {"status": "ready", "database": engine.dialect.name}
    except Exception:
        return JSONResponse({"status": "not_ready", "reason": "Database unavailable; check private database configuration."}, status_code=503)
