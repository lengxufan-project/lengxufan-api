"""通用 API 适配器 - 含 JSON 事件日志"""
import time, requests
from infra.logger import error, json_event

def call_ai(messages, api_key, api_url, model, max_tokens=120, temperature=0.7, retries=1):
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens, "top_p": 0.9}
    start_time = time.time()
    for attempt in range(retries+1):
        try:
            time.sleep(0.5)
            resp = requests.post(api_url, headers=headers, json=payload, timeout=15)
            elapsed = time.time() - start_time
            if resp.status_code == 200:
                result = resp.json()["choices"][0]["message"]["content"].strip()
                json_event("api_call", model=model, status="success", elapsed=round(elapsed,3), attempt=attempt+1)
                return result
            else:
                error(f"API {resp.status_code}: {resp.text[:100]}")
                json_event("api_call", model=model, status="failed", status_code=resp.status_code, elapsed=round(elapsed,3), attempt=attempt+1)
                if attempt < retries:
                    time.sleep(2)
        except Exception as e:
            error(f"请求异常: {e}")
            json_event("api_call", model=model, status="exception", error=str(e), elapsed=round(elapsed,3), attempt=attempt+1)
            if attempt < retries:
                time.sleep(2)
    return "……（他沉默着，没有回答）"