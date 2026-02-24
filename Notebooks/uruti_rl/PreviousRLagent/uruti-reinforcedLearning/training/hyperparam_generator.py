"""
Generate 10 hyperparameter JSON files for each algorithm which can be configured later:
configs/dqn/run_1.json ... run_10.json
configs/ppo/run_1.json ...
configs/a2c/run_1.json ...
configs/reinforce/run_1.json ...
"""
import os
import json
import numpy as np

OUT_DIR = "configs"
os.makedirs(OUT_DIR, exist_ok=True)

def sample_and_write(name, grid, n=10):
    od = os.path.join(OUT_DIR, name)
    os.makedirs(od, exist_ok=True)
    rng = np.random.default_rng(42)
    files = []
    for i in range(1, n+1):
        cfg = {}
        for k, vals in grid.items():
            cfg[k] = float(rng.choice(vals)) if isinstance(vals[0], float) else int(rng.choice(vals))
        # common fields
        cfg.setdefault("total_timesteps", 50000)
        fname = os.path.join(od, f"run_{i}.json")
        with open(fname, "w") as fh:
            json.dump(cfg, fh, indent=2)
        files.append(fname)
    return files

def gen_all():
    dqn_grid = {
        "learning_rate": [1e-4, 5e-4, 1e-3],
        "gamma": [0.98, 0.99, 0.995],
        "buffer_size": [10000, 30000],
        "batch_size": [32, 64],
        "exploration_fraction": [0.2, 0.3, 0.5],
        "exploration_final_eps": [0.01, 0.05, 0.1]
    }
    ppo_grid = {
        "learning_rate": [3e-4, 1e-4, 5e-4],
        "gamma": [0.98, 0.99],
        "n_steps": [128, 256],
        "ent_coef": [0.0, 0.01]
    }
    a2c_grid = {
        "learning_rate": [7e-4, 1e-4, 5e-4],
        "gamma": [0.98, 0.99],
        "n_steps": [5, 20],
        "ent_coef": [0.0, 0.001]
    }
    reinforce_grid = {
        "learning_rate": [3e-4, 1e-4, 5e-4],
        "gamma": [0.98, 0.99],
        "batch_size": [5, 10, 20],
        "total_episodes": [200, 400]
    }

    print("Generating DQN configs...")
    d = sample_and_write("dqn", dqn_grid, 10)
    print("Generating PPO configs...")
    p = sample_and_write("ppo", ppo_grid, 10)
    print("Generating A2C configs...")
    a = sample_and_write("a2c", a2c_grid, 10)
    print("Generating REINFORCE configs...")
    r = sample_and_write("reinforce", reinforce_grid, 10)
    return {"dqn": d, "ppo": p, "a2c": a, "reinforce": r}

if __name__ == "__main__":
    out = gen_all()
    for k, v in out.items():
        print(f"{k}: {len(v)} files in configs/{k}/")
