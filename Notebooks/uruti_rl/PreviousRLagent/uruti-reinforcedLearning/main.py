"""
Main entry point for Pitch Coach RL System
Enhanced with beautiful CLI interface
"""
import os
import sys
import time
import argparse
import subprocess
from pathlib import Path

# Try to import colorama for colored output, but provide fallback
try:
    from colorama import init, Fore, Back, Style
    init()
    HAS_COLORAMA = True
except ImportError:
    class DummyColors:
        def __getattr__(self, name):
            return ""
    Fore = Back = Style = DummyColors()
    HAS_COLORAMA = False

class PitchCoachCLI:
    def __init__(self):
        self.models_dir = Path("models")
        self.configs_dir = Path("configs")
        self.experiments_dir = Path("experiments")
        self.setup_directories()
        
    def setup_directories(self):
        """Ensure all necessary directories exist"""
        self.models_dir.mkdir(exist_ok=True)
        self.configs_dir.mkdir(exist_ok=True)
        self.experiments_dir.mkdir(exist_ok=True)
        
        # Create algorithm subdirectories
        for algo in ['dqn', 'ppo', 'a2c', 'reinforce']:
            (self.models_dir / algo).mkdir(exist_ok=True)
    
    def clear_screen(self):
        """Clear the terminal screen"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def print_header(self):
        """Print the main header"""
        self.clear_screen()
        print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}🎯 PITCH COACH - REINFORCEMENT LEARNING SYSTEM{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}AI-Powered Presentation Coaching through Reinforcement Learning{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}")
        print()
    
    def print_menu(self, options, title="MAIN MENU"):
        """Print a formatted menu"""
        print(f"{Fore.MAGENTA}╔{'═'*68}╗{Style.RESET_ALL}")
        print(f"{Fore.MAGENTA}║ {Fore.YELLOW}{title:<66}{Fore.MAGENTA}║{Style.RESET_ALL}")
        print(f"{Fore.MAGENTA}╠{'═'*68}╣{Style.RESET_ALL}")
        
        for key, description in options.items():
            print(f"{Fore.MAGENTA}║ {Fore.CYAN}{key}: {Fore.WHITE}{description:<60}{Fore.MAGENTA}║{Style.RESET_ALL}")
        
        print(f"{Fore.MAGENTA}╚{'═'*68}╝{Style.RESET_ALL}")
        print()
    
    def get_user_choice(self, prompt="Enter your choice"):
        """Get user input with formatting"""
        return input(f"{Fore.GREEN}👉 {prompt}: {Style.RESET_ALL}").strip()
    
    def press_enter_to_continue(self):
        """Wait for user to press enter"""
        input(f"\n{Fore.CYAN}Press Enter to continue...{Style.RESET_ALL}")
    
    def list_models(self):
        """List all available trained models with pretty formatting"""
        models = []
        
        print(f"{Fore.YELLOW}📁 Available Trained Models:{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'─'*50}{Style.RESET_ALL}")
        
        for algo in ['dqn', 'ppo', 'a2c', 'reinforce']:
            algo_dir = self.models_dir / algo
            if algo_dir.exists():
                model_files = list(algo_dir.glob("*.zip"))
                if model_files:
                    print(f"\n{Fore.GREEN}🔹 {algo.upper()} Models:{Style.RESET_ALL}")
                    for i, model_file in enumerate(model_files, 1):
                        models.append((algo, str(model_file)))
                        file_size = model_file.stat().st_size / (1024*1024)  # Size in MB
                        print(f"   {Fore.WHITE}{i}. {model_file.name} ({file_size:.1f} MB){Style.RESET_ALL}")
        
        if not models:
            print(f"{Fore.RED}❌ No trained models found!{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}💡 Please train models first using option 2.{Style.RESET_ALL}")
        
        print(f"{Fore.CYAN}{'─'*50}{Style.RESET_ALL}")
        return models
    
    def run_trained_demo(self):
        """Run demonstration with a trained model"""
        self.print_header()
        print(f"{Fore.YELLOW}🚀 TRAINED AGENT DEMONSTRATION{Style.RESET_ALL}\n")
        
        models = self.list_models()
        if not models:
            self.press_enter_to_continue()
            return
        
        try:
            choice = self.get_user_choice("Select model (number) or 'b' to go back")
            if choice.lower() == 'b':
                return
            
            model_idx = int(choice) - 1
            if 0 <= model_idx < len(models):
                algo, model_path = models[model_idx]
                
                print(f"\n{Fore.GREEN}✅ Selected: {algo.upper()} - {os.path.basename(model_path)}{Style.RESET_ALL}")
                
                # Ask for demo options
                print(f"\n{Fore.YELLOW}🎬 Demo Options:{Style.RESET_ALL}")
                print(f"{Fore.WHITE}1. Quick demo (1 episode){Style.RESET_ALL}")
                print(f"{Fore.WHITE}2. Extended demo (3 episodes){Style.RESET_ALL}")
                print(f"{Fore.WHITE}3. Custom number of episodes{Style.RESET_ALL}")
                
                demo_choice = self.get_user_choice("Select demo type")
                
                episodes = 1
                if demo_choice == "2":
                    episodes = 3
                elif demo_choice == "3":
                    try:
                        episodes = int(self.get_user_choice("Number of episodes"))
                    except ValueError:
                        episodes = 1
                
                # Run the demo
                cmd = [
                    "python", "play_demo.py",
                    "--model_path", model_path,
                    "--algorithm", algo,
                    "--episodes", str(episodes),
                    "--save_video"
                ]
                
                print(f"\n{Fore.GREEN}🎥 Starting demonstration...{Style.RESET_ALL}")
                print(f"{Fore.CYAN}📹 Video will be saved automatically{Style.RESET_ALL}")
                print(f"{Fore.YELLOW}⏹️  Press 'Q' or ESC to stop early{Style.RESET_ALL}")
                self.press_enter_to_continue()
                
                subprocess.run(cmd)
                
            else:
                print(f"{Fore.RED}❌ Invalid selection!{Style.RESET_ALL}")
                self.press_enter_to_continue()
                
        except (ValueError, IndexError):
            print(f"{Fore.RED}❌ Please enter a valid number!{Style.RESET_ALL}")
            self.press_enter_to_continue()
    
    def run_random_demo(self):
        """Run random action demonstration"""
        self.print_header()
        print(f"{Fore.YELLOW}🎲 RANDOM ACTION DEMONSTRATION{Style.RESET_ALL}\n")
        
        print(f"{Fore.CYAN}This demonstrates the environment with completely random actions.")
        print(f"No trained model is used - perfect for testing the environment!{Style.RESET_ALL}\n")
        
        print(f"{Fore.GREEN}✅ Features:{Style.RESET_ALL}")
        print(f"{Fore.WHITE}• Shows environment visualization{Style.RESET_ALL}")
        print(f"{Fore.WHITE}• Records video of random behavior{Style.RESET_ALL}")
        print(f"{Fore.WHITE}• Demonstrates reward structure{Style.RESET_ALL}")
        print(f"{Fore.WHITE}• Perfect for environment testing{Style.RESET_ALL}")
        
        self.press_enter_to_continue()
        
        try:
            subprocess.run(["python", "random_demo.py"])
        except Exception as e:
            print(f"{Fore.RED}❌ Error running random demo: {e}{Style.RESET_ALL}")
    
    def train_models(self):
        """Train new RL models"""
        self.print_header()
        print(f"{Fore.YELLOW}🤖 MODEL TRAINING{Style.RESET_ALL}\n")
        
        # Check if config exists
        config_file = self.configs_dir / "training_config.json"
        if not config_file.exists():
            print(f"{Fore.RED}❌ Training config not found!{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}💡 Please ensure 'configs/training_config.json' exists{Style.RESET_ALL}")
            self.press_enter_to_continue()
            return
        
        print(f"{Fore.YELLOW}🎯 Training Algorithms:{Style.RESET_ALL}")
        algorithms = [
            ("1", "DQN (Deep Q-Network)"),
            ("2", "PPO (Proximal Policy Optimization)"), 
            ("3", "A2C (Advantage Actor-Critic)"),
            ("4", "REINFORCE (Policy Gradient)"),
            ("5", "Train ALL algorithms"),
            ("b", "Back to main menu")
        ]
        
        for key, desc in algorithms:
            print(f"   {Fore.CYAN}{key}. {desc}{Style.RESET_ALL}")
        
        choice = self.get_user_choice("Select algorithm to train")
        
        algo_map = {
            "1": "dqn",
            "2": "ppo", 
            "3": "a2c",
            "4": "reinforce",
            "5": "all"
        }
        
        if choice in algo_map:
            algorithm = algo_map[choice]
            
            print(f"\n{Fore.GREEN}🚀 Starting {algorithm.upper()} training...{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}⏳ This may take several minutes...{Style.RESET_ALL}")
            print(f"{Fore.CYAN}📊 Progress will be shown in the training window{Style.RESET_ALL}")
            self.press_enter_to_continue()
            
            try:
                cmd = [
                    "python", "train.py",
                    "--algorithm", algorithm,
                    "--config", str(config_file),
                    "--env", "environment.custom_env:PitchCoachEnv",
                    "--base_logdir", "./runs"
                ]
                
                subprocess.run(cmd)
                
                print(f"\n{Fore.GREEN}✅ Training completed!{Style.RESET_ALL}")
                print(f"{Fore.CYAN}📁 Models saved in: {self.models_dir}/{Style.RESET_ALL}")
                
            except Exception as e:
                print(f"{Fore.RED}❌ Training failed: {e}{Style.RESET_ALL}")
            
            self.press_enter_to_continue()
    
    def show_system_info(self):
        """Show system information and project overview"""
        self.print_header()
        print(f"{Fore.YELLOW}📊 SYSTEM INFORMATION{Style.RESET_ALL}\n")
        
        info_items = [
            ("Project", "Pitch Coach - RL Presentation Trainer"),
            ("Environment", "Custom Gymnasium Environment"),
            ("Algorithms", "DQN, PPO, A2C, REINFORCE"),
            ("Framework", "Stable-Baselines3 + PyGame"),
            ("Purpose", "AI-powered presentation coaching"),
            ("Status", "Ready for demonstration")
        ]
        
        for key, value in info_items:
            print(f"{Fore.CYAN}🔹 {key:<15}{Fore.WHITE}{value}{Style.RESET_ALL}")
        
        print(f"\n{Fore.YELLOW}🎯 QUICK START:{Style.RESET_ALL}")
        print(f"{Fore.WHITE}1. Train models first (Option 2){Style.RESET_ALL}")
        print(f"{Fore.WHITE}2. Run trained agent demo (Option 1){Style.RESET_ALL}")
        print(f"{Fore.WHITE}3. Record your video presentation!{Style.RESET_ALL}")
        
        self.press_enter_to_continue()
    
    def run(self):
        """Main application loop"""
        while True:
            self.print_header()
            
            menu_options = {
                "1": "Run trained agent demonstration 🚀",
                "2": "Train new models 🤖", 
                "3": "Run random action demo 🎲",
                "4": "System information 📊",
                "5": "Exit 👋"
            }
            
            self.print_menu(menu_options, "PITCH COACH CONTROL PANEL")
            
            choice = self.get_user_choice()
            
            if choice == "1":
                self.run_trained_demo()
            elif choice == "2":
                self.train_models()
            elif choice == "3":
                self.run_random_demo()
            elif choice == "4":
                self.show_system_info()
            elif choice == "5":
                print(f"\n{Fore.GREEN}👋 Thank you for using Pitch Coach!{Style.RESET_ALL}")
                print(f"{Fore.CYAN}🎯 Good luck with your presentation!{Style.RESET_ALL}\n")
                break
            else:
                print(f"\n{Fore.RED}❌ Invalid choice! Please select 1-5.{Style.RESET_ALL}")
                time.sleep(1)

def main():
    """Main entry point"""
    try:
        cli = PitchCoachCLI()
        cli.run()
    except KeyboardInterrupt:
        print(f"\n\n{Fore.YELLOW}👋 Session interrupted. Goodbye!{Style.RESET_ALL}")
    except Exception as e:
        print(f"\n{Fore.RED}💥 Unexpected error: {e}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}🔧 Please check your installation and try again.{Style.RESET_ALL}")

if __name__ == "__main__":
    main()