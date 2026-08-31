# 冷旭帆项目 · 完整工程化导向手册（含关联原因）

> 版本：v5.5+  
> 最后更新：2026-08-31  
> 用途：修改任何功能时，先查本文件定位到唯一应修改的文件。  
> 原则：一个功能对应一个文件，尽量只改一个文件。

---

## 〇、项目根目录总览

| 名称 | 类型 | 作用 | 是否可忽略 |
|------|------|------|-----------|
| `.git/` | 目录 | Git 版本控制历史 | ⚠️ 不可删除 |
| `.gitignore` | 文件 | Git 忽略规则 | ✅ 可修改 |
| `.vscode/` | 目录 | VS Code 配置 | ✅ 可忽略 |
| `__pycache__/` | 目录 | Python 编译缓存 | ✅ 可删除 |
| `api/` | 目录 | 大模型 API 适配层 | ❗ 核心 |
| `characters/` | 目录 | 角色数据（单一数据源） | ❗ 核心 |
| `cognition/` | 目录 | P1 预置接口 | ❗ 核心 |
| `data/` | 目录 | 运行时数据 | ⚠️ 可清理 |
| `docs/` | 目录 | 技术文档 | ✅ 保留 |
| `frontend/` | 目录 | 前端页面 | ❗ 核心 |
| `infra/` | 目录 | 基础设施 | ❗ 核心 |
| `lengxufan_core/` | 目录 | 核心引擎 | ❗ 核心 |
| `routes/` | 目录 | API 路由 | ❗ 核心 |
| `services/` | 目录 | 业务服务 | ❗ 核心 |
| `tests/` | 目录 | 测试套件 | ✅ 保留 |
| `tools/` | 目录 | 工具脚本 | ✅ 保留 |
| `app.py` | 文件 | Flask 应用 | ❗ 核心 |
| `config.py` | 文件 | 全局配置 | ❗ 核心 |
| `config.yaml` | 文件 | 角色基础设定 | ❗ 核心 |
| `event_bus.py` | 文件 | 事件总线 | ❗ 核心 |
| `models.py` | 文件 | SQLAlchemy 模型 | ❗ 核心 |
| `run.py` | 文件 | 启动入口 | ❗ 核心 |
| `world_state.py` | 文件 | 共享世界状态 | ❗ 核心 |
| `ARCHITECTURE.md` | 文件 | 架构决策记录 | ✅ 文档 |
| `BUILD.md` | 文件 | 构建指南 | ✅ 文档 |
| `PROJECT_GUIDE.md` | 文件 | 本导向文件 | ✅ 文档 |
| `README.md` | 文件 | 项目说明 | ✅ 文档 |
| `requirements.txt` | 文件 | 依赖清单 | ❗ 核心配置 |

---

## 一、功能 → 文件映射（含关联原因）

