"""SQL shown in Warehouse must be real, scoped, read-only analytics SQL."""
from sqlalchemy import event

from tests.test_datasets import isolated, upload  # noqa: F401


def commerce_bundle(client, auth):
    files = {
        "orders.csv": b"order_id,customer_id,order_status,order_purchase_timestamp\no1,c1,delivered,2025-01-01\no2,c2,shipped,2025-01-03\n",
        "items.csv": b"order_id,order_item_id,product_id,seller_id,price\no1,1,p1,s1,30\no1,2,p2,s1,70\no2,1,p1,s2,90\n",
        "products.csv": b"product_id,product_category_name\np1,Books\np2,Office\n",
    }
    response = client.post("/api/datasets/bundles/upload", headers=auth,
                           data={"name": "SQL evidence fixture", "paths": list(files)},
                           files=[("files", (name, raw, "text/csv")) for name, raw in files.items()])
    assert response.status_code == 201, response.text
    return response.json()


def test_sql_evidence_matches_cursor_execution_and_shared_analytics(isolated, auth):
    client, factory = isolated
    bundle = commerce_bundle(client, auth)
    scoped = {**auth, "X-Dataset-ID": bundle["dataset_id"]}
    executed = []
    engine = factory.kw["bind"]

    def observed(conn, cursor, statement, parameters, context, executemany):
        executed.append(statement)

    event.listen(engine, "after_cursor_execute", observed)
    try:
        response = client.get("/api/admin/warehouse/queries?report=monthly_revenue", headers=scoped)
    finally:
        event.remove(engine, "after_cursor_execute", observed)
    assert response.status_code == 200, response.text
    evidence = response.json()
    assert evidence["dataset_id"] == bundle["dataset_id"]
    assert evidence["status"] == "executed"
    assert len(evidence["queries"]) == 2
    assert all(q["sql"] in executed for q in evidence["queries"])
    assert all(q["sql"].lstrip().upper().startswith("SELECT") for q in evidence["queries"])
    assert all("app_dataset" not in q["sql"] and "raw_source" not in q["sql"] for q in evidence["queries"])
    assert evidence["rows"] == [{"period": "2025-01", "orders": 2, "rows": 2, "revenue": 190.0}]
    assert evidence["rows"] == client.get("/api/dashboard/monthly-revenue", headers=scoped).json()["series"]
    assert {m["source"] for m in evidence["column_mappings"]} == {"orders.csv", "items.csv"}
    assert any(c["original"] == "price" for m in evidence["column_mappings"] for c in m["columns"])
    assert evidence["executed_at"] and evidence["elapsed_ms"] >= 0

    filtered = client.get("/api/admin/warehouse/queries?report=monthly_revenue&date_from=2025-01-03", headers=scoped).json()
    assert filtered["rows"] == [{"period": "2025-01", "orders": 1, "rows": 1, "revenue": 90.0}]
    assert any("2025-01-03" in q["parameters"] for q in filtered["queries"])
    assert all("2025-01-03" not in q["sql"] for q in filtered["queries"])

    statuses = client.get("/api/admin/warehouse/queries?report=orders_by_status", headers=scoped).json()
    assert len(statuses["queries"]) == 1
    assert sorted(statuses["rows"], key=lambda r: r["status"]) == [
        {"status": "delivered", "orders": 1}, {"status": "shipped", "orders": 1}]
    categories = client.get("/api/admin/warehouse/queries?report=revenue_by_category", headers=scoped).json()
    assert categories["rows"] == [{"category": "Books", "revenue": 120.0, "items": 2},
                                   {"category": "Office", "revenue": 70.0, "items": 1}]
    assert client.get("/api/admin/warehouse/status", headers=scoped).json()["total_rows"] == 7


def test_sql_evidence_preserves_permissions_and_rejects_arbitrary_sql(isolated, auth, analyst_auth):
    client, _ = isolated
    private = upload(client, analyst_auth)
    assert client.get("/api/admin/warehouse/queries").status_code == 401
    assert client.get("/api/admin/warehouse/queries", headers=analyst_auth).status_code == 403
    assert client.get("/api/admin/warehouse/queries", headers={
        **auth, "X-Dataset-ID": private["dataset_id"]}).status_code == 403
    owned = upload(client, auth)
    scoped = {**auth, "X-Dataset-ID": owned["dataset_id"]}
    assert client.get("/api/admin/warehouse/queries?report=DROP%20TABLE%20fact_orders", headers=scoped).status_code == 422
    assert client.get("/api/admin/warehouse/queries?sql=DELETE%20FROM%20fact_orders", headers=scoped).status_code == 422
    assert client.get("/api/admin/warehouse/queries", headers=scoped).json()["rows"][0]["revenue"] == 1000


def test_sql_evidence_does_not_invent_unsupported_queries(isolated, auth):
    client, _ = isolated
    table = upload(client, auth, b"student_id,marks\ns1,80\ns2,60\n")
    response = client.get("/api/admin/warehouse/queries?report=orders_by_status", headers={
        **auth, "X-Dataset-ID": table["dataset_id"]})
    assert response.status_code == 200
    assert response.json()["status"] == "not_applicable"
    assert response.json()["queries"] == response.json()["rows"] == []
