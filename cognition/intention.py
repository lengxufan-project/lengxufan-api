"""鎰忓浘瑙ｆ瀽 (P1棰勭疆)"""
from dataclasses import dataclass
@dataclass
class ParsedIntention:
    intent_type: str = "unknown"
    target: str = None
    confidence: float = 0.0
    metadata: dict = None
    def __post_init__(self):
        if self.metadata is None: self.metadata = {}

def parse_user_intention(user_input, memory_context): return ParsedIntention()