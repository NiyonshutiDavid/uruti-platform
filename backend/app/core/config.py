"""Shim to expose top-level `config.settings` as `app.core.config`.
"""
from config import settings

__all__ = ["settings"]
