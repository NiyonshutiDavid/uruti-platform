#!/usr/bin/env python3
"""
Generates 10 hyperparameter variants for each RL algorithm.
Creates systematically varied configurations for comprehensive hyperparameter tuning.
"""

import json
import os
from pathlib import Path

# Get configs directory
configs_dir = Path(__file__).parent

def generate_dqn_variants():
    """
    Generate 10 DQN hyperparameter variants.
    Key tuning parameters: learning_rate, gamma, buffer_size, batch_size, exploration strategy
    """
    variants = []
    
    # Variant 1: Conservative (low LR, high gamma, small batch)
    variants.append({
        "learning_rate": 0.0001,
        "gamma": 0.99,
        "buffer_size": 20000,
        "batch_size": 16,
        "exploration_fraction": 0.1,
        "exploration_final_eps": 0.01,
        "total_timesteps": 50000,
        "_description": "Conservative: Low LR, high gamma, small batch for stability"
    })
    
    # Variant 2: Aggressive exploration
    variants.append({
        "learning_rate": 0.001,
        "gamma": 0.95,
        "buffer_size": 50000,
        "batch_size": 64,
        "exploration_fraction": 0.9,
        "exploration_final_eps": 0.2,
        "total_timesteps": 50000,
        "_description": "Aggressive exploration: High LR, low gamma, large buffer"
    })
    
    # Variant 3: Medium LR, medium buffer
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.98,
        "buffer_size": 30000,
        "batch_size": 32,
        "exploration_fraction": 0.5,
        "exploration_final_eps": 0.1,
        "total_timesteps": 50000,
        "_description": "Baseline (from example config)"
    })
    
    # Variant 4: Large batch with moderate LR
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.97,
        "buffer_size": 40000,
        "batch_size": 64,
        "exploration_fraction": 0.3,
        "exploration_final_eps": 0.05,
        "total_timesteps": 50000,
        "_description": "Large batch: Good for stable gradients"
    })
    
    # Variant 5: High gamma, small buffer
    variants.append({
        "learning_rate": 0.0003,
        "gamma": 0.995,
        "buffer_size": 15000,
        "batch_size": 16,
        "exploration_fraction": 0.2,
        "exploration_final_eps": 0.02,
        "total_timesteps": 50000,
        "_description": "Long horizon: High gamma, small buffer, conservative exploration"
    })
    
    # Variant 6: Moderate settings
    variants.append({
        "learning_rate": 0.0007,
        "gamma": 0.96,
        "buffer_size": 25000,
        "batch_size": 32,
        "exploration_fraction": 0.4,
        "exploration_final_eps": 0.08,
        "total_timesteps": 50000,
        "_description": "Moderate: Balanced settings with medium decay"
    })
    
    # Variant 7: High LR, fast decay
    variants.append({
        "learning_rate": 0.001,
        "gamma": 0.93,
        "buffer_size": 35000,
        "batch_size": 32,
        "exploration_fraction": 0.7,
        "exploration_final_eps": 0.15,
        "total_timesteps": 50000,
        "_description": "Fast learning: High LR with fast exploration decay"
    })
    
    # Variant 8: Small buffer, careful learning
    variants.append({
        "learning_rate": 0.0002,
        "gamma": 0.99,
        "buffer_size": 10000,
        "batch_size": 16,
        "exploration_fraction": 0.3,
        "exploration_final_eps": 0.05,
        "total_timesteps": 50000,
        "_description": "Memory efficient: Small buffer, careful learning"
    })
    
    # Variant 9: Large buffer, patient learning
    variants.append({
        "learning_rate": 0.0003,
        "gamma": 0.98,
        "buffer_size": 60000,
        "batch_size": 64,
        "exploration_fraction": 0.6,
        "exploration_final_eps": 0.1,
        "total_timesteps": 50000,
        "_description": "Patient learner: Large buffer with patient exploration"
    })
    
    # Variant 10: Balanced tuning
    variants.append({
        "learning_rate": 0.0006,
        "gamma": 0.97,
        "buffer_size": 32000,
        "batch_size": 32,
        "exploration_fraction": 0.5,
        "exploration_final_eps": 0.1,
        "total_timesteps": 50000,
        "_description": "Well-tuned baseline: Balanced across all dimensions"
    })
    
    return variants

