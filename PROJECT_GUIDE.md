## 更新后的《冷旭帆项目 · 完整工程化导向手册（v6.0）》

> 最后更新：2026-08-31  
> 用途：修改任意功能时，先查本文件定位到唯一应修改的文件。  
> 原则：一个功能对应一个文件，尽量只改一个文件。

---

## 一、项目总览

| 目录/文件                   | 作用                                       |
| --------------------------- | ------------------------------------------ |
| `app.py`                    | Flask 应用创建、静态目录、路由注册         |
| `run.py`                    | 启动入口（Web/CLI）                        |
| `config.py` / `config.yaml` | 全局配置与角色基础设定                     |
| `models.py`                 | SQLAlchemy 模型（User, Conversation）      |
| `requirements.txt`          | 依赖清单                                   |
| `event_bus.py`              | 角色间事件总线                             |
| `world_state.py`            | 共享世界状态（时间/天气/室友活动）         |
| `api/`                      | 大模型 API 适配（注册表、适配器、路由）    |
| `infra/`                    | 基础设施（日志、持久化、时间）             |
| `lengxufan_core/`           | 核心引擎（感知、记忆、身份、行为、对话等） |
| `cognition/`                | P1 预置接口（空壳）                        |
| `characters/`               | 角色数据（单一数据源）                     |
| `routes/`                   | API 路由层                                 |
| `services/`                 | 业务服务层                                 |
| `frontend/`                 | 前端页面（20 HTML + 39 CSS + 43 JS）       |
| `tests/`                    | 测试套件                                   |
| `tools/`                    | 工具脚本                                   |
| `data/`                     | 运行时数据（SQLite、状态文件、ChromaDB）   |

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

## 三、前端总览（重点更新）

### 3.1 文件统计

| 类型 | 数量 | 说明                                      |
| ---- | ---- | ----------------------------------------- |
| HTML | 20   | 1 个主页面 + 18 个独立页面 + 1 个历史备份 |
| CSS  | 39   | `css/` 目录，按页面/组件一文件            |
| JS   | 43   | `js/` 目录，按页面/组件一文件             |

### 3.2 前端架构文档

完整的前端架构说明见 `frontend/ARCHITECTURE.md`（24,770 bytes，包含文件树、页面清单、CSS/JS 模块说明、API 契约、已知问题、维护指南）。

**修改任何前端文件前，先查 `frontend/ARCHITECTURE.md`。**

### 3.3 主页面脚本加载顺序（不可乱）

`index.html` 中 script 标签必须严格按以下顺序：

```
loading-bar.js → api.js → skeleton.js → state.js → ui.js → chat.js → scene.js
→ characters.js → scene-transition.js → character-display.js → emotion-chart.js
→ world-clock.js → time-lighting.js → emotion-particles.js → relation-thermometer.js
→ status-dashboard.js → character-tooltip.js → event-log.js → scene-shortcut.js
→ weather-effects.js → achievement-card.js → notification-center.js
→ choice-branch.js → search-panel.js → shortcuts-panel.js → app.js（最后）
```

---

## 四、功能 → 文件映射（核心）

### 4.1 后端

