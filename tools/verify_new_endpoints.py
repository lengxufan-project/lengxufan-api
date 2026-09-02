import requests

base = "http://127.0.0.1:5000"

for path in ["/api/achievements", "/api/dev/stats"]:
    try:
        resp = requests.get(base + path, timeout=10)
        print(f"{path} -> {resp.status_code}")
        if resp.status_code == 200:
            print(resp.json())
    except Exception as e:
        print(f"{path} 请求失败: {e}")