import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.engine_service import EngineService

chars = ['lengxufan', 'huangjingyun', 'yeqingci']
messages = [
    "你现在感觉怎么样？",
    "你认识陆华望吗？",
    "你最喜欢什么？",
]

# 创建三个引擎实例
engines = {}
for cid in chars:
    print(f"初始化 {cid}...")
    engines[cid] = EngineService(char_id=cid)
    print(f"{cid} 初始化完成，状态文件: save_{cid}.json")

print("\n" + "="*60)
for msg in messages:
    print(f"\n【用户】 {msg}")
    for cid in chars:
        try:
            reply = engines[cid].get_reply(msg)
            print(f"\n--- {cid} ---")
            print(reply)
        except Exception as e:
            print(f"\n--- {cid} 出错 ---")
            print(f"错误: {e}")
    print("="*60)