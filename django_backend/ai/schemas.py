from typing import NamedTuple

class ValidationResult(NamedTuple):
    valid: bool
    confidence: float
    reason: str

class AIFailureException(Exception):
    """Raised when OpenRouter cannot be reached or returns an invalid response format."""
    pass
