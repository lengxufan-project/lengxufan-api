# 冷旭帆·世界入口 前端地图与跳转关系

> 生成时间：2026-09-01
> 范围：仅限 `frontend/` 目录
> 版本记录：v2.0 — 反映多轮迭代后的完整前端状态

---

## 一、前端文件总表

### HTML（20 个）

| 文件 | 说明 |
|------|------|
| `index.html` | 世界观察中心（主页面） |
| `chat.html` | 独立聊天页（支持 ?char= 参数） |
| `404.html` | 404 页面（世界的缝隙） |
| `about.html` | 关于页面 |
| `character-gallery.html` | 角色图鉴 |
| `character-profile.html` | 人物典籍 |
| `demo-mode.html` | 演示模式 |
| `exploration.html` | 暗夜拾遗（探索） |
| `export.html` | 对话导出 |
| `help.html` | 帮助中心 |
| `journey.html` | 生命之阶（旅程时间线） |
| `login.html` | 登录/注册页 |
| `memory-gallery.html` | 时光回廊 |
| `observer-panel.html` | 观察者之窗 |
| `profile.html` | 个人中心 |
| `relation-map.html` | 星光交织图谱（关系图谱） |
| `relations.html` | 关系温度计 |
| `settings.html` | 设置页 |
| `world-guide.html` | 世界导览 |
| `world-map.html` | 星图导航 |

### CSS（40 个）

| 文件 | 说明 |
|------|------|
| `main.css` | 全局样式（布局、卡片、rail、sb-panel、开场动画、核心视觉等） |
| `sidebar.css` | 侧边栏样式（折叠、导航、通知抽屉） |
| `animations.css` | 开场动画关键帧 |
| `chat.css` | 聊天页样式（沉浸场景、角色光晕、磨砂气泡、时间戳） |
| `emotion-chart.css` | 情绪曲线组件 |
| `scene-transition.css` | 场景转场动画 |
| `character-display.css` | 角色展示组件 |
| `world-clock.css` | 世界时钟组件 |
| `time-lighting.css` | 时段光照组件 |
| `weather-effects.css` | 天气特效组件（增强版 + 碰撞微光） |
| `emotion-particles.css` | 情绪粒子组件 |
| `relation-thermometer.css` | 关系温度计组件 |
| `status-dashboard.css` | 状态仪表盘组件 |
| `character-tooltip.css` | 角色提示框组件 |
| `event-log.css` | 事件日志组件 |
| `scene-shortcut.css` | 场景快捷入口组件 |
| `loading-bar.css` | 加载条组件 |
| `achievement-card.css` | 成就卡片组件 |
| `notification-center.css` | 通知中心组件 |
| `choice-branch.css` | 选择分支组件 |
| `search-panel.css` | 搜索面板组件 |
| `shortcuts-panel.css` | 快捷键面板组件 |
| `skeleton.css` | 骨架屏组件 |
| `about.css` | 关于页样式 |
| `404.css` | 404 页样式 |
| `character-gallery.css` | 角色图鉴样式 |
| `character-profile.css` | 人物典籍样式 |
| `demo-mode.css` | 演示模式样式 |
| `exploration.css` | 探索页样式 |
| `export.css` | 导出页样式 |
| `help.css` | 帮助页样式 |
| `journey.css` | 旅程页样式 |
| `login.css` | 登录页样式 |
| `memory-gallery.css` | 时光回廊样式 |
| `observer-panel.css` | 观察者之窗样式 |
| `profile.css` | 个人中心样式 |
| `relation-map.css` | 关系图谱样式 |
| `settings.css` | 设置页样式 |
| `world-guide.css` | 世界导览样式 |
| `world-map.css` | 星图导航样式 |

### JS（43 个）

