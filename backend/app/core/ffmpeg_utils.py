import os
import shutil
import subprocess
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

_FFMPEG_PATH: Optional[str] = None


def get_ffmpeg_executable() -> str:
    global _FFMPEG_PATH
    if _FFMPEG_PATH and os.path.exists(_FFMPEG_PATH):
        return _FFMPEG_PATH

    # 1. Check imageio_ffmpeg
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.exists(exe):
            bin_dir = os.path.dirname(exe)
            # yt-dlp expects an exact 'ffmpeg.exe' file in the directory
            alias_path = os.path.join(bin_dir, "ffmpeg.exe")
            if not os.path.exists(alias_path):
                try:
                    shutil.copy2(exe, alias_path)
                except Exception as alias_err:
                    logger.debug(f"Could not create ffmpeg.exe alias: {alias_err}")
            
            # Ensure bin_dir is in system PATH for all child processes and yt-dlp
            if bin_dir not in os.environ.get("PATH", ""):
                os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")

            _FFMPEG_PATH = alias_path if os.path.exists(alias_path) else exe
            logger.info(f"Using imageio_ffmpeg binary: {_FFMPEG_PATH}")
            return _FFMPEG_PATH
    except Exception as e:
        logger.debug(f"imageio_ffmpeg lookup failed: {e}")

    # 2. Check system PATH
    sys_exe = shutil.which("ffmpeg")
    if sys_exe:
        _FFMPEG_PATH = sys_exe
        logger.info(f"Using system ffmpeg: {sys_exe}")
        return _FFMPEG_PATH

    # 3. Check common Windows paths
    common_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
    ]
    for path in common_paths:
        if os.path.exists(path):
            _FFMPEG_PATH = path
            return _FFMPEG_PATH

    raise RuntimeError(
        "FFmpeg executable could not be found. Please install imageio-ffmpeg (`pip install imageio-ffmpeg`) "
        "or ensure ffmpeg is available in your system PATH."
    )


def run_ffmpeg(args: List[str], timeout: int = 120) -> subprocess.CompletedProcess:
    """Run FFmpeg with resolved executable and standard argument handling."""
    ffmpeg_exe = get_ffmpeg_executable()
    cmd = [ffmpeg_exe] + args
    logger.debug(f"Running ffmpeg command: {' '.join(cmd)}")
    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=timeout,
        check=False
    )
    if result.returncode != 0:
        logger.error(f"FFmpeg failed (code {result.returncode}): {result.stderr}")
        raise RuntimeError(f"FFmpeg error: {result.stderr}")
    return result
