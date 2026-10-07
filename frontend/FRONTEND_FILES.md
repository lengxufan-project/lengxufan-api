# FRONTEND_FILES — 前端文件级索引

> **这份文档是什么**：`frontend/` 的**文件级**精确清单（2026-10-07 实况）。回答两件事：每个文件的职责是什么、改某个功能该动哪个文件。补充（而非重复）[FRONTEND_MAP.md](FRONTEND_MAP.md)——后者讲结构/跳转/历史，本文件讲「当前到底在线哪些文件」。
> **谁该看**：要改前端任何页面/样式/交互的人。先在这里找到文件，再打开对应源码。
> **看完能做什么**：不再被 67 个归档文件和一堆未引用遗留文件干扰；精确知道某个功能的代码在哪一行文件里。

> ⚠ 统计口径：**在线** = 被 4 个在线页面真实引用的文件。当前在线 4 HTML / 25 CSS / 35 JS；另有 `_archived/` 67 个历史文件与 20 个未引用遗留文件（见第四、五节）。

---

## 一、在线页面（4 个）

| 页面 | 用途 | 加载链 |
|---|---|---|
| [index.html](index.html) | 主页面「世界观察中心」（三栏 + 开场动画 + 粒子） | 12 CSS + 20 JS，全部静态引入（顺序见第二节） |
| [chat.html](chat.html) | 独立聊天页（`window.ChatPage`） | main.css + chat.css；chat.js（**动态加载** emotion-chart.js/css，见下） |
| [login.html](login.html) | 登录 / 注册 / 游客进入 | main.css + login.css；login.js |
| [dev.html](dev.html) | 开发者数据统计面板（占位数据） | main.css + dev.css；dev.js |

**chat.html 的动态加载**：[chat.js](js/chat.js) 在需要时（L273-290）用 `document.createElement` 注入 `css/emotion-chart.css` 与 `js/emotion-chart.js`（带 `data-emotion-chart` 防重复标记）。因此这两个文件不算未引用；但**改完不会被 index.html 校验到**，测试时记得单独打开 chat.html。

---

## 二、index.html 加载清单（改动前后都要看）

CSS（12 个，顺序）：main → sidebar → search-panel → animations → scene-transition → world-clock → loading-bar → scene-shortcut → weather-effects → time-lighting → emotion-particles → notification-center

JS（20 个，顺序）：loading-bar → api → ui → scene → scene-transition → world-clock → time-lighting → emotion-particles → scene-shortcut → weather-effects → search-panel → intro → particles → rail → sidebar → notifications → world → world-activities → **app（倒数第二）** → **notification-center（最后）**

> 顺序有依赖：`app.js` 协调各模块初始化，必须在其依赖模块之后；`notification-center.js` 最后加载。新增 JS 时插在 app.js 之前。
> 完整「脚本加载顺序与依赖」讲解见 [docs/PROJECT_GUIDE.md](../docs/PROJECT_GUIDE.md)。

---

## 三、功能 → 文件定位表（改功能从这里查）

### 主页面 index.html（按 UI 区域）

