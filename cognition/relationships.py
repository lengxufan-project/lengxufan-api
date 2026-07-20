"""关系推导 (P1预置)"""
from dataclasses import dataclass, field
@dataclass
class Relationship:
    target_name: str
    trust: float = 50.0
    familiarity: float = 50.0
    affection: float = 50.0
    label: str = "陌生人"
@dataclass
class RelationshipGraph:
    relationships: dict = field(default_factory=dict)
    def get_or_create(self, name):
        if name not in self.relationships: self.relationships[name] = Relationship(target_name=name)
        return self.relationships[name]
    def update_trust(self, name, delta):
        r = self.get_or_create(name)
        r.trust = max(0.0, min(100.0, r.trust + delta))
    def generate_intention(self, current_emotion): return None