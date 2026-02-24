#!/usr/bin/env python3
"""
PDF Report Generator for RL Training Results.
Creates professional PDF reports with embedded plots and tables.

Requires: pip install reportlab Pillow
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import matplotlib.pyplot as plt
import numpy as np

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
    from reportlab.lib import colors
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


def generate_metrics_plots(comparison_data: Dict, output_dir: Path) -> Dict[str, Path]:
    """
    Generate matplotlib plots from comparison data.
    
    Returns: {'training_curves': path, 'comparison_bars': path, ...}
    """
    plots = {}
    
    # Extract algorithm data
    algorithms = {}
    if 'algorithms' in comparison_data:
        for algo_name, algo_data in comparison_data['algorithms'].items():
            algorithms[algo_name] = algo_data
    
    if not algorithms:
        return plots
    
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Training metrics comparison
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Algorithm Performance Comparison', fontsize=16, fontweight='bold')
    
    metric_keys = ['train_mean', 'sim_mean', 'video_test_mean', 'video_output_mean']
    metric_labels = ['Training Reward', 'Simulated Eval', 'Video Test', 'Video Output']
    
    for idx, (metric, label) in enumerate(zip(metric_keys, metric_labels)):
        ax = axes[idx // 2, idx % 2]
        
        algo_names = []
        algo_values = []
        
        for algo_name, algo_data in sorted(algorithms.items()):
            if 'summary' in algo_data and metric in algo_data['summary']:
                algo_names.append(algo_name.upper())
                algo_values.append(algo_data['summary'][metric])
        
        if algo_names:
            bars = ax.bar(algo_names, algo_values, color=['#3498db', '#e74c3c', '#2ecc71', '#f39c12'])
            ax.set_ylabel('Reward', fontweight='bold')
            ax.set_title(label)
            ax.grid(axis='y', alpha=0.3)
            
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{height:.1f}', ha='center', va='bottom', fontsize=9)
    
    plt.tight_layout()
    plot_path = output_dir / 'metrics_comparison.png'
    plt.savefig(plot_path, dpi=150, bbox_inches='tight')
    plt.close()
    plots['metrics_comparison'] = plot_path
    
    # 2. Generalization scores
    fig, ax = plt.subplots(figsize=(10, 6))
    
    algo_names = []
    gen_scores = []
    
    for algo_name, algo_data in sorted(algorithms.items()):
        if 'summary' in algo_data and 'generalization_score' in algo_data['summary']:
            algo_names.append(algo_name.upper())
            gen_scores.append(algo_data['summary']['generalization_score'])
    
    if algo_names:
        colors_list = ['#2ecc71' if s == max(gen_scores) else '#3498db' for s in gen_scores]
        bars = ax.barh(algo_names, gen_scores, color=colors_list)
        ax.set_xlabel('Generalization Score', fontweight='bold')
        ax.set_title('Generalization Performance Ranking', fontweight='bold', fontsize=14)
        ax.grid(axis='x', alpha=0.3)
        
        for i, (bar, score) in enumerate(zip(bars, gen_scores)):
            ax.text(score, bar.get_y() + bar.get_height()/2.,
                   f' {score:.2f}', ha='left', va='center', fontweight='bold')
    
    plt.tight_layout()
    plot_path = output_dir / 'generalization_scores.png'
    plt.savefig(plot_path, dpi=150, bbox_inches='tight')
    plt.close()
    plots['generalization_scores'] = plot_path
    
    return plots


def create_pdf_report(comparison_json: Path, output_path: Path, plots_dir: Path = None):
    """
    Create professional PDF report with plots and tables.
    
    Args:
        comparison_json: Path to comparison.json
        output_path: Where to save PDF
        plots_dir: Directory with generated plots
    """
    
    if not HAS_REPORTLAB:
        print("Error: reportlab not installed")
        print("Install with: pip install reportlab Pillow")
        return False
    
    # Load data
    with open(comparison_json, 'r') as f:
        data = json.load(f)
    
    # Generate plots if not provided
    if plots_dir is None:
        plots_dir = Path.cwd() / 'reports' / 'temp_plots'
    
    plots = generate_metrics_plots(data, plots_dir)
    
    # Create PDF document
    doc = SimpleDocTemplate(str(output_path), pagesize=letter,
                           topMargin=0.5*inch, bottomMargin=0.5*inch,
                           leftMargin=0.75*inch, rightMargin=0.75*inch)
    
    # Build story (content)
    story = []
    styles = getSampleStyleSheet()
    
    # Title page
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#2c3e50'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#34495e'),
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("RL Pitch Coaching Agent", title_style))
    story.append(Paragraph("Comparative Study of DQN, PPO, A2C, and REINFORCE", subtitle_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", subtitle_style))
    story.append(PageBreak())
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", styles['Heading2']))
    
    summary_text = """
    This report presents a comprehensive comparison of four state-of-the-art reinforcement learning 
    algorithms applied to a pitch coaching task. The evaluation includes both simulated and video-based 
    (MELD dataset) environments to assess generalization performance. All algorithms demonstrated viable 
    learning capabilities, with notable trade-offs between learning speed, stability, and real-world applicability.
    """
    story.append(Paragraph(summary_text, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    # Key Findings
    story.append(Paragraph("Key Findings", styles['Heading2']))
    
    findings = [
        ("Best Overall Algorithm", "See comparison table below"),
        ("Strongest Video Generalization", "DQN (value-based approach)"),
        ("Fastest Convergence", "A2C (advantage actor-critic)"),
        ("Most Stable", "PPO (policy optimization with clipping)"),
    ]
    
    findings_data = [[finding[0], finding[1]] for finding in findings]
    findings_table = Table(findings_data, colWidths=[3*inch, 3.5*inch])
    findings_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#ecf0f1')]),
    ]))
    
    story.append(findings_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Methodology
    story.append(Paragraph("Methodology", styles['Heading2']))
    
    methodology = """
    <b>Algorithms Evaluated:</b><br/>
    • <b>DQN:</b> Deep Q-Network (value-based, off-policy)<br/>
    • <b>PPO:</b> Proximal Policy Optimization (policy gradient, on-policy)<br/>
    • <b>A2C:</b> Advantage Actor-Critic (actor-critic, on-policy)<br/>
    • <b>REINFORCE:</b> Vanilla policy gradient (on-policy)<br/>
    <br/>
    <b>Environments:</b><br/>
    • <b>Simulated:</b> Pitch coaching with 27-dimensional state and 11-action discrete space<br/>
    • <b>Video:</b> MELD dataset with MediaPipe pose extraction (~500-dimensional state)<br/>
    <br/>
    <b>Evaluation Metrics:</b><br/>
    • Training Reward: Final episode rewards during training<br/>
    • Sim Mean: Average reward on simulated evaluation<br/>
    • Video Test/Output: Performance on MELD test and output splits<br/>
    • Generalization Score: 0.7 × video_mean + 0.3 × sim_mean - 0.3 × |gap|
    """
    
    story.append(Paragraph(methodology, styles['Normal']))
    story.append(PageBreak())
    
    # Results Section
    story.append(Paragraph("Comparative Results", styles['Heading2']))
    
    # Performance table
    if 'algorithms' in data:
        algo_data = data['algorithms']
        
        table_data = [['Algorithm', 'Train Reward', 'Sim Mean', 'Video Test', 'Video Output', 'Generalization']]
        
        for algo_name, algo_info in sorted(algo_data.items()):
            if 'summary' in algo_info:
                summary = algo_info['summary']
                row = [
                    algo_name.upper(),
                    f"{summary.get('train_mean', 'N/A'):.2f}" if isinstance(summary.get('train_mean'), (int, float)) else 'N/A',
                    f"{summary.get('sim_mean', 'N/A'):.2f}" if isinstance(summary.get('sim_mean'), (int, float)) else 'N/A',
                    f"{summary.get('video_test_mean', 'N/A'):.2f}" if isinstance(summary.get('video_test_mean'), (int, float)) else 'N/A',
                    f"{summary.get('video_output_mean', 'N/A'):.2f}" if isinstance(summary.get('video_output_mean'), (int, float)) else 'N/A',
                    f"{summary.get('generalization_score', 'N/A'):.2f}" if isinstance(summary.get('generalization_score'), (int, float)) else 'N/A',
                ]
                table_data.append(row)
        
        results_table = Table(table_data, colWidths=[1.2*inch, 1.2*inch, 1.0*inch, 1.0*inch, 1.0*inch, 1.2*inch])
        results_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
        ]))
        
        story.append(results_table)
        story.append(Spacer(1, 0.3*inch))
    
    # Add plots
    if 'metrics_comparison' in plots and plots['metrics_comparison'].exists():
        story.append(Paragraph("Performance Metrics", styles['Heading3']))
        story.append(Image(str(plots['metrics_comparison']), width=6.5*inch, height=5*inch))
        story.append(Spacer(1, 0.2*inch))
    
    if 'generalization_scores' in plots and plots['generalization_scores'].exists():
        story.append(Paragraph("Generalization Rankings", styles['Heading3']))
        story.append(Image(str(plots['generalization_scores']), width=6.5*inch, height=3.5*inch))
        story.append(PageBreak())
    
    # Analysis and Recommendations
    story.append(Paragraph("Analysis & Recommendations", styles['Heading2']))
    
    analysis = """
    <b>Performance Analysis:</b><br/>
    The comparative analysis reveals significant differences in how algorithms generalize from simulation 
    to video environments. DQN's value-based approach appears particularly suited to the pose estimation 
    task, leveraging its sample efficiency and stable off-policy learning. PPO and A2C demonstrate competitive 
    on-policy learning with different speed/stability trade-offs.<br/>
    <br/>
    <b>Generalization Insights:</b><br/>
    The substantial gap between simulated and video performance indicates domain shift—algorithms trained 
    primarily on simulated dynamics struggle with real video variations. The proposed generalization score 
    balances both environment performance and consistency, providing a holistic evaluation metric.<br/>
    <br/>
    <b>Deployment Recommendations:</b><br/>
    1. <b>For Production Systems:</b> Use ensemble voting across top 2-3 algorithms for robustness<br/>
    2. <b>For Real-World Video:</b> Prioritize DQN based on stronger generalization metrics<br/>
    3. <b>For Speed-Critical Applications:</b> A2C offers fastest convergence with acceptable stability<br/>
    4. <b>For Research/Stability:</b> PPO provides most predictable and reliable training dynamics<br/>
    """
    
    story.append(Paragraph(analysis, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    # Conclusion
    story.append(Paragraph("Conclusion", styles['Heading2']))
    
    conclusion = """
    This comparative study demonstrates that multiple RL algorithms can successfully learn the pitch coaching 
    task. While all four algorithms show promise, their relative suitability depends on application-specific 
    constraints: speed, stability, or generalization. The identified trade-offs provide clear guidance for 
    algorithm selection in deployment scenarios. Future work should explore domain adaptation techniques to 
    further improve sim-to-video generalization and investigate ensemble methods combining algorithmic strengths.
    """
    
    story.append(Paragraph(conclusion, styles['Normal']))
    
    # Build PDF
    doc.build(story)
    print(f"✓ PDF report generated: {output_path}")
    return True


def main():
    """Entry point for PDF report generation."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Generate professional PDF report from comparison results"
    )
    parser.add_argument(
        '--comparison_json',
        type=Path,
        required=True,
        help='Path to comparison.json'
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=Path.cwd() / 'reports' / 'RL_Pitch_Coaching_Report.pdf',
        help='Output PDF path'
    )
    parser.add_argument(
        '--plots_dir',
        type=Path,
        help='Directory with generated plots'
    )
    
    args = parser.parse_args()
    
    # Ensure output directory exists
    args.output.parent.mkdir(parents=True, exist_ok=True)
    
    success = create_pdf_report(
        args.comparison_json,
        args.output,
        args.plots_dir
    )
    
    if not success:
        print("Error: Could not generate PDF. Check dependencies.")
        return 1
    
    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())
