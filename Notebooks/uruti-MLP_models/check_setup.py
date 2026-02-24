#!/usr/bin/env python3
"""
Setup Checker for Uruti Platform Investor Analysis System
This script verifies that everything is ready for analyzing startups.
"""

import os
from pathlib import Path
import sys

def check_setup():
    """Check if the system is ready to use."""
    
    print("=" * 70)
    print("🇷🇼 URUTI PLATFORM - SETUP CHECKER")
    print("=" * 70)
    print()
    
    all_good = True
    
    # Check 1: Model file
    model_path = Path('../../Models/best_investor_model.joblib')
    print("📦 Checking for trained model...")
    if model_path.exists():
        print("   ✅ Model found: best_investor_model.joblib")
        file_size = model_path.stat().st_size / (1024 * 1024)  # MB
        print(f"   📊 Size: {file_size:.2f} MB")
    else:
        print("   ❌ Model NOT found!")
        print("   📝 You need to train the model first.")
        all_good = False
    print()
    
    # Check 2: Mapping file
    mapping_path = Path('../../Models/readiness_class_mapping.json')
    print("🗂️  Checking for class mapping...")
    if mapping_path.exists():
        print("   ✅ Mapping found: readiness_class_mapping.json")
    else:
        print("   ❌ Mapping NOT found!")
        all_good = False
    print()
    
    # Check 3: Data files
    print("📂 Checking for training data...")
    data_files = [
        ('../Data/50_Startups.csv', '50 Startups dataset'),
        ('../Data/investments_VC.csv', 'VC Investments dataset'),
        ('../Data/startup data.csv', 'Startup data dataset')
    ]
    
    data_available = 0
    for file_path, name in data_files:
        if Path(file_path).exists():
            print(f"   ✅ {name}")
            data_available += 1
        else:
            print(f"   ⚠️  {name} - not found")
    print()
    
    # Check 4: Required packages
    print("📚 Checking required Python packages...")
    required_packages = [
        ('joblib', 'Model serialization'),
        ('pandas', 'Data manipulation'),
        ('numpy', 'Numerical computing'),
        ('sklearn', 'Machine learning'),
        ('xgboost', 'XGBoost model')
    ]
    
    packages_ok = 0
    for package, description in required_packages:
        try:
            __import__(package)
            print(f"   ✅ {package:15} - {description}")
            packages_ok += 1
        except ImportError:
            print(f"   ❌ {package:15} - NOT installed!")
            all_good = False
    print()
    
    # Summary
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    if all_good:
        print("✅ Everything is ready!")
        print()
        print("You can now use the investor analysis system:")
        print("  • Run: python3 investor_analysis_system.py")
        print("  • Or open: StartupAnalyzer_Demo.ipynb")
        print()
        return 0
    else:
        print("❌ Setup incomplete. Follow these steps:")
        print()
        
        if not model_path.exists():
            print("🔧 STEP 1: Train the model")
            print("  1. Open ModelCreation.ipynb in Jupyter:")
            print("     jupyter notebook ModelCreation.ipynb")
            print("  2. Run ALL cells from top to bottom")
            print("  3. Wait for training to complete (~5-10 minutes)")
            print("  4. Model will be saved automatically")
            print()
        
        if packages_ok < len(required_packages):
            print("🔧 STEP 2: Install missing packages")
            print("  pip install joblib pandas numpy scikit-learn xgboost matplotlib")
            print()
        
        if data_available < 3:
            print("⚠️  WARNING: Some data files are missing")
            print("  The notebook will still work but with reduced data")
            print()
        
        print("📖 For detailed instructions, see README_INVESTOR_SYSTEM.md")
        print()
        return 1

if __name__ == "__main__":
    exit_code = check_setup()
    sys.exit(exit_code)
