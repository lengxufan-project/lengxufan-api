# 冷旭帆·世界入口 项目总览

## 一、项目是什么

这是一个**AI NPC 情感引擎实验项目**，核心是让一个叫"冷旭帆"的角色拥有真实的情绪、记忆、信任变化和自主状态。

项目采用"**代码管里子，AI 管面子**"的混合架构：代码精确控制情绪值、记忆分区、信任动态，大模型负责生成自然语言回复。支持多角色扩展和多人在线群聊。

当前处于**可运行原型阶段**，核心引擎已完成，前端多页面框架已搭建，正在完善功能对接和移动端适配。

## 二、目录结构（一层展开）

```
lengxufan-flask-mvp/
├── backend/        # Python Flask 后端引擎、API 服务、角色核心逻辑
├── frontend/       # HTML/CSS/JS 前端静态页面、三栏架构、玻璃拟态UI
├── data/           # 数据源数据（Git 跟踪）+ 运行时数据（Git 忽略）
├── docs/           # 项目文档：API 契约、架构决策、开发指南
├── tools/          # 项目级工具脚本：测试、验证、检查、部署
├── paths.py        # 全局路径常量（供各模块拼接路径使用）
├── README.md       # 项目 README（快速启动+功能清单）
└── PROJECT_OVERVIEW.md  # 本文档：项目总览+快速导航
```

## 三、快速导航（最重要）

| 想看什么 → | 打开哪个文件 |
|------------|--------------|
| 后端代码结构 | [backend/BACKEND_MAP.md](backend/BACKEND_MAP.md) |
| 前端页面与跳转 | [frontend/FRONTEND_MAP.md](frontend/FRONTEND_MAP.md) |
| 数据与世界观 | [data/DATA_MAP.md](data/DATA_MAP.md) |
| API 契约 | [docs/API_CONTRACT.md](docs/API_CONTRACT.md) |
| 整体架构决策 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |

## 四、当前进度快照

- **后端**：已完成 Flask 应用框架、多角色注册中心、四阶段认知处理链、信任同步机制、群聊管理器、事件总线、共享世界状态、后台离线生活线程、完整 API 路由层、用户认证系统。

- **前端**：已完成三栏骨架布局（rail + sidebar + scene）、开场动画粒子系统、核心视觉粒子聚合球、磨砂玻璃拟态风格、响应式适配、27 个独立页面、完整跳转关系、所有 API 接口对接框架、移动端基础布局。

- **未完成/待验证**：登录跳转完整流程、成就系统数据对接、移动端侧边栏抽屉交互、公网 HTTPS 部署。

## 五、如何继续开发

- 修改某功能前先查对应 MAP 文件，找到该功能所在文件再修改

- 改前端只动 `frontend/`，改后端只动 `backend/`，数据文档放对应目录

- 后端改动后必须重启 Flask 服务才能生效

- API 契约不可随意变更，新增/修改接口必须同步更新 `docs/API_CONTRACT.md` 和前端 `frontend/js/api.js`

## 六、给新 AI 的入口说明

接手后先读本文档（PROJECT_OVERVIEW.md）了解整体结构，再读 README.md 知道如何启动项目。

如果需要改后端逻辑，去 backend/BACKEND_MAP.md 找对应模块；如果改前端页面，去 frontend/FRONTEND_MAP.md 找对应文件。

遇到 API 调用问题查 docs/API_CONTRACT.md，架构设计问题查 docs/ARCHITECTURE.md。

严格遵守边界：不跨界修改代码，前端不动后端 Python，后端不动前端 CSS/JS，保持清晰分离。
