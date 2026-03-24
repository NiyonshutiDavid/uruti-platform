import pytest

from app import database


class _DummySession:
    def __init__(self) -> None:
        self.closed = False

    def close(self) -> None:
        self.closed = True


def test_get_db_yields_and_closes_session(monkeypatch) -> None:
    dummy = _DummySession()
    monkeypatch.setattr(database, "SessionLocal", lambda: dummy)

    dependency = database.get_db()
    resolved = next(dependency)

    assert resolved is dummy

    with pytest.raises(StopIteration):
        next(dependency)

    assert dummy.closed is True
