"""Request-local SQL evidence from existing, read-only analytics reports."""

from datetime import datetime, timezone
from time import perf_counter

from sqlalchemy import event

from app.analytics import metrics


def query_evidence(db, dataset, filters, report):
    queries = []
    connection = db.connection()

    def before_execute(conn, cursor, statement, parameters, context, executemany):
        context._warehouse_query_started = perf_counter()

    def after_execute(conn, cursor, statement, parameters, context, executemany):
        normalized = statement.lstrip().lower()
        # Catalog lookups and reflection are not business analytics queries.
        if not normalized.startswith("select") or any(
            name in normalized for name in ("app_dataset", "sqlite_master", "sqlite_temp_master")
        ):
            return
        queries.append({
            "sql": statement,
            "parameters": parameters,
            "execution_ms": round((perf_counter() - context._warehouse_query_started) * 1000, 3),
        })

    started = perf_counter()
    event.listen(connection, "before_cursor_execute", before_execute)
    event.listen(connection, "after_cursor_execute", after_execute)
    try:
        if report == "monthly_revenue":
            title = "Monthly revenue and orders — latest 12 observed months"
            rows = metrics.time_series(db, filters, "month", limit=12)
        elif report == "orders_by_status":
            title = "Order counts by status"
            rows = metrics.orders_by_status(db, filters)
        else:
            title = "Top 10 categories by item revenue"
            rows = metrics.revenue_by_category(db, filters, limit=10)
    finally:
        # Never capture another request's SQL or leave a connection listener behind.
        event.remove(connection, "before_cursor_execute", before_execute)
        event.remove(connection, "after_cursor_execute", after_execute)

    mappings = []
    if dataset.adapter == "tabular":
        from app.services.datasets import storage_table
        if dataset.source_type == "bundle":
            from app.analytics.bundle import members
            sources = [(child, table) for child, _, table in members(db, dataset).values()]
        else:
            sources = [(dataset, storage_table(dataset, db))]
        for child, table in sources:
            if any(table.name in query["sql"] for query in queries):
                mappings.append({"table": table.name, "source": child.name,
                                 "columns": [{"stored": c["storage"], "original": c["name"]}
                                             for c in child.profile["columns"]]})

    return {
        "dataset_id": dataset.id, "dataset_name": dataset.name, "report": report,
        "title": title, "filters": filters.as_dict(),
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "elapsed_ms": round((perf_counter() - started) * 1000, 3),
        "queries": queries, "rows": rows, "column_mappings": mappings,
        "status": "executed" if queries else "not_applicable",
        "reason": None if queries else "The selected table has no confirmed fields for this report.",
    }
