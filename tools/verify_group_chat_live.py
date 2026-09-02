import requests, json

base = "http://127.0.0.1:5000"
resp = requests.post(base + "/api/group_chat", json={"message": "今天大家心情怎么样？"}, timeout=60)
print(f"HTTP {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    for item in data["replies"]:
        print(f"\n[{item['type']}] {item['name']}:")
        print(item["reply"][:200])
else:
    print(resp.text[:300])