# 冷旭帆 · AI NPC 情感引擎

> **代号：冰刃** | **版本：v5.5** | **最后更新：2026年9月2日**

冷旭帆是一个会自己疼、会做噩梦、会在你不在的时候默默擦刀的 AI NPC。
技术上采用"代码管里子、AI 管面子"的混合架构，拥有四阶段认知处理链、前后端分离部署、支持多角色扩展。

**公网地址**：http://139.199.168.140:5000/

---

## 目录结构

```
lengxufan-flask-mvp/
│
├── README.md                   ← 项目总入口（本文档）
├── paths.py                    ← 全局路径常量
├── .gitignore                  ← Git 忽略规则
│
├── backend/                    ← 后端（Python Flask）
│   ├── run.py                  ← 入口（Web / CLI 双模式）
│   ├── app.py                  ← Flask 应用工厂
│   ├── config.py               ← Flask 配置
│   ├── config.yaml             ← 角色与 API 参数
│   ├── models.py               ← 数据模型（User / Conversation）
│   ├── world_state.py          ← 共享世界状态（时间/天气/活动）
│   ├── event_bus.py            ← 事件总线（角色间通信）
│   ├── api/                    ← API 适配层（多模型路由）
│   ├── characters/             ← 角色注册中心（3 个角色）
│   ├── cognition/              ← 认知层（时空/意图/关系）
│   ├── infra/                  ← 基础设施（日志/持久化/时间）
│   ├── lengxufan_core/         ← 核心引擎（感知/记忆/身份/行为）
│   ├── routes/                 ← 路由层（18 个 API 端点）
│   ├── services/               ← 服务层（引擎/用户/后台）
│   ├── tests/                  ← 测试套件
│   ├── tools/                  ← 开发工具脚本
│   └── BACKEND_MAP.md          ← 后端地图（本文档）
│
├── data/                       ← 数据目录
│   ├── source/                 ← 源数据（Git 跟踪）
│   │   ├── characters/         ← 角色源数据（待填充）
│   │   ├── worldview/          ← 世界观卡片（待填充）
│   │   └── images/             ← 图片素材（待填充）
│   └── runtime/                ← 运行时数据（Git 忽略）
│       ├── save/               ← 角色状态存档（JSON）
│       ├── logs/               ← 运行日志
│       ├── chroma_db/          ← 向量数据库
│       └── uploads/            ← 用户上传
│
├── docs/                       ← 文档
│   ├── ARCHITECTURE.md         ← 架构决策记录
│   ├── BUILD.md                ← 从零构建指南
│   ├── PROJECT_GUIDE.md        ← 项目指南
│   ├── ADD_NEW_CHARACTER.md    ← 新增角色指南
│   ├── API_CONTRACT.md         ← API 契约（本文档）
│   └── building-ai-npc-hybrid-architecture.md  ← 混合架构笔记
│
├── frontend/                   ← 前端（HTML/CSS/JS）
│   ├── index.html              ← 主页面（世界观察中心）
│   ├── chat.html               ← 独立聊天页
│   ├── login.html              ← 登录/注册页
│   ├── FRONTEND_MAP.md         ← 前端地图与跳转关系
│   ├── css/                    ← 45 个 CSS 文件
│   └── js/                     ← 57 个 JS 文件
│
└── tools/                      ← 项目级工具
    └── check_project.ps1       ← 项目检查脚本
```

---

## 快速启动

### 1. 安装依赖

```bash
pip install -r backend/requirements.txt
```

### 2. 设置 API Key

```powershell
# 至少设置一个
[Environment]::SetEnvironmentVariable("ALIBABA_API_KEY", "你的Key", "User")
[Environment]::SetEnvironmentVariable("GLM_API_KEY", "你的Key", "User")
[Environment]::SetEnvironmentVariable("DEEPSEEK_API_KEY", "你的Key", "User")
```

也支持将 Key 写入 `.env` 文件（支持 `backend/.env` 或根目录 `.env`）。

### 3. 启动

```bash
python backend/run.py          # Web 模式（http://127.0.0.1:5000）
python backend/run.py --cli    # CLI 调试模式
```

### 4. 访问前端

