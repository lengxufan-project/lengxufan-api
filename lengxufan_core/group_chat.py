"""群聊管理器 - 管理多角色会话、上下文传递、参与者上限、分组、主动插话与状态互感知"""
import random, time
from infra.logger import info


class GroupChatManager:
    def __init__(self, max_participants=8, max_context_length=20):
        self.members = []               # 当前群聊成员 ID 列表
        self.max_participants = max_participants
        self.max_context_length = max_context_length
        self.current_context = []       # 本轮群聊上下文
        self.groups = {}                # 分组：{组名: [char_id, ...]}
        self.interrupt_queue = []       # 主动插话队列（占位）
        self.member_states = {}         # 成员状态摘要 {char_id: {emotion, label, relation}}
        self.interrupt_probability = {} # 每个角色的插话概率

    def set_members(self, members):
        """设置群聊参与者，自动截断到上限"""
        if len(members) > self.max_participants:
            info(f"[GroupChat] 参与者超过上限，截断至 {self.max_participants} 人")
            members = members[:self.max_participants]
        self.members = members

    def set_members_from_group(self, group_name):
        """从预定义分组中设置成员"""
        if group_name in self.groups:
            self.set_members(self.groups[group_name])
        else:
            info(f"[GroupChat] 分组 {group_name} 不存在")

    def add_to_group(self, group_name, char_ids):
        """将角色添加到分组（会覆盖同名分组）"""
        self.groups[group_name] = char_ids

    def set_member_state(self, char_id, state_summary):
        """设置某个成员的当前状态摘要（情绪/关系等）"""
        self.member_states[char_id] = state_summary

    def set_interrupt_probability(self, char_id, probability):
        """设置某角色的插话概率（0-1）"""
        self.interrupt_probability[char_id] = max(0.0, min(1.0, probability))

    def get_status_context(self):
        """生成所有成员状态摘要，供角色感知"""
        lines = []
        for cid in self.members:
            state = self.member_states.get(cid, {})
            label = state.get("emotion_label", "平静")
            relation = state.get("relationship", "陌生人")
            name = state.get("name", cid)
            lines.append(f"{name}：情绪{label}，关系{relation}")
        return "\n".join(lines)

    def request_interrupt(self, char_id, message):
        """角色主动插话请求（当前仅存储，不自动触发）"""
        self.interrupt_queue.append({"char_id": char_id, "message": message, "time": time.time()})

    def get_pending_interrupts(self):
        """获取待处理的插话请求"""
        pending = self.interrupt_queue[:]
        self.interrupt_queue = []
        return pending

    def select_interrupt_candidate(self):
        """根据概率随机选择一个插话角色，返回 char_id 或 None"""
        if not self.members:
            return None
        weighted = []
        for cid in self.members:
            prob = self.interrupt_probability.get(cid, 0.2)
            weighted.append((cid, prob))
        total = sum(w for _, w in weighted)
        if total <= 0:
            return None
        r = random.uniform(0, total)
        cum = 0
        for cid, w in weighted:
            cum += w
            if r <= cum:
                return cid
        return None

    def get_context(self):
        """获取当前上下文文本"""
        return "\n".join(self.current_context)

    def record_reply(self, char_name, reply):
        """记录一条回复，并截断上下文长度"""
        entry = f"{char_name}：{reply}"
        self.current_context.append(entry)
        if len(self.current_context) > self.max_context_length:
            self.current_context = self.current_context[-self.max_context_length:]

    def clear_context(self):
        """清空本轮上下文"""
        self.current_context = []

    def get_status(self):
        """返回群聊管理器状态"""
        return {
            "members": len(self.members),
            "max_participants": self.max_participants,
            "groups": self.groups,
            "interrupt_queue_size": len(self.interrupt_queue),
            "context_length": len(self.current_context),
        }