| 想改什么 | 文件 | 说明 |
|---|---|---|
| 页面骨架 / 三栏结构 / 通知抽屉 DOM / 角色选择器 | [index.html](index.html) | 所有 DOM id 被 JS 依赖，改名要全局搜 |
| 顶部加载进度条 | [css/loading-bar.css](css/loading-bar.css) + [js/loading-bar.js](js/loading-bar.js) | |
| 所有后端请求封装 | [js/api.js](js/api.js) | 改接口/加请求先动这里 |
| 气泡 / 打字机 / 状态栏等 DOM 操作 | [js/ui.js](js/ui.js) | index 页 UI 工具函数 |
| 场景区渲染（天气、时间、室友活动） | [js/scene.js](js/scene.js) | |
| 场景过渡动画 | [css/scene-transition.css](css/scene-transition.css) + [js/scene-transition.js](js/scene-transition.js) | |
| 世界时钟（右上角时间/时段） | [css/world-clock.css](css/world-clock.css) + [js/world-clock.js](js/world-clock.js) | |
| 时段氛围光（昼夜滤镜） | [css/time-lighting.css](css/time-lighting.css) + [js/time-lighting.js](js/time-lighting.js) | 靠 `body[data-time-of-day]` 切换 CSS 变量 |
| 情绪粒子层 | [css/emotion-particles.css](css/emotion-particles.css) + [js/emotion-particles.js](js/emotion-particles.js) | 粒子颜色/速度随情绪值变化 |
| 场景快捷入口 | [css/scene-shortcut.css](css/scene-shortcut.css) + [js/scene-shortcut.js](js/scene-shortcut.js) | 场景列表为占位（307室/天台/训练场/后山/防空洞） |
| 天气特效（晴/雨/雪/阴/风） | [css/weather-effects.css](css/weather-effects.css) + [js/weather-effects.js](js/weather-effects.js) | 纯 CSS 动画，JS 只切类名 |
| 全局搜索面板（Ctrl+K / 🔍） | [css/search-panel.css](css/search-panel.css) + [js/search-panel.js](js/search-panel.js) | 类 VSCode 命令面板 |
| 开场动画（粒子聚球→主页面） | [js/intro.js](js/intro.js) | 跳过参数 `?skipIntro=1` 逻辑相关 |
| 全局背景粒子 + 核心视觉粒子系统 | [js/particles.js](js/particles.js) | requestAnimationFrame 单循环 |
| 第一栏 rail 切换第二栏面板 | [js/rail.js](js/rail.js) | |
| 侧边栏折叠 / 抽屉 / 移动端菜单 | [css/sidebar.css](css/sidebar.css) + [js/sidebar.js](js/sidebar.js) | sidebar.css 仅 index.html 加载 |
| 通知角标开关（铃铛） | [js/notifications.js](js/notifications.js) | |
| 世界状态刷新 + 角色列表渲染 | [js/world.js](js/world.js) | |
| 世界动态流（室友活动滚动） | [js/world-activities.js](js/world-activities.js) | |
| 主入口协调 + 定时刷新 | [js/app.js](js/app.js) | 改初始化流程看这里 |
| 通知中心抽屉（Tab/未读已读/详情弹窗） | [css/notification-center.css](css/notification-center.css) + [js/notification-center.js](js/notification-center.js) | 最后加载 |
| 基础重置 / 全局变量 / 共用样式 | [css/main.css](css/main.css) | 所有页面都加载 |
| 共用关键帧动画 | [css/animations.css](css/animations.css) | 仅 index 加载 |

### 聊天页 chat.html

| 想改什么 | 文件 | 说明 |
|---|---|---|
| 聊天页 DOM 结构 | [chat.html](chat.html) | |
| 聊天页样式（前缀 `cp-` 防冲突） | [css/chat.css](css/chat.css) | |
| 聊天逻辑（发送/渲染/状态/群聊） | [js/chat.js](js/chat.js) | 数据契约与主页面一致；动态加载情绪图表 |
| 情绪曲线图（抽屉内） | [js/emotion-chart.js](js/emotion-chart.js) + [css/emotion-chart.css](css/emotion-chart.css) | 由 chat.js 动态注入 |

### 登录页 / 开发者页

| 想改什么 | 文件 |
|---|---|
| 登录 / 注册 / 游客进入 | [login.html](login.html) + [css/login.css](css/login.css) + [js/login.js](js/login.js) |
| 开发者统计面板 | [dev.html](dev.html) + [css/dev.css](css/dev.css) + [js/dev.js](js/dev.js) |

---

## 四、未引用遗留文件（20 个，当前无任何页面加载）

> 这些文件**不在线**：4 个在线页面都不引用它们（chat.js 动态加载的 emotion-chart 不算）。原因：前端清理时相关组件被冻结/下线，文件未删除。
> **处理原则**：不要在新页面中引用；若要复用，先确认它们与现行 DOM/状态管理是否兼容。删除与否由你决定（有 FRONTEND_MAP 旧文档价值）。

