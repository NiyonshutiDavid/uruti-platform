# 🇷🇼 Uruti Platform - Investor Analysis System for Rwandan Tech Founders

## Overview

This system helps **Rwandan tech founders** understand their startup's investment readiness and provides actionable recommendations tailored to Rwanda's tech ecosystem.

**Built for**: Tech startups in Rwanda seeking investment or growth guidance  
**Accuracy**: 83.8% F1 score on 55,000+ startup records  
**Best Model**: XGBoost Classifier

---

## 🎯 What This System Does

1. **Analyzes your startup** using 12 key metrics
2. **Predicts investment readiness** in 3 categories:
   - ❌ **Not Ready** - Too early, needs fundamental development
   - 📚 **Mentorship Needed** - Has potential but needs support
   - ✅ **Investment Ready** - Ready for investor engagement
3. **Provides confidence scores** and probability breakdown
4. **Generates insights** about your strengths and weaknesses
5. **Offers Rwanda-specific recommendations** and ecosystem connections
6. **Assesses risks** with detailed factor analysis

---

## ⚙️ First-Time Setup

**IMPORTANT**: Before using the analysis system, you must train the model:

```bash
# 1. Navigate to the folder
cd Notebooks/uruti-MLP_models/

# 2. Open and run the training notebook
jupyter notebook ModelCreation.ipynb
```

**In the notebook**:
- Run **ALL cells** from top to bottom
- This will train the model and save it to `../../Models/best_investor_model.joblib`
- Training takes approximately 5-10 minutes
- You only need to do this **once**

After training is complete, you can use the analysis system.

---

## 🚀 Quick Start

### Option 1: Interactive Jupyter Notebook (Recommended for founders)

```bash
# Navigate to the folder
cd Notebooks/uruti-MLP_models/

# Open the demo notebook
jupyter notebook StartupAnalyzer_Demo.ipynb
```

Then:
1. Run Section 1 to load the system
2. Replace the example data in Section 2 with YOUR startup's data
3. Run the cells to get your analysis
4. Export a report to share with investors

### Option 2: Python Script (For developers)

```bash
# Navigate to the folder
cd Notebooks/uruti-MLP_models/

# Run the analysis script
python investor_analysis_system.py
```

This will show 3 example analyses (investment-ready, mentorship-needed, not-ready).

### Option 3: Import as a Module

```python
from investor_analysis_system import RwandanStartupAnalyzer

# Initialize
analyzer = RwandanStartupAnalyzer()

# Analyze your startup
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

## 📊 Required Data Fields

To analyze your startup, you need the following information:

| Field | Description | Example |
|-------|-------------|---------|
| `R&D Spend` | Research & Development spending (USD) | 30000 |
| `Administration` | Administrative costs (USD) | 15000 |
| `Marketing Spend` | Marketing budget (USD) | 20000 |
| `New York` | Based in New York? (0=No, 1=Yes) | 0 |
| `California` | Based in California? (0=No, 1=Yes) | 0 |
| `Florida` | Based in Florida? (0=No, 1=Yes) | 0 |
| `revenue` | Total revenue (USD) | 120000 |
| `funding` | Total funding raised (USD) | 80000 |
| `valuation` | Company valuation (USD) | 500000 |
| `employees` | Number of employees | 8 |
| `age` | Company age in years | 2.0 |
| `sector` | Industry (fintech, edtech, agritech, etc.) | fintech |
| `status` | Current status (operating, acquired, etc.) | operating |

### Currency Notes
- All amounts should be in **USD**
- Convert from RWF if needed (check current exchange rate)
- Example: 100,000,000 RWF ≈ $75,000 USD (approximate)

---

## 📈 Understanding Your Results

### 1. Prediction Categories

**✅ Investment Ready**
- Your startup is ready for investor engagement
- You should prepare pitch decks and reach out to VCs
- Suggested contacts: Norrsken Kigali, 250 Startups, YGAP Rwanda

**📚 Mentorship Needed**
- Your startup has potential but needs support first
- Focus on business development and revenue growth
- Suggested programs: kLab, Impact Hub Kigali, Westerwelle Foundation

**❌ Not Ready**
- Your startup is too early for investment
- Focus on product-market fit and team building
- Consider incubators and grant programs instead

### 2. Confidence Score

- **80-100%**: Very reliable prediction
- **60-80%**: Reliable prediction
- **40-60%**: Moderate confidence - borderline case
- **Below 40%**: Low confidence - your startup is unique

### 3. Risk Assessment

- **LOW**: Good fundamentals, lower investment risk
- **MEDIUM**: Standard startup risks
- **HIGH**: Significant concerns, needs major improvements

---

## 🇷🇼 Rwanda Ecosystem Resources

### For Investment-Ready Startups

**Investors & VCs**:
- **Norrsken Kigali** - norrsken.org/kigali
- **250 Startups** - Rwanda-focused early-stage fund
- **YGAP Rwanda** - Social enterprise investment
- **African Development Bank** - Larger scale funding

**Action Steps**:
1. Prepare your pitch deck
2. Schedule investor meetings
3. Ensure financials are audit-ready
4. Consider EAC expansion strategy

### For Startups Needing Mentorship

**Support Programs**:
- **kLab** (klab.rw) - Rwanda's leading tech incubator
- **Impact Hub Kigali** - Co-working and acceleration
- **Westerwelle Foundation** - Early & growth stage support
- **BK TecHouse** - Banking-focused fintech support

**Action Steps**:
1. Apply to acceleration programs
2. Attend startup workshops
3. Connect with mentors
4. Focus on revenue growth
5. Re-assess in 6 months

### For Early-Stage Startups

**Incubators & Grants**:
- **Westerwelle Foundation** - Pre-seed support
- **kLab Incubation** - 6-month intensive program
- **UNDP Innovation Fund** - Grant funding
- **Rwanda Innovation Fund** - Government support

**Action Steps**:
1. Join an incubator
2. Build MVP and test with users
3. Focus on product-market fit
4. Apply for grants (not equity)
5. Build your team

---

## 💡 Tips for Rwandan Tech Founders

### 1. **Leverage Rwanda's Advantages**
- Top 2 in Africa for ease of doing business
- Strong government support for tech
- Access to 300M+ EAC market
- Investor-friendly policies

### 2. **Address Common Challenges**
- **Limited local market**: Plan for regional expansion early
- **Talent gap**: Partner with universities, hire remote when needed
- **Funding scarcity**: Bootstrap as long as possible, show traction
- **Infrastructure**: Use cloud services to reduce capex

### 3. **Focus on Priority Sectors**
Rwanda's ICT strategy prioritizes:
- **Fintech**: Mobile payments, digital banking
- **Agritech**: Farm management, supply chain
- **Edtech**: Online learning, skill development
- **Healthtech**: Telemedicine, health records
- **E-commerce**: Digital marketplaces

### 4. **Build in Public**
- Engage with kLab community
- Attend Rwanda Tech Meetups
- Share your progress on social media
- Connect with other founders

### 5. **Know Your Metrics**
Investors look for:
- **Revenue growth**: >10% month-over-month
- **Customer acquisition**: Low CAC, high LTV
- **Product-market fit**: Retention >40%
- **Team**: Diverse skills, execution track record

---

## 📁 File Structure

```
uruti-MLP_models/
├── ModelCreation.ipynb              # Main training notebook
├── StartupAnalyzer_Demo.ipynb       # Interactive demo for founders
├── investor_analysis_system.py      # Analysis system code
├── README_INVESTOR_SYSTEM.md        # This file
└── ../../Models/
    ├── best_investor_model.joblib   # Trained XGBoost model
    └── readiness_class_mapping.json # Class label mappings
