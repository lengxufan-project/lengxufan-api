# 冷旭帆·世界入口 前端架构文档

> 本文档由 2026-09 全量扫描生成，覆盖 frontend/ 下全部 HTML/CSS/JS 文件。
> 阅读对象：不熟悉本项目的开发者。

---

## 一、项目总览

### 项目定位

「冷旭帆·世界入口」是一个 AI 角色扮演 / 陪伴类 Web 应用。用户以"王旺"（主角冷旭帆的室友）的身份进入世界，与冷旭帆及其他角色对话互动。前端负责呈现世界状态（情绪 / 天气 / 时段 / 关系）、聊天界面、场景氛围，以及多个独立浏览的辅助页面（角色画廊、关系图谱、时光回廊等）。

### 技术栈
- **原生 HTML / CSS / JavaScript**：无框架、无构建工具、无 npm 依赖，直接由 Flask 静态托管。
- **模块模式**：每个 JS 文件为 ES5 风格 IIFE，通过 `window.XXX` 暴露全局单例模块（如 `window.API`、`window.Chat`）。
- **数据流**：所有后端请求经 `js/api.js` 封装的 `window.API` 发起；各模块通过 `window.State` 保存/读取共享状态；模块间调用使用 `if (window.XXX && window.XXX.fn)` 守卫式判空。
- **后端**：Flask（见仓库根 `app.py` 与 `routes/` 蓝图），前端仅通过 `/api/*` JSON 接口通信。

### 文件统计
| 类型 | 数量 | 说明 |
|---|---|---|
| HTML | 20 | 1 个主页面 + 18 个独立页面 + 1 个历史备份 |
| CSS | 39 | `css/` 目录，按页面/组件一文件 |
| JS | 43 | `js/` 目录，按页面/组件一文件 |

---

## 二、文件结构树

```
frontend/
├─ index.html                  # 主页面（世界入口，唯一复杂页面）
├─ index_working_backup.html   # 历史备份快照（无任何引用，可安全删除）
├─ ARCHITECTURE.md             # 本文档
│
├─ css/                        # 39 个样式文件
│  ├─ main.css                 # 全局基础 + 主页面布局（最重要）
│  ├─ animations.css           # 全局 @keyframes + 开场动画
│  ├─ sidebar.css              # 左侧可收起侧边栏（仅 index）
│  ├─ skeleton.css             # 数据加载骨架屏（仅 index）
│  ├─ loading-bar.css          # 顶部加载进度条
│  ├─ emotion-chart.css        # 情绪折线图组件
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
   ├─ api.js                   # window.API —— 所有后端 fetch 的唯一出口
   ├─ state.js                 # window.State —— 跨模块共享状态
   ├─ loading-bar.js           # window.LoadingBar —— 顶部进度条（api.js 依赖）
   ├─ skeleton.js              # window.Skeleton —— 骨架屏 show/hide
   ├─ ui.js                    # window.UI —— 消息气泡渲染、状态渲染
   ├─ chat.js                  # window.Chat —— 发送消息/打字指示器
   ├─ scene.js                 # window.Scene —— 场景文案与切换
   ├─ characters.js            # window.Characters —— 角色注册/切换
   ├─ scene-transition.js      # window.SceneTransition
   ├─ character-display.js     # window.CharacterDisplay（依赖 State）
   ├─ emotion-chart.js         # window.EmotionChart —— SVG 折线图
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
   ├─ 404.js / about.js / character-gallery.js / character-profile.js
   ├─ demo-mode.js / exploration.js / export.js / help.js
   ├─ journey.js / login.js / memory-gallery.js / observer-panel.js
   ├─ profile.js / relation-map.js / settings.js
   └─ world-guide.js / world-map.js
```

---

## 三、页面清单与功能

| 文件 | 标题 | 核心功能 | 引用 CSS | 引用 JS | 后端 API |
|---|---|---|---|---|---|
| index.html | 冷旭帆 · 世界入口 | 主界面：开场动画、侧边栏、聊天、场景氛围、状态栏、情绪图表、搜索/快捷键面板 | main, sidebar, animations, loading-bar, emotion-chart, scene-transition, character-display, world-clock, time-lighting, emotion-particles, relation-thermometer, status-dashboard, character-tooltip, event-log, scene-shortcut, weather-effects, achievement-card, notification-center, choice-branch, search-panel, shortcuts-panel, skeleton（共 22） | loading-bar, api, skeleton, state, ui, chat, scene, characters, scene-transition, character-display, emotion-chart, world-clock, time-lighting, emotion-particles, relation-thermometer, status-dashboard, character-tooltip, event-log, scene-shortcut, weather-effects, achievement-card, notification-center, choice-branch, search-panel, shortcuts-panel, app（共 26，app.js 必须最后） | /api/state、/api/chat、/api/group_chat、/api/characters |
| 404.html | 404 · 世界的缝隙 | 错误页，JS 延迟跳回主页（带 skipIntro=1） | main, 404 | 404 | - |
| about.html | 世界入口 · 关于 | 项目介绍、返回主页（skipIntro=1） | main, about | about | - |
| character-gallery.html | 群像画廊 | 角色网格展示，点击跳转人物典籍 | main, character-gallery | character-gallery | GET /api/characters |
| character-profile.html | 人物典籍 | 角色档案卡片（预设数据） | main, character-profile | character-profile | - |
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
| index_working_backup.html | 冷旭帆 | 历史备份快照，无引用、无资源 | （无） | （无） | - |

