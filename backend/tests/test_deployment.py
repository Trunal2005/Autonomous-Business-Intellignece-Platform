"""Deployment contracts on disposable fixtures; never connect to the developer database."""
import hashlib
import importlib.util
import json
from pathlib import Path

import pytest
from pydantic import ValidationError
from app.core.config import Settings, settings

ROOT = Path(__file__).resolve().parents[2]
PRODUCTION = {"ENV": "production", "DATABASE_URL": "postgresql+psycopg2://fixture:fixture@db.invalid/abi?sslmode=require",
              "SECRET_KEY": "test-only-secret-with-at-least-32-characters", "AUTH_REQUIRED": True,
              "ENABLE_LLM_ASSISTANT": False}


@pytest.mark.parametrize('override', [
    {'DATABASE_URL': 'sqlite:///disposable.db'}, {'SECRET_KEY': 'dev-secret-change-me'},
    {'AUTH_REQUIRED': False}, {'CORS_ORIGINS': ['*']},
    {'VERCEL': True, 'ENABLE_LLM_ASSISTANT': True},
])
def test_production_refuses_unsafe_configuration(override):
    with pytest.raises(ValidationError):
        Settings(**{**PRODUCTION, **override})


def test_hosted_budgets_do_not_change_local_limits():
    hosted = Settings(**PRODUCTION, VERCEL=True)
    local = Settings(ENV='dev', VERCEL=False)
    assert hosted.DATASET_MAX_BYTES == 3 * 1024 * 1024
    assert hosted.BUNDLE_MAX_EXPANDED_BYTES == 16 * 1024 * 1024
    assert hosted.BUNDLE_MAX_SECONDS == 60
    assert hosted.BUNDLE_MAX_ROWS == 50000
    assert local.DATASET_MAX_BYTES == 200 * 1024 * 1024
    assert local.BUNDLE_MAX_SECONDS == 900
    assert Settings(**{**PRODUCTION, 'DATABASE_URL': 'postgres://fixture:fixture@db.invalid/abi'}).DATABASE_URL.startswith('postgresql+psycopg2://')


def test_production_connection_options_require_tls_and_close_idle_connections(monkeypatch):
    from app.database import session
    from sqlalchemy.pool import NullPool
    monkeypatch.setattr(settings, 'ENV', 'production')
    monkeypatch.setattr(settings, 'DATABASE_URL', PRODUCTION['DATABASE_URL'])
    monkeypatch.setattr(session, 'IS_SQLITE', False)
    options = session.engine_options()
    assert options['poolclass'] is NullPool
    assert options['hide_parameters'] is True
    assert options['connect_args']['sslmode'] == 'require'
    monkeypatch.setattr(settings, 'DATABASE_URL', 'postgresql://fixture@db.invalid/abi?sslmode=disable')
    with pytest.raises(ValueError, match='TLS'):
        session.engine_options()


def test_production_does_not_seed_or_rebuild(monkeypatch):
    from app.services import users, etl
    monkeypatch.setattr(settings, 'ENV', 'production')
    monkeypatch.setattr(users.Base.metadata, 'create_all', lambda *a, **k: pytest.fail('Request attempted DDL'))
    users._ensure_schema()
    with pytest.raises(RuntimeError, match='disabled in production'):
        etl.load({}, etl.ETLReport())


def test_explicit_bootstrap_is_additive_and_never_resets_an_existing_admin(tmp_path, monkeypatch):
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import sessionmaker
    from app.models.user import User
    from app.services import initialize_production as bootstrap
    from app.core.security import verify_password
    engine = create_engine('sqlite:///' + (tmp_path / 'bootstrap.db').as_posix())
    factory = sessionmaker(bind=engine)
    monkeypatch.setattr(settings, 'ENV', 'production')
    monkeypatch.setattr(bootstrap, 'engine', engine)
    monkeypatch.setattr(bootstrap, 'SessionLocal', factory)
    try:
        with pytest.raises(ValueError, match='password'):
            bootstrap.initialize('principal', 'short')
        assert bootstrap.initialize('principal', 'private-fixture-password-123') is True
        assert bootstrap.initialize('principal', 'different-fixture-password-456') is False
        with factory() as db:
            user = db.scalar(select(User).where(User.username == 'principal'))
            assert user.role == 'admin'
            assert verify_password('private-fixture-password-123', user.hashed_password)
            assert not verify_password('different-fixture-password-456', user.hashed_password)
    finally:
        engine.dispose()


def test_readiness_is_honest_and_never_discloses_connection_details(client, auth, monkeypatch):
    assert client.get('/health').json() == {'status': 'ok'}
    client.get('/api/datasets', headers=auth)
    assert client.get('/health/ready').status_code == 200
    from app.database.session import engine
    def unavailable():
        raise RuntimeError('private-connection-secret')
    monkeypatch.setattr(engine, 'connect', unavailable)
    response = client.get('/health/ready')
    assert response.status_code == 503
    assert 'private-connection-secret' not in response.text


def test_services_route_api_before_spa_and_keep_original_paths():
    config = json.loads((ROOT / 'vercel.json').read_text())
    assert 'experimentalServices' not in config
    assert config['services']['backend']['entrypoint'] == 'vercel_entry:app'
    assert config['services']['frontend']['root'] == 'frontend'
    assert config['services']['backend']['root'] == 'backend'
    routes = config['rewrites']
    assert routes[0]['destination']['service'] == 'backend'
    assert routes[-1] == {'source': '/(.*)', 'destination': {'service': 'frontend'}}
    assert config['services']['frontend']['routes'][0] == {'handle': 'filesystem'}


def test_model_packaging_preserves_real_artifacts_and_detects_tampering(tmp_path, monkeypatch):
    import build_vercel
    from app.services import ml
    spec = importlib.util.spec_from_file_location('package_serving', ROOT / 'scripts/package_serving_models.py')
    package = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(package)
    target = tmp_path / 'trusted.zip'
    package.package(ROOT / 'ml/models', target)
    raw = target.read_bytes()
    with pytest.raises(ValueError, match='checksum'):
        build_vercel.install_bundle(raw, '0' * 64, tmp_path / 'bad')
    destination = tmp_path / 'assets'
    build_vercel.install_bundle(raw, hashlib.sha256(raw).hexdigest(), destination)
    for name in build_vercel.ALLOWED:
        assert (destination / name).read_bytes() == (ROOT / 'ml/models' / name).read_bytes()
    monkeypatch.setenv('ML_MODELS_DIR', str(destination))
    monkeypatch.setattr(settings, 'VERCEL', True)
    ml.load_all_metadata.cache_clear(); ml._load_artifact.cache_clear()
    try:
        assert all(feature['status'] == 'available' for feature in ml.feature_status())
        (destination / 'sales_forecast_orders.joblib').write_bytes(b'tampered')
        ml._load_artifact.cache_clear()
        with pytest.raises(ValueError, match='checksum'):
            ml._load_artifact('sales_forecast_orders')
    finally:
        ml.load_all_metadata.cache_clear(); ml._load_artifact.cache_clear()
