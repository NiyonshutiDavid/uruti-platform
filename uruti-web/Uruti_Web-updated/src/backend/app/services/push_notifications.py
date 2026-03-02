import json
from typing import Any, Dict, List, Optional

try:
    import firebase_admin  # type: ignore[import-not-found]
    from firebase_admin import credentials, messaging  # type: ignore[import-not-found]
except Exception:  # pragma: no cover - optional dependency guard
    firebase_admin = None
    credentials = None
    messaging = None

from ..config import settings


def _ensure_firebase_initialized() -> bool:
    if firebase_admin is None or credentials is None:
        return False

    if firebase_admin._apps:
        return True

    credential_obj = None

    if settings.FCM_SERVICE_ACCOUNT_PATH:
        credential_obj = credentials.Certificate(settings.FCM_SERVICE_ACCOUNT_PATH)
    elif settings.FCM_SERVICE_ACCOUNT_JSON:
        payload = json.loads(settings.FCM_SERVICE_ACCOUNT_JSON)
        credential_obj = credentials.Certificate(payload)

    if credential_obj is None:
        return False

    try:
        firebase_admin.initialize_app(credential_obj)
        return True
    except Exception:
        return False


def _stringify_data(data: Optional[Dict[str, Any]]) -> Dict[str, str]:
    if not data:
        return {}
    out: Dict[str, str] = {}
    for key, value in data.items():
        if value is None:
            continue
        out[str(key)] = str(value)
    return out


def send_push_notification(
    *,
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if not tokens:
        return {"sent": 0, "failed": 0, "invalid_tokens": []}

    if not _ensure_firebase_initialized():
        return {"sent": 0, "failed": len(tokens), "invalid_tokens": []}

    if messaging is None:
        return {"sent": 0, "failed": len(tokens), "invalid_tokens": []}

    message = messaging.MulticastMessage(
        tokens=tokens,
        notification=messaging.Notification(title=title, body=body),
        data=_stringify_data(data),
    )

    response = messaging.send_each_for_multicast(message)

    invalid_tokens: List[str] = []
    for index, item in enumerate(response.responses):
        if item.success:
            continue
        error_text = str(item.exception or "")
        if "registration-token-not-registered" in error_text or "invalid-argument" in error_text:
            invalid_tokens.append(tokens[index])

    return {
        "sent": response.success_count,
        "failed": response.failure_count,
        "invalid_tokens": invalid_tokens,
    }
