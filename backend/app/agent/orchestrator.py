from __future__ import annotations
import json
import re
import random
from typing import Any, Dict, List

from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tool_parse import try_parse_tool_call
from app.core.config import settings
from app.core.prompt_loader import get_greeting_replies
from app.llm.ollama_client import OllamaClient
from app.tools.router import execute_tool
from app.tools.registry import TOOLS

# Greetings that get an instant reply (no LLM call). Keeps "Hello Aika!" etc. under ~0s.
_GREETING_NORMALIZED = {
    "hello", "hi", "hey", "yo", "sup", "hello!", "hi!", "hey!",
    "hello aika", "hi aika", "hey aika", "hello aika!", "hi aika!", "hey aika!",
    "good morning", "good afternoon", "good evening", "greetings",
}


def _is_greeting(message: str) -> bool:
    normalized = message.strip().lower()
    normalized = re.sub(r"[.!?]+$", "", normalized).strip()
    if normalized in _GREETING_NORMALIZED:
        return True
    # "Hello Aika" / "Hi there" etc. – short and starts with a greeting word
    if len(normalized) <= 25 and normalized:
        first = normalized.split()[0] if normalized.split() else ""
        if first in ("hello", "hi", "hey", "yo", "sup"):
            return True
    return False


def _format_tool_reply(tool_name: str, tool_result: Dict[str, Any]) -> str:
    """Format a tool result as a short user-facing reply (no second LLM call)."""
    if tool_name == "web_search":
        if not tool_result.get("ok") or not tool_result.get("results"):
            return tool_result.get("error") or "Search returned no results."
        parts = []
        for i, r in enumerate(tool_result["results"][:5], 1):
            title = r.get("title") or "Result"
            snippet = (r.get("snippet") or "").strip()
            if snippet:
                parts.append(f"{i}. **{title}**\n{snippet}")
        return "\n\n".join(parts) if parts else "No snippets to show."
    if tool_name == "file_ops":
        if not tool_result.get("ok"):
            return tool_result.get("error") or "Something went wrong."
        if "content" in tool_result:
            content = tool_result["content"]
            return content[:3000] + ("..." if len(content) > 3000 else "")
        if "items" in tool_result:
            return f"Listed {len(tool_result['items'])} items."
        return tool_result.get("message") or "Done."
    if tool_name == "open_app":
        if tool_result.get("ok"):
            return tool_result.get("message") or "Opened."
        return tool_result.get("error") or "Could not open app."
    # Generic
    return json.dumps(tool_result)[:1500]


def _post_process_reply(reply: str, user_message: str) -> str:
    """
    Lightly adjust replies to feel a bit more natural:
    - For longer answers, sometimes add a soft opener.
    - Optionally add a short check-in at the end.
    Keeps changes subtle to match Aika's calm style.
    """
    text = (reply or "").strip()
    if not text:
        return reply

    # Very short answers should stay as-is.
    if len(text) < 80:
        return text

    # Soft openers and follow-up lines, in character.
    openers = [
        "I see. ",
        "Alright. ",
        "Let me walk through that. ",
        "Okay. ",
    ]
    followups = [
        "If anything feels unclear, tell me where to slow down.",
        "If you want, I can go deeper on one part.",
        "If you get stuck on a step, just say which one.",
        "Did that help, or should I clarify something?",
    ]

    # Add an opener if it doesn't already start in a similar tone.
    opener = random.choice(openers)
    opener_stripped = opener.strip()
    if not any(text.startswith(o.strip()) for o in openers):
        text = f"{opener}{text}"

    # Only add a follow-up on longer, more "guide-like" answers.
    if len(text) >= 280:
        followup = random.choice(followups)
        if not text.endswith((".", "?", "!", "…")):
            text += "."
        text = f"{text}\n\n{followup}"

    return text


