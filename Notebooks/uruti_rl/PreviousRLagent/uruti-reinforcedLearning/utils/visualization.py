
import matplotlib.pyplot as plt
import numpy as np

class PitchVisualizer:
    """
    Utilities for visualizing training metrics and a simple 3D avatar.

    Note: metrics_data expected format (dict):
    {
        'timesteps': [t0, t1, ...],
        'episode_rewards': [r0, r1, ...],
        'episode_lengths': [l0, l1, ...]
    }
    """

    def create_3d_avatar(self, confidence: float, engagement: float, clarity: float):
        """Return a matplotlib figure representing a simple 3D avatar.
           This is a stylized visualization for reports/screenshots."""
        from mpl_toolkits.mplot3d import Axes3D  # local import, only if used
        fig = plt.figure(figsize=(6, 6))
        ax = fig.add_subplot(111, projection='3d')

        # head (sphere)
        u = np.linspace(0, 2 * np.pi, 30)
        v = np.linspace(0, np.pi, 30)
        x = 0.5 * np.outer(np.cos(u), np.sin(v))
        y = 0.5 * np.outer(np.sin(u), np.sin(v))
        z = 0.5 * np.outer(np.ones(np.size(u)), np.cos(v)) + 1.5

        ax.plot_surface(x, y, z, color='lightblue', alpha=0.8)

        # arms based on engagement
        arm_ext = engagement * 0.5
        ax.plot([-0.3, -0.3 - arm_ext], [0, 0], [1.2, 0.8], 'b-', linewidth=3)
        ax.plot([0.3, 0.3 + arm_ext], [0, 0], [1.2, 0.8], 'b-', linewidth=3)

        # posture angle based on confidence
        ax.view_init(elev=20 + confidence * 10, azim=30)

        ax.set_xlim(-1, 1)
        ax.set_ylim(-1, 1)
        ax.set_zlim(0, 3)
        ax.set_title(f'Pitch Avatar — C:{confidence:.2f}, E:{engagement:.2f}, CL:{clarity:.2f}')
        ax.axis('off')

        return fig, ax

    def plot_training_metrics(self, metrics_data: dict, save_path: str = None):
        """
        metrics_data keys: 'timesteps', 'episode_rewards', 'episode_lengths'
        Produces 4-panel figure: cumulative rewards, episode lengths, combined, moving avg.
        """
        # Validate input
        for k in ['timesteps', 'episode_rewards', 'episode_lengths']:
            if k not in metrics_data:
                raise ValueError(f"metrics_data missing required key: {k}")

        timesteps = metrics_data['timesteps']
        rewards = metrics_data['episode_rewards']
        lengths = metrics_data['episode_lengths']

        fig, axs = plt.subplots(2, 2, figsize=(12, 8))
        ax1, ax2, ax3, ax4 = axs.flatten()

        ax1.plot(timesteps[:len(rewards)], rewards)
        ax1.set_title('Cumulative Rewards')
        ax1.set_xlabel('Timesteps')
        ax1.set_ylabel('Reward')

        ax2.plot(timesteps[:len(lengths)], lengths)
        ax2.set_title('Episode Lengths')
        ax2.set_xlabel('Timesteps')
        ax2.set_ylabel('Steps')

        episodes = np.arange(len(rewards))
        ax3.plot(episodes, rewards, label='Rewards')
        ax3.plot(episodes, np.array(lengths) / (np.max(lengths) + 1e-6), label='Norm length')
        ax3.set_title('Training Progress')
        ax3.set_xlabel('Episodes')
        ax3.legend()

        # Moving average
        window = min(20, max(1, len(rewards)//10))
        if len(rewards) >= window:
            moving_avg = np.convolve(rewards, np.ones(window)/window, mode='valid')
            ax4.plot(np.arange(len(moving_avg)), moving_avg)
            ax4.set_title(f'Moving Average (window={window})')
            ax4.set_xlabel('Episodes')
            ax4.set_ylabel('Avg Reward')
        else:
            ax4.text(0.5, 0.5, 'Not enough data for moving average', ha='center')

        plt.tight_layout()
        if save_path:
            fig.savefig(save_path, dpi=150)
            print(f"[visualization] Saved training plot to {save_path}")
        return fig
