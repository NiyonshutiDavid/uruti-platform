"""
Utility to record frames via ffmpeg subprocess to H.264 MP4.
Frames must be RGB numpy arrays (h, w, 3).
"""
import subprocess, shlex

def ffmpeg_pipe_writer(out_path, width, height, fps=30, preset='fast'):
    cmd = (
        f"ffmpeg -y -f rawvideo -pix_fmt rgb24 -s {width}x{height} -r {fps} -i - "
        f"-c:v libx264 -preset {preset} -pix_fmt yuv420p -movflags +faststart {shlex.quote(out_path)}"
    )
    proc = subprocess.Popen(shlex.split(cmd), stdin=subprocess.PIPE)
    return proc

def close_pipe(proc):
    if proc and proc.stdin:
        proc.stdin.close()
        proc.wait()
