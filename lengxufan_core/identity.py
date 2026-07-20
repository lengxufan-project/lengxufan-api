"""身份模块"""
from dataclasses import dataclass
from .character_data import IDENTITY_EVIDENCE_RULES

@dataclass
class IdentityState:
    wang_claim: bool = False
    wang_belief: int = 0
    known_name: str = None
    trust_level: int = 30

    def handle_self_introduction(self, name, _):
        if name in ["陆华望","华望"]:
            self.wang_claim = True
            if self.wang_belief == 0: self.wang_belief = 10
            return "wang_claimed"
        self.known_name = name
        return None

    def apply_evidence(self, keyword):
        if not self.wang_claim: return {"belief_delta":0,"emotion_delta":0}
        for kws, bd, ed in IDENTITY_EVIDENCE_RULES:
            if keyword in kws:
                self.wang_belief = max(0, min(100, self.wang_belief + bd))
                return {"belief_delta":bd,"emotion_delta":ed}
        return {"belief_delta":0,"emotion_delta":0}

    def get_trust_description(self):
        b = self.wang_belief if self.wang_claim else self.trust_level
        if b < 20: return f"警惕而冷淡（{b}/100）"
        if b < 50: return f"有些动摇（{b}/100）"
        if b < 80: return f"越来越觉得他可能就是（{b}/100）"
        return f"几乎确信（{b}/100）"

    def to_dict(self): return {"wang_claim":self.wang_claim,"wang_belief":self.wang_belief,"known_name":self.known_name,"trust_level":self.trust_level}
    @classmethod
    def from_dict(cls, d): return cls(d.get("wang_claim",False),d.get("wang_belief",0),d.get("known_name"),d.get("trust_level",30))