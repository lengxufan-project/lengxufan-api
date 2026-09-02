import requests

r = requests.post(
    "http://127.0.0.1:5000/api/group_chat",
    json={"message": "今天大家心情怎么样？"},
    timeout=60
)
print("HTTP", r.status_code)
if r.status_code == 200:
    data = r.json()
    for item in data["replies"]:
        typ = item.get("type", "?")
        name = item["name"]
        reply = item["reply"][:120].replace("\n", " ")
        print(f"[{typ}] {name}: {reply}")
else:
    print(r.text[:500])