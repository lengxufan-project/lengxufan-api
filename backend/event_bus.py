"""事件总线 - 角色间消息传递"""
from infra.logger import debug

class EventBus:
    """全局事件总线单例"""
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
        self._subscribers = {}      # {event_type: [callback, ...]}
        self._event_log = []        # 最近的事件记录
        self.max_log = 50

    def subscribe(self, event_type: str, callback):
        """订阅某类事件"""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)
        debug(f"[EventBus] 订阅: {event_type}")

    def publish(self, event_type: str, data: dict = None):
        """发布事件，通知所有订阅者"""
        if data is None:
            data = {}
        event = {"type": event_type, "data": data}

        # 记录事件
        self._event_log.append(event)
        if len(self._event_log) > self.max_log:
            self._event_log = self._event_log[-self.max_log:]

        # 通知订阅者
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                try:
                    callback(data)
                except Exception as e:
                    debug(f"[EventBus] 回调失败: {e}")

        # 同时通知通配符订阅者
        if "*" in self._subscribers:
            for callback in self._subscribers["*"]:
                try:
                    callback(event)
                except Exception as e:
                    debug(f"[EventBus] 通配符回调失败: {e}")

    def get_recent_events(self, n: int = 10):
        """获取最近的事件"""
        return self._event_log[-n:]

    def clear(self):
        """清空事件日志"""
        self._event_log = []


# 全局单例
bus = EventBus()