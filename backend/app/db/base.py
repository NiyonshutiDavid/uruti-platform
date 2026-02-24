"""Shim to expose top-level Base as app.db.base.Base"""
from base import Base

__all__ = ["Base"]
