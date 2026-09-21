import asyncio
import sys
from pathlib import Path
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).parent.parent))
from app.main import app


async def test_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Health check
        h_resp = await client.get("/api/v1/health")
        print(f"[OK] Health check status: {h_resp.status_code}")
        h_data = h_resp.json()
        print(f"     Service: {h_data['service']}")
        print(f"     FFmpeg: {h_data['ffmpeg_status']}")
        assert h_resp.status_code == 200

        # Profiles list
        p_resp = await client.get("/api/v1/profiles")
        print(f"[OK] Profiles status: {p_resp.status_code}")
        p_data = p_resp.json()
        print(f"     Profiles loaded: {len(p_data)}")
        assert p_resp.status_code == 200
        assert len(p_data) >= 2

        # Concept list
        c_resp = await client.get("/api/v1/dashboard/concepts")
        print(f"[OK] Dashboard concepts status: {c_resp.status_code}")
        assert c_resp.status_code == 200

        print("\nAll ASGI endpoints responded successfully!")


if __name__ == "__main__":
    asyncio.run(test_endpoints())
