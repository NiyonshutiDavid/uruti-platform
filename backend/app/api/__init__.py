"""API module with lazy imports to avoid circular dependencies."""

# Lazy import to avoid circular import issues
def __getattr__(name):
    if name == "v1":
        from . import v1
        return v1
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = ["v1"]
