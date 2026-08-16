import os
import json
import random
import base64
import urllib.request
import urllib.error
from typing import Dict, Any, List

PROMPT_BANK = {
    'COLOR': [
        "Find something RED",
        "Find something BLUE",
        "Find something GREEN",
        "Find something YELLOW",
        "Find something ORANGE",
        "Find something PURPLE",
        "Find something BRIGHT PINK",
    ],
    'TEXT': [
        "Find something with visible TEXT on it",
        "Find something with a brand name printed on it",
        "Find a book, magazine, or document with printed words",
        "Find packaging with ingredient or nutrition text",
    ],
    'NUMBER': [
        "Find something with a visible NUMBER on it",
        "Find an item showing a digital or analog clock time",
        "Find a price tag, barcode number, or serial number",
        "Find a coin or currency note showing a number",
    ],
    'SHAPE': [
        "Find something CIRCULAR or round",
        "Find something RECTANGULAR or box-shaped",
        "Find something TRIANGULAR",
        "Find something CYLINDRICAL (like a bottle or can)",
    ],
    'PATTERN': [
        "Find something STRIPED",
        "Find something DOTTED or with polka dots",
        "Find something CHECKERED or grid-patterned",
        "Find something with repeated GEOMETRIC PATTERNS",
    ],
    'TRANSPARENCY': [
        "Find something TRANSPARENT (glass or clear plastic)",
        "Find a clear drinking glass or clear water bottle",
        "Find a transparent window or clear container",
    ],
}

# OpenRouter model to use — fast, multimodal, excellent for VQA
OPENROUTER_MODEL = "google/gemini-2.5-flash"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def generate_rounds_for_game(count: int, enabled_types: List[str]) -> List[Dict[str, str]]:
    """
    Selects challenge types without back-to-back repeats when possible.
    """
    valid_types = [t for t in enabled_types if t in PROMPT_BANK]
    if not valid_types:
        valid_types = ['COLOR', 'TEXT']

    rounds_data = []
    last_type = None

    for i in range(count):
        candidates = [t for t in valid_types if t != last_type] if len(valid_types) > 1 else valid_types
        chosen_type = random.choice(candidates)
        last_type = chosen_type

        prompts_for_type = PROMPT_BANK[chosen_type]
        chosen_prompt = random.choice(prompts_for_type)

        rounds_data.append({
            'round_number': i + 1,
            'challenge_type': chosen_type,
            'prompt': chosen_prompt,
        })

    return rounds_data


def evaluate_scavenger_submission(image_bytes: bytes, prompt: str) -> Dict[str, Any]:
    """
    Evaluates image against challenge prompt using OpenRouter vision API.
    Response contract: {"valid": bool, "confidence": float}
    """
    api_key = os.environ.get("OPENROUTER_API_KEY")

    if not api_key:
        # Dev fallback — no key set, accept all submissions
        print("[judge] WARNING: OPENROUTER_API_KEY not set. Returning fallback VALID.")
        return {"valid": True, "confidence": 0.95}

    system_prompt = (
        f'You are judging a single photo submitted in a real-time scavenger game.\n'
        f'The player was given this challenge: "{prompt}"\n\n'
        'Rules for your judgment:\n'
        '- Judge only what is visibly present in the image.\n'
        '- For color challenges: any clearly visible object or region containing the requested color counts, including common shades and tints.\n'
        '- For text/number challenges: any legible visible text or numeral counts, in any language, any size, printed or handwritten.\n'
        '- For shape challenges: judge the dominant visible outline of an object loosely — approximate matches count.\n'
        '- For pattern challenges: the pattern must be clearly visible and unambiguous.\n'
        '- For transparency challenges: the transparent material or region must be clearly visible in the frame.\n'
        '- A qualifying object anywhere in frame is sufficient — it does not need to be the main subject.\n'
        '- If unsure, lean toward VALID — this is a casual party game, not a strict test.\n\n'
        'Respond with ONLY a JSON object in this exact format, no other text:\n'
        '{"valid": true or false, "confidence": a number between 0 and 1}'
    )

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    payload = json.dumps({
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": system_prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_b64}"
                        }
                    }
                ]
            }
        ],
        "temperature": 0.1,
        "max_tokens": 64,
        "response_format": {"type": "json_object"}
    }).encode("utf-8")

    req = urllib.request.Request(
        OPENROUTER_API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/Blehh13/NPCmode",
            "X-Title": "NPCmode Scavenger AI",
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))

        raw_text = body["choices"][0]["message"]["content"].strip()

        # Strip markdown fences if model wraps response
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]

        parsed = json.loads(raw_text.strip())
        return {
            "valid": bool(parsed.get("valid", False)),
            "confidence": float(parsed.get("confidence", 0.0))
        }

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else ""
        print(f"[judge] OpenRouter HTTP error {e.code}: {error_body}")
        return {"valid": True, "confidence": 0.85}

    except Exception as e:
        print(f"[judge] Vision AI evaluation exception: {e}")
        return {"valid": True, "confidence": 0.85}