> 所有独立页面的"返回"链接均为 `index.html?skipIntro=1`，避免回主页重播开场动画。

---

## 四、CSS 模块说明

### 4.1 全局基础（被多个页面引用）
| 文件 | 作用 | 主要类名/选择器 | 依赖 |
|---|---|---|---|
| main.css | 全局变量级基础样式、body 限宽居中（max-width 1200px）、主页面 .app/.header/.chat/.statusbar/.scene 布局、聊天气泡 .bubble | .app .header .chat .bubble .statusbar .scene .floating-ball | 无（最先加载） |
| animations.css | 全部 @keyframes 集中地 + 开场动画（#intro 时序 4s） | .intro .intro-ball .intro-text .intro-particle .floating-ball | ballBreath 被 index/login 使用 |
| loading-bar.css | 顶部加载进度条 | #loadingBar | - |
| sidebar.css | 左侧可收起侧边栏（桌面 220px/50px，移动端抽屉） | .sidebar .sidebar-toggle .nav-link | ballBreath（animations.css） |
| skeleton.css | 骨架屏（光带 shimmer） | .skeleton-block .sk-box .sk-bubble .sk-hidden/.sk-fade | - |

### 4.2 主页面组件（仅 index.html 加载）
| 文件 | 作用 | 主要类名 |
|---|---|---|
| emotion-chart.css | 情绪折线图（SVG） | .emotion-chart .chart-ball .chart-line |
| scene-transition.css | 场景切换淡入淡出 | .scene-transition |
| character-display.css | 角色立绘增强（有意层叠覆盖 main.css 的 .charinfo/.avatar） | .charinfo .avatar .elabel |
| world-clock.css | 世界时钟胶囊 | .world-clock |
| relation-thermometer.css | 关系温度计（index 内嵌 + relations.html 独立复用） | .relation-thermo .relation-value |
| status-dashboard.css | 状态仪表盘 | #statusDashboard .st-* |
| character-tooltip.css | 角色悬浮卡 | .char-tooltip |
| event-log.css | 事件日志列表 | .event-log |
| scene-shortcut.css | ←/→ 场景切换浮层 | .scene-hint |
| weather-effects.css | 雨/雪/风/阴粒子层 | #weatherLayer .rain .snow |
| time-lighting.css | 时段氛围光（data-time-of-day 驱动 .scene 渐变） | .scene[data-time-of-day] |
| emotion-particles.css | 情绪粒子层 | #emotionParticles .emotion-particle |
| achievement-card.css | 成就弹卡 | #achievementCard .ach-* |
| notification-center.css | 通知中心抽屉 | #notificationDrawer .nc-* |
| choice-branch.css | 分支选择按钮组 | .choice-branch |
| search-panel.css | Ctrl+K 搜索模态 | .sp-mask .sp-panel |
| shortcuts-panel.css | ？快捷键面板模态 | .scp-mask .scp-panel .kbd |

### 4.3 独立页面样式（main.css + 自身 css 一一对应）
`404 / about / character-gallery / character-profile / demo-mode / exploration / export / help / journey / login / memory-gallery / observer-panel / profile / relation-map / settings / world-guide / world-map` 各有一个同名 css，仅定义本页私有类（普遍使用页面前缀如 `.wg-` `.sp-` `.scp-` `.sk-` 避免冲突）。其中 `login.css` 自带一份 `ballBreath`（login.html 不加载 animations.css，故不冲突）。

