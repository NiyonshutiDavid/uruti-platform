"""
Track and manage best performing models across all runs
"""
import json
import os
import shutil
from pathlib import Path

class BestModelTracker:
    def __init__(self, models_dir="./models", runs_dir="./runs"):
        self.models_dir = Path(models_dir)
        self.runs_dir = Path(runs_dir)
        self.models_dir.mkdir(exist_ok=True)
        
        # Initialize best scores
        self.best_scores = {
            'dqn': -float('inf'),
            'ppo': -float('inf'), 
            'a2c': -float('inf'),
            'reinforce': -float('inf')
        }
        self.best_models = {}
    
    def find_best_models(self):
        """Find best models from all training runs"""
        print("🔍 Searching for best models...")
        
        for algo in self.best_scores.keys():
            algo_dir = self.models_dir / algo
            algo_dir.mkdir(exist_ok=True)
            
            # Find all runs for this algorithm
            algo_runs = list(self.runs_dir.glob(f"{algo}_*"))
            best_run = None
            best_score = -float('inf')
            
            for run_dir in algo_runs:
                metrics_file = run_dir / "training_metrics.json"
                
                if metrics_file.exists():
                    try:
                        with open(metrics_file, 'r') as f:
                            metrics = json.load(f)
                        
                        # Calculate average of last 10 episodes
                        if 'episode_rewards' in metrics and metrics['episode_rewards']:
                            recent_rewards = metrics['episode_rewards'][-10:]
                            avg_reward = sum(recent_rewards) / len(recent_rewards)
                            
                            if avg_reward > best_score:
                                best_score = avg_reward
                                best_run = run_dir
                                
                    except Exception as e:
                        print(f"⚠️  Error reading {metrics_file}: {e}")
            
            if best_run and best_score > self.best_scores[algo]:
                self.best_scores[algo] = best_score
                
                # Copy the best model
                model_file = best_run / f"{algo}_model.zip"
                if model_file.exists():
                    best_model_path = algo_dir / f"best_model_{int(best_score)}.zip"
                    shutil.copy2(model_file, best_model_path)
                    self.best_models[algo] = best_model_path
                    print(f"✅ {algo.upper()}: Score {best_score:.2f} -> {best_model_path}")
                else:
                    print(f"❌ {algo.upper()}: Model file not found in {best_run}")
            else:
                print(f"⚠️  {algo.upper()}: No valid runs found")
    
    def print_summary(self):
        """Print summary of best models"""
        print("\n" + "="*60)
        print("🏆 BEST MODELS SUMMARY")
        print("="*60)
        
        for algo, score in self.best_scores.items():
            if score > -float('inf'):
                model_path = self.best_models.get(algo, "Not found")
                print(f"🎯 {algo.upper():<12} | Score: {score:8.2f} | Model: {model_path}")
            else:
                print(f"❌ {algo.upper():<12} | No successful runs")
        
        print("="*60)

if __name__ == "__main__":
    tracker = BestModelTracker()
    tracker.find_best_models()
    tracker.print_summary()