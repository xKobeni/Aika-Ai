from __future__ import annotations
import json
import httpx
from typing import Any, AsyncIterator, Dict, Optional

class OllamaClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Reuse a single HTTP client to avoid connection overhead on each request."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=120)
        return self._client

    def _options(self, temperature: float, num_predict: int, num_ctx: int) -> Dict[str, Any]:
        opts: Dict[str, Any] = {"temperature": temperature, "num_predict": num_predict}
        if num_ctx > 0:
            opts["num_ctx"] = num_ctx
        return opts

    async def chat(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.4,
        num_predict: int = -1,
        num_ctx: int = 0,
    ) -> str:
        """
        Uses Ollama /api/chat.
        num_predict: max tokens to generate (-1 = no limit).
        num_ctx: context size (0 = Ollama default; smaller = faster).
        """
        url = f"{self.base_url}/api/chat"
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": self._options(temperature, num_predict, num_ctx),
        }

        client = await self._get_client()
        r = await client.post(url, json=payload)
        r.raise_for_status()
        data = r.json()

        # Ollama returns { message: { role: "assistant", content: "..." }, ... }
        return data["message"]["content"]

    async def chat_stream(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.4,
        num_predict: int = -1,
        num_ctx: int = 0,
    ) -> AsyncIterator[str]:
        """
        Uses Ollama /api/chat with stream=True. Yields content chunks as they arrive.
        """
        url = f"{self.base_url}/api/chat"
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": self._options(temperature, num_predict, num_ctx),
        }

        client = await self._get_client()
        async with client.stream("POST", url, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    msg = data.get("message") or {}
                    content = msg.get("content") or ""
                    if content:
                        yield content
                except json.JSONDecodeError:
                    continue
