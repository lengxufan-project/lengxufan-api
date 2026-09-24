# PROJECT_MAP — 项目定位与改动影响地图

> 生成：2026-09-24 | 维护原则：目录/接口结构变了，先改本文件再改代码
> 用途：新人找入口、老手找文件、维护者查改动影响面

---

## 部分 1：项目一页纸

- **是什么**：AI NPC 情感引擎「冷旭帆」——一个有情绪、记忆、信任变化的角色对话系统（代号"冰刃"，版本 v5.5），当前处于可运行原型阶段。
- **技术栈**：Python 3.11 + Flask + SQLAlchemy(SQLite) + ChromaDB 后端；原生 HTML/CSS/JS 前端；Godot 4 客户端；独立 Python SDK（lengxufan-engine 0.1.0）。
- **核心思想**："代码管里子，AI 管面子"——代码精确控制情绪值/记忆/信任，大模型只负责生成自然语言。

数据流（一条消息的生命周期）：

```
用户输入（frontend/js/chat.js 或 godot/scripts/api_client.gd）
  → POST /api/chat（backend/routes/chat_routes.py）
  → EngineService（backend/services/engine_service.py，引擎缓存与分发）
  → DialogueEngine 四阶段链（backend/lengxufan_core/dialogue_engine.py）
      ① 场景感知 cognition/scene_engine.py
      ② 上下文分析 cognition/context_analyzer.py
      ③ 信任验证 identity.py + cognition/trust_suspicion.py
      ④ 思考链 cognition/thought_chain.py + prompt_builder.py
  → ModelRouter 故障切换（backend/api/router.py）
  → 外部 LLM（qwen / GLM / DeepSeek / 硅基流动 / Ollama）
  → 状态更新：情绪 perception.py、记忆 memory.py
  → 持久化：data/runtime/save/save_<id>.json（infra/persistence.py）
            data/runtime/lengxufan.db（models.py，用户表 + 对话表）
```

---

## 部分 2：文件夹管制地图

| 文件夹路径 | 管什么 | 什么情况下你会打开它 | 什么情况下不该动它 |
|---|---|---|---|
| `backend/` | Flask 后端全部：入口、配置、引擎、路由、角色数据 | 后端任何改动 | 前端问题别来这里找 |
| `backend/api/` | 大模型调用适配层：5 平台注册表、故障切换路由、HTTP 适配 | 换模型/加平台/调超时重试 | 情绪、信任等业务逻辑不写这里 |
| `backend/characters/` | 角色注册中心（CharacterRegistry + roster 名册 + 3 个角色目录） | 改人设/加角色/改关系名册 | 引擎逻辑不写角色目录 |
| `backend/characters/<id>/data/` | 单角色人设 JSON：persona、记忆、关系阶段、信任规则 | 改性格、台词风格、信任阈值 | 改完需重启且注意旧存档干扰 |
| `backend/infra/` | 基础设施：双格式日志、JSON 存档读写、模拟时间工具 | 改持久化格式/日志输出/时间规则 | 业务逻辑不写基础设施 |
| `backend/lengxufan_core/` | 核心引擎：对话链、情绪、记忆、信任、群聊、Prompt 组装 | 改角色"大脑"的任何行为 | HTTP 请求/响应不写这里 |
| `backend/lengxufan_core/cognition/` | 认知子模块：上下文分析、思考链、信任/怀疑、信任同步、场景引擎、内心独白 | 改角色"怎么想" | "怎么表达"去 prompt_builder.py |
| `backend/lengxufan_core/character_state/` | 身体状态、心理状态、关系动态 | 改状态字段或衰减规则 | — |
| `backend/routes/` | HTTP 路由层，只做请求/响应转换（18 个端点、8 个蓝图） | 加新接口、改参数校验 | 业务逻辑不写这里 |
| `backend/services/` | 服务编排：引擎初始化与实例缓存、用户服务、后台离线生活线程 | 改引擎装配/离线行为/用户流程 | 不直接写 SQL，数据模型只在 models.py |
| `backend/tests/` | 核心逻辑单测、100 轮压测、场景测试数据 | 回归验证核心逻辑 | — |
| `data/source/` | 源数据占位：characters/worldview/images/locations/relationships/events（当前全为空目录待填充） | 按规划填充世界观素材 | 别把运行时生成数据放这里 |
| `data/runtime/` | 运行时数据：角色存档 JSON、日志、ChromaDB 向量库、上传、SQLite，Git 忽略 | 排查运行状态、删存档重置角色 | 绝不提交 Git；格式由 persistence.py 定义，别手改 |
| `docs/` | 架构决策、构建部署、API 契约、新增角色指南、项目指南、踩坑记录 | 查约定/部署/排障 | 文档与代码冲突时以代码为准并回头修文档 |
| `frontend/` | 前端：4 个在线页面（index/chat/login/dev）+ css/ + js/ | 前端一切改动 | 后端逻辑不写这里 |
| `frontend/_archived/` | 23 个已归档旧页面（约 404/about/profile 等，只读存档） | 翻旧实现找参考 | 不修改、不删除、不新引用 |
| `godot/` | Godot 客户端：Room 场景、冷旭帆立绘 6 张、连接后端 /api/chat 的脚本 | 改 3D 场景/立绘/客户端交互 | Flask 逻辑不写这里 |
| `godot/.godot/` | Godot 编辑器自动生成的缓存（导入纹理、着色器缓存） | 永不手动打开 | 不提交、不手改，删除可重建 |
| `sdk/` | 独立发布的 Python 包 lengxufan-engine（加载 character.json 即可对话的最小引擎） | 改对外 SDK / 发版 | 别把 backend 私有逻辑搬进来；与 backend 同名文件（event_bus/world_state）是独立副本 |
| `tools/` | 项目级脚本：17 个后端验证/压测/角色导入脚本 + 工程检查 | 跑验证、批量测试、导入角色数据 | 生产逻辑不写工具目录 |
| `tools/deploy/` | 部署脚本占位（当前为空） | 建设部署自动化时 | — |

