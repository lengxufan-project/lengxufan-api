# 冷旭帆数据地图

> 生成时间：2026-09-02
> 说明：本文档解释 `data/` 目录的结构、用途和维护方式

---

## 一、核心概念：source vs runtime

```
data/
├── source/          # 源数据 —— 受 Git 跟踪，手动维护
│   ├── characters/  # 角色源数据（JSON/MD）
│   ├── worldview/   # 世界观卡片
│   └── images/      # 图片素材
│
└── runtime/         # 运行时数据 —— 写入 .gitignore，不提交 Git
    ├── save/        # 角色状态存档（JSON）
    ├── logs/        # 运行日志
    ├── chroma_db/   # 向量数据库（ChromaDB）
    └── uploads/     # 用户上传文件
```

### 1.1 `data/source/` —— 源数据（Git 跟踪）

由开发者手动维护的源数据文件。每个子目录存放特定类型的数据，当前部分目录尚为空，待后续填充。

| 子目录 | 作用 | 当前状态 |
|--------|------|----------|
| `characters/` | 角色源数据文件（JSON/MD 格式），用于导入或生成角色配置 | 空目录，待填充 |
| `worldview/` | 世界观卡片（世界设定、场景描述、规则说明） | 空目录，待填充 |
| `images/` | 角色头像、场景背景等图片素材 | 空目录，待填充 |

### 1.2 `data/runtime/` —— 运行时数据（Git 忽略）

由系统运行时自动生成的数据。已写入 `.gitignore`，不提交到 Git 仓库。

| 子目录/文件 | 作用 | 当前内容 |
|-------------|------|----------|
| `save/` | 角色状态存档（JSON 文件）。每个角色一个文件：`save_{char_id}.json` | `save_lengxufan.json`、`save_huangjingyun.json`、`save_yeqingci.json` |
| `logs/` | 运行日志。每天一个 `.log` 文件 + 一个 `events.jsonl` | `lengxufan_20260902.log`（约 1KB） |
| `chroma_db/` | ChromaDB 向量数据库文件 | `chroma.sqlite3`（约 188KB） |
| `uploads/` | 用户上传文件 | 空目录 |
| `lengxufan.db` | SQLite 数据库（用户表 + 对话表） | 约 16KB |

---

## 二、各目录详细说明

### 2.1 `data/source/characters/` —— 角色源数据

**作用**：存放角色源数据文件，用于导入或生成 `backend/characters/<char_id>/data/character.json`。

**当前状态**：空目录，角色数据文件直接存放在 `backend/characters/<char_id>/data/character.json`。

**如何新增角色数据**：
1. 准备角色源数据文件（JSON 或 Markdown 格式）
2. 将文件放入 `data/source/characters/` 目录
3. 在 `backend/characters/` 下创建对应角色目录，并运行 `tools/import_character_md.py` 或 `tools/convert_character_to_json.py` 转换
4. 验证角色加载：启动后端，检查 `/api/characters` 返回中包含新角色

### 2.2 `data/source/worldview/` —— 世界观卡片

**作用**：存放世界观设定文件，用于场景描述、角色行为参考等。

**当前状态**：空目录，待填充。

**建议内容**：
- 世界观总纲（世界背景、核心冲突）
- 场景描述（宿舍、训练场、天台、防空洞等）
- 组织设定（潜龙学院、暗影组织等）
- 时间线/大事记

### 2.3 `data/source/images/` —— 图片素材

**作用**：存放角色头像、场景背景、UI 素材等图片文件。

**当前状态**：空目录，待填充。

**建议格式**：WebP 或 JPG/PNG（建议压缩后使用）。

---

## 三、运行时数据详解

### 3.1 `data/runtime/save/` —— 角色状态存档

每个角色独立保存一个 JSON 文件，由 `infra/persistence.py` 管理。

