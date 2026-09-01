# 冷旭帆·世界入口 前端架构文档

> 本文档由 2026-09-01 全量扫描生成，覆盖 frontend/ 下全部 HTML/CSS/JS 文件。
> 阅读对象：不熟悉本项目的开发者。

---

## 一、项目总览

### 项目定位

「冷旭帆·世界入口」是一个 AI 角色扮演 / 陪伴类 Web 应用。用户以"王旺"（主角冷旭帆的室友）的身份进入世界，与冷旭帆及其他角色对话互动。前端负责呈现世界状态（情绪 / 天气 / 时段 / 关系）、聊天界面、场景氛围，以及多个独立浏览的辅助页面（角色画廊、关系图谱、时光回廊等）。

### 技术栈
- **原生 HTML / CSS / JavaScript**：无框架、无构建工具、无 npm 依赖，直接由 Flask 静态托管。
- **模块模式**：每个 JS 文件为 ES5 风格 IIFE，通过 `window.XXX` 暴露全局单例模块（如 `window.API`、`window.ChatPage`）。
- **数据流**：所有后端请求经 `js/chat.js` 或独立页面自身的 `fetch` 发起；主页面通过 `window.State` 保存/读取共享状态；模块间调用使用 `if (window.XXX && window.XXX.fn)` 守卫式判空。
- **后端**：Flask（见仓库根 `app.py` 与 `routes/` 蓝图），前端仅通过 `/api/*` JSON 接口通信。

### 文件统计
| 类型 | 数量 | 说明 |
|---|---|---|
| HTML | 20 | 1 个主页面 + 19 个独立页面 |
| CSS | 40 | `css/` 目录，按页面/组件一文件 |
| JS | 43 | `js/` 目录，按页面/组件一文件 |

---

## 二、文件结构树

```
frontend/
├─ index.html                  # 主页面（世界入口，唯一复杂页面）
├─ chat.html                   # 独立聊天页（动态注入情绪曲线组件）
├─ ARCHITECTURE.md             # 本文档
│
├─ css/                        # 40 个样式文件
│  ├─ main.css                 # 全局基础 + 主页面布局（最重要）
│  ├─ animations.css           # 全局 @keyframes + 开场动画
│  ├─ sidebar.css              # 左侧侧边栏（一级导航 + 角色快捷区）
│  ├─ chat.css                 # 独立聊天页样式（磨砂玻璃 + 冰蓝风格）
│  ├─ skeleton.css             # 数据加载骨架屏（仅 index）
│  ├─ loading-bar.css          # 顶部加载进度条
│  ├─ emotion-chart.css        # 情绪折线图组件（chat.html 动态注入）
│  ├─ scene-transition.css     # 场景切换过渡
│  ├─ character-display.css    # 角色立绘展示
│  ├─ world-clock.css          # 世界时钟
│  ├─ relation-thermometer.css # 关系温度计
│  ├─ status-dashboard.css     # 状态仪表盘
│  ├─ character-tooltip.css    # 角色悬浮提示
│  ├─ event-log.css            # 事件日志
│  ├─ scene-shortcut.css       # ←/→ 场景切换提示
│  ├─ weather-effects.css      # 雨/雪/风/阴天气特效
│  ├─ time-lighting.css        # 时段氛围光（深夜/清晨/正午/黄昏/夜晚）
│  ├─ emotion-particles.css    # 情绪粒子层
│  ├─ achievement-card.css     # 成就卡片
│  ├─ notification-center.css  # 通知中心
│  ├─ choice-branch.css        # 对话分支选择
│  ├─ search-panel.css         # 全局搜索面板（Ctrl+K）
│  ├─ shortcuts-panel.css      # 快捷键面板（? 键）
│  ├─ 404.css / about.css / character-gallery.css / character-profile.css
│  ├─ demo-mode.css / exploration.css / export.css / help.css
│  ├─ journey.css / login.css / memory-gallery.css / observer-panel.css
│  ├─ profile.css / relation-map.css / settings.css
│  └─ world-guide.css / world-map.css
│
└─ js/                         # 43 个脚本文件
   ├─ app.js                   # 主页面启动器/编排器（最核心，必须最后加载）
   ├─ chat.js                  # 独立聊天页启动器（window.ChatPage，自包含）
   ├─ api.js                   # window.API —— 所有后端 fetch 的唯一出口
   ├─ state.js                 # window.State —— 跨模块共享状态
   ├─ loading-bar.js           # window.LoadingBar —— 顶部进度条（api.js 依赖）
   ├─ skeleton.js              # window.Skeleton —— 骨架屏 show/hide
   ├─ ui.js                    # window.UI —— 消息气泡渲染、状态渲染
   ├─ scene.js                 # window.Scene —— 场景文案与切换
   ├─ characters.js            # window.Characters —— 角色注册/切换
   ├─ scene-transition.js      # window.SceneTransition
   ├─ character-display.js     # window.CharacterDisplay（依赖 State）
   ├─ emotion-chart.js         # window.EmotionChart —— SVG 折线图（chat.html 动态注入）
   ├─ world-clock.js           # window.WorldClock
   ├─ relation-thermometer.js  # window.RelationThermometer
   ├─ status-dashboard.js      # window.StatusDashboard
   ├─ character-tooltip.js     # window.CharacterTooltip
   ├─ event-log.js             # window.EventLog
   ├─ scene-shortcut.js        # window.SceneShortcut（依赖 SceneTransition）
   ├─ weather-effects.js       # window.WeatherEffects
   ├─ time-lighting.js         # window.TimeLighting（依赖 WorldClock）
   ├─ emotion-particles.js     # window.EmotionParticles
   ├─ achievement-card.js      # window.AchievementCard
   ├─ notification-center.js   # window.NotificationCenter
   ├─ choice-branch.js         # window.ChoiceBranch
   ├─ search-panel.js          # window.SearchPanel（依赖 State/UI）
   ├─ shortcuts-panel.js       # window.ShortcutsPanel（依赖 Chat/SearchPanel）
   ├─ scene.js / state.js / ui.js / characters.js
   ├─ 404.js / about.js / character-gallery.js / character-profile.js
   ├─ demo-mode.js / exploration.js / export.js / help.js
   ├─ journey.js / login.js / memory-gallery.js / observer-panel.js
   ├─ profile.js / relation-map.js / settings.js
   └─ world-guide.js / world-map.js
```