> 注 1：根目录无 `tests/` 文件夹，测试集中在 `backend/tests/` 与 `tools/backend-scripts/`。
> 注 2：`backend/BACKEND_MAP.md` 提到的 `backend/cognition/`（spacetime/intention/relationships）在实际代码中已不存在，对应能力位于 `backend/lengxufan_core/cognition/`。已按 2026-09-24 实际文件清单核实。

根目录文件速查：`paths.py` 全局路径常量 | `README.md` 快速启动+功能状态 | `PROJECT_OVERVIEW.md` 项目总览 | `DOCS_INDEX.md` 文档索引 | `_LOCAL_TOOLS.md` 本机工具路径（Godot 4.7.2 / Python 3.11）| `.gitignore`。

---

## 部分 3：核心文件清单（30 个）

| 文件路径 | 一句话职责 |
|---|---|
| `backend/run.py` | 启动入口：Web（5000 端口）/ `--cli` 调试双模式 |
| `backend/app.py` | Flask 工厂：CORS、建库、注册路由、前端静态文件服务 |
| `backend/config.py` | Flask 配置：SQLite 路径、SECRET_KEY |
| `backend/config.yaml` | 角色默认参数 + API 参数（max_tokens/temperature）+ 情绪/记忆规则参数 |
| `backend/models.py` | SQLAlchemy 模型：User 表 + Conversation 表 |
| `backend/world_state.py` | 世界状态单例：模拟时间（1 现实小时=1 模拟天）、天气、宿舍活动 |
| `backend/event_bus.py` | 事件总线单例：角色间发布/订阅（支持通配符） |
| `backend/routes/__init__.py` | 注册全部蓝图（18 个 API 端点的总入口） |
| `backend/routes/chat_routes.py` | `/api/chat` 单聊 + `/api/group_chat` 群聊 |
| `backend/routes/auth_routes.py` | 注册/登录/游客/登出/当前用户 |
| `backend/routes/character_routes.py` | 角色列表/状态/详情/记忆/信任调试接口 |
| `backend/routes/state_routes.py` | `/api/state` 世界+角色状态快照（前端信息条数据源） |
| `backend/services/engine_service.py` | 引擎中枢：初始化、实例缓存、状态收集、群聊管理器 |
| `backend/services/user_service.py` | 用户注册/登录/游客创建 |
| `backend/services/background_service.py` | 每 60 秒推进所有角色离线生活 |
| `backend/api/router.py` | 模型智能路由：优先级轮询 + 故障切换 + 缓存已验证模型 |
| `backend/api/model_registry.py` | 5 平台模型注册表，自动加载 .env 的 API Key |
| `backend/api/siliconflow_adapter.py` | 通用 HTTP 调用：重试、超时、JSON 事件日志 |
| `backend/characters/roster.py` | 307 室名册 + 特殊关系（冷旭帆↔望仔、叶清辞↔阿辞） |
| `backend/characters/lengxufan/data/character.json` | 主角人设全量数据（persona/记忆/关系阶段/信任规则） |
| `backend/lengxufan_core/dialogue_engine.py` | 对话主流程：四阶段处理链编排 |
| `backend/lengxufan_core/perception.py` | 情绪系统：0-85 情绪值、生物节律、衰减 |
| `backend/lengxufan_core/memory.py` | 记忆系统：情景+事实记忆（最近 3 条/上限 50 条） |
| `backend/lengxufan_core/identity.py` | 身份状态：trust_level、望仔 Wang Claim |
| `backend/lengxufan_core/cognition/trust_suspicion.py` | 信任/怀疑引擎：身份验证证据规则 |
| `backend/lengxufan_core/cognition/trust_sync.py` | 信任跨系统同步 |
| `backend/lengxufan_core/prompt_builder.py` | 组装系统提示词 + 消息列表 |
| `backend/lengxufan_core/group_chat.py` | 群聊：多角色顺序回复 + 插话概率 |
| `backend/infra/persistence.py` | 存档读写：save_full_state / load_full_state |
| `frontend/js/api.js` | 前端全部 API 封装（与 API_CONTRACT.md 一一对应） |

