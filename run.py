"""冷旭帆 启动器 v5.4 - PWA + 开发者面板"""
import os, sys, re, argparse
from flask import Flask, request, jsonify, make_response, send_from_directory

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from infra.logger import info
from infra.persistence import load_full_state
from api.router import router as model_router
from lengxufan_core import (
    Perception, Memory, IdentityState, BehaviorEngine, DialogueEngine, get_biorhythm,
)
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

perception = Perception()
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

saved = load_full_state()
if saved:
    perception = Perception.from_dict(saved)
    memory = Memory.from_dict(saved, saved.get("simulated_day", 1))
    identity = IdentityState.from_dict(saved.get("identity_state", {}))
    info("存档已加载。")
else:
    perception.emotion = get_biorhythm()
    info("新游戏初始化。")

engine = DialogueEngine(
    perception, memory, identity, behavior,
    model_router, wm, sn, us, tc,
    scene_engine=scene_engine, context_analyzer=context_analyzer,
    inner_monologue=inner_monologue, trust_suspicion=trust_suspicion,
    body_state=body_state, mind_state=mind_state,
    relationship_dynamics=relationship_dynamics,
)

app = Flask(__name__, static_folder='static', static_url_path='')
app.config["JSON_AS_ASCII"] = False

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/dev')
def dev():
    return send_from_directory('static', 'dev.html')

@app.route('/dev-state')
def dev_state():
    emo = perception.emotion
    if emo < 30: el = "低落"
    elif emo < 50: el = "平静"
    elif emo < 70: el = "稍好"
    else: el = "高涨"
    return jsonify({
        "emotion": emo, "emotion_label": el,
        "body": body_state.get_status_summary(),
        "mind": mind_state.get_status_summary(),
        "relationship": relationship_dynamics.get_stage_summary(),
        "wang_claim": trust_suspicion.wang_claim,
        "wang_state": trust_suspicion.get_stage_description() if trust_suspicion.wang_claim else "",
        "verified_evidence": list(trust_suspicion.verified_evidence) if trust_suspicion.wang_claim else [],
        "recent_memories": [e["summary"] for e in memory.episodic[-5:]],
        "last_thought": tc.last_thought if tc else "",
    })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get('message', '')
    if not user_input: return jsonify({"reply": "……（他沉默着，没有回答）"}), 400
    raw = engine.process(user_input)
    return jsonify({"reply": raw.strip()})

def run_cli():
    print("=" * 40)
    print("冷旭帆 CLI 调试模式 v5.4")
    print(f"初始情绪: {perception.emotion:.1f}")
    print("输入 /state /mem /scene /relation /exit")
    print("=" * 40)
    while True:
        try: user_input = input("\n你: ")
        except: break
        cmd = user_input.strip()
        if cmd.lower() in ["/exit","/quit"]: break
        elif cmd == "/state":
            print(f"情绪:{perception.emotion:.1f} 身体:{body_state.get_status_summary()} 心理:{mind_state.get_status_summary()}")
            continue
        elif cmd == "/mem": print(f"事实:{memory.facts} 情景:{memory.get_recent_episodes(5)}"); continue
        elif cmd == "/scene": print(f"场景:{scene_engine.get_prompt_context()}"); continue
        elif cmd == "/relation":
            print(f"关系:{relationship_dynamics.get_stage_summary()}")
            if trust_suspicion.wang_claim: print(f"望仔:{trust_suspicion.get_stage_description()}")
            continue
        print(f"冷旭帆: {engine.process(user_input)}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--cli", action="store_true")
    args = parser.parse_args()
    if args.cli: run_cli()
    else:
        port = int(os.environ.get('PORT', 5000))
        info(f"启动 Web 服务，端口 {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
