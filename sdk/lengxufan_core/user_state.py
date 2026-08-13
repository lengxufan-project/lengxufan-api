"""用户状态追踪模块 - 深化版：连续追踪 + 情绪曲线 + 关系对称性 + 双向影响"""
import re


class UserState:
    """追踪用户的实时身体、心理、身份状态，支持连续追踪和双向感知"""

    def __init__(self):
        self.physical = {
            "health": "健康",
            "injuries": [],
            "fatigue": 0,
            "sensory_details": {},
            "persistent_conditions": {}   # 持续的身体状况 {"肩疼": 剩余轮数}
        }
        self.mental = {
            "mood": "平静",
            "stress": 0,
            "suspicion": 0,
            "trust_tendency": 50,
            "mood_history": [],            # 最近10轮情绪记录
            "mood_streak": 0,              # 同一情绪连续轮数
        }
        self.identity = {
            "name": None,
            "claimed_identity": None,
            "confirmed_traits": [],
            "topic_preferences": {}        # 用户偏好话题 {"草莓": 提及次数}
        }
        self.relationships = {
            "with_character": {
                "type": "陌生人",
                "closeness": 0,            # 用户→角色
                "trust": 0,
                "lxf_to_user": 0           # 角色→用户（新增）
            }
        }
        self.events = {
            "current_location": "未知",
            "last_event": None,
            "event_log": []
        }
        self._turn_count = 0

    # ---- 核心方法：每轮对话调用 ----

    def analyze_input(self, user_input: str) -> dict:
        """分析用户输入，返回推断出的状态变化"""
        self._turn_count += 1
        text = user_input.strip()
        result = {
            "mood_change": None,
            "mood_reason": "",
            "physical_mentions": [],
            "stress_change": 0,
            "emotional_keywords": [],
            "relationship_signal": None,
            "topic": None,
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

        # 2. 身体状态推断（持续追踪）
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

        # 5. 话题偏好
        topic_keywords = {
            "草莓": ["草莓"],
            "陆华望": ["陆华望", "华望", "望仔"],
            "妈妈": ["妈妈", "母亲"],
            "音乐": ["歌", "音乐", "海阔天空"],
            "糖": ["糖", "糖纸", "糖果"],
            "方言": ["方言", "粤语", "客家话"],
        }
        for topic, keywords in topic_keywords.items():
            if any(kw in text for kw in keywords):
                result["topic"] = topic
                break

        return result

    def apply_analysis(self, analysis: dict):
        """将分析结果应用到用户状态，支持连续追踪"""
        # 更新情绪
        if analysis["mood_change"]:
            prev_mood = self.mental["mood"]
            self.mental["mood"] = analysis["mood_change"]

            # 记录情绪历史
            self.mental["mood_history"].append(analysis["mood_change"])
            if len(self.mental["mood_history"]) > 10:
                self.mental["mood_history"] = self.mental["mood_history"][-10:]

            # 情绪连续计数
            if analysis["mood_change"] == prev_mood:
                self.mental["mood_streak"] += 1
            else:
                self.mental["mood_streak"] = 1

        # 更新压力
        self.mental["stress"] = max(0, min(100, self.mental["stress"] + analysis["stress_change"]))

        # 更新持续身体状况
        for condition in analysis["physical_mentions"]:
            self.physical["persistent_conditions"][condition] = 5  # 持续5轮

        # 更新关系
        if analysis["relationship_signal"] == "亲近":
            self.relationships["with_character"]["closeness"] = min(100, self.relationships["with_character"]["closeness"] + 3)
            self.relationships["with_character"]["lxf_to_user"] = min(100, self.relationships["with_character"]["lxf_to_user"] + 2)
        elif analysis["relationship_signal"] == "疏远":
            self.relationships["with_character"]["closeness"] = max(0, self.relationships["with_character"]["closeness"] - 5)
            self.relationships["with_character"]["lxf_to_user"] = max(0, self.relationships["with_character"]["lxf_to_user"] - 3)

        # 更新话题偏好
        if analysis["topic"]:
            self.identity["topic_preferences"][analysis["topic"]] = self.identity["topic_preferences"].get(analysis["topic"], 0) + 1

    def update_per_turn(self):
        """每轮对话后自动更新：衰减持续状态"""
        # 持续身体状况衰减
        to_remove = []
        for condition, rounds in self.physical["persistent_conditions"].items():
            rounds -= 1
            if rounds <= 0:
                to_remove.append(condition)
            else:
                self.physical["persistent_conditions"][condition] = rounds
        for condition in to_remove:
            del self.physical["persistent_conditions"][condition]

        # 压力自然衰减
        if self.mental["stress"] > 10:
            self.mental["stress"] = max(10, self.mental["stress"] - 2)

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

    def update_lxf_trust(self, value):
        """更新冷旭帆对用户的信任值"""
        self.relationships["with_character"]["lxf_to_user"] = max(0, min(100, value))

    def update_location(self, location):
        self.events["current_location"] = location

    def get_state_summary(self) -> dict:
        return {
            "mood": self.mental["mood"],
            "mood_streak": self.mental["mood_streak"],
            "stress": self.mental["stress"],
            "identity": self.identity["name"] or "未知",
            "relationship": f"{self.relationships['with_character']['type']}（亲密度{self.relationships['with_character']['closeness']}）",
            "lxf_to_user": self.relationships["with_character"]["lxf_to_user"],
            "persistent_conditions": list(self.physical["persistent_conditions"].keys()),
            "top_topics": sorted(self.identity["topic_preferences"].items(), key=lambda x: x[1], reverse=True)[:3],
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
        streak = self.mental["mood_streak"]
        if mood == "开心":
            if streak >= 3: parts.append("对方今天一直很开心。")
            else: parts.append("对方看起来很开心。")
        elif mood == "悲伤":
            if streak >= 3: parts.append("对方已经难过了好几轮。")
            else: parts.append("对方看起来很难过。")
        elif mood == "愤怒":
            parts.append("对方在生气。")
        elif mood == "焦虑":
            parts.append("对方看起来很紧张。")
        elif mood == "疲惫":
            parts.append("对方看起来很累。")

        # 持续身体状况
        conditions = self.physical["persistent_conditions"]
        if conditions:
            parts.append(f"对方身体不适：{'、'.join(conditions.keys())}。")

        closeness = self.relationships["with_character"]["closeness"]
        if closeness > 60: parts.append("对方和你很亲近。")
        elif closeness > 30: parts.append("对方算是你的熟人。")

        # 话题偏好
        top = sorted(self.identity["topic_preferences"].items(), key=lambda x: x[1], reverse=True)[:2]
        if top:
            topics = [t[0] for t in top if t[1] >= 2]
            if topics:
                parts.append(f"对方经常提起：{'、'.join(topics)}。")

        return " ".join(parts)