第二梯队（常用但不占前 30 席位）：`frontend/index.html`（主页面 DOM）、`frontend/js/app.js`（主页面逻辑+粒子系统+状态刷新）、`frontend/js/chat.js`（聊天页逻辑+?char= 参数）、`frontend/css/chat.css`（聊天页样式）、`backend/lengxufan_core/character_state/mind_state.py`（心理状态）、`backend/lengxufan_core/character_state/relationship_dynamics.py`（关系动态）、`godot/scripts/api_client.gd`（Godot 连后端）。

---

## 部分 4：改动影响清单（12 场景）

### 场景 1：新增一个 API 接口
- 必改：`backend/routes/` 新建或修改路由文件 → `backend/routes/__init__.py` 注册 → `frontend/js/api.js` 加前端封装
- 同步文档：`docs/API_CONTRACT.md`（必须）、`backend/BACKEND_MAP.md` 接口清单
- 坑：不注册蓝图接口不存在；改完必须重启 Flask；`app.py` 的 `/<path:filename>` 兜底路由会把未匹配路径当静态文件，仅 `/api/` 前缀正确返回 404。

### 场景 2：修改角色性格或人设
- 必改：`backend/characters/<char_id>/data/character.json`（persona、台词规则等字段）
- 同步文档：`backend/BACKEND_MAP.md`（字段含义变化时）
- 坑：引擎实例有缓存（engine_service 的 _engine_cache），必须重启才生效；旧存档 `data/runtime/save/save_<id>.json` 保留旧状态，验证新人格先删存档；同目录 `.bak_*` 是备份别误改。

### 场景 3：新增一个角色
- 必改：新建 `backend/characters/<new_id>/{__init__.py, data/{__init__.py, character.json}}` → `backend/characters/roster.py` 登记名册与关系 → 立绘放 `godot/assets/characters/`（如需）
- 同步文档：`docs/ADD_NEW_CHARACTER.md`（操作手册）、`README.md` 已支持角色表
- 坑：`CharacterRegistry.load_all()` 自动扫描目录，但 roster 关系要手动登记；前端角色列表来自 `/api/characters` 自动生效；character.json 字段清单见 `data/DATA_MAP.md` 第四节。

### 场景 4：修改情绪系统逻辑
- 必改：`backend/lengxufan_core/perception.py`（主逻辑）→ `backend/lengxufan_core/character_state/mind_state.py`（涉心理状态时）→ `backend/config.yaml`（rules.emotion 参数）
- 同步文档：`backend/BACKEND_MAP.md` 2.7 节
- 坑：情绪基线 50 / 上限 85 / 衰减率在 config.yaml 而非代码硬编码；前端 `frontend/js/emotion-chart.js` 只做展示，改数值口径需同步核对展示范围。

