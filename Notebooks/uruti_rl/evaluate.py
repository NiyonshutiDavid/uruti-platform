import argparse
import os
import cv2
import numpy as np
from stable_baselines3 import DQN, PPO, A2C
from envs.video_pitch_env import VideoPitchEnv
from data_sources import parse_video_source, resolve_default_meld_video_source

def evaluate(args):
    # Load model
    if args.algorithm == 'dqn':
        model = DQN.load(args.model_path)
    elif args.algorithm == 'ppo':
        model = PPO.load(args.model_path)
    elif args.algorithm == 'a2c':
        model = A2C.load(args.model_path)
    elif args.algorithm == 'reinforce':
        model = PPO.load(args.model_path)   # if trained with PPO proxy
    else:
        raise ValueError(f"Unsupported algorithm: {args.algorithm}")

    # Create video environment
    source = parse_video_source(args.video_source)
    if source is None:
        source = resolve_default_meld_video_source(__file__)
        if source is None:
            raise ValueError("No MELD video dataset found. Provide --video_source with a real video file or folder in MELD.Raw.")
    env = VideoPitchEnv(
        video_source=source,
        render_mode='human',
        max_videos_per_category=args.max_videos_per_category,
        max_videos_total=args.max_videos_total,
    )

    obs, info = env.reset()
    done = False
    total_reward = 0
    step = 0
    paused = False

    print("Evaluation started. Press 'p' to pause, 'q' to quit.")

    while not done:
        if not paused:
            action, _ = model.predict(obs, deterministic=True)
            obs, reward, done, truncated, info = env.step(action)
            total_reward += reward
            step += 1

            # Print step info
            print(f"Step {step:3d} | Action: {env.action_meanings[action]:<15} | "
                  f"Reward: {reward:6.2f} | Total: {total_reward:6.2f}")

        # Handle key presses
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('p'):
            paused = not paused
            print("PAUSED" if paused else "RESUMED")

    env.close()
    cv2.destroyAllWindows()
    print(f"Evaluation finished. Total reward: {total_reward:.2f} over {step} steps.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--model_path', type=str, required=True,
                        help='Path to trained model zip file')
    parser.add_argument('--algorithm', type=str, required=True,
                        choices=['dqn', 'ppo', 'a2c', 'reinforce'])
    parser.add_argument('--video_source', type=str, default=None,
                        help='Video file path, camera index, or folder path (defaults to real dataset folder)')
    parser.add_argument('--max_videos_per_category', type=int, default=100,
                        help='Maximum videos to load per MELD category (output/test/train) when using MELD.Raw root')
    parser.add_argument('--max_videos_total', type=int, default=0,
                        help='Maximum videos to load from a non-MELD-root video folder (0 disables cap)')
    args = parser.parse_args()

    evaluate(args)