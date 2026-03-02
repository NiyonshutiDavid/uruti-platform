#!/usr/bin/env python3
import json
import time
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:8000'


def req(path, method='GET', payload=None, token=None):
    data = json.dumps(payload).encode() if payload is not None else None
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


def main():
    suffix = str(int(time.time()))
    sender_email = f'cancel_sender_{suffix}@example.com'
    receiver_email = f'cancel_receiver_{suffix}@example.com'
    password = 'TempPass123!'

    for email, name in [(sender_email, 'Cancel Sender'), (receiver_email, 'Cancel Receiver')]:
        status, payload = req('/api/v1/auth/register', 'POST', {
            'email': email,
            'full_name': name,
            'password': password,
            'role': 'founder',
        })
        if status not in (200, 201):
            raise RuntimeError(f'register failed for {email}: {status} {payload}')

    status, sender_login = req('/api/v1/auth/login', 'POST', {'email': sender_email, 'password': password})
    sender_token = sender_login.get('access_token')
    status, receiver_login = req('/api/v1/auth/login', 'POST', {'email': receiver_email, 'password': password})
    receiver_token = receiver_login.get('access_token')

    if not sender_token or not receiver_token:
        raise RuntimeError('login failed for sender or receiver')

    status, receiver_me = req('/api/v1/auth/me', token=receiver_token)
    if status != 200:
        raise RuntimeError(f'receiver /me failed: {status} {receiver_me}')

    receiver_id = receiver_me['id']
    status, created = req('/api/v1/connections/request', 'POST', {'user_id': receiver_id}, sender_token)
    if status != 201:
        raise RuntimeError(f'create request failed: {status} {created}')

    request_id = created['id']

    status, _ = req(f'/api/v1/connections/request/{request_id}/cancel', 'DELETE', token=sender_token)
    if status != 204:
        raise RuntimeError(f'cancel by sender failed: {status}')

    status, sent_pending = req('/api/v1/connections/requests/sent?status_filter=pending', token=sender_token)
    if status != 200:
        raise RuntimeError(f'fetch sent pending failed: {status}')

    if any(item.get('id') == request_id for item in sent_pending):
        raise RuntimeError('cancelled request still appears in sent pending list')

    print('OK: sender can cancel sent pending request and it is removed from pending lists')


if __name__ == '__main__':
    main()