| 文件 | 说明 |
|------|------|
| `app.js` | 主入口（开场动画、rail 切换、角色列表 /api/characters、侧边栏、通知、粒子、状态刷新 /api/state、核心视觉粒子系统、群聊 /api/group_chat） |
| `api.js` | 全局 API 封装 |
| `ui.js` | 全局 UI 工具 |
| `scene.js` | 场景管理 |
| `scene-transition.js` | 场景转场动画 |
| `world-clock.js` | 世界时钟 |
| `time-lighting.js` | 时段光照 |
| `emotion-particles.js` | 情绪粒子 |
| `scene-shortcut.js` | 场景快捷入口 |
| `weather-effects.js` | 天气特效（增强版 + 随机碰撞微光） |
| `search-panel.js` | 全局搜索面板 |
| `shortcuts-panel.js` | 快捷键面板 |
| `loading-bar.js` | 加载条 |
| `skeleton.js` | 骨架屏 |
| `state.js` | 全局状态管理 |
| `characters.js` | 角色数据 |
| `chat.js` | 聊天页逻辑（?char= 参数解析、沉浸场景、状态抽屉、打字机） |
| `emotion-chart.js` | 情绪曲线组件 |
| `relation-thermometer.js` | 关系温度计组件 |
| `status-dashboard.js` | 状态仪表盘组件 |
| `character-tooltip.js` | 角色提示框组件 |
| `event-log.js` | 事件日志组件 |
| `achievement-card.js` | 成就卡片组件 |
| `notification-center.js` | 通知中心组件 |
| `choice-branch.js` | 选择分支组件 |
| `about.js` | 关于页交互 |
| `404.js` | 404 页交互 |
| `character-gallery.js` | 角色图鉴逻辑 |
| `character-profile.js` | 人物典籍逻辑 |
| `demo-mode.js` | 演示模式控制 |
| `exploration.js` | 探索页逻辑 |
| `export.js` | 导出页逻辑 |
| `help.js` | 帮助页交互 |
| `journey.js` | 旅程页逻辑 |
| `login.js` | 登录页逻辑 |
| `memory-gallery.js` | 时光回廊逻辑 |
| `observer-panel.js` | 观察者之窗逻辑 |
| `profile.js` | 个人中心逻辑 |
| `relation-map.js` | 关系图谱逻辑 |
| `settings.js` | 设置页逻辑 |
| `world-guide.js` | 世界导览逻辑 |
| `world-map.js` | 星图导航逻辑 |
| `character-display.js` | 角色展示组件 |

---

## 二、页面功能清单

### 1. `index.html` — 世界观察中心
- **核心功能**：主入口页，包含开场动画（粒子云球→曲线→淡入）、三栏骨架（rail + sb-panel + scene）、侧边栏导航、通知抽屉、搜索面板、全局背景粒子、核心视觉粒子聚合球 + 动态曲线（#coreVisual）、场景顶部胶囊信息条（/api/state 真实数据）、底纸天气增强 + 随机碰撞微光、群聊入口（/api/group_chat）、全局 z-index 层级统一
- **可跳转到**：chat.html, chat.html?char=xxx, character-gallery.html, character-profile.html, memory-gallery.html, relation-map.html, relations.html, observer-panel.html, world-map.html, world-guide.html, journey.html, exploration.html, export.html, settings.html, about.html, help.html, profile.html
- **被哪些页面跳转进入**：所有页面（通过 `index.html?skipIntro=1` 返回）

### 2. `chat.html` — 对话
- **核心功能**：与角色聊天，支持 ?char= 参数显示角色名、沉浸场景渐变背景、角色光晕效果、磨砂玻璃气泡、时间戳、情绪曲线、状态抽屉、打字机效果
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（通过 rail chat 面板、角色列表点击、sidebar-nav）

### 3. `404.html` — 世界的缝隙
- **核心功能**：404 错误页，光球粒子动画，点击返回
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：浏览器 404 兜底

### 4. `about.html` — 关于
- **核心功能**：项目简介、核心意象、技术栈，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（settings sb-panel 或 sidebar-nav）

### 5. `character-gallery.html` — 角色图鉴
- **核心功能**：角色网格展示，搜索/标签筛选，分页，独立页面返回按钮和标题视觉统一
- **可跳转到**：character-profile.html?char=xxx, index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