| 修改什么      | 文件                                                         |
| ------------- | ------------------------------------------------------------ |
| 角色人设/风格 | `characters/<角色>/data/character.json`                      |
| 信任验证规则  | `characters/<角色>/data/character.json`（`trust_rules`字段） |
| 情绪/后台事件 | `lengxufan_core/perception.py` + `character.json` 的 `event_templates` |
| 记忆规则      | `lengxufan_core/dialogue_engine.py`（调用 `_apply_memory_rules`） |
| 信任同步      | `lengxufan_core/cognition/trust_sync.py`                     |
| 关系动态      | `lengxufan_core/character_state/relationship_dynamics.py`    |
| 场景感知      | `lengxufan_core/cognition/scene_engine.py` + `world_state.py` |
| 上下文分析    | `lengxufan_core/cognition/context_analyzer.py`               |
| 心理独白      | `lengxufan_core/cognition/inner_monologue.py`                |
| 思考链        | `lengxufan_core/cognition/thought_chain.py`                  |
| 行为生成      | `lengxufan_core/behavior.py`                                 |
| 多平台路由    | `api/router.py` + `api/model_registry.py`                    |
| 状态持久化    | `infra/persistence.py`                                       |
| 认证接口      | `routes/auth_routes.py` + `services/user_service.py`         |
| 对话接口      | `routes/chat_routes.py` + `services/engine_service.py`       |
| 状态接口      | `routes/state_routes.py`                                     |
| 历史记录      | `routes/history_routes.py` + `models.py`                     |
| 角色列表      | `routes/character_routes.py` + `characters/__init__.py`      |
| 群聊管理器    | `lengxufan_core/group_chat.py`（占位骨架）                   |

### 4.2 前端核心（主页面）

| 修改什么                                 | 文件                                                         |
| ---------------------------------------- | ------------------------------------------------------------ |
| 全局配色 / body 布局 / 聊天气泡 / 状态栏 | `frontend/css/main.css`                                      |
| 开场动画（时间轴/粒子/光线/拖尾/文字）   | `frontend/css/animations.css` + `frontend/js/app.js`（intro 区块） |
| 侧边栏外观与偏移                         | `frontend/css/sidebar.css` + `frontend/js/app.js`（侧边栏区块） |
| 骨架屏形状                               | `frontend/css/skeleton.css` + `frontend/js/skeleton.js`      |
| 后端请求（URL/字段/错误处理）            | `frontend/js/api.js`（唯一出口，勿在其他文件直接 fetch）     |
| 聊天发送逻辑 / 打字指示器                | `frontend/js/chat.js` + `frontend/js/ui.js`                  |
| 状态轮询间隔 / 数据派发                  | `frontend/js/app.js` 的 `refreshState()`                     |
| 场景文案 / 场景切换                      | `frontend/js/scene.js` + `frontend/js/scene-transition.js`   |
| 天气 / 时段光照 / 情绪粒子               | `frontend/js/weather-effects.js` / `time-lighting.js` / `emotion-particles.js` |
| 搜索面板 / 快捷键面板                    | `frontend/js/search-panel.js` / `shortcuts-panel.js`（+ 同名 CSS） |

### 4.3 前端独立页面（18 个）

| 页面                   | 修改文件（三件套）                                           | 依赖 API                 |
| ---------------------- | ------------------------------------------------------------ | ------------------------ |
| 404.html               | `404.html` + `css/404.css` + `js/404.js`                     | -                        |
| about.html             | `about.html` + `css/about.css` + `js/about.js`               | -                        |
| character-gallery.html | `character-gallery.html` + `css/character-gallery.css` + `js/character-gallery.js` | `GET /api/characters`    |
| character-profile.html | `character-profile.html` + `css/character-profile.css` + `js/character-profile.js` | -                        |
| demo-mode.html         | `demo-mode.html` + `css/demo-mode.css` + `js/demo-mode.js`   | -                        |
| exploration.html       | `exploration.html` + `css/exploration.css` + `js/exploration.js` | -                        |
| export.html            | `export.html` + `css/export.css` + `js/export.js`            | `GET /api/conversations` |
| help.html              | `help.html` + `css/help.css` + `js/help.js`                  | -                        |
| journey.html           | `journey.html` + `css/journey.css` + `js/journey.js`         | -                        |
| login.html             | `login.html` + `css/login.css` + `js/login.js`               | -（前端模拟）            |
| memory-gallery.html    | `memory-gallery.html` + `css/memory-gallery.css` + `js/memory-gallery.js` | -                        |
| observer-panel.html    | `observer-panel.html` + `css/observer-panel.css` + `js/observer-panel.js` | `GET /api/state`         |
| profile.html           | `profile.html` + `css/profile.css` + `js/profile.js`         | `GET /api/auth/me`       |
| relation-map.html      | `relation-map.html` + `css/relation-map.css` + `js/relation-map.js` | -                        |
| relations.html         | `relations.html` + `css/relation-thermometer.css` + `js/relation-thermometer.js` | -                        |
| settings.html          | `settings.html` + `css/settings.css` + `js/settings.js`      | -                        |
| world-guide.html       | `world-guide.html` + `css/world-guide.css` + `js/world-guide.js` | -                        |
| world-map.html         | `world-map.html` + `css/world-map.css` + `js/world-map.js`   | `GET /api/state`         |

