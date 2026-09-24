"""角色对话引擎（SDK 精简版）。

设计原则：代码管里子，AI 管面子。
- 角色数据全部来自 character.json，逻辑代码内不硬编码任何角色信息；
- 从 character.json 的 persona.system_prompt（若存在）构建系统提示，
  否则用 persona 基础字段 + autobiographical_memories 拼出兜底提示；
- 内置短期对话历史（最近 max_history 轮）；
- 支持 chat() 一次性回复与 chat_stream() 流式回复。
"""
from __future__ import annotations

import json
import os
from typing import Iterator, List, Dict, Optional

from .adapter import call_ai, call_ai_stream, SILENT_FALLBACK


class Engine:
    def __init__(
        self,
        character_data: dict,
        api_key: str,
        api_url: str,
        model: str,
        max_tokens: int = 120,
        temperature: float = 0.7,
        max_history: int = 10,
    ):
        self.character_data = character_data or {}
        self.api_key = api_key
        self.api_url = api_url
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.max_history = max_history
        self.history: List[Dict[str, str]] = []
        self.system_prompt = self._build_system_prompt()

    # ------------------------------------------------------------------
    # 构造
    # ------------------------------------------------------------------
    @classmethod
    def from_character(
        cls,
        character_json_path: str,
        api_key: Optional[str] = None,
        api_url: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 120,
        temperature: float = 0.7,
    ) -> "Engine":
        """从 character.json 文件加载角色并初始化引擎。

        api_key/api_url/model 也可通过环境变量提供：
        LENGXUFAN_API_KEY / LENGXUFAN_API_URL / LENGXUFAN_MODEL
        """
        with open(character_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls(
            data,
            api_key=api_key or os.environ.get("LENGXUFAN_API_KEY", ""),
            api_url=api_url or os.environ.get(
                "LENGXUFAN_API_URL",
                "https://api.deepseek.com/v1/chat/completions",
            ),
            model=model or os.environ.get("LENGXUFAN_MODEL", "deepseek-chat"),
            max_tokens=max_tokens,
            temperature=temperature,
        )

    # ------------------------------------------------------------------
    # Prompt 构建（全部素材来自 character.json）
    # ------------------------------------------------------------------
    def _build_system_prompt(self) -> str:
        persona = self.character_data.get("persona", {}) or {}
        explicit = persona.get("system_prompt")
        if explicit:
            return explicit.strip()

        parts: List[str] = []
        name = persona.get("name", "角色")
        bits = []
        for label, key in (("代号", "code"), ("年龄", "age"),
                          ("学院", "academy"), ("房间", "room"),
                          ("性格", "trait")):
            if persona.get(key):
                bits.append(f"{label}{persona[key]}")
        if bits:
            parts.append(f"你是{name}，" + "，".join(bits) + "。")
        else:
            parts.append(f"你是{name}。")

        memories = self.character_data.get("autobiographical_memories") or []
        if memories:
            parts.append("【你的背景记忆】")
            for mem in memories[:10]:
                if isinstance(mem, str):
                    parts.append(f"- {mem}")
                elif isinstance(mem, dict) and mem.get("content"):
                    parts.append(f"- {mem['content']}")

        stages = self.character_data.get("relationship_stages") or []
        if stages:
            parts.append("【关系阶段】")
            for st in stages:
                if isinstance(st, dict) and st.get("stage"):
                    parts.append(f"- {st['stage']}")

        parts.append("用角色的口吻简短回应，不要超出角色设定。")
        return "\n".join(parts)

    def _build_messages(self, user_input: str) -> List[Dict[str, str]]:
        msgs: List[Dict[str, str]] = [{"role": "system", "content": self.system_prompt}]
        msgs.extend(self.history[-self.max_history * 2:])
        msgs.append({"role": "user", "content": user_input})
        return msgs

    # ------------------------------------------------------------------
    # 对话
    # ------------------------------------------------------------------
    def chat(self, user_input: str) -> str:
        """一次性返回完整回复，并把本轮对话写入短期历史。"""
        msgs = self._build_messages(user_input)
        reply = call_ai(
            msgs, self.api_key, self.api_url, self.model,
            max_tokens=self.max_tokens, temperature=self.temperature,
        )
        if reply and reply != SILENT_FALLBACK:
            self.history.append({"role": "user", "content": user_input})
            self.history.append({"role": "assistant", "content": reply})
        return reply

    def chat_stream(self, user_input: str) -> Iterator[str]:
        """流式回复：逐块 yield 文本增量；结束后把完整回复写入短期历史。"""
        msgs = self._build_messages(user_input)
        chunks: List[str] = []
        for delta in call_ai_stream(
            msgs, self.api_key, self.api_url, self.model,
            max_tokens=self.max_tokens, temperature=self.temperature,
        ):
            chunks.append(delta)
            yield delta
        full = "".join(chunks).strip()
        if full:
            self.history.append({"role": "user", "content": user_input})
            self.history.append({"role": "assistant", "content": full})

    def reset_history(self) -> None:
        """清空短期对话历史。"""
        self.history.clear()