---

## 三、页面清单与功能

### 3.1 主页面

| 文件 | 标题 | 核心功能 | 引用 CSS | 引用 JS | 后端 API |
|---|---|---|---|---|---|
| index.html | 冷旭帆 · 世界观察中心 | 主界面：开场动画、侧边栏、场景氛围、世界状态、搜索/快捷键面板 | main, sidebar, animations, scene-transition, world-clock, loading-bar, scene-shortcut, weather-effects, time-lighting, emotion-particles, search-panel（共 11） | loading-bar, api, ui, scene, scene-transition, world-clock, time-lighting, emotion-particles, scene-shortcut, weather-effects, search-panel, app（共 12，app.js 必须最后） | /api/state、/api/chat、/api/group_chat、/api/characters |

> 注：index.html 近期已精简为纯粹的世界观察中心，聊天功能已迁移至 chat.html。引用 CSS/JS 数量较早期版本大幅减少。

### 3.2 独立页面（19 个）

| 文件 | 标题 | 核心功能 | 引用 CSS | 引用 JS | 后端 API |
|---|---|---|---|---|---|
| 404.html | 404 · 世界的缝隙 | 错误页，JS 延迟跳回主页（带 skipIntro=1） | main, 404 | 404 | - |
| about.html | 世界入口 · 关于 | 项目介绍、返回主页（skipIntro=1） | main, about | about | - |
| character-gallery.html | 群像画廊 | 角色网格展示，点击跳转人物典籍 | main, character-gallery | character-gallery | GET /api/characters |
| character-profile.html | 人物典籍 | 角色档案卡片（预设数据） | main, character-profile | character-profile | - |
| chat.html | 冷旭帆 · 对话 | 独立聊天页：单角色对话、情绪曲线抽屉、状态轮询 | main, chat（动态注入 emotion-chart） | chat（动态注入 emotion-chart） | POST /api/chat、GET /api/state |
| demo-mode.html | 演示模式 · 预告片 | 演示模式（后端路由 /demo），纯前端模拟对话 | main, demo-mode | demo-mode | - |
| exploration.html | 暗夜拾遗 | 探索发现页（预设内容） | main, exploration | exploration | - |
| export.html | 导出对话 · 时光档案馆 | 拉取会话历史并展示/导出 | main, export | export | GET /api/conversations |
| help.html | 帮助中心 | 折叠面板式帮助、左侧导航滚动 | main, help | help | - |
| journey.html | 生命之阶 | 旅程时间线（预设数据） | main, journey | journey | - |
| login.html | 冷旭帆 · 世界入口 | 登录/游客进入（前端模拟，成功跳 index?skipIntro=1） | main, login | login | - |
| memory-gallery.html | 时光回廊 | 3D 视差记忆卡片墙（预设数据） | main, memory-gallery | memory-gallery | - |
| observer-panel.html | 观察者之窗 | 情绪环仪表盘，每 3s 轮询状态 | main, observer-panel | observer-panel | GET /api/state |
| profile.html | 个人中心 | 读取当前登录用户信息 | main, profile | api, profile | GET /api/auth/me |
| relation-map.html | 星光交织图谱 | 关系网络图（预设数据） | main, relation-map | relation-map | - |
| relations.html | 关系温度计 | 关系温度计条（RelationThermometer 独立使用） | main, relation-thermometer | relation-thermometer | - |
| settings.html | 冷旭帆 · 设置 | 粒子密度等本地偏好（history.back() 返回） | main, settings | settings | - |
| world-guide.html | 世界导览 | 分屏滚动世界观介绍（宿舍/天台/防空洞） | main, world-guide | world-guide | - |
| world-map.html | 星图导航 | 场景星图，读取世界状态 | main, world-map | world-map | GET /api/state |

