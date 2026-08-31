"""
冷旭帆 自动化对话测试套件 v5.2
支持场景描述、多角色对话、思考链展示
"""
import sys, os, time, re
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from infra.persistence import delete_state
from infra.logger import get_logger
from lengxufan_core.working_memory import WorkingMemory
from lengxufan_core.social_network import SocialNetwork
from lengxufan_core.user_state import UserState
from lengxufan_core.cognition.thought_chain import ThoughtChain

TEST_DATA_FILE = os.path.join(os.path.dirname(__file__), "test_dialogs.txt")
REPORT_DIR = os.path.join(os.path.dirname(__file__), "reports")

def emotion_status(val):
    if val < 30: return "低落"
    elif val < 50: return "平静"
    elif val < 70: return "稍高"
    else: return "高涨"

def reset_to_new_game():
    delete_state()
    from lengxufan_core import Perception, Memory, IdentityState, BehaviorEngine, DialogueEngine, get_biorhythm
    from api.router import router as model_router

    perception = Perception()
    perception.emotion = get_biorhythm()
    memory = Memory()
    identity = IdentityState()
    behavior = BehaviorEngine()
    wm = WorkingMemory()
    sn = SocialNetwork()
    us = UserState()
    tc = ThoughtChain()
    engine = DialogueEngine(perception, memory, identity, behavior, model_router, wm, sn, us, tc)
    return engine, perception, memory, identity

def parse_scene_line(line):
    if "|" in line:
        parts = line.split("|", 1)
        speaker = parts[0].strip()
        content = parts[1].strip() if len(parts) > 1 else ""
        return speaker, content
    return None, line.strip()

def load_test_cases(filepath):
    cases = []
    scene_description = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith("#"):
                scene_description.append(line[1:].strip())
                continue
            speaker, content = parse_scene_line(line)
            cases.append({
                "speaker": speaker,
                "content": content,
                "scene_context": "\n".join(scene_description) if scene_description else ""
            })
    return cases

def run_all_tests():
    print("=" * 70)
    print("冷旭帆 自动化对话测试 v5.2（思考链展示）")
    print("=" * 70)

    engine, perception, memory, identity = reset_to_new_game()

    cases = load_test_cases(TEST_DATA_FILE)

    if cases and cases[0]["scene_context"]:
        print(f"\n📖 场景背景：\n{cases[0]['scene_context']}\n")

    print("⚠️ 以下状态和数值为调试信息，仅建造者可见")
    print(f"初始情绪: {perception.emotion:.1f} | 初始信任: {identity.wang_belief if identity.wang_claim else identity.trust_level}")
    print(f"用例数: {len(cases)} | 模型: {engine.model_router.get_status()['current_model'] or '待首次调用'}")
    print("-" * 70)

    results = []
    for i, case in enumerate(cases, 1):
        user_input = case["content"]
        speaker = case["speaker"]

        emotion_before = perception.emotion
        trust_before = identity.wang_belief if identity.wang_claim else identity.trust_level
        memory_before = len(memory.episodic)

        speaker_label = f"[{speaker}]" if speaker else ""

        if speaker and speaker in ["陆华望", "黄景云", "向云舟", "秦狐戏", "陆华希", "冉昭然", "叶清辞"]:
            process_input = f"[发话人：{speaker}] {user_input}"
        else:
            process_input = user_input

        print(f"\n[{i}/{len(cases)}] {speaker_label}: {user_input}")
        reply = engine.process(process_input)
        print(f"冷旭帆: {reply}")

        route_status = engine.model_router.get_status()
        emotion_after = perception.emotion
        trust_after = identity.wang_belief if identity.wang_claim else identity.trust_level
        memory_after = len(memory.episodic)

        print(f"  📊 状态:{emotion_status(emotion_before)}({emotion_before:.1f}→{emotion_after:.1f}) | 信任:{trust_before}→{trust_after} | 记忆:{memory_before}→{memory_after}条 | 模型:{route_status['current_model']}")

        if engine.thought_chain and engine.thought_chain.last_thought:
            print(f"  🧠 思考: {engine.thought_chain.last_thought}")

        if trust_after != trust_before:
            print(f"  🔒 信任变化: {trust_before}→{trust_after}")

        if memory_after > memory_before:
            latest = memory.episodic[-1] if memory.episodic else None
            if latest:
                print(f"  💾 新记忆: {latest['summary']}")

        body_parts = []
        if perception.status.get("shoulder_pain"): body_parts.append("左肩旧伤")
        if perception.status.get("holding_knife"): body_parts.append("握着塑料刀")
        if perception.status.get("miss_wang"): body_parts.append("在想陆华望")
        if perception.status.get("dream_streak", 0) > 0: body_parts.append(f"连续梦魇{perception.status['dream_streak']}天")
        if body_parts:
            print(f"  💪 身体: {', '.join(body_parts)}")

        results.append({
            "index": i, "speaker": speaker, "user": user_input, "reply": reply,
            "emotion_before": emotion_before, "emotion_after": emotion_after,
            "trust_before": trust_before, "trust_after": trust_after,
            "memory_count": memory_after
        })
        time.sleep(0.1)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = os.path.join(REPORT_DIR, f"test_report_{timestamp}.md")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"# 冷旭帆 对话测试报告\n\n")
        f.write(f"**测试时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**测试用例数**: {len(cases)}\n")
        if cases and cases[0]["scene_context"]:
            f.write(f"\n**场景背景**:\n{cases[0]['scene_context']}\n")
        f.write("\n## 对话记录\n\n")
        for r in results:
            speaker_label = f"[{r['speaker']}] " if r['speaker'] else ""
            f.write(f"### [{r['index']}] {speaker_label}: {r['user']}\n")
            f.write(f"**冷旭帆**: {r['reply']}\n")
            f.write(f"- 情绪: {r['emotion_before']:.1f}→{r['emotion_after']:.1f} | 信任: {r['trust_before']}→{r['trust_after']} | 记忆数: {r['memory_count']}\n\n")

    print(f"\n{'=' * 70}")
    print(f"完成！报告: {report_path}")
    print(f"轮次:{len(results)} | 最终情绪:{perception.emotion:.1f} | 最终信任:{identity.wang_belief if identity.wang_claim else identity.trust_level} | 记忆:{len(memory.episodic)}条")
    print(f"{'=' * 70}")

if __name__ == "__main__":
    run_all_tests()