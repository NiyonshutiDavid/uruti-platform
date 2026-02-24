# 🚀 Quick Start Guide for Rwandan Tech Founders

## Get Your Startup Analyzed in 3 Steps

---

### Step 1: Check if Everything is Ready

```bash
cd Notebooks/uruti-MLP_models
python3 check_setup.py
```

If you see ❌ errors, follow the instructions shown.

---

### Step 2: Train the Model (First Time Only)

**Option A: Using Jupyter Notebook** (Recommended)

```bash
jupyter notebook ModelCreation.ipynb
```

Then:
- Click "Run All" from the Cell menu
- Wait 5-10 minutes for training to complete
- ✅ Model will be saved automatically

**Option B: Using Google Colab** (if you don't have Jupyter)

1. Upload `ModelCreation.ipynb` to Google Colab
2. Upload the data files from `Notebooks/Data/` folder
3. Run all cells
4. Download the saved model files

---

### Step 3: Analyze Your Startup

**Option A: Interactive Notebook** (Easiest)

```bash
jupyter notebook StartupAnalyzer_Demo.ipynb
```

Then:
1. Run Section 1 (Setup)
2. Edit Section 2 with YOUR startup data
3. Run Section 3 to see your analysis
4. Run Section 5 to export a report

**Option B: Python Script**

```bash
python3 investor_analysis_system.py
```

This shows example analyses.

**Option C: Custom Code**

```python
from investor_analysis_system import RwandanStartupAnalyzer

analyzer = RwandanStartupAnalyzer()

my_startup = {
    'R&D Spend': 30000,
    'Administration': 15000,
    'Marketing Spend': 20000,
    'New York': 0,
    'California': 0,
    'Florida': 0,
    'revenue': 120000,
    'funding': 80000,
    'valuation': 500000,
    'employees': 8,
    'age': 2.0,
    'sector': 'fintech',
    'status': 'operating'
}

analysis = analyzer.analyze_startup(my_startup)
analyzer.print_analysis(analysis)
```

---

## What You'll Get

✅ **Investment Readiness Score**
- Not Ready / Mentorship Needed / Investment Ready

✅ **Confidence Level**
- How certain the model is about its prediction

✅ **Key Insights**
- What's strong about your startup
- What needs improvement

✅ **Rwanda-Specific Recommendations**
- Which investors to contact (Norrsken, 250 Startups, etc.)
- Which programs to join (kLab, Impact Hub, etc.)
- Actionable next steps

✅ **Risk Assessment**
- Investment risk level
- Specific risk factors identified

---

## Common Issues

### "xgboost not installed"

```bash
pip install xgboost
```

### "Model not found"

You need to run Step 2 first to train the model.

### "jupyter: command not found"

```bash
pip install jupyter notebook
```

### "Data files not found"

The data files should be in `Notebooks/Data/`:
- 50_Startups.csv
- investments_VC.csv
- startup data.csv

---

## Your Startup Data Template

Copy this and fill in your numbers:

```python
your_startup = {
    'R&D Spend': 0,          # USD spent on R&D
    'Administration': 0,      # USD on admin costs
    'Marketing Spend': 0,     # USD on marketing
    'New York': 0,            # 0 (Rwanda-based)
    'California': 0,          # 0 (Rwanda-based)
    'Florida': 0,             # 0 (Rwanda-based)
    'revenue': 0,             # Total revenue in USD
    'funding': 0,             # Total funding raised
    'valuation': 0,           # Company valuation
    'employees': 0,           # Number of employees
    'age': 0.0,               # Years since founding
    'sector': '',             # fintech/edtech/agritech/etc.
    'status': 'operating'     # Usually 'operating'
}
```

**Currency Conversion** (approximate):
- 100,000,000 RWF ≈ $75,000 USD
- Use current exchange rate for accuracy

---

## Next Steps Based on Results

### If "Investment Ready" ✅

1. Prepare your pitch deck
2. Contact investors:
   - Norrsken Kigali: norrsken.org/kigali
   - 250 Startups
   - YGAP Rwanda
3. Ensure financials are audit-ready

### If "Mentorship Needed" 📚

1. Apply to kLab or Impact Hub Kigali
2. Focus on revenue growth
3. Attend business development workshops
4. Re-assess in 6 months

### If "Not Ready" 🌱

1. Join an incubator program
2. Build MVP and validate with users
3. Focus on product-market fit
4. Consider grants instead of investment

---

## Support

**Questions?**
- Read the full guide: [README_INVESTOR_SYSTEM.md](README_INVESTOR_SYSTEM.md)
- Visit kLab Kigali for in-person support
- Connect with other founders in the Rwanda tech community

**Built for Rwanda's tech ecosystem** 🇷🇼

---

*Training the model? See [ModelCreation.ipynb](ModelCreation.ipynb)*  
*Understanding the tech? See [README_INVESTOR_SYSTEM.md](README_INVESTOR_SYSTEM.md)*
