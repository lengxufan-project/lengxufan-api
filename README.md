# 冷旭帆 · AI NPC 情感引擎

> **代号：冰刃** | **版本：v5.5** | **最后更新：2026年8月4日**

冷旭帆是一个会自己疼、会做噩梦、会在你不在的时候默默擦刀的AI NPC。
技术上采用"代码管里子、AI管面子"的混合架构，拥有四阶段认知处理链、前后端分离部署、
支持多角色扩展。

**公网地址**：http://139.199.168.140:5000/

---

## 架构

```
用户输入 → 场景感知 → 上下文分析 → 信任验证 → 思考链 → 生成输出
                ↑                              ↓
          五感描述库                    动作 + 台词 + 心理独白
```

### 目录结构

```
lengxufan-flask-mvp/
├── run.py              ← 入口
├── app.py              ← Flask 应用
├── config.py           ← 配置
├── routes/             ← 路由层（auth/chat/state/history/characters）
├── services/           ← 服务层（引擎管理/用户逻辑）
├── models/             ← 数据模型（User/Conversation）
├── characters/         ← 角色注册中心（冷旭帆 + 黄景云）
├── frontend/           ← 前端（HTML/CSS/JS 分离 + 角色选择器）
├── lengxufan_core/     ← 核心引擎（感知/记忆/身份/行为）
├── cognition/          ← 认知层（场景/上下文/独白/信任/思考）
├── character_state/    ← 角色状态（身体/心理/关系）
├── character_data/     ← 角色数据层
├── api/                ← API 适配（多平台容错路由）
├── infra/              ← 基础设施（日志/持久化/时间）
├── data/               ← 运行时数据（SQLite + ChromaDB）
└── tests/              ← 测试套件（100轮自动化测试）
```

---

## 已支持角色

| 角色 | 代号 | 特征 |
|------|------|------|
| **冷旭帆** | 冰刃 | 沉默、防御、护腕+塑料刀、望仔身份验证 |
| **黄景云** | 启明 | 话多、七种方言、糖纸+录音笔、叶清辞 |

---

## 快速开始

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 设置 API Key
```powershell
[Environment]::SetEnvironmentVariable("ALIBABA_API_KEY", "你的Key", "User")
[Environment]::SetEnvironmentVariable("GLM_API_KEY", "你的Key", "User")
[Environment]::SetEnvironmentVariable("DEEPSEEK_API_KEY", "你的Key", "User")
```

### 3. 启动
```bash
python run.py          # Web 模式（http://127.0.0.1:5000）
python run.py --cli    # CLI 调试模式
```

### 4. 从零重建
详见 [BUILD.md](BUILD.md)

---

## 架构决策记录
详见 [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 作者

**陆银** · 独立建造者

本项目为课余时间独立完成——从工厂流水线旁边的下班时间，到公网上的第一个 AI NPC。

GitHub：[lengxufan-project/lengxufan-api](https://github.com/lengxufan-project/lengxufan-api)

