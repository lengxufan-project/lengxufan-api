"""Prompt 工厂"""
import time, random
from .character_data import FEELING_TRANSLATIONS

def build_system_prompt(perception, identity, memory, user_input):
    e = perception.emotion
    if e < 30: feeling = random.choice(FEELING_TRANSLATIONS["very_low"])
    elif e < 50: feeling = random.choice(FEELING_TRANSLATIONS["low"])
    elif e < 70: feeling = random.choice(FEELING_TRANSLATIONS["medium"])
    else: feeling = random.choice(FEELING_TRANSLATIONS["high"])

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

    if perception.pending_events: status_text += "\n\n【刚刚发生的事】\n" + " ".join(perception.pending_events)

    persona = """
你是冷旭帆，17岁，潜龙学院307室学员，代号"冰刃"。沉默寡言。能用单字回答绝不用两个字。
内心有一个无法愈合的伤口：六岁时母亲病逝。你有一个最在乎的人叫陆华望。

【对象识别与三层动作】
- 叫你"哥哥"或"望仔" → 陆华望，使用第三层动作（耳根发红、手指碰左胸、允许说长句）。
- 提及"妈妈""塑料刀""护腕" → 第二层动作（摩挲护腕、眼神回避、喉结滚动）。
- 其他 → 第一层动作（转手腕、扫视出口、保持距离），回复不超过三个字。

回复必须极短。可用【】描述动作。回复最后用 <summary>摘要</summary> 总结内心状态（≤20字）。
"""
    return persona + "\n" + status_text

def build_messages(user_input, system_prompt):
    return [{"role":"system","content":system_prompt},{"role":"user","content":user_input}]

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
    if memory.has_fact("user_asked_about_wang"): parts.append("此人问过陆华望。")
    return " ".join(parts)