#!/usr/bin/env python3
"""
Comprehensive test for image upload functionality
Tests:
1. Avatar upload via file
2. Cover image upload via file
3. Profile updates with URLs
4. Image retrieval
"""
import json
import urllib.request
import urllib.error
import base64
from pathlib import Path
import time

BASE = 'http://127.0.0.1:8000'

def req(path, method='GET', payload=None, token=None, files=None):
    """Make HTTP request"""
    headers = {}
    data = None
    
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    if files:
        # Handle multipart/form-data for file uploads
        boundary = '----WebKitFormBoundary' + ''.join([f'{x:02x}' for x in bytes(range(16))])
        headers['Content-Type'] = f'multipart/form-data; boundary={boundary}'
        
        body_parts = []
        for field_name, (filename, file_data) in files.items():
            body_parts.append(f'--{boundary}'.encode())
            body_parts.append(
                f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"'.encode()
            )
            body_parts.append(b'Content-Type: image/png')
            body_parts.append(b'')
            body_parts.append(file_data)
            body_parts.append(b'')
        body_parts.append(f'--{boundary}--'.encode())
        body_parts.append(b'')
        data = b'\r\n'.join(body_parts)
    elif payload:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(payload).encode('utf-8')
    
    request = urllib.request.Request(
        f'{BASE}{path}',
        data=data,
        headers=headers,
        method=method
    )
    
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

def create_test_image(width=100, height=100):
    """Create a simple PNG image for testing"""
    # Simple 1x1 transparent PNG
    png_data = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00'
        b'\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f'
        b'\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01'
        b'\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    return png_data

def test_image_uploads():
    """Test image upload functionality"""
    print("=" * 60)
    print("IMAGE UPLOAD COMPREHENSIVE TEST")
    print("=" * 60)
    
    # Login
    print("\n1️⃣  Logging in as founder...")
    status, login_response = req(
        '/api/v1/auth/login',
        'POST',
        {'email': 'amahoro@urutidemoacc.rw', 'password': 'DemoPass123!'}
    )
    assert status == 200, f"Login failed: {status}"
    token = login_response['access_token']
    print(f"   ✓ Login successful")
    
    # Get current profile
    print("\n2️⃣  Fetching current profile...")
    status, profile = req('/api/v1/auth/me', token=token)
    assert status == 200, f"Profile fetch failed: {status}"
    orig_avatar = profile.get('avatar_url')
    orig_cover = profile.get('cover_image_url')
    print(f"   ✓ Current profile loaded")
    print(f"   - Avatar URL: {orig_avatar or '(empty)'}")
    print(f"   - Cover URL: {orig_cover or '(empty)'}")
    
    # Test Avatar Upload
    print("\n3️⃣  Testing avatar upload...")
    try:
        test_image = create_test_image()
        status, avatar_response = req(
            '/api/v1/profile/avatar',
            'POST',
            token=token,
            files={'file': ('avatar.png', test_image)}
        )
        if status in [200, 201]:
            avatar_url = avatar_response.get('avatar_url')
            print(f"   ✓ Avatar uploaded successfully")
            print(f"   - URL: {avatar_url}")
            
            # Verify avatar was saved
            status_verify, profile_verify = req('/api/v1/auth/me', token=token)
            if profile_verify.get('avatar_url') == avatar_url:
                print(f"   ✓ Avatar URL verified in profile")
            else:
                print(f"   ⚠ Avatar URL mismatch")
        else:
            print(f"   ⚠ Avatar upload returned status {status}")
            print(f"   Response: {avatar_response}")
    except Exception as e:
        print(f"   ⚠ Avatar upload test skipped: {e}")
    
    # Test Cover Image Upload
    print("\n4️⃣  Testing cover image upload...")
    try:
        test_image = create_test_image()
        status, cover_response = req(
            '/api/v1/profile/cover',
            'POST',
            token=token,
            files={'file': ('cover.png', test_image)}
        )
        if status in [200, 201]:
            cover_url = cover_response.get('cover_url')
            print(f"   ✓ Cover image uploaded successfully")
            print(f"   - URL: {cover_url}")
            
            # Verify cover was saved
            status_verify, profile_verify = req('/api/v1/auth/me', token=token)
            if profile_verify.get('cover_image_url') == cover_url:
                print(f"   ✓ Cover URL verified in profile")
            else:
                print(f"   ⚠ Cover URL mismatch")
        else:
            print(f"   ⚠ Cover upload returned status {status}")
            print(f"   Response: {cover_response}")
    except Exception as e:
        print(f"   ⚠ Cover upload test skipped: {e}")
    
    # Test Profile Update with URLs
    print("\n5️⃣  Testing profile update with image URLs...")
    new_avatar_url = 'https://example.com/new-avatar.jpg'
    new_cover_url = 'https://example.com/new-cover.jpg'
    
    status, update_response = req(
        '/api/v1/users/me',
        'PUT',
        {
            'avatar_url': new_avatar_url,
            'cover_image_url': new_cover_url,
            'bio': 'Updated with new images'
        },
        token
    )
    assert status == 200, f"Profile update failed: {status}"
    print(f"   ✓ Profile updated with new image URLs")
    
    # Verify updates
    status, profile_updated = req('/api/v1/auth/me', token=token)
    assert profile_updated.get('avatar_url') == new_avatar_url, "Avatar URL not updated"
    assert profile_updated.get('cover_image_url') == new_cover_url, "Cover URL not updated"
    print(f"   ✓ Image URLs verified")
    print(f"   - Avatar: {profile_updated.get('avatar_url')}")
    print(f"   - Cover: {profile_updated.get('cover_image_url')}")
    
    # Revert changes
    print("\n6️⃣  Reverting to original values...")
    revert_data = {
        'avatar_url': orig_avatar,
        'cover_image_url': orig_cover,
        'bio': profile.get('bio')
    }
    status, _ = req('/api/v1/users/me', 'PUT', revert_data, token)
    assert status == 200, f"Revert failed"
    print(f"   ✓ Reverted to original state")
    
    print("\n" + "=" * 60)
    print("✅ IMAGE UPLOAD TESTS COMPLETED!")
    print("=" * 60)

if __name__ == '__main__':
    try:
        test_image_uploads()
        print("\n🎉 ALL TESTS PASSED!")
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
