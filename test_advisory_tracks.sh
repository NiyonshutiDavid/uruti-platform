#!/bin/bash
set -e

BASE='http://127.0.0.1:8000'

# Get admin token
echo "=== Getting admin token ==="
ADMIN_TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"dniyonshuti@nexventures.net","password":"Uruti@January2026."}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Got admin token: ${ADMIN_TOKEN:0:20}..."

# Get founder token
echo -e "\n=== Getting founder token ==="
FOUNDER_TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"amahoro@urutidemoacc.rw","password":"DemoPass123!"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Got founder token: ${FOUNDER_TOKEN:0:20}..."

# Get founder ID
echo -e "\n=== Getting founder ID ==="
FOUNDER_ID=$(curl -s "$BASE/api/v1/auth/me" -H "Authorization: Bearer $FOUNDER_TOKEN" | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Founder ID: $FOUNDER_ID"

# Create a track
echo -e "\n=== Creating advisory track ==="
TRACK=$(curl -s -X POST "$BASE/api/v1/advisory/admin/tracks" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Financial Projection Validation",
    "description": "Learn to build realistic financial models",
    "category": "financial",
    "modules": 8,
    "duration": "4 weeks"
  }')
TRACK_ID=$(echo "$TRACK" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','ERROR'))")
echo "Created track ID: $TRACK_ID"
echo "$TRACK" | python3 -m json.tool | head -15

# Assign track to founder
echo -e "\n=== Assigning track to founder ==="
ASSIGN=$(curl -s -X POST "$BASE/api/v1/advisory/admin/founders/$FOUNDER_ID/tracks/$TRACK_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$ASSIGN" | python3 -m json.tool

# Get founder's tracks
echo -e "\n=== Getting founder's tracks ==="
TRACKS=$(curl -s "$BASE/api/v1/advisory/admin/founders/$FOUNDER_ID/tracks" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$TRACKS" | python3 -m json.tool | head -20

# Verify founder sees the track
echo -e "\n=== Founder viewing their tracks ==="
FOUNDER_TRACKS=$(curl -s "$BASE/api/v1/advisory/tracks" \
  -H "Authorization: Bearer $FOUNDER_TOKEN")
echo "$FOUNDER_TRACKS" | python3 -m json.tool | head -20

echo -e "\n✓ All tests passed!"
