"""Shim to expose top-level deps as app.api.deps."""
from deps import get_current_user, reusable_oauth2

__all__ = ["get_current_user", "reusable_oauth2"]
