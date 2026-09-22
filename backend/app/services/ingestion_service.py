import os
import uuid
import logging
from pathlib import Path
from typing import Tuple, Optional
import httpx
from bs4 import BeautifulSoup
import yt_dlp

from app.core.config import settings
from app.core.ffmpeg_utils import run_ffmpeg, get_ffmpeg_executable

logger = logging.getLogger(__name__)


class IngestionService:
    def __init__(self):
        self.storage_dir = Path(settings.STORAGE_DIR) / "processed"
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    async def ingest_url(self, url: str, session_id: Optional[str] = None) -> Tuple[str, Optional[str]]:
        """
        Multi-layer ingestion waterfall:
        - Layer 0: LinkedIn Photo/Text Post Fallback (Twitterbot/1.0 -> 5s silent MP4 + transcript_override.txt)
        - Layer 1: Instagram RapidAPI (if configured)
        - Layer 2: Cobalt API (co.wuk.sh)
        - Layer 3: yt-dlp (bestvideo+bestaudio mp4)
        Returns: (video_file_path, optional_transcript_override_path)
        """
        if not session_id:
            session_id = str(uuid.uuid4())

        work_dir = self.storage_dir / session_id
        work_dir.mkdir(parents=True, exist_ok=True)

        # Layer 0: LinkedIn Photo/Text Post Fallback
        if "linkedin.com" in url.lower():
            logger.info("Detected LinkedIn URL. Attempting Layer 0 Twitterbot OpenGraph bypass...")
            try:
                result = await self._linkedin_layer_zero(url, work_dir)
                if result:
                    logger.info("Layer 0 LinkedIn Photo/Text bypass succeeded!")
                    return result
            except Exception as e:
                logger.warning(f"Layer 0 LinkedIn bypass failed or post is a native video: {e}. Falling through to video waterfall.")

        # Layer 1: Instagram RapidAPI (if key provided)
        if "instagram.com" in url.lower() and settings.RAPIDAPI_KEY:
            logger.info("Attempting Layer 1 Instagram RapidAPI...")
            try:
                video_path = await self._instagram_rapidapi(url, work_dir)
                if video_path and os.path.exists(video_path):
                    return video_path, None
            except Exception as e:
                logger.warning(f"Layer 1 RapidAPI failed: {e}. Falling through.")

        # Layer 2: Cobalt API
        if settings.COBALT_API_URL:
            logger.info("Attempting Layer 2 Cobalt API...")
            try:
                video_path = await self._cobalt_download(url, work_dir)
                if video_path and os.path.exists(video_path):
                    return video_path, None
            except Exception as e:
                logger.warning(f"Layer 2 Cobalt API failed: {e}. Falling through to yt-dlp.")

        # Layer 3: yt-dlp
        logger.info("Executing Layer 3 yt-dlp...")
        video_path = await self._ytdlp_download(url, work_dir)
        return video_path, None

    async def _linkedin_layer_zero(self, url: str, work_dir: Path) -> Optional[Tuple[str, Optional[str]]]:
        """
        LinkedIn Layer 0:
        1. Fetch page using User-Agent: Twitterbot/1.0
        2. Extract og:image and og:description
        3. Convert image into a 5-second silent MP4 using FFmpeg:
           ffmpeg -loop 1 -i photo.jpg -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100
                  -c:v libx264 -t 5 -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2"
                  -c:a aac -shortest video.mp4
        4. Save og:description as transcript_override.txt
        """
        headers = {
            "User-Agent": "Twitterbot/1.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                logger.warning(f"LinkedIn Twitterbot fetch status: {resp.status_code}")
                return None
            html = resp.text

        soup = BeautifulSoup(html, "html.parser")
        og_image_tag = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
        og_desc_tag = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "og:description"}) or soup.find("meta", attrs={"name": "description"})

        og_image = og_image_tag["content"] if og_image_tag and og_image_tag.get("content") else None
        og_desc = og_desc_tag["content"] if og_desc_tag and og_desc_tag.get("content") else None

        if not og_image:
            logger.info("No og:image tag found in LinkedIn page, not a photo post.")
            return None

        # Download photo
        photo_path = work_dir / "photo.jpg"
        async with httpx.AsyncClient(timeout=30.0) as client:
            img_resp = await client.get(og_image)
            if img_resp.status_code == 200:
                photo_path.write_bytes(img_resp.content)
            else:
                return None

        # Generate 5-second silent MP4 using exact specified FFmpeg command
        video_path = work_dir / "video.mp4"
        ffmpeg_args = [
            "-y",
            "-loop", "1",
            "-i", str(photo_path),
            "-f", "lavfi",
            "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-c:v", "libx264",
            "-t", "5",
            "-pix_fmt", "yuv420p",
            "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
            "-c:a", "aac",
            "-shortest",
            str(video_path)
        ]
        run_ffmpeg(ffmpeg_args)

        # Save og:description as transcript_override.txt
        transcript_override_path = work_dir / "transcript_override.txt"
        override_text = og_desc.strip() if og_desc else "LinkedIn visual post with embedded content."
        transcript_override_path.write_text(override_text, encoding="utf-8")

        return str(video_path), str(transcript_override_path)

    async def _instagram_rapidapi(self, url: str, work_dir: Path) -> Optional[str]:
        """Layer 1: Instagram RapidAPI."""
        headers = {
            "x-rapidapi-key": settings.RAPIDAPI_KEY,
            "x-rapidapi-host": "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com"
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                "https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/",
                params={"url": url},
                headers=headers
            )
            if resp.status_code == 200:
                data = resp.json()
                media_url = data.get("download_url") or data.get("media") or data.get("url")
                if media_url:
                    video_path = work_dir / "video.mp4"
                    async with client.stream("GET", media_url) as stream_resp:
                        with open(video_path, "wb") as f:
                            async for chunk in stream_resp.aiter_bytes():
                                f.write(chunk)
                    return str(video_path)
        return None

    async def _cobalt_download(self, url: str, work_dir: Path) -> Optional[str]:
        """Layer 2: Cobalt API."""
        endpoint = f"{settings.COBALT_API_URL.rstrip('/')}/api/json"
        payload = {
            "url": url,
            "vQuality": "720",
            "filenamePattern": "classic"
        }
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                download_url = data.get("url")
                if download_url:
                    video_path = work_dir / "video.mp4"
                    async with client.stream("GET", download_url) as stream_resp:
                        with open(video_path, "wb") as f:
                            async for chunk in stream_resp.aiter_bytes():
                                f.write(chunk)
                    return str(video_path)
        return None

    async def _ytdlp_download(self, url: str, work_dir: Path) -> str:
        """
        Layer 3: yt-dlp with specified options:
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        merge_output_format: 'mp4'
        """
        output_template = str(work_dir / "video.%(ext)s")
        ffmpeg_exe = get_ffmpeg_executable()
        bin_dir = os.path.dirname(ffmpeg_exe)

        ydl_opts = {
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "merge_output_format": "mp4",
            "outtmpl": output_template,
            "ffmpeg_location": bin_dir,
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
        }

        def _run():
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
            except Exception as primary_err:
                logger.warning(f"yt-dlp primary merge failed ({primary_err}), retrying with direct single stream format...")
                fallback_opts = dict(ydl_opts)
                fallback_opts["format"] = "best[ext=mp4]/best"
                fallback_opts.pop("merge_output_format", None)
                with yt_dlp.YoutubeDL(fallback_opts) as ydl:
                    ydl.download([url])

        # Run yt-dlp synchronously in threadpool
        import asyncio
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _run)

        # Locate final downloaded video file
        for f in work_dir.glob("video*"):
            if f.suffix.lower() in [".mp4", ".mkv", ".webm"]:
                # If not mp4, convert to mp4
                if f.suffix.lower() != ".mp4":
                    mp4_dest = work_dir / "video.mp4"
                    run_ffmpeg(["-y", "-i", str(f), "-c", "copy", str(mp4_dest)])
                    return str(mp4_dest)
                return str(f)

        raise RuntimeError(f"yt-dlp completed but could not find downloaded video file in {work_dir}")


ingestion_service = IngestionService()
