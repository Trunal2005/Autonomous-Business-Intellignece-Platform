"""Warehouse status for uploaded bundles, using disposable test databases."""

from tests.test_datasets import isolated, upload as upload_table, SALES  # noqa: F401


def test_warehouse_status_handles_bundle_overview_and_members(isolated, auth, analyst_auth):
    client, _ = isolated
    files = {
        "folder/orders.csv": (
            b"order_id,customer_id,order_status,order_purchase_timestamp\n"
            b"o1,c1,delivered,2025-01-01T21:15:19+00:00\n"
            b"o2,c2,shipped,2025-01-03T23:52:08+00:00\n"
        ),
        "folder/items.csv": (
            b"order_id,order_item_id,product_id,seller_id,price\n"
            b"o1,1,p1,s1,30\no1,2,p2,s1,70\no2,1,p1,s2,90\n"
        ),
    }
    response = client.post(
        "/api/datasets/bundles/upload", headers=auth,
        data={"name": "Synthetic warehouse status", "paths": list(files)},
        files=[("files", (path.split("/")[-1], raw, "text/csv"))
               for path, raw in files.items()],
    )
    assert response.status_code == 201, response.text
    bundle = response.json()
    assert bundle["relational_analysis"]["supported"] is True
    scoped = {**auth, "X-Dataset-ID": bundle["dataset_id"]}
    response = client.get("/api/admin/warehouse/status", headers=scoped)
    assert response.status_code == 200, response.text
    status = response.json()
    assert status["dataset_id"] == bundle["dataset_id"]
    assert status["warehouse_tables"] == {"folder/items.csv": 3, "folder/orders.csv": 2}
    assert status["schema_tables"] == ["folder/items.csv", "folder/orders.csv"]
    assert status["total_rows"] == 5
    assert status["expected_tables"] == status["loaded_tables"] == 2
    assert status["complete"] is True
    assert status["min_date"] == "2025-01-01"
    assert status["max_date"] == "2025-01-03"
    assert client.get("/api/admin/warehouse/status", headers={
        **analyst_auth, "X-Dataset-ID": bundle["dataset_id"]}).status_code == 403
    assert client.get("/api/admin/warehouse/status").status_code == 401

    member = next(t for t in bundle["tables"] if t["relative_path"] == "folder/orders.csv")
    response = client.get("/api/admin/warehouse/status", headers={
        **auth, "X-Dataset-ID": member["dataset_id"]})
    assert response.status_code == 200, response.text
    assert response.json()["total_rows"] == 2


def test_warehouse_status_keeps_private_table_ownership(isolated, auth, analyst_auth):
    client, _ = isolated
    private = upload_table(client, analyst_auth, SALES)
    assert client.get("/api/admin/warehouse/status", headers={
        **auth, "X-Dataset-ID": private["dataset_id"]}).status_code == 403
