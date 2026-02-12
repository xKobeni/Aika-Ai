"""
Smart memory: Auto-learn facts, preferences, and context from conversations.
Uses LLM to extract structured information that should be remembered.
"""
from __future__ import annotations
import json
import re
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.llm.ollama_client import OllamaClient
from app.memory.repo import save_learned_fact, get_all_learned_facts


LEARNING_PROMPT = """Analyze the recent conversation and extract any facts, preferences, or context about the user that should be remembered for future conversations.

Examples of what to extract:
- Personal info: name, age, location, occupation, hobbies
- Preferences: favorite colors, foods, music, apps, tools
- Context: current projects, goals, recurring tasks
- Important facts: pet names, family info, work details

Output ONLY a JSON array of facts. Each fact should have:
- "key": short identifier (e.g., "user_name", "favorite_color", "work_location")
- "value": the actual fact/preference
- "confidence": 0.0-1.0 (how certain you are this is correct)

If nothing should be remembered, return an empty array: []

Example output:
[
  {"key": "user_name", "value": "John", "confidence": 0.9},
  {"key": "favorite_color", "value": "blue", "confidence": 0.8}
]

Recent conversation:
{conversation}

Output JSON array only:"""


async def learn_from_conversation(
    user_message: str,
    assistant_reply: str,
    session_id: str,
    ollama_client: OllamaClient,
    model: str,
) -> List[Dict[str, Any]]:
    """
    Analyze a conversation turn and extract learnable facts.
    Returns list of facts that were learned (or empty list).
    """
    # Skip learning if disabled
    if not getattr(settings, "AUTO_LEARN_ENABLED", True):
        return []
    
    # Skip if messages are too short (likely greetings or simple Q&A)
    if len(user_message) < 20 or len(assistant_reply) < 20:
        return []
    
    conversation_text = f"User: {user_message}\nAssistant: {assistant_reply}"
    
    try:
        # Get existing facts to avoid duplicates and provide context
        existing_facts = get_all_learned_facts()
        existing_context = ""
        if existing_facts:
            existing_context = "\n\nAlready known facts:\n" + "\n".join(
                [f"- {k}: {v}" for k, v in list(existing_facts.items())[:10]]
            )
        
        prompt = LEARNING_PROMPT.format(conversation=conversation_text + existing_context)
        
        # Call LLM to extract facts
        response = await ollama_client.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,  # Lower temp for more consistent extraction
            num_predict=512,  # Short response expected
            num_ctx=2048,
        )
        
        # Parse JSON from response
        facts = _parse_facts_from_response(response)
        
        # Save facts that meet confidence threshold
        learned = []
        confidence_threshold = getattr(settings, "AUTO_LEARN_CONFIDENCE_THRESHOLD", 0.7)
        
        for fact in facts:
            key = fact.get("key", "").strip()
            value = fact.get("value", "").strip()
            confidence = float(fact.get("confidence", 0.5))
            
            if not key or not value:
                continue
            
            if confidence >= confidence_threshold:
                save_learned_fact(key, value, session_id, confidence)
                learned.append({"key": key, "value": value, "confidence": confidence})
        
        return learned
        
    except Exception as e:
        # Silently fail learning - don't break chat if learning fails
        print(f"Learning failed: {e}")
        return []


def _parse_facts_from_response(response: str) -> List[Dict[str, Any]]:
    """Extract JSON array from LLM response, handling markdown code blocks."""
    response = response.strip()
    
    # Try to find JSON array in markdown code block
    json_match = re.search(r'```(?:json)?\s*(\[.*?\])', response, re.DOTALL)
    if json_match:
        response = json_match.group(1)
    
    # Try to find JSON array directly
    json_match = re.search(r'(\[.*?\])', response, re.DOTALL)
    if json_match:
        response = json_match.group(1)
    
    try:
        facts = json.loads(response)
        if isinstance(facts, list):
            return facts
        return []
    except json.JSONDecodeError:
        # Try to extract individual facts if array parsing fails
        facts = []
        for match in re.finditer(r'\{"key":\s*"([^"]+)",\s*"value":\s*"([^"]+)",\s*"confidence":\s*([0-9.]+)\}', response):
            facts.append({
                "key": match.group(1),
                "value": match.group(2),
                "confidence": float(match.group(3))
            })
        return facts
