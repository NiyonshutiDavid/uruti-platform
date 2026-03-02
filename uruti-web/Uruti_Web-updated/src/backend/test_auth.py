#!/usr/bin/env python3
"""Test authentication directly"""

import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import User
from app.auth import authenticate_user

db = SessionLocal()

# Test authenticating with admin credentials
email = "dniyonshuti@nexventures.net"
password = "Uruti@January2026."

print(f"Testing authentication:")
print(f"  Email: {email}")
print(f"  Password: {password}")
print()

user = authenticate_user(db, email, password)

if user:
    print(f"✓ Authentication successful!")
    print(f"  User ID: {user.id}")
    print(f"  User Email: {user.email}")
    print(f"  User Role: {user.role}")
else:
    print(f"✗ Authentication failed!")
    
    # Debug: check if user exists
    db_user = db.query(User).filter(User.email == email).first()
    if db_user:
        print(f"  User exists in database")
        print(f"  User ID: {db_user.id}")
        print(f"  But password verification failed")
    else:
        print(f"  User not found in database!")

db.close()
