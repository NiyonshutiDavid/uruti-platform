import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from statistics import mean
from typing import Dict, List, Tuple

import matplotlib.pyplot as plt
import numpy as np
from stable_baselines3 import A2C, DQN, PPO

from data_sources import resolve_default_meld_video_source, resolve_meld_category_dirs
from envs.pitch_env import PitchCoachEnv
from envs.video_pitch_env import VideoPitchEnv

ALGO_CHOICES = ["dqn", "ppo", "a2c", "reinforce"]
MODEL_LOADERS = {
    "dqn": DQN,
    "ppo": PPO,
    "a2c": A2C,
    "reinforce": PPO,
}


def load_json(path: Path) -> Dict:
    with path.open("r") as f:
        return json.load(f)


def discover_configs(configs_dir: Path) -> Dict[str, Path]:
    found: Dict[str, Path] = {}
    for config_path in sorted(configs_dir.glob("*.json")):
        algo = config_path.stem.split("_")[0].lower()
        if algo in ALGO_CHOICES:
            found[algo] = config_path
    return found


def latest_run_dir(base_dir: Path, algorithm: str, env_type: str) -> Path:
    prefix = f"{algorithm}_{env_type}_"
    candidates = [d for d in base_dir.glob(f"{prefix}*") if d.is_dir()]
    if not candidates:
        raise FileNotFoundError(f"No run directory found for {algorithm}/{env_type} in {base_dir}")
    return sorted(candidates)[-1]


def run_training(
    python_executable: str,
    train_script: Path,
    algorithm: str,
    config_path: Path,
    env_type: str,
    logdir: Path,
    video_source: str,
    max_videos_per_category: int,
    max_videos_total: int,
    total_timesteps_override: int,
) -> Tuple[Path, Dict]:
    original_cfg = load_json(config_path)
    effective_cfg = dict(original_cfg)
    if total_timesteps_override > 0:
        effective_cfg["total_timesteps"] = int(total_timesteps_override)

    tmp_cfg = logdir / f"_tmp_{algorithm}_config.json"
    tmp_cfg.write_text(json.dumps(effective_cfg, indent=2))

    command = [
        python_executable,
        str(train_script),
        "--algorithm",
        algorithm,
        "--config",
        str(tmp_cfg),
        "--env_type",
        env_type,
        "--logdir",
        str(logdir),
        "--max_videos_per_category",
        str(max_videos_per_category),
        "--max_videos_total",
        str(max_videos_total),
    ]
    if env_type == "video":
        command.extend(["--video_source", str(video_source)])

    subprocess.run(command, check=True)

    run_dir = latest_run_dir(logdir, algorithm, env_type)
    tmp_cfg.unlink(missing_ok=True)
    return run_dir, effective_cfg


def evaluate_model(model, env, episodes: int) -> Tuple[float, float]:
    rewards: List[float] = []
    for _ in range(episodes):
        obs, _ = env.reset()
        done = False
        ep_reward = 0.0
        while not done:
            action, _ = model.predict(obs, deterministic=True)
            obs, reward, terminated, truncated, _ = env.step(action)
            ep_reward += float(reward)
            done = bool(terminated or truncated)
        rewards.append(ep_reward)

    env.close()
    if not rewards:
        return 0.0, 0.0
    return float(np.mean(rewards)), float(np.std(rewards))


def generate_plots(results: List[Dict], assets_dir: Path) -> Dict[str, str]:
    assets_dir.mkdir(parents=True, exist_ok=True)

    training_plot = assets_dir / "training_rewards.png"
    plt.figure(figsize=(12, 6))
    for result in results:
        timesteps = result.get("training_metrics", {}).get("timesteps", [])
        rewards = result.get("training_metrics", {}).get("episode_rewards", [])
        if timesteps and rewards:
            plt.plot(timesteps, rewards, label=result["algorithm"], alpha=0.8)
    plt.title("Training Reward Curves")
    plt.xlabel("Timesteps")
    plt.ylabel("Episode Reward")
    plt.legend()
    plt.grid(alpha=0.2)
    plt.tight_layout()
    plt.savefig(training_plot, dpi=150)
    plt.close()

    bars_plot = assets_dir / "comparison_bars.png"
    labels = [r["algorithm"] for r in results]
    train_last = [r["train_last_reward"] for r in results]
    sim_mean = [r["sim_eval_mean"] for r in results]
    test_mean = [r["video_test_mean"] for r in results]
    output_mean = [r["video_output_mean"] for r in results]
    generalization = [r["generalization_score"] for r in results]

    x = np.arange(len(labels))
    width = 0.16

    plt.figure(figsize=(13, 6))
    plt.bar(x - 2 * width, train_last, width=width, label="Train(last)")
    plt.bar(x - width, sim_mean, width=width, label="Sim Eval")
    plt.bar(x, test_mean, width=width, label="Video Test")
    plt.bar(x + width, output_mean, width=width, label="Video Output")
    plt.bar(x + 2 * width, generalization, width=width, label="Generalization")
    plt.xticks(x, labels)
    plt.ylabel("Reward")
    plt.title("Model Comparison Metrics")
    plt.legend()
    plt.grid(alpha=0.2, axis="y")
    plt.tight_layout()
    plt.savefig(bars_plot, dpi=150)
    plt.close()

    return {
        "training_rewards": str(training_plot),
        "comparison_bars": str(bars_plot),
    }


