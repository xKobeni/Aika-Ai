from __future__ import annotations
from typing import Any, Dict, List

from app.core.config import settings

def web_search(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    args:
      - query: string (required)
      - max_results: int (optional, default from env, cap from env)
    """
    query = (args.get("query") or "").strip()
    if not query:
        return {"ok": False, "error": "Missing 'query'."}

    default_max = settings.WEB_SEARCH_MAX_RESULTS_DEFAULT
    cap = settings.WEB_SEARCH_MAX_RESULTS_CAP
    max_results = args.get("max_results", default_max)
    try:
        max_results = int(max_results)
    except Exception:
        max_results = default_max
    max_results = max(1, min(max_results, cap))

    # Prefer ddgs (successor to duckduckgo-search); fall back to duckduckgo_search
    try:
        from ddgs import DDGS  # type: ignore
    except ImportError:
        try:
            from duckduckgo_search import DDGS  # type: ignore
        except ImportError:
            return {
                "ok": False,
                "error": "web_search requires 'ddgs'. Install with: pip install ddgs"
            }

    try:
        results: List[Dict[str, Any]] = []
        with DDGS() as client:
            for r in client.text(query, max_results=max_results):
                results.append({
                    "title": r.get("title"),
                    "url": r.get("href"),
                    "snippet": r.get("body"),
                })
        return {"ok": True, "query": query, "results": results}
    except Exception as e:
        return {"ok": False, "error": str(e)}