> 所有独立页面的"返回"链接均为 `index.html?skipIntro=1`，避免回主页重播开场动画。

---

## 四、CSS 模块说明

### 4.1 全局基础（被多个页面引用）
| 文件 | 作用 | 主要类名/选择器 | 依赖 |
|---|---|---|---|
| main.css | 全局变量级基础样式、body 限宽居中（max-width 1200px）、主页面 .app 相对定位布局、.header/.scene 布局、聊天气泡 .bubble 等 | .app .header .scene .bubble .floating-ball | 无（最先加载） |
| animations.css | 全部 @keyframes 集中地 + 开场动画（#intro 时序 4s） | .intro .intro-ball .intro-text .intro-particle .floating-ball | ballBreath 被 index/login 使用 |
| loading-bar.css | 顶部加载进度条 | #loadingBar | - |
| sidebar.css | 左侧侧边栏（桌面固定 220px，移动端抽屉） | .sidebar .sidebar-toggle .nav-link .char-link .sidebar-search | ballBreath（animations.css） |
| skeleton.css | 骨架屏（光带 shimmer） | .skeleton-block .sk-box .sk-bubble .sk-hidden/.sk-fade | - |
| chat.css | 独立聊天页全量样式（磨砂玻璃、冰蓝风格） | .cp-page .cp-topbar .cp-chat-area .cp-input-bar .cp-status-drawer | - |

### 4.2 主页面组件（仅 index.html 加载）
| 文件 | 作用 | 主要类名 |
|---|---|---|
| scene-transition.css | 场景切换淡入淡出 | .scene-transition |
| world-clock.css | 世界时钟胶囊 | .world-clock |
| scene-shortcut.css | ←/→ 场景切换浮层 | .scene-hint |
| weather-effects.css | 雨/雪/风/阴粒子层 | #weatherLayer .rain .snow |
| time-lighting.css | 时段氛围光（data-time-of-day 驱动 .scene 渐变） | .scene[data-time-of-day] |
| emotion-particles.css | 情绪粒子层 | #emotionParticles .emotion-particle |
| search-panel.css | Ctrl+K 搜索模态 | .sp-mask .sp-panel |

### 4.3 独立页面样式（main.css + 自身 css 一一对应）
`404 / about / character-gallery / character-profile / chat / demo-mode / exploration / export / help / journey / login / memory-gallery / observer-panel / profile / relation-map / settings / world-guide / world-map` 各有一个同名 css，仅定义本页私有类（普遍使用页面前缀如 `.wg-` `.cp-` 避免冲突）。其中 `login.css` 自带一份 `ballBreath`（login.html 不加载 animations.css，故不冲突）。

### 4.4 特殊：chat.html 动态注入 emotion-chart.css/js
chat.html 的 HTML 结构未静态引用 `emotion-chart.css` 和 `emotion-chart.js`。`chat.js` 在运行时检测 `window.EmotionChart` 是否存在，若不存在则通过 `document.createElement` 动态创建 `<link>` 和 `<script>` 标签注入到 `<head>` 末尾。这保证了情绪曲线在抽屉中的发光点效果与主页面一致，同时不增加 chat.html 的静态依赖。