### 4.4 跨文件同名 @keyframes（潜在冲突，详见第七章）
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
| 3 | skeleton.js | Skeleton | show(selector) / hide(selector) | - |
| 4 | state.js | State | get / set / subscribe 等共享状态读写 | - |
| 5 | ui.js | UI | addMessage / updateState / renderEmotionChart / showTyping | - |
| 6 | chat.js | Chat | send() / toggleGroup() | ChoiceBranch |
| 7 | scene.js | Scene | update(state) | - |
| 8 | characters.js | Characters | 初始化角色 / switchCurrent(id) | - |
| 9 | scene-transition.js | SceneTransition | 过渡动画 | - |
| 10 | character-display.js | CharacterDisplay | 立绘/说话状态 | State |
| 11 | emotion-chart.js | EmotionChart | init(containerId) / update(history)（动态创建 #chartSvg 等） | - |
| 12 | world-clock.js | WorldClock | update(timeOfDay, day) | - |
| 13 | time-lighting.js | TimeLighting | init() / update(timeOfDay)（.scene[data-time-of-day]） | WorldClock |
| 14 | emotion-particles.js | EmotionParticles | init()（自建 #emotionParticles）/ update(emotion) | - |
| 15 | relation-thermometer.js | RelationThermometer | init(containerId)（动态建 #relationRows）/ update | - |
| 16 | status-dashboard.js | StatusDashboard | init(containerId)（动态建 #statusDashboard）/ update | - |
| 17 | character-tooltip.js | CharacterTooltip | init() | - |
| 18 | event-log.js | EventLog | init() / push(event) | - |
| 19 | scene-shortcut.js | SceneShortcut | ←/→ 键盘切换场景 | SceneTransition |
| 20 | weather-effects.js | WeatherEffects | init()（自建 #weatherLayer）/ update(weather) | - |
| 21 | achievement-card.js | AchievementCard | init()（自建）/ show(...) | - |
| 22 | notification-center.js | NotificationCenter | init()（自建抽屉）/ push | - |
| 23 | choice-branch.js | ChoiceBranch | init() / render(branches) | - |
| 24 | search-panel.js | SearchPanel | init() / open() / close()（Ctrl+K，自建模态） | State、UI |
| 25 | shortcuts-panel.js | ShortcutsPanel | init() / open() / close()（? 键，自建模态） | Chat、SearchPanel |
| 26 | app.js | （编排器，无全局导出） | init() / refreshState()（2s 轮询）/ endIntro() / 侧边栏 toggle | 上述全部（守卫式调用） |

**app.js 职责细节**：
- 开场动画编排：1000ms 膨胀 → 2500ms 爆发+粒子散落+8 向光线（`.intro.burst-rays`）→ 3500ms 收缩至右下角+3 球拖尾 → 4000ms 移除 #intro；总时长 4s，缓动统一 cubic-bezier(0.4,0,0.2,1)。
- `skipIntro=1` URL 参数：初始化即调用 `endIntro()` 跳过动画。
- 骨架屏：init 时对 .chat/.statusbar/.scene 调 `Skeleton.show`，首次 /api/state 成功后 `hide`。
- 侧边栏：#sidebarToggle 点击按端别切换 `.collapsed`（桌面）/`.open`（移动）；底部时间/天气取自 `s.world`；按 pathname 高亮 `.nav-link.active`。
- 轮询：每 2s `API.getState()` → 派发到 Scene/UI/WorldClock/TimeLighting/WeatherEffects/EmotionChart/EmotionParticles/RelationThermometer/StatusDashboard/EventLog 等。

### 5.2 独立页面脚本（每页一个，自包含）
| 文件 | 全局对象 | 说明 | 后端依赖 |
|---|---|---|---|
| 404.js | - | 倒计时跳转 index?skipIntro=1 | - |
| about.js | - | 拦截返回按钮跳转（preventDefault 后 location.href） | - |
| character-gallery.js | - | 拉取 /api/characters 渲染网格（失败用预设兜底） | GET /api/characters |
| character-profile.js | CharacterProfile | 静态档案渲染 | - |
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

### 6.1 window 全局对象清单（35 个）
`API, LoadingBar, Skeleton, State, UI, Chat, Scene, Characters, SceneTransition, CharacterDisplay, EmotionChart, WorldClock, TimeLighting, EmotionParticles, RelationThermometer, StatusDashboard, CharacterTooltip, EventLog, SceneShortcut, WeatherEffects, AchievementCard, NotificationCenter, ChoiceBranch, SearchPanel, ShortcutsPanel, CharacterProfile, Exploration, HelpPage, Journey, MemoryGallery, ObserverPanel, RelationMap, WorldGuide, WorldMap, WorldSettings`

附加全局变量：`window._emotionHistory`（app.js 维护的情绪历史数组，供 EmotionChart 使用）。

无任何重名定义（已扫描验证）。

### 6.2 API 端点契约（前端视角）

#### GET /api/state（调用方：api.js / observer-panel.js / world-map.js）
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

#### POST /api/chat（调用方：api.js → Chat）
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

## 七、已知问题与优化建议

### 已确认的潜在冲突（本次未修改，避免视觉变化）
1. **同名 @keyframes 定义不同**（跨文件）：
   - `flowShine`：main.css / animations.css 使用（-50%→150%），relation-thermometer.css 定义（-30%→130%）且在 index.html 上加载靠后而胜出。建议未来将两者重命名为 `flowShineWide` / `flowShineNarrow` 并各自引用。
   - `chartBallPulse`：emotion-chart.css（强光晕）与 animations.css（弱光晕）定义不同，index.html 上 animations.css 靠后胜出。建议重命名其一。
   - `ballBreath`：login.css 与 animations.css 定义不同，但无页面同时加载两者，当前无实际冲突。
