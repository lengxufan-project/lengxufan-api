# lengxufan-engine

> AI NPC 引擎 SDK —— 加载一个 `character.json`，就能和有记忆、有性格的角色对话。
> 架构理念：**代码管里子，AI 管面子**。

- Version: **0.1.0**
- License: Apache-2.0
- Python: **>= 3.11**

## 安装

```bash
pip install lengxufan-engine
```

本地从源码构建安装：

```bash
python -m pip install build
python -m build
pip install dist/lengxufan_engine-0.1.0-py3-none-any.whl
```

## 最小运行示例

```python
from lengxufan_engine import Engine

# 加载角色数据（character.json）+ 配置一个 OpenAI 兼容接口
engine = Engine.from_character(
    "characters/lengxufan/data/character.json",
    api_key="sk-xxxxxxxx",
    api_url="https://api.deepseek.com/v1/chat/completions",
    model="deepseek-chat",
)

# 一次性对话
reply = engine.chat("你好")
print(reply)

# 流式对话（打字机效果）
for delta in engine.chat_stream("今天过得怎么样？"):
    print(delta, end="", flush=True)
```

也可以用环境变量提供连接配置：

| 环境变量 | 说明 |
|----------|------|
| `LENGXUFAN_API_KEY` | API Key |
| `LENGXUFAN_API_URL` | OpenAI 兼容的 Chat Completions 地址 |
| `LENGXUFAN_MODEL` | 模型名 |

## 自定义角色

1. 新建一个角色目录，例如 `my_character/data/character.json`。
2. 至少提供 `persona` 字段；推荐直接写 `persona.system_prompt`（角色的全部"面子"由它定义）：

```json
{
  "persona": {
    "name": "小冷",
    "code": "冰刃",
    "age": 17,
    "academy": "潜龙学院",
    "room": "307室",
    "trait": "沉默寡言，防御性强，但内心敏感",
    "system_prompt": "你是小冷。说话极短，不主动表达情绪……"
  },
  "autobiographical_memories": [
    "我住在307室，宿舍里有七个人。"
  ],
  "relationship_stages": [
    { "stage": "陌生人", "trust_range": [0, 20] },
    { "stage": "朋友",   "trust_range": [40, 60] }
  ]
}
```

> 没有 `persona.system_prompt` 时，SDK 会用 `persona` 基础字段和
> `autobiographical_memories` 自动拼出兜底系统提示。角色数据一律来自
> JSON 文件，逻辑代码中不硬编码任何角色信息。

3. 加载并对话：

```python
engine = Engine.from_character("my_character/data/character.json",
                               api_key="sk-...", api_url="...", model="...")
print(engine.chat("你是谁？"))
```

## 包结构

```
lengxufan_engine/
├── __init__.py     # 导出 Engine
├── engine.py       # Engine：角色加载 / Prompt 构建 / chat / chat_stream
└── adapter.py      # OpenAI 兼容适配器（同步 + SSE 流式）
world_state.py      # 共享世界状态单例（时间/天气/室友活动）
event_bus.py        # 事件总线单例（发布订阅）
```

## 依赖

- Python >= 3.11
- Flask >= 3.0
- chromadb >= 0.4.0
- requests >= 2.28
