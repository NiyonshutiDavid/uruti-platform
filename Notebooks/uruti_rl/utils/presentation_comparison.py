# Presentation Environment Comparison Utilities
"""
Compare agent performance across presentation and simulation environments
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple
import json
import numpy as np
from datetime import datetime

from stable_baselines3 import DQN, PPO, A2C
from envs.presentation_pitch_env import PresentationPitchEnv
from envs.pitch_env import PitchEnv


class PresentationComparator:
    """Compare agent performance across presentation environments."""
    
    def __init__(self, models_dir: str = 'models'):
        self.models_dir = Path(models_dir)
        self.results = {}
    
    def evaluate_presentation_agent(
        self,
        model_path: str,
        algorithm: str,
        env_type: str = 'presentation',
        slides: int = 10,
        episodes: int = 10,
        slides_dir: Optional[str] = None,
    ) -> Dict[str, float]:
        """
        Evaluate agent on presentation task.
        
        Args:
            model_path: Path to trained model
            algorithm: Algorithm name ('dqn', 'ppo', 'a2c')
            env_type: 'presentation' or 'simulation'
            slides: Number of slides
            episodes: Number of evaluation episodes
            slides_dir: Directory with slide images
            
        Returns:
            Dictionary with evaluation metrics
        """
        
        # Create environment
        if env_type == 'presentation':
            env = PresentationPitchEnv(
                render_mode=None,
                total_slides=slides,
                slide_images_dir=slides_dir,
            )
        elif env_type == 'simulation':
            env = PitchEnv(
                render_mode=None,
                total_slides=slides,
            )
        else:
            raise ValueError(f"Unknown env_type: {env_type}")
        
        # Load model
        model_class = {'dqn': DQN, 'ppo': PPO, 'a2c': A2C}[algorithm.lower()]
        model = model_class.load(model_path)
        
        # Evaluate
        episode_rewards = []
        slides_completed = []
        final_confidences = []
        final_engagements = []
        
        for ep in range(episodes):
            obs, _ = env.reset()
            done = False
            episode_reward = 0.0
            max_slide = 0
            
            while not done:
                action, _ = model.predict(obs, deterministic=True)
                obs, reward, terminated, truncated, info = env.step(action)
                done = terminated or truncated
                episode_reward += reward
                max_slide = max(max_slide, info['current_metrics'].get('current_slide', 0))
            
            episode_rewards.append(episode_reward)
            slides_completed.append(max_slide + 1)  # Convert to 1-based
            final_confidences.append(info['current_metrics'].get('confidence', 0))
            final_engagements.append(info['current_metrics'].get('engagement', 0))
        
        env.close()
        
        # Calculate statistics
        results = {
            'algorithm': algorithm,
            'env_type': env_type,
            'slides': slides,
            'episodes': episodes,
            'reward_mean': float(np.mean(episode_rewards)),
            'reward_std': float(np.std(episode_rewards)),
            'reward_min': float(np.min(episode_rewards)),
            'reward_max': float(np.max(episode_rewards)),
            'slides_completed_mean': float(np.mean(slides_completed)),
            'slides_completed_std': float(np.std(slides_completed)),
            'confidence_mean': float(np.mean(final_confidences)),
            'engagement_mean': float(np.mean(final_engagements)),
        }
        
        return results
    
    def compare_algorithms(
        self,
        algorithms: List[str],
        env_type: str = 'presentation',
        slides: int = 10,
        episodes: int = 10,
        models_dir: Optional[str] = None,
    ) -> Dict[str, Dict]:
        """Compare all algorithms on same task."""
        
        models_dir = Path(models_dir or self.models_dir)
        comparison = {}
        
        for algo in algorithms:
            # Find model
            model_pattern = f"{algo}_{env_type}_slides{slides}"
            matching_models = list(models_dir.glob(f"{model_pattern}*"))
            
            if not matching_models:
                print(f"Warning: No model found for {model_pattern}")
                continue
            
            model_path = str(matching_models[0])
            print(f"Evaluating {algo}...")
            
            results = self.evaluate_presentation_agent(
                model_path=model_path,
                algorithm=algo,
                env_type=env_type,
                slides=slides,
                episodes=episodes,
            )
            
            comparison[algo] = results
        
        return comparison
    
    def compare_environments(
        self,
        algorithm: str,
        env_types: List[str] = ['simulation', 'presentation'],
        slides: int = 10,
        episodes: int = 10,
    ) -> Dict[str, Dict]:
        """Compare algorithm across different environments."""
        
        comparison = {}
        
        for env_type in env_types:
            model_pattern = f"{algorithm}_{env_type}_slides{slides}"
            matching_models = list(self.models_dir.glob(f"{model_pattern}*"))
            
            if not matching_models:
                print(f"Warning: No model found for {model_pattern}")
                continue
            
            model_path = str(matching_models[0])
            print(f"Evaluating on {env_type}...")
            
            results = self.evaluate_presentation_agent(
                model_path=model_path,
                algorithm=algorithm,
                env_type=env_type,
                slides=slides,
                episodes=episodes,
            )
            
            comparison[env_type] = results
        
        return comparison
    
    def generate_comparison_report(
        self,
        comparison: Dict,
        title: str = "Comparison Report",
        output_file: Optional[str] = None,
    ) -> str:
        """Generate markdown report from comparison results."""
        
        report = f"# {title}\n\n"
        report += f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # Summary table
        report += "## Summary Statistics\n\n"
        report += "| Metric | " + " | ".join(comparison.keys()) + " |\n"
        report += "|--------|" + "|".join(["---"] * len(comparison)) + "|\n"
        
        # Reward comparison
        report += "| Avg Reward | "
        report += " | ".join([
            f"{v.get('reward_mean', 0):.2f} ± {v.get('reward_std', 0):.2f}"
            for v in comparison.values()
        ])
        report += " |\n"
        
        # Slides completed
        report += "| Slides Completed | "
        report += " | ".join([
            f"{v.get('slides_completed_mean', 0):.1f}"
            for v in comparison.values()
        ])
        report += " |\n"
        
        # Final engagement
        report += "| Final Engagement | "
        report += " | ".join([
            f"{v.get('engagement_mean', 0):.2f}"
            for v in comparison.values()
        ])
        report += " |\n"
        
        # Detailed results
        report += "\n## Detailed Results\n\n"
        for key, results in comparison.items():
            report += f"### {key}\n\n"
            report += "```\n"
            for metric_key, metric_value in results.items():
                if isinstance(metric_value, float):
                    report += f"{metric_key:25s}: {metric_value:10.3f}\n"
                else:
                    report += f"{metric_key:25s}: {metric_value}\n"
            report += "```\n\n"
        
        # Insights
        report += "## Insights\n\n"
        best_algo = max(comparison.items(), 
                       key=lambda x: x[1].get('reward_mean', 0))
        report += f"- **Best Performing**: {best_algo[0]} "
        report += f"(avg reward: {best_algo[1]['reward_mean']:.2f})\n"
        
        most_slides = max(comparison.items(),
                         key=lambda x: x[1].get('slides_completed_mean', 0))
        report += f"- **Most Slides Completed**: {most_slides[0]} "
        report += f"({most_slides[1]['slides_completed_mean']:.1f} slides)\n"
        
        highest_engagement = max(comparison.items(),
                                key=lambda x: x[1].get('engagement_mean', 0))
        report += f"- **Highest Engagement**: {highest_engagement[0]} "
        report += f"({highest_engagement[1]['engagement_mean']:.2f})\n"
        
        # Save report
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)
            print(f"Report saved to {output_file}")
        
        return report
    
    def benchmark_hyperparameters(
        self,
        algorithm: str,
        variants: int = 10,
        env_type: str = 'presentation',
        slides: int = 10,
        episodes: int = 5,
    ):
        """Compare all hyperparameter variants for an algorithm."""
        
        comparison = {}
        
        for v in range(1, variants + 1):
            model_pattern = f"{algorithm}_v{v}_{env_type}_slides{slides}"
            matching_models = list(self.models_dir.glob(f"{model_pattern}*"))
            
            if not matching_models:
                continue
            
            model_path = str(matching_models[0])
            print(f"Evaluating variant {v}...")
            
            results = self.evaluate_presentation_agent(
                model_path=model_path,
                algorithm=algorithm,
                env_type=env_type,
                slides=slides,
                episodes=episodes,
            )
            
            comparison[f"v{v}"] = results
        
        return comparison


def main():
    """Main comparison routine."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Compare presentation agents')
    parser.add_argument('--algorithms', type=str, default='dqn,ppo,a2c',
                       help='Comma-separated algorithms to compare')
    parser.add_argument('--env_type', type=str, default='presentation',
                       help='Environment type')
    parser.add_argument('--slides', type=int, default=10,
                       help='Number of slides')
    parser.add_argument('--episodes', type=int, default=10,
                       help='Evaluation episodes per model')
    parser.add_argument('--output', type=str, default='presentation_comparison.md',
                       help='Output report file')
    
    args = parser.parse_args()
    
    algorithms = args.algorithms.split(',')
    
    comparator = PresentationComparator()
    results = comparator.compare_algorithms(
        algorithms=algorithms,
        env_type=args.env_type,
        slides=args.slides,
        episodes=args.episodes,
    )
    
    report = comparator.generate_comparison_report(
        results,
        title=f"Presentation Environment Comparison - {args.env_type.upper()}",
        output_file=args.output,
    )
    
    print(report)


if __name__ == "__main__":
    main()
