from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api import deps
from app.models.user import User

router = APIRouter()

# Simple in-memory signaling store (for dev). Use WebSockets or a pub/sub in production.
_signals: Dict[int, List[Dict]] = {}


class SignalPayload(BaseModel):
    recipient_id: int
    type: str
    data: Dict


@router.post("/signal")
async def post_signal(payload: SignalPayload, current_user: User = Depends(deps.get_current_user)) -> Any:
    """Post a signaling payload for another user. Receiver can poll `/signal/{user_id}`."""
    lst = _signals.setdefault(payload.recipient_id, [])
    lst.append({"from": current_user.id, "type": payload.type, "data": payload.data})
    return {"status": "queued"}


@router.get("/signal/{user_id}")
async def get_signals(user_id: int, current_user: User = Depends(deps.get_current_user)) -> Any:
    """Get and clear queued signals for `user_id` if same as current user."""
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    items = _signals.pop(user_id, [])
    return items
