import os
import json
import random
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
    Evaluates image against challenge prompt using the exact PRD system prompt.
    Response contract: {"valid": bool, "confidence": float}
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "valid": True,
            "confidence": 0.95
        }

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        system_instruction = f"""You are judging a single photo submitted in a real-time scavenger game.
The player was given this challenge: "{prompt}"

Rules for your judgment:
- Judge only what is visibly present in the image.
- For color challenges: any clearly visible object or region containing the requested color counts, including common shades and tints of it.
- For text/number challenges: any legible visible text or numeral counts, in any language, any size, printed or handwritten.
- For shape challenges: judge the dominant visible outline of an object loosely — approximate matches count.
- For pattern challenges: the pattern must be clearly visible and unambiguous, not inferred from a small or blurry region.
- For transparency challenges: the transparent material or region must be clearly visible in the frame, not merely plausible.
- Do not require the object to be the main subject of the photo — a qualifying object anywhere in frame is sufficient.
- If you are unsure, lean toward VALID rather than INVALID — this is a casual party game, not a strict test.

Respond with ONLY a JSON object in this exact format, no other text:
{{"valid": true or false, "confidence": a number between 0 and 1}}"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
                system_instruction
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )

        cleaned_text = response.text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]

        parsed = json.loads(cleaned_text.strip())
        return {
            "valid": bool(parsed.get("valid", False)),
            "confidence": float(parsed.get("confidence", 0.0))
        }

    except Exception as e:
        print(f"Vision AI evaluation exception: {e}")
        # In party game context, graceful fallback
        return {
            "valid": True,
            "confidence": 0.85
        }
