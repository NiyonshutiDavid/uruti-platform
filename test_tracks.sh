#!/bin/bash
BASE='http://127.0.0.1:8000'
CREDS='{"email":"dniyonshuti@nexventures.net","password":"Uruti@January2026."}'

echo "Getting token..."
TOK=$(curl -s -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' -d "$CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -n "$TOK" ]; then
  echo "✓ Token obtained (length: ${#TOK})"
  echo ""
  echo "Fetching advisory tracks..."
  curl -s "$BASE/api/v1/advisory/tracks" -H "Authorization: Bearer $TOK" | python3 -m json.tool | head -50
else
  echo "✗ Token: Failed"
fi
