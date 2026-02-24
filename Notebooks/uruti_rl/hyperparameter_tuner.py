#!/usr/bin/env python3
"""
Comprehensive hyperparameter tuning runner for all 4 RL algorithms.
Executes all 40 hyperparameter variants (10 per algorithm) across sim and video environments.
Generates detailed analysis comparing each variant's performance.
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from statistics import mean, stdev
from typing import Dict, List, Tuple

import matplotlib.pyplot as plt
import numpy as np

def load_json(path: Path) -> Dict:
    """Load JSON configuration file."""
    with open(path, 'r') as f:
        return json.load(f)

def discover_hyperparameter_variants(configs_dir: Path) -> Dict[str, List[Path]]:
    """
    Discover all hyperparameter variant configs organized by algorithm.
    Returns: {
        'dqn': [dqn_v01.json, dqn_v02.json, ...],
        'ppo': [...],
        'a2c': [...],
        'reinforce': [...]
    }
    """
    variants = {
        'dqn': [],
        'ppo': [],
        'a2c': [],
        'reinforce': []
    }
    
    for config_path in sorted(configs_dir.glob('*.json')):
        if config_path.name.startswith('_'):
            continue  # Skip generated tmp configs
        
        # Parse algorithm from filename (e.g., dqn_v01.json -> dqn)
        algo = config_path.stem.split('_')[0].lower()
        
        if algo in variants:
            variants[algo].append(config_path)
    
    return variants

def run_training_variant(
    train_script: Path,
    algorithm: str,
    config_path: Path,
    env_type: str,
    output_dir: Path,
    video_source: str,
    max_videos_total: int = 5,
    total_timesteps: int = None
) -> Tuple[bool, str, Dict]:
    """
    Run a single training variant.
    
    Returns: (success, run_dir, metadata)
    """
    config = load_json(config_path)
    variant_name = config_path.stem  # e.g., 'dqn_v01'
    
    # Build command
    cmd = [
        sys.executable,
        str(train_script),
        '--algorithm', algorithm,
        '--config', str(config_path),
        '--env_type', env_type,
        '--logdir', str(output_dir),
    ]
    
    if env_type == 'video':
        cmd.extend(['--video_source', video_source])
        cmd.extend(['--max_videos_total', str(max_videos_total)])
    
    if total_timesteps is not None and total_timesteps > 0:
        # Create temp config with overridden timesteps
        temp_config = dict(config)
        temp_config['total_timesteps'] = total_timesteps
        temp_cfg_path = output_dir / f"_temp_{variant_name}_config.json"
        with open(temp_cfg_path, 'w') as f:
            json.dump(temp_config, f, indent=2)
        cmd[cmd.index(str(config_path))] = str(temp_cfg_path)
    
    try:
        print(f"  Training {variant_name}...", end='', flush=True)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
        
        if result.returncode != 0:
            print(f" ✗ FAILED")
            return False, "", {"error": result.stderr}
        
        print(f" ✓")
        return True, variant_name, config
        
    except subprocess.TimeoutExpired:
        print(f" ✗ TIMEOUT")
        return False, "", {"error": "Training timeout (1 hour limit)"}
    except Exception as e:
        print(f" ✗ ERROR: {e}")
        return False, "", {"error": str(e)}

def run_hyperparameter_tuning(
    train_script: Path,
    configs_dir: Path,
    output_base: Path,
    env_types: List[str] = None,
    video_source: str = None,
    max_videos_total: int = 5,
    total_timesteps_override: int = 0,
    algorithms: List[str] = None
):
    """
    Run comprehensive hyperparameter tuning across all variants.
    
    Args:
        train_script: Path to train.py
        configs_dir: Path to configs directory with variant JSONs
        output_base: Base directory for run outputs
        env_types: List of environment types to test ['sim', 'video', 'both']
        video_source: Path to video data source (required if 'video' in env_types)
        max_videos_total: Max videos to sample per run
        total_timesteps_override: Override timesteps in configs (0 = use config values)
        algorithms: List of algorithms to run ['dqn', 'ppo', 'a2c', 'reinforce']
    """
    
    if env_types is None:
        env_types = ['sim', 'video']
    if algorithms is None:
        algorithms = ['dqn', 'ppo', 'a2c', 'reinforce']
    
    output_base = Path(output_base)
    output_base.mkdir(parents=True, exist_ok=True)
    
    # Create tuning session directory
    session_name = f"hyperparam_tuning_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    session_dir = output_base / session_name
    session_dir.mkdir(exist_ok=True)
    
    # Discover all variants
    variants = discover_hyperparameter_variants(configs_dir)
    
    # Initialize results tracking
    results = {
        'session': session_name,
        'timestamp': datetime.now().isoformat(),
        'config': {
            'env_types': env_types,
            'max_videos_total': max_videos_total,
            'total_timesteps_override': total_timesteps_override,
            'video_source': str(video_source) if video_source else None,
        },
        'algorithms': {}
    }
    
    print("\n" + "=" * 80)
    print("HYPERPARAMETER TUNING RUN")
    print("=" * 80)
    print(f"Session: {session_name}")
    print(f"Video source: {video_source}")
    print(f"Max videos per run: {max_videos_total}")
    print(f"Timesteps override: {total_timesteps_override if total_timesteps_override > 0 else 'Use config'}")
    print(f"Environment types: {', '.join(env_types)}")
    print(f"Algorithms: {', '.join(algorithms)}")
    print("=" * 80)
    
    # Run tuning for each algorithm
    for algo in algorithms:
        if algo not in variants or not variants[algo]:
            print(f"\n⚠️  No variants found for {algo}")
            continue
        
        print(f"\n{algo.upper()}: {len(variants[algo])} variants")
        print("-" * 80)
        
        algo_results = {
            'variants': [],
            'summary': {}
        }
        
        # Run each variant
        for config_path in variants[algo]:
            variant_name = config_path.stem
            print(f"\n{variant_name}")
            
            variant_results = {
                'name': variant_name,
                'runs': {}
            }
            
            # Run on each environment type
            for env_type in env_types:
                variant_results['runs'][env_type] = None
                
                success, run_dir, metadata = run_training_variant(
                    train_script=train_script,
                    algorithm=algo,
                    config_path=config_path,
                    env_type=env_type,
                    output_dir=session_dir / algo / variant_name,
                    video_source=video_source,
                    max_videos_total=max_videos_total,
                    total_timesteps=total_timesteps_override if total_timesteps_override > 0 else None
                )
                
                if success:
                    variant_results['runs'][env_type] = {
                        'status': 'success',
                        'run_dir': str(run_dir),
                        'metadata': metadata
                    }
                else:
                    variant_results['runs'][env_type] = {
                        'status': 'failed',
                        'error': metadata.get('error', 'Unknown error')
                    }
            
            algo_results['variants'].append(variant_results)
        
        results['algorithms'][algo] = algo_results
    
    # Save results summary
    results_file = session_dir / 'tuning_results.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "=" * 80)
    print(f"✓ Hyperparameter tuning complete!")
    print(f"Results saved to: {results_file}")
    print("=" * 80)
    
    return session_dir, results

def main():
    parser = argparse.ArgumentParser(
        description="Run comprehensive hyperparameter tuning on all 4 RL algorithms"
    )
    parser.add_argument(
        '--train_script',
        type=Path,
        default=Path(__file__).parent / 'train.py',
        help="Path to train.py script"
    )
    parser.add_argument(
        '--configs_dir',
        type=Path,
        default=Path(__file__).parent / 'configs',
        help="Path to configs directory with variants"
    )
    parser.add_argument(
        '--output_dir',
        type=Path,
        default=Path(__file__).parent / 'runs',
        help="Base output directory for runs"
    )
    parser.add_argument(
        '--env_types',
        choices=['sim', 'video', 'both'],
        default='both',
        help="Environment types to test"
    )
    parser.add_argument(
        '--video_source',
        type=Path,
        default=Path(__file__).parent.parent / 'Data' / 'MELD.Raw',
        help="Path to MELD video source"
    )
    parser.add_argument(
        '--max_videos_total',
        type=int,
        default=5,
        help="Maximum total videos per variant run"
    )
    parser.add_argument(
        '--total_timesteps',
        type=int,
        default=0,
        help="Override timesteps from config (0=use config value)"
    )
    parser.add_argument(
        '--algorithms',
        nargs='+',
        choices=['dqn', 'ppo', 'a2c', 'reinforce'],
        default=['dqn', 'ppo', 'a2c', 'reinforce'],
        help="Algorithms to tune"
    )
    
    args = parser.parse_args()
    
    env_types = ['sim', 'video'] if args.env_types == 'both' else [args.env_types]
    
    session_dir, results = run_hyperparameter_tuning(
        train_script=args.train_script,
        configs_dir=args.configs_dir,
        output_base=args.output_dir,
        env_types=env_types,
        video_source=args.video_source,
        max_videos_total=args.max_videos_total,
        total_timesteps_override=args.total_timesteps,
        algorithms=args.algorithms
    )

if __name__ == '__main__':
    main()
