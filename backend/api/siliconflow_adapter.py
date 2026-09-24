"""通用 API 适配器 - 含 JSON 事件日志 + SSE 流式调用"""
import json
import time
import requests
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


def call_ai_stream(messages, api_key, api_url, model, max_tokens=120, temperature=0.7):
    """SSE 流式调用：逐块 yield 模型输出的文本增量。

    - 使用 requests.post(..., stream=True) 读取 OpenAI 兼容的 data: 行；
    - 仅 yield 真实文本块（choices[0].delta.content），不产出兜底文案，
      平台级兜底/故障切换由 ModelRouter.call_stream 负责；
    - 连接成功但中途断流时不向上抛异常（保留已产出内容），
      尚未产出任何内容时调用方可据此切换下一个平台。
    """
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 0.9,
        "stream": True,
    }
    start_time = time.time()
    try:
        resp = requests.post(
            api_url, headers=headers, json=payload,
            timeout=(10, 60), stream=True,
        )
        if resp.status_code != 200:
            error(f"Stream API {resp.status_code}: {resp.text[:100]}")
            json_event(
                "api_call", model=model, status="stream_failed",
                status_code=resp.status_code,
                elapsed=round(time.time() - start_time, 3),
            )
            return

        # SSE 规范强制 UTF-8；不依赖 iter_lines(decode_unicode=True)，
        # 因为 text/event-stream 未声明 charset 时 requests 会退回 ISO-8859-1。
        for raw_line in resp.iter_lines():
            if not raw_line:
                continue
            line = raw_line.decode("utf-8", errors="replace").strip()
            if not line.startswith("data:"):
                continue
            data_str = line[len("data:"):].strip()
            if data_str == "[DONE]":
                break
            try:
                chunk = json.loads(data_str)
                delta = chunk["choices"][0].get("delta", {}).get("content")
            except (ValueError, KeyError, IndexError, TypeError):
                continue
            if delta:
                yield delta

        json_event(
            "api_call", model=model, status="stream_success",
            elapsed=round(time.time() - start_time, 3),
        )
    except Exception as e:
        # 流式读取中途异常：容错点放在读取循环内部，不硬中断整条对话链路
        error(f"流式请求异常: {e}")
        json_event(
            "api_call", model=model, status="stream_exception", error=str(e),
            elapsed=round(time.time() - start_time, 3),
        )
