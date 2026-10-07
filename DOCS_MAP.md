# DOCS_MAP — 冷旭帆项目文档体系总图

> **这份文档是什么**：整个项目文档体系的**唯一入口**与分层导航图。不讲技术细节，只回答三件事：文档分几层、每层管什么、遇到具体任务该打开哪一份。
> **谁该看**：所有人。新人从「一、项目 30 秒速览」开始；老手直接跳到「六、按任务查文档」。
> **看完能做什么**：用 1-2 份文档了解项目全貌与当前进度；改任何功能时，30 秒内找到该翻的文档与文件。

> 核实日期：2026-10-07（基于当日实际文件清单与 git 记录生成；文档与代码冲突时，以代码为准）

---

## 一、项目 30 秒速览

| 问题 | 答案 |
|---|---|
| 是什么 | AI NPC 情感引擎「冷旭帆」（代号冰刃，v5.5）——角色拥有情绪、记忆、信任变化的对话系统，当前为**可运行原型**阶段 |
| 核心思想 | 代码管里子（情绪值/记忆/信任由代码精确控制），AI 管面子（大模型只生成自然语言） |
| 技术栈 | 后端：Python 3.11 + Flask + SQLAlchemy(SQLite) + ChromaDB；前端：原生 HTML/CSS/JS；客户端：Godot 4；对外：独立 Python SDK（lengxufan-engine 0.1.0） |
| 怎么跑 | `python backend/run.py`（Web，5000 端口）；`python backend/run.py --cli`（调试）。详见 [README.md](README.md) |
| 代码主角 | 后端全部在 `backend/`；在线前端 4 个页面在 `frontend/`；工具脚本在 `tools/`；Godot 在 `godot/`；SDK 在 `sdk/` |
| 当前阶段 | 最近一次提交完成：SSE 流式输出（POST /api/chat/stream）+ 前端清理归档 + Godot 客户端 + SDK 0.1.0 发布；工作区干净 |
| 下一步候选（聚合，非权威） | ① 移动端侧边栏抽屉（README:PLAN）② 批量角色状态接口（README:PLAN）③ 关系阶段显示 "--" 修复（FRONTEND_MAP 已知问题 9，高优先级）④ `tools/deploy/` 部署自动化（当前空目录）⑤ `data/source/` 世界观素材填充（当前空目录） |

> 权威功能状态表（LIVE/STUB/PLAN）见 [README.md](README.md)「功能状态说明」。

---

## 二、文档体系分层结构（一眼看懂）

```
DOCS_MAP.md（本文件）★ 唯一入口
│
├─ 第 1 层 · 宏观（3 分钟了解：项目是什么 / 怎么跑 / 改动影响谁）
│   ├─ README.md               —— 快速启动 + 功能状态表（LIVE/STUB/PLAN）
│   ├─ PROJECT_OVERVIEW.md     —— 项目总览（5 分钟版，含快速导航）
│   └─ PROJECT_MAP.md          —— 改动影响地图（一页纸 + 30 个核心文件 + 12 个改动场景）
│
├─ 第 2 层 · 模块地图（定位到一个目录 / 一类功能）
│   ├─ backend/BACKEND_MAP.md     —— 后端（Flask 引擎、路由、服务、角色）
│   ├─ frontend/FRONTEND_MAP.md   —— 前端总图（含旧版页面跳转关系，⚠ 部分统计已过时）
│   ├─ data/DATA_MAP.md           —— 数据目录（source 源数据 vs runtime 运行时）
│   ├─ tools/TOOLS_MAP.md         —— 工具脚本（验证/测试/数据导入，共 18 个）
│   ├─ godot/GODOT_MAP.md         —— Godot 客户端（场景/脚本/立绘素材）
│   └─ sdk/SDK_MAP.md             —— 对外 Python SDK（lengxufan-engine）
│
└─ 第 3 层 · 文件级与专题（定位到具体文件 / 查具体操作）
    ├─ frontend/FRONTEND_FILES.md —— 前端当前文件级索引（4 在线页 + 25 CSS + 35 JS 精确清单）
    ├─ docs/API_CONTRACT.md       —— 前后端接口契约（18+ 个端点）
    ├─ docs/PROJECT_GUIDE.md      —— 完整工程化导向手册（功能→文件映射、维护原则、操作步骤）
    ├─ docs/ARCHITECTURE.md       —— 关键架构决策记录及原因（v1.0→v5.5）
    ├─ docs/ADD_NEW_CHARACTER.md  —— 新增角色操作手册
    ├─ docs/BUILD.md              —— 从零重建 / 部署指南
    ├─ docs/TROUBLESHOOTING.md    —— 踩坑记录表（报错→原因→解法）
    ├─ docs/building-ai-npc-hybrid-architecture.md —— 混合架构设计笔记
    ├─ sdk/README.md              —— SDK 使用手册 + 发版步骤
    ├─ _LOCAL_TOOLS.md            —— 本机工具路径（Godot / Python 解释器）
    └─ backend/tests/test_report_100.md —— 100 轮对话压测报告
```

