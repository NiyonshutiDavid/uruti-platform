from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        conns = self.active_connections.setdefault(user_id, [])
        conns.append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        conns = self.active_connections.get(user_id)
        if conns and websocket in conns:
            conns.remove(websocket)

    async def send_personal_message(self, user_id: int, message: str):
        conns = self.active_connections.get(user_id, [])
        for ws in list(conns):
            await ws.send_text(message)

    async def broadcast(self, message: str):
        for conns in self.active_connections.values():
            for ws in list(conns):
                await ws.send_text(message)


manager = ConnectionManager()
