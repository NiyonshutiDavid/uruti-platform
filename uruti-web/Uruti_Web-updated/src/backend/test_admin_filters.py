#!/usr/bin/env python3
"""
Test script to verify:
1. Admin users are filtered from connections
2. Profile updates are synced
"""

import json
import urllib.request
import urllib.error
import time
import sys

BASE = 'http://127.0.0.1:8000'

def req(path, method='GET', payload=None, token=None):
    """Make HTTP request to API"""
    data = json.dumps(payload).encode('utf-8') if payload is not None else None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    request = urllib.request.Request(f'{BASE}{path}', data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as resp:
            body = resp.read().decode('utf-8')
            return resp.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            body = json.loads(body)
        except Exception:
            pass
        return e.code, body

def test_profile_update():
    """Test profile update and sync"""
    print("\n📝 TEST 1: Profile Update Sync")
    print("-" * 50)
    
    # Login
    s, login = req('/api/v1/auth/login', 'POST', {'email':'amahoro@urutidemoacc.rw','password':'DemoPass123!'})
    if s != 200:
        print(f"❌ Login failed: {s}")
        return False
    
    token = login.get('access_token')
    print(f"✓ Logged in successfully")
    
    # Update profile
    new_bio = f'Test bio {int(time.time())}'
    s, _ = req('/api/v1/users/me', 'PUT', {'bio': new_bio}, token)
    if s != 200:
        print(f"❌ Profile update failed: {s}")
        return False
    print(f"✓ Profile update request sent")
    
    # Verify update was saved
    s, profile = req('/api/v1/auth/me', token=token)
    if s != 200:
        print(f"❌ Profile fetch failed: {s}")
        return False
    
    if profile.get('bio') == new_bio:
        print(f"✓ Profile sync verified: bio updated correctly")
        return True
    else:
        print(f"❌ Profile sync failed: expected '{new_bio}', got '{profile.get('bio')}'")
        return False

def test_admin_filter():
    """Test that admin users are filtered from connections"""
    print("\n🔐 TEST 2: Admin Users Filtered from Connections")
    print("-" * 50)
    
    # Login as founder
    s, login = req('/api/v1/auth/login', 'POST', {'email':'amahoro@urutidemoacc.rw','password':'DemoPass123!'})
    if s != 200:
        print(f"❌ Login failed: {s}")
        return False
    
    token = login.get('access_token')
    print(f"✓ Logged in as founder")
    
    # Get connections
    s, conns = req('/api/v1/connections/', 'GET', token=token)
    if s != 200:
        print(f"❌ Connections fetch failed: {s}")
        return False
    
    if not isinstance(conns, list):
        print(f"❌ Invalid response format: {type(conns)}")
        return False
    
    print(f"✓ Fetched {len(conns)} connections")
    
    # Check for admin users
    has_admin = any(c.get('role') == 'admin' for c in conns)
    
    if has_admin:
        admin_conns = [c for c in conns if c.get('role') == 'admin']
        print(f"❌ Found {len(admin_conns)} admin users in connections")
        for ac in admin_conns:
            print(f"   - {ac.get('display_name')} ({ac.get('role')})")
        return False
    else:
        print(f"✓ No admin users in connections list")
        if conns:
            print(f"   Sample connection: {conns[0].get('display_name')} ({conns[0].get('role')})")
        return True

if __name__ == '__main__':
    try:
        test1_passed = test_profile_update()
        test2_passed = test_admin_filter()
        
        print("\n" + "=" * 50)
        print("TEST RESULTS:")
        print("=" * 50)
        print(f"Profile Update Sync: {'✓ PASSED' if test1_passed else '✗ FAILED'}")
        print(f"Admin Filter: {'✓ PASSED' if test2_passed else '✗ FAILED'}")
        
        if test1_passed and test2_passed:
            print("\n✓ All tests passed!")
            sys.exit(0)
        else:
            print("\n❌ Some tests failed")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Test error: {e}")
        sys.exit(1)
