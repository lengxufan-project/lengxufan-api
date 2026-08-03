"""用户状态追踪模块 - 双向感知版"""
import re


class UserState:
    """追踪用户的实时身体、心理、身份状态，并从输入中推断"""

    def __init__(self):
        self.physical = {
            "health": "健康",
            "injuries": [],
            "fatigue": 0,
            "sensory_details": {}
        }
        self.mental = {
            "mood": "平静",
            "stress": 0,
            "suspicion": 0,
            "trust_tendency": 50
        }
        self.identity = {
            "name": None,
            "claimed_identity": None,
            "confirmed_traits": []
        }
        self.relationships = {
            "with_character": {
                "type": "陌生人",
                "closeness": 0,
                "trust": 0
            }
        }
        self.events = {
            "current_location": "未知",
            "last_event": None,
            "event_log": []
        }

    # ---- 新增：从用户输入推断状态 ----

    def analyze_input(self, user_input: str) -> dict:
        """分析用户输入，返回推断出的状态变化"""
        text = user_input.strip()
        result = {
            "mood_change": None,        # 推断的情绪
            "mood_reason": "",
            "physical_mentions": [],    # 提到的身体部位/症状
            "stress_change": 0,
            "emotional_keywords": [],
            "relationship_signal": None  # "亲近" / "疏远" / None
        }

        # 1. 情绪推断
        mood_map = {
            "开心": ["开心", "高兴", "哈哈", "嘻嘻", "太好了", "棒", "喜欢", "爱"],
            "悲伤": ["难过", "伤心", "哭", "想哭", "难受", "痛苦"],
            "愤怒": ["生气", "烦", "讨厌", "恨", "滚", "别管", "走开"],
            "焦虑": ["担心", "害怕", "紧张", "不安", "怎么办"],
            "疲惫": ["累", "困", "没力气", "不想动", "倦"],
            "平静": ["还好", "没事", "还行", "随便", "嗯"]
        }
        for mood, keywords in mood_map.items():
            if any(kw in text for kw in keywords):
                result["mood_change"] = mood
                result["emotional_keywords"] = [kw for kw in keywords if kw in text]
                break

        # 2. 身体状态推断
        body_keywords = {
            "肩疼": ["肩", "肩膀", "肩胛"],
            "头疼": ["头疼", "头痛", "脑袋"],
            "手伤": ["手疼", "手伤", "手指", "割伤"],
            "疲劳": ["累", "疲惫", "没睡好", "失眠"],
            "生病": ["感冒", "发烧", "咳嗽", "不舒服", "病"]
        }
        for condition, keywords in body_keywords.items():
            if any(kw in text for kw in keywords):
                result["physical_mentions"].append(condition)

        # 3. 压力推断
        if any(kw in text for kw in ["压力", "焦虑", "紧张", "考试", "面试"]):
            result["stress_change"] = 15
        elif result["mood_change"] in ["开心", "平静"]:
            result["stress_change"] = -5

        # 4. 关系信号推断
        if any(kw in text for kw in ["谢谢你", "还好有你", "你真好", "多亏你"]):
            result["relationship_signal"] = "亲近"
        elif any(kw in text for kw in ["别管我", "走开", "不用你", "你烦"]):
            result["relationship_signal"] = "疏远"

        return result

    def apply_analysis(self, analysis: dict):
        """将分析结果应用到用户状态"""
        if analysis["mood_change"]:
            self.mental["mood"] = analysis["mood_change"]

        self.mental["stress"] = max(0, min(100, self.mental["stress"] + analysis["stress_change"]))

        if analysis["relationship_signal"] == "亲近":
            self.relationships["with_character"]["closeness"] = min(100, self.relationships["with_character"]["closeness"] + 3)
        elif analysis["relationship_signal"] == "疏远":
            self.relationships["with_character"]["closeness"] = max(0, self.relationships["with_character"]["closeness"] - 5)

    # ---- 原有方法 ----
    def update_health(self, status, injuries=None):
        self.physical["health"] = status
        if injuries: self.physical["injuries"] = injuries

    def update_mood(self, mood, stress=None):
        self.mental["mood"] = mood
        if stress is not None: self.mental["stress"] = stress

    def set_identity(self, name=None, claimed=None):
        if name: self.identity["name"] = name
        if claimed: self.identity["claimed_identity"] = claimed

    def update_trust(self, value, reason=""):
        old = self.relationships["with_character"]["trust"]
        self.relationships["with_character"]["trust"] = max(0, min(100, value))
        return {"old": old, "new": self.relationships["with_character"]["trust"], "reason": reason}

    def update_location(self, location):
        self.events["current_location"] = location

    def get_state_summary(self) -> dict:
        return {
            "mood": self.mental["mood"],
            "stress": self.mental["stress"],
            "identity": self.identity["name"] or "未知",
            "relationship": f"{self.relationships['with_character']['type']}（亲密度{self.relationships['with_character']['closeness']}）"
        }

    def get_prompt_injection(self) -> str:
        """生成注入 System Prompt 的用户状态描述"""
        parts = []
        name = self.identity["name"]
        if name:
            parts.append(f"对方的名字是{name}。")
        else:
            parts.append("你不知道对方的名字。")

        mood = self.mental["mood"]
        if mood == "开心":
            parts.append("对方看起来很开心。")
        elif mood == "悲伤":
            parts.append("对方看起来很难过。")
        elif mood == "愤怒":
            parts.append("对方在生气。")
        elif mood == "焦虑":
            parts.append("对方看起来很紧张。")
        elif mood == "疲惫":
            parts.append("对方看起来很累。")

        closeness = self.relationships["with_character"]["closeness"]
        if closeness > 60:
            parts.append("对方和你很亲近。")
        elif closeness > 30:
            parts.append("对方算是你的熟人。")

        if self.physical["injuries"]:
            parts.append(f"对方身上有伤：{', '.join(self.physical['injuries'])}。")

        return " ".join(parts)