def generate_ppo_variants():
    """
    Generate 10 PPO hyperparameter variants.
    Key tuning parameters: learning_rate, gamma, n_steps, ent_coef, clip_range
    """
    variants = []
    
    # Variant 1: Conservative entropy
    variants.append({
        "learning_rate": 0.0001,
        "gamma": 0.995,
        "n_steps": 64,
        "ent_coef": 0.001,
        "clip_range": 0.1,
        "total_timesteps": 50000,
        "_description": "Conservative: Low LR, low entropy, tight clipping"
    })
    
    # Variant 2: High entropy exploration
    variants.append({
        "learning_rate": 0.001,
        "gamma": 0.95,
        "n_steps": 256,
        "ent_coef": 0.05,
        "clip_range": 0.3,
        "total_timesteps": 50000,
        "_description": "Exploratory: High entropy, loose clipping, large batches"
    })
    
    # Variant 3: Baseline
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.99,
        "n_steps": 128,
        "ent_coef": 0.01,
        "clip_range": 0.2,
        "total_timesteps": 50000,
        "_description": "Baseline (from example config)"
    })
    
    # Variant 4: Large batch sizes
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.99,
        "n_steps": 256,
        "ent_coef": 0.01,
        "clip_range": 0.2,
        "total_timesteps": 50000,
        "_description": "Large batches: Stable gradient estimates"
    })
    
    # Variant 5: Small batches, high entropy
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.98,
        "n_steps": 32,
        "ent_coef": 0.03,
        "clip_range": 0.2,
        "total_timesteps": 50000,
        "_description": "Frequent updates: Small batches with high entropy"
    })
    
    # Variant 6: Moderate settings
    variants.append({
        "learning_rate": 0.0003,
        "gamma": 0.97,
        "n_steps": 128,
        "ent_coef": 0.015,
        "clip_range": 0.2,
        "total_timesteps": 50000,
        "_description": "Moderate: Balanced entropy and learning rate"
    })
    
    # Variant 7: Long horizon
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.999,
        "n_steps": 512,
        "ent_coef": 0.01,
        "clip_range": 0.2,
        "total_timesteps": 50000,
        "_description": "Long horizon: Very high gamma, large batch size"
    })
    
    # Variant 8: Tight policy updates
    variants.append({
        "learning_rate": 0.0001,
        "gamma": 0.99,
        "n_steps": 64,
        "ent_coef": 0.005,
        "clip_range": 0.1,
        "total_timesteps": 50000,
        "_description": "Conservative policy: Tight clipping and low entropy"
    })
    
    # Variant 9: Aggressive learning
    variants.append({
        "learning_rate": 0.001,
        "gamma": 0.96,
        "n_steps": 128,
        "ent_coef": 0.02,
        "clip_range": 0.3,
        "total_timesteps": 50000,
        "_description": "Aggressive: High LR, loose clipping"
    })
    
    # Variant 10: Balanced
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.98,
        "n_steps": 128,
        "ent_coef": 0.01,
        "clip_range": 0.2,
        "total_timesteps": 50000,
        "_description": "Well-balanced: Proven stable configuration"
    })
    
    return variants

def generate_a2c_variants():
    """
    Generate 10 A2C hyperparameter variants.
    Key tuning parameters: learning_rate, gamma, n_steps, ent_coef
    """
    variants = []
    
    # Variant 1: Conservative
    variants.append({
        "learning_rate": 0.0001,
        "gamma": 0.995,
        "n_steps": 5,
        "ent_coef": 0.001,
        "total_timesteps": 50000,
        "_description": "Conservative: Low LR, high gamma, minimal entropy"
    })
    
    # Variant 2: Aggressive
    variants.append({
        "learning_rate": 0.01,
        "gamma": 0.95,
        "n_steps": 128,
        "ent_coef": 0.05,
        "total_timesteps": 50000,
        "_description": "Aggressive: High LR, large steps, high entropy"
    })
    
    # Variant 3: Baseline
    variants.append({
        "learning_rate": 0.003,
        "gamma": 0.995,
        "n_steps": 5,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Baseline (from example config)"
    })
    
    # Variant 4: Large step size
    variants.append({
        "learning_rate": 0.003,
        "gamma": 0.99,
        "n_steps": 64,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Larger steps: Better for credit assignment"
    })
    
    # Variant 5: Small step size
    variants.append({
        "learning_rate": 0.001,
        "gamma": 0.99,
        "n_steps": 5,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Frequent updates: Small n_steps with lower LR"
    })
    
    # Variant 6: Moderate LR, moderate steps
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.98,
        "n_steps": 20,
        "ent_coef": 0.015,
        "total_timesteps": 50000,
        "_description": "Moderate: Medium LR and step size"
    })
    
    # Variant 7: High gamma, large steps
    variants.append({
        "learning_rate": 0.002,
        "gamma": 0.999,
        "n_steps": 128,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Long-term planning: High gamma, large steps"
    })
    
    # Variant 8: Low gamma, small steps
    variants.append({
        "learning_rate": 0.003,
        "gamma": 0.9,
        "n_steps": 5,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Short-term focus: Low gamma, small steps"
    })
    
    # Variant 9: High entropy exploration
    variants.append({
        "learning_rate": 0.005,
        "gamma": 0.97,
        "n_steps": 32,
        "ent_coef": 0.03,
        "total_timesteps": 50000,
        "_description": "Exploration-heavy: High entropy and LR"
    })
    
    # Variant 10: Balanced
    variants.append({
        "learning_rate": 0.003,
        "gamma": 0.97,
        "n_steps": 16,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Well-tuned baseline: Balanced across parameters"
    })
    
    return variants

