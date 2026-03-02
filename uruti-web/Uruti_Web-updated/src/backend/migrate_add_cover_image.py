"""
Migration script to add cover_image_url column to users table
This script works with both PostgreSQL and SQLite
"""
from sqlalchemy import text, inspect
from app.database import engine

def migrate_add_cover_image():
    """Add cover_image_url column to users table if it doesn't exist"""
    
    # Inspect table columns
    inspector = inspect(engine)
    columns = inspector.get_columns('users')
    column_names = [col['name'] for col in columns]
    
    if 'cover_image_url' in column_names:
        print("✓ cover_image_url column already exists")
        return
    
    # Add the column
    with engine.begin() as connection:
        # Detect database type
        db_url = str(engine.url)
        is_postgresql = 'postgresql' in db_url
        
        if is_postgresql:
            query = text("ALTER TABLE users ADD COLUMN cover_image_url VARCHAR(255)")
        else:
            query = text("ALTER TABLE users ADD cover_image_url VARCHAR(255)")
        
        try:
            connection.execute(query)
            print("✓ Added cover_image_url column to users table")
        except Exception as e:
            print(f"✗ Error adding column: {e}")
            raise

if __name__ == "__main__":
    migrate_add_cover_image()

