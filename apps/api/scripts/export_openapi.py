#!/usr/bin/env python3
"""Export OpenAPI specification from FastAPI app."""

import json
import sys
from pathlib import Path

# Add parent directory to path to import app module
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app


def export_openapi() -> None:
    """Export OpenAPI spec to JSON file."""
    openapi_schema = app.openapi()

    # Ensure output directory exists
    output_dir = Path(__file__).parent.parent / "openapi"
    output_dir.mkdir(exist_ok=True)

    # Write OpenAPI spec
    output_file = output_dir / "openapi.json"
    with output_file.open("w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)

    print(f"✅ OpenAPI spec exported to: {output_file}")


if __name__ == "__main__":
    export_openapi()
