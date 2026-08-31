"""Prompt 工厂 - 从当前角色上下文读取数据"""
import time, random
from .character_context import get_character_data, get_current_character
from characters.roster import get_anchor_name

def build_system_prompt(perception, identity, memory, user_input, working_memory=None, social_network=None):
    feeling_translations = get_character_data("feeling_translations") or {}
    persona_data = get_character_data("persona") or {}

    e = perception.emotion
    if e < 30: feeling = random.choice(feeling_translations.get("very_low", ["你不舒服"]))
    elif e < 50: feeling = random.choice(feeling_translations.get("low", ["你有点闷"]))
    elif e < 70: feeling = random.choice(feeling_translations.get("medium", ["你还好"]))
    else: feeling = random.choice(feeling_translations.get("high", ["你挺开心"]))

    hour = (time.time() % 86400) / 3600
    if 0 <= hour < 5: feeling += " 深夜，世界很安静。"
    elif 5 <= hour < 8: feeling += " 天刚蒙蒙亮。"
    elif 20 <= hour < 24: feeling += " 夜已经深了。"

    status_text = f"【你此刻的感觉】\n{feeling}"
    if perception.status.get("shoulder_pain"): status_text += " 左肩旧伤隐隐作痛。"
    if perception.status.get("dream_streak"): status_text += f" 连续{perception.status['dream_streak']}天梦到妈妈。"
    if perception.status.get("miss_wang"): status_text += " 你在想陆华望。"
    if perception.status.get("holding_knife"): status_text += " 塑料刀就在手里。"

    status_text += f"\n\n{identity.get_trust_description()}"

    mt = _build_memory_text(memory)
    if mt: status_text += f"\n\n【你记得的事】\n{mt}"

    recent = memory.get_recent_episodes(3)
    if recent: status_text += "\n\n【最近发生的事】\n" + "；".join(recent)

    semantic_memories = memory.search_similar(user_input, top_k=3)
    if semantic_memories:
        status_text += "\n\n【语义检索到的相关记忆】\n" + "；".join(semantic_memories)

    if perception.pending_events: status_text += "\n\n【刚刚发生的事】\n" + " ".join(perception.pending_events)

    if working_memory:
        recent_wm = working_memory.get_recent_context()
        if recent_wm and recent_wm != "刚才没人说话。":
            status_text += f"\n\n【刚才发生的事】{recent_wm}"

    if social_network:
        least = social_network.get_least_interacted()
        if least:
            status_text += f"\n\n【你现在可以关心的人】{least['name']}——你记得：{least['last_memory']}。如果现在没有人跟你说话，你可以去确认他是否还好。"

    persona = persona_data.get("system_prompt", "你是一个AI角色。")
    return persona + "\n" + status_text

def build_messages(user_input, system_prompt):
    return [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_input}]

def _build_memory_text(memory):
    parts = []
    for f in memory.facts:
        if f.startswith("user_name_is_"): parts.append(f"对方的名字是{f[13:]}。"); break
    else: parts.append("你暂时不知道对方的名字。")
    likes = [f[11:] for f in memory.facts if f.startswith("user_likes_")]
    if likes: parts.append(f"此人喜欢{likes[-1]}。")
    if memory.has_fact("user_said_hate"): parts.append("此人说过讨厌你。")
    if memory.has_fact("user_asked_about_mom"): parts.append("此人问过你妈妈的事。")
    fc = memory.count_fact("user_gave_flower")
    if fc == 1: parts.append("此人送过你一朵花。")
    elif fc > 1: parts.append(f"此人送过你好几次花。")
    if memory.has_fact("user_asked_about_wang"):
        anchor = get_anchor_name(get_current_character().char_id) if get_current_character() else "陆华望"
        parts.append(f"此人问过{anchor}。")
    return " ".join(parts)
