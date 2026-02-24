#!/usr/bin/env bash
set -e

PY=python3
TRAIN_SCRIPT="./train.py"
ENV="environment.custom_env:PitchCoachEnv"
BASE_LOGDIR="./runs"
BEST_MODELS_DIR="./models"

# Create directories
mkdir -p "$BEST_MODELS_DIR"

# Initialize best reward tracking (macOS compatible - no associative arrays)
BEST_DQN_REWARD=-999999
BEST_PPO_REWARD=-999999
BEST_A2C_REWARD=-999999
BEST_REINFORCE_REWARD=-999999

BEST_DQN_CONFIG=""
BEST_PPO_CONFIG=""
BEST_A2C_CONFIG=""
BEST_REINFORCE_CONFIG=""

# Create algorithm directories
mkdir -p "$BEST_MODELS_DIR/dqn"
mkdir -p "$BEST_MODELS_DIR/ppo"
mkdir -p "$BEST_MODELS_DIR/a2c"
mkdir -p "$BEST_MODELS_DIR/reinforce"

echo "🚀 Starting 40 hyperparameter runs with best model tracking..."
echo "Best models will be saved to: $BEST_MODELS_DIR"
echo "=============================================================="

for algo in dqn ppo a2c reinforce; do
    echo ""
    echo "🎯 Processing $algo algorithm..."
    echo "--------------------------------------------------------------"
    
    for cfg in ./configs/${algo}/*.json; do
        if [[ ! -f "$cfg" ]]; then
            continue
        fi
        
        echo "Running ${algo} with config ${cfg}"
        
        # Run training
        if ! output=$($PY $TRAIN_SCRIPT --algorithm $algo --config "$cfg" --env "$ENV" --base_logdir "$BASE_LOGDIR" 2>&1); then
            echo "❌ Run failed: $cfg"
            continue
        fi
        
        # Extract the experiment directory from output
        exp_dir=$(echo "$output" | grep "Experiment directory:" | awk '{print $3}')
        
        if [[ -z "$exp_dir" ]]; then
            echo "⚠️  Could not find experiment directory for $cfg"
            continue
        fi
        
        # Check for training metrics
        metrics_file="$exp_dir/training_metrics.json"
        
        if [[ -f "$metrics_file" ]]; then
            # Extract final reward using Python
            final_reward=$(python3 -c "
import json
try:
    with open('$metrics_file', 'r') as f:
        data = json.load(f)
    if 'episode_rewards' in data and data['episode_rewards']:
        # Get average of last 10 episodes for stability
        rewards = data['episode_rewards'][-10:]
        if rewards:
            avg_reward = sum(rewards) / len(rewards)
            print(avg_reward)
        else:
            print('-999999')
    else:
        print('-999999')
except Exception as e:
    print('-999999')
")
            
            echo "📊 Average reward for $cfg: $final_reward"
            
            # Check if this is the best model so far for this algorithm
            case $algo in
                "dqn")
                    current_best=$BEST_DQN_REWARD
                    ;;
                "ppo")
                    current_best=$BEST_PPO_REWARD
                    ;;
                "a2c")
                    current_best=$BEST_A2C_REWARD
                    ;;
                "reinforce")
                    current_best=$BEST_REINFORCE_REWARD
                    ;;
            esac
            
            # Compare rewards (using awk for floating point comparison)
            comparison=$(awk -v final="$final_reward" -v best="$current_best" 'BEGIN {if (final > best) print "better"; else print "worse"}')
            
            if [[ "$comparison" == "better" ]]; then
                # Update best reward and config
                case $algo in
                    "dqn")
                        BEST_DQN_REWARD=$final_reward
                        BEST_DQN_CONFIG=$cfg
                        ;;
                    "ppo")
                        BEST_PPO_REWARD=$final_reward
                        BEST_PPO_CONFIG=$cfg
                        ;;
                    "a2c")
                        BEST_A2C_REWARD=$final_reward
                        BEST_A2C_CONFIG=$cfg
                        ;;
                    "reinforce")
                        BEST_REINFORCE_REWARD=$final_reward
                        BEST_REINFORCE_CONFIG=$cfg
                        ;;
                esac
                
                echo "🎉 NEW BEST! Saving model..."
                
                # Copy the best model to models directory
                model_file="$exp_dir/${algo}_model.zip"
                if [[ -f "$model_file" ]]; then
                    # Clean up reward for filename (remove decimal points)
                    clean_reward=$(echo "$final_reward" | sed 's/\.//g' | sed 's/-//g')
                    cp "$model_file" "$BEST_MODELS_DIR/$algo/best_model_${clean_reward}.zip"
                    echo "✅ Best model saved: $BEST_MODELS_DIR/$algo/best_model_${clean_reward}.zip"
                else
                    echo "❌ Model file not found: $model_file"
                fi
            fi
        else
            echo "⚠️  No metrics file found for $cfg"
        fi
        
        echo ""
    done
done

echo "=============================================================="
echo "🏆 TRAINING COMPLETED - BEST MODELS SUMMARY"
echo "=============================================================="

print_best() {
    local algo=$1
    local reward=$2
    local config=$3
    
    if (( $(echo "$reward > -999999" | bc -l) )); then
        echo "🎯 $algo:"
        echo "   Best Reward: $reward"
        echo "   Best Config: $config"
        # Clean up reward for filename
        clean_reward=$(echo "$reward" | sed 's/\.//g' | sed 's/-//g')
        echo "   Model: $BEST_MODELS_DIR/$algo/best_model_${clean_reward}.zip"
        echo ""
    else
        echo "❌ $algo: No successful runs"
        echo ""
    fi
}

print_best "dqn" "$BEST_DQN_REWARD" "$BEST_DQN_CONFIG"
print_best "ppo" "$BEST_PPO_REWARD" "$BEST_PPO_CONFIG"
print_best "a2c" "$BEST_A2C_REWARD" "$BEST_A2C_CONFIG"
print_best "reinforce" "$BEST_REINFORCE_REWARD" "$BEST_REINFORCE_CONFIG"

echo "All 40 runs completed! Best models are saved in ./models/"