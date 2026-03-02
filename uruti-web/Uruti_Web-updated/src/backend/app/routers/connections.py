from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import User, Connection, ConnectionRequest, NotificationType
from ..schemas import ConnectionResponse, ConnectionRequestCreate, ConnectionRequestResponse
from ..auth import get_current_active_user
from .notifications import create_notification, publish_notification

router = APIRouter(prefix="/connections", tags=["Connections"])


def _serialize_request_with_user(request: ConnectionRequest, current_user_id: int, db: Session) -> dict:
    requester = db.query(User).filter(User.id == request.requester_id).first()
    receiver = db.query(User).filter(User.id == request.receiver_id).first()
    counterpart = receiver if request.requester_id == current_user_id else requester

    return {
        "id": request.id,
        "requester_id": request.requester_id,
        "receiver_id": request.receiver_id,
        "status": request.status,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
        "direction": "sent" if request.requester_id == current_user_id else "received",
        "counterpart": {
            "id": counterpart.id if counterpart else None,
            "full_name": counterpart.full_name if counterpart else None,
            "display_name": counterpart.display_name if counterpart else None,
            "email": counterpart.email if counterpart else None,
            "role": (counterpart.role.value if hasattr(counterpart.role, "value") else counterpart.role) if counterpart else None,
            "avatar_url": counterpart.avatar_url if counterpart else None,
            "bio": counterpart.bio if counterpart else None,
            "company": counterpart.company if counterpart else None,
            "location": counterpart.location if counterpart else None,
        },
    }


