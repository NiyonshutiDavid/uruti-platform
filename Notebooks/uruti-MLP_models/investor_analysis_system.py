"""
Investor Intelligence System for Rwandan Tech Startups
=====================================================

This system analyzes tech startups and provides actionable insights to investors
focused on the Rwandan technology ecosystem.

Features:
- Load trained investor readiness model
- Analyze individual startups
- Generate detailed insights with confidence scores
- Provide Rwanda-specific recommendations
- Feature importance analysis
- Risk assessment and next steps

Author: Uruti Platform
Target: Rwandan Tech Founders and Investors
"""

import joblib
import pandas as pd
import numpy as np
import json
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')


class RwandanStartupAnalyzer:
    """
    Analyzes tech startups and provides investor insights tailored for Rwanda's ecosystem.
    """
    
    def __init__(self, model_path='../../Models/best_investor_model.joblib', 
                 mapping_path='../../Models/readiness_class_mapping.json'):
        """
        Initialize the analyzer with trained model.
        
        Args:
            model_path: Path to saved model pipeline
            mapping_path: Path to class mapping JSON
        """
        self.model_path = Path(model_path)
        self.mapping_path = Path(mapping_path)
        
        # Load model and mapping
        print("Loading investor readiness model...")
        self.model = joblib.load(self.model_path)
        
        with open(self.mapping_path, 'r') as f:
            self.class_mapping = json.load(f)
        
        # Reverse mapping for predictions
        self.id_to_class = {v: k for k, v in self.class_mapping.items()}
        
        print(f"✓ Model loaded: {type(self.model).__name__}")
        print(f"✓ Classes: {list(self.class_mapping.keys())}\n")
        
        # Rwanda-specific context
        self.rwanda_context = {
            'key_sectors': ['fintech', 'agritech', 'edtech', 'healthtech', 'e-commerce'],
            'investor_ecosystem': ['Norrsken Kigali, 250 Startups, YGAP Rwanda, UNDP, AfDB'],
            'support_programs': ['kLab, Westerwelle Foundation, Impact Hub Kigali'],
            'challenges': ['limited_funding', 'talent_gap', 'market_size', 'infrastructure'],
            'opportunities': ['ict_policy', 'ease_of_business', 'regional_access', 'youth_population']
        }
    
    def analyze_startup(self, startup_data):
        """
        Analyze a startup and provide comprehensive investor insights.
        
        Args:
            startup_data: Dictionary with startup features:
                - R&D Spend (numeric)
                - Administration (numeric)
                - Marketing Spend (numeric)
                - New York, California, Florida (binary 0/1)
                - revenue (numeric)
                - funding (numeric)
                - valuation (numeric)
                - employees (numeric)
                - age (numeric)
                - sector (categorical)
                - status (categorical)
        
        Returns:
            Dictionary with analysis results
        """
        # Convert to DataFrame
        df = pd.DataFrame([startup_data])
        
        # Get prediction and probabilities
        prediction_id = self.model.predict(df)[0]
        probabilities = self.model.predict_proba(df)[0]
        
        # Map to class name
        prediction_class = self.id_to_class[prediction_id]
        
        # Create probability dict
        prob_dict = {self.id_to_class[i]: prob for i, prob in enumerate(probabilities)}
        
        # Generate insights
        insights = self._generate_insights(startup_data, prediction_class, prob_dict)
        
        return {
            'prediction': prediction_class,
            'confidence': max(probabilities),
            'probability_breakdown': prob_dict,
            'insights': insights,
            'recommendations': self._generate_recommendations(startup_data, prediction_class, prob_dict),
            'risk_assessment': self._assess_risks(startup_data, prediction_class, prob_dict),
            'rwanda_specific': self._rwanda_context_analysis(startup_data, prediction_class)
        }
    
    def _generate_insights(self, data, prediction, probabilities):
        """Generate detailed insights about the startup."""
        insights = []
        
        # Overall assessment
        confidence = probabilities[prediction]
        insights.append(f"Investment Readiness: **{prediction.upper().replace('_', ' ')}** (Confidence: {confidence:.1%})")
        
        # Financial analysis
        if 'revenue' in data and 'funding' in data:
            funding_efficiency = data['revenue'] / max(data['funding'], 1)
            insights.append(f"Revenue per funding dollar: ${funding_efficiency:.2f}")
        
        # Team size assessment
        if 'employees' in data:
            emp = data['employees']
            if emp < 5:
                insights.append("⚠️ Very small team - may need talent acquisition support")
            elif emp < 20:
                insights.append("✓ Lean team structure - good for early stage")
            elif emp < 50:
                insights.append("✓ Growing team - shows traction")
            else:
                insights.append("✓ Established team - mature operations")
        
        # Spending analysis
        spending_categories = ['R&D Spend', 'Administration', 'Marketing Spend']
        total_spend = sum(data.get(cat, 0) for cat in spending_categories)
        if total_spend > 0:
            rd_ratio = data.get('R&D Spend', 0) / total_spend
            if rd_ratio > 0.4:
                insights.append("✓ Strong R&D focus - good for tech innovation")
            marketing_ratio = data.get('Marketing Spend', 0) / total_spend
            if marketing_ratio > 0.4:
                insights.append("⚠️ High marketing spend - ensure unit economics are viable")
        
        # Age analysis
        if 'age' in data:
            age = data['age']
            if age < 1:
                insights.append("Very early stage - high risk, high potential")
            elif age < 3:
                insights.append("Early stage - critical validation period")
            elif age < 5:
                insights.append("Growth stage - proven concept phase")
            else:
                insights.append("Mature startup - scaling phase")
        
        return insights
    
    def _generate_recommendations(self, data, prediction, probabilities):
        """Generate actionable recommendations for Rwandan ecosystem."""
        recommendations = []
        
        if prediction == 'investment_ready':
            recommendations.append("🎯 RECOMMENDED FOR INVESTMENT")
            recommendations.append("Next steps:")
            recommendations.append("  • Conduct detailed due diligence")
            recommendations.append("  • Evaluate team capabilities and market positioning")
            recommendations.append("  • Review financial projections and unit economics")
            recommendations.append("  • Consider co-investment with local VCs (Norrsken, 250 Startups)")
            recommendations.append("  • Assess East African Community expansion potential")
            
        elif prediction == 'mentorship_needed':
            recommendations.append("📚 REQUIRES MENTORSHIP BEFORE INVESTMENT")
            recommendations.append("Recommended support:")
            recommendations.append("  • Connect with kLab or Impact Hub Kigali programs")
            recommendations.append("  • Business model refinement workshops")
            recommendations.append("  • Financial management training")
            recommendations.append("  • Market validation support")
            
            # Check if close to investment ready
            if probabilities.get('investment_ready', 0) > 0.3:
                recommendations.append("  ⭐ Note: Shows potential - consider follow-on evaluation in 6 months")
            
            # Specific areas needing improvement
            if data.get('employees', 0) < 5:
                recommendations.append("  • Team building support needed")
            if data.get('revenue', 0) < 10000:
                recommendations.append("  • Revenue generation strategies required")
                
        else:  # not_ready
            recommendations.append("❌ NOT RECOMMENDED FOR INVESTMENT")
            recommendations.append("Critical issues to address:")
            
            # Identify specific problems
            if data.get('revenue', 0) < 5000:
                recommendations.append("  • No viable revenue model demonstrated")
            if data.get('age', 5) < 1 and data.get('revenue', 0) < 1000:
                recommendations.append("  • Too early stage - needs product-market fit")
            if data.get('employees', 10) < 3:
                recommendations.append("  • Team not adequately formed")
            
            recommendations.append("Alternative support:")
            recommendations.append("  • Refer to early-stage incubators (Westerwelle Foundation)")
            recommendations.append("  • Grant programs instead of equity investment")
            recommendations.append("  • Re-evaluate after 12 months of development")
        
        return recommendations
    
    def _assess_risks(self, data, prediction, probabilities):
        """Assess investment risks."""
        risks = {
            'level': 'UNKNOWN',
            'factors': [],
            'score': 0.5
        }
        
        # Calculate risk score (inverse of investment_ready probability)
        risk_score = 1 - probabilities.get('investment_ready', 0)
        risks['score'] = risk_score
        
        if risk_score < 0.3:
            risks['level'] = 'LOW'
        elif risk_score < 0.6:
            risks['level'] = 'MEDIUM'
        else:
            risks['level'] = 'HIGH'
        
        # Identify specific risk factors
        if data.get('revenue', 1) < 10000:
            risks['factors'].append("Limited revenue - market validation risk")
        
        if data.get('age', 5) < 2:
            risks['factors'].append("Very young company - execution risk")
        
        if data.get('funding', 0) > data.get('revenue', 0) * 10:
            risks['factors'].append("High burn rate - runway risk")
        
        if data.get('employees', 0) < 5:
            risks['factors'].append("Small team - key person dependency risk")
        
        # Rwanda market-specific risks
        if data.get('revenue', 0) < 50000:
            risks['factors'].append("Limited local market penetration - scaling risk")
        
        if not risks['factors']:
            risks['factors'].append("Standard startup risks apply")
        
        return risks
    
    def _rwanda_context_analysis(self, data, prediction):
        """Provide Rwanda-specific contextual analysis."""
        context = []
        
        # Sector analysis
        sector = data.get('sector', 'unknown')
        if sector.lower() in self.rwanda_context['key_sectors']:
            context.append(f"✓ {sector.title()} is a priority sector in Rwanda's ICT strategy")
        
        # Ecosystem fit
        context.append("\nRwandan Ecosystem Resources:")
        context.append("• Potential partners: " + ', '.join(self.rwanda_context['investor_ecosystem']))
        context.append("• Support available: " + ', '.join(self.rwanda_context['support_programs']))
        
        # Market opportunities
        context.append("\nLocal Market Considerations:")
        context.append("• Rwanda offers strong ease of doing business (2nd in Africa)")
        context.append("• Access to EAC market (300M+ consumers)")
        context.append("• Government backing for tech innovation")
        context.append("• Challenge: Limited domestic market size - regional expansion critical")
        
        # Investment climate
        if prediction == 'investment_ready':
            context.append("\nInvestment Climate:")
            context.append("• Rwanda has investor-friendly policies")
            context.append("• Tax incentives available for tech companies")
            context.append("• Strong IP protection framework")
        
        return context
    
    def batch_analyze(self, startups_df):
        """
        Analyze multiple startups at once.
        
        Args:
            startups_df: DataFrame with multiple startup records
        
        Returns:
            DataFrame with predictions and key metrics
        """
        predictions = self.model.predict(startups_df)
        probabilities = self.model.predict_proba(startups_df)
        
        results = startups_df.copy()
        results['prediction'] = [self.id_to_class[p] for p in predictions]
        results['confidence'] = probabilities.max(axis=1)
        results['investment_ready_prob'] = probabilities[:, self.class_mapping['investment_ready']]
        
        # Sort by investment readiness
        results = results.sort_values('investment_ready_prob', ascending=False)
        
        return results
    
    def print_analysis(self, analysis):
        """Pretty print analysis results."""
        print("=" * 80)
        print("URUTI PLATFORM - INVESTOR ANALYSIS REPORT")
        print("=" * 80)
        print()
        
        print(f"PREDICTION: {analysis['prediction'].upper().replace('_', ' ')}")
        print(f"Confidence: {analysis['confidence']:.1%}")
        print()
        
        print("PROBABILITY BREAKDOWN:")
        for class_name, prob in sorted(analysis['probability_breakdown'].items(), 
                                       key=lambda x: x[1], reverse=True):
            print(f"  {class_name.replace('_', ' ').title()}: {prob:.1%}")
        print()
        
        print("KEY INSIGHTS:")
        for insight in analysis['insights']:
            print(f"  {insight}")
        print()
        
        print("RECOMMENDATIONS:")
        for rec in analysis['recommendations']:
            print(f"  {rec}")
        print()
        
        print(f"RISK ASSESSMENT: {analysis['risk_assessment']['level']}")
        print(f"Risk Score: {analysis['risk_assessment']['score']:.1%}")
        print("Risk Factors:")
        for factor in analysis['risk_assessment']['factors']:
            print(f"  • {factor}")
        print()
        
        print("RWANDA ECOSYSTEM CONTEXT:")
        for item in analysis['rwanda_specific']:
            print(f"  {item}")
        print()
        print("=" * 80)


