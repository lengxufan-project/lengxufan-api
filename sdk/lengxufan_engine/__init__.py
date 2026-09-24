"""lengxufan-engine SDK：加载 character.json 即可对话的 AI NPC 引擎。

快速开始：
    from lengxufan_engine import Engine

    engine = Engine.from_character(
        "character.json",
        api_key="sk-...",
        api_url="https://api.deepseek.com/v1/chat/completions",
        model="deepseek-chat",
    )
    print(engine.chat("你好"))
"""
from .engine import Engine

__all__ = ["Engine"]
__version__ = "0.1.0"
