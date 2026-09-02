import requests, json, sys, os
sys.path.insert(0, os.getcwd())

base = "http://127.0.0.1:5000"
print("=" * 60)
print("最终验证")
print("=" * 60)

# 1. /api/state
try:
    resp = requests.get(base + "/api/state", timeout=10)
    if resp.status_code == 200:
        print("✅ /api/state 正常")
    else:
        print(f"❌ /api/state -> {resp.status_code}")
except Exception as e:
    print(f"❌ /api/state 异常: {e}")

# 2. /api/characters
try:
    resp = requests.get(base + "/api/characters", timeout=10)
    if resp.status_code == 200:
        chars = resp.json()
        print(f"✅ /api/characters 正常，角色数: {len(chars)}")
    else:
        print(f"❌ /api/characters -> {resp.status_code}")
except Exception as e:
    print(f"❌ /api/characters 异常: {e}")

# 3. 群聊接口
try:
    resp = requests.post(base + "/api/group_chat", json={"message": "你好"}, timeout=30)
    if resp.status_code == 200:
        replies = resp.json().get("replies", [])
        print(f"✅ /api/group_chat 正常，回复数: {len(replies)}")
        for item in replies:
            if "出错" in item["reply"]:
                print(f"  ⚠️ {item['name']} 回复包含错误: {item['reply'][:80]}")
    else:
        print(f"❌ /api/group_chat -> {resp.status_code}")
except Exception as e:
    print(f"❌ /api/group_chat 异常: {e}")

# 4. 单角色对话验证（本地，不经过API）
from services.engine_service import EngineService
for cid in ["lengxufan", "huangjingyun", "yeqingci"]:
    try:
        engine = EngineService(char_id=cid)
        reply = engine.get_reply("你好")
        print(f"✅ {cid} 回复: {reply[:60]}")
    except Exception as e:
        print(f"❌ {cid} 失败: {e}")

print("=" * 60)
print("验证结束")