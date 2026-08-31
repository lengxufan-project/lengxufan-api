"""关系动态引擎 - 从当前角色上下文读取数据"""
from infra.logger import debug
from lengxufan_core.character_context import get_character_data


class RelationshipDynamics:
    def __init__(self, character_name="冷旭帆", target_name="用户"):
        self.character_name = character_name
        self.target_name = target_name
        self.trust_value = 0
        self.current_stage = "陌生人"
        self.event_log = []
        self.first_meet = True

    def process_event(self, event_type, trust_delta=0, description=""):
        relationship_stages = get_character_data("relationship_stages") or []

        stage_before = self.current_stage
        trust_before = self.trust_value

        self.trust_value = max(0, min(100, self.trust_value + trust_delta))

        new_stage = self._get_relationship_stage(self.trust_value, relationship_stages)
        stage_changed = (new_stage != stage_before)

        if stage_changed:
            self.current_stage = new_stage
            debug(f"[RelationshipDynamics] 关系升级: {stage_before} → {self.current_stage}")

        event = {"type": event_type, "trust_delta": trust_delta, "description": description, "stage_before": stage_before, "stage_after": self.current_stage}
        self.event_log.append(event)
        if len(self.event_log) > 100:
            self.event_log = self.event_log[-100:]

        if self.first_meet and trust_delta > 0:
            self.first_meet = False

        return {"stage_before": stage_before, "stage_after": self.current_stage, "stage_changed": stage_changed, "trust_before": trust_before, "trust_after": self.trust_value, "trust_delta": trust_delta, "milestone_reached": stage_changed, "description": description}

    def _get_relationship_stage(self, trust_value, relationship_stages):
        for stage in relationship_stages:
            low, high = stage["trust_range"]
            if low <= trust_value <= high:
                return stage["stage"]
        return relationship_stages[0]["stage"] if relationship_stages else "陌生人"

    def get_prompt_injection(self):
        relationship_stages = get_character_data("relationship_stages") or []
        stage = None
        for s in relationship_stages:
            low, high = s["trust_range"]
            if low <= self.trust_value <= high:
                stage = s
                break
        if stage: return stage.get("prompt_injection", "")
        return ""

    def get_stage_summary(self):
        relationship_stages = get_character_data("relationship_stages") or []
        stage = None
        for s in relationship_stages:
            low, high = s["trust_range"]
            if low <= self.trust_value <= high:
                stage = s
                break
        if stage: return f"关系: {stage['stage']}（信任{self.trust_value}/100）——{stage.get('behavior', '')}"
        return f"关系: 陌生人（信任{self.trust_value}/100）"

    def get_event_history(self, limit=10):
        return self.event_log[-limit:]

    def to_dict(self):
        return {"trust_value": self.trust_value, "current_stage": self.current_stage, "first_meet": self.first_meet, "event_log": self.event_log[-20:]}

    @classmethod
    def from_dict(cls, d, character_name="冷旭帆", target_name="用户"):
        engine = cls(character_name, target_name)
        if d:
            engine.trust_value = d.get("trust_value", 0)
            engine.current_stage = d.get("current_stage", "陌生人")
            engine.first_meet = d.get("first_meet", True)
            engine.event_log = d.get("event_log", [])
        return engine
