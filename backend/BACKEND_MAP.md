# 冷旭帆后端地图

> 生成时间：2026-09-02
> 范围：仅限 `backend/` 目录
> 说明：本文档帮助开发者快速理解后端结构和维护方式

---

## 一、目录结构总览

```
backend/
├── app.py                          # Flask 应用工厂
├── run.py                          # 入口（Web/CLI 双模式）
├── config.py                       # Flask 配置（SQLite 路径、密钥）
├── config.yaml                     # 角色与 API 参数配置
├── models.py                       # SQLAlchemy 数据模型（User / Conversation）
├── world_state.py                  # 共享世界状态单例（时间/天气/活动）
├── event_bus.py                    # 事件总线单例（角色间消息传递）
├── requirements.txt                # Python 依赖
├── __init__.py
│
├── api/                            # API 适配层（多平台模型调用）
│   ├── __init__.py
│   ├── model_registry.py           # 模型注册表（qwen、glm、deepseek、ollama、siliconflow）
│   ├── router.py                   # 智能路由（故障切换 + 缓存验证）
│   └── siliconflow_adapter.py      # 通用 API 适配器（HTTP 调用 + JSON 日志）
│
├── characters/                     # 角色注册中心
│   ├── __init__.py
│   ├── roster.py                   # 角色名册（宿舍成员、特殊关系）
│   ├── lengxufan/                  # 冷旭帆角色目录
│   │   ├── __init__.py
│   │   └── data/
│   │       ├── __init__.py
│   │       └── character.json      # 角色数据（人格/记忆/关系阶段）
│   ├── huangjingyun/               # 黄景云角色目录
│   │   ├── __init__.py
│   │   └── data/
│   │       ├── __init__.py
│   │       └── character.json
│   └── yeqingci/                   # 叶清辞角色目录
│       ├── __init__.py
│       └── data/
│           ├── __init__.py
│           └── character.json
│
├── cognition/                      # 认知层（共享）
│   ├── __init__.py
│   ├── spacetime.py                # 时空上下文
│   ├── intention.py                # 用户意图解析
│   └── relationships.py            # 关系图谱
│
├── infra/                          # 基础设施层
│   ├── __init__.py
│   ├── logger.py                   # 日志系统（可读日志 + JSON 事件日志）
│   ├── persistence.py              # 持久化（JSON 文件保存/加载）
│   └── time_utils.py               # 时间工具（模拟时间、相对时间）
│
├── lengxufan_core/                 # 核心引擎（角色独立实例）
│   ├── __init__.py                 # 导出 Perception / Memory / IdentityState / BehaviorEngine / DialogueEngine
│   ├── behavior.py                 # 行为引擎（选择动作/回复）
│   ├── character_context.py        # 角色上下文（全局线程安全切换）
│   ├── dialogue_engine.py          # 对话引擎主流程（四阶段处理链）
│   ├── group_chat.py               # 群聊管理器（多角色对话）
│   ├── identity.py                 # 身份状态（信任值/Wang Claim）
│   ├── memory.py                   # 记忆系统（情景记忆/事实记忆）
│   ├── perception.py               # 感知系统（情绪值/生物节律/时间推进）
│   ├── prompt_builder.py           # Prompt 构建器（系统提示 + 消息组装）
│   ├── social_network.py           # 社交网络
│   ├── user_state.py               # 用户状态
│   ├── working_memory.py           # 工作记忆
│   ├── character_state/            # 角色状态子模块
│   │   ├── __init__.py
│   │   ├── body_state.py           # 身体状态
│   │   ├── mind_state.py           # 心理状态
│   │   └── relationship_dynamics.py# 关系动态
│   └── cognition/                  # 认知子模块
│       ├── __init__.py
│       ├── context_analyzer.py     # 上下文分析器
│       ├── inner_monologue.py      # 内心独白
│       ├── scene_engine.py         # 场景引擎
│       ├── thought_chain.py        # 思考链
│       ├── trust_suspicion.py      # 信任/怀疑引擎
│       └── trust_sync.py           # 信任同步
│
├── routes/                         # 路由层（API 端点）
│   ├── __init__.py                 # 注册所有蓝图
│   ├── achievement_routes.py       # /api/achievements
│   ├── auth_routes.py             # /api/auth/*（登录/注册/游客/登出/当前用户）
│   ├── character_routes.py         # /api/characters/*（列表/状态/详情/记忆）
│   ├── chat_routes.py             # /api/chat, /api/group_chat
│   ├── dev_routes.py              # /api/dev/stats（开发者调试）
│   ├── history_routes.py          # /api/conversations（对话历史）
│   ├── notification_routes.py     # /api/notifications
│   └── state_routes.py            # /api/state
│
├── services/                       # 服务层
│   ├── __init__.py
│   ├── background_service.py       # 后台离线生活线程（定时推进角色状态）
│   ├── engine_service.py           # 引擎服务（初始化/缓存/状态收集/群聊管理器）
│   └── user_service.py             # 用户服务（注册/登录/游客）
│
├── tests/                          # 测试套件
│   ├── test_core_logic.py          # 核心逻辑单元测试
│   ├── test_runner.py              # 测试运行器
│   ├── test_100_turns.py           # 100 轮对话压力测试
│   ├── scene_*.txt                 # 场景测试数据
│   └── test_*.txt                  # 对话测试数据
│
└── tools/                          # 开发工具脚本
    ├── ai_ai_multi_test.py         # AI-AI 多角色对测
    ├── api_group_chat_verify.py    # API 群聊验证
    ├── convert_character_to_json.py# 角色数据格式转换
    ├── engineering_check.py        # 工程检查
    ├── final_check.py              # 最终检查
    ├── full_frontend_backend_check.py # 全链路检查
    ├── full_validation.py          # 全量验证
    ├── import_character_md.py      # 从 Markdown 导入角色
    ├── multi_char_test.py          # 多角色测试
    ├── quick_check.py              # 快速检查
    ├── stress_test_multi_char.py   # 多角色压力测试
    ├── test_group_chat.py          # 群聊测试
    ├── verify_chat_history.py      # 聊天历史验证
    ├── verify_group_chat_live.py   # 群聊现场验证
    ├── verify_isolation.py         # 角色隔离验证
    ├── verify_new_endpoints.py     # 新端点验证
    └── view_memory.py              # 记忆查看
```

