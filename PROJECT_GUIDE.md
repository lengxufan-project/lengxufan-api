# 冷旭帆项目 · 完整工程化导向手册（v5.5+）

> 最后更新：2026-08-31  
> 用途：修改任意功能时，先查本文件定位到唯一应修改的文件。  
> 原则：一个功能对应一个文件，尽量只改一个文件。

---

## 一、项目总览

| 目录/文件 | 作用 |
|-----------|------|
| `app.py` | Flask 应用创建、静态目录、路由注册 |
| `run.py` | 启动入口（Web/CLI） |
| `config.py` / `config.yaml` | 全局配置与角色基础设定 |
| `models.py` | SQLAlchemy 模型（User, Conversation） |
| `requirements.txt` | 依赖清单 |
| `event_bus.py` | 角色间事件总线 |
| `world_state.py` | 共享世界状态（时间/天气/室友活动） |
| `api/` | 大模型 API 适配（注册表、适配器、路由） |
| `infra/` | 基础设施（日志、持久化、时间） |
| `lengxufan_core/` | 核心引擎（感知、记忆、身份、行为、对话等） |
| `cognition/` | P1 预置接口（空壳） |
| `characters/` | 角色数据（单一数据源） |
| `routes/` | API 路由层 |
| `services/` | 业务服务层 |
| `frontend/` | 前端页面 |
| `tests/` | 测试套件 |
| `tools/` | 工具脚本 |
| `data/` | 运行时数据（SQLite、状态文件、ChromaDB） |

---

## 二、角色数据目录（重要）

角色数据全部以 `character.json` 形式存储，位于 `characters/<角色名>/data/character.json`。  
**新增角色**：创建 `characters/<新角色>/data/character.json`，前端自动显示按钮。  
**修改角色数据**：只改对应 `character.json`，不影响任何代码。

角色名单集中管理在 `characters/roster.py`：  
- `DORM_MEMBERS`：室友名单  
- `SPECIAL_NAMES`：特殊锚点角色（如冷旭帆→陆华望）  
- `DEFAULT_ACTIVITIES`：默认室友活动

---

## 三、功能 → 文件映射（核心）

| 修改什么 | 文件 |
|----------|------|
| 角色人设/风格 | `characters/<角色>/data/character.json` |
| 信任验证规则 | `characters/<角色>/data/character.json`（`trust_rules`字段） |
| 情绪/后台事件 | `lengxufan_core/perception.py` + `character.json` 的 `event_templates` |
| 记忆规则 | `lengxufan_core/dialogue_engine.py`（调用 `_apply_memory_rules`） |
| 信任同步 | `lengxufan_core/cognition/trust_sync.py` |
| 关系动态 | `lengxufan_core/character_state/relationship_dynamics.py` |
| 场景感知 | `lengxufan_core/cognition/scene_engine.py` + `world_state.py` |
| 上下文分析 | `lengxufan_core/cognition/context_analyzer.py` |
| 心理独白 | `lengxufan_core/cognition/inner_monologue.py` |
| 思考链 | `lengxufan_core/cognition/thought_chain.py` |
| 行为生成 | `lengxufan_core/behavior.py` |
| 多平台路由 | `api/router.py` + `api/model_registry.py` |
| 状态持久化 | `infra/persistence.py` |
| 认证接口 | `routes/auth_routes.py` + `services/user_service.py` |
| 对话接口 | `routes/chat_routes.py` + `services/engine_service.py` |
| 状态接口 | `routes/state_routes.py` |
| 历史记录 | `routes/history_routes.py` + `models.py` |
| 角色列表 | `routes/character_routes.py` + `characters/__init__.py` |
| 群聊管理器 | `lengxufan_core/group_chat.py`（占位骨架） |
| 前端页面 | `frontend/index.html` / `demo.html` |
| 前端样式 | `frontend/css/` |
| 前端逻辑 | `frontend/js/` |

---

## 四、新增文件说明（本次重构）

