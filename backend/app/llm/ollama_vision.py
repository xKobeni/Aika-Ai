from __future__ import annotations
import base64
import httpx
from typing import Any, Dict

class OllamaVisionClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    async def chat_with_image(
        self,
        model: str,
        prompt: str,
        image_bytes: bytes,
        temperature: float = 0.2,
    ) -> str:
        """
        Uses Ollama /api/chat with images (base64).
        """
        url = f"{self.base_url}/api/chat"
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        payload: Dict[str, Any] = {
            "model": model,
            "stream": False,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                    "images": [image_b64],
                }
            ],
            "options": {"temperature": temperature},
        }

        async with httpx.AsyncClient(timeout=180) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()

        return data["message"]["content"]