---

## 五、新增文件说明

### 5.1 后端（此前重构）

| 文件                                     | 作用                                             |
| ---------------------------------------- | ------------------------------------------------ |
| `characters/roster.py`                   | 集中管理室友名单、特殊锚点、默认活动             |
| `lengxufan_core/cognition/trust_sync.py` | 信任同步逻辑独立模块                             |
| `lengxufan_core/group_chat.py`           | 群聊管理器骨架（预留参与者上限、分组、主动插话） |
| `characters/*/data/character.json`       | 角色单文件数据                                   |

### 5.2 前端（本次大规模扩展）

| 文件                                     | 作用                                                         |
| ---------------------------------------- | ------------------------------------------------------------ |
| `frontend/ARCHITECTURE.md`               | 前端架构文档（文件树、页面清单、模块说明、API 契约、维护指南） |
| `frontend/css/sidebar.css`               | 左侧可收起侧边栏样式                                         |
| `frontend/css/skeleton.css`              | 数据加载骨架屏样式                                           |
| `frontend/css/weather-effects.css`       | 雨/雪/风/阴天气特效                                          |
| `frontend/css/time-lighting.css`         | 时段氛围光（深夜/清晨/正午/黄昏/夜晚）                       |
| `frontend/css/emotion-particles.css`     | 情绪粒子层                                                   |
| `frontend/css/achievement-card.css`      | 成就卡片弹窗                                                 |
| `frontend/css/notification-center.css`   | 通知中心抽屉                                                 |
| `frontend/css/choice-branch.css`         | 对话分支选择按钮                                             |
| `frontend/css/search-panel.css`          | Ctrl+K 搜索模态面板                                          |
| `frontend/css/shortcuts-panel.css`       | ? 快捷键面板                                                 |
| `frontend/css/404.css` ~ `world-map.css` | 18 个独立页面各对应一个 CSS                                  |
| `frontend/js/skeleton.js`                | 骨架屏 show/hide                                             |
| `frontend/js/weather-effects.js`         | 天气粒子渲染                                                 |
| `frontend/js/time-lighting.js`           | 时段光照切换                                                 |
| `frontend/js/emotion-particles.js`       | 情绪粒子动态                                                 |
| `frontend/js/achievement-card.js`        | 成就弹卡展示                                                 |
| `frontend/js/notification-center.js`     | 通知抽屉管理                                                 |
| `frontend/js/choice-branch.js`           | 剧情分支渲染                                                 |
| `frontend/js/search-panel.js`            | 搜索面板逻辑                                                 |
| `frontend/js/shortcuts-panel.js`         | 快捷键面板逻辑                                               |
| `frontend/js/404.js` ~ `world-map.js`    | 18 个独立页面各对应一个 JS                                   |

---

## 六、前端 API 契约（不可变）

| 端点                 | 方法 | 请求                 | 响应                                                         |
| -------------------- | ---- | -------------------- | ------------------------------------------------------------ |
| `/api/state`         | GET  | -                    | `{emotion, emotion_label, body, mind, relationship, world:{day,time_of_day,weather}, dorm_activities, user_state, ...}` |
| `/api/chat`          | POST | `{message, char_id}` | `{reply, state}`                                             |
| `/api/group_chat`    | POST | `{message}`          | `{replies:[{char_id,name,reply}]}`                           |
| `/api/characters`    | GET  | -                    | `[{id,name}]` 或 `{value:[{id,name}]}`                       |
| `/api/conversations` | GET  | -                    | `[{id,role,content,annotation,state_snapshot,created_at}]`   |
| `/api/auth/me`       | GET  | -                    | 当前用户信息                                                 |

