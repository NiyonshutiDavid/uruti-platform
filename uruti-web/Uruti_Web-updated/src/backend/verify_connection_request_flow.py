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
    sender_email = f'sender_{suffix}@example.com'
    receiver_email = f'receiver_{suffix}@example.com'
    password = 'TempPass123!'

    for email, name in [(sender_email, 'Sender Test'), (receiver_email, 'Receiver Test')]:
        status, payload = req('/api/v1/auth/register', 'POST', {
            'email': email,
            'full_name': name,
            'password': password,
            'role': 'founder',
        })
        if status not in (200, 201):
            raise RuntimeError(f'register failed for {email}: {status} {payload}')

    status, sender_login = req('/api/v1/auth/login', 'POST', {'email': sender_email, 'password': password})
    if status != 200:
        raise RuntimeError(f'sender login failed: {status} {sender_login}')
    sender_token = sender_login['access_token']

    status, receiver_login = req('/api/v1/auth/login', 'POST', {'email': receiver_email, 'password': password})
    if status != 200:
        raise RuntimeError(f'receiver login failed: {status} {receiver_login}')
    receiver_token = receiver_login['access_token']

    status, receiver_me = req('/api/v1/auth/me', 'GET', token=receiver_token)
    if status != 200:
        raise RuntimeError(f'receiver /me failed: {status} {receiver_me}')
    receiver_id = receiver_me['id']

    status, request_payload = req('/api/v1/connections/request', 'POST', {'user_id': receiver_id}, sender_token)
    if status != 201:
        raise RuntimeError(f'send request failed: {status} {request_payload}')
    request_id = request_payload['id']

    status, sent_pending = req('/api/v1/connections/requests/sent?status_filter=pending', 'GET', token=sender_token)
    if status != 200 or not any(r['id'] == request_id for r in sent_pending):
        raise RuntimeError(f'sent pending retrieval failed: {status} {sent_pending}')

    status, forbidden = req(f'/api/v1/connections/request/{request_id}/accept', 'PUT', token=sender_token)
    if status != 403:
        raise RuntimeError(f'sender should not be able to accept: {status} {forbidden}')

    status, received_pending = req('/api/v1/connections/requests/received?status_filter=pending', 'GET', token=receiver_token)
    if status != 200 or not any(r['id'] == request_id for r in received_pending):
        raise RuntimeError(f'received pending retrieval failed: {status} {received_pending}')

    status, accepted = req(f'/api/v1/connections/request/{request_id}/accept', 'PUT', token=receiver_token)
    if status != 200:
        raise RuntimeError(f'receiver accept failed: {status} {accepted}')

    status, sent_accepted = req('/api/v1/connections/requests/sent?status_filter=accepted', 'GET', token=sender_token)
    if status != 200 or not any(r['id'] == request_id for r in sent_accepted):
        raise RuntimeError(f'sent accepted retrieval failed: {status} {sent_accepted}')

    print('OK: sent retrieval works and receiver approval is enforced')


if __name__ == '__main__':
    main()