| 文件 | 作用 |
|------|------|
| `characters/roster.py` | 集中管理室友名单、特殊锚点、默认活动 |
| `lengxufan_core/cognition/trust_sync.py` | 信任同步逻辑独立模块 |
| `lengxufan_core/group_chat.py` | 群聊管理器骨架（预留参与者上限、分组、主动插话） |
| `characters/*/data/character.json` | 角色单文件数据 |

---

## 五、维护原则

1. 数据与逻辑分离：数据只存 `character.json`，逻辑在核心模块。  
2. 单一数据源：角色数据只存在一处。  
3. 修改最小化：改一个功能，只改对应文件。  
4. 前后端契约：后端返回字段不得随意变更。  
5. 版本控制：每次改动前 Git 提交。
---


## 附录：完整核心文件清单（精确版）


### 根目录
- `ARCHITECTURE.md`：架构决策记录
- `BUILD.md`：构建指南
- `PROJECT_GUIDE.md`：本导向文件
- `README.md`：项目说明

### api/
- `api\__init__.py`：导出 API 模块
- `api\model_registry.py`：模型注册表，读取 .env
- `api\router.py`：多平台容错路由
- `api\siliconflow_adapter.py`：通用 API 调用适配器

### 根目录
- `app.py`：Flask 应用创建，静态目录与路由注册

### characters/
- `characters\__init__.py`：角色注册中心

### characters\huangjingyun/
- `characters\huangjingyun\__init__.py`：待补充

### characters\huangjingyun\data/
- `characters\huangjingyun\data\__init__.py`：待补充
- `characters\huangjingyun\data\character.json`：角色单文件数据（核心）

### characters\lengxufan/
- `characters\lengxufan\__init__.py`：待补充

### characters\lengxufan\data/
- `characters\lengxufan\data\__init__.py`：待补充
- `characters\lengxufan\data\character.json`：角色单文件数据（核心）

### characters/
- `characters\roster.py`：室友名单与特殊锚点

### characters\yeqingci/
- `characters\yeqingci\__init__.py`：待补充

### characters\yeqingci\data/
- `characters\yeqingci\data\__init__.py`：待补充
- `characters\yeqingci\data\character.json`：角色单文件数据（核心）

### cognition/
- `cognition\__init__.py`：待补充
- `cognition\intention.py`：待补充
- `cognition\relationships.py`：待补充
- `cognition\spacetime.py`：待补充

### 根目录
- `config.py`：全局配置
- `config.yaml`：角色基础设定

### data/
- `data\save_huangjingyun.json`：角色状态存档（运行时生成）
- `data\save_lengxufan.json`：角色状态存档（运行时生成）
- `data\save_yeqingci.json`：角色状态存档（运行时生成）

### docs/
- `docs\ADD_NEW_CHARACTER.md`：待补充
- `docs\building-ai-npc-hybrid-architecture.md`：待补充

### 根目录
- `event_bus.py`：角色间事件总线

### frontend\assets/
- `frontend\assets\chatlog-frame.svg`：待补充

### frontend\css/
- `frontend\css\main.css`：主样式
- `frontend\css\theme-override.css`：主题增强样式

### frontend/
- `frontend\demo.html`：免登录演示页
- `frontend\dev.html`：开发者调试页

### frontend\icons/
- `frontend\icons\close.svg`：待补充
- `frontend\icons\popup.svg`：待补充

### frontend/
- `frontend\index.html`：主页面

### frontend\js/
- `frontend\js\api.js`：API 调用封装
- `frontend\js\app.js`：前端逻辑

### frontend/
- `frontend\manifest.json`：PWA 清单
- `frontend\sw.js`：Service Worker

### 根目录
- `gen_guide_exact.py`：待补充

### infra/
- `infra\__init__.py`：导出基础设施
- `infra\logger.py`：日志系统（含 JSON 事件）
- `infra\persistence.py`：状态持久化（按角色保存）
- `infra\time_utils.py`：时间工具与生理节律

