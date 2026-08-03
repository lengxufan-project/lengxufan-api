"""用户状态追踪模块 - 记录用户的实时身体、心理、身份状态"""

class UserState:
    def __init__(self):
        self.physical = {
            "health": "健康",        # 健康/轻伤/重伤/濒死
            "injuries": [],           # 具体受伤部位列表
            "fatigue": 0,             # 疲劳度 0-100
            "sensory_details": {}     # 五感细节 {"视觉":"...", "听觉":"...", ...}
        }
        self.mental = {
            "mood": "平静",           # 当前情绪状态
            "stress": 0,              # 压力等级 0-100
            "suspicion": 0,           # 怀疑度 0-100
            "trust_tendency": 50      # 信任倾向 0-100
        }
        self.identity = {
            "name": None,             # 用户告知的名字
            "claimed_identity": None, # 用户自称的身份
            "confirmed_traits": []    # 已确认的特征列表
        }
        self.relationships = {
            "with_character": {       # 与冷旭帆的关系
                "type": "陌生人",      # 陌生人/熟人/朋友/重要之人/…
                "closeness": 0,        # 亲密度 0-100
                "trust": 0             # 信任值 0-100
            }
        }
        self.events = {
            "current_location": "未知",# 当前所在位置
            "last_event": None,        # 上一次发生的事件
            "event_log": []            # 事件记录列表
        }
    
    def update_health(self, status, injuries=None):
        """更新身体健康状态"""
        self.physical["health"] = status
        if injuries:
            self.physical["injuries"] = injuries
    
    def update_mood(self, mood, stress=None):
        """更新心理情绪状态"""
        self.mental["mood"] = mood
        if stress is not None:
            self.mental["stress"] = stress
    
    def set_identity(self, name=None, claimed=None):
        """更新身份信息"""
        if name:
            self.identity["name"] = name
        if claimed:
            self.identity["claimed_identity"] = claimed
    
    def update_trust(self, value, reason=""):
        """更新信任值并记录原因"""
        old = self.relationships["with_character"]["trust"]
        self.relationships["with_character"]["trust"] = max(0, min(100, value))
        return {
            "old": old,
            "new": self.relationships["with_character"]["trust"],
            "reason": reason
        }
    
    def update_location(self, location):
        """更新当前所在位置"""
        self.events["current_location"] = location
    
    def get_state_summary(self):
        """获取用户当前状态的简要摘要"""
        return {
            "身体": f"健康状况: {self.physical['health']}, 疲劳度: {self.physical['fatigue']}",
            "心理": f"情绪: {self.mental['mood']}, 压力: {self.mental['stress']}, 信任倾向: {self.mental['trust_tendency']}",
            "身份": f"名字: {self.identity['name'] or '未知'}, 自称: {self.identity['claimed_identity'] or '未表明'}",
            "与角色关系": f"类型: {self.relationships['with_character']['type']}, 亲密度: {self.relationships['with_character']['closeness']}, 信任: {self.relationships['with_character']['trust']}",
            "位置": self.events['current_location']
        }