| JS（11 个） | 曾负责 | 配套 CSS |
|---|---|---|
| [js/state.js](js/state.js) | 全局状态（当前角色/群聊模式/发送状态） | — |
| [js/characters.js](js/characters.js) | 角色列表加载与切换 | — |
| [js/character-display.js](js/character-display.js) | 角色展示条 | [css/character-display.css](css/character-display.css) |
| [js/character-tooltip.js](js/character-tooltip.js) | 角色悬浮提示 | [css/character-tooltip.css](css/character-tooltip.css) |
| [js/relation-thermometer.js](js/relation-thermometer.js) | 关系温度计（信任值进度条） | [css/relation-thermometer.css](css/relation-thermometer.css) |
| [js/status-dashboard.js](js/status-dashboard.js) | 状态看板 | [css/status-dashboard.css](css/status-dashboard.css) |
| [js/event-log.js](js/event-log.js) | 事件日志 | [css/event-log.css](css/event-log.css) |
| [js/choice-branch.js](js/choice-branch.js) | 分支选择浮层 | [css/choice-branch.css](css/choice-branch.css) |
| [js/achievement-card.js](js/achievement-card.js) | 成就卡片 | [css/achievement-card.css](css/achievement-card.css) |
| [js/skeleton.js](js/skeleton.js) | 加载骨架屏 | [css/skeleton.css](css/skeleton.css) |
| [js/shortcuts-panel.js](js/shortcuts-panel.js) | 快捷键面板（按 ?） | [css/shortcuts-panel.css](css/shortcuts-panel.css) |

> 注意：**关系温度计不在线**（relation-thermometer.js/css 未加载），而 [FRONTEND_MAP.md](FRONTEND_MAP.md) 的「已知问题 9：关系阶段显示 `--`」正是在线实现里遗留的问题，两者不要混淆。

---

## 五、_archived/ 归档目录

- `frontend/_archived/`：67 个历史文件（23 HTML + 22 CSS + 22 JS），为旧版 27 页面的存档。
- **只读**：不引用、不改动、不删除；需要找回旧页面时的参考区。页面跳转关系见 [FRONTEND_MAP.md](FRONTEND_MAP.md) 第四节。

---

## 六、扩展区（以后自己加文件时）

- [ ] **新增页面**：按现有结构建 `xxx.html` + `css/xxx.css` + `js/xxx.js`；若属于主站，确认是否复用 `main.css` 与 `js/api.js`；操作步骤见 [docs/PROJECT_GUIDE.md](../docs/PROJECT_GUIDE.md) 新增页面章节
- [ ] **新增 JS 模块**：插在 index.html 的 `app.js` 之前；初始化挂到 app.js 的协调流程
- [ ] **新样式文件**：命名 `xxx.css` 放 `css/`，在本文件第三节登记一行
- [ ] **清理遗留文件**：若要删第四节的 20 个文件，建议先归档到 `_archived/` 而非直接删除，并同步更新本清单
- [ ] 页面数量变化后：本文件与 [FRONTEND_MAP.md](FRONTEND_MAP.md) 的统计都要更新

---

## 相关文档

| 关系 | 文档 |
|---|---|
| 文档体系总图 | [DOCS_MAP.md](../DOCS_MAP.md) |
| 前端总图（跳转关系 / 三栏 / z-index / 已知问题） | [frontend/FRONTEND_MAP.md](FRONTEND_MAP.md) |
| 完整工程化手册（脚本加载顺序、新增页面/组件步骤） | [docs/PROJECT_GUIDE.md](../docs/PROJECT_GUIDE.md) |
| 接口契约（前端调用的端点定义） | [docs/API_CONTRACT.md](../docs/API_CONTRACT.md) |
| 改动影响地图（前端相关场景） | [PROJECT_MAP.md](../PROJECT_MAP.md) |
| 后端地图（联调时对照） | [backend/BACKEND_MAP.md](../backend/BACKEND_MAP.md) |