# TOOLS_MAP — tools/ 工具脚本地图

> **这份文档是什么**：`tools/` 目录的模块地图。列出所有 18 个工具脚本的用途、分类、运行方式和前提条件，帮你快速找到「要验证/测试/导入数据时该跑哪个脚本」。
> **谁该看**：需要跑验证、压测、批量测试、或导入角色数据的人（开发者自测、上线前回归）。
> **看完能做什么**：选对脚本、知道怎么跑、知道为什么跑不起来（运行前提在第 4 节）。

> 核实日期：2026-10-07（基于当日实际文件清单；脚本细节以源码为准）

---

## 一、目录结构

```
tools/
├── backend-scripts/      # 17 个 Python 脚本（验证 / 测试 / 检查 / 数据）
├── checks/
│   └── check_project.ps1 # 一键检查（语法 + 单测 + 冒烟）
└── deploy/               # ⚠ 当前为空目录，部署自动化待建设
```

> 历史说明：这些脚本曾位于 `backend/tools/`，现已迁至此处。若有旧文档提到 `backend/tools/`，指的就是本目录。

---

## 二、脚本分类总表（18 个）

### A. 在线验证类（8 个，必须先启动后端 + HTTP 调用 127.0.0.1:5000）

| 脚本 | 验证什么 | 备注 |
|---|---|---|
| [quick_check.py](backend-scripts/quick_check.py) | /api/state、/api/characters、群聊接口 + 本地单角色对话（不经过 API） | 最快的端到端体检 |
| [final_check.py](backend-scripts/final_check.py) | /api/state 与 /api/group_chat 的最终检查 | 与 quick_check 类似，收尾用 |
| [api_group_chat_verify.py](backend-scripts/api_group_chat_verify.py) | POST /api/group_chat 的响应结构与内容 | 群聊接口专项 |
| [verify_group_chat_live.py](backend-scripts/verify_group_chat_live.py) | 真实调用群聊接口（live 模式） | 群聊专项 |
| [verify_new_endpoints.py](backend-scripts/verify_new_endpoints.py) | 新增端点（如 events 等）是否生效 | 新接口上线前跑 |
| [verify_chat_history.py](backend-scripts/verify_chat_history.py) | /api/conversations 的登录鉴权（401）与历史返回 | 需先走游客登录流程 |
| [test_group_chat.py](backend-scripts/test_group_chat.py) | 群聊接口最小调用（打印各角色回复） | 约 20 行，最简单的群聊冒烟 |
| [full_validation.py](backend-scripts/full_validation.py) | 五合一：语法检查 → 模块导入 → 前端引用完整性 → 前后端端点一致性 → 实际 HTTP 请求 | ⚠ 硬编码本机绝对路径，见第 4 节 |

### B. 离线引擎测试类（4 个，直接实例化引擎，不需要后端在跑）

| 脚本 | 做什么 | 备注 |
|---|---|---|
| [ai_ai_multi_test.py](backend-scripts/ai_ai_multi_test.py) | 三角色 AI 互相聊天（每角色 8 轮，话题库预设） | 可改轮数；最长耗时 |
| [multi_char_test.py](backend-scripts/multi_char_test.py) | 创建三个引擎实例，逐角色单轮对话 | 多角色隔离的基础测试 |
| [stress_test_multi_char.py](backend-scripts/stress_test_multi_char.py) | 100 个角色 ID 的压力测试（假 ID + 真实角色） | 假角色只测管理器逻辑，不建真实文件 |
| [verify_isolation.py](backend-scripts/verify_isolation.py) | 三角色分别问同一句话，检查状态文件/情绪互不干扰 | 角色隔离专项 |

### C. 静态检查类（2 个，不依赖运行中的后端）

| 脚本 | 检查什么 |
|---|---|
| [engineering_check.py](backend-scripts/engineering_check.py) | 工程化规范：数据文件无函数定义、逻辑代码不硬编码角色名、引擎不直接导入角色数据模块、重复定义/未使用导入 |
| [full_frontend_backend_check.py](backend-scripts/full_frontend_backend_check.py) | 语法 → 模块导入 → 前端文件引用完整性 → 前端 JS 的 API 调用 → 后端实际注册路由 ⚠ 硬编码本机绝对路径，见第 4 节 |

### D. 数据类（3 个）