**读取原则**：只需宏观看**第 1 层**；要动某个目录看对应**第 2 层 MAP**；要改具体文件看**第 3 层**（或第 2 层 MAP 内的「改动定位表」）。

---

## 三、第 1 层 · 宏观文档（3 份）

| 文档 | 覆盖范围 | 什么时候打开 | 更深一层在哪 |
|---|---|---|---|
| [README.md](README.md) | 项目简介、目录结构、快速启动、功能状态表（唯一权威进度表） | 想跑起来 / 想知道某功能是否可用 | 功能细节 → 对应模块 MAP；部署 → [docs/BUILD.md](docs/BUILD.md) |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | 项目定位、一层目录说明、进度快照、快速导航 | 新人 5 分钟了解全貌 | 各章节导航直接指向三大 MAP 与 docs |
| [PROJECT_MAP.md](PROJECT_MAP.md) | 一页纸数据流、文件夹管制地图、30 个核心文件、**12 个改动场景**、三类人阅读路径、已知偏差附录 | 老手干活前看「改动影响清单」 | 场景中每条均已注明必改文件与同步文档 |

---

## 四、第 2 层 · 模块地图（6 份，每个目录一份）

| 文档 | 覆盖范围 | 它的子文档 / 更深一层 |
|---|---|---|
| [backend/BACKEND_MAP.md](backend/BACKEND_MAP.md) | `backend/` 全部：入口、配置、引擎、路由、服务、角色、测试 | 深层：接口细节 → [docs/API_CONTRACT.md](docs/API_CONTRACT.md)；功能→文件 → [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) 第四节；测试 → `backend/tests/` |
| [frontend/FRONTEND_MAP.md](frontend/FRONTEND_MAP.md) | `frontend/` 总图：页面跳转关系、三栏结构、z-index 层级、已知问题（⚠ 页面统计为旧版 27 页，当前在线仅 4 页） | 深层：当前文件级清单 → [frontend/FRONTEND_FILES.md](frontend/FRONTEND_FILES.md)；写作规范 → PROJECT_GUIDE 第八/九/十节 |
| [frontend/FRONTEND_FILES.md](frontend/FRONTEND_FILES.md) | 前端**文件级**索引：4 个在线页面、静态/动态加载链、未引用遗留文件、功能→文件定位表 | 底层即文件本身；归档页参考 `frontend/_archived/` |
| [data/DATA_MAP.md](data/DATA_MAP.md) | `data/` 全部：source 与 runtime 的区别、存档结构、Git 提交规则 | 深层：角色数据字段 → [docs/ADD_NEW_CHARACTER.md](docs/ADD_NEW_CHARACTER.md)；存档读写 → `backend/infra/persistence.py` |
| [tools/TOOLS_MAP.md](tools/TOOLS_MAP.md) | `tools/` 全部：18 个脚本按用途分类、运行前提 | 底层即各脚本文件；测试数据 → `backend/tests/` |
| [godot/GODOT_MAP.md](godot/GODOT_MAP.md) | `godot/` 全部：场景、脚本、立绘素材、与后端连接方式 | 底层即各 `.gd`/`.tscn` 文件；编辑器路径 → [_LOCAL_TOOLS.md](_LOCAL_TOOLS.md) |
| [sdk/SDK_MAP.md](sdk/SDK_MAP.md) | `sdk/` 全部：包结构、与 backend 的边界、发版流程 | 深层：使用手册 → [sdk/README.md](sdk/README.md) |

> 注：`frontend/FRONTEND_FILES.md` 属于文件级文档，因归属前端模块，一并列在本层便于查找。

---

## 五、第 3 层 · 专题与操作手册（docs/ 与根目录）

