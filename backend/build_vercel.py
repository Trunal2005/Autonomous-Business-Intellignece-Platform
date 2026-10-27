"""Install an operator-supplied, checksum-pinned private model bundle at build time."""
import hashlib
import io
import json
import os
from pathlib import Path
import urllib.request
from urllib.parse import urlsplit
import zipfile

NAMES = ("sales_forecast_orders", "sales_forecast_revenue", "sales_prediction",
         "customer_segmentation", "product_segmentation", "anomaly_detection")
ALLOWED = {f"{name}.{suffix}" for name in NAMES for suffix in ("joblib", "metadata.json")}
MAX_BYTES = 32 * 1024 * 1024


def install_bundle(raw, expected_sha256, destination):
    if len(raw) > MAX_BYTES or hashlib.sha256(raw).hexdigest() != expected_sha256:
        raise ValueError("Model bundle size/checksum validation failed.")
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        entries = archive.infolist()
        names = [item.filename for item in entries]
        if len(names) != len(set(names)) or set(names) != ALLOWED | {"manifest.json"}:
            raise ValueError("Model bundle must contain exactly the six reviewed models, their metadata and manifest.")
        if sum(item.file_size for item in entries) > MAX_BYTES:
            raise ValueError("Expanded model bundle exceeds the bounded size.")
        files = {name: archive.read(name) for name in names}
    manifest = json.loads(files["manifest.json"])
    if set(manifest.get("sha256", {})) != ALLOWED:
        raise ValueError("Incomplete model manifest.")
    for name in ALLOWED:
        if hashlib.sha256(files[name]).hexdigest() != manifest["sha256"][name]:
            raise ValueError("Model file checksum mismatch.")
    for name in NAMES:
        metadata = json.loads(files[f"{name}.metadata.json"])
        if metadata.get("artifact") != f"{name}.joblib" or not metadata.get("features_schema"):
            raise ValueError("Model metadata contract is invalid.")
    destination = Path(destination)
    if destination.exists():
        raise ValueError("Refusing to overwrite an existing model-assets directory.")
    destination.mkdir(parents=True)
    for name, data in files.items():
        (destination / name).write_bytes(data)
    return manifest


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def main():
    url = os.environ.get("ML_ARTIFACT_BUNDLE_URL", "")
    digest = os.environ.get("ML_ARTIFACT_BUNDLE_SHA256", "")
    parsed = urlsplit(url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or len(digest) != 64:
        raise RuntimeError("Supply private HTTPS ML_ARTIFACT_BUNDLE_URL and its SHA256. See docs/VERCEL_DEPLOYMENT.md; no models will be fabricated.")
    try:
        with urllib.request.build_opener(NoRedirect).open(url, timeout=60) as response:
            raw = response.read(MAX_BYTES + 1)
        install_bundle(raw, digest.lower(), Path(__file__).parent / "model_assets")
    except Exception:
        raise RuntimeError("Trusted model bundle download/validation failed. Check private build variables; URL and credentials are not logged.") from None
    print("Six checksum-verified model artifacts installed; no training data or private dataset registry included.")


if __name__ == "__main__":
    main()