class Agent:
    def __init__(self, ollama: OllamaClient, model: str):
        self.ollama = ollama
        self.model = model
        # Simple in-memory conversation history (list of {"role", "content"} dicts).
        # This is per-process; if you add user IDs later, you can move this to a per-user store.
        self._history: List[Dict[str, str]] = []
        self._max_history_turns: int = 10  # user+assistant pairs to keep

    def _append_turn(self, user_message: str, assistant_reply: str) -> None:
        """Store a user/assistant exchange in short-term memory."""
        self._history.append({"role": "user", "content": user_message})
        self._history.append({"role": "assistant", "content": assistant_reply})
        # Trim to the most recent N turns (user+assistant pairs).
        max_messages = self._max_history_turns * 2
        if len(self._history) > max_messages:
            self._history = self._history[-max_messages:]

    async def handle_chat(self, user_message: str) -> Dict[str, Any]:
        # Instant reply for greetings (no LLM call – avoids ~10s delay), in character (from prompts.json)
        if _is_greeting(user_message):
            replies = get_greeting_replies()
            if not replies:
                replies = ["Hello. I'm here when you need me."]
            idx = hash(user_message.strip().lower()) % len(replies)
            reply = replies[idx]
            self._append_turn(user_message, reply)
            return {
                "reply": reply,
                "tool_used": None,
                "tool_result": None,
            }

        # Provide tool list in context (so model knows what exists),
        # deriving it from the registry to avoid duplication.
        tool_list = [
            {"name": spec.name, "description": spec.description}
            for spec in TOOLS.values()
        ]

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"Allowed tools: {json.dumps(tool_list)}"},
        ]

        # Include recent conversation history so replies can stay in context.
        if self._history:
            messages.extend(self._history[-(self._max_history_turns * 2):])

        # Current user message goes last.
        messages.append({"role": "user", "content": user_message})

        num_predict = getattr(settings, "OLLAMA_NUM_PREDICT", -1)
        try:
            assistant = await self.ollama.chat(
                model=self.model,
                messages=messages,
                num_predict=num_predict if num_predict > 0 else -1,
            )
        except Exception as e:
            # Fallback: on model failure, try web search and return that if successful
            fallback_result = execute_tool("web_search", {"query": user_message, "max_results": 5})
            if fallback_result.get("ok") and fallback_result.get("results"):
                parts = ["I couldn't reach my usual model, so I searched the web for you:\n\n"]
                for i, r in enumerate(fallback_result["results"][:5], 1):
                    title = r.get("title") or "Result"
                    snippet = (r.get("snippet") or "").strip()
                    url = r.get("url") or ""
                    if snippet:
                        parts.append(f"{i}. **{title}**\n{snippet}\n")
                    if url:
                        parts.append(f"   {url}\n")
                reply = "".join(parts).strip()
                self._append_turn(user_message, reply)
                return {
                    "reply": reply,
                    "tool_used": {"tool": "web_search", "args": {"query": user_message, "max_results": 5}},
                    "tool_result": fallback_result,
                }
            # No web results: return original error, optionally mention fallback failed
            reply = f"Sorry, I couldn't reach the AI model. Details: {str(e)}"
            if not fallback_result.get("ok"):
                reply += " I also tried searching the web but that didn't work."
            self._append_turn(user_message, reply)
            return {"reply": reply, "tool_used": None, "tool_result": None}

        tool_call = try_parse_tool_call(assistant)
        if not tool_call:
            final_reply = _post_process_reply(assistant, user_message)
            self._append_turn(user_message, final_reply)
            return {
                "reply": final_reply,
                "tool_used": None,
                "tool_result": None,
            }

        tool_name, args = tool_call
        tool_result = execute_tool(tool_name, args)

        # Fast path: skip second LLM call and format result in-code (configurable)
        if getattr(settings, "FAST_REPLY", True):
            formatted = _format_tool_reply(tool_name, tool_result)
            final_reply = _post_process_reply(formatted, user_message)
            self._append_turn(user_message, final_reply)
            return {
                "reply": final_reply,
                "tool_used": {"tool": tool_name, "args": args},
                "tool_result": tool_result,
            }

        # Full path: ask model to summarize tool result
        followup_messages = messages + [
            {"role": "assistant", "content": assistant},
            {"role": "system", "content": f"Tool result: {json.dumps(tool_result)}"},
            {"role": "user", "content": "Summarize this result for the user in a few sentences. Give a complete answer; do not stop mid-sentence or end with '...'. The tool has already finished."},
        ]
        try:
            model_reply = await self.ollama.chat(
                model=self.model,
                messages=followup_messages,
                num_predict=num_predict if num_predict > 0 else -1,
            )
            final_reply = _post_process_reply(model_reply, user_message)
        except Exception:
            formatted = _format_tool_reply(tool_name, tool_result)
            final_reply = _post_process_reply(formatted, user_message)

        self._append_turn(user_message, final_reply)

        return {
            "reply": final_reply,
            "tool_used": {"tool": tool_name, "args": args},
            "tool_result": tool_result,
        }