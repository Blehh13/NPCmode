import io
import json
import base64
from PIL import Image

from .schemas import ValidationResult, AIFailureException
from .prompts import get_validation_instruction
from .openrouter_client import call_vision_model

def preprocess_image(image_bytes: bytes) -> str:
    """
    Resizes image to a max of 1024px on the longest side, maintaining aspect ratio.
    Compresses as JPEG at 75% quality.
    Returns base64 string.
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            # Convert to RGB if necessary (e.g. RGBA or P)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calculate resize dimensions
            max_size = 1024
            width, height = img.size
            if width > max_size or height > max_size:
                if width > height:
                    new_width = max_size
                    new_height = int(height * (max_size / width))
                else:
                    new_height = max_size
                    new_width = int(width * (max_size / height))
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save to bytes buffer
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=75)
            return base64.b64encode(buffer.getvalue()).decode("utf-8")
    except Exception as e:
        raise AIFailureException(f"Failed to preprocess image: {str(e)}")

def validate_submission(image_bytes: bytes, challenge_type: str, prompt: str) -> ValidationResult:
    """
    Orchestrates the entire AI evaluation flow.
    1. Preprocesses image.
    2. Builds the system prompt based on challenge.
    3. Calls OpenRouter.
    4. Parses and validates the response schema.
    Returns ValidationResult or raises AIFailureException.
    """
    # 1. Preprocess image
    image_b64 = preprocess_image(image_bytes)

    # 2. Build system instruction
    system_instruction = get_validation_instruction(challenge_type, prompt)

    # 3. Call model
    raw_response = call_vision_model(system_instruction, image_b64)

    # 4. Parse response safely
    try:
        parsed = json.loads(raw_response)
        
        valid = bool(parsed.get("valid", False))
        confidence = parsed.get("confidence")
        # Ensure confidence is a float between 0 and 1
        try:
            confidence = float(confidence)
            if not (0.0 <= confidence <= 1.0):
                confidence = 0.0
        except (TypeError, ValueError):
            confidence = 0.0
            
        reason = str(parsed.get("reason", ""))
        
        return ValidationResult(valid=valid, confidence=confidence, reason=reason)
    except json.JSONDecodeError as e:
        raise AIFailureException(f"Failed to parse model response as JSON. Output was: {raw_response}. Error: {e}")
