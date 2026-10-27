"""Package existing trusted serving files only. Never trains or deserializes a model."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from build_vercel import ALLOWED  # noqa: E402


def package(source, output):
    source, output = Path(source), Path(output)
    if output.exists():
        raise ValueError("Output already exists; choose a new private filename.")
    files = {name: (source / name).read_bytes() for name in sorted(ALLOWED)}
    manifest = {"format": 1, "sha256": {name: hashlib.sha256(raw).hexdigest() for name, raw in files.items()},
                "trust": "Operator-reviewed existing serving artifacts; not uploaded user models."}
    files["manifest.json"] = json.dumps(manifest, sort_keys=True, indent=2).encode()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, raw in sorted(files.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, raw)
    print("Bundle SHA256:", hashlib.sha256(output.read_bytes()).hexdigest())
    print("Keep the bundle private. It excludes source data, credentials and synthetic dataset registrations.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--models-dir", type=Path, default=ROOT / "ml/models")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    package(args.models_dir, args.output)