### 场景 5：修改前端聊天页样式
- 必改：`frontend/css/chat.css`（样式）→ `frontend/chat.html`（DOM，如需）→ `frontend/js/chat.js`（行为，如需）
- 同步文档：`frontend/FRONTEND_MAP.md`
- 坑：FRONTEND_MAP 已过时（27 页中 23 页已移入 `_archived/`，在线仅 4 页）；固定定位元素必须放 `#app` 容器内；html/body/#app 的布局约束（overflow hidden / fixed inset 0）不能破坏。

### 场景 6：修改 Godot 场景或立绘
- 必改：`godot/scenes/Room.tscn`（场景，在 Godot 编辑器内操作）→ `godot/assets/characters/*.jpg`（立绘 6 张）→ `godot/scripts/room.gd`、`character.gd`（逻辑）
- 同步文档：暂无 Godot 专属文档（待确认：是否补 `docs/GODOT.md`）
- 坑：编辑器版本 4.7.2，本机路径见 `_LOCAL_TOOLS.md`；`api_client.gd` 连 `127.0.0.1:5000`，需先启动 Flask；`godot/.godot/` 缓存不提交不手改；脚本注释自述"未验证"，需编辑器内实测。

### 场景 7：修改 SDK 版本号并发布
- 必改：`sdk/setup.py`（version 字段）→ `sdk/README.md`（Version 行 + wheel 文件名示例）
- 同步文档：`sdk/README.md`（自身即是文档）
- 坑：`sdk/world_state.py`、`sdk/event_bus.py` 是 SDK 独立副本，与 backend 同名文件互不共享代码；构建产物 `dist/`、`sdk/lengxufan_engine.egg-info/` 不提交；发布用 `python -m build`（README 有步骤）。

### 场景 8：新增 Python 依赖
- 必改：`backend/requirements.txt`
- 同步文档：`docs/BUILD.md`（涉及部署步骤时）
- 坑：SDK 依赖声明在 `sdk/setup.py` 的 requires，两处独立维护；生产用 gunicorn，依赖必须装进服务器环境；只 pip install 不写入 requirements.txt 等于没加。

### 场景 9：修改数据库模型
- 必改：`backend/models.py`
- 同步文档：`backend/BACKEND_MAP.md` 2.2 节、`docs/API_CONTRACT.md`（响应字段变化时）
- 坑：`db.create_all()` 只建新表不加列，改已有字段需删 `data/runtime/lengxufan.db` 重建（丢用户+对话历史，先备份）；角色 JSON 存档不受影响，但 Conversation 的 state_snapshot 结构可能失配。

### 场景 10：修改信任状态机
- 必改：`backend/lengxufan_core/cognition/trust_suspicion.py`（验证规则）→ `backend/lengxufan_core/cognition/trust_sync.py`（同步）→ `backend/lengxufan_core/identity.py`（trust_level/Wang Claim 存储）→ `backend/characters/<id>/data/character.json`（relationship_stages：信任区间→标签映射）
- 同步文档：`backend/BACKEND_MAP.md` 第六节"修改信任系统"行
- 坑：前端关系阶段显示 "--" 是已知 bug（后端输出键名与前端期望不匹配，见 FRONTEND_MAP 第八节第 9 条）；`dialogue_engine.py` 有 3 个 `.bak_*` 备份文件，别改错；用 `GET /api/characters/<id>/debug-trust` 验证。

### 场景 11：部署到新服务器
- 必改：无代码必改。流程按 `docs/BUILD.md`：Python 3.11+ → `pip install -r backend/requirements.txt` → 配 `.env`（backend/.env 优先）或环境变量 API Key → `gunicorn -w 1 -b 0.0.0.0:5000 backend.app:app`
- 同步文档：`README.md` 公网地址行（换 IP/域名时）
- 坑：`data/runtime/` 被 Git 忽略不随仓库走——旧存档需手动迁移或接受角色重置；生产必须覆盖默认 `SECRET_KEY`；本机开发 `python backend/run.py`，服务器 gunicorn，别混。

