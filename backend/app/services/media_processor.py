import re
import os
import subprocess
import logging
from pathlib import Path
from typing import List, Tuple

from app.core.ffmpeg_utils import get_ffmpeg_executable, run_ffmpeg

logger = logging.getLogger(__name__)


class MediaProcessor:
    def get_duration(self, video_path: str) -> float:
        """Get video duration in seconds by parsing FFmpeg stderr."""
        ffmpeg_exe = get_ffmpeg_executable()
        cmd = [ffmpeg_exe, "-i", video_path]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Match Duration: 00:00:30.50
        match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", proc.stderr)
        if match:
            hours, minutes, seconds = match.groups()
            duration = int(hours) * 3600 + int(minutes) * 60 + float(seconds)
            logger.info(f"Detected video duration: {duration:.2f}s")
            return duration
        
        logger.warning("Could not parse video duration from ffmpeg output, defaulting to 15.0s.")
        return 15.0

    def extract_audio(self, video_path: str, output_path: str) -> str:
        """
        Extract audio to .mp3 using FFmpeg with -q:a 4 to stay well under size limits.
        """
        logger.info(f"Extracting audio from {video_path} to {output_path}...")
        args = [
            "-y",
            "-i", video_path,
            "-vn",
            "-acodec", "libmp3lame",
            "-q:a", "4",
            output_path
        ]
        try:
            run_ffmpeg(args)
        except Exception as e:
            # If libmp3lame not available or silent/audio-less video, produce silent fallback MP3
            logger.warning(f"Audio extraction hit issue ({e}). Generating minimal audio track.")
            silent_args = [
                "-y",
                "-f", "lavfi",
                "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                "-t", "3",
                "-acodec", "libmp3lame",
                "-q:a", "4",
                output_path
            ]
            run_ffmpeg(silent_args)
        return output_path

    def extract_frames(self, video_path: str, output_dir: str, num_frames: int = 6) -> List[str]:
        """
        Extract 5-7 representative frames evenly distributed across the duration using FFmpeg:
        ffmpeg -ss {timestamp} -i video.mp4 -vframes 1 -q:v 2 -update 1 frame_{i}.jpg
        """
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)

        duration = self.get_duration(video_path)
        if duration <= 1.0:
            timestamps = [0.2, 0.5, 0.8]
        else:
            # 5-7 evenly distributed points inside (0.05*duration, 0.95*duration)
            timestamps = [
                round(duration * (0.05 + 0.90 * (i / max(1, num_frames - 1))), 2)
                for i in range(num_frames)
            ]

        frame_paths = []
        for i, ts in enumerate(timestamps):
            frame_file = out_path / f"frame_{i}.jpg"
            args = [
                "-y",
                "-ss", str(ts),
                "-i", video_path,
                "-vframes", "1",
                "-q:v", "2",
                "-update", "1",
                str(frame_file)
            ]
            try:
                run_ffmpeg(args)
                if frame_file.exists():
                    frame_paths.append(str(frame_file))
            except Exception as e:
                logger.warning(f"Failed to extract frame at {ts}s: {e}")

        logger.info(f"Extracted {len(frame_paths)} frames into {output_dir}")
        return frame_paths


media_processor = MediaProcessor()