@router.post("/request", response_model=ConnectionRequestResponse, status_code=status.HTTP_201_CREATED)
async def send_connection_request(
    request_data: ConnectionRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a connection request to another user"""
    
    # Check if target user exists
    target_user = db.query(User).filter(User.id == request_data.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Can't send request to yourself
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send connection request to yourself")
    
    # Check if already connected
    existing_connection = db.query(Connection).filter(
        or_(
            and_(Connection.user1_id == current_user.id, Connection.user2_id == target_user.id),
            and_(Connection.user1_id == target_user.id, Connection.user2_id == current_user.id)
        )
    ).first()
    
    if existing_connection:
        raise HTTPException(status_code=400, detail="Already connected with this user")
    
    # Check if request already exists
    existing_request = db.query(ConnectionRequest).filter(
        or_(
            and_(ConnectionRequest.requester_id == current_user.id, ConnectionRequest.receiver_id == target_user.id),
            and_(ConnectionRequest.requester_id == target_user.id, ConnectionRequest.receiver_id == current_user.id)
        ),
        ConnectionRequest.status == "pending"
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="Connection request already exists")
    
    # Create connection request
    db_request = ConnectionRequest(
        requester_id=current_user.id,
        receiver_id=target_user.id,
        status="pending"
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    notification = create_notification(
        db,
        user_id=target_user.id,
        title="New connection request",
        message=f"{current_user.display_name} sent you a connection request.",
        notification_type=NotificationType.SYSTEM,
        data={
            "kind": "connection_request",
            "request_id": db_request.id,
            "requester_id": current_user.id,
        },
    )
    await publish_notification(notification, db)
    
    return db_request


@router.get("/requests/pending", response_model=List[dict])
def get_pending_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all pending connection requests for current user (both sent and received)."""

    requests = db.query(ConnectionRequest).filter(
        or_(
            ConnectionRequest.receiver_id == current_user.id,
            ConnectionRequest.requester_id == current_user.id
        ),
        ConnectionRequest.status == "pending"
    ).all()

    return [_serialize_request_with_user(req, current_user.id, db) for req in requests]


@router.get("/requests/sent", response_model=List[dict])
def get_sent_requests(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get connection requests sent by current user."""

    query = db.query(ConnectionRequest).filter(ConnectionRequest.requester_id == current_user.id)
    if status_filter:
        query = query.filter(ConnectionRequest.status == status_filter)

    requests = query.order_by(ConnectionRequest.created_at.desc()).all()
    return [_serialize_request_with_user(req, current_user.id, db) for req in requests]


@router.get("/requests/received", response_model=List[dict])
def get_received_requests(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get connection requests received by current user."""

    query = db.query(ConnectionRequest).filter(ConnectionRequest.receiver_id == current_user.id)
    if status_filter:
        query = query.filter(ConnectionRequest.status == status_filter)

    requests = query.order_by(ConnectionRequest.created_at.desc()).all()
    return [_serialize_request_with_user(req, current_user.id, db) for req in requests]


@router.put("/request/{request_id}/accept", response_model=ConnectionResponse)
async def accept_connection_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Accept a connection request"""
    
    request = db.query(ConnectionRequest).filter(ConnectionRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Connection request not found")
    
    # Only receiver can accept
    if request.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only receiver can accept request")
    
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")
    
    # Update request status
    request.status = "accepted"
    request.updated_at = datetime.utcnow()
    
    # Create connection
    connection = Connection(
        user1_id=min(request.requester_id, request.receiver_id),
        user2_id=max(request.requester_id, request.receiver_id)
    )
    
    db.add(connection)
    db.commit()
    db.refresh(connection)
    
    notification = create_notification(
        db,
        user_id=request.requester_id,
        title="Connection accepted",
        message=f"{current_user.display_name} accepted your connection request.",
        notification_type=NotificationType.SYSTEM,
        data={
            "kind": "connection_accepted",
            "request_id": request.id,
            "connection_id": connection.id,
            "user_id": current_user.id,
        },
    )
    await publish_notification(notification, db)

    requester = db.query(User).filter(User.id == request.requester_id).first()
    if requester:
        receiver_notification = create_notification(
            db,
            user_id=current_user.id,
            title="New connection added",
            message=f"You are now connected with {requester.display_name}.",
            notification_type=NotificationType.SYSTEM,
            data={
                "kind": "connection_added",
                "connection_id": connection.id,
                "user_id": requester.id,
            },
        )
        await publish_notification(receiver_notification, db)
    
    return connection


@router.put("/request/{request_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_connection_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reject a connection request"""
    
    request = db.query(ConnectionRequest).filter(ConnectionRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Connection request not found")
    
    # Only receiver can reject
    if request.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only receiver can reject request")
    
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")
    
    # Update request status
    request.status = "rejected"
    request.updated_at = datetime.utcnow()
    
    db.commit()
    
    requester = db.query(User).filter(User.id == request.requester_id).first()
    if requester:
        notification = create_notification(
            db,
            user_id=request.requester_id,
            title="Connection request declined",
            message=f"{current_user.display_name} declined your connection request.",
            notification_type=NotificationType.SYSTEM,
            data={
                "kind": "connection_rejected",
                "request_id": request.id,
                "user_id": current_user.id,
            },
        )
        await publish_notification(notification, db)
    
    return None


@router.delete("/request/{request_id}/cancel", status_code=status.HTTP_204_NO_CONTENT)
def cancel_connection_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a sent connection request (requester only, pending only)."""

    request = db.query(ConnectionRequest).filter(ConnectionRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Connection request not found")

    if request.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only sender can cancel request")

    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be cancelled")

    db.delete(request)
    db.commit()

    return None


@router.get("/", response_model=List[dict])
def get_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all connections for current user with user details (excludes admin users)"""
    
    connections = db.query(Connection).filter(
        or_(
            Connection.user1_id == current_user.id,
            Connection.user2_id == current_user.id
        )
    ).all()
    
    # Get connected user details (exclude admin users)
    result = []
    for conn in connections:
        other_user_id = conn.user2_id if conn.user1_id == current_user.id else conn.user1_id
        other_user = db.query(User).filter(User.id == other_user_id).first()
        
        # Skip admin users in connections list
        if other_user and other_user.role != "admin":
            result.append({
                "id": other_user.id,
                "display_name": other_user.display_name,
                "full_name": other_user.full_name,
                "email": other_user.email,
                "role": other_user.role,
                "avatar": other_user.avatar_url,  # Use avatar_url from model
                "avatar_url": other_user.avatar_url,  # Include both for compatibility
                "bio": other_user.bio,
                "company": other_user.company,
                "location": other_user.location,
                "connection_id": conn.id,
                "connected_at": conn.created_at
            })
    
    return result


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove a connection"""
    
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Check if user is part of this connection
    if connection.user1_id != current_user.id and connection.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    other_user_id = connection.user2_id if connection.user1_id == current_user.id else connection.user1_id
    other_user = db.query(User).filter(User.id == other_user_id).first()

    db.delete(connection)
    db.commit()

    if other_user:
        removed_for_other = create_notification(
            db,
            user_id=other_user.id,
            title="Connection removed",
            message=f"{current_user.display_name} removed your connection.",
            notification_type=NotificationType.SYSTEM,
            data={
                "kind": "connection_removed",
                "user_id": current_user.id,
                "connection_id": connection_id,
                "route": "/connections",
            },
        )
        await publish_notification(removed_for_other, db)

        removed_for_self = create_notification(
            db,
            user_id=current_user.id,
            title="Connection removed",
            message=f"You removed your connection with {other_user.display_name}.",
            notification_type=NotificationType.SYSTEM,
            data={
                "kind": "connection_removed",
                "user_id": other_user.id,
                "connection_id": connection_id,
                "route": "/connections",
            },
        )
        await publish_notification(removed_for_self, db)
    
    return None


@router.get("/status/{user_id}")
def check_connection_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Check connection status with a specific user"""
    
    # Check if connected
    connection = db.query(Connection).filter(
        or_(
            and_(Connection.user1_id == current_user.id, Connection.user2_id == user_id),
            and_(Connection.user1_id == user_id, Connection.user2_id == current_user.id)
        )
    ).first()
    
    if connection:
        return {"status": "connected", "connection_id": connection.id}
    
    # Check if pending request exists
    request = db.query(ConnectionRequest).filter(
        or_(
            and_(ConnectionRequest.requester_id == current_user.id, ConnectionRequest.receiver_id == user_id),
            and_(ConnectionRequest.requester_id == user_id, ConnectionRequest.receiver_id == current_user.id)
        ),
        ConnectionRequest.status == "pending"
    ).first()
    
    if request:
        is_sender = request.requester_id == current_user.id
        return {
            "status": "pending",
            "request_id": request.id,
            "is_sender": is_sender
        }
    
    return {"status": "none"}