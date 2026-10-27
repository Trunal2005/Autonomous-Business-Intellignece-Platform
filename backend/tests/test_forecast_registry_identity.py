"""Explicit identity refresh must retain member revisions and real recursion."""
import json
from uuid import uuid4

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge

from tests.test_datasets import isolated  # noqa: F401
from tests.test_olist_bundle import upload
from tests.test_forecast_history import extended, register
from app.services import synthetic_forecast as serving
from app.services.synthetic_features import features


def test_explicit_registry_identity_refresh_uses_real_model_and_keeps_guards(isolated, auth, analyst_auth, tmp_path, monkeypatch):
    client, factory = isolated
    dataset = upload(client, auth, data=extended()).json()
    ident = dataset['dataset_id']
    headers = {**auth, 'X-Dataset-ID': ident}
    original_path, artifact = register(factory, ident, tmp_path, monkeypatch)
    registered = json.loads(original_path.read_text())
    contract = registered['datasets'].pop(ident)
    registered['datasets'][str(uuid4())] = contract
    original_path.write_text(json.dumps(registered))
    original_bytes = original_path.read_bytes()
    artifact_bytes = artifact.read_bytes()

    # A display-name match cannot bind a different registry identity.
    unmatched = client.get('/api/ml/forecast?target=orders&periods=365', headers=headers).json()
    assert unmatched['synthetic_registration']['status'] == 'different_dataset'
    assert not unmatched.get('synthetic')
    assert unmatched.get('model', {}).get('name') != 'registered-test-orders'

    # Only an explicit local operator registration supplies the exact selected
    # identity/member contract. The original registration/artifact stay intact.
    refreshed_path = tmp_path / 'verified-local-registration.json'
    registered['datasets'][ident] = contract
    refreshed_path.write_text(json.dumps(registered))
    monkeypatch.setenv('ML_SYNTHETIC_REGISTRY', str(refreshed_path))
    original_load = serving._artifact
    calls, outputs = [], []

    class AuditedEstimator:
        def __init__(self, model):
            assert isinstance(model, Ridge)
            self.model = model

        def predict(self, rows):
            calls.extend(np.asarray(rows).tolist())
            result = self.model.predict(rows)
            outputs.extend(result.tolist())
            return result

    monkeypatch.setattr(serving, '_artifact', lambda *args: AuditedEstimator(original_load(*args)))
    body = client.get('/api/ml/forecast?target=orders&periods=365', headers=headers).json()
    assert body['status'] == 'available' and body['synthetic'] is True
    assert body['selected_scope']['dataset_id'] == ident == body['dataset_id']
    assert body['synthetic_registration']['status'] == 'matches'
    assert body['model'] == {'name': 'registered-test-orders', 'version': 'synthetic-v1',
                             'algorithm': 'Ridge regression with fitted standard scaler'}
    assert body['quality']['qualified_synthetic_demo'] is False
    assert len(calls) == len(outputs) == len(body['forecast_series']) == 365
    assert [p['orders'] for p in body['forecast_series']] == [round(v, 2) for v in outputs]
    assert body['forecast_series'][0]['date'] == '2022-01-01'
    assert body['forecast_series'][-1]['date'] == '2022-12-31'
    history = [p['orders'] for p in body['history_tail']]
    for i, row in enumerate(calls):
        # Every ordered lag, rolling statistic and calendar feature uses only
        # original history + previous unrounded predictions, never future actuals.
        day = pd.Timestamp(body['forecast_series'][i]['date'])
        np.testing.assert_array_equal(row, features(history + outputs[:i], day))
    repeated = client.get('/api/ml/forecast?target=orders&periods=365', headers=headers).json()
    assert repeated['forecast_series'] == body['forecast_series']
    assert client.get('/api/ml/forecast', headers={**analyst_auth, 'X-Dataset-ID': ident}).status_code == 403

    registered['datasets'][ident]['members'][next(iter(contract['members']))]['rows'] += 1
    refreshed_path.write_text(json.dumps(registered))
    blocked = client.get('/api/ml/forecast?target=orders&periods=365', headers=headers).json()
    assert blocked['status'] == 'not_applicable'
    assert blocked['synthetic_registration']['status'] == 'revision_mismatch'
    assert blocked['forecast_series'] == []  # No legacy substitute on revision failure.
    assert original_path.read_bytes() == original_bytes
    assert artifact.read_bytes() == artifact_bytes