---

## 二、各模块功能说明

### 2.1 入口层（`app.py` / `run.py`）

| 文件 | 功能 |
|------|------|
| `app.py` | Flask 应用工厂。创建 Flask 实例、配置 CORS、初始化数据库、注册路由、提供前端静态文件服务 |
| `run.py` | 双模式入口。`python run.py` 启动 Web 服务（端口 5000），`python run.py --cli` 启动 CLI 调试模式 |
| `config.py` | Flask 配置。从 `paths.py` 读取 `RUNTIME_DIR`，拼接 SQLite 数据库路径 |
| `config.yaml` | 角色默认参数（姓名/学院/房间）、API 参数（max_tokens/temperature/retries）、规则参数（情绪/记忆/意图） |

### 2.2 数据模型层（`models.py`）

- **`User`**：用户表（`users`），字段：id, username, password_hash, is_guest, role, created_at
- **`Conversation`**：对话表（`conversations`），字段：id, user_id, role, content, annotation, state_snapshot, created_at

### 2.3 共享状态层（`world_state.py` / `event_bus.py`）

| 文件 | 功能 |
|------|------|
| `world_state.py` | `WorldState` 单例。全局共享的时间（模拟时间 1 现实小时=1 模拟天）、天气（晴/阴/小雨/风）、地点事件、室友活动（8 人） |
| `event_bus.py` | `EventBus` 单例。发布/订阅模式，角色间事件传递。支持订阅特定事件类型或通配符 `*` |

### 2.4 基础设施层（`infra/`）

| 文件 | 功能 |
|------|------|
| `logger.py` | 双输出日志系统：可读日志（`data/runtime/logs/lengxufan_YYYYMMDD.log`）+ JSON 结构化事件日志（`events.jsonl`） |
| `persistence.py` | JSON 文件持久化。`save_full_state()` / `load_full_state()`，每个角色独立保存文件（`save_{char_id}.json`） |
| `time_utils.py` | 模拟时间工具。`get_simulated_time()` / `days_since()` / `relative_time()` |

### 2.5 API 适配层（`api/`）

| 文件 | 功能 |
|------|------|
| `model_registry.py` | 模型注册表，支持 5 个平台：阿里云 qwen-plus、智谱 GLM-4-Flash、DeepSeek、Ollama 本地、硅基流动。自动加载 `.env` 文件 |
| `router.py` | `ModelRouter` 智能路由。按优先级轮询，失败自动切换，缓存已验证模型，10 秒内重试 |
| `siliconflow_adapter.py` | 通用 HTTP 调用适配器。支持重试、超时、JSON 事件日志 |

### 2.6 角色系统（`characters/`）

