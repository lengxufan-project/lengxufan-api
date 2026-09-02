import requests, json

base = "http://127.0.0.1:5000"

# 1. 未登录访问 /api/conversations（预期 401 或空）
try:
    r = requests.get(base + "/api/conversations", timeout=10)
    print("未登录 /api/conversations:", r.status_code)
except Exception as e:
    print("未登录请求失败:", e)

# 2. 游客登录后获取历史（如果你尚未有历史，可能为空数组）
try:
    r_guest = requests.post(base + "/api/auth/guest", timeout=10)
    if r_guest.status_code == 200:
        session_cookie = r_guest.cookies
        r_hist = requests.get(base + "/api/conversations", cookies=session_cookie, timeout=10)
        print("游客 /api/conversations:", r_hist.status_code)
        data = r_hist.json()
        print("历史条数:", len(data) if isinstance(data, list) else "未知格式")
        if isinstance(data, list) and data:
            print("最新一条:", data[-1])
    else:
        print("游客登录失败:", r_guest.status_code)
except Exception as e:
    print("游客历史请求失败:", e)