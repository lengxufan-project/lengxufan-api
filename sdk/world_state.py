"""共享世界状态（SDK 独立版，无第三方依赖）。

维护模拟天数、时段、天气与室友活动，供多个角色引擎共享。
"""
from __future__ import annotations

import random
from typing import Dict, List, Optional


class WorldState:
    """全局世界状态单例。"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.simulated_day = 1
        self.time_of_day = "夜晚"
        self.weather = "晴"
        self.dorm_activities: Dict[str, str] = {}

    # ---- 时间 ----
    def get_simulated_time(self) -> int:
        return self.simulated_day

    def advance_day(self, n: int = 1) -> int:
        self.simulated_day += n
        return self.simulated_day

    def set_time_of_day(self, phase: str) -> None:
        self.time_of_day = phase

    def get_time_of_day(self) -> str:
        return self.time_of_day

    # ---- 天气 ----
    def set_weather(self, weather: str) -> None:
        self.weather = weather

    def get_weather(self) -> str:
        return self.weather

    def randomize_weather(self, choices: Optional[List[str]] = None) -> str:
        choices = choices or ["晴", "阴", "小雨", "风"]
        self.weather = random.choice(choices)
        return self.weather

    def get_weather_description(self) -> str:
        return {
            "晴": "阳光很好，空气里有干燥的木头味道。",
            "阴": "天压得很低，云像浸了水的棉絮。",
            "小雨": "雨丝斜斜地打在窗上，声音很轻。",
            "风": "风从走廊尽头穿过来，带着一点凉。",
        }.get(self.weather, "")

    # ---- 室友活动 ----
    def set_dorm_activity(self, name: str, activity: str) -> None:
        self.dorm_activities[name] = activity

    def get_dorm_activities(self) -> Dict[str, str]:
        return dict(self.dorm_activities)

    def get_world_summary(self) -> str:
        return f"第{self.simulated_day}天 · {self.time_of_day} · {self.weather}"


world = WorldState()