**规则：修改任何 fetch 的 URL / 请求字段 / 响应字段时，必须与 `routes/*.py` 保持同步。**

---

## 七、已知问题与注意事项

1. **同名 @keyframes 冲突**：`flowShine`、`chartBallPulse` 在两个 CSS 中有不同定义，加载顺序靠后者生效。未来需重命名。
2. **`index_working_backup.html`**：无引用的历史备份，可安全删除。
3. **`window._emotionHistory`**：全局临时变量，未来应纳入 `window.State`。
4. **demo-mode**：纯前端模拟，未接 `/api/chat`。
5. **export.html**：需要登录 session，未登录时静默展示空态。
6. **login.html**：前端模拟，未真正调用 `/api/auth/guest`，影响真实登录态功能（export/profile）。
7. **部分独立页面缺少移动端媒体查询**：memory-gallery、observer-panel、world-map、exploration 等。

---

## 八、维护原则

1. **数据与逻辑分离**：数据只存 `character.json`，逻辑在核心模块。
2. **单一数据源**：角色数据只存在一处。
3. **修改最小化**：改一个功能，只改对应文件。
4. **前后端契约**：后端返回字段不得随意变更。
5. **版本控制**：每次改动前 Git 提交。
6. **前端三件套**：独立页面修改只动 `xxx.html` + `css/xxx.css` + `js/xxx.js`，不动其他文件。
7. **API 唯一出口**：所有后端请求必须通过 `frontend/js/api.js`，不得在其他 JS 中直接 `fetch`。
8. **脚本顺序不可乱**：`app.js` 必须最后加载，`loading-bar.js` 必须在 `api.js` 之前。
9. **返回链接规范**：所有独立页面返回主页面统一使用 `index.html?skipIntro=1`，避免重播开场动画。
10. **新页面接入导航**：在 `index.html` 的 `.sidebar-nav` 中添加对应 `.nav-link`。

---

## 九、新增页面步骤（标准操作）

1. 在 `frontend/` 根新建 `xxx.html`，结构参考任一独立页面：

   ```
   <meta charset="UTF-8"> → 引用 css/main.css → 引用本页 css/xxx.css → body 末尾引用 js/xxx.js
   ```

2. 返回链接使用 `index.html?skipIntro=1`。

3. 新建 `css/xxx.css`（类名加统一前缀，避免冲突）与 `js/xxx.js`。

4. 在 `index.html` 的 `.sidebar-nav` 中添加导航链接。

5. 如由后端路由托管，在 `app.py` 增加对应 `@app.route`。

6. 完成后运行全量引用检查（参考 `ARCHITECTURE.md` 维护指南）。

---

## 十、新增功能组件（主页面）步骤

1. 新建 `css/xxx.css` 与 `js/xxx.js`；JS 采用 IIFE + `window.Xxx = { init, update }` 模式。
2. 若组件容器需要静态占位：在 `index.html` 对应位置加 `<div id="xxx">`；若组件自建 DOM（参考 StatusDashboard / EmotionParticles），则无需改 HTML。
3. `index.html`：`<head>` 中 `main.css` 之后加入 CSS 引用；body 末尾 **`app.js` 之前**加入 JS 引用。
4. `js/app.js` 的 `init()` 中以守卫方式调用：`if (window.Xxx) window.Xxx.init(...)`；需要随状态刷新则在 `refreshState()` 成功回调里调用 `Xxx.update(s)`。
5. 涉及键盘/全局快捷键时，注意在 INPUT/TEXTAREA 聚焦时短路（参考 `shortcuts-panel.js`）。
6. 完成后运行一次全量引用检查：确认 `index.html` 引用的每个 CSS/JS 文件都存在、`app.js` 仍是最后一个 script。

