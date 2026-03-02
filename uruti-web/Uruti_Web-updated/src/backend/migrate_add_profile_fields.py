#!/usr/bin/env python3
"""
Migration script to add new profile fields to the users table (PostgreSQL)
"""
import os
import sys
import psycopg2
from psycopg2 import sql

def migrate():
    """Add new columns to users table in PostgreSQL"""
    
    # Connection parameters from .env
    db_url = os.getenv("DATABASE_URL", "postgresql://uruti_user:12345@localhost:5432/uruti_db")
    
    try:
        # Parse connection string
        # Expected format: postgresql://user:password@host:port/database
        import urllib.parse
        result = urllib.parse.urlparse(db_url)
        
        user = result.username
        password = result.password
        host = result.hostname
        port = result.port or 5432
        database = result.path.lstrip('/')
        
        print(f"Connecting to PostgreSQL: {host}:{port}/{database}")
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        cursor = conn.cursor()
        
        # Get existing columns
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users'
        """)
        existing_columns = {row[0] for row in cursor.fetchall()}
        
        print("Existing columns in users table:", existing_columns)
        
        # Define new columns to add
        new_columns = {
            'expertise': 'JSON',
            'industry': 'VARCHAR(255)',
            'preferred_sectors': 'JSON',
            'investment_focus': 'JSON',
            'achievements': 'JSON',
            'funding_amount': 'VARCHAR(255)',
            'stage': 'VARCHAR(255)',
        }
        
        # Add missing columns
        added_count = 0
        for col_name, col_type in new_columns.items():
            if col_name not in existing_columns:
                print(f"Adding column: {col_name} ({col_type})")
                try:
                    sql_query = sql.SQL("ALTER TABLE users ADD COLUMN {} {} DEFAULT NULL").format(
                        sql.Identifier(col_name),
                        sql.SQL(col_type)
                    )
                    cursor.execute(sql_query)
                    added_count += 1
                    print(f"  ✓ Successfully added {col_name}")
                except psycopg2.Error as e:
                    print(f"  ✗ Error adding {col_name}: {e}")
            else:
                print(f"Column {col_name} already exists, skipping")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"\n✓ Migration complete! Added {added_count} new columns.")
        return True
        
    except Exception as e:
        print(f"✗ Migration failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = migrate()
    sys.exit(0 if success else 1)

