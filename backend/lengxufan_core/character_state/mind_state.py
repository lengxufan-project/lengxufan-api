"""心理状态管理 - 压力、警觉度、情绪倾向"""
import random
from infra.logger import debug


class MindState:
    """管理角色的心理状态：压力、警觉度、情绪倾向"""

    def __init__(self):
        self.stress = 30              # 0-100，压力
        self.alertness = 80           # 0-100，警觉度
        self.emotion_bias = 0         # 长期情绪偏移（正=乐观，负=悲观）
        self._stress_decay_rate = 0.05   # 压力自然衰减速率
        self._alertness_decay_rate = 0.02  # 警觉度自然衰减速率

    def to_dict(self):
        return {
            "stress": self.stress,
            "alertness": self.alertness,
            "emotion_bias": self.emotion_bias,
        }

    @classmethod
    def from_dict(cls, d):
        state = cls()
        if d:
            state.stress = d.get("stress", 30)
            state.alertness = d.get("alertness", 80)
            state.emotion_bias = d.get("emotion_bias", 0)
        return state

    def update(self, elapsed_seconds: float):
        """每帧更新：压力自然衰减、警觉度波动"""
        # 压力自然衰减
        if self.stress > 10:
            self.stress = max(10, self.stress - self._stress_decay_rate * elapsed_seconds / 60)

        # 警觉度在夜间更高、白天稍低
        hour = (elapsed_seconds % 86400) / 3600 if elapsed_seconds > 0 else 12
        if 0 <= hour < 5:
            self.alertness = min(100, self.alertness + 0.5)
        else:
            self.alertness = max(30, self.alertness - self._alertness_decay_rate * elapsed_seconds / 60)

        # 情绪偏移缓慢回归中性
        if abs(self.emotion_bias) > 0.5:
            self.emotion_bias *= 0.95

    def apply_event(self, stress_delta: float = 0, emotion_bias_delta: float = 0):
        """施加心理事件"""
        self.stress = max(0, min(100, self.stress + stress_delta))
        self.emotion_bias = max(-20, min(20, self.emotion_bias + emotion_bias_delta))
        debug(f"[MindState] 压力{stress_delta:+}→{self.stress:.0f}, 情绪偏移{emotion_bias_delta:+}→{self.emotion_bias:.1f}")

    def get_status_summary(self) -> str:
        """获取心理状态摘要"""
        parts = []
        if self.stress > 70:
            parts.append("压力很大，神经紧绷")
        elif self.stress > 40:
            parts.append("有些压力")
        if self.alertness > 80:
            parts.append("高度警觉")
        elif self.alertness < 40:
            parts.append("有些疲惫，注意力下降")
        if self.emotion_bias > 5:
            parts.append("情绪比平时好一些")
        elif self.emotion_bias < -5:
            parts.append("情绪比平时低落")
        if not parts:
            parts.append("心理状态平稳")
        return "；".join(parts)
