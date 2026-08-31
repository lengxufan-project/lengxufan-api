"""身体状态管理 - 肩伤、疲劳、过敏等生理状态"""
import random
from infra.logger import debug


class BodyState:
    """管理角色的身体状态：肩伤、疲劳、过敏等"""

    def __init__(self):
        self.shoulder_pain = 0       # 0-100，左肩旧伤疼痛度
        self.fatigue = 0              # 0-100，疲劳度
        self.allergy = False          # 是否过敏
        self._pain_decay_rate = 0.1   # 疼痛自然衰减速率（每秒）
        self._fatigue_decay_rate = 0.05  # 疲劳自然恢复速率

    def to_dict(self):
        return {
            "shoulder_pain": self.shoulder_pain,
            "fatigue": self.fatigue,
            "allergy": self.allergy,
        }

    @classmethod
    def from_dict(cls, d):
        state = cls()
        if d:
            state.shoulder_pain = d.get("shoulder_pain", 0)
            state.fatigue = d.get("fatigue", 0)
            state.allergy = d.get("allergy", False)
        return state

    def update(self, elapsed_seconds: float):
        """每帧更新：自然恢复、状态衰减"""
        # 肩伤自然恢复（很慢）
        if self.shoulder_pain > 0:
            self.shoulder_pain = max(0, self.shoulder_pain - self._pain_decay_rate * elapsed_seconds / 60)

        # 疲劳自然恢复（较慢）
        if self.fatigue > 0:
            self.fatigue = max(0, self.fatigue - self._fatigue_decay_rate * elapsed_seconds / 60)

        # 随机波动（模拟身体的自然起伏）
        if random.random() < 0.01:
            self.shoulder_pain = min(100, self.shoulder_pain + random.randint(1, 5))

    def apply_damage(self, pain_amount: float = 0, fatigue_amount: float = 0):
        """施加伤害/疲劳"""
        self.shoulder_pain = min(100, self.shoulder_pain + pain_amount)
        self.fatigue = min(100, self.fatigue + fatigue_amount)
        debug(f"[BodyState] 肩伤+{pain_amount}→{self.shoulder_pain:.0f}, 疲劳+{fatigue_amount}→{self.fatigue:.0f}")

    def get_status_summary(self) -> str:
        """获取身体状态摘要"""
        parts = []
        if self.shoulder_pain > 50:
            parts.append("左肩旧伤疼得厉害")
        elif self.shoulder_pain > 20:
            parts.append("左肩隐隐发酸")
        if self.fatigue > 70:
            parts.append("身体很疲惫")
        elif self.fatigue > 30:
            parts.append("有点累")
        if self.allergy:
            parts.append("过敏了")
        if not parts:
            parts.append("身体没太大问题")
        return "；".join(parts)
