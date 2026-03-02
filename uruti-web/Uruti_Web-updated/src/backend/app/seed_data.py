"""
Seed script to populate the database with initial demo accounts.
Run with: python -m app.seed_data
"""

from app.database import SessionLocal, engine
from app.models import User, Venture, Base
from app.auth import get_password_hash, verify_password
import random

Base.metadata.create_all(bind=engine)


def seed_database():
    """Populate database with demo accounts and ventures"""
    db = SessionLocal()

    try:
        admin_email = "dniyonshuti@nexventures.net"
        admin_password = "Uruti@January2026."

        existing_admin = db.query(User).filter(User.email == admin_email).first()

        if not existing_admin:
            print("🔐 Creating admin account...")
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                full_name="David Niyonshuti",
                role="admin",
                bio="Platform Administrator - Founder of Uruti Digital Ecosystem",
                location="Kigali, Rwanda",
                company="Nex Ventures",
                avatar_url=None,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"✅ Admin account created: {admin_email}")
            print(f"   Password: {admin_password}")
        else:
            if not verify_password(admin_password, existing_admin.hashed_password):
                existing_admin.hashed_password = get_password_hash(admin_password)
                db.commit()
                print(f"🔁 Updated admin password for: {admin_email}")
                print(f"   Password: {admin_password}")
            else:
                print(f"ℹ️  Admin account already exists: {admin_email}")

        demo_emails = [
            "amahoro@urutidemoacc.rw",
            "keza@urutidemoacc.rw",
            "mucyo@urutidemoacc.rw",
            "imena@urutidemoacc.rw",
            "uwera@urutidemoacc.rw",
            "neza@urutidemoacc.rw",
            "ubuzima@urutidemoacc.rw",
            "urugendo@urutidemoacc.rw",
            "izuba@urutidemoacc.rw",
        ]
        existing_users = db.query(User).filter(User.email.in_(demo_emails)).count()

        if existing_users > 0:
            print(f"⚠️  Database already contains {existing_users} seed accounts. Skipping demo data...")
            print("💡 To reset, delete the database and run again.")
            return

        print("🌱 Seeding database with demo accounts...")

        demo_users = [
            {
                "email": "amahoro@urutidemoacc.rw",
                "password": "DemoPass123!",
                "full_name": "Amahoro Uwase",
                "role": "founder",
                "bio": "Tech entrepreneur building AI solutions for education in Rwanda. Former software engineer at Andela.",
                "location": "Kigali, Rwanda",
                "company": "Amahoro Tech",
                "avatar_url": None,
            },
            {
                "email": "keza@urutidemoacc.rw",
                "password": "DemoPass123!",
                "full_name": "Keza Mugisha",
                "role": "investor",
                "bio": "Angel investor focused on early-stage tech startups in East Africa. Portfolio includes 15+ companies.",
                "location": "Kigali, Rwanda",
                "company": "Keza Capital Partners",
                "avatar_url": None,
            },
            {
                "email": "mucyo@urutidemoacc.rw",
                "password": "DemoPass123!",
                "full_name": "Mucyo Nkubito",
                "role": "founder",
                "bio": "Agricultural technology innovator. Building smart farming solutions for smallholder farmers across Rwanda.",
                "location": "Musanze, Rwanda",
                "company": "AgriSmart Rwanda",
                "avatar_url": None,
            },
            {
                "email": "imena@urutidemoacc.rw",
                "password": "DemoPass123!",
                "full_name": "Imena Kalisa",
                "role": "investor",
                "bio": "Managing Partner at Imena Capital. 10+ years experience in venture capital across Africa.",
                "location": "Kigali, Rwanda",
                "company": "Imena Capital",
                "avatar_url": None,
            },
            {
                "email": "uwera@urutidemoacc.rw",
                "password": "DemoPass123!",
                "full_name": "Uwera Mutesi",
                "role": "founder",
                "bio": "Healthcare entrepreneur passionate about improving maternal health outcomes through mobile technology.",
                "location": "Kigali, Rwanda",
                "company": "MamaConnect",
                "avatar_url": None,
            },
            {
                "email": "neza@urutidemoacc.rw",
                "password": "DemoPass123!",
                "full_name": "Neza Gasana",
                "role": "founder",
                "bio": "FinTech founder building mobile payment solutions for informal traders and small businesses.",
                "location": "Kigali, Rwanda",
                "company": "PayNeza",
                "avatar_url": None,
            },
            {
                "email": "ubuzima@urutidemoacc.rw",
                "password": "DemoPass123!",
                "full_name": "Ubuzima Nkusi",
                "role": "founder",
                "bio": "Medical doctor turned entrepreneur. Developing telemedicine platform connecting rural patients with specialists.",
                "location": "Huye, Rwanda",
                "company": "TeleMed Rwanda",
                "avatar_url": None,
            },
            {
                "email": "urugendo@urutidemoacc.rw",
                "password": "DemoPass123!",
                "full_name": "Urugendo Hakizimana",
                "role": "founder",
                "bio": "Logistics entrepreneur optimizing last-mile delivery for e-commerce across Rwanda using smart routing.",
                "location": "Kigali, Rwanda",
                "company": "SwiftDeliver",
                "avatar_url": None,
            },
            {
                "email": "izuba@urutidemoacc.rw",
                "password": "DemoPass123!",
                "full_name": "Izuba Uwizeye",
                "role": "investor",
                "bio": "Impact investor focused on renewable energy and climate tech startups. Former World Bank consultant.",
                "location": "Kigali, Rwanda",
                "company": "Green Ventures Africa",
                "avatar_url": None,
            },
        ]

        created_users = []
        for user_data in demo_users:
            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                bio=user_data.get("bio"),
                location=user_data.get("location"),
                company=user_data.get("company"),
                avatar_url=user_data.get("avatar_url"),
            )
            db.add(user)
            created_users.append(user)
            print(f"✅ Created {user_data['role']}: {user_data['full_name']} ({user_data['email']})")

        db.commit()

        for user in created_users:
            db.refresh(user)

        ventures_data = [
            {
                "founder_email": "amahoro@urutidemoacc.rw",
                "name": "Amahoro Tech",
                "tagline": "AI-powered education platform for African students",
                "description": "Amahoro Tech is building an AI-powered adaptive learning platform that personalizes education for students across Africa. Our platform uses machine learning to identify knowledge gaps and provide targeted content, helping students learn 3x faster. We've partnered with 50+ schools in Rwanda and have 10,000+ active students.",
                "industry": "education",
                "stage": "growth",
                "funding_goal": 500000,
                "team_size": 12,
                "website": "https://amahorotech.rw",
                "pitch_deck_url": None,
                "video_url": None,
            },
            {
                "founder_email": "mucyo@urutidemoacc.rw",
                "name": "AgriSmart Rwanda",
                "tagline": "IoT-powered smart farming for smallholder farmers",
                "description": "AgriSmart provides affordable IoT sensors and mobile apps that help smallholder farmers monitor soil conditions, weather patterns, and crop health in real-time. Our solution has helped 2,000+ farmers increase yields by 40% while reducing water usage by 30%.",
                "industry": "agriculture",
                "stage": "early_traction",
                "funding_goal": 250000,
                "team_size": 8,
                "website": "https://agrismart.rw",
                "pitch_deck_url": None,
                "video_url": None,
            },
            {
                "founder_email": "uwera@urutidemoacc.rw",
                "name": "MamaConnect",
                "tagline": "Mobile health platform for maternal care",
                "description": "MamaConnect connects pregnant women with healthcare providers through SMS and voice calls, providing prenatal care guidance, appointment reminders, and emergency support. We've reached 15,000 mothers and reduced maternal mortality rates by 25% in our pilot districts.",
                "industry": "healthcare",
                "stage": "growth",
                "funding_goal": 400000,
                "team_size": 15,
                "website": "https://mamaconnect.rw",
                "pitch_deck_url": None,
                "video_url": None,
            },
            {
                "founder_email": "neza@urutidemoacc.rw",
                "name": "PayNeza",
                "tagline": "Mobile payments for informal traders",
                "description": "PayNeza enables informal traders and small businesses to accept mobile payments without expensive POS terminals. Our app turns any smartphone into a payment terminal, processing over $2M in transactions monthly across 5,000+ merchants.",
                "industry": "fintech",
                "stage": "mvp",
                "funding_goal": 300000,
                "team_size": 10,
                "website": "https://payneza.rw",
                "pitch_deck_url": None,
                "video_url": None,
            },
            {
                "founder_email": "ubuzima@urutidemoacc.rw",
                "name": "TeleMed Rwanda",
                "tagline": "Connecting rural patients with specialist doctors",
                "description": "TeleMed Rwanda is a telemedicine platform that connects patients in rural areas with specialist doctors via video consultation. We've conducted 25,000+ consultations, reducing patient travel costs by 80% and improving access to specialist care.",
                "industry": "healthcare",
                "stage": "early_traction",
                "funding_goal": 350000,
                "team_size": 20,
                "website": "https://telemed.rw",
                "pitch_deck_url": None,
                "video_url": None,
            },
            {
                "founder_email": "urugendo@urutidemoacc.rw",
                "name": "SwiftDeliver",
                "tagline": "Smart last-mile delivery for e-commerce",
                "description": "SwiftDeliver uses AI-powered route optimization to provide same-day delivery for e-commerce businesses across Kigali. Our platform reduces delivery costs by 35% and improves delivery times by 50%. We process 1,000+ deliveries daily.",
                "industry": "services",
                "stage": "mvp",
                "funding_goal": 200000,
                "team_size": 25,
                "website": "https://swiftdeliver.rw",
                "pitch_deck_url": None,
                "video_url": None,
            },
        ]

        print("\n🚀 Creating ventures...")
        for venture_data in ventures_data:
            founder = next((u for u in created_users if u.email == venture_data["founder_email"]), None)
            if not founder:
                continue

            uruti_score = random.randint(60, 95)

            venture = Venture(
                name=venture_data["name"],
                tagline=venture_data["tagline"],
                description=venture_data["description"],
                industry=venture_data["industry"],
                stage=venture_data["stage"],
                funding_goal=venture_data["funding_goal"],
                team_size=venture_data["team_size"],
                pitch_deck_url=venture_data.get("pitch_deck_url"),
                demo_video_url=venture_data.get("video_url"),
                uruti_score=uruti_score,
                founder_id=founder.id,
            )
            db.add(venture)
            print(f"  ✅ Created venture: {venture_data['name']} (Score: {uruti_score})")

        db.commit()

        print("\n" + "=" * 60)
        print("🎉 Database seeded successfully!")
        print("=" * 60)
        print("\n📊 Summary:")
        print(f"  • {len([u for u in demo_users if u['role'] == 'founder'])} Founders created")
        print(f"  • {len([u for u in demo_users if u['role'] == 'investor'])} Investors created")
        print("  • 0 Mentors created")
        print(f"  • {len(ventures_data)} Ventures created")

        print("\n🔑 Demo Login Credentials:")
        print("  All accounts use password: DemoPass123!")
        print("\n  Founder Accounts:")
        print("    • amahoro@urutidemoacc.rw (Amahoro Uwase - EdTech)")
        print("    • mucyo@urutidemoacc.rw (Mucyo Nkubito - AgriTech)")
        print("    • uwera@urutidemoacc.rw (Uwera Mutesi - HealthTech)")
        print("    • neza@urutidemoacc.rw (Neza Gasana - FinTech)")
        print("    • ubuzima@urutidemoacc.rw (Ubuzima Nkusi - HealthTech)")
        print("    • urugendo@urutidemoacc.rw (Urugendo Hakizimana - Logistics)")

        print("\n  Investor Accounts:")
        print("    • keza@urutidemoacc.rw (Keza Mugisha)")
        print("    • imena@urutidemoacc.rw (Imena Kalisa)")
        print("    • izuba@urutidemoacc.rw (Izuba Uwizeye)")

        print("\n  Mentor Account:")
        print("    • None seeded")

        print("\n💡 Usage:")
        print("  1. Login with any email above")
        print("  2. Password: DemoPass123!")
        print("  3. Explore the platform with pre-populated data")
        print("\n" + "=" * 60)

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🌱 URUTI DATABASE SEED SCRIPT")
    print("=" * 60 + "\n")
    seed_database()