| 文件 | 功能 |
|------|------|
| `roster.py` | 角色名册。307 室 8 人名单、特殊角色关系（冷旭帆→陆华望"望仔"、叶清辞→黄景云"阿辞"） |
| `__init__.py` | 导出 `CharacterRegistry` 注册中心 |
| 各角色目录 | 每个角色一个目录，含 `data/character.json`，包含 persona、autobiographical_memories、milestones、relationship_stages 等 |

### 2.7 核心引擎（`lengxufan_core/`）

| 文件 | 功能 |
|------|------|
| `perception.py` | 感知系统。情绪值（0-85）、生物节律、时间推进、情绪衰减 |
| `memory.py` | 记忆系统。情景记忆（episodic）+ 语义记忆（facts），最近 3 条 + 上限 50 条 |
| `identity.py` | 身份状态。信任值（trust_level）、Wang Claim（望仔身份验证） |
| `behavior.py` | 行为引擎。根据状态选择动作/回复类型 |
| `dialogue_engine.py` | 对话引擎主流程。四阶段处理链：场景感知→上下文分析→信任验证→生成输出 |
| `group_chat.py` | 群聊管理器。多角色对话、插话概率、上下文维护 |
| `prompt_builder.py` | Prompt 构建器。组装系统提示和消息列表 |
| `character_context.py` | 角色上下文。全局线程安全的角色切换 |
| `social_network.py` | 社交网络 |
| `user_state.py` | 用户状态管理 |
| `working_memory.py` | 工作记忆（短期） |
| `character_state/` | 角色状态子模块：身体状态（body_state.py）、心理状态（mind_state.py）、关系动态（relationship_dynamics.py） |
| `cognition/` | 认知子模块：上下文分析（context_analyzer.py）、内心独白（inner_monologue.py）、场景引擎（scene_engine.py）、思考链（thought_chain.py）、信任/怀疑（trust_suspicion.py）、信任同步（trust_sync.py） |

### 2.8 认知层（`cognition/`）

| 文件 | 功能 |
|------|------|
| `spacetime.py` | 时空上下文。`SpaceTimeContext` 单例 |
| `intention.py` | 用户意图解析。`ParsedIntention` / `parse_user_intention()` |
| `relationships.py` | 关系图谱。`Relationship` / `RelationshipGraph` |

### 2.9 服务层（`services/`）

| 文件 | 功能 |
|------|------|
| `engine_service.py` | 引擎服务。引擎实例缓存（`_engine_cache`）、状态快照、跨角色事件注册、群聊管理器 |
| `user_service.py` | 用户服务。注册、登录、创建游客、按 ID 查询 |
| `background_service.py` | 后台离线生活线程。每 60 秒推进所有角色时间，触发自主活动 |

### 2.10 路由层（`routes/`）

详见下文"API 接口清单"。

---

## 三、模块依赖关系

```
run.py
 └── app.py ──┬── config.py
              ├── models.py (db)
              ├── routes/__init__.py (注册蓝图)
              ├── paths.py (路径常量)
              └── services/background_service.py
                    └── services/engine_service.py
                          ├── api/router.py
                          │     ├── api/model_registry.py
                          │     └── api/siliconflow_adapter.py
                          ├── lengxufan_core/*
                          │     ├── perception.py
                          │     ├── memory.py
                          │     ├── identity.py
                          │     ├── behavior.py
                          │     ├── dialogue_engine.py
                          │     ├── prompt_builder.py
                          │     ├── group_chat.py
                          │     ├── character_context.py
                          │     ├── character_state/*.py
                          │     └── cognition/*.py
                          ├── cognition/*.py
                          ├── characters/roster.py
                          ├── characters/__init__.py (CharacterRegistry)
                          ├── world_state.py
                          ├── event_bus.py
                          └── infra/persistence.py

routes/ 各蓝图
 ├── auth_routes.py → services/user_service.py → models.py
 ├── chat_routes.py → services/engine_service.py → models.py
 ├── character_routes.py → services/engine_service.py → characters/roster.py
 ├── state_routes.py → services/engine_service.py
 ├── notification_routes.py → world_state.py, event_bus.py
 ├── history_routes.py → models.py
 ├── achievement_routes.py → models.py
 └── dev_routes.py → api/router.py, event_bus.py, world_state.py
```

---

## 四、API 接口清单

详见 [docs/API_CONTRACT.md](docs/API_CONTRACT.md)，此处仅列出路由文件与端点对应关系。

