"""Vercel-only ASGI export. Local uvicorn still uses app.main:app."""
import os
from pathlib import Path
from tempfile import gettempdir

os.environ.setdefault("MPLCONFIGDIR", str(Path(gettempdir()) / "abi-matplotlib"))
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("ML_MODELS_DIR", str(Path(__file__).parent / "model_assets"))

from app.main import app  # noqa: E402,F401
