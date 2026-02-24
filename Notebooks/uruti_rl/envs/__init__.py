from importlib import import_module

__all__ = ["PitchCoachEnv", "PitchEnv", "VideoPitchEnv", "PresentationPitchEnv", "PitchCoachFounderEnv"]


def __getattr__(name: str):
	if name in {"PitchCoachEnv", "PitchEnv"}:
		module = import_module(".pitch_env", __name__)
		return getattr(module, name)
	if name == "VideoPitchEnv":
		module = import_module(".video_pitch_env", __name__)
		return getattr(module, name)
	if name == "PresentationPitchEnv":
		module = import_module(".presentation_pitch_env", __name__)
		return getattr(module, name)
	if name == "PitchCoachFounderEnv":
		module = import_module(".pitch_coach_founder_env", __name__)
		return getattr(module, name)
	raise AttributeError(f"module {__name__!r} has no attribute {name!r}")