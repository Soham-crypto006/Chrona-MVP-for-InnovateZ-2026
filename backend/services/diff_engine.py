import os
import logging
import math
import json
import re
from typing import Dict, Any
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Initialise clients
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if (OPENAI_API_KEY and not OPENAI_API_KEY.startswith("sk-...")) else None
anthropic_client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY) if (ANTHROPIC_API_KEY and not ANTHROPIC_API_KEY.startswith("sk-ant-...")) else None

if not openai_client:
    logger.info("OpenAI API key missing or placeholder. Diff engine similarity will fall back to Jaccard similarity.")

if not anthropic_client:
    logger.info("Anthropic API key missing or placeholder. Diff engine analysis will fall back to rule-based mock explanations.")

def compute_jaccard_similarity(text1: str, text2: str) -> float:
    """Fallback similarity metric if OpenAI is offline/keys are missing."""
    words1 = set(re.findall(r'\w+', text1.lower()))
    words2 = set(re.findall(r'\w+', text2.lower()))
    if not words1 or not words2:
        return 1.0 if text1 == text2 else 0.0
    return len(words1 & words2) / len(words1 | words2)

async def get_embedding(text: str) -> list:
    """Helper to fetch unit-length embedding from OpenAI."""
    if not openai_client:
        raise ValueError("OpenAI client not configured")
    response = await openai_client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

async def compute_diff(old_content: str, new_content: str) -> Dict[str, Any]:
    """
    Computes cosine similarity between old and new content.
    If similarity < 0.95:
      Calls Claude API to analyze semantic difference, classify risk (critical/high/medium/low),
      and return explanations.
    """
    # 1. Compute similarity
    similarity = 1.0
    if old_content == new_content:
        return {"changed": False, "similarity": 1.0}

    if openai_client:
        try:
            emb_old = await get_embedding(old_content)
            emb_new = await get_embedding(new_content)
            # OpenAI embeddings are normalized to L2 norm = 1.0, so dot product = cosine similarity
            similarity = sum(x * y for x, y in zip(emb_old, emb_new))
        except Exception as e:
            logger.warning(f"Error calling OpenAI embedding in diff engine: {e}. Falling back to Jaccard.")
            similarity = compute_jaccard_similarity(old_content, new_content)
    else:
        similarity = compute_jaccard_similarity(old_content, new_content)

    # 2. Check change threshold
    if similarity >= 0.95:
        return {"changed": False, "similarity": similarity}

    # 3. Analyze semantic difference (Claude API or mock fallback)
    explanation = ""
    risk_level = "medium"

    if anthropic_client:
        prompt = f"""Compare the following old document content and new document content.
Analyze what changed semantically. Focus on compliance, permissions, security, or procedural updates.
Return a valid JSON object ONLY. Do not write markdown blocks around it, do not write introduction text. Just return the raw JSON object.
JSON keys:
- "explanation": string, brief summary explaining what changed and what it means.
- "risk_level": string, must be one of "critical", "high", "medium", or "low".

Old Content:
\"\"\"
{old_content}
\"\"\"

New Content:
\"\"\"
{new_content}
\"\"\"
"""
        try:
            message = await anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                temperature=0.0,
                system="You are Chrona's semantic diff engine. You compare document versions, analyze impact, and return a clean JSON output.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            response_text = message.content[0].text.strip()
            # Clean JSON if any wrapper exists
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if match:
                response_text = match.group(0)
            
            data = json.loads(response_text)
            explanation = data.get("explanation", "Content modified.")
            risk_level = data.get("risk_level", "medium").lower()
            if risk_level not in ["critical", "high", "medium", "low"]:
                risk_level = "medium"
        except Exception as e:
            logger.error(f"Anthropic API call failed: {e}. Falling back to rule-based explanation.")
            explanation, risk_level = generate_mock_explanation(old_content, new_content, similarity)
    else:
        explanation, risk_level = generate_mock_explanation(old_content, new_content, similarity)

    return {
        "changed": True,
        "similarity": round(similarity, 4),
        "explanation": explanation,
        "risk_level": risk_level
    }

def generate_mock_explanation(old_text: str, new_text: str, similarity: float) -> tuple:
    """Generates simple rules-based diff messages for testability without keys."""
    # Check for keyword changes
    risk = "medium"
    keywords = ["admin", "root", "permission", "password", "key", "secret", "rbac", "allow", "deny", "sla"]
    
    changed_words = []
    old_words = set(old_text.lower().split())
    new_words = set(new_text.lower().split())
    added = new_words - old_words
    removed = old_words - new_words

    critical_keywords = [w for w in (added | removed) if any(k in w for k in keywords)]
    
    if critical_keywords:
        risk = "high"
        explanation = f"Detected modifications affecting security/permission keywords: {', '.join(critical_keywords[:3])}."
    else:
        explanation = f"Content text drifted (similarity: {round(similarity, 2)}). Sentence/paragraph content restructured."
        risk = "low" if similarity > 0.8 else "medium"

    return explanation, risk