### 6. `character-profile.html` — 人物典籍
- **核心功能**：角色详情（基本信息、内心独白、关系网络），翻页，独立页面返回按钮和标题视觉统一
- **可跳转到**：chat.html?char=xxx, index.html?skipIntro=1
- **被哪些页面跳转进入**：character-gallery.html, index.html（sidebar-nav）

### 7. `demo-mode.html` — 演示模式
- **核心功能**：六幕时间线自动演示，展示全部功能
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：无直接入口（独立模式）

### 8. `exploration.html` — 暗夜拾遗（探索）
- **核心功能**：5 个探索点收集，月光场景，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

### 9. `export.html` — 导出
- **核心功能**：对话导出（JSON/MD/TXT），过滤条件，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

### 10. `help.html` — 帮助中心
- **核心功能**：快捷键、新手引导、常见问题（折叠面板），独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

### 11. `journey.html` — 生命之阶（旅程时间线）
- **核心功能**：垂直时间线，滚动点亮节点，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

### 12. `login.html` — 登录/注册
- **核心功能**：登录、注册、游客进入（游客模式未接 /api/auth/guest）
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：无直接入口（独立页面）

### 13. `memory-gallery.html` — 时光回廊
- **核心功能**：3D 透视记忆卡片，滚轮/拖动切换，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（memory sb-panel 或 sidebar-nav）

### 14. `observer-panel.html` — 观察者之窗
- **核心功能**：情绪仪表盘、压力值、亲密度摘要、深呼吸重置，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

### 15. `profile.html` — 个人中心
- **核心功能**：用户信息、头像、设置，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

### 16. `relation-map.html` — 星光交织图谱（关系图谱）
- **核心功能**：SVG 关系网络，角色节点可点击切换焦点，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

### 17. `relations.html` — 关系温度计
- **核心功能**：关系温度计组件，展示角色亲密度，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

### 18. `settings.html` — 设置
- **核心功能**：主题色、粒子密度、动画开关、字体大小、世界时钟、事件日志，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（settings sb-panel 或 sidebar-nav）

### 19. `world-guide.html` — 世界导览
- **核心功能**：分屏长滚动场景介绍（宿舍/天台/防空洞），独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

### 20. `world-map.html` — 星图导航
- **核心功能**：SVG 星空场景节点，点击切换场景，独立页面返回按钮和标题视觉统一
- **可跳转到**：index.html?skipIntro=1
- **被哪些页面跳转进入**：index.html（sidebar-nav）

---

## 三、主页面三栏结构说明

`index.html` 采用三栏骨架布局，外层包裹 `#app` 容器：

```
#app (position: fixed; inset: 0; 100vw x 100vh; overflow: hidden; flex-direction: column)
├── .intro (开场动画层，z-index 最高)
│   ├── .intro-orb (发光球背景)
│   ├── .intro-content (标题 + "进入世界" 按钮)
│   └── .intro-curves (SVG 曲线)
├── .rail (第一栏，约 56px)
├── .sidebar (第二栏，220px，可折叠)
├── .scene.fullscreen (第三栏，场景区)
├── #coreVisual (核心视觉，z-index 2，居中底部)
├── #globalBg (全局背景粒子)
├── .notify-drawer (通知抽屉，右侧滑入)
├── .search-panel (搜索面板)
└── .scene-topbar (场景顶部胶囊信息条)
```

### 第一栏：`.rail`（领域导航）
- 极窄图标列，固定在左侧（宽度约 56px）
- 5 个 `.rail-item`，点击切换第二栏面板：
  - `◆` **world**（世界）→ 显示 characters 面板
  - `◈` **roster**（角色名册）→ 显示 characters 面板
  - `☰` **chat**（对话）→ 显示 chat 面板
  - `◉` **memory**（回忆）→ 显示 memory 面板
  - `⚙` **settings**（设置）→ 显示 settings 面板

