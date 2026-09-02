"""社会关系网络 - 307室每个成员的极简关系模型"""
import random

from characters.roster import DORM_MEMBERS as DORM_NAMES

# 为每个室友初始化关系数据
DORM_MEMBERS = {
    name: {"closeness": 30, "last_memory": "暂无"} for name in DORM_NAMES
}

class SocialNetwork:
    def __init__(self):
        self.members = {name: data.copy() for name, data in DORM_MEMBERS.items()}
    
    def get_least_interacted(self):
        sorted_members = sorted(self.members.items(), key=lambda x: x[1]["closeness"])
        if sorted_members:
            name, data = sorted_members[0]
            return {"name": name, "last_memory": data["last_memory"]}
        return None
    
    def update_from_dialogue(self, speaker, content):
        if speaker and speaker in self.members:
            self.members[speaker]["closeness"] = min(100, self.members[speaker]["closeness"] + 2)
            self.members[speaker]["last_memory"] = content[:30]