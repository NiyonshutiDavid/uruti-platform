#!/usr/bin/env python3
"""
Seed script to populate the advisory_tracks table with default educational tracks
Run this script to add example tracks to the database
"""

import sys
sys.path.insert(0, '/Users/davidniyonshutii/Documents/MissionCapstone/uruti-platform/uruti-web/Uruti_Web-updated/src/backend')

from app.database import SessionLocal
from app.models import AdvisoryTrack

# Define the default advisory tracks
DEFAULT_TRACKS = [
    {
        "title": "Financial Projection Validation",
        "description": "Learn to build realistic financial models that attract investors. Covers revenue projections, cost analysis, and break-even calculations.",
        "category": "financial",
        "modules": 8,
        "duration": "4 weeks",
        "objectives": [
            "Build 3-year revenue projections",
            "Calculate customer acquisition costs",
            "Develop realistic cash flow models",
            "Understand key financial metrics for investors"
        ],
        "materials": [
            {
                "name": "Financial Model Template",
                "type": "Excel",
                "url": "https://resources.uruti.rw/financial-model-template.xlsx",
                "description": "A comprehensive Excel template for 3-year financial projections",
                "content": "Use this workbook to model revenue assumptions, COGS, burn rate, runway, and 3-case scenarios (base/upside/downside)."
            },
            {
                "name": "Unit Economics Guide",
                "type": "PDF",
                "url": "https://resources.uruti.rw/unit-economics.pdf",
                "description": "Understanding and calculating your unit economics",
                "content": "Covers CAC, LTV, payback period, gross margin and how to benchmark unit economics for investor-readiness."
            }
        ]
    },
    {
        "title": "Legal Compliance for Startups",
        "description": "Navigate the legal landscape of starting a business in Rwanda. Understand entity structures, intellectual property, and regulatory requirements.",
        "category": "legal",
        "modules": 6,
        "duration": "3 weeks",
        "objectives": [
            "Set up proper business structure",
            "Protect founder equity",
            "Comply with regulatory requirements",
            "Secure intellectual property"
        ],
        "materials": [
            {
                "name": "Rwanda Startup Legal Guide",
                "type": "PDF",
                "url": "https://resources.uruti.rw/rwanda-startup-legal.pdf",
                "description": "Complete guide to legal requirements for startups in Rwanda",
                "content": "Practical legal setup checklist: entity formation, compliance milestones, IP basics, and board governance hygiene."
            },
            {
                "name": "Incorporation Checklist",
                "type": "Word",
                "url": "https://resources.uruti.rw/incorporation-checklist.docx",
                "description": "Step-by-step checklist for business registration",
                "content": "Step sequence for registration, shareholder structure, founder agreements, and first 90-day compliance tasks."
            }
        ]
    },
    {
        "title": "Market Research & Validation",
        "description": "Master customer discovery and validate your market assumptions before full launch. Learn proven techniques for validating demand.",
        "category": "market",
        "modules": 7,
        "duration": "3 weeks",
        "objectives": [
            "Conduct effective customer interviews",
            "Validate market assumptions",
            "Calculate TAM, SAM, SOM",
            "Build repeatable customer acquisition process"
        ],
        "materials": [
            {
                "name": "Customer Interview Guide",
                "type": "PDF",
                "url": "https://resources.uruti.rw/customer-interview-guide.pdf",
                "description": "Proven framework for conducting effective customer interviews",
                "content": "Includes interview scripts, anti-leading-question tips, and a synthesis template for insights and next experiments."
            },
            {
                "name": "Market Sizing Workbook",
                "type": "Excel",
                "url": "https://resources.uruti.rw/market-sizing.xlsx",
                "description": "Calculate your TAM, SAM, and SOM",
                "content": "Guided model for TAM/SAM/SOM with assumptions log and sensitivity table for conservative vs aggressive scenarios."
            }
        ]
    },
    {
        "title": "Pitch Deck Development",
        "description": "Create a compelling pitch deck that tells your startup story and attracts investor interest. Learn what investors want to see.",
        "category": "pitch",
        "modules": 5,
        "duration": "2 weeks",
        "objectives": [
            "Create a 10-slide investor pitch deck",
            "Tell a compelling startup story",
            "Present traction and metrics effectively",
            "Handle investor Q&A with confidence"
        ],
        "materials": [
            {
                "name": "Pitch Deck Template",
                "type": "PowerPoint",
                "url": "https://resources.uruti.rw/pitch-deck-template.pptx",
                "description": "Professional pitch deck template with best practices",
                "content": "Investor-focused 10-slide structure with prompts for problem, solution, traction, GTM, economics, team, and ask."
            },
            {
                "name": "Investor Pitch Guide",
                "type": "PDF",
                "url": "https://resources.uruti.rw/investor-pitch-guide.pdf",
                "description": "Complete guide to pitching investors effectively",
                "content": "How to tailor narrative per investor profile, handle hard questions, and run a disciplined fundraising process."
            }
        ]
    },
    {
        "title": "Go-to-Market Execution",
        "description": "Design and execute a practical go-to-market strategy with channel priorities, pricing tests, and repeatable growth loops.",
        "category": "market",
        "modules": 6,
        "duration": "3 weeks",
        "objectives": [
            "Define an actionable ICP and buyer journey",
            "Prioritize acquisition channels by unit economics",
            "Run pricing and messaging experiments",
            "Build weekly GTM KPI cadence"
        ],
        "materials": [
            {
                "name": "GTM Planning Worksheet",
                "type": "Excel",
                "url": "https://resources.uruti.rw/gtm-planning-worksheet.xlsx",
                "description": "Template to plan channels, campaigns, budgets, and expected conversion metrics",
                "content": "Includes channel scorecard, funnel assumptions, CAC/LTV checks, and a 12-week experiment planner."
            },
            {
                "name": "Pricing & Positioning Playbook",
                "type": "PDF",
                "url": "https://resources.uruti.rw/pricing-positioning-playbook.pdf",
                "description": "Hands-on guide to positioning, packaging, and pricing for early-stage ventures",
                "content": "Covers value metric selection, tier design, pilot pricing tests, objection handling, and win/loss notes."
            }
        ]
    }
]

