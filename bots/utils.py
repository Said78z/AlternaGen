"""Shared utilities for all bots: schema validation, logging, JSON I/O."""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any

try:
    import jsonschema
    _HAS_JSONSCHEMA = True
except ImportError:  # pragma: no cover
    _HAS_JSONSCHEMA = False


SCHEMAS_DIR = Path(__file__).parent.parent / "schemas"


def get_logger(name: str, level: str = "INFO") -> logging.Logger:
    """Return a configured logger with a human-readable format."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
        )
        logger.addHandler(handler)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    return logger


def load_json(path: str | Path) -> Any:
    """Load a JSON file and return the parsed content."""
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def save_json(data: Any, path: str | Path) -> None:
    """Save *data* as pretty-printed JSON to *path*."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)


def validate(data: Any, schema_file: str) -> None:
    """Validate *data* against the JSON schema in /schemas/<schema_file>.

    Raises jsonschema.ValidationError if validation fails.
    If jsonschema is not installed, validation is skipped with a warning.
    """
    if not _HAS_JSONSCHEMA:
        log = get_logger("bots.utils")
        log.warning("jsonschema not installed – skipping schema validation")
        return

    schema_path = SCHEMAS_DIR / schema_file
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema not found: {schema_path}")

    schema = load_json(schema_path)
    jsonschema.validate(instance=data, schema=schema)