### 第二栏：`.sidebar`（侧边栏）
- 宽度 220px，`position: fixed; left: 0; top: 0; bottom: 0; z-index: 100`
- 包含：
  - **顶部条**：折叠开关 + 标题 + 通知按钮
  - **搜索框**：胶囊形磨砂，点击唤起全局搜索面板
  - **sb-body**：多面板区（`.sb-panel`），随 rail 切换显示：
    - `data-panel="characters"` — 当前角色列表（3 个 .char-item，从 /api/characters 加载）
    - `data-panel="chat"` — 对话入口（"进入对话"链接 + 群聊入口 /api/group_chat）
    - `data-panel="memory"` — 回忆入口（"时光回廊"链接）
    - `data-panel="settings"` — 设置入口（"设置页面"、"关于"链接）
  - **sidebar-nav**：完整导航列表（分组：世界/对话/档案/观测/系统）

### 第三栏：`.scene.fullscreen`（场景区）
- 全屏场景展示区，`z-index` 低于 rail/sidebar，包含：
  - **scene-topbar**：胶囊形磨砂玻璃信息条（世界日/时段/天气/时间），从 /api/state 获取真实数据
  - **scene-label**：场景名称
  - **scene-meta**：天数和时段
  - **scene-acts**：活动列表
  - 2-3 个径向渐变光晕（冰蓝、深蓝、淡紫），opacity 0.05-0.12，慢速 CSS 动画
- 覆盖全局背景粒子（#globalBg）

### 核心视觉：`#coreVisual`
- 位于 `.scene.fullscreen` 中心底部，`z-index: 2`
- 粒子聚合球系统（80-120 粒子，极坐标呼吸动画，聚集 45px / 扩散 70px，4-6s 周期）
- 动态贝塞尔曲线（3-5 条，每条 15-25 粒子，流速 0.04-0.12 t/s）
- 单 requestAnimationFrame 循环 + 性能优化（translate3d、will-change、visibilitychange 暂停/恢复）
- 移动端粒子数减半（40-60）

### 开场动画
- 粒子云球 → 动态曲线 → 淡入主页面，自动过渡
- 点击"进入世界"按钮后触发消失动画
- 直接访问 `index.html?skipIntro=1` 跳过动画

### 全局 z-index 层级
- 底纸（背景）：0
- 场景区：1
- 核心视觉：2
- rail/sidebar：100
- 浮层（通知抽屉、搜索面板）：95
- 开场动画：最高

### 额外组件
- **通知抽屉**（notify-drawer）：从右侧滑入，未读/已读分组（内容目前写死）
- **搜索面板**（search-panel）：全局搜索，Ctrl+K 或点击搜索框打开
- **全局粒子**（#globalBg）：1-3px 冰蓝粒子，3 种速度，从底部向上飘浮

---

## 四、跳转关系图（文本版）

