"""Hosted imports finish in their request; local asynchronous imports remain covered separately."""
from tests.test_datasets import isolated  # noqa: F401
from tests.test_dataset_bundles import upload
from app.core.config import settings
from app.services import bundle_jobs


def test_hosted_bundle_is_persisted_synchronously_without_a_background_job(isolated, auth, monkeypatch):
    client, factory = isolated
    # Initialize the disposable catalog before simulating production's no-request-DDL policy.
    assert client.get('/api/datasets', headers=auth).status_code == 200
    monkeypatch.setattr(settings, 'VERCEL', True)
    monkeypatch.setattr(bundle_jobs, 'ASYNC_BYTES', 0)
    def forbidden(*args, **kwargs):
        raise AssertionError('Hosted request must not submit a process-local background job')
    monkeypatch.setattr(bundle_jobs.POOL, 'submit', forbidden)
    response = upload(client, auth)
    assert response.status_code == 201, response.text
    ident = response.json()['dataset_id']
    assert response.json()['status'] == 'READY'
    assert ident in {d['dataset_id'] for d in client.get('/api/datasets', headers=auth).json()['datasets']}
    assert not any(job['status'] in {'QUEUED', 'PROCESSING'} for job in bundle_jobs.JOBS.values())


def test_oversized_request_is_rejected_before_multipart_parsing(client):
    from app.services import datasets
    from app.core.upload_budget import FRAMING_BYTES
    response = client.post('/api/datasets/upload', content=b'', headers={'Content-Length': str(datasets.MAX_BYTES + FRAMING_BYTES + 1)})
    assert response.status_code == 413
