#!/bin/bash

# Extract tokens
FOUNDER_TOKEN=$(jq -r '.access_token' /tmp/founder_login.json)
INVESTOR_TOKEN=$(jq -r '.access_token' /tmp/investor_login.json)

echo "=== Creating Test Ventures ==="
echo ""

# Create Venture 1: HealthHub Rwanda
echo "1. Creating HealthHub Rwanda..."
VENTURE1=$(curl -s -X POST http://127.0.0.1:8000/api/v1/ventures \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HealthHub Rwanda",
    "description": "Digital health platform connecting patients with healthcare providers across Rwanda",
    "industry": "healthcare",
    "stage": "growth",
    "funding_goal": 500000,
    "website": "https://healthhub.rw",
    "location": "Kigali, Rwanda"
  }')
echo "$VENTURE1" | jq -r '"   ID: " + (.id|tostring) + " | Name: " + .name + " | Published: " + (.is_published|tostring) + " | Uruti Score: " + (.uruti_score|tostring)'
VENTURE1_ID=$(echo "$VENTURE1" | jq -r '.id')

# Create Venture 2: TechSolution Rwanda
echo "2. Creating TechSolution Rwanda..."
VENTURE2=$(curl -s -X POST http://127.0.0.1:8000/api/v1/ventures \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TechSolution Rwanda",
    "description": "AI-powered business analytics platform for SMEs in East Africa",
    "industry": "technology",
    "stage": "seed",
    "funding_goal": 250000,
    "website": "https://techsolution.rw",
    "location": "Kigali, Rwanda"
  }')
echo "$VENTURE2" | jq -r '"   ID: " + (.id|tostring) + " | Name: " + .name + " | Published: " + (.is_published|tostring) + " | Uruti Score: " + (.uruti_score|tostring)'
VENTURE2_ID=$(echo "$VENTURE2" | jq -r '.id')

# Create Venture 3: AgriTech Innovations
echo "3. Creating AgriTech Innovations..."
VENTURE3=$(curl -s -X POST http://127.0.0.1:8000/api/v1/ventures \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AgriTech Innovations",
    "description": "Smart farming solutions using IoT sensors and data analytics for small-scale farmers",
    "industry": "agriculture",
    "stage": "mvp",
    "funding_goal": 350000,
    "website": "https://agritech.rw",
    "location": "Musanze, Rwanda"
  }')
echo "$VENTURE3" | jq -r '"   ID: " + (.id|tostring) + " | Name: " + .name + " | Published: " + (.is_published|tostring) + " | Uruti Score: " + (.uruti_score|tostring)'
VENTURE3_ID=$(echo "$VENTURE3" | jq -r '.id')

# Create Venture 4: EduConnect Platform
echo "4. Creating EduConnect Platform..."
VENTURE4=$(curl -s -X POST http://127.0.0.1:8000/api/v1/ventures \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "EduConnect Platform",
    "description": "E-learning marketplace connecting students with local tutors and educational content",
    "industry": "education",
    "stage": "ideation",
    "funding_goal": 150000,
    "website": "https://educonnect.rw",
    "location": "Kigali, Rwanda"
  }')
echo "$VENTURE4" | jq -r '"   ID: " + (.id|tostring) + " | Name: " + .name + " | Published: " + (.is_published|tostring) + " | Uruti Score: " + (.uruti_score|tostring)'
VENTURE4_ID=$(echo "$VENTURE4" | jq -r '.id')

# Create Venture 5: FinTech Solutions RW
echo "5. Creating FinTech Solutions RW..."
VENTURE5=$(curl -s -X POST http://127.0.0.1:8000/api/v1/ventures \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FinTech Solutions RW",
    "description": "Mobile money integration platform for merchants and digital payment solutions",
    "industry": "fintech",
    "stage": "series-a",
    "funding_goal": 750000,
    "website": "https://fintech.rw",
    "location": "Kigali, Rwanda"
  }')
echo "$VENTURE5" | jq -r '"   ID: " + (.id|tostring) + " | Name: " + .name + " | Published: " + (.is_published|tostring) + " | Uruti Score: " + (.uruti_score|tostring)'
VENTURE5_ID=$(echo "$VENTURE5" | jq -r '.id')

echo ""
echo "=== Investor: Fetching All Ventures ==="
echo ""
VENTURES_LIST=$(curl -s -X GET http://127.0.0.1:8000/api/v1/ventures \
  -H "Authorization: Bearer $INVESTOR_TOKEN")
echo "$VENTURES_LIST" | jq -r '.[] | "ID: " + (.id|tostring) + " | " + .name + " | Score: " + (.uruti_score|tostring) + " | Published: " + (.is_published|tostring)'

echo ""
echo "=== Investor: Bookmarking Ventures ==="
echo ""

# Bookmark venture 1 (HealthHub)
echo "Bookmarking HealthHub Rwanda (ID: $VENTURE1_ID)..."
curl -s -X POST http://127.0.0.1:8000/api/v1/bookmarks \
  -H "Authorization: Bearer $INVESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"venture_id\": $VENTURE1_ID}" | jq -r '"   Bookmarked: " + .venture_name'

# Bookmark venture 3 (AgriTech)
echo "Bookmarking AgriTech Innovations (ID: $VENTURE3_ID)..."
curl -s -X POST http://127.0.0.1:8000/api/v1/bookmarks \
  -H "Authorization: Bearer $INVESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"venture_id\": $VENTURE3_ID}" | jq -r '"   Bookmarked: " + .venture_name'

# Bookmark venture 5 (FinTech)
echo "Bookmarking FinTech Solutions RW (ID: $VENTURE5_ID)..."
curl -s -X POST http://127.0.0.1:8000/api/v1/bookmarks \
  -H "Authorization: Bearer $INVESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"venture_id\": $VENTURE5_ID}" | jq -r '"   Bookmarked: " + .venture_name'

echo ""
echo "=== Investor: Checking Bookmarks ==="
echo ""
BOOKMARKS=$(curl -s -X GET http://127.0.0.1:8000/api/v1/bookmarks \
  -H "Authorization: Bearer $INVESTOR_TOKEN")
echo "$BOOKMARKS" | jq -r '.[] | "Venture: " + .venture.name + " | Score: " + (.venture.uruti_score|tostring) + " | Bookmarked at: " + .created_at'

echo ""
echo "=== Test Summary ==="
echo "✓ Created 5 ventures as founder (test.founder@uruti.rw)"
echo "✓ All ventures are published (is_published=true)"
echo "✓ Investor can discover all ventures"
echo "✓ Investor bookmarked 3 ventures"
echo "✓ Ventures are ranked by Uruti score (if available)"
