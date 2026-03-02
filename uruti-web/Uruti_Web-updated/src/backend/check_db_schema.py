#!/usr/bin/env python3
"""Check database schema"""
import sqlite3

conn = sqlite3.connect('uruti.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(users)")
columns = cursor.fetchall()
print("Users table columns:")
for col in columns:
    col_name, col_type = col[1], col[2]
    print(f"  {col_name}: {col_type}")

# Check if cover_image_url exists
has_cover = any(col[1] == 'cover_image_url' for col in columns)
print(f"\ncover_image_url exists: {has_cover}")

if not has_cover:
    print("\nAttempting to add cover_image_url column...")
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN cover_image_url VARCHAR(255)")
        conn.commit()
        print("✓ Column added successfully")
    except Exception as e:
        print(f"✗ Error: {e}")

conn.close()
