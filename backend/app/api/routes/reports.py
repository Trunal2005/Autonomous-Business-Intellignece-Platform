import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.analytics import metrics
from app.analytics.filters import Filters, analytics_filters
from app.api.deps import get_current_user
from app.database.deps import get_db
from app.services import users as user_service

router = APIRouter()

# Business reports are shared BI functionality: admin and analyst alike.
REPORT_ACCESS = {
    "kpis": "analyst",
    "monthly_revenue": "analyst",
    "revenue_by_category": "analyst",
    "orders_by_status": "analyst",
    "dataset_rows": "analyst",
    "numeric_statistics": "analyst",
}


def _to_csv(rows: list[dict]) -> str:
    if not rows:
        return ""
    buf = io.StringIO()
    writer = csv.writer(buf)
    keys = list(rows[0].keys())
    def safe(value):
        return "'" + value if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@")) else value
    # Headers are also untrusted upload strings, not just cell values.
    writer.writerow([safe(k) for k in keys])
    writer.writerows([[safe(row.get(k)) for k in keys] for row in rows])
    return buf.getvalue()


def _build_rows(report: str, db: Session, filters: Filters) -> list[dict]:
    ds = db.info.get("dataset")
    if report in {"dataset_rows", "numeric_statistics"}:
        if not ds or ds.adapter != "tabular":
            raise HTTPException(422, "This export requires an uploaded tabular dataset.")
        from app.analytics.tabular import TabularSource
        source = TabularSource(db, filters)
        if report == "numeric_statistics":
            return [source.numeric_stats(c) for c in source.columns if c["dtype"] == "numeric"]
        return source.rows(source.statement(*[source.by_name[c["name"]].label(c["name"]) for c in source.columns]).order_by(source.table.c.row_id))
    if report == "kpis":
        data = metrics.kpis(db, filters)
        return [{"metric": k, "value": v} for k, v in data.items()]
    if report == "monthly_revenue":
        return metrics.time_series(db, filters, "month")
    if report == "revenue_by_category":
        return metrics.revenue_by_category(db, filters)
    if report == "orders_by_status":
        return metrics.orders_by_status(db, filters)
    raise HTTPException(status_code=404, detail=f"unknown report '{report}'")


@router.get("/export")
def export_report(
    report: str = Query("kpis"),
    f: Filters = Depends(analytics_filters),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if report not in REPORT_ACCESS:
        raise HTTPException(status_code=404, detail=f"unknown report '{report}'")

    if not user_service.role_at_least(user, REPORT_ACCESS[report]):
        raise HTTPException(
            status_code=403, detail=f"Requires {REPORT_ACCESS[report]} role to export '{report}'"
        )

    rows = _build_rows(report, db, f)
    csv_text = _to_csv(rows)

    return StreamingResponse(
        iter([csv_text]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{report}.csv"',
                 "X-Dataset-ID": db.info["dataset"].id},
    )
