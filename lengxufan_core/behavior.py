"""行为模块"""
import random, time
from dataclasses import dataclass, field
from infra.logger import debug
from .character_data import FALLBACK_ACTIONS, STATUS_OVERLAY_ACTIONS, INTENT_TEMPLATES

@dataclass
class BehaviorEngine:
    pending_intents: list = field(default_factory=list)
    _in_conversation: bool = False
    _last_intent_check: float = field(default_factory=time.time)

    def generate_action(self, emotion, status, identity_state, ai_action=None):
        if ai_action: return f"（{ai_action}）"
        if emotion < 30: base = random.choice(FALLBACK_ACTIONS["very_low"])
        elif emotion < 50: base = random.choice(FALLBACK_ACTIONS["low"])
        elif emotion < 70: base = random.choice(FALLBACK_ACTIONS["medium"])
        else: base = random.choice(FALLBACK_ACTIONS["high"])
        ov = []
        if status.get("holding_knife"): ov.extend(STATUS_OVERLAY_ACTIONS["holding_knife"])
        if status.get("miss_wang") and random.random()<0.5: ov.extend(STATUS_OVERLAY_ACTIONS["miss_wang"])
        if status.get("shoulder_pain") and random.random()<0.3: ov.append(random.choice(STATUS_OVERLAY_ACTIONS["shoulder_pain"]))
        if identity_state.get("wang_claim") and identity_state.get("wang_belief",0)>50 and random.random()<0.4:
            ov.append(random.choice(STATUS_OVERLAY_ACTIONS["high_trust"]))
        for o in ov[:2]: base = o + " " + base
        return base

    def start_conversation(self): self._in_conversation = True
    def end_conversation(self): self._in_conversation = False; self._last_intent_check = time.time()

    def check_intents(self, elapsed, current_emotion):
        if self._in_conversation: return []
        if time.time() - self._last_intent_check < 30: return []
        self._last_intent_check = time.time()
        if random.random() > 0.05: return []
        intent = random.choice(INTENT_TEMPLATES).copy()
        intent["mood"] = "低落" if current_emotion<30 else ("稍好" if current_emotion>70 else "平常")
        self.pending_intents.append(intent)
        debug(f"新意愿: {intent['type']}")
        return [intent]

    def get_pending_intents(self):
        r = self.pending_intents.copy(); self.pending_intents.clear(); return r