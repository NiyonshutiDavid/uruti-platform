"""Shim to expose the top-level `api.api_router` as `app.api.v1.api.api_router`."""
from api import api_router, register_routers

# Ensure all routers are registered when this module is imported
register_routers()

__all__ = ["api_router"]