### 4.5 跨文件同名 @keyframes（潜在冲突，详见第七章）
- `flowShine`：animations.css（-50%→150%）与 relation-thermometer.css（-30%→130%）定义不同，index.html 上后者加载靠后而生效。
- `chartBallPulse`：animations.css（弱光晕）与 emotion-chart.css（强光晕）定义不同，index.html 上前者加载靠后而生效。
- `ballBreath`：animations.css 与 login.css 定义不同，但无任何页面同时加载两者，实际不冲突。

---

## 五、JS 模块说明

### 5.1 核心管线（index.html 专属，加载顺序即下表顺序）
| 顺序 | 文件 | 全局对象 | 主要函数 | 依赖 |
|---|---|---|---|---|
| 1 | loading-bar.js | LoadingBar | start() / finish() | - |
| 2 | api.js | API | getState / getCharacters / chat(message,charId) / groupChat(message) | LoadingBar、UI（错误提示） |
| 3 | ui.js | UI | addMessage / updateState / renderEmotionChart / showTyping | - |
| 4 | scene.js | Scene | update(state) | - |
| 5 | scene-transition.js | SceneTransition | 过渡动画 | - |
| 6 | world-clock.js | WorldClock | update(timeOfDay, day) | - |
| 7 | time-lighting.js | TimeLighting | init() / update(timeOfDay)（.scene[data-time-of-day]） | WorldClock |
| 8 | emotion-particles.js | EmotionParticles | init()（自建 #emotionParticles）/ update(emotion) | - |
| 9 | scene-shortcut.js | SceneShortcut | ←/→ 键盘切换场景 | SceneTransition |
| 10 | weather-effects.js | WeatherEffects | init()（自建 #weatherLayer）/ update(weather) | - |
| 11 | search-panel.js | SearchPanel | init() / open() / close()（Ctrl+K，自建模态） | State、UI |
| 12 | app.js | （编排器，无全局导出） | init() / refreshState()（2s 轮询）/ endIntro() / 侧边栏 toggle | 上述全部（守卫式调用） |

**app.js 职责细节**：
- 开场动画编排：非对称电影感构图，4s 时序（粒子聚拢 → 光球呼吸 → 文字淡入 → 按钮脉冲），点击"进入世界"按钮后移除 #intro。
- `skipIntro=1` URL 参数：初始化即调用 `endIntro()` 跳过动画。
- 侧边栏：`#sidebarToggle` 点击切换 `.collapsed`（桌面）/`.open`（移动）；按 pathname 高亮 `.nav-link.active`；角色快捷区 `.char-link` 高亮当前角色。
- 轮询：每 2s `API.getState()` → 派发到 Scene/WorldClock/TimeLighting/WeatherEffects 等。

### 5.2 独立页面脚本（每页一个，自包含）
| 文件 | 全局对象 | 说明 | 后端依赖 |
|---|---|---|---|
| 404.js | - | 倒计时跳转 index?skipIntro=1 | - |
| about.js | - | 拦截返回按钮跳转（preventDefault 后 location.href） | - |
| character-gallery.js | - | 拉取 /api/characters 渲染网格（失败用预设兜底） | GET /api/characters |
| character-profile.js | CharacterProfile | 静态档案渲染 | - |
| chat.js | ChatPage | 独立聊天页：自包含 fetch 方案，不依赖 api.js/ui.js；动态注入 emotion-chart 组件；2s 轮询状态；打字机效果 | POST /api/chat、GET /api/state |
| demo-mode.js | - | 演示模式对话模拟（纯前端） | - |
| exploration.js | Exploration | 探索内容渲染 | - |
| export.js | - | 拉取 /api/conversations（需登录 session） | GET /api/conversations |
| help.js | HelpPage | 折叠面板/导航滚动/? 键跳转 | - |
| journey.js | Journey | 时间线渲染 | - |
| login.js | - | 登录表单校验 + 游客进入跳转 | -（前端模拟） |
| memory-gallery.js | MemoryGallery | 3D 卡片、视差、拖拽（预设记忆数据） | - |
| observer-panel.js | ObserverPanel | 3s 轮询 /api/state 渲染情绪环；"深呼吸"归零动画 | GET /api/state |
| profile.js | - | 读取 /api/auth/me 渲染个人信息 | GET /api/auth/me |
| relation-map.js | RelationMap | 关系网络图（预设） | - |
| settings.js | WorldSettings | 本地偏好（粒子密度等；引用 #globalParticles 已判空） | - |
| world-guide.js | WorldGuide | 滚动监听高亮导航点、粒子方向随场景 | - |
| world-map.js | WorldMap | 拉取 /api/state 渲染星图 | GET /api/state |