---

## 附录：完整核心文件清单（精确版）

### 根目录

- `ARCHITECTURE.md`：架构决策记录
- `PROJECT_GUIDE.md`：本导向文件
- `README.md`：项目说明
- `app.py`：Flask 应用创建、静态目录与路由注册
- `run.py`：启动入口（Web/CLI）
- `config.py`：全局配置
- `config.yaml`：角色基础设定
- `models.py`：SQLAlchemy 数据模型
- `requirements.txt`：依赖清单
- `event_bus.py`：角色间事件总线
- `world_state.py`：共享世界状态

---

### api/

- `api/__init__.py`：导出 API 模块
- `api/model_registry.py`：模型注册表，读取 .env
- `api/router.py`：多平台容错路由
- `api/siliconflow_adapter.py`：通用 API 调用适配器

---

### characters/

- `characters/__init__.py`：角色注册中心
- `characters/roster.py`：室友名单与特殊锚点

#### characters/huangjingyun/

- `characters/huangjingyun/__init__.py`
- `characters/huangjingyun/data/__init__.py`
- `characters/huangjingyun/data/character.json`：黄景云角色单文件数据（核心）

#### characters/lengxufan/

- `characters/lengxufan/__init__.py`
- `characters/lengxufan/data/__init__.py`
- `characters/lengxufan/data/character.json`：冷旭帆角色单文件数据（核心）

#### characters/yeqingci/

- `characters/yeqingci/__init__.py`
- `characters/yeqingci/data/__init__.py`
- `characters/yeqingci/data/character.json`：叶清辞角色单文件数据（核心）

---

### cognition/

- `cognition/__init__.py`：P1 预置接口
- `cognition/intention.py`：意图接口（占位）
- `cognition/relationships.py`：关系接口（占位）
- `cognition/spacetime.py`：时空接口（占位）

---

### data/

- `data/save_huangjingyun.json`：黄景云状态存档（运行时生成）
- `data/save_lengxufan.json`：冷旭帆状态存档（运行时生成）
- `data/save_yeqingci.json`：叶清辞状态存档（运行时生成）

---

### docs/

- `docs/ADD_NEW_CHARACTER.md`：新增角色指南
- `docs/building-ai-npc-hybrid-architecture.md`：混合架构构建说明

---

### infra/

- `infra/__init__.py`：导出基础设施
- `infra/logger.py`：日志系统（含 JSON 事件）
- `infra/persistence.py`：状态持久化（按角色保存）
- `infra/time_utils.py`：时间工具与生理节律

---

### lengxufan_core/

- `lengxufan_core/__init__.py`：核心导出
- `lengxufan_core/behavior.py`：行为生成、意愿检查
- `lengxufan_core/character_context.py`：角色上下文（线程局部）
- `lengxufan_core/dialogue_engine.py`：对话流程编排
- `lengxufan_core/group_chat.py`：群聊管理器骨架
- `lengxufan_core/identity.py`：身份状态机
- `lengxufan_core/memory.py`：记忆系统（含 ChromaDB）
- `lengxufan_core/perception.py`：情绪、状态、后台事件
- `lengxufan_core/prompt_builder.py`：Prompt 组装
- `lengxufan_core/social_network.py`：室友关系网络
- `lengxufan_core/user_state.py`：用户状态追踪
- `lengxufan_core/working_memory.py`：短期记忆缓冲区

#### lengxufan_core/character_state/

- `lengxufan_core/character_state/__init__.py`
- `lengxufan_core/character_state/body_state.py`：身体状态管理
- `lengxufan_core/character_state/mind_state.py`：心理状态管理
- `lengxufan_core/character_state/relationship_dynamics.py`：关系动态引擎

#### lengxufan_core/cognition/

