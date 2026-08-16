import os
import json
import urllib.request
import urllib.error
from .schemas import AIFailureException

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

def call_vision_model(system_prompt: str, image_b64: str) -> str:
    """
    Sends a synchronous POST request to OpenRouter vision API.
    Raises AIFailureException on missing keys, timeouts, or 5xx/4xx errors.
    Returns the raw string output from the model.
    """
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise AIFailureException("OPENROUTER_API_KEY environment variable is not set. Cannot authenticate with OpenRouter.")
    
    vision_model = os.environ.get("OPENROUTER_VISION_MODEL")
    if not vision_model:
        raise AIFailureException("OPENROUTER_VISION_MODEL environment variable is not set. Vision model is required.")

    timeout_seconds = int(os.environ.get("AI_TIMEOUT_SECONDS", 6))

    payload = json.dumps({
        "model": vision_model,
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
        "max_tokens": 128,
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
        with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
            body = json.loads(resp.read().decode("utf-8"))

        raw_text = body["choices"][0]["message"]["content"].strip()

        # Strip markdown fences if model wraps response
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]

        return raw_text.strip()

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else ""
        raise AIFailureException(f"OpenRouter HTTP error {e.code}: {error_body}")
    except Exception as e:
        raise AIFailureException(f"Vision AI evaluation exception: {e}")
