import pandas as pd
import json
import glob
import os

class DetailedTableGenerator:
    def __init__(self, configs_dir="configs", runs_dir="runs", output_dir="reports/tables"):
        self.configs_dir = configs_dir
        self.runs_dir = runs_dir
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_all_tables(self):
        """Generate detailed tables for all algorithms"""
        algorithms = ['dqn', 'ppo', 'a2c', 'reinforce']
        
        for algorithm in algorithms:
            print(f"Generating table for {algorithm}...")
            table = self.generate_algorithm_table(algorithm)
            if table is not None:
                # Save as CSV
                csv_path = os.path.join(self.output_dir, f"{algorithm}_detailed_results.csv")
                table.to_csv(csv_path, index=False)
                
                # Generate markdown table
                md_path = os.path.join(self.output_dir, f"{algorithm}_table.md")
                self.generate_markdown_table(table, algorithm, md_path)
                
                print(f"  Generated: {csv_path}")
                print(f"  Generated: {md_path}")
    
    def generate_algorithm_table(self, algorithm):
        """Generate detailed table for a specific algorithm"""
        runs_data = []
        
        # Load config files
        config_pattern = os.path.join(self.configs_dir, algorithm, "run_*.json")
        config_files = glob.glob(config_pattern)
        
        for config_file in config_files:
            try:
                with open(config_file, 'r') as f:
                    config_data = json.load(f)
                
                # Extract algorithm-specific config
                if algorithm in config_data:
                    alg_config = config_data[algorithm]
                else:
                    alg_config = config_data
                
                # Find performance from corresponding run
                run_id = os.path.basename(config_file).replace('.json', '')
                performance = self.find_run_performance(algorithm, run_id)
                
                # Create row data
                row_data = {
                    'Run_ID': run_id,
                    'Final_Reward': performance,
                    'Learning_Rate': alg_config.get('learning_rate', 'N/A'),
                    'Gamma': alg_config.get('gamma', 'N/A'),
                }
                
                # Add algorithm-specific parameters
                if algorithm == 'dqn':
                    row_data.update({
                        'Buffer_Size': alg_config.get('buffer_size', 'N/A'),
                        'Batch_Size': alg_config.get('batch_size', 'N/A'),
                        'Exploration_Final_Eps': alg_config.get('exploration_final_eps', 'N/A'),
                        'Exploration_Fraction': alg_config.get('exploration_fraction', 'N/A')
                    })
                elif algorithm in ['ppo', 'a2c', 'reinforce']:
                    row_data.update({
                        'N_Steps': alg_config.get('n_steps', 'N/A'),
                        'Entropy_Coef': alg_config.get('ent_coef', 'N/A')
                    })
                
                if algorithm in ['ppo', 'reinforce']:
                    row_data['Batch_Size'] = alg_config.get('batch_size', 'N/A')
                
                runs_data.append(row_data)
                
            except Exception as e:
                print(f"Error processing {config_file}: {e}")
                continue
        
        if runs_data:
            df = pd.DataFrame(runs_data)
            # Sort by performance
            df = df.sort_values('Final_Reward', ascending=False)
            return df
        else:
            return None
    
    def find_run_performance(self, algorithm, run_id):
        """Find the performance of a specific run"""
        # Look for run directories that might match this config
        run_pattern = os.path.join(self.runs_dir, f"{algorithm}_*")
        run_dirs = glob.glob(run_pattern)
        
        best_performance = 0
        for run_dir in run_dirs:
            monitor_file = os.path.join(run_dir, "monitor.csv")
            if os.path.exists(monitor_file):
                try:
                    df = pd.read_csv(monitor_file, skiprows=1)
                    if len(df) > 0 and 'r' in df.columns:
                        performance = df['r'].iloc[-1]
                        if performance > best_performance:
                            best_performance = performance
                except:
                    continue
        
        return best_performance
    
    def generate_markdown_table(self, df, algorithm, output_path):
        """Generate markdown formatted table"""
        # Take top 10 runs
        df_top = df.head(10).copy()
        
        # Format values
        for col in df_top.columns:
            if df_top[col].dtype == 'float64':
                df_top[col] = df_top[col].apply(lambda x: f"{x:.3f}" if isinstance(x, (int, float)) else str(x))
        
        # Create markdown table
        lines = []
        
        # Header
        headers = [col.replace('_', ' ').title() for col in df_top.columns]
        lines.append("| " + " | ".join(headers) + " |")
        
        # Separator
        lines.append("|" + "|".join(["---"] * len(df_top.columns)) + "|")
        
        # Rows
        for _, row in df_top.iterrows():
            line = "| " + " | ".join(str(row[col]) for col in df_top.columns) + " |"
            lines.append(line)
        
        with open(output_path, 'w') as f:
            f.write("\n".join(lines))

def main():
    generator = DetailedTableGenerator()
    generator.generate_all_tables()
    print("Detailed tables generation completed!")

if __name__ == "__main__":
    main()