- `lengxufan_core/cognition/__init__.py`
- `lengxufan_core/cognition/context_analyzer.py`：上下文分析
- `lengxufan_core/cognition/inner_monologue.py`：心理独白生成
- `lengxufan_core/cognition/scene_engine.py`：场景感知
- `lengxufan_core/cognition/thought_chain.py`：思考链
- `lengxufan_core/cognition/trust_suspicion.py`：信任/怀疑状态机
- `lengxufan_core/cognition/trust_sync.py`：信任同步逻辑

---

### routes/

- `routes/__init__.py`：注册蓝图
- `routes/auth_routes.py`：认证接口
- `routes/character_routes.py`：角色列表接口
- `routes/chat_routes.py`：对话接口
- `routes/history_routes.py`：历史记录接口
- `routes/state_routes.py`：状态接口

---

### services/

- `services/engine_service.py`：引擎实例管理与状态汇总
- `services/user_service.py`：用户业务逻辑

---

### tests/

- `tests/scene_01_first_meet.txt`
- `tests/scene_02_wang_identity.txt`
- `tests/scene_03_conflict.txt`
- `tests/scene_04_night_company.txt`
- `tests/scene_05_daily_chat.txt`
- `tests/scene_dusk_307.txt`
- `tests/scene_forbidden_zone.txt`
- `tests/scene_memory_test.txt`
- `tests/scene_name_weight.txt`
- `tests/scene_painting_dusk.txt`
- `tests/test_100_dialogs.txt`
- `tests/test_100_turns.py`
- `tests/test_core_logic.py`
- `tests/test_dialogs.txt`
- `tests/test_report_100.md`
- `tests/test_runner.py`

---

### tools/

- `tools/ai_ai_multi_test.py`：AI 对 AI 多角色测试
- `tools/convert_character_to_json.py`：数据转换脚本
- `tools/engineering_check.py`：工程化检查
- `tools/import_character_md.py`：Markdown 导入脚本
- `tools/multi_char_test.py`：多角色并发测试
- `tools/verify_isolation.py`：状态隔离验证
- `tools/view_memory.py`：ChromaDB 记忆查看

---

### frontend/

#### frontend 根目录 HTML（20 个）

- `frontend/index.html`：主页面（世界入口，唯一复杂页面）
- `frontend/index_working_backup.html`：历史备份快照（无引用，可安全删除）
- `frontend/404.html`：错误页
- `frontend/about.html`：关于页面
- `frontend/character-gallery.html`：角色画廊
- `frontend/character-profile.html`：人物典籍
- `frontend/demo-mode.html`：演示模式
- `frontend/exploration.html`：暗夜拾遗
- `frontend/export.html`：对话导出
- `frontend/help.html`：帮助中心
- `frontend/journey.html`：旅程时间线
- `frontend/login.html`：登录/游客进入
- `frontend/memory-gallery.html`：时光回廊
- `frontend/observer-panel.html`：观察者之窗
- `frontend/profile.html`：个人中心
- `frontend/relation-map.html`：关系图谱
- `frontend/relations.html`：关系温度计独立页
- `frontend/settings.html`：设置页面
- `frontend/world-guide.html`：世界观介绍
- `frontend/world-map.html`：星图导航

#### frontend/css/（39 个）

主页面核心：

- `frontend/css/main.css`：全局基础 + 主页面布局
- `frontend/css/animations.css`：全局 @keyframes + 开场动画
- `frontend/css/sidebar.css`：左侧侧边栏
- `frontend/css/skeleton.css`：加载骨架屏
- `frontend/css/loading-bar.css`：顶部加载进度条
- `frontend/css/emotion-chart.css`：情绪折线图
- `frontend/css/scene-transition.css`：场景切换过渡
- `frontend/css/character-display.css`：角色展示增强
- `frontend/css/world-clock.css`：世界时钟
- `frontend/css/relation-thermometer.css`：关系温度计
- `frontend/css/status-dashboard.css`：状态仪表盘
- `frontend/css/character-tooltip.css`：角色悬浮提示
- `frontend/css/event-log.css`：事件日志
- `frontend/css/scene-shortcut.css`：场景快捷键提示
- `frontend/css/weather-effects.css`：天气特效
- `frontend/css/time-lighting.css`：时段光照
- `frontend/css/emotion-particles.css`：情绪粒子层
- `frontend/css/achievement-card.css`：成就卡片
- `frontend/css/notification-center.css`：通知中心
- `frontend/css/choice-branch.css`：分支选择
- `frontend/css/search-panel.css`：搜索面板
- `frontend/css/shortcuts-panel.css`：快捷键面板