---

## 六、全局状态与 API 契约

### 6.1 window 全局对象清单（36 个）
`API, LoadingBar, Skeleton, State, UI, Chat, Scene, Characters, SceneTransition, CharacterDisplay, EmotionChart, WorldClock, TimeLighting, EmotionParticles, RelationThermometer, StatusDashboard, CharacterTooltip, EventLog, SceneShortcut, WeatherEffects, AchievementCard, NotificationCenter, ChoiceBranch, SearchPanel, ShortcutsPanel, ChatPage, CharacterProfile, Exploration, HelpPage, Journey, MemoryGallery, ObserverPanel, RelationMap, WorldGuide, WorldMap, WorldSettings`

附加全局变量：`window._emotionHistory`（app.js 维护的情绪历史数组，供 EmotionChart 使用）。

无任何重名定义（已扫描验证）。

### 6.2 API 端点契约（前端视角）

#### GET /api/state（调用方：api.js / chat.js / observer-panel.js / world-map.js）
响应 `get_engine_snapshot()`：
```json
{
  "emotion": 62, "emotion_label": "稍好",
  "body": "...", "mind": "...", "relationship": "...",
  "wang_claim": false, "wang_trust": 0, "verified_evidence": [],
  "last_thought": "...", "pending_question": null,
  "user_state": {...},
  "world": { "day": 3, "time_of_day": "黄昏", "weather": "小雨", "weather_desc": "..." },
  "recent_events": ["..."],
  "dorm_activities": [...],
  "last_milestone": null
}
```
前端高频使用字段：`emotion`、`world.day`、`world.time_of_day`、`world.weather`。

#### POST /api/chat（调用方：api.js → Chat、chat.js → ChatPage）
请求：`{ "message": "...", "char_id": "lengxufan", "group_context": "" }`
响应：`{ "reply": "...", "state": {…同 /api/state…} }`

#### POST /api/group_chat（调用方：api.js → Chat.toggleGroup）
请求：`{ "message": "..." }`
响应：`{ "replies": [ {…}, … ] }`

#### GET /api/characters（调用方：api.js / character-gallery.js）
响应：角色数组（api.js 兼容 `[...]` 与 `{ "value": [...] }` 两种包裹）。

#### GET /api/conversations（调用方：export.js；需登录 session）
响应：`[ { "id", "role", "content", "annotation", "state_snapshot", "created_at" }, … ]`

#### GET /api/auth/me（调用方：profile.js）
响应：当前登录用户信息（未登录返回错误）。

#### 后端存在但前端未调用
- `POST /api/auth/register|login|guest|logout`
- `PUT /api/conversations/<msg_id>/annotate`

> 约束：修改任何 fetch 的 URL / 请求字段 / 响应字段读取时，必须与 `routes/*.py` 保持同步，不得单方面改变契约。

---

## 七、布局体系

### 7.1 固定视口方案（A4 纸式布局）

整个应用采用"固定视口矩形"方案，保证浏览器缩放（Ctrl+滚轮）时布局不拉伸错位：

```
html { background: #07080d; }
body {
  max-width: 1200px;          /* 居中限宽 */
  margin: 0 auto;
  overflow: hidden;            /* 禁止 body 滚动，所有滚动在内部容器处理 */
  height: 100%;                /* 固定高度 */
}
.app {
  position: relative;          /* 相对于 body 定位，非 fixed */
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1;
}
```

原理：html 提供深色背景作为呼吸空间，body 居中限宽（1200px），内部 #app 相对定位铺满 body。所有固定定位元素（悬浮球、通知按钮、搜索面板等）都放在 #app 容器内，避免浏览器缩放时与视口基准错位。

### 7.2 侧边栏布局（一级导航 + 角色快捷区）