def seed_advisory_tracks():
    """Upsert default advisory tracks to the database"""
    db = SessionLocal()
    try:
        created_count = 0
        updated_count = 0
        deleted_duplicates = 0

        # Remove duplicate records for seeded titles and keep the oldest entry
        seeded_titles = [track["title"] for track in DEFAULT_TRACKS]
        for title in seeded_titles:
            duplicates = db.query(AdvisoryTrack).filter(AdvisoryTrack.title == title).order_by(AdvisoryTrack.id.asc()).all()
            if len(duplicates) > 1:
                for duplicate in duplicates[1:]:
                    db.delete(duplicate)
                    deleted_duplicates += 1

        for track_data in DEFAULT_TRACKS:
            existing_track = db.query(AdvisoryTrack).filter(AdvisoryTrack.title == track_data["title"]).first()
            if existing_track:
                existing_track.description = track_data["description"]
                existing_track.category = track_data["category"]
                existing_track.modules = track_data["modules"]
                existing_track.duration = track_data["duration"]
                existing_track.objectives = track_data["objectives"]
                existing_track.materials = track_data["materials"]
                existing_track.is_active = True
                updated_count += 1
                print(f"✓ Updated: {track_data['title']}")
            else:
                track = AdvisoryTrack(**track_data)
                db.add(track)
                created_count += 1
                print(f"✓ Added: {track_data['title']}")
        
        db.commit()
        print(f"\n✓ Advisory tracks synced. Created: {created_count}, Updated: {updated_count}, Duplicates removed: {deleted_duplicates}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"✗ Seeding failed: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = seed_advisory_tracks()
    exit(0 if success else 1)