def write_markdown_report(
    report_path: Path,
    results: List[Dict],
    image_paths: Dict[str, str],
    meld_root: str,
    train_video_source: str,
) -> None:
    def fmt(value: float) -> str:
        if value is None:
            return "N/A"
        if isinstance(value, float) and (np.isnan(value) or np.isinf(value)):
            return "N/A"
        return f"{value:.3f}"

    results_sorted = sorted(results, key=lambda r: r["generalization_score"], reverse=True)
    winner = results_sorted[0] if results_sorted else None

    lines: List[str] = []
    lines.append("# Model Comparison Report")
    lines.append("")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"MELD Root: `{meld_root}`")
    lines.append(f"Training Video Source: `{train_video_source}`")
    lines.append("")
    lines.append("## Winner")
    if winner:
        lines.append(
            f"- **Best Generalization:** `{winner['algorithm']}` (score: {winner['generalization_score']:.3f})"
        )
        lines.append(f"- Run Directory: `{winner['run_dir']}`")
        lines.append(f"- Model Path: `{winner['model_path']}`")
    else:
        lines.append("- No successful runs were completed.")
    lines.append("")

    lines.append("## Comparison Table")
    lines.append("")
    lines.append(
        "| Algorithm | Train Last Reward | Sim Mean | Video Test Mean | Video Output Mean | Generalization Score |"
    )
    lines.append("|---|---:|---:|---:|---:|---:|")
    for r in results_sorted:
        lines.append(
            f"| {r['algorithm']} | {fmt(r['train_last_reward'])} | {fmt(r['sim_eval_mean'])} | {fmt(r['video_test_mean'])} | {fmt(r['video_output_mean'])} | {fmt(r['generalization_score'])} |"
        )
    lines.append("")

    lines.append("## Performance Snapshots")
    lines.append("")
    lines.append(f"![Training Curves]({image_paths['training_rewards']})")
    lines.append("")
    lines.append(f"![Comparison Bars]({image_paths['comparison_bars']})")
    lines.append("")

    lines.append("## Notes")
    lines.append("- Generalization score is computed as `0.7 * mean(video_test, video_output) + 0.3 * sim_mean - 0.3 * abs(video_test - video_output)`.")
    lines.append("- Higher score favors stronger unseen-video performance and lower gap between test/output categories.")
    lines.append("- If video evaluation is unavailable in the current environment, `Video Test Mean` and `Video Output Mean` are `N/A`, and `Generalization Score` falls back to `Sim Mean`.")

    report_path.write_text("\n".join(lines))


