"""通用 API 适配器"""
import time, requests
from infra.logger import error

def call_ai(messages, api_key, api_url, model, max_tokens=120, temperature=0.7, retries=2):
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens, "top_p": 0.9}
    for attempt in range(retries+1):
        try:
            time.sleep(0.5)
            resp = requests.post(api_url, headers=headers, json=payload, timeout=60)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
            else:
                error(f"API {resp.status_code}: {resp.text[:100]}")
                if attempt < retries: time.sleep(2)
        except Exception as e:
            error(f"请求异常: {e}")
            if attempt < retries: time.sleep(2)
    return "……（他沉默着，没有回答）"