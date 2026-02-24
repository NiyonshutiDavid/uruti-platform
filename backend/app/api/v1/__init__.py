"""V1 API module with lazy imports."""

# Lazy import to avoid circular import issues
def __getattr__(name):
    if name == "api_router":
        # When api_router is accessed, import api module which will register routers
        from .api import api_router
        return api_router
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = ["api_router"]