打开浏览器访问 `http://127.0.0.1:5000` 即可看到世界观察中心首页。

---

## 文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 后端地图 | [backend/BACKEND_MAP.md](backend/BACKEND_MAP.md) | 后端所有 Python 模块、API 接口、模块依赖、修改指南 |
| 数据地图 | [data/DATA_MAP.md](data/DATA_MAP.md) | data/source 与 data/runtime 的区别、各目录作用、Git 提交规则 |
| API 契约 | [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | 所有 18 个 API 接口的请求参数、响应结构、示例数据 |
| 前端地图 | [frontend/FRONTEND_MAP.md](frontend/FRONTEND_MAP.md) | 前端 27 个 HTML、45 个 CSS、57 个 JS 的说明与跳转关系 |
| 架构决策 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 关键架构决策及其原因 |
| 构建指南 | [docs/BUILD.md](docs/BUILD.md) | 从零搭建项目 |
| 新增角色 | [docs/ADD_NEW_CHARACTER.md](docs/ADD_NEW_CHARACTER.md) | 如何新增一个 AI NPC 角色 |
| 项目指南 | [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) | 项目整体指引 |

---

## 功能状态说明

本文档采用以下三态标记系统：

| 标记 | 含义 |
|------|------|
| **LIVE** | 已实现且对接后端，可正常使用 |
| **STUB** | 前端/后端结构已完成，但未对接数据，显示占位符 |
| **PLAN** | 仅规划，尚未实现 |

### 当前功能状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 单角色对话 | LIVE | POST /api/chat，支持多角色切换 |
| 群聊 | LIVE | POST /api/group_chat，多角色自动回复+插话 |
| 角色列表 | LIVE | GET /api/characters，3 个角色 |
| 角色状态 | LIVE | GET /api/characters/status |
| 角色详情 | LIVE | GET /api/characters/<char_id> |
| 角色记忆 | LIVE | GET /api/characters/<char_id>/memories |
| 世界状态 | LIVE | GET /api/state，时间/天气/活动 |
| 用户认证 | LIVE | 注册/登录/游客/登出/当前用户 |
| 对话历史 | LIVE | 记录 User 和角色对话，支持标注 |
| 通知中心 | LIVE | GET /api/notifications，近况+系统 |
| 成就系统 | STUB | GET /api/achievements 返回空列表 |
| 状态记录 | STUB | 前端页面完成，待后端数据对接 |
| 个人资料编辑 | STUB | 前端页面完成，待后端接口对接 |
| 账户安全 | STUB | 前端页面完成，待后端接口对接 |
| 聊天设置 | STUB | 前端页面完成，待功能实现 |
| 移动端侧边栏 | PLAN | 移动端侧边栏抽屉未实现 |
| 批量状态接口 | PLAN | 批量角色状态接口待规划 |

---

## 已支持角色

| 角色 | 代号 | 特征 |
|------|------|------|
| **冷旭帆** | 冰刃 | 沉默、防御、护腕+塑料刀、望仔身份验证 |
| **黄景云** | 启明 | 话多、七种方言、糖纸+录音笔、叶清辞 |
| **叶清辞** | - | 坐在书桌前发呆，安静 |

---

## 部署说明（简要）

### 生产部署

使用 `gunicorn`（已在 requirements.txt 中）：

```bash
gunicorn -w 1 -b 0.0.0.0:5000 backend.app:app
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | 5000 |
| `SECRET_KEY` | Flask 密钥 | lengxufan-dev-secret-key-2024 |

### 详细部署

见 [docs/BUILD.md](docs/BUILD.md)。

---

## 架构

```
用户输入 → 场景感知 → 上下文分析 → 信任验证 → 思考链 → 生成输出
                ↑                              ↓
          五感描述库                    动作 + 台词 + 心理独白
```

详见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 和 [docs/building-ai-npc-hybrid-architecture.md](docs/building-ai-npc-hybrid-architecture.md)。

---

## 作者

**陆银** · 独立建造者

本项目为课余时间独立完成——从工厂流水线旁边的下班时间，到公网上的第一个 AI NPC。

GitHub：[lengxufan-project/lengxufan-api](https://github.com/lengxufan-project/lengxufan-api)