from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from ..database import get_db
from ..models import User, Bookmark, Venture
from ..schemas import BookmarkCreate, BookmarkResponse, BookmarkUpdate
from ..auth import get_current_active_user

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])


@router.post("/", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    bookmark_data: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new bookmark (save to deal flow)"""
    
    # Check if venture exists
    venture = db.query(Venture).filter(Venture.id == bookmark_data.venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")
    
    # Check if already bookmarked
    existing_bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.venture_id == bookmark_data.venture_id
    ).first()
    
    if existing_bookmark:
        raise HTTPException(status_code=400, detail="Venture already bookmarked")
    
    # Create bookmark
    db_bookmark = Bookmark(
        user_id=current_user.id,
        venture_id=bookmark_data.venture_id,
        notes=bookmark_data.notes,
        tags=bookmark_data.tags
    )
    
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    
    # Load venture relationship
    db_bookmark.venture = venture
    
    return db_bookmark


@router.get("/", response_model=List[BookmarkResponse])
def get_bookmarks(
    skip: int = 0,
    limit: int = 100,
    tag: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's bookmarks (deal flow)"""
    
    query = db.query(Bookmark).filter(Bookmark.user_id == current_user.id)
    
    if tag:
        # Filter by tag (PostgreSQL JSON search)
        query = query.filter(Bookmark.tags.contains([tag]))
    
    bookmarks = query.order_by(desc(Bookmark.created_at)).offset(skip).limit(limit).all()
    
    # Load ventures for each bookmark
    for bookmark in bookmarks:
        bookmark.venture = db.query(Venture).filter(Venture.id == bookmark.venture_id).first()
    
    return bookmarks


@router.get("/{bookmark_id}", response_model=BookmarkResponse)
def get_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific bookmark"""
    
    bookmark = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    # Check ownership
    if bookmark.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Load venture
    bookmark.venture = db.query(Venture).filter(Venture.id == bookmark.venture_id).first()
    
    return bookmark


@router.put("/{bookmark_id}", response_model=BookmarkResponse)
def update_bookmark(
    bookmark_id: int,
    bookmark_update: BookmarkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a bookmark"""
    
    bookmark = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    # Check ownership
    if bookmark.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update fields
    update_data = bookmark_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bookmark, field, value)
    
    db.commit()
    db.refresh(bookmark)
    
    # Load venture
    bookmark.venture = db.query(Venture).filter(Venture.id == bookmark.venture_id).first()
    
    return bookmark


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a bookmark"""
    
    bookmark = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    # Check ownership
    if bookmark.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(bookmark)
    db.commit()
    
    return None


@router.get("/venture/{venture_id}/check")
def check_bookmark_status(
    venture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Check if a venture is bookmarked by current user"""
    
    bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.venture_id == venture_id
    ).first()
    
    return {
        "is_bookmarked": bookmark is not None,
        "bookmark_id": bookmark.id if bookmark else None
    }