独立页面：

- `frontend/css/404.css`
- `frontend/css/about.css`
- `frontend/css/character-gallery.css`
- `frontend/css/character-profile.css`
- `frontend/css/demo-mode.css`
- `frontend/css/exploration.css`
- `frontend/css/export.css`
- `frontend/css/help.css`
- `frontend/css/journey.css`
- `frontend/css/login.css`
- `frontend/css/memory-gallery.css`
- `frontend/css/observer-panel.css`
- `frontend/css/profile.css`
- `frontend/css/relation-map.css`
- `frontend/css/settings.css`
- `frontend/css/world-guide.css`
- `frontend/css/world-map.css`

#### frontend/js/（43 个）

主页面核心（按加载顺序）：

- `frontend/js/loading-bar.js`
- `frontend/js/api.js`
- `frontend/js/skeleton.js`
- `frontend/js/state.js`
- `frontend/js/ui.js`
- `frontend/js/chat.js`
- `frontend/js/scene.js`
- `frontend/js/characters.js`
- `frontend/js/scene-transition.js`
- `frontend/js/character-display.js`
- `frontend/js/emotion-chart.js`
- `frontend/js/world-clock.js`
- `frontend/js/time-lighting.js`
- `frontend/js/emotion-particles.js`
- `frontend/js/relation-thermometer.js`
- `frontend/js/status-dashboard.js`
- `frontend/js/character-tooltip.js`
- `frontend/js/event-log.js`
- `frontend/js/scene-shortcut.js`
- `frontend/js/weather-effects.js`
- `frontend/js/achievement-card.js`
- `frontend/js/notification-center.js`
- `frontend/js/choice-branch.js`
- `frontend/js/search-panel.js`
- `frontend/js/shortcuts-panel.js`
- `frontend/js/app.js`（最后加载）

独立页面：

- `frontend/js/404.js`
- `frontend/js/about.js`
- `frontend/js/character-gallery.js`
- `frontend/js/character-profile.js`
- `frontend/js/demo-mode.js`
- `frontend/js/exploration.js`
- `frontend/js/export.js`
- `frontend/js/help.js`
- `frontend/js/journey.js`
- `frontend/js/login.js`
- `frontend/js/memory-gallery.js`
- `frontend/js/observer-panel.js`
- `frontend/js/profile.js`
- `frontend/js/relation-map.js`
- `frontend/js/settings.js`
- `frontend/js/world-guide.js`
- `frontend/js/world-map.js`

---

### 其他前端文件

- `frontend/ARCHITECTURE.md`：前端架构文档（权威参考，包含文件树、页面清单、模块说明、API 契约、已知问题、维护指南）
- `frontend/assets/`：当前为空目录，预留素材位置

---

## 手册维护说明

1. 每次新增/删除前端页面、修改 API 契约、新增后端模块时，同步更新本手册“附录”和 `frontend/ARCHITECTURE.md`。
2. 本附录基于 2026-08-31 实际仓库文件生成，已移除 v5.5 中已删除的文件（如 `demo.html`、`dev.html`、`manifest.json`、`sw.js`、`icons/`、`theme-override.css`、`*.bak_dynamic` 等）。
3. 若后续重新引入 PWA、Service Worker 等能力，需在附录中同步补回。
