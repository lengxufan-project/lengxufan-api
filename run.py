"""冷旭帆 启动器"""
import os, sys, re, argparse
from flask import Flask, request, jsonify, make_response

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lengxufan_core import Perception, Memory, IdentityState, BehaviorEngine, DialogueEngine, get_biorhythm
from api.router import router as model_router
from infra.persistence import load_full_state
from infra.logger import info

perception = Perception()
memory = Memory()
identity = IdentityState()
behavior = BehaviorEngine()
engine = DialogueEngine(perception, memory, identity, behavior, model_router)

saved = load_full_state()
if saved:
    perception = Perception.from_dict(saved)
    memory = Memory.from_dict(saved, saved.get("simulated_day",1))
    identity = IdentityState.from_dict(saved.get("identity_state",{}))
    engine = DialogueEngine(perception, memory, identity, behavior, model_router)
    info("存档已加载。")
else:
    perception.emotion = get_biorhythm()
    info("新游戏初始化。")

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get('message','')
    if not user_input: return jsonify({"reply":"……（他沉默着，没有回答）"}), 400
    raw = engine.process(user_input)
    clean = re.sub(r'<summary>.*?</summary>','',raw).strip()
    resp = make_response(jsonify({"reply":clean}))
    resp.headers['Content-Type'] = 'application/json; charset=utf-8'
    return resp

def run_cli():
    print("="*40)
    print("冷旭帆 CLI 调试模式")
    print(f"初始情绪: {perception.emotion:.1f}")
    print("输入 /state 查看状态 | /mem 查看记忆 | /exit 退出")
    print("="*40)
    while True:
        try: user_input = input("\n你: ")
        except: break
        if user_input.lower() in ["/exit","/quit"]: break
        elif user_input == "/state":
            print(f"情绪: {perception.emotion:.1f}")
            print(f"状态: {perception.status}")
            print(f"身份: {identity}")
            print(f"路由: {model_router.get_status()}")
            continue
        elif user_input == "/mem":
            print(f"事实: {memory.facts}")
            print(f"情景: {memory.get_recent_episodes(5)}")
            continue
        reply = engine.process(user_input)
        print(f"冷旭帆: {reply}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--cli", action="store_true")
    args = parser.parse_args()
    if args.cli: run_cli()
    else:
        port = int(os.environ.get('PORT',5000))
        info(f"启动 Web 服务，端口 {port}")
        app.run(host='0.0.0.0', port=port, debug=False)