# Example usage
if __name__ == "__main__":
    # Initialize analyzer
    analyzer = RwandanStartupAnalyzer()
    
    # Example 1: Investment-ready fintech startup
    print("\n📊 EXAMPLE 1: Established Fintech Startup")
    print("-" * 80)
    
    fintech_startup = {
        'R&D Spend': 85000,
        'Administration': 45000,
        'Marketing Spend': 60000,
        'New York': 0,
        'California': 0,
        'Florida': 0,
        'revenue': 450000,
        'funding': 300000,
        'valuation': 2000000,
        'employees': 18,
        'age': 3.5,
        'sector': 'fintech',
        'status': 'operating'
    }
    
    analysis1 = analyzer.analyze_startup(fintech_startup)
    analyzer.print_analysis(analysis1)
    
    # Example 2: Early-stage edtech needing mentorship
    print("\n📊 EXAMPLE 2: Early-Stage Edtech Startup")
    print("-" * 80)
    
    edtech_startup = {
        'R&D Spend': 15000,
        'Administration': 8000,
        'Marketing Spend': 12000,
        'New York': 0,
        'California': 0,
        'Florida': 0,
        'revenue': 25000,
        'funding': 50000,
        'valuation': 200000,
        'employees': 4,
        'age': 1.2,
        'sector': 'edtech',
        'status': 'operating'
    }
    
    analysis2 = analyzer.analyze_startup(edtech_startup)
    analyzer.print_analysis(analysis2)
    
    # Example 3: Not ready startup
    print("\n📊 EXAMPLE 3: Very Early-Stage Startup")
    print("-" * 80)
    
    early_startup = {
        'R&D Spend': 5000,
        'Administration': 3000,
        'Marketing Spend': 2000,
        'New York': 0,
        'California': 0,
        'Florida': 0,
        'revenue': 2000,
        'funding': 15000,
        'valuation': 50000,
        'employees': 2,
        'age': 0.5,
        'sector': 'e-commerce',
        'status': 'operating'
    }
    
    analysis3 = analyzer.analyze_startup(early_startup)
    analyzer.print_analysis(analysis3)
    
    print("\n" + "=" * 80)
    print("BATCH ANALYSIS EXAMPLE")
    print("=" * 80)
    
    # Create batch of startups
    batch_data = pd.DataFrame([fintech_startup, edtech_startup, early_startup])
    batch_results = analyzer.batch_analyze(batch_data)
    
    print("\nTop Investment Candidates (sorted by investment readiness):")
    print(batch_results[['sector', 'revenue', 'employees', 'age', 
                         'prediction', 'confidence', 'investment_ready_prob']].to_string(index=False))
    
    print("\n✅ Analysis system ready for Rwandan tech founders!")
    print("💡 Usage: python investor_analysis_system.py")