```
index.html
 ├── (rail chat panel → sb-entry-link) → chat.html
 ├── (rail memory panel → sb-entry-link) → memory-gallery.html
 ├── (rail settings panel → sb-entry-link) → settings.html
 ├── (rail settings panel → sb-entry-link) → about.html
 ├── (char-item 点击) → chat.html?char=lengxufan
 ├── (char-item 点击) → chat.html?char=huangjingyun
 ├── (char-item 点击) → chat.html?char=yeqingci
 ├── (sb-panel chat 群聊入口) → /api/group_chat
 ├── (sidebar-nav) → chat.html
 ├── (sidebar-nav) → world-map.html
 ├── (sidebar-nav) → world-guide.html
 ├── (sidebar-nav) → journey.html
 ├── (sidebar-nav) → character-gallery.html
 ├── (sidebar-nav) → character-profile.html
 ├── (sidebar-nav) → memory-gallery.html
 ├── (sidebar-nav) → relation-map.html
 ├── (sidebar-nav) → relations.html
 ├── (sidebar-nav) → observer-panel.html
 ├── (sidebar-nav) → exploration.html
 ├── (sidebar-nav) → settings.html
 ├── (sidebar-nav) → export.html
 ├── (sidebar-nav) → profile.html
 ├── (sidebar-nav) → about.html
 └── (sidebar-nav) → help.html

chat.html
 └── (goBack) → index.html?skipIntro=1

character-gallery.html
 ├── (角色卡片点击) → character-profile.html?char=xxx
 └── (goBack) → index.html?skipIntro=1

character-profile.html
 ├── (翻页) → character-profile.html?char=xxx
 ├── (对话按钮) → chat.html?char=xxx
 └── (goBack) → index.html?skipIntro=1

settings.html
 └── (goBack) → index.html?skipIntro=1

about.html
 └── (goBack) → index.html?skipIntro=1

help.html
 └── (goBack) → index.html?skipIntro=1

memory-gallery.html
 └── (goBack) → index.html?skipIntro=1

relation-map.html
 └── (goBack) → index.html?skipIntro=1

relations.html
 └── (goBack) → index.html?skipIntro=1

observer-panel.html
 └── (goBack) → index.html?skipIntro=1

world-map.html
 └── (goBack) → index.html?skipIntro=1

world-guide.html
 └── (goBack) → index.html?skipIntro=1

journey.html
 └── (goBack) → index.html?skipIntro=1

exploration.html
 └── (goBack) → index.html?skipIntro=1

export.html
 └── (goBack) → index.html?skipIntro=1

profile.html
 └── (goBack) → index.html?skipIntro=1

404.html
 └── (goBack) → index.html?skipIntro=1

login.html
 ├── (登录成功) → index.html?skipIntro=1
 ├── (注册成功) → index.html?skipIntro=1
 └── (游客进入) → index.html?skipIntro=1（待接 /api/auth/guest）

demo-mode.html
 ├── (进入世界按钮) → index.html?skipIntro=1
 ├── (Esc 退出) → index.html?skipIntro=1
 └── (双击退出) → index.html?skipIntro=1
```

---

## 五、功能到文件映射表