**文件结构**（以 `save_lengxufan.json` 为例）：
```json
{
  "emotion": 50.0,
  "memory": [],
  "episodic_memory": [],
  "autobiographical_memory": [],
  "relationship_milestones": [],
  "scheduled_memories": [],
  "status": {
    "shoulder_pain": false,
    "dream_streak": 0,
    "miss_wang": false,
    "holding_knife": false
  },
  "identity_state": {
    "wang_claim": false,
    "wang_belief": 0,
    "known_name": null,
    "trust_level": 30
  },
  "context": {
    "last_topic": null,
    "conversation_turns": 0
  },
  "simulated_day": 1,
  "last_time": 1234567890.0,
  "pending_events": [],
  "pending_intents": []
}
```

**手动操作**：删除存档文件可以让角色状态重置为默认值。

### 3.2 `data/runtime/logs/` —— 运行日志

- **可读日志**：`lengxufan_YYYYMMDD.log`，人类可读的文本日志
- **JSON 事件日志**：`events.jsonl`，结构化 JSON 格式，每行一个事件，可用于数据分析

### 3.3 `data/runtime/chroma_db/` —— 向量数据库

ChromaDB 向量数据库，用于语义搜索和记忆检索。当前使用 SQLite 作为后端存储。

### 3.4 `data/runtime/uploads/` —— 用户上传

用户上传文件目录，当前为空。

---

## 四、如何新增角色数据

### 方式一：通过 character.json（推荐）

1. 在 `backend/characters/` 下创建新角色目录：
   ```
   backend/characters/<char_id>/
   ├── __init__.py         # 空文件
   └── data/
       ├── __init__.py     # 空文件
       └── character.json  # 角色数据
   ```

2. `character.json` 包含字段：
   - `persona`：角色人格设定（name, code, age, academy, trait 等）
   - `autobiographical_memories`：自传体记忆列表
   - `relationship_milestones`：关系里程碑
   - `scheduled_memories`：定时记忆
   - `relationship_stages`：关系阶段定义（信任值区间 → 关系标签）
   - 其他可选字段：`fallback_actions`, `status_overlay_actions`, `feeling_translations`, `memory_rules`, `identity_evidence_rules`, `intent_templates`, `event_templates`, `causal_chains`, `scene_templates`, `context_patterns`, `monologue_styles`, `trust_rules`

3. 启动后端，`CharacterRegistry.load_all()` 会自动扫描并加载新角色。

### 方式二：通过 tools/import_character_md.py

1. 准备 Markdown 格式的角色描述文件
2. 放入 `data/source/characters/`
3. 运行 `tools/import_character_md.py` 自动转换

---

## 五、如何新增世界观卡片

1. 在 `data/source/worldview/` 下创建 Markdown 文件
2. 格式示例：
   ```markdown
   # 卡片标题
   
   **类型**：场景/组织/时间线
   **标签**：tag1, tag2
   
   正文内容...
   ```

---

## 六、如何新增图片素材

1. 将图片文件放入 `data/source/images/`
2. 在 `frontend/` 中引用时，路径为 `../data/source/images/<filename>`
3. 建议使用 WebP 格式以减小体积

---

## 七、Git 提交规则

| 目录 | 是否提交 Git | 说明 |
|------|-------------|------|
| `data/source/` | 是 | 源数据，手动维护 |
| `data/source/characters/` | 是 | 当前为空，但结构受跟踪 |
| `data/source/worldview/` | 是 | 当前为空，但结构受跟踪 |
| `data/source/images/` | 是 | 当前为空，但结构受跟踪 |
| `data/runtime/` | 否 | 写入 `.gitignore`，自动生成 |
| `data/runtime/save/` | 否 | 角色状态存档 |
| `data/runtime/logs/` | 否 | 运行日志 |
| `data/runtime/chroma_db/` | 否 | 向量数据库 |
| `data/runtime/uploads/` | 否 | 用户上传文件 |
| `data/runtime/lengxufan.db` | 否 | SQLite 数据库 |

**注意**：如果 `data/runtime/` 目录下需要保留某个占位文件以维持目录结构受 Git 跟踪，可以在目录内添加 `.gitkeep` 文件。当前 `.gitignore` 规则为 `data/runtime/`，意味着整个目录不会被 Git 跟踪。