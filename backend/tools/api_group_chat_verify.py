import requests
base = "http://127.0.0.1:5000/api/group_chat"
resp = requests.post(base, json={"message": "今天天气怎么样？"}, timeout=30)
print(f"HTTP {resp.status_code}")
if resp.status_code == 200:
    for item in resp.json()["replies"]:
        print(f"\n[{item['name']}]")
        print(item["reply"][:200])
else:
    print(resp.text[:300])