2. **层叠依赖**：main.css 尾部有意覆盖 emotion-chart.css（透明化图表容器）与 character-display.css（.charinfo 增强）。调整加载顺序会改变视觉，勿轻易重排 index.html 的 CSS 顺序。
3. **index_working_backup.html**：无引用的历史备份快照，可安全删除（本次保守起见保留）。
4. **重复结构**：各独立页面各自实现"返回"按钮（17 处跳主页链接），为独立页面设计使然；如需统一可抽公共小部件，但会引入共享 JS 依赖。
5. **window._emotionHistory**：挂在全局的临时情绪历史（上限 20 条），更规范做法是纳入 `window.State`。
6. **demo-mode**：纯前端模拟，未接 /api/chat；若要接入需复用 api.js。
7. **导出页登录态**：/api/conversations 需要登录 session，未登录时 export.html 拿到 401，目前仅静默展示空态。
8. **移动端媒体查询覆盖**：world-guide / search-panel / shortcuts-panel / sidebar / skeleton / demo-mode 等较新文件已有 768px 适配；memory-gallery / observer-panel / world-map / exploration 等页面尚无移动端查询（窄屏体验待优化）。
9. **未接入后端的功能**：login 为前端模拟（未调 /api/auth/guest），如需真实登录态（影响 export/profile），应改调后端。

---

## 八、维护指南

### 8.1 修改功能 → 文件映射
| 想改什么 | 改哪个文件 |
|---|---|
| 全局配色 / body 布局 / 聊天气泡 / 状态栏 | css/main.css |
| 开场动画（时间轴/粒子/光线/拖尾/文字） | css/animations.css + js/app.js（intro 区块） |
| 侧边栏外观与偏移 | css/sidebar.css；切换逻辑在 js/app.js「侧边栏」区块 |
| 骨架屏形状 | css/skeleton.css（样式）+ js/skeleton.js（DOM 生成） |
| 后端请求（URL/字段/错误处理） | js/api.js（唯一出口，勿在其他文件直接 fetch） |
| 聊天发送逻辑 / 打字指示器 | js/chat.js + js/ui.js |
| 状态轮询间隔 / 数据派发 | js/app.js 的 refreshState() |
| 场景文案 / 场景切换 | js/scene.js + js/scene-transition.js |
| 天气 / 时段光照 / 情绪粒子 | js/weather-effects.js / time-lighting.js / emotion-particles.js |
| 搜索面板 / 快捷键面板 | js/search-panel.js / shortcuts-panel.js（+ 同名 css） |
| 某独立页面内容 | 该页面 html + 同名 css/js 三件套 |

### 8.2 新增页面步骤
1. 在 frontend/ 根新建 `xxx.html`，结构参考任一独立页面：`<meta charset="UTF-8">` → 引用 `css/main.css` → 引用本页 `css/xxx.css` → body 末尾引用 `js/xxx.js`。
2. 返回链接一律使用 `index.html?skipIntro=1`（避免重播开场动画）。
3. 新建 `css/xxx.css`（推荐给本页类名加统一前缀）与 `js/xxx.js`（如需全局对象则 `window.XxxPage = {...}`，并在 DOM 就绪后调用 init）。
4. 如页面需要加入导航：在 index.html 的 `#sidebar .sidebar-nav` 增加一条 `.nav-link`（active 高亮由 pathname 自动匹配）。
5. 若由后端路由托管，在 app.py 增加对应 `@app.route`（前端文件本身无需改动）。

### 8.3 新增功能组件（主页面）步骤
1. 新建 `css/xxx.css` 与 `js/xxx.js`；JS 采用 IIFE + `window.Xxx = { init, update }` 模式。
2. 若组件容器需要静态占位：在 index.html 对应位置加 `<div id="xxx">`；若组件自建 DOM（参考 StatusDashboard / EmotionParticles），则无需改 HTML。
3. index.html：`<head>` 中 main.css 之后加入 css 引用；body 末尾 **app.js 之前** 加入 js 引用。
4. js/app.js 的 init() 中以守卫方式调用 `if (window.Xxx) window.Xxx.init(...)`；需要随状态刷新则在 refreshState() 成功回调里调用 `Xxx.update(s)`。
5. 涉及键盘/全局快捷键时，注意在 INPUT/TEXTAREA 聚焦时短路（参考 shortcuts-panel.js）。
6. 完成后运行一次全量引用检查：确认 index.html 引用的每个 css/js 文件都存在、app.js 仍是最后一个 script。
