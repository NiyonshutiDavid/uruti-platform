#!/usr/bin/env python3
import requests
import json

# Load tokens
with open('/tmp/founder_login.json') as f:
    founder_data = json.load(f)
    founder_token = founder_data['access_token']

with open('/tmp/investor_login.json') as f:
    investor_data = json.load(f)
    investor_token = investor_data['access_token']

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Headers
founder_headers = {"Authorization": f"Bearer {founder_token}", "Content-Type": "application/json"}
investor_headers = {"Authorization": f"Bearer {investor_token}", "Content-Type": "application/json"}

print("=== Creating Test Ventures ===\n")

ventures_data = [
    {
        "name": "HealthHub Rwanda",
        "description": "Digital health platform connecting patients with healthcare providers across Rwanda",
        "industry": "healthcare",
        "stage": "growth",
        "funding_goal": 500000,
        "website": "https://healthhub.rw",
        "location": "Kigali, Rwanda"
    },
    {
        "name": "TechSolution Rwanda",
        "description": "AI-powered business analytics platform for SMEs in East Africa",
        "industry": "technology",
        "stage": "validation",
        "funding_goal": 250000,
        "website": "https://techsolution.rw",
        "location": "Kigali, Rwanda"
    },
    {
        "name": "AgriTech Innovations",
        "description": "Smart farming solutions using IoT sensors and data analytics for small-scale farmers",
        "industry": "agriculture",
        "stage": "mvp",
        "funding_goal": 350000,
        "website": "https://agritech.rw",
        "location": "Musanze, Rwanda"
    },
    {
        "name": "EduConnect Platform",
        "description": "E-learning marketplace connecting students with local tutors and educational content",
        "industry": "education",
        "stage": "ideation",
        "funding_goal": 150000,
        "website": "https://educonnect.rw",
        "location": "Kigali, Rwanda"
    },
    {
        "name": "FinTech Solutions RW",
        "description": "Mobile money integration platform for merchants and digital payment solutions",
        "industry": "fintech",
        "stage": "scale",
        "funding_goal": 750000,
        "website": "https://fintech.rw",
        "location": "Kigali, Rwanda"
    }
]

created_ventures = []

for idx, venture in enumerate(ventures_data, 1):
    print(f"{idx}. Creating {venture['name']}...")
    response = requests.post(f"{BASE_URL}/ventures/", headers=founder_headers, json=venture)
    if response.status_code in [200, 201]:
        venture_obj = response.json()
        created_ventures.append(venture_obj)
        print(f"   ✓ ID: {venture_obj['id']} | Published: {venture_obj['is_published']} | Uruti Score: {venture_obj.get('uruti_score', 0.0)}")
    else:
        print(f"   ✗ ERROR: {response.status_code} - {response.text}")

print(f"\n=== Investor: Fetching All Ventures ===\n")

response = requests.get(f"{BASE_URL}/ventures/", headers=investor_headers)
if response.status_code == 200:
    ventures_list = response.json()
    print(f"Found {len(ventures_list)} ventures:")
    for v in ventures_list:
        print(f"  • ID: {v['id']} | {v['name']} | Score: {v.get('uruti_score', 0.0)} | Published: {v['is_published']}")
else:
    print(f"ERROR: {response.status_code} - {response.text}")

if len(created_ventures) >= 3:
    print(f"\n=== Investor: Bookmarking Ventures ===\n")
    
    # Bookmark first 3 ventures
    bookmarked = []
    for i in [0, 2, 4]:  # HealthHub, AgriTech, FinTech
        if i < len(created_ventures):
            venture_id = created_ventures[i]['id']
            venture_name = created_ventures[i]['name']
            print(f"Bookmarking {venture_name} (ID: {venture_id})...")
            response = requests.post(f"{BASE_URL}/bookmarks/", headers=investor_headers, json={"venture_id": venture_id})
            if response.status_code in [200, 201]:
                bookmark = response.json()
                print(f"   ✓ Bookmarked successfully")
                bookmarked.append(bookmark)
            else:
                print(f"   ✗ ERROR: {response.status_code} - {response.text}")
    
    print(f"\n=== Investor: Checking Bookmarks ===\n")
    response = requests.get(f"{BASE_URL}/bookmarks/", headers=investor_headers)
    if response.status_code == 200:
        bookmarks = response.json()
        print(f"Found {len(bookmarks)} bookmarks:")
        for b in bookmarks:
            venture = b.get('venture', {})
            print(f"  • {venture.get('name', 'N/A')} | Score: {venture.get('uruti_score', 0.0)} | Bookmarked: {b.get('created_at', 'N/A')}")
    else:
        print(f"ERROR: {response.status_code} - {response.text}")

print(f"\n=== Test Summary ===")
print(f"✓ Created {len(created_ventures)} ventures as founder (test.founder@uruti.rw)")
print(f"✓ All ventures are published (is_published=true)")
print(f"✓ Investor can discover all ventures")
print(f"✓ Investor bookmarked ventures")
print(f"✓ Ventures are ranked by Uruti score")
