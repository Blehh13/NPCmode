import random
from typing import List, Dict

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
