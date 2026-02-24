from fastapi import APIRouter

# Create the main router
api_router = APIRouter()

# Flag to track if routers have been registered
_routers_registered = False

# Function to lazily register routers to avoid circular imports
def register_routers():
    """Register all API routers."""
    global _routers_registered
    if _routers_registered:
        return
    
    import auth as auth_mod
    import users as users_mod
    import messages as messages_mod
    import calls as calls_mod
    import notifications as notifications_mod
    import dashboard as dashboard_mod
    import ventures as ventures_mod
    import mentors as mentors_mod
    import pitch_performance as pitch_mod
    import deals as deals_mod
    import advisory as advisory_mod
    import scheduling as scheduling_mod
    import settings as settings_mod
    import profile as profile_mod

    api_router.include_router(auth_mod.router, prefix="/auth", tags=["auth"])
    api_router.include_router(users_mod.router, prefix="/users", tags=["users"])
    api_router.include_router(profile_mod.router, prefix="/profile", tags=["profile"])
    api_router.include_router(messages_mod.router, prefix="/messages", tags=["messages"])
    api_router.include_router(calls_mod.router, prefix="/calls", tags=["calls"])
    api_router.include_router(notifications_mod.router, prefix="/notifications", tags=["notifications"])
    api_router.include_router(dashboard_mod.router, prefix="/dashboard", tags=["dashboard"])
    api_router.include_router(ventures_mod.router, prefix="/ventures", tags=["ventures"])
    api_router.include_router(mentors_mod.router, prefix="/mentors", tags=["mentors"])
    api_router.include_router(pitch_mod.router, prefix="/pitch", tags=["pitch"])
    api_router.include_router(deals_mod.router, prefix="/deals", tags=["deals"])
    api_router.include_router(advisory_mod.router, prefix="/advisory", tags=["advisory"])
    api_router.include_router(scheduling_mod.router, prefix="/scheduling", tags=["scheduling"])
    api_router.include_router(settings_mod.router, prefix="/settings", tags=["settings"])
    
    # Include WebRTC signaling endpoints
    try:
        from app.api.v1.endpoints import websocket as websocket_mod
        api_router.include_router(websocket_mod.router)
    except Exception as e:
        print(f"Warning: Could not load websocket endpoints: {e}")

    # expose websocket endpoints for messages under the messages module
    try:
        import ws_manager  # ensure ws_manager is available
    except Exception:
        pass
    
    _routers_registered = True