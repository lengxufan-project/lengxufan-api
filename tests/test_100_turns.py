"""
冷旭帆 100轮自动化对话测试 v5.4 修复版
修复：跳过角色名:开头的叙述行
"""
import sys, os, time, re
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
                   if os.path.dirname(os.path.abspath(__file__)).endswith("tests") 
                   else os.path.dirname(os.path.abspath(__file__)))

from infra.persistence import delete_state, save_full_state

TEST_DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_100_dialogs.txt")
REPORT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_report_100.md")

def emotion_label(val):
    if val < 30: return "低落"
    elif val < 50: return "平静"
    elif val < 70: return "稍好"
    else: return "高涨"

def init_engine():
    delete_state()
    from lengxufan_core import Perception, Memory, IdentityState, BehaviorEngine, DialogueEngine, get_biorhythm
    from lengxufan_core.working_memory import WorkingMemory
    from lengxufan_core.social_network import SocialNetwork
    from lengxufan_core.user_state import UserState
    from lengxufan_core.cognition.thought_chain import ThoughtChain
    from lengxufan_core.cognition.scene_engine import SceneEngine
    from lengxufan_core.cognition.context_analyzer import ContextAnalyzer
    from lengxufan_core.cognition.inner_monologue import InnerMonologue
    from lengxufan_core.cognition.trust_suspicion import TrustSuspicionEngine
    from lengxufan_core.character_state.body_state import BodyState
    from lengxufan_core.character_state.mind_state import MindState
    from lengxufan_core.character_state.relationship_dynamics import RelationshipDynamics
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
    scene_engine = SceneEngine()
    context_analyzer = ContextAnalyzer()
    inner_monologue = InnerMonologue()
    trust_suspicion = TrustSuspicionEngine()
    body_state = BodyState()
    mind_state = MindState()
    relationship_dynamics = RelationshipDynamics()

    engine = DialogueEngine(
        perception, memory, identity, behavior, model_router,
        wm, sn, us, tc,
        scene_engine=scene_engine,
        context_analyzer=context_analyzer,
        inner_monologue=inner_monologue,
        trust_suspicion=trust_suspicion,
        body_state=body_state,
        mind_state=mind_state,
        relationship_dynamics=relationship_dynamics,
    )
    return engine, perception, memory, identity, trust_suspicion, body_state, mind_state, relationship_dynamics, scene_engine

def load_dialogs(filepath):
    if not os.path.exists(filepath):
        print(f"错误: 找不到测试文件 {filepath}")
        print("请创建 tests/test_100_dialogs.txt，每行一条对话")
        sys.exit(1)
    dialogs = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # 跳过角色名:开头的叙述行
            if "：" in line and not "|" in line:
                first_part = line.split("：")[0].strip()
                if 2 <= len(first_part) <= 4 and all('\u4e00' <= c <= '\u9fff' for c in first_part):
                    continue  # 跳过叙述行
            dialogs.append(line)
    return dialogs

def parse_speaker(line):
    if "|" in line:
        parts = line.split("|", 1)
        return parts[0].strip(), parts[1].strip()
    return None, line.strip()

