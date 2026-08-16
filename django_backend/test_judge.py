import os
import django
import sys
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(os.path.join(BASE_DIR, '.env'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'npc_backend.settings')
django.setup()

from game.gemini_judge import evaluate_scavenger_submission

# Create a tiny 1x1 dummy JPEG image to send
dummy_image = b'\xff\xd8\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xd2\xcf \xff\xd9'

print(f"API Key loaded: {os.environ.get('OPENROUTER_API_KEY')}")

try:
    print("Sending request to OpenRouter...")
    result = evaluate_scavenger_submission(dummy_image, "Find something RED")
    print(f"Result: {result}")
except Exception as e:
    print(f"Test script failed: {e}")