| 功能 | 涉及文件 |
|------|----------|
| 主页面布局（#app 容器 + 三栏骨架） | `index.html`, `css/main.css` |
| 侧边栏（折叠、导航） | `css/sidebar.css`, `index.html` |
| 第一栏切换（rail） | `index.html`, `js/app.js`（`initRailSwitching`） |
| 第二栏面板（sb-panel） | `index.html`, `css/main.css`（`.sb-panel`/`.sb-list`/`.sb-entry-link`） |
| 开场动画（粒子云球→曲线→淡入） | `index.html`（intro DOM）, `css/animations.css`, `js/app.js`（intro 时间线） |
| 核心视觉（粒子聚合球 + 动态曲线） | `index.html`（#coreVisual）, `js/app.js`（`initCoreVisual`）, `css/main.css`（`.core-visual`/`.cv-particle`） |
| 全局背景粒子 | `index.html`（#globalBg）, `js/app.js`（`initGlobalParticles`） |
| 场景顶部胶囊信息条（/api/state） | `index.html`, `js/app.js`（`refreshState`/`renderSceneTopbar`） |
| 天气特效（增强版 + 碰撞微光） | `js/weather-effects.js`, `css/weather-effects.css`, `js/app.js`（`refreshState`） |
| 时段光照 | `js/time-lighting.js`, `css/time-lighting.css`, `js/app.js`（`refreshState`） |
| 底纸光晕（径向渐变，慢速动画） | `css/main.css`（`.scene-halos`） |
| 情绪曲线 | `js/emotion-chart.js`, `css/emotion-chart.css` |
| 聊天页（沉浸感） | `chat.html`, `css/chat.css`, `js/chat.js` |
| 聊天页 ?char= 参数 | `chat.html`, `js/chat.js`（URL 参数解析） |
| 聊天页沉浸场景渐变 + 角色光晕 | `css/chat.css`, `chat.html` |
| 聊天页磨砂气泡 + 时间戳 | `css/chat.css`, `chat.html` |
| 状态抽屉 | `chat.html`, `css/chat.css`, `js/chat.js`（`toggleDrawer`） |
| 通知抽屉 | `index.html`, `css/notification-center.css`, `js/notification-center.js`, `js/app.js`（事件绑定） |
| 搜索面板 | `js/search-panel.js`, `css/search-panel.css`, `index.html`（搜索入口）, `js/app.js`（绑定） |
| 快捷键面板 | `js/shortcuts-panel.js`, `css/shortcuts-panel.css` |
| 角色列表（sb-char-list，/api/characters） | `index.html`（#sbCharList）, `js/app.js`（`bindCharItemClicks`/`renderActiveCharacters`） |
| 群聊入口（/api/group_chat） | `index.html`, `js/app.js`（`initGroupChat`） |
| 角色画廊 | `character-gallery.html`, `css/character-gallery.css`, `js/character-gallery.js` |
| 人物典籍 | `character-profile.html`, `css/character-profile.css`, `js/character-profile.js` |
| 关系图谱 | `relation-map.html`, `css/relation-map.css`, `js/relation-map.js` |
| 关系温度计 | `relations.html`, `css/relation-thermometer.css`, `js/relation-thermometer.js` |
| 时光回廊 | `memory-gallery.html`, `css/memory-gallery.css`, `js/memory-gallery.js` |
| 观察者之窗 | `observer-panel.html`, `css/observer-panel.css`, `js/observer-panel.js` |
| 星图导航 | `world-map.html`, `css/world-map.css`, `js/world-map.js` |
| 世界导览 | `world-guide.html`, `css/world-guide.css`, `js/world-guide.js` |
| 旅程时间线 | `journey.html`, `css/journey.css`, `js/journey.js` |
| 探索 | `exploration.html`, `css/exploration.css`, `js/exploration.js` |
| 导出 | `export.html`, `css/export.css`, `js/export.js` |
| 设置 | `settings.html`, `css/settings.css`, `js/settings.js` |
| 关于 | `about.html`, `css/about.css`, `js/about.js` |
| 帮助 | `help.html`, `css/help.css`, `js/help.js` |
| 个人中心 | `profile.html`, `css/profile.css`, `js/profile.js` |
| 登录 | `login.html`, `css/login.css`, `js/login.js` |
| 404 | `404.html`, `css/404.css`, `js/404.js` |
| 演示模式 | `demo-mode.html`, `css/demo-mode.css`, `js/demo-mode.js` |
| 场景组件 | `js/scene.js`, `js/scene-transition.js`, `css/scene-transition.css` |
| 世界时钟 | `js/world-clock.js`, `css/world-clock.css` |
| 加载条 | `js/loading-bar.js`, `css/loading-bar.css` |
| 骨架屏 | `js/skeleton.js`, `css/skeleton.css` |
| 独立页面返回按钮 + 标题视觉统一 | 所有独立页面（`about.html`, `settings.html`, `help.html` 等）各自的 HTML/CSS/JS |
| 全局 z-index 层级系统 | `css/main.css`（z-index 变量/常量）, `index.html`（DOM 层级顺序） |

---

## 六、已知问题与风险

### 已确认但不影响通行的视觉/交互问题

1. **`.nav-link::before` 指示条定位偏移**
   - 文件：`css/sidebar.css` 第 183 行
   - 问题：`left: 56px` 使冰蓝指示条偏离 nav-link 左侧边缘，实际指示条出现在 nav-link 右侧 56px 处
   - 原因：该值从旧版布局继承，未随新版 sidebar 定位更新
   - 影响：悬停/激活时左侧冰蓝指示条不可见（不影响点击跳转）
   - 修复建议：将 `left: 56px` 改为 `left: 0` 或 `left: -2px`

2. **sidebar-nav 与 sb-body 可能重叠**
   - 文件：`index.html`
   - 问题：sidebar-nav 在 sb-body 之后，当 sb-body 内容较多时，导航列表可能被推到可视区域外
   - 影响：用户需要滚动 sidebar 才能看到完整导航列表
   - 修复建议：为 sidebar-nav 设置固定高度或限制最大高度

3. **部分页面 `goBack` 与浏览器后退按钮行为不一致**
   - 文件：所有含 `goBack` 的 JS 文件
   - 问题：`goBack()` 使用 `document.referrer` 判断来源，但 `referrer` 可能被浏览器安全策略限制为空
   - 影响：无来源时正常回退到 `index.html?skipIntro=1`，只是无法使用 `history.back()`
   - 严重程度：低（兜底逻辑正常）

