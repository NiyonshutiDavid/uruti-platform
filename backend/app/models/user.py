"""Shim to expose top-level `user.User` as `app.models.user.User`."""
from user import User

__all__ = ["User"]