| 文档 | 覆盖范围 | 什么时候打开 |
|---|---|---|
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | 所有 API 端点的请求参数、响应结构、示例 | 改接口 / 前端联调（契约不可随意变更） |
| [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) | 完整工程化手册：功能→文件映射、脚本加载顺序、维护原则、新增页面/组件步骤 ⚠ 含旧版统计，以代码为准 | 按步骤操作时（如新增页面、新增组件） |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 7 条关键架构决策（混合架构、四阶段链、SQLite 选型等）及原因 | 想理解「为什么这么设计」 |
| [docs/ADD_NEW_CHARACTER.md](docs/ADD_NEW_CHARACTER.md) | 新增角色的完整操作手册 | 加角色 / 改角色数据 |
| [docs/BUILD.md](docs/BUILD.md) | 从零重建与服务器部署（Supervisor） | 换机器 / 部署上线 |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | 踩坑记录表（8 条，按时间追加） | 报错了先查这里 |
| [docs/building-ai-npc-hybrid-architecture.md](docs/building-ai-npc-hybrid-architecture.md) | 混合架构的设计笔记（背景长文） | 想了解设计思路演进 |
| [sdk/README.md](sdk/README.md) | SDK 安装、最小示例、自定义角色、构建发布 | 用 SDK / 发版 |
| [_LOCAL_TOOLS.md](_LOCAL_TOOLS.md) | 本机 Godot / Python 解释器路径 | 找不到本机工具时 |
| [backend/tests/test_report_100.md](backend/tests/test_report_100.md) | 100 轮对话压力测试报告 | 回归验证参考 |

---

## 六、按任务查文档（改功能从这里出发）

| 我想…… | 先打开 | 再深入 |
|---|---|---|
| 改角色人设 / 台词风格 / 信任阈值 | [PROJECT_MAP.md](PROJECT_MAP.md) 场景 2 | `backend/characters/<id>/data/character.json`（改完需重启并考虑删旧存档） |
| 新增一个角色 | [docs/ADD_NEW_CHARACTER.md](docs/ADD_NEW_CHARACTER.md) + PROJECT_MAP 场景 3 | `backend/characters/roster.py` 登记关系 |
| 改情绪 / 记忆 / 信任系统逻辑 | [backend/BACKEND_MAP.md](backend/BACKEND_MAP.md) 第六节 | `lengxufan_core/` 下对应文件；PROJECT_MAP 场景 4 / 10 |
| 新增 / 修改 API 接口 | [docs/API_CONTRACT.md](docs/API_CONTRACT.md) + PROJECT_MAP 场景 1 | `backend/routes/` → 前端 `frontend/js/api.js` |
| 改前端主页面（布局/粒子/通知/搜索） | [frontend/FRONTEND_FILES.md](frontend/FRONTEND_FILES.md) 功能定位表 | `frontend/index.html` + 对应 css/js |
| 改聊天页样式 / 交互 | [frontend/FRONTEND_FILES.md](frontend/FRONTEND_FILES.md) | `frontend/chat.html` / `css/chat.css` / `js/chat.js` |
| 找回被归档的旧页面 | [frontend/FRONTEND_MAP.md](frontend/FRONTEND_MAP.md) 第四节（旧跳转关系） | `frontend/_archived/`（只读，不新引用） |
| 跑验证 / 压测 / 批量测试 | [tools/TOOLS_MAP.md](tools/TOOLS_MAP.md) | 对应脚本；测试数据在 `backend/tests/` |
| 改 Godot 场景 / 立绘 | [godot/GODOT_MAP.md](godot/GODOT_MAP.md) | `godot/scenes/Room.tscn`、`godot/scripts/*.gd` |
| 改 / 发布 SDK | [sdk/SDK_MAP.md](sdk/SDK_MAP.md) + PROJECT_MAP 场景 7 | `sdk/setup.py` + `sdk/README.md`（发版步骤） |
| 部署到服务器 | [docs/BUILD.md](docs/BUILD.md) + PROJECT_MAP 场景 11 | 生产用 gunicorn，注意覆盖 SECRET_KEY |
| 报错排查 | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | 找不到答案再查对应模块 MAP |
| 查本机工具路径 | [_LOCAL_TOOLS.md](_LOCAL_TOOLS.md) | — |

---

## 七、阅读路径建议

- **新人（第一次接手）**：本文件 → [README.md](README.md)（跑起来）→ [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)（看全貌）→ [PROJECT_MAP.md](PROJECT_MAP.md)（知道改哪影响哪）→ 挑一个核心文件对照代码读。
- **老手（回来干活）**：直接看「六、按任务查文档」→ 对应模块 MAP 的改动定位表 → 开改。
- **维护者（改结构）**：先看 [PROJECT_MAP.md](PROJECT_MAP.md) 部分 2 文件夹管制地图 → 结构变更后同步本文件与对应 MAP（见第九节规则）。
- **只想跑起来**：[README.md](README.md) 快速启动 3 步。