### lengxufan_core/
- `lengxufan_core\__init__.py`：核心导出
- `lengxufan_core\behavior.py`：行为生成、意愿检查
- `lengxufan_core\character_context.py`：角色上下文（线程局部）

### lengxufan_core\character_state/
- `lengxufan_core\character_state\__init__.py`：导出状态模块
- `lengxufan_core\character_state\body_state.py`：身体状态管理
- `lengxufan_core\character_state\mind_state.py`：心理状态管理
- `lengxufan_core\character_state\relationship_dynamics.py`：关系动态引擎

### lengxufan_core\cognition/
- `lengxufan_core\cognition\__init__.py`：导出认知模块
- `lengxufan_core\cognition\context_analyzer.py`：上下文分析
- `lengxufan_core\cognition\inner_monologue.py`：心理独白生成
- `lengxufan_core\cognition\scene_engine.py`：场景感知
- `lengxufan_core\cognition\thought_chain.py`：思考链
- `lengxufan_core\cognition\trust_suspicion.py`：信任/怀疑状态机
- `lengxufan_core\cognition\trust_sync.py`：信任同步逻辑

### lengxufan_core/
- `lengxufan_core\dialogue_engine.py`：对话流程编排
- `lengxufan_core\group_chat.py`：群聊管理器骨架
- `lengxufan_core\identity.py`：身份状态机
- `lengxufan_core\memory.py`：记忆系统（含 ChromaDB）
- `lengxufan_core\perception.py`：情绪、状态、后台时间
- `lengxufan_core\prompt_builder.py`：Prompt 组装
- `lengxufan_core\social_network.py`：室友关系网络
- `lengxufan_core\user_state.py`：用户状态追踪
- `lengxufan_core\working_memory.py`：短期记忆缓冲区

### 根目录
- `models.py`：SQLAlchemy 数据模型
- `requirements.txt`：依赖清单

### routes/
- `routes\__init__.py`：注册蓝图
- `routes\auth_routes.py`：认证接口
- `routes\character_routes.py`：角色列表接口
- `routes\chat_routes.py`：对话接口
- `routes\history_routes.py`：历史记录接口
- `routes\state_routes.py`：状态接口

### 根目录
- `run.py`：启动入口（Web/CLI）

### services/
- `services\engine_service.py`：引擎实例管理与状态汇总
- `services\user_service.py`：用户业务逻辑

### tests/
- `tests\scene_01_first_meet.txt`：测试场景数据
- `tests\scene_02_wang_identity.txt`：测试场景数据
- `tests\scene_03_conflict.txt`：测试场景数据
- `tests\scene_04_night_company.txt`：测试场景数据
- `tests\scene_05_daily_chat.txt`：测试场景数据
- `tests\scene_dusk_307.txt`：测试场景数据
- `tests\scene_forbidden_zone.txt`：测试场景数据
- `tests\scene_memory_test.txt`：测试场景数据
- `tests\scene_name_weight.txt`：测试场景数据
- `tests\scene_painting_dusk.txt`：测试场景数据
- `tests\test_100_dialogs.txt`：测试场景数据
- `tests\test_100_turns.py`：100轮测试
- `tests\test_core_logic.py`：核心逻辑测试
- `tests\test_dialogs.txt`：测试场景数据
- `tests\test_report_100.md`：测试报告
- `tests\test_runner.py`：通用测试

### tools/
- `tools\ai_ai_multi_test.py`：AI 对 AI 多角色测试
- `tools\convert_character_to_json.py`：数据转换脚本
- `tools\engineering_check.py`：工程化检查
- `tools\import_character_md.py`：Markdown 导入脚本
- `tools\multi_char_test.py`：多角色并发测试
- `tools\verify_isolation.py`：状态隔离验证
- `tools\view_memory.py`：ChromaDB 记忆查看

### 根目录
- `world_state.py`：共享世界状态