### 场景 12：修改文档本身
- 必改：对应文档文件 → 新增文档登记进 `DOCS_INDEX.md` → 目录/接口结构变化时同步本文件（PROJECT_MAP.md）
- 同步文档：无（自身即是）
- 坑：分层地图与代码已有偏差（BACKEND_MAP 仍写已不存在的 `backend/cognition/`、FRONTEND_MAP 仍统计 27 个在线页面）——改文档前先核实代码现状，修一处偏差顺手更新本文件附录。

---

## 部分 5：三类人的阅读路径

- **新人**：`README.md` → `PROJECT_OVERVIEW.md` → `DOCS_INDEX.md` → 本文件部分 1/部分 3 → 挑一个核心文件对照代码读。
- **老手**：跳过介绍，直接看 → 本文件部分 3 核心文件清单 → 部分 4 改动影响清单 → 干活。
- **维护者**：先看 → 本文件部分 2 文件夹管制地图 → 部分 4 改动影响清单 → 每次结构变更先改本文件。

---

## 部分 6：使用示例

### 示例 1："我想让冷旭帆对'妈妈'这个词反应更激烈"
1. 打开 `backend/characters/lengxufan/data/character.json`，在身份证据/上下文模式类字段（context_patterns、identity_evidence_rules 等，以文件实际字段为准）中加"妈妈"触发规则。
2. 若涉及信任值变化幅度 → `backend/lengxufan_core/cognition/trust_suspicion.py`。
3. 验证：重启 Flask → 删 `data/runtime/save/save_lengxufan.json` → CLI 模式 `python backend/run.py --cli` 输入"妈妈"观察反应；也可调 `GET /api/characters/lengxufan/debug-trust`。
4. 同步：`backend/BACKEND_MAP.md`（如规则结构变化）。

### 示例 2："我想加一个'暴雨'的天气事件"
1. 打开 `backend/world_state.py`：天气枚举（现仅晴/阴/小雨/风）加"暴雨" + 事件生成逻辑。
2. 前端视觉：`frontend/js/weather-effects.js` + `frontend/css/weather-effects.css` 加暴雨特效（`frontend/js/app.js` 的 refreshState 已透传天气；待确认：若后端返回结构变化才需改）。
3. 若角色要对暴雨有反应 → `backend/event_bus.py` 发布事件 + `characters/<id>/data/character.json` 的 event_templates。
4. 同步：`docs/API_CONTRACT.md`（如 `/api/state` 字段变化）、`backend/BACKEND_MAP.md`。

### 示例 3："我想在前端加一个按钮"
1. 定位页面：在线页面只有 `index.html` / `chat.html` / `login.html` / `dev.html`，其余 23 页在 `frontend/_archived/` 不可用。
2. 改 DOM：对应 html；改样式：`frontend/css/main.css` 或该页专属 css；改行为：`frontend/js/app.js`（主页）或对应页面 js。
3. 若按钮要调后端 → `frontend/js/api.js` 加封装，并走"场景 1"新增接口流程。
4. 坑：绝对定位元素放 `#app` 内；别动 `#coreVisual`/rail/sidebar 的 z-index 层级（层级表见 FRONTEND_MAP 第五节）。
5. 同步：`frontend/FRONTEND_MAP.md`（功能到文件映射表）。

---

## 附录：已知文档与代码的偏差（维护者注意）

| 偏差 | 现状 |
|---|---|
| `backend/BACKEND_MAP.md` 提及 `backend/cognition/` 目录 | 实际不存在，能力在 `backend/lengxufan_core/cognition/` |
| `frontend/FRONTEND_MAP.md` 统计 27 个在线 HTML 页面 | 实际在线 4 个（index/chat/login/dev），23 个已移入 `frontend/_archived/` |
| `backend/lengxufan_core/dialogue_engine.py` 有 3 个 `.bak_*` 备份 | 仅历史备份，勿引用、勿提交 |
| `tools/deploy/` 为空目录 | 部署自动化待建设 |
| `data/source/` 六个子目录全为空 | 角色数据实际存于 `backend/characters/<id>/data/`，填充计划见 `data/DATA_MAP.md` |
