"""后台离线生活服务 - 让角色在没有用户对话时也能自主活动"""
import time
import threading
from infra.logger import info, warning
from services.engine_service import EngineService, get_engine

def background_life_loop(interval_seconds=60):
    """后台循环：定期推进所有角色的时间，触发自主活动"""
    while True:
        for char_id in ["lengxufan", "huangjingyun", "yeqingci"]:
            try:
                engine = get_engine(char_id)
                # 显式切换角色上下文，防止后台线程串味
                from lengxufan_core.character_context import set_current_character
                set_current_character(engine.char_config)
                # 推进时间，触发后台事件/状态衰减
                triggered = engine.perception.advance_time()
                # 保存状态
                engine.engine._save()
                if triggered:
                    for ev in triggered:
                        info(f"[离线] {engine.char_config.name}: {ev}")
                else:
                    info(f"[离线] {engine.char_config.name}: 安静地待着")
            except Exception as e:
                warning(f"[离线] {char_id} 活动推进失败: {e}")
        time.sleep(interval_seconds)

def start_background_life(interval_seconds=60):
    """启动后台生活线程（daemon，随主进程退出）"""
    t = threading.Thread(target=background_life_loop, args=(interval_seconds,), daemon=True)
    t.start()
    info(f"[后台] 离线生活线程已启动，间隔 {interval_seconds} 秒")
    return t