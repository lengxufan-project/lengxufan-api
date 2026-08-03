"""关系动态引擎 - 管理角色间的关系阶段变化和轨迹记录"""
from infra.logger import debug
from lengxufan_core.character_data.relationship_stages import (
    RELATIONSHIP_STAGES,
    get_relationship_stage,
    get_next_stage,
)


class RelationshipDynamics:
    """
    管理两个角色之间的关系：
    - 关系阶段（陌生人→核心）
    - 信任值变化轨迹
    - 关系事件日志
    """

    def __init__(self, character_name: str = "冷旭帆", target_name: str = "用户"):
        self.character_name = character_name  # 冷旭帆
        self.target_name = target_name        # 用户
        self.trust_value = 0                  # 信任值 0-100
        self.current_stage = "陌生人"         # 当前关系阶段
        self.event_log = []                   # 关系事件日志
        self.first_meet = True                # 是否初次见面

    def process_event(self, event_type: str, trust_delta: float = 0, description: str = "") -> dict:
        """
        处理一个关系事件，返回阶段变化信息。

        返回:
        {
            "stage_before": "陌生人",
            "stage_after": "朋友",
            "stage_changed": True,
            "trust_before": 10,
            "trust_after": 35,
            "trust_delta": 25,
            "milestone_reached": True,
            "description": "用户送了草莓 → 关系升级为朋友",
        }
        """
        stage_before = self.current_stage
        trust_before = self.trust_value

        # 更新信任值
        self.trust_value = max(0, min(100, self.trust_value + trust_delta))

        # 检查阶段变化
        new_stage = get_relationship_stage(self.trust_value)
        stage_changed = (new_stage["stage"] != stage_before)

        if stage_changed:
            self.current_stage = new_stage["stage"]
            debug(f"[RelationshipDynamics] 关系升级: {stage_before} → {self.current_stage}")

        # 记录事件
        event = {
            "type": event_type,
            "trust_delta": trust_delta,
            "description": description,
            "stage_before": stage_before,
            "stage_after": self.current_stage,
        }
        self.event_log.append(event)
        if len(self.event_log) > 100:
            self.event_log = self.event_log[-100:]

        if self.first_meet and trust_delta > 0:
            self.first_meet = False

        return {
            "stage_before": stage_before,
            "stage_after": self.current_stage,
            "stage_changed": stage_changed,
            "trust_before": trust_before,
            "trust_after": self.trust_value,
            "trust_delta": trust_delta,
            "milestone_reached": stage_changed,
            "description": description,
        }

    def get_prompt_injection(self) -> str:
        """获取当前关系阶段应该注入 System Prompt 的描述"""
        stage = get_relationship_stage(self.trust_value)
        return stage.get("prompt_injection", "")

    def get_stage_summary(self) -> str:
        """获取当前关系状态的摘要"""
        stage = get_relationship_stage(self.trust_value)
        return f"关系: {stage['stage']}（信任{self.trust_value}/100）——{stage['behavior']}"

    def get_event_history(self, limit: int = 10) -> list:
        """获取最近的关系事件"""
        return self.event_log[-limit:]

    def to_dict(self):
        return {
            "trust_value": self.trust_value,
            "current_stage": self.current_stage,
            "first_meet": self.first_meet,
            "event_log": self.event_log[-20:],  # 只保存最近20条
        }

    @classmethod
    def from_dict(cls, d, character_name="冷旭帆", target_name="用户"):
        engine = cls(character_name, target_name)
        if d:
            engine.trust_value = d.get("trust_value", 0)
            engine.current_stage = d.get("current_stage", "陌生人")
            engine.first_meet = d.get("first_meet", True)
            engine.event_log = d.get("event_log", [])
        return engine
