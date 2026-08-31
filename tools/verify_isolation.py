import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.engine_service import EngineService
from infra.persistence import get_save_path

chars = ['lengxufan', 'huangjingyun', 'yeqingci']
test_msg = "你现在感觉怎么样？"

for cid in chars:
    print(f"\n{'='*50}")
    print(f"角色: {cid}")
    engine = EngineService(char_id=cid)
    reply = engine.get_reply(test_msg)
    print("回复:", reply)
    print("状态文件:", get_save_path(cid))
    state = engine.get_state_snapshot()
    print("情绪值:", state.get('emotion'))
    print("身体状态:", state.get('body'))
    print("心理状态:", state.get('mind'))