"""Application package exports with lazy app loading."""


def __getattr__(name: str):
	if name in {"app", "main"}:
		from .main import app as main_app

		return main_app
	raise AttributeError(name)
