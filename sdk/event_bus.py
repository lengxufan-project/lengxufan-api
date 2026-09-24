"""事件总线（SDK 独立版，无第三方依赖）。

角色间消息传递：publish / subscribe，支持通配符 "*"。
"""
from __future__ import annotations

from typing import Callable, Dict, List


class EventBus:
    """全局事件总线单例。"""

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
        self._subscribers: Dict[str, List[Callable]] = {}
        self._event_log: List[dict] = []
        self.max_log = 50

    def subscribe(self, event_type: str, callback: Callable) -> None:
        """订阅某类事件（"*" 订阅全部事件）。"""
        self._subscribers.setdefault(event_type, []).append(callback)

    def publish(self, event_type: str, data: dict = None) -> None:
        """发布事件，通知所有订阅者。"""
        if data is None:
            data = {}
        event = {"type": event_type, "data": data}

        self._event_log.append(event)
        if len(self._event_log) > self.max_log:
            self._event_log = self._event_log[-self.max_log:]

        for callback in self._subscribers.get(event_type, []):
            try:
                callback(data)
            except Exception:
                pass

        for callback in self._subscribers.get("*", []):
            try:
                callback(event)
            except Exception:
                pass

    def get_recent_events(self, n: int = 10) -> List[dict]:
        """获取最近的事件。"""
        return self._event_log[-n:]

    def clear(self) -> None:
        """清空事件日志。"""
        self._event_log = []


bus = EventBus()
