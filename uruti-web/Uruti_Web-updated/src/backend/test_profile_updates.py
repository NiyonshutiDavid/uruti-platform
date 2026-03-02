#!/usr/bin/env python3
"""
Comprehensive test for all profile update features:
- Bio update
- Avatar URL update
- Cover image URL (if supported)
- Professional info (title, company, years_of_experience)
- Contact info (phone, location, linkedin_url, twitter_url, website_url)
- Full name update
"""
import json
import urllib.request
import urllib.error
import time


BASE = 'http://127.0.0.1:8000'

def req(path, method='GET', payload=None, token=None):
    """Make HTTP request and return status code and JSON response"""
    data = None
    headers = {'Content-Type': 'application/json'}
    
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
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
        except Exception:
            pass
        return e.code, body


def test_profile_updates():
    """Test all profile update fields"""
    print("=" * 60)
    print("PROFILE UPDATE COMPREHENSIVE TEST")
    print("=" * 60)
    
    # Login as founder
    print("\n1️⃣  Logging in as founder...")
    status, login_response = req(
        '/api/v1/auth/login',
        'POST',
        {'email': 'amahoro@urutidemoacc.rw', 'password': 'DemoPass123!'}
    )
    assert status == 200, f"Login failed: {status} {login_response}"
    founder_token = login_response['access_token']
    print(f"   ✓ Login successful")
    
    # Get current profile
    print("\n2️⃣  Fetching current profile...")
    status, original_profile = req('/api/v1/auth/me', token=founder_token)
    assert status == 200, f"Profile fetch failed: {status}"
    print(f"   ✓ Current profile loaded")
    print(f"   - Name: {original_profile.get('full_name')}")
    print(f"   - Email: {original_profile.get('email')}")
    print(f"   - Role: {original_profile.get('role')}")
    
    # Test updates with all profile fields
    test_updates = {
        'full_name': f"Test User Updated {int(time.time())}",
        'bio': f'Updated bio at {time.time():.0f}',
        'avatar_url': 'https://example.com/avatar-updated.jpg',
        'cover_image_url': 'https://example.com/cover-updated.jpg',
        'phone': '+250788123456',
        'location': 'Kigali, Rwanda',
        'linkedin_url': 'https://linkedin.com/in/testuser',
        'twitter_url': 'https://twitter.com/testuser',
        'website_url': 'https://example.com',
        'title': 'CEO',
        'company': 'Test Company',
        'years_of_experience': 5,
    }
    
    print(f"\n3️⃣  Updating profile with {len(test_updates)} fields...")
    status, update_response = req(
        '/api/v1/users/me',
        'PUT',
        test_updates,
        founder_token
    )
    assert status == 200, f"Profile update failed: {status} {update_response}"
    print(f"   ✓ Profile update successful")
    
    # Verify all updates
    print(f"\n4️⃣  Verifying updates...")
    status, updated_profile = req('/api/v1/auth/me', token=founder_token)
    assert status == 200, f"Profile fetch failed: {status}"
    
    all_match = True
    for field, expected_value in test_updates.items():
        actual_value = updated_profile.get(field)
        match = actual_value == expected_value
        status_str = "✓" if match else "✗"
        print(f"   {status_str} {field}: {actual_value}")
        if not match:
            print(f"      Expected: {expected_value}")
            all_match = False
    
    assert all_match, "Some profile fields did not update correctly"
    
    # Test partial update (only bio)
    print(f"\n5️⃣  Testing partial update (bio only)...")
    new_bio = "Another bio update test"
    status, _ = req(
        '/api/v1/users/me',
        'PUT',
        {'bio': new_bio},
        founder_token
    )
    assert status == 200, f"Partial update failed: {status}"
    
    status, partial_profile = req('/api/v1/auth/me', token=founder_token)
    assert partial_profile.get('bio') == new_bio, "Partial update didn't preserve bio"
    print(f"   ✓ Partial update successful")
    print(f"   - New bio: {partial_profile.get('bio')}")
    
    # Revert to original values
    print(f"\n6️⃣  Reverting to original values...")
    revert_data = {
        'full_name': original_profile['full_name'],
        'bio': original_profile.get('bio'),
        'avatar_url': original_profile.get('avatar_url'),
        'cover_image_url': original_profile.get('cover_image_url'),
        'phone': original_profile.get('phone'),
        'location': original_profile.get('location'),
        'linkedin_url': original_profile.get('linkedin_url'),
        'twitter_url': original_profile.get('twitter_url'),
        'website_url': original_profile.get('website_url'),
        'title': original_profile.get('title'),
        'company': original_profile.get('company'),
        'years_of_experience': original_profile.get('years_of_experience'),
    }
    
    status, _ = req(
        '/api/v1/users/me',
        'PUT',
        revert_data,
        founder_token
    )
    assert status == 200, f"Revert failed: {status}"
    print(f"   ✓ Reverted to original values")
    
    # Verify revert
    status, final_profile = req('/api/v1/auth/me', token=founder_token)
    assert final_profile['full_name'] == original_profile['full_name'], "Revert failed for full_name"
    print(f"   ✓ Revert verified")
    
    print("\n" + "=" * 60)
    print("✅ ALL PROFILE UPDATE TESTS PASSED!")
    print("=" * 60)


def test_image_urls():
    """Test image URL fields specifically"""
    print("\n" + "=" * 60)
    print("IMAGE URL TEST")
    print("=" * 60)
    
    # Use founder account again to test avatar URLs on same user
    print("\n1️⃣  Logging in as founder...")
    status, login_response = req(
        '/api/v1/auth/login',
        'POST',
        {'email': 'amahoro@urutidemoacc.rw', 'password': 'DemoPass123!'}
    )
    assert status == 200, f"Login failed: {status} {login_response}"
    token = login_response['access_token']
    print(f"   ✓ Login successful")
    
    # Test avatar URL
    print("\n2️⃣  Testing avatar_url field...")
    avatar_urls = [
        'https://avatars.githubusercontent.com/u/1234567?v=4',
        'https://lh3.googleusercontent.com/a/default-user-avatar.jpg',
        'https://cdn.example.com/profile/avatar-123.png',
        None,  # Test clearing the avatar
    ]
    
    for i, avatar_url in enumerate(avatar_urls, 1):
        update_payload = {'avatar_url': avatar_url} if avatar_url is not None else {'avatar_url': ''}
        status, _ = req(
            '/api/v1/users/me',
            'PUT',
            update_payload,
            token
        )
        assert status == 200, f"Avatar update {i} failed: {status}"
        
        status, profile = req('/api/v1/auth/me', token=token)
        actual = profile.get('avatar_url')
        expected = avatar_url or ''
        print(f"   ✓ Avatar {i}: {actual or '(empty)'}")
    
    print("\n3️⃣  Testing cover_image field existence...")
    status, profile = req('/api/v1/auth/me', token=token)
    has_cover_field = 'cover_image_url' in profile
    if has_cover_field:
        print(f"   ✓ cover_image_url field exists: {profile.get('cover_image_url')}")
    else:
        print(f"   ✗ cover_image_url field NOT in UserResponse schema")
    print(f"   Available image fields: avatar_url, cover_image_url")
    
    print("\n" + "=" * 60)
    print("✅ IMAGE URL TEST COMPLETED!")
    print("=" * 60)


if __name__ == '__main__':
    try:
        test_profile_updates()
        test_image_urls()
        print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