| 脚本 | 做什么 | 备注 |
|---|---|---|
| [import_character_md.py](backend-scripts/import_character_md.py) | 把 Markdown 角色设定导入为角色数据 | 用法：`python import_character_md.py <markdown文件路径>`；配合 [docs/ADD_NEW_CHARACTER.md](../docs/ADD_NEW_CHARACTER.md) |
| [convert_character_to_json.py](backend-scripts/convert_character_to_json.py) | 角色数据转换为 JSON（落盘到角色目录） | 导入流程的一环 |
| [view_memory.py](backend-scripts/view_memory.py) | 查看 ChromaDB 中存储的记忆条目 | 记忆系统调试用 |

### E. 一键检查（1 个，PowerShell）

| 脚本 | 做什么 |
|---|---|
| [checks/check_project.ps1](checks/check_project.ps1) | ① 全项目 py_compile 语法检查 → ② `pytest backend/tests/test_core_logic.py` → ③ GET /api/state 冒烟（后端没启动时仅黄色警告） |

> 日常最常用：**check_project.ps1**（一案三检）。它的第 2 步等价于 `python -m pytest backend/tests/test_core_logic.py -v`。

---

## 三、脚本与后端的关系

- **在线验证类**走 HTTP，验证的是**完整链路**（路由 → 服务 → 引擎 → 外部 LLM），因此需要 `python backend/run.py` 已启动、且网络能访问 LLM 服务。
- **离线引擎测试类**直接 `import` 后端模块（`services.engine_service` 等），验证的是**引擎逻辑本身**，不需要后端进程，但同样会调用外部 LLM（对话轮次越多，耗时和费用越高，`ai_ai_multi_test.py` 首当其冲）。
- **静态检查类/数据类**不调用 LLM。

---

## 四、运行前提与已知坑

1. **启动位置**：多数脚本按「项目根目录」为基准。建议统一在项目根目录运行：
   `python tools/backend-scripts/<脚本名>.py`
2. **sys.path 处理方式不统一**（脚本内部已各自处理，但要知道差异）：
   - 用 `sys.path.insert` 相对自身文件定位：ai_ai_multi_test、multi_char_test、stress_test_multi_char、verify_isolation
   - 用 `os.getcwd()`（**因此必须在项目根目录运行**）：quick_check、final_check
   - **硬编码本机绝对路径** `C:\Users\25497\Desktop\创世记\PositiveCharacter\lengxufan-flask-mvp` + `os.chdir`：`full_validation.py`、`full_frontend_backend_check.py` ⚠ **换机器/换目录会直接失败**，需要改这两处路径。
3. **后端未启动时**：在线验证类会报连接错误，这是预期行为——先 `python backend/run.py`。
4. **数据类脚本会改数据**：import_character_md / convert_character_to_json 会写角色数据文件，运行前确认目标角色目录；改动后考虑删除旧存档（见 [PROJECT_MAP.md](../PROJECT_MAP.md) 场景 2/3）。
5. **压测脚本耗时**：ai_ai_multi_test（三角色×8 轮）与 stress_test_multi_char（100 个 ID）是 LLM 密集调用，适合手动选择时机运行，不适合每次提交都跑。

---

## 五、扩展区（以后自己加脚本时）

- [ ] 新脚本命名约定建议：验证用 `verify_*.py`、测试用 `*_test.py` 或 `test_*.py`、检查用 `*_check.py`
- [ ] `tools/deploy/` 为空目录——未来部署自动化脚本放这里，建好后在本文件登记一行
- [ ] 若脚本数量继续增长，按子目录（如 `verification/`、`data/`）拆分并在本文件更新分类表
- [ ] 可考虑为「文档健康检查（死链扫描）」增加脚本，见 [DOCS_MAP.md](../DOCS_MAP.md) 第九节预留位

---

## 相关文档

| 关系 | 文档 |
|---|---|
| 文档体系总图 | [DOCS_MAP.md](../DOCS_MAP.md) |
| 后端结构与测试 | [backend/BACKEND_MAP.md](../backend/BACKEND_MAP.md) |
| 改动影响地图（场景 5/6 涉及测试） | [PROJECT_MAP.md](../PROJECT_MAP.md) |
| 接口契约（脚本调用的端点定义） | [docs/API_CONTRACT.md](../docs/API_CONTRACT.md) |
| 新增角色流程（数据类脚本的上下文） | [docs/ADD_NEW_CHARACTER.md](../docs/ADD_NEW_CHARACTER.md) |
| 从零构建 / 部署 | [docs/BUILD.md](../docs/BUILD.md) |
| 报错排查 | [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) |