| 修改什么 | 主文件 | 关联文件 | 为什么关联 |
|----------|--------|---------|-----------|
| 角色人设/说话风格 | `characters/<角色>/data/persona.py` | 无 | 只有 Prompt 构建时读取，独立 |
| 角色背景故事 | `characters/<角色>/data/autobiographical.py` | 无 | 仅 Memory 加载，独立 |
| 后台随机事件 | `characters/<角色>/data/event_templates.py` | `lengxufan_core/perception.py` | perception 遍历事件模板并应用状态变化 |
| 角色动作描述 | `characters/<角色>/data/fallback_actions.py` | `lengxufan_core/behavior.py` | behavior 根据情绪档位读取动作库 |
| 情绪描述翻译 | `characters/<角色>/data/feeling_translations.py` | `lengxufan_core/prompt_builder.py` | prompt_builder 将数值翻译成感受文本 |
| 角色主动意愿 | `characters/<角色>/data/intent_templates.py` | `lengxufan_core/behavior.py` | behavior 的 check_intents 读取意愿模板 |
| 记忆触发规则 | `characters/<角色>/data/memory_rules.py` | `lengxufan_core/dialogue_engine.py` | dialogue_engine 调用 _apply_memory_rules |
| 关系里程碑 | `characters/<角色>/data/milestones.py` | `lengxufan_core/memory.py` | memory 的 check_milestones 读取里程碑数据 |
| 心理独白风格 | `characters/<角色>/data/monologue_styles.py` | `lengxufan_core/cognition/inner_monologue.py` | 独白生成器根据情绪选择模板 |
| 关系阶段定义 | `characters/<角色>/data/relationship_stages.py` | `lengxufan_core/character_state/relationship_dynamics.py` | 关系动态按信任值查找阶段 |
| 场景五感描述 | `characters/<角色>/data/scene_templates.py` | `lengxufan_core/cognition/scene_engine.py` | 场景引擎组装五感描述 |
| 定时解锁记忆 | `characters/<角色>/data/scheduled_memories.py` | `lengxufan_core/memory.py` | memory 检查解锁条件 |
| 信任规则/验证问题 | `characters/<角色>/data/trust_rules.py` | `lengxufan_core/cognition/trust_suspicion.py` | 信任引擎读取规则和问题 |
| 意图分类规则 | `characters/<角色>/data/context_patterns.py` | `lengxufan_core/cognition/context_analyzer.py` | 上下文分析调用分类函数 |
| 情绪值计算 | `lengxufan_core/perception.py` | `lengxufan_core/dialogue_engine.py` | 对话流程中推进时间、触发事件 |
| 对话主流程 | `lengxufan_core/dialogue_engine.py` | 几乎所有核心模块 | 它是编排者，调用所有其他模块 |
| Prompt 组装 | `lengxufan_core/prompt_builder.py` | `lengxufan_core/dialogue_engine.py` | 对话引擎调用它生成系统提示词 |
| 身份验证 | `lengxufan_core/identity.py` | `lengxufan_core/cognition/trust_suspicion.py` | 信任引擎和身份状态机共同工作 |
| 记忆存储/检索 | `lengxufan_core/memory.py` | `lengxufan_core/prompt_builder.py` | Prompt 构建时提取记忆 |
| 行为生成 | `lengxufan_core/behavior.py` | `lengxufan_core/dialogue_engine.py` | 对话流程中生成动作前缀 |
| 角色上下文切换 | `lengxufan_core/character_context.py` | `services/engine_service.py` | 服务层在切换角色时设置上下文 |
| 身体状态 | `lengxufan_core/character_state/body_state.py` | `lengxufan_core/dialogue_engine.py` | 对话每轮更新身体状态 |
| 心理状态 | `lengxufan_core/character_state/mind_state.py` | `lengxufan_core/dialogue_engine.py` | 同上 |
| 关系动态 | `lengxufan_core/character_state/relationship_dynamics.py` | `lengxufan_core/dialogue_engine.py` | 对话中处理关系事件 |
| 场景感知 | `lengxufan_core/cognition/scene_engine.py` | `world_state.py` | 场景读取世界状态（时间/天气/活动） |
| 上下文分析 | `lengxufan_core/cognition/context_analyzer.py` | `characters/<角色>/data/context_patterns.py` | 分析器使用数据文件中的规则 |
| 心理独白生成 | `lengxufan_core/cognition/inner_monologue.py` | `characters/<角色>/data/monologue_styles.py` | 读取模板 |
| 思考链 | `lengxufan_core/cognition/thought_chain.py` | `lengxufan_core/dialogue_engine.py` | 对话中生成思考总结 |
| 信任怀疑状态机 | `lengxufan_core/cognition/trust_suspicion.py` | `characters/<角色>/data/trust_rules.py` | 读取验证规则 |
| 用户状态追踪 | `lengxufan_core/user_state.py` | `lengxufan_core/dialogue_engine.py` | 对话中更新用户情绪/身份 |
| 短期记忆 | `lengxufan_core/working_memory.py` | `lengxufan_core/dialogue_engine.py` | 对话后记录上下文 |
| 室友关系 | `lengxufan_core/social_network.py` | `lengxufan_core/dialogue_engine.py` | 对话后更新社交网络 |
| 事件总线 | `event_bus.py` | `services/engine_service.py` | 服务注册跨角色事件监听 |
| 共享世界状态 | `world_state.py` | `lengxufan_core/cognition/scene_engine.py` | 场景引擎读取世界状态 |
| 日志系统 | `infra/logger.py` | 无 | 独立 |
| 状态持久化 | `infra/persistence.py` | `lengxufan_core/dialogue_engine.py` | 对话结束时保存状态 |
| 时间工具 | `infra/time_utils.py` | `lengxufan_core/perception.py` | 感知系统使用节律和时间 |
| 模型注册表 | `api/model_registry.py` | `.env` 文件 | 读取 API Key |
| API 调用适配器 | `api/siliconflow_adapter.py` | `api/router.py` | 路由器调用适配器发请求 |
| 多平台容错路由 | `api/router.py` | `api/model_registry.py` | 从注册表获取平台信息 |
| 认证接口 | `routes/auth_routes.py` | `services/user_service.py` | 路由调用服务层业务逻辑 |
| 对话接口 | `routes/chat_routes.py` | `services/engine_service.py` | 路由转发到引擎服务 |
| 状态接口 | `routes/state_routes.py` | `services/engine_service.py` | 获取状态快照 |
| 历史记录接口 | `routes/history_routes.py` | `models.py` | 查询数据库模型 |
| 角色列表接口 | `routes/character_routes.py` | `characters/__init__.py` | 从注册中心获取角色列表 |
| 引擎实例管理 | `services/engine_service.py` | `lengxufan_core/dialogue_engine.py` | 初始化引擎对象 |
| 用户业务逻辑 | `services/user_service.py` | `models.py` | 操作用户表 |
| Flask 路由注册 | `app.py` | `routes/__init__.py` | 注册蓝图 |
| 启动入口 | `run.py` | `app.py` | 创建应用实例 |
| 用户/对话表结构 | `models.py` | 无 | 独立定义 |
| 前端页面 | `frontend/index.html` | `frontend/demo.html` | 两个页面共享逻辑 |
| 免登录演示 | `frontend/demo.html` | `frontend/index.html` | 复制自 index |
| 开发者调试页 | `frontend/dev.html` | `routes/state_routes.py` | 请求状态接口 |
| 主题样式 | `frontend/css/theme-override.css` | `frontend/index.html` | 被页面引用 |
| 背景/立绘素材 | `frontend/assets/` | `frontend/index.html` | 页面加载图片 |
| 测试运行器 | `tests/test_runner.py` | `tests/test_dialogs.txt` | 读取测试数据 |
| 100轮测试 | `tests/test_100_turns.py` | `tests/test_100_dialogs.txt` | 读取测试数据 |
| ChromaDB 查看工具 | `tools/view_memory.py` | `data/chroma_db/` | 读取向量数据库 |

---

## 二、运行时生成/可忽略文件清单

| 文件/目录 | 说明 |
|-----------|------|
| `__pycache__/` | Python 编译缓存 |
| `*.pyc` | 同上 |
| `data/lengxufan_*.log` | 运行日志 |
| `data/lengxufan.db.bak_*` | 数据库备份 |
| `data/chroma_db/` | 向量数据库（可删除重建） |
| `tests/data/chroma_db/` | 测试临时向量库 |
| `frontend/index.html.bak_*` | 前端备份 |
| `.git/` | 版本控制历史（不可删） |

---

## 三、维护原则

1. 数据与逻辑分离  
2. 单一数据源  
3. 修改最小化  
4. 前后端契约  
5. 版本控制  

---