侧边栏结构（`sidebar.css`）：
- **顶部条**：汉堡菜单按钮（☰）、标题"世界入口"、通知铃铛图标
- **搜索框**：胶囊形磨砂玻璃，点击触发全局搜索面板（Ctrl+K）
- **一级导航**（`.sidebar-nav`）：按"世界/档案/观测/系统"分组，每组有 `.nav-group-title` 标题，下方为 `.nav-link` 链接项
- **角色快捷区**（`.sidebar-characters`）：三个活跃角色（冷旭帆/黄景云/叶清辞）的圆形头像快捷链接，点击跳转 `chat.html?char=xxx`；底部"查看全部角色 →"链接
- **底部**：呼吸指示灯 + 当前时间/天气

侧边栏样式参数：
- 桌面：`position: fixed; left: 0; top: 0; bottom: 0; width: 220px; z-index: 100`
- 移动端（max-width: 768px）：默认隐藏（`width: 0; transform: translateX(-100%)`），展开时 `width: 80%; max-width: 280px`

### 7.3 主页面布局（index.html）

```
body(max-width:1200px)
  └─ .app(relative, flex-column)
       ├─ .sidebar(fixed, left:0, width:220px, z-index:100)
       │    ├─ .sidebar-topbar: 汉堡菜单 + 标题 + 通知铃铛
       │    ├─ .sidebar-search: 胶囊搜索框（触发 Ctrl+K 面板）
       │    ├─ .sidebar-nav: 一级导航分组
       │    ├─ .sidebar-characters: 角色快捷区
       │    └─ .sidebar-footer: 呼吸灯 + 时间/天气
       ├─ .scene(fullscreen, margin-left:220px): 场景氛围
       ├─ #floatingBall: 开场动画终点球
       └─ (通知抽屉、搜索面板等覆盖层)
```

### 7.4 聊天页布局（chat.html）

```
body(max-width:1200px)
  └─ .cp-page(fixed 视口矩形)
       ├─ .cp-topbar: 返回 ← + 角色名 + 情绪标签 + 状态抽屉按钮
       ├─ .cp-chat-area: 消息列表（可滚动）
       ├─ .cp-input-bar: 磨砂玻璃输入区（24px 圆角）
       │    ├─ .cp-input-wrap: 文本框容器
       │    └─ .cp-send: 发送按钮（冰蓝发光）
       ├─ .cp-status-drawer: 右侧状态抽屉（300px / 移动端全屏）
       └─ .cp-drawer-mask: 抽屉遮罩层
```

---

## 八、已知问题与优化建议

### 已确认的潜在冲突（本次未修改，避免视觉变化）
1. **同名 @keyframes 定义不同**（跨文件）：
   - `flowShine`：main.css / animations.css 使用（-50%→150%），relation-thermometer.css 定义（-30%→130%）且在 index.html 上加载靠后而胜出。建议未来将两者重命名为 `flowShineWide` / `flowShineNarrow` 并各自引用。
   - `chartBallPulse`：emotion-chart.css（强光晕）与 animations.css（弱光晕）定义不同，index.html 上 animations.css 靠后胜出。建议重命名其一。
   - `ballBreath`：login.css 与 animations.css 定义不同，但无页面同时加载两者，当前无实际冲突。
2. **层叠依赖**：main.css 尾部有意覆盖 emotion-chart.css（透明化图表容器）与 character-display.css（.charinfo 增强）。调整加载顺序会改变视觉，勿轻易重排 index.html 的 CSS 顺序。
3. **重复结构**：各独立页面各自实现"返回"按钮（17 处跳主页链接），为独立页面设计使然；如需统一可抽公共小部件，但会引入共享 JS 依赖。
4. **window._emotionHistory**：挂在全局的临时情绪历史（上限 20 条），更规范做法是纳入 `window.State`。
5. **demo-mode**：纯前端模拟，未接 /api/chat；若要接入需复用 api.js。
6. **导出页登录态**：/api/conversations 需要登录 session，未登录时 export.html 拿到 401，目前仅静默展示空态。
7. **移动端媒体查询覆盖**：world-guide / search-panel / shortcuts-panel / sidebar / skeleton / demo-mode 等较新文件已有 768px 适配；memory-gallery / observer-panel / world-map / exploration 等页面尚无移动端查询（窄屏体验待优化）。
8. **未接入后端的功能**：login 为前端模拟（未调 /api/auth/guest），如需真实登录态（影响 export/profile），应改调后端。
9. **chat.js 自包含 fetch**：chat.js 不依赖 api.js/ui.js，独立实现 fetch 调用和消息渲染（打字机效果、分段解析）。这避免了跨文件依赖，但若后端 API 契约变更需同步修改两处。

