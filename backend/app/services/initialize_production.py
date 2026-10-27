"""Explicit, additive schema/bootstrap command; never invoked by request handlers."""
import getpass
import os

from sqlalchemy import select
from app.core.config import settings
from app.core.security import hash_password
from app.database.session import Base, SessionLocal, engine
from app.models.user import User
from app.models.dataset import Dataset, DatasetSelection, DatasetBundleTable


def initialize(username, password):
    if not settings.production:
        raise RuntimeError("Use this command only with explicit production configuration.")
    if not username or len(password) < 16 or len(password.encode("utf-8")) > 72:
        raise ValueError("Admin needs a username and a private password of 16 characters to 72 UTF-8 bytes.")
    # Only app catalog/auth tables. No warehouse rebuild, CSV import or existing password reset.
    Base.metadata.create_all(engine, tables=[User.__table__, Dataset.__table__, DatasetSelection.__table__, DatasetBundleTable.__table__])
    with SessionLocal.begin() as db:
        existing = db.scalar(select(User).where(User.username == username))
        if existing:
            if existing.role != "admin":
                raise ValueError("Username already belongs to a non-admin; no role or password changed.")
            return False
        db.add(User(username=username, role="admin", hashed_password=hash_password(password)))
    return True


if __name__ == "__main__":
    username = os.environ.get("BOOTSTRAP_ADMIN_USERNAME") or input("Production admin username: ").strip()
    password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD") or getpass.getpass("Private admin password: ")
    try:
        created = initialize(username, password)
    except Exception:
        raise SystemExit("Initialization failed. Check private PostgreSQL/TLS configuration and password policy; no credentials are printed.") from None
    print("Schema ready; administrator created." if created else "Schema ready; existing administrator preserved.")
