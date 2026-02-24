
import pyaudio
import wave
import threading
from datetime import datetime
import sys
import os

class AudioRecorder:
    def __init__(self, rate=44100, channels=1, chunk=1024, device_index=None):
        self.rate = rate
        self.channels = channels
        self.chunk = chunk
        self.format = pyaudio.paInt16
        self.frames = []
        self.recording = False
        self.audio = pyaudio.PyAudio()
        self.stream = None
        self.thread = None
        self.device_index = device_index

    def start_recording(self):
        if self.recording:
            print("[audio] Recording already in progress")
            return
        try:
            # Choose device if provided
            kwargs = dict(format=self.format, channels=self.channels, rate=self.rate,
                          input=True, frames_per_buffer=self.chunk)
            if self.device_index is not None:
                kwargs['input_device_index'] = self.device_index

            self.stream = self.audio.open(**kwargs)
        except Exception as e:
            print(f"[audio] Failed to open stream: {e}")
            return

        self.frames = []
        self.recording = True
        self.thread = threading.Thread(target=self._record_loop, daemon=True)
        self.thread.start()
        print("[audio] Recording started")

    def _record_loop(self):
        try:
            while self.recording:
                data = self.stream.read(self.chunk, exception_on_overflow=False)
                self.frames.append(data)
        except Exception as e:
            print(f"[audio] Recording error: {e}")
            self.recording = False

    def stop_recording(self, out_dir: str = "."):
        if not self.recording:
            print("[audio] Not currently recording")
            return None
        self.recording = False
        if self.thread:
            self.thread.join(timeout=2.0)

        try:
            if self.stream:
                self.stream.stop_stream()
                self.stream.close()
        except Exception as e:
            print(f"[audio] Error closing stream: {e}")

        # Ensure out_dir exists
        os.makedirs(out_dir, exist_ok=True)
        filename = os.path.join(out_dir, f"pitch_audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav")

        try:
            wf = wave.open(filename, 'wb')
            wf.setnchannels(self.channels)
            wf.setsampwidth(self.audio.get_sample_size(self.format))
            wf.setframerate(self.rate)
            wf.writeframes(b''.join(self.frames))
            wf.close()
            print(f"[audio] Saved audio to {filename}")
        except Exception as e:
            print(f"[audio] Failed to write audio file: {e}")
            return None

        return filename

    def __del__(self):
        try:
            if self.audio:
                self.audio.terminate()
        except Exception:
            pass