---

## 九、维护指南

### 9.1 修改功能 → 文件映射
| 想改什么 | 改哪个文件 |
|---|---|
| 全局配色 / body 布局 / 聊天气泡 | css/main.css |
| 开场动画（时间轴/粒子/光球/文字/按钮） | css/animations.css + js/app.js（intro 区块） |
| 侧边栏外观与偏移 | css/sidebar.css；切换逻辑在 js/app.js「侧边栏」区块 |
| 骨架屏形状 | css/skeleton.css（样式）+ js/skeleton.js（DOM 生成） |
| 后端请求（URL/字段/错误处理） | js/api.js（唯一出口，勿在其他文件直接 fetch） |
| 主页面聊天发送逻辑 / 打字指示器 | js/chat.js + js/ui.js |
| 独立聊天页（chat.html）逻辑 | js/chat.js（自包含，不依赖 api.js 等） |
| 独立聊天页样式 | css/chat.css |
| 情绪曲线（发光点效果） | css/emotion-chart.css + js/emotion-chart.js |
| 状态轮询间隔 / 数据派发 | js/app.js 的 refreshState() |
| 场景文案 / 场景切换 | js/scene.js + js/scene-transition.js |
| 天气 / 时段光照 / 情绪粒子 | js/weather-effects.js / time-lighting.js / emotion-particles.js |
| 搜索面板 / 快捷键面板 | js/search-panel.js / shortcuts-panel.js（+ 同名 css） |
| 某独立页面内容 | 该页面 html + 同名 css/js 三件套 |
| 侧边栏导航链接 / 角色快捷区 | index.html 的 `.sidebar-nav` / `.sidebar-characters` 区块 |

### 9.2 新增页面步骤
1. 在 frontend/ 根新建 `xxx.html`，结构参考任一独立页面：`<meta charset="UTF-8">` → 引用 `css/main.css` → 引用本页 `css/xxx.css` → body 末尾引用 `js/xxx.js`。
2. 返回链接一律使用 `index.html?skipIntro=1`（避免重播开场动画）。
3. 新建 `css/xxx.css`（推荐给本页类名加统一前缀）与 `js/xxx.js`（如需全局对象则 `window.XxxPage = {...}`，并在 DOM 就绪后调用 init）。
4. 如页面需要加入导航：在 index.html 的 `.sidebar-nav` 增加一条 `.nav-link`（active 高亮由 pathname 自动匹配），或在 `.sidebar-characters` 增加角色快捷链接。
5. 若由后端路由托管，在 app.py 增加对应 `@app.route`（前端文件本身无需改动）。

### 9.3 新增功能组件（主页面）步骤
1. 新建 `css/xxx.css` 与 `js/xxx.js`；JS 采用 IIFE + `window.Xxx = { init, update }` 模式。
2. 若组件容器需要静态占位：在 index.html 对应位置加 `<div id="xxx">`；若组件自建 DOM（参考 StatusDashboard / EmotionParticles），则无需改 HTML。
3. index.html：`<head>` 中 main.css 之后加入 css 引用；body 末尾 **app.js 之前** 加入 js 引用。
4. js/app.js 的 init() 中以守卫方式调用 `if (window.Xxx) window.Xxx.init(...)`；需要随状态刷新则在 refreshState() 成功回调里调用 `Xxx.update(s)`。
5. 涉及键盘/全局快捷键时，注意在 INPUT/TEXTAREA 聚焦时短路（参考 shortcuts-panel.js）。
6. 完成后运行一次全量引用检查：确认 index.html 引用的每个 css/js 文件都存在、app.js 仍是最后一个 script。

### 9.4 chat.html 情绪曲线注入维护说明
chat.html 的情绪曲线通过 `chat.js` 的 `loadEmotionChartAssets()` 函数动态注入 `emotion-chart.css` 和 `emotion-chart.js`。若修改情绪曲线组件（发光点效果），需注意：
- 修改 `css/emotion-chart.css` 和 `js/emotion-chart.js` 后，index.html（静态引用）和 chat.html（动态注入）均会生效。
- 若新增 emotion-chart 的依赖 API 或数据结构，需同步检查 `chat.js` 的 `refreshState()` 中的情绪历史更新逻辑。
- 若 emotion-chart.js 的全局对象名 `window.EmotionChart` 变更，需同步更新 `chat.js` 中的检测和调用代码。