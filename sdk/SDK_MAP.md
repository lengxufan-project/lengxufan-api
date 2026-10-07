# SDK_MAP — sdk/ 对外 SDK 地图

> **这份文档是什么**：`sdk/` 目录的模块地图。说明 SDK 包结构、五个源码文件各自职责、与 `backend/` 的边界（重要）、以及发版流程在哪看。
> **谁该看**：要改 SDK / 发新版 / 把引擎集成到自己项目的人。
> **看完能做什么**：知道改 `engine.py` 还是 `adapter.py`；明确「SDK 与后端是两份独立代码，改一边不影响另一边」；知道发版步骤去 [sdk/README.md](README.md) 查。

> 核实日期：2026-10-07（基于当日实际文件清单；`dist/`、`*.egg-info/` 为构建产物）

---

## 一、目录结构

```
sdk/
├── setup.py                   # 打包配置（name=lengxufan-engine, version=0.1.0）
├── README.md                  # SDK 使用手册 + 发版步骤（对外文档）
├── lengxufan_engine/          # Python 包主体
│   ├── __init__.py            # 导出 Engine 类 + __version__ = "0.1.0"
│   ├── engine.py              # 核心：Engine 类（对话 / 流式 / 历史 / 系统提示）
│   └── adapter.py             # OpenAI 兼容 HTTP 适配器（call_ai / call_ai_stream）
├── world_state.py             # WorldState 单例（世界天数/时段/天气/室友活动）
├── event_bus.py               # EventBus 单例（publish/subscribe，支持 "*"）
├── dist/                      # 构建产物（wheel/sdist），发版时生成
└── lengxufan_engine.egg-info/ # 构建产物（元数据），勿手改
```

---

## 二、源码文件职责表

| 文件 | 职责 | 改它会影响 |
|---|---|---|
| [lengxufan_engine/engine.py](lengxufan_engine/engine.py) | `Engine` 类：`from_character()` 从 character.json 加载角色；从 `persona.system_prompt`（或 persona 基础字段 + 自传记忆）构建系统提示；内置最近 `max_history`（默认 10）轮短期历史；`chat()` 一次性回复 + `chat_stream()` 流式回复 | SDK 的对话行为全在这里；参数：max_tokens=120、temperature=0.7 |
| [lengxufan_engine/adapter.py](lengxufan_engine/adapter.py) | OpenAI 兼容 Chat Completions 调用（同步 + SSE），仅依赖 `requests`（刻意不依赖 Flask，便于独立发布）；失败返回兜底文案 `SILENT_FALLBACK`（"……（他沉默着，没有回答）"） | 换 LLM 供应商/协议时改这里 |
| [lengxufan_engine/\_\_init\_\_.py](lengxufan_engine/__init__.py) | 包入口：`from lengxufan_engine import Engine`；维护 `__version__` | 若新增导出类需同步这里与 setup.py |
| [world_state.py](world_state.py) | `WorldState` 全局单例：模拟天数、时段、天气、宿舍活动；无第三方依赖 | SDK 用户多角色共享世界状态时用；**不是后端世界系统的副本替换** |
| [event_bus.py](event_bus.py) | `EventBus` 全局单例：`subscribe` / `publish` 事件，支持 `"*"` 通配符；保留最近 50 条事件日志；无第三方依赖 | SDK 内角色间消息传递 |
| [setup.py](setup.py) | 打包元数据：name `lengxufan-engine`、version `0.1.0`、Apache-2.0、Python >=3.11；`install_requires`：Flask>=3.0、chromadb>=0.4.0、requests>=2.28 | 发版改 version；依赖声明在此 |

> `world_state.py` 与 `event_bus.py` 通过 `py_modules` 以**顶层模块**发布（不放进包内），导入方式是 `from world_state import WorldState` 而不是 `from lengxufan_engine.world_state import ...`。

---

## 三、与 backend/ 的边界（重要）

- **两份独立代码**：SDK 是「精简版 + 可独立发布」——它**不 import `backend/` 的任何模块**，也不读写后端的数据库/存档。`backend/` 里存在同名概念（Engine/世界状态/事件机制）的**完整实现**，二者互不影响。
- **改后端的情绪/记忆/信任系统 ≠ 改 SDK**：SDK 目前只有「人格提示 + 短期历史 + LLM 调用」，没有情绪值、记忆库、信任验证等后端能力。如果目标是「SDK 用户也能获得完整引擎」，那是**新增功能**，不是改一改的事。
- **共享的唯一约定**：`character.json` 数据格式（SDK 读同一个文件格式）。角色数据格式变更时，两边都要检查。[docs/ADD_NEW_CHARACTER.md](../docs/ADD_NEW_CHARACTER.md) 是数据格式的权威说明。
- **打包边界**：`setup.py` 会打包 `lengxufan_engine` 包 + `world_state`/`event_bus` 两个模块；`dist/`、`egg-info/`、`__pycache__/` 是产物不要手动编辑或提交。

---

## 四、当前状态与发版

1. **版本 0.1.0 已发布**（最近提交「SDK release」），`dist/` 内有构建产物。
2. **安装与使用**：`pip install lengxufan-engine`（或本地 `pip install ./sdk`）；最小示例、自定义角色、发版打包步骤都在 [sdk/README.md](README.md)，本文件不重复。
3. **依赖声明注意**：`install_requires` 包含 Flask 与 chromadb，但 `adapter.py` 自述「仅依赖 requests」——若你关心包体积，可核对后精简（改前先确认无其他隐式依赖）。

---

## 五、扩展区（以后自己加内容时）

- [ ] 新模块（如 `memory.py`、`emotion.py`）：放 `lengxufan_engine/` 包内，并更新 `__init__.py` 导出与 setup.py
- [ ] 版本号两处要同步：`setup.py` 的 `version` 与 `lengxufan_engine/__init__.py` 的 `__version__`
- [ ] 若未来 SDK 与后端共享代码，需要先设计抽取层，避免复制出第三份副本
- [ ] 发布到 PyPI 的账号/流程信息，建议补进 [sdk/README.md](README.md)（本文件只做指针）

---

## 相关文档

| 关系 | 文档 |
|---|---|
| 文档体系总图 | [DOCS_MAP.md](../DOCS_MAP.md) |
| SDK 使用手册 + 发版步骤（权威） | [sdk/README.md](README.md) |
| 角色数据格式 | [docs/ADD_NEW_CHARACTER.md](../docs/ADD_NEW_CHARACTER.md) |
| 后端引擎（完整版，对照看） | [backend/BACKEND_MAP.md](../backend/BACKEND_MAP.md) |
| 接口契约（Web 侧对话接口） | [docs/API_CONTRACT.md](../docs/API_CONTRACT.md) |
| 改动影响地图（场景 7 涉及 SDK） | [PROJECT_MAP.md](../PROJECT_MAP.md) |