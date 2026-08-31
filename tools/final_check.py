import requests, sys, os, traceback
sys.path.insert(0, os.getcwd())

base = "http://127.0.0.1:5000"
print("=" * 60)
print("最终验证（修复后）")
print("=" * 60)

# /api/state
try:
    resp = requests.get(base + "/api/state", timeout=10)
    print(f"✅ /api/state -> {resp.status_code}" if resp.status_code == 200 else f"❌ /api/state -> {resp.status_code}")
except Exception as e:
    print(f"❌ /api/state 异常: {e}")

# /api/group_chat
try:
    resp = requests.post(base + "/api/group_chat", json={"message": "你好"}, timeout=30)
    if resp.status_code == 200:
        replies = resp.json().get("replies", [])
        print(f"✅ /api/group_chat 回复数: {len(replies)}")
        for item in replies:
            if "出错" in item["reply"]:
                print(f"  ⚠️ {item['name']} 仍有错误: {item['reply'][:80]}")
    else:
        print(f"❌ /api/group_chat -> {resp.status_code}")
except Exception as e:
    print(f"❌ /api/group_chat 异常: {e}")

print("=" * 60)