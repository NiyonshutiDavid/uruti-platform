#!/usr/bin/env python3
"""
Migration script to add missing columns to advisory_tracks table
Run this script to update the database schema
"""

import psycopg2
from app.config import settings

def run_migration():
    """Connect to database and add missing columns"""
    try:
        raw_url = settings.DATABASE_URL.replace("postgresql://", "", 1)
        auth_host, database = raw_url.split("/", 1)
        auth, host_port = auth_host.rsplit("@", 1)
        db_user, password = auth.split(":", 1)
        host, _, port_value = host_port.partition(":")
        port = int(port_value) if port_value else 5432
        
        conn = psycopg2.connect(
            dbname=database,
            user=db_user,
            password=password,
            host=host,
            port=port
        )
        
        cursor = conn.cursor()
        
        # Check and add missing columns
        columns_to_add = [
            ('materials', "JSON NULL DEFAULT '[]'::JSON"),
            ('is_active', "BOOLEAN DEFAULT TRUE"),
            ('created_by_admin', "INTEGER NULL REFERENCES users(id) ON DELETE SET NULL"),
            ('created_at', "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
            ('updated_at', "TIMESTAMP WITH TIME ZONE NULL"),
        ]
        
        for col_name, col_def in columns_to_add:
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='advisory_tracks' AND column_name='{col_name}'
            """)
            
            if cursor.fetchone() is None:
                # Column doesn't exist, add it
                print(f"Adding '{col_name}' column to advisory_tracks table...")
                try:
                    cursor.execute(f"""
                        ALTER TABLE advisory_tracks 
                        ADD COLUMN {col_name} {col_def};
                    """)
                    print(f"✓ Successfully added '{col_name}' column")
                except Exception as e:
                    print(f"✗ Failed to add '{col_name}': {e}")
            else:
                print(f"✓ '{col_name}' column already exists")
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)
