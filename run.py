import os, sys, argparse
from app import create_app
from infra.logger import info
from services.background_service import start_background_life

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--cli", action="store_true")
    args = parser.parse_args()

    if args.cli:
        # CLI模式保持不变
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from services.engine_service import EngineService
        engine = EngineService()
        print("=" * 40)
        print("冷旭帆 CLI 调试模式 v5.5")
        print(f"初始情绪: {engine.perception.emotion:.1f}")
        print("输入 /state /mem /scene /relation /exit")
        print("=" * 40)
        start_background_life(interval_seconds=60)
        while True:
            try: user_input = input("\n你: ")
            except: break
            cmd = user_input.strip()
            if cmd.lower() in ["/exit","/quit"]: break
            elif cmd == "/state":
                print(f"情绪:{engine.perception.emotion:.1f} 身体:{engine.body_state.get_status_summary()} 心理:{engine.mind_state.get_status_summary()}")
                continue
            elif cmd == "/mem": print(f"事实:{engine.memory.facts} 情景:{engine.memory.get_recent_episodes(5)}"); continue
            elif cmd == "/scene": print(f"场景:{engine.scene_engine.get_prompt_context()}"); continue
            elif cmd == "/relation":
                print(f"关系:{engine.relationship_dynamics.get_stage_summary()}")
                if engine.trust_suspicion.wang_claim: print(f"望仔:{engine.trust_suspicion.get_stage_description()}")
                continue
            print(f"冷旭帆: {engine.get_reply(user_input)}")
    else:
        app = create_app()
        start_background_life(interval_seconds=60)
        port = int(os.environ.get('PORT', 5000))
        info(f"启动 Web 服务，端口 {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
