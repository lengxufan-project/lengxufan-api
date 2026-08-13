"""行为模块 - 从当前角色上下文读取数据"""
import random, time
from dataclasses import dataclass, field
from infra.logger import debug
from .character_context import get_character_data

@dataclass
class BehaviorEngine:
    pending_intents: list = field(default_factory=list)
    _in_conversation: bool = False
    _last_intent_check: float = field(default_factory=time.time)

    def generate_action(self, emotion, status, identity_state, ai_action=None):
        fallback_actions = get_character_data("fallback_actions") or {}
        status_overlay = get_character_data("status_overlay_actions") or {}

        if ai_action: return f"（{ai_action}）"
        if emotion < 30: base = random.choice(fallback_actions.get("very_low", ["（一动不动）"]))
        elif emotion < 50: base = random.choice(fallback_actions.get("low", ["（没动）"]))
        elif emotion < 70: base = random.choice(fallback_actions.get("medium", ["（看了你一眼）"]))
        else: base = random.choice(fallback_actions.get("high", ["（放松了一点）"]))

        ov = []
        if status.get("holding_knife") and "holding_knife" in status_overlay:
            ov.extend(status_overlay["holding_knife"])
        if status.get("miss_wang") and "miss_wang" in status_overlay and random.random() < 0.5:
            ov.extend(status_overlay["miss_wang"])
        if status.get("shoulder_pain") and "shoulder_pain" in status_overlay and random.random() < 0.3:
            ov.append(random.choice(status_overlay["shoulder_pain"]))
        if identity_state.get("wang_claim") and identity_state.get("wang_belief", 0) > 50 and "high_trust" in status_overlay and random.random() < 0.4:
            ov.append(random.choice(status_overlay["high_trust"]))
        for o in ov[:2]: base = o + " " + base
        return base

    def start_conversation(self): self._in_conversation = True
    def end_conversation(self): self._in_conversation = False; self._last_intent_check = time.time()

    def check_intents(self, elapsed, current_emotion):
        intent_templates = get_character_data("intent_templates") or []
        if self._in_conversation: return []
        if time.time() - self._last_intent_check < 30: return []
        self._last_intent_check = time.time()
        if random.random() > 0.05: return []
        if not intent_templates: return []
        intent = random.choice(intent_templates).copy()
        intent["mood"] = "低落" if current_emotion < 30 else ("稍好" if current_emotion > 70 else "平常")
        self.pending_intents.append(intent)
        debug(f"新意愿: {intent['type']}")
        return [intent]

    def get_pending_intents(self):
        r = self.pending_intents.copy(); self.pending_intents.clear(); return r
