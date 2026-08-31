"""群聊管理器 - 管理多角色会话、上下文传递、参与者控制"""
import time
from infra.logger import info


class GroupChatManager:
    def __init__(self, max_participants=8, max_context_length=20):
        self.members = []          # 参与群聊的角色 ID 列表
        self.max_participants = max_participants
        self.max_context_length = max_context_length
        self.current_context = []  # 当前轮次的上下文（每轮用户消息后重置）
        self.groups = {}           # 分组占位
        self.interrupt_queue = []  # 主动插话队列占位

    def set_members(self, members):
        """设置群聊参与者（角色 ID 列表）"""
        if len(members) > self.max_participants:
            members = members[:self.max_participants]
            info(f"[GroupChat] 参与者超过上限，已截断至 {self.max_participants} 人")
        self.members = members

    def add_to_group(self, group_name, char_ids):
        """将角色添加到分组（占位）"""
        self.groups[group_name] = char_ids

    def request_interrupt(self, char_id, message):
        """角色主动插话请求（占位）"""
        self.interrupt_queue.append({"char_id": char_id, "message": message})

    def get_context(self):
        """获取当前上下文文本"""
        return "\n".join(self.current_context)

    def record_reply(self, char_name, reply):
        """记录一条回复到上下文，并截断"""
        entry = f"{char_name}：{reply}"
        self.current_context.append(entry)
        if len(self.current_context) > self.max_context_length:
            self.current_context = self.current_context[-self.max_context_length:]

    def clear_context(self):
        """清空本轮上下文"""
        self.current_context = []

    def get_status(self):
        return {
            "members": len(self.members),
            "max_participants": self.max_participants,
            "groups": self.groups,
            "interrupt_queue_size": len(self.interrupt_queue),
            "context_length": len(self.current_context),
        }