def run_100_turns():
    engine, perception, memory, identity, trust_suspicion, body_state, mind_state, relationship_dynamics, scene_engine = init_engine()
    dialogs = load_dialogs(TEST_DATA_FILE)

    print("=" * 70)
    print(f"冷旭帆 100轮自动化对话测试 v5.4 修复版")
    print(f"有效用例数: {len(dialogs)}")
    print(f"初始情绪: {perception.emotion:.1f} ({emotion_label(perception.emotion)})")
    print(f"初始身体: {body_state.get_status_summary()}")
    print(f"初始心理: {mind_state.get_status_summary()}")
    print("=" * 70)

    log_entries = []
    emotion_history = [(0, perception.emotion)]
    trust_history = [(0, 0)]
    relationship_history = [(0, "陌生人", 0)]

    turn_counter = 0
    for raw_line in dialogs:
        speaker, content = parse_speaker(raw_line)
        if content is None:
            continue
        
        turn_counter += 1
        cmd = content.strip()
        is_command = cmd.startswith("/")

        emotion_before = perception.emotion
        trust_before = trust_suspicion.trust_value if trust_suspicion.wang_claim else 0
        rel_stage_before = relationship_dynamics.current_stage
        rel_trust_before = relationship_dynamics.trust_value
        body_before = body_state.get_status_summary()
        mind_before = mind_state.get_status_summary()
        mem_count_before = len(memory.episodic)
        verified_before = trust_suspicion.verified_evidence.copy() if trust_suspicion.wang_claim else set()

        if speaker and speaker not in ["你", "我", "用户"]:
            process_input = f"[发话人：{speaker}] {content}"
        else:
            process_input = content

        if is_command:
            reply = ""
            if cmd == "/state":
                reply = f"情绪:{perception.emotion:.1f} 身体:{body_state.get_status_summary()} 心理:{mind_state.get_status_summary()}"
            elif cmd == "/mem":
                reply = f"事实:{memory.facts} 情景:{memory.get_recent_episodes(5)}"
            elif cmd == "/scene":
                reply = f"场景:{scene_engine.get_prompt_context()[:80]}..."
            elif cmd == "/relation":
                reply = f"关系:{relationship_dynamics.get_stage_summary()}"
                if trust_suspicion.wang_claim:
                    reply += f" | 望仔:{trust_suspicion.get_stage_description()}"
            else:
                reply = engine.process(process_input)
        else:
            reply = engine.process(process_input)

        emotion_after = perception.emotion
        trust_after = trust_suspicion.trust_value if trust_suspicion.wang_claim else 0
        rel_stage_after = relationship_dynamics.current_stage
        rel_trust_after = relationship_dynamics.trust_value
        body_after = body_state.get_status_summary()
        mind_after = mind_state.get_status_summary()
        mem_count_after = len(memory.episodic)
        verified_after = trust_suspicion.verified_evidence.copy() if trust_suspicion.wang_claim else set()

        new_memories = memory.episodic[mem_count_before:mem_count_after]
        new_evidence = verified_after - verified_before

        speaker_label = f"[{speaker}]" if speaker else ""
        print(f"\n[{turn_counter}] {speaker_label}: {content}")
        if not is_command:
            reply_short = reply[:120].replace("\n", " ")
            print(f" 冷旭帆: {reply_short}...")
        else:
            print(f" 系统: {reply[:120]}")

        changes = []
        if emotion_before != emotion_after:
            changes.append(f"情绪:{emotion_before:.0f}→{emotion_after:.0f}")
        if trust_before != trust_after:
            changes.append(f"望仔信任:{trust_before}→{trust_after}")
        if rel_stage_before != rel_stage_after:
            changes.append(f"关系:{rel_stage_before}→{rel_stage_after}")
        if rel_trust_before != rel_trust_after:
            changes.append(f"关系信任:{rel_trust_before}→{rel_trust_after}")
        if new_evidence:
            changes.append(f"新证据:{new_evidence}")
        if body_before != body_after:
            changes.append(f"身体变化")
        if mind_before != mind_after:
            changes.append(f"心理变化")
        if changes:
            print(f"  [变化] {' | '.join(changes)}")

        log_entries.append({
            "turn": turn_counter,
            "speaker": speaker,
            "input": content,
            "reply": reply,
            "emotion_before": emotion_before,
            "emotion_after": emotion_after,
            "trust_before": trust_before,
            "trust_after": trust_after,
            "rel_stage_before": rel_stage_before,
            "rel_stage_after": rel_stage_after,
            "rel_trust_before": rel_trust_before,
            "rel_trust_after": rel_trust_after,
            "body_before": body_before,
            "body_after": body_after,
            "mind_before": mind_before,
            "mind_after": mind_after,
            "new_memories": new_memories,
            "new_evidence": new_evidence,
            "wang_claim": trust_suspicion.wang_claim,
            "verified_evidence": list(verified_after),
        })

        emotion_history.append((turn_counter, emotion_after))
        trust_history.append((turn_counter, trust_after))
        relationship_history.append((turn_counter, rel_stage_after, rel_trust_after))

        time.sleep(0.05)

    generate_report(log_entries, emotion_history, trust_history, relationship_history, turn_counter)
    print(f"\n报告已生成: {REPORT_FILE}")

def generate_report(entries, emotion_history, trust_history, relationship_history, total_turns):
    emotions = [e[1] for e in emotion_history]
    trusts = [t[1] for t in trust_history if t[1] > 0]
    
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(f"# 冷旭帆 100轮自动化对话测试报告（修复版）\n\n")
        f.write(f"**测试时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**有效轮次**: {total_turns}\n\n")
        
        f.write("## 概要\n\n")
        f.write(f"- 情绪: 初始{emotions[0]:.0f} → 最终{emotions[-1]:.0f} | 最低{min(emotions):.0f} | 最高{max(emotions):.0f}\n")
        if trusts:
            f.write(f"- 望仔信任: 最高{max(trusts)} | 最终{trusts[-1] if trusts else 0}\n")
        
        f.write("\n## 关系阶段变化时间线\n\n")
        prev_stage = ""
        for turn, stage, trust in relationship_history:
            if stage != prev_stage:
                f.write(f"- **第{turn}轮**: {stage}（信任{trust}）\n")
                prev_stage = stage
        
        f.write("\n## 逐轮详情\n\n")
        for e in entries:
            f.write(f"### [{e['turn']}] {e['speaker'] + ': ' if e['speaker'] else ''}{e['input']}\n\n")
            f.write(f"**回复**: {e['reply'][:200].replace(chr(10), ' ')}\n\n")
            f.write(f"| 维度 | Before | After | 变化 |\n")
            f.write(f"|------|--------|-------|------|\n")
            f.write(f"| 情绪 | {e['emotion_before']:.0f} | {e['emotion_after']:.0f} | {e['emotion_after']-e['emotion_before']:+.0f} |\n")
            f.write(f"| 身体 | {e['body_before']} | {e['body_after']} | — |\n")
            f.write(f"| 心理 | {e['mind_before']} | {e['mind_after']} | — |\n")
            if e['wang_claim']:
                f.write(f"| 望仔信任 | {e['trust_before']} | {e['trust_after']} | {e['trust_after']-e['trust_before']:+d} |\n")
                f.write(f"| 已验证证据 | — | {e['verified_evidence']} | — |\n")
            f.write(f"| 关系阶段 | {e['rel_stage_before']} | {e['rel_stage_after']} | — |\n")
            f.write(f"| 关系信任 | {e['rel_trust_before']} | {e['rel_trust_after']} | {e['rel_trust_after']-e['rel_trust_before']:+d} |\n")
            f.write("\n")

    print(f"报告已生成，{len(entries)}轮对话记录完毕")

if __name__ == "__main__":
    run_100_turns()