def generate_reinforce_variants():
    """
    Generate 10 REINFORCE (policy gradient) hyperparameter variants.
    Uses PPO as proxy with policy-focused parameters.
    Key: learning_rate, gamma, n_steps, ent_coef
    """
    variants = []
    
    # Variant 1: Conservative policy
    variants.append({
        "learning_rate": 0.00001,
        "gamma": 0.995,
        "n_steps": 2048,
        "ent_coef": 0.001,
        "total_timesteps": 50000,
        "_description": "Very conservative: Tiny LR, full episode rollouts"
    })
    
    # Variant 2: Aggressive policy
    variants.append({
        "learning_rate": 0.001,
        "gamma": 0.95,
        "n_steps": 512,
        "ent_coef": 0.05,
        "total_timesteps": 50000,
        "_description": "Aggressive: High LR, high entropy, shorter rollouts"
    })
    
    # Variant 3: Baseline
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.99,
        "n_steps": 2048,
        "batch_size": 64,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Baseline (from example config)"
    })
    
    # Variant 4: Large rollouts
    variants.append({
        "learning_rate": 0.0001,
        "gamma": 0.995,
        "n_steps": 4096,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Full trajectory: Extra-long rollouts for variance reduction"
    })
    
    # Variant 5: Shorter rollouts
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.98,
        "n_steps": 256,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Short rollouts: Faster learning, higher variance"
    })
    
    # Variant 6: Moderate settings
    variants.append({
        "learning_rate": 0.00005,
        "gamma": 0.99,
        "n_steps": 1024,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Moderate: Stable policy gradient updates"
    })
    
    # Variant 7: High entropy exploration
    variants.append({
        "learning_rate": 0.0001,
        "gamma": 0.97,
        "n_steps": 1024,
        "ent_coef": 0.03,
        "total_timesteps": 50000,
        "_description": "Exploratory policy: High entropy regularization"
    })
    
    # Variant 8: Low entropy exploitation
    variants.append({
        "learning_rate": 0.00001,
        "gamma": 0.99,
        "n_steps": 2048,
        "ent_coef": 0.001,
        "total_timesteps": 50000,
        "_description": "Exploitative: Low entropy, tiny LR"
    })
    
    # Variant 9: Medium LR
    variants.append({
        "learning_rate": 0.0005,
        "gamma": 0.98,
        "n_steps": 1024,
        "ent_coef": 0.015,
        "total_timesteps": 50000,
        "_description": "Balanced: Medium LR with moderate entropy"
    })
    
    # Variant 10: Well-tuned
    variants.append({
        "learning_rate": 0.0001,
        "gamma": 0.99,
        "n_steps": 2048,
        "ent_coef": 0.01,
        "total_timesteps": 50000,
        "_description": "Production-ready: Proven stable baseline"
    })
    
    return variants

def save_variants(algorithm, variants, output_dir):
    """Save hyperparameter variants to JSON files."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    for i, variant in enumerate(variants, 1):
        filename = output_dir / f"{algorithm}_v{i:02d}.json"
        
        # Remove description before saving (metadata only)
        variant_data = {k: v for k, v in variant.items() if not k.startswith('_')}
        
        with open(filename, 'w') as f:
            json.dump(variant_data, f, indent=2)
        
        print(f"Created: {filename.name} - {variant.get('_description', 'No description')}")

def main():
    """Generate all hyperparameter variants."""
    print("=" * 70)
    print("HYPERPARAMETER VARIANT GENERATION")
    print("=" * 70)
    
    algorithms = {
        'dqn': generate_dqn_variants,
        'ppo': generate_ppo_variants,
        'a2c': generate_a2c_variants,
        'reinforce': generate_reinforce_variants,
    }
    
    for algo, generator in algorithms.items():
        print(f"\n{algo.upper()}")
        print("-" * 70)
        
        variants = generator()
        save_variants(algo, variants, configs_dir)
    
    print("\n" + "=" * 70)
    print("✓ All 40 hyperparameter configurations generated successfully!")
    print("  (10 variants × 4 algorithms)")
    print("=" * 70)

if __name__ == '__main__':
    main()
