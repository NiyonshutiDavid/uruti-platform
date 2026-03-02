#!/usr/bin/env python3
import json
import time
import urllib.request
import urllib.error
from typing import Any, Dict, Optional, Tuple, List

BASE = 'http://127.0.0.1:8000'
DEFAULT_PASSWORD = 'DemoPass123!'


def req(path: str, method: str = 'GET', payload: Optional[Dict[str, Any]] = None, token: Optional[str] = None):
    data = json.dumps(payload).encode('utf-8') if payload is not None else None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    request = urllib.request.Request(f'{BASE}{path}', data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            body = response.read().decode('utf-8')
            return response.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as err:
        body = err.read().decode('utf-8')
        try:
            body = json.loads(body)
        except Exception:
            pass
        return err.code, body


def login_with_identifier(identifier: str, password: str) -> Tuple[bool, Optional[str], str]:
    # Try as email payload first
    status, payload = req('/api/v1/auth/login', 'POST', {'email': identifier, 'password': password})
    if status == 200 and isinstance(payload, dict) and payload.get('access_token'):
        return True, payload['access_token'], 'email'

    # Fallback: some environments accept username key
    status, payload = req('/api/v1/auth/login', 'POST', {'username': identifier, 'password': password})
    if status == 200 and isinstance(payload, dict) and payload.get('access_token'):
        return True, payload['access_token'], 'username'

    return False, None, 'none'


def find_investor_identifier(founder_token: str) -> Optional[str]:
    status, users = req('/api/v1/users/?skip=0&limit=200', token=founder_token)
    if status != 200 or not isinstance(users, list):
        return None

    for user in users:
        if str(user.get('role')) == 'investor' and user.get('email'):
            return user['email']
    return None


def pick_baseline(me: Dict[str, Any]) -> Dict[str, Any]:
    keys = [
        'bio',
        'location',
        'phone',
        'title',
        'company',
        'website_url',
        'linkedin_url',
        'twitter_url',
    ]
    return {k: me.get(k) for k in keys}


def run_profile_roundtrip(label: str, token: str) -> Dict[str, Any]:
    status, me_before = req('/api/v1/auth/me', token=token)
    if status != 200:
        raise RuntimeError(f'{label}: failed to fetch profile before update: {status} {me_before}')

    baseline = pick_baseline(me_before)
    marker = str(int(time.time()))

    update_payload = {
        'bio': f'{label} bio smoke {marker}',
        'location': f'{label} City {marker}',
        'phone': f'+250700{marker[-6:]}',
        'title': f'{label} Title {marker}',
        'company': f'{label} Co {marker}',
        'website_url': f'https://{label.lower()}-{marker}.example.com',
        'linkedin_url': f'https://linkedin.com/in/{label.lower()}-{marker}',
        'twitter_url': f'https://x.com/{label.lower()}_{marker}',
    }

    status, update_resp = req('/api/v1/users/me', 'PUT', update_payload, token)
    if status != 200:
        raise RuntimeError(f'{label}: update failed: {status} {update_resp}')

    status, me_after = req('/api/v1/auth/me', token=token)
    if status != 200:
        raise RuntimeError(f'{label}: failed to fetch profile after update: {status} {me_after}')

    mismatches: List[str] = []
    for key, value in update_payload.items():
        if me_after.get(key) != value:
            mismatches.append(f'{key}: expected={value} actual={me_after.get(key)}')

    # Revert to baseline
    status, revert_resp = req('/api/v1/users/me', 'PUT', baseline, token)
    if status != 200:
        raise RuntimeError(f'{label}: revert failed: {status} {revert_resp}')

    return {
        'label': label,
        'name': me_before.get('full_name'),
        'email': me_before.get('email'),
        'updated_keys': list(update_payload.keys()),
        'mismatches': mismatches,
        'before': baseline,
        'after': {k: me_after.get(k) for k in baseline.keys()},
    }


def main():
    # Founder login (known account)
    founder_ok, founder_token, founder_mode = login_with_identifier('amahoro@urutidemoacc.rw', DEFAULT_PASSWORD)
    if not founder_ok or not founder_token:
        raise RuntimeError('Founder login failed with known credentials')

    # Find investor account and login
    investor_identifier = find_investor_identifier(founder_token)
    if not investor_identifier:
        # fallback commonly used demo username
        investor_identifier = 'igihe_startups'

    investor_ok, investor_token, investor_mode = login_with_identifier(investor_identifier, DEFAULT_PASSWORD)
    if not investor_ok or not investor_token:
        raise RuntimeError(f'Investor login failed for identifier={investor_identifier}')

    founder_result = run_profile_roundtrip('Founder', founder_token)
    investor_result = run_profile_roundtrip('Investor', investor_token)

    print('=== PROFILE UPDATE LIVE SANITY RESULTS ===')
    print(f"Founder login mode: {founder_mode}")
    print(f"Investor identifier used: {investor_identifier}")
    print(f"Investor login mode: {investor_mode}")

    for result in [founder_result, investor_result]:
        print(f"\n[{result['label']}] {result['name']} <{result['email']}>")
        print(f"Updated keys: {', '.join(result['updated_keys'])}")
        if result['mismatches']:
            print('MISMATCHES:')
            for mismatch in result['mismatches']:
                print(f'  - {mismatch}')
        else:
            print('All updated fields matched expected values.')

        print('Before -> After snapshot:')
        for key in result['before'].keys():
            print(f"  {key}: {result['before'].get(key)} -> {result['after'].get(key)}")

    if founder_result['mismatches'] or investor_result['mismatches']:
        raise RuntimeError('One or more profile fields did not persist as expected')

    print('\nOK: Founder and investor profile updates are persisting and syncing via backend.')


if __name__ == '__main__':
    main()