4. **`renderActiveCharacters()` 的旧版 `#sidebarCharacters` 兼容路径**
   - 文件：`js/app.js`
   - 问题：保留了旧版 `#sidebarCharacters` 的兼容代码，增加维护成本
   - 影响：不影响当前功能，仅代码冗余

5. **`demo-mode.js` 的 "进入世界" 按钮和 `exitDemo` 已修复**
   - 修复前：导航到 `index.html`（重播开场动画）
   - 修复后：导航到 `index.html?skipIntro=1`（跳过开场动画）

6. **`relation-thermometer.js` 组件未在 `relation-map.html` 中使用**
   - 说明：`relation-thermometer.js` 是一个独立组件，被 `relations.html` 使用，而非 `relation-map.html`
   - 影响：命名可能引起混淆，但不影响功能

### 已知未完成项

7. **移动端侧边栏抽屉未实现**
   - 说明：移动端（max-width: 768px）的 sidebar 折叠/展开动画和触控交互已跳过，待后续单独处理
   - 影响：移动端无法正常使用侧边栏导航

8. **login.html 游客模式未接 /api/auth/guest**
   - 说明：登录页的"游客进入"按钮尚未对接后端游客接口
   - 影响：游客入口无实际功能

9. **情绪/关系阶段在角色列表显示 "--"**
   - 说明：角色列表中的情绪状态和关系阶段字段显示 "--"，等待后端支持批量状态接口
   - 影响：角色列表信息不完整

10. **通知中心内容写死**
    - 说明：通知抽屉中的通知列表为静态写死数据，未对接后端通知接口
    - 影响：通知不可动态更新

11. **成就博物馆未实现**
    - 说明：成就/勋章系统目前仅有前端组件（`achievement-card.js`/`.css`），但无完整页面和接口对接
    - 影响：成就功能不可用

---

## 七、下一步建议

### 联调建议
1. **逐一验证所有页面跳转**：从 index.html 出发，点击每个 sidebar-nav 链接，确认目标页面正常加载，返回按钮正常工作
2. **测试移动端跳转**：在 768px 以下视口测试侧边栏折叠/展开和 rail 切换
3. **测试开场动画跳过**：访问 `index.html?skipIntro=1` 确认动画被跳过
4. **测试聊天页参数**：访问 `chat.html?char=huangjingyun` 确认角色切换
5. **验证 /api/state 数据流**：检查 scene-topbar 是否实时反映世界状态
6. **验证 /api/characters 数据流**：检查角色列表是否正确渲染

### 视觉优化建议
1. **修复 `nav-link::before` 指示条定位**：将 `left: 56px` 改为 `left: 0`
2. **统一导航入口样式**：`sb-entry-link` 和 `nav-link` 的视觉风格应保持一致
3. **优化 sidebar-nav 滚动**：为 `.sidebar-nav` 添加 `max-height` 和 `overflow-y: auto`，避免与 sb-body 冲突
4. **添加活跃角色高亮状态**：当前 `.char-item.current` 样式缺失，可添加冰蓝边框和发光效果
5. **核心视觉性能监控**：在低端设备上测试 #coreVisual 粒子系统的帧率，必要时进一步减少粒子数

### 待完成功能
1. **移动端侧边栏抽屉**：实现 768px 以下 sidebar 的滑入/滑出动画和触控手势
2. **login.html 游客对接**：接入 `/api/auth/guest` 接口
3. **批量状态接口**：推动后端提供批量角色状态接口，消灭 "--" 占位
4. **通知中心对接**：接入后端通知 API，替换写死数据
5. **成就博物馆**：实现完整的成就页面和接口对接

### 架构建议
1. **移除冗余的旧版兼容代码**：`renderActiveCharacters()` 中的 `#sidebarCharacters` 兼容路径可择机清理
2. **统一导航体系**：当前 rail + sb-panel + sidebar-nav 三套导航入口并存，长期可考虑简化为一套