```

---

## 🔧 Technical Details

### Model Performance

Trained on 55,267 startup records with the following metrics:

**Best Model: XGBoost**
- F1 Score (weighted): 83.82%
- Balanced Accuracy: 66.09%
- ROC-AUC (OVR): 87.23%

**Comparison Models**:
- Logistic Regression: 83.80%
- Random Forest: 83.47%
- SVC: 83.70%
- Extra Trees: 83.69%
- CNN variants: 70-75% (included for comparison)

### Data Sources
1. **50_Startups.csv** - 50 startup records
2. **investments_VC.csv** - 54,294 VC investment records
3. **startup data.csv** - 923 startup records

### Preprocessing Pipeline
- Median imputation for numerical features
- Standard scaling for numerical features
- Most-frequent imputation for categorical features
- One-hot encoding for categorical features

### Class Balance (Training Data)
- **Mentorship Needed**: 87% (47,782 records)
- **Investment Ready**: 8% (4,623 records)
- **Not Ready**: 5% (2,862 records)

---

## 🆘 Troubleshooting

### "Model file not found"
```python
# Make sure paths are correct
analyzer = RwandanStartupAnalyzer(
    model_path='../../Models/best_investor_model.joblib',
    mapping_path='../../Models/readiness_class_mapping.json'
)
```

### "Missing required columns"
Ensure your startup dictionary includes ALL 13 required fields (see table above).

### "Invalid sector value"
Sector can be any string, but these are recognized priority sectors:
- fintech, agritech, edtech, healthtech, e-commerce

### "Low confidence score"
Your startup might have unique characteristics. Consider:
- Checking if data is entered correctly
- Your startup might be in transition between categories
- Getting a human expert review

---

## 📞 Support

**Questions?** Contact the Uruti Platform team:
- Website: urutiplatform.rw (if available)
- Email: contact@urutiplatform.rw
- GitHub: [Your GitHub repo]

**Community**:
- Join kLab Kigali for networking
- Attend Rwanda Tech Meetups
- Connect with other founders using this system

---

## 🎓 How This System Was Built

1. **Data Collection**: 55,000+ startup records from multiple sources
2. **Feature Engineering**: 12 key metrics identified
3. **Model Training**: Compared 8 different algorithms (classical ML + deep learning)
4. **Validation**: Cross-validation and holdout testing
5. **Rwanda Contextualization**: Added local ecosystem knowledge
6. **Deployment**: Packaged as easy-to-use system for founders

See [ModelCreation.ipynb](ModelCreation.ipynb) for full training pipeline.

---

## 📄 License

This system is built for Rwandan tech founders. Use responsibly and ethically.

**Disclaimer**: This is a decision-support tool. Always combine AI predictions with human judgment, market research, and expert advice.

---

## 🚀 Future Enhancements

Planned features:
- [ ] Web interface for easier access
- [ ] Historical tracking (analyze your progress over time)
- [ ] Peer comparison (compare to similar Rwandan startups)
- [ ] Industry benchmarking
- [ ] Integration with Rwandan business registration data
- [ ] Multi-language support (Kinyarwanda, English, French)

---

**Built with ❤️ for Rwanda's tech ecosystem**

*Last Updated: February 2026*