def main() -> None:
    parser = argparse.ArgumentParser(description="Train all RL configs and generate a comparison report.")
    parser.add_argument("--configs_dir", type=str, default="configs")
    parser.add_argument("--train_script", type=str, default="train.py")
    parser.add_argument("--runs_dir", type=str, default="runs/comparison_runs")
    parser.add_argument("--report_path", type=str, default="comparison.md")
    parser.add_argument("--assets_dir", type=str, default="reports/comparison_assets")
    parser.add_argument("--train_env_type", type=str, choices=["sim", "video"], default="video")
    parser.add_argument("--video_source", type=str, default=None)
    parser.add_argument("--max_videos_per_category", type=int, default=100)
    parser.add_argument("--max_videos_total", type=int, default=100)
    parser.add_argument("--eval_episodes_sim", type=int, default=5)
    parser.add_argument("--eval_episodes_video", type=int, default=5)
    parser.add_argument("--total_timesteps_override", type=int, default=0)
    parser.add_argument("--python_executable", type=str, default=sys.executable)
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    configs_dir = (root / args.configs_dir).resolve()
    train_script = (root / args.train_script).resolve()
    runs_dir = (root / args.runs_dir).resolve()
    assets_dir = (root / args.assets_dir).resolve()
    report_path = (root / args.report_path).resolve()

    runs_dir.mkdir(parents=True, exist_ok=True)
    assets_dir.mkdir(parents=True, exist_ok=True)

    meld_root = args.video_source or resolve_default_meld_video_source(__file__)
    if meld_root is None:
        raise ValueError("Could not resolve MELD dataset root. Provide --video_source path to MELD.Raw.")

    meld_dirs = resolve_meld_category_dirs(meld_root)
    train_video_source = str(meld_dirs["train"])

    config_map = discover_configs(configs_dir)
    if not config_map:
        raise FileNotFoundError(f"No algorithm config JSON files found in {configs_dir}")

    results: List[Dict] = []

    for algorithm in ALGO_CHOICES:
        config_path = config_map.get(algorithm)
        if not config_path:
            continue

        print(f"[Run] Training {algorithm} using {config_path.name}")
        try:
            run_dir, effective_cfg = run_training(
                python_executable=args.python_executable,
                train_script=train_script,
                algorithm=algorithm,
                config_path=config_path,
                env_type=args.train_env_type,
                logdir=runs_dir,
                video_source=train_video_source,
                max_videos_per_category=args.max_videos_per_category,
                max_videos_total=args.max_videos_total,
                total_timesteps_override=args.total_timesteps_override,
            )

            model_path = run_dir / f"{algorithm}_model.zip"
            metrics_path = run_dir / "training_metrics.json"
            training_metrics = load_json(metrics_path) if metrics_path.exists() else {}
            train_rewards = training_metrics.get("episode_rewards", [])
            train_last_reward = float(mean(train_rewards[-10:])) if train_rewards else 0.0

            model = MODEL_LOADERS[algorithm].load(str(model_path))

            sim_env = PitchCoachEnv(render_mode=None)
            sim_mean, sim_std = evaluate_model(model, sim_env, episodes=args.eval_episodes_sim)

            video_error = None
            try:
                test_env = VideoPitchEnv(
                    video_source=str(meld_dirs["test"]),
                    render_mode=None,
                    max_videos_total=args.max_videos_total,
                )
                test_mean, test_std = evaluate_model(model, test_env, episodes=args.eval_episodes_video)

                output_env = VideoPitchEnv(
                    video_source=str(meld_dirs["output"]),
                    render_mode=None,
                    max_videos_total=args.max_videos_total,
                )
                output_mean, output_std = evaluate_model(model, output_env, episodes=args.eval_episodes_video)

                video_mean = float(np.mean([test_mean, output_mean]))
                generalization_score = float(0.7 * video_mean + 0.3 * sim_mean - 0.3 * abs(test_mean - output_mean))
            except Exception as video_exc:
                video_error = str(video_exc)
                test_mean, test_std = float("nan"), float("nan")
                output_mean, output_std = float("nan"), float("nan")
                generalization_score = float(sim_mean)

            results.append(
                {
                    "algorithm": algorithm,
                    "config_path": str(config_path),
                    "run_dir": str(run_dir),
                    "model_path": str(model_path),
                    "effective_config": effective_cfg,
                    "training_metrics": training_metrics,
                    "train_last_reward": train_last_reward,
                    "sim_eval_mean": sim_mean,
                    "sim_eval_std": sim_std,
                    "video_test_mean": test_mean,
                    "video_test_std": test_std,
                    "video_output_mean": output_mean,
                    "video_output_std": output_std,
                    "generalization_score": generalization_score,
                    "video_eval_error": video_error,
                }
            )

            print(
                f"[Done] {algorithm}: train_last={train_last_reward:.3f}, "
                f"sim={sim_mean:.3f}, test={test_mean}, output={output_mean}, "
                f"generalization={generalization_score:.3f}"
            )
        except Exception as exc:
            print(f"[Error] {algorithm} failed: {exc}")

    if not results:
        raise RuntimeError("All model runs failed; no report generated.")

    image_paths = generate_plots(results, assets_dir)
    image_paths = {k: str(Path(v).resolve().relative_to(report_path.parent)) for k, v in image_paths.items()}

    write_markdown_report(
        report_path=report_path,
        results=results,
        image_paths=image_paths,
        meld_root=str(meld_root),
        train_video_source=train_video_source,
    )

    results_json = report_path.with_suffix(".json")
    results_json.write_text(json.dumps(results, indent=2))

    print(f"[Report] Markdown: {report_path}")
    print(f"[Report] JSON: {results_json}")


if __name__ == "__main__":
    main()
