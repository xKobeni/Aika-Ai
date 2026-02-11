from __future__ import annotations
import httpx
from typing import Any, Dict, Optional

class OllamaClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    async def chat(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.4,
        num_predict: int = -1,
    ) -> str:
        """
        Uses Ollama /api/chat.
        num_predict: max tokens to generate (-1 = no limit, so replies are not cut off).
        """
        url = f"{self.base_url}/api/chat"
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": num_predict,
            },
        }

        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()

        # Ollama returns { message: { role: "assistant", content: "..." }, ... }
        return data["message"]["content"]