---

## 八、已知偏差（文档 vs 代码，维护时注意）

> 完整偏差清单维护在 [PROJECT_MAP.md](PROJECT_MAP.md) 附录；以下是 2026-10-07 复核时确认/新增的偏差。**修文档前先核实代码现状。**

| 偏差 | 现状 |
|---|---|
| `frontend/FRONTEND_MAP.md` 统计 27 个在线 HTML 页面 | 实际在线 4 个（index/chat/login/dev），23 个已归档至 `frontend/_archived/`（该处共 67 个文件） |
| `backend/BACKEND_MAP.md` 提及 `backend/cognition/`（spacetime/intention/relationships） | 实际不存在，对应能力在 `backend/lengxufan_core/cognition/` |
| `backend/BACKEND_MAP.md` 提及 `backend/tools/` 17 个脚本 | 已迁至根目录 `tools/backend-scripts/`（18 个脚本含 checks） |
| 各文档未收录 `backend/routes/events_routes.py`（GET /api/events）与 POST /api/chat/stream（SSE 流式） | 两者为近期新增，代码已生效；接口细节以 `routes/` 源码为准 |
| `docs/PROJECT_GUIDE.md` 引用的 `frontend/ARCHITECTURE.md` | 该文件不存在；前端现状请查 [FRONTEND_FILES.md](frontend/FRONTEND_FILES.md) |
| `docs/PROJECT_GUIDE.md` 的「27 HTML / 47 CSS / 57 JS」统计 | 过时；当前在线为 4 HTML / 25 CSS / 35 JS |
| `backend/lengxufan_core/dialogue_engine.py` 的 3 个 `.bak_*` 备份 | 仅历史备份，勿引用、勿提交 |
| `tools/deploy/` 为空目录 | 部署自动化待建设 |
| `data/source/` 六个子目录全为空 | 角色数据实际存于 `backend/characters/<id>/data/` |

---

## 九、文档维护规则（可扩展区）

**新增/修改文档时遵守：**

1. **新文档放哪**：模块级 → 对应目录建 `XXX_MAP.md`；专题操作 → `docs/`；文件级索引 → 放在被索引目录下。
2. **建完登记**：在本文件「二、分层结构」与对应层级表格中登记一行（文档 | 范围 | 何时打开 | 更深一层），否则视为孤岛。
3. **结构变更**：目录/接口结构变化 → 先改 [PROJECT_MAP.md](PROJECT_MAP.md)，再改对应 MAP，最后回看本文件的偏差表。
4. **冲突原则**：文档与代码冲突时以代码为准，并回头修文档。
5. **每份新文档必须包含**：开头「这份文档是什么/谁该看/看完能做什么」+ 末尾「相关文档」链接。

**预留扩展位（以后你自己加）：**

- [ ] 第 2 层新模块地图：`build/`、`tests/` 等（若未来新建目录）
- [ ] 第 3 层新专题：`docs/CHANGELOG.md`（版本变更）、`TODO.md`（任务清单，PROJECT_MAP 曾提及待建）
- [ ] 文件级下探：`backend/routes/ROUTES_INDEX.md`（接口与文件对照，若路由继续膨胀）
- [ ] 文档健康检查脚本（可放 `tools/checks/`：扫描死链与未登记文档）

---

## 相关文档

| 关系 | 文档 |
|---|---|
| 怎么跑起来 | [README.md](README.md) |
| 项目全貌 | [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) |
| 改动影响地图 | [PROJECT_MAP.md](PROJECT_MAP.md) |
| 模块地图 | [backend/BACKEND_MAP.md](backend/BACKEND_MAP.md) · [frontend/FRONTEND_MAP.md](frontend/FRONTEND_MAP.md) · [data/DATA_MAP.md](data/DATA_MAP.md) · [tools/TOOLS_MAP.md](tools/TOOLS_MAP.md) · [godot/GODOT_MAP.md](godot/GODOT_MAP.md) · [sdk/SDK_MAP.md](sdk/SDK_MAP.md) |
| 文件级索引 | [frontend/FRONTEND_FILES.md](frontend/FRONTEND_FILES.md) |
| 专题手册 | [docs/API_CONTRACT.md](docs/API_CONTRACT.md) · [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) · [docs/BUILD.md](docs/BUILD.md) |