| 路由文件 | 端点前缀 | 方法 | 路径 | 作用 |
|----------|---------|------|------|------|
| `auth_routes.py` | `/api/auth` | POST | `/register` | 用户注册 |
| | | POST | `/login` | 用户登录 |
| | | POST | `/guest` | 游客登录 |
| | | POST | `/logout` | 登出 |
| | | GET | `/me` | 获取当前登录用户信息 |
| `chat_routes.py` | `/api` | POST | `/chat` | 单角色对话 |
| | | POST | `/group_chat` | 群聊（所有角色依次回复） |
| `state_routes.py` | `/api` | GET | `/state` | 获取世界状态和角色状态快照 |
| `character_routes.py` | `/api` | GET | `/characters` | 角色列表 |
| | | GET | `/characters/status` | 所有角色状态摘要 |
| | | GET | `/characters/<char_id>` | 角色详细信息 |
| | | GET | `/characters/<char_id>/memories` | 角色记忆列表 |
| | | GET | `/characters/<char_id>/debug-trust` | 调试信任值 |
| `history_routes.py` | `/api` | GET | `/conversations` | 对话历史列表 |
| | | PUT | `/conversations/<id>/annotate` | 标注对话消息 |
| `notification_routes.py` | `/api` | GET | `/notifications` | 通知和活动数据 |
| `achievement_routes.py` | `/api` | GET | `/achievements` | 成就列表（当前为空） |
| `dev_routes.py` | `/api` | GET | `/dev/stats` | 开发者统计信息 |

---

## 五、配置文件和 .env 说明

### 5.1 `config.yaml`
角色默认参数和 API 调用参数，位于 `backend/config.yaml`。

### 5.2 `backend/config.py`
Flask 应用配置。从 `paths.py` 读取 `RUNTIME_DIR`，拼接 SQLite 数据库路径。

### 5.3 `.env` 文件
API Key 配置文件，支持两个位置（优先级从高到低）：
- `backend/.env`
- 项目根目录 `.env`

已写入 `.gitignore`，不提交到 Git。

**需要设置的 Key**：
| 环境变量 | 对应模型 | 获取方式 |
|----------|---------|----------|
| `ALIBABA_API_KEY` | 阿里云 qwen-plus | 阿里云百炼平台 |
| `GLM_API_KEY` | 智谱 GLM-4-Flash 免费 | 智谱开放平台 |
| `DEEPSEEK_API_KEY` | DeepSeek Chat | DeepSeek 平台 |
| `SILICONFLOW_API_KEY` | 硅基流动 Qwen2.5-7B | 硅基流动平台 |
| `OLLAMA_API_KEY` | Ollama 本地（默认值 "ollama"） | 本地部署 |

---

## 六、修改某功能时应该改哪个文件

| 需求 | 修改文件 |
|------|----------|
| 新增 API 接口 | 在 `routes/` 下新建或修改对应路由文件，然后在 `routes/__init__.py` 注册 |
| 修改角色对话逻辑 | `lengxufan_core/dialogue_engine.py` |
| 修改情绪系统 | `lengxufan_core/perception.py` |
| 修改记忆系统 | `lengxufan_core/memory.py` |
| 修改信任系统 | `lengxufan_core/identity.py` + `lengxufan_core/cognition/trust_suspicion.py` |
| 修改角色数据 | `characters/<char_id>/data/character.json` |
| 新增角色 | 1. 在 `characters/` 下新建目录 2. 创建 `data/character.json` 3. 确认 `CharacterRegistry.load_all()` 能自动扫描 |
| 修改角色名册 | `characters/roster.py` |
| 修改世界状态 | `world_state.py` |
| 修改事件总线 | `event_bus.py` |
| 修改 AI 模型调用 | `api/model_registry.py`（注册表）或 `api/router.py`（路由逻辑） |
| 修改持久化逻辑 | `infra/persistence.py` |
| 修改日志 | `infra/logger.py` |
| 修改后台离线生活 | `services/background_service.py` |
| 修改用户认证 | `services/user_service.py` 或 `routes/auth_routes.py` |
| 修改数据库模型 | `models.py`（改完后需删除旧 `lengxufan.db` 重建） |
| 修改引擎初始化 | `services/engine_service.py` |
| 添加测试 | `tests/` 下新建或修改测试文件 |
| 修改 API 参数 | `config.yaml`（max_tokens、temperature 等） |
| 新增 API 平台 | `api/model_registry.py` 添加新平台配置 |
| 修改前端对应 API | 参考 `docs/API_CONTRACT.md` 和 `frontend/FRONTEND_MAP.md` |