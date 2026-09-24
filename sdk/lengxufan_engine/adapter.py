"""OpenAI 兼容 Chat Completions 适配器（同步 + SSE 流式）。

仅依赖 requests，不依赖 Flask，方便 SDK 独立发布到 PyPI。
"""
from __future__ import annotations

import json
from typing import Iterator, List, Dict, Optional

import requests

SILENT_FALLBACK = "……（他沉默着，没有回答）"


def call_ai(
    messages: List[Dict[str, str]],
    api_key: str,
    api_url: str,
    model: str,
    max_tokens: int = 120,
    temperature: float = 0.7,
    timeout: int = 30,
) -> str:
    """一次性返回完整回复。失败时返回沉默兜底文案。"""
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 0.9,
    }
    try:
        resp = requests.post(api_url, headers=headers, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return SILENT_FALLBACK


def call_ai_stream(
    messages: List[Dict[str, str]],
    api_key: str,
    api_url: str,
    model: str,
    max_tokens: int = 120,
    temperature: float = 0.7,
) -> Iterator[str]:
    """SSE 流式调用，逐块 yield choices[0].delta.content 文本。"""
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 0.9,
        "stream": True,
    }
    with requests.post(
        api_url, headers=headers, json=payload,
        timeout=(10, 60), stream=True,
    ) as resp:
        resp.raise_for_status()
        # SSE 规范强制 UTF-8；不能依赖 iter_lines(decode_unicode=True)，
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
                delta: Optional[str] = chunk["choices"][0].get("delta", {}).get("content")
            except (ValueError, KeyError, IndexError, TypeError):
                continue
            if delta:
                yield delta
