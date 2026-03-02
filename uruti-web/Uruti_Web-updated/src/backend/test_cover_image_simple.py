#!/usr/bin/env python3
"""
Simple test to verify cover_image_url update
"""
import json
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:8000'

def req(path, method='GET', payload=None, token=None):
    """Make HTTP request"""
    data = None
    headers = {'Content-Type': 'application/json'}
    
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
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
        except:
            pass
        return e.code, body

# Test
print("Testing cover_image_url update...")

# Login
status, login = req('/api/v1/auth/login', 'POST', {'email': 'amahoro@urutidemoacc.rw', 'password': 'DemoPass123!'})
token = login['access_token']
print(f"1. Logged in: {status}")

# Get current
status, profile_before = req('/api/v1/auth/me', token=token)
print(f"2. Got profile: {status}")
print(f"   Before - cover_image_url: {profile_before.get('cover_image_url')}")

# Update only cover_image_url
new_cover = 'https://example.com/cover-test.jpg'
status, update_resp = req('/api/v1/users/me', 'PUT', {'cover_image_url': new_cover}, token)
print(f"3. Updated profile: {status}")

# Verify
status, profile_after = req('/api/v1/auth/me', token=token)
actual = profile_after.get('cover_image_url')
print(f"4. Got profile after update: {status}")
print(f"   After - cover_image_url: {actual}")
print(f"   Expected: {new_cover}")
print(f"   Match: {actual == new_cover}")

if actual == new_cover:
    print("\n✅ SUCCESS: cover_image_url update works!")
else:
    print("\n❌ FAILED: cover_image_url did not update")
    print(f"\n Update response: {update_resp}")
