# 冷旭帆 API 契约

> 生成时间：2026-09-02
> 状态：LIVE（已对接）/ STUB（待实测）
> 说明：本文档列出所有后端 API 接口，前端修改 API 时必须同步更新此文档。

---

## 一、接口总览

| # | 方法 | 路径 | 作用 | 状态 |
|---|------|------|------|------|
| 1 | POST | `/api/auth/register` | 用户注册 | LIVE |
| 2 | POST | `/api/auth/login` | 用户登录 | LIVE |
| 3 | POST | `/api/auth/guest` | 游客登录 | LIVE |
| 4 | POST | `/api/auth/logout` | 登出 | LIVE |
| 5 | GET | `/api/auth/me` | 获取当前用户 | LIVE |
| 6 | GET | `/api/state` | 世界状态 + 角色快照 | LIVE |
| 7 | GET | `/api/characters` | 角色列表 | LIVE |
| 8 | GET | `/api/characters/status` | 所有角色状态摘要 | LIVE |
| 9 | GET | `/api/characters/<char_id>` | 角色详细信息 | LIVE |
| 10 | GET | `/api/characters/<char_id>/memories` | 角色记忆列表 | LIVE |
| 11 | GET | `/api/characters/<char_id>/debug-trust` | 调试信任值 | DEV |
| 12 | POST | `/api/chat` | 单角色对话 | LIVE |
| 13 | POST | `/api/group_chat` | 群聊 | LIVE |
| 14 | GET | `/api/conversations` | 对话历史 | LIVE |
| 15 | PUT | `/api/conversations/<id>/annotate` | 标注消息 | LIVE |
| 16 | GET | `/api/notifications` | 通知和活动 | LIVE |
| 17 | GET | `/api/achievements` | 成就列表 | STUB |
| 18 | GET | `/api/dev/stats` | 开发者统计 | DEV |

---

## 二、接口详情

### 2.1 `POST /api/auth/register` — 用户注册

**请求参数**（JSON body）：
```json
{
  "username": "用户名（至少2字符）",
  "password": "密码（至少3字符）"
}
```

**成功响应**（200）：
```json
{
  "message": "注册成功",
  "user_id": 1,
  "username": "用户名",
  "role": "user"
}
```

**错误响应**（400）：
```json
{
  "error": "用户名已存在"
}
```
或
```json
{
  "error": "用户名至少2个字符"
}
```

**注意**：特殊用户名 `yingying` 注册时角色为 `developer`。

---

### 2.2 `POST /api/auth/login` — 用户登录

**请求参数**（JSON body）：
```json
{
  "username": "用户名",
  "password": "密码"
}
```

**成功响应**（200）：
```json
{
  "message": "登录成功",
  "user_id": 1,
  "username": "用户名",
  "role": "user"
}
```

**错误响应**（401）：
```json
{
  "error": "用户名或密码错误"
}
```

---

### 2.3 `POST /api/auth/guest` — 游客登录

**请求参数**：无

**成功响应**（200）：
```json
{
  "message": "游客登录成功",
  "user_id": 2,
  "username": "游客_a1b2c3",
  "role": "user"
}
```

**说明**：自动生成 UUID 用户名，格式为 `游客_` + 6 位十六进制。

---

### 2.4 `POST /api/auth/logout` — 登出

**请求参数**：无

**成功响应**（200）：
```json
{
  "message": "已退出"
}
```

---

### 2.5 `GET /api/auth/me` — 获取当前用户

**请求参数**：无（依赖 session）

**成功响应**（200）：
```json
{
  "user_id": 1,
  "username": "用户名",
  "role": "user"
}
```

**错误响应**（401）：
```json
{
  "error": "未登录"
}
```

---

### 2.6 `GET /api/state` — 世界状态 + 角色快照

**请求参数**：无

**成功响应**（200）：
```json
{
  "emotion": 65,
  "emotion_label": "稍好",
  "body": "身体状态摘要",
  "mind": "心理状态摘要",
  "relationship": "关系阶段",
  "wang_claim": false,
  "wang_trust": 0,
  "verified_evidence": [],
  "last_thought": "刚才那句话……",
  "pending_question": null,
  "user_state": "用户状态摘要",
  "world": {
    "day": 2,
    "time_of_day": "下午",
    "weather": "晴",
    "weather_desc": "阳光从训练场的铁丝网漏进来，在地上划出整齐的格子。"
  },
  "recent_events": [
    "system.weather_change",
    "lengxufan.action"
  ],
  "dorm_activities": {
    "向云舟": "蹲在地上修一盏台灯，镊子尖正对着一颗松动的螺丝",
    "冉昭然": "坐在他旁边，手里拿着一张对折了三次的纸条",
    "黄景云": "趴在床上打电话，用粤语说了一句什么",
    "叶清辞": "坐在书桌前发呆，手表摘下来放在桌面上，秒针一下一下地走",
    "陆华望": "坐在窗台上，一条腿屈着，另一条腿垂下来",
    "秦狐戏": "在上铺嚼口香糖，齿间碾了一下",
    "陆华希": "靠在床头，书翻到一半"
  },
  "last_milestone": null
}
```

**注意**：当前返回的是 `get_engine("lengxufan").get_state_snapshot()`，即冷旭帆角色的状态快照。

---

### 2.7 `GET /api/characters` — 角色列表

**请求参数**：无

**成功响应**（200）：
```json
[
  {
    "id": "lengxufan",
    "name": "冷旭帆"
  },
  {
    "id": "huangjingyun",
    "name": "黄景云"
  },
  {
    "id": "yeqingci",
    "name": "叶清辞"
  }
]
```

---

### 2.8 `GET /api/characters/status` — 所有角色状态摘要

**请求参数**：无

**成功响应**（200）：
```json
{
  "characters": [
    {
      "id": "lengxufan",
      "name": "冷旭帆",
      "emotion_label": "稍好",
      "relationship_stage": "朋友"
    },
    {
      "id": "huangjingyun",
      "name": "黄景云",
      "emotion_label": "平静",
      "relationship_stage": "--"
    },
    {
      "id": "yeqingci",
      "name": "叶清辞",
      "emotion_label": "--",
      "relationship_stage": "--"
    }
  ]
}
```

**说明**：`emotion_label` 取值：`低落`（<30）、`平静`（30-49）、`稍好`（50-69）、`高涨`（>=70）。`relationship_stage` 取值取决于角色配置的 `relationship_stages`，无数据时显示 `--`。

---

### 2.9 `GET /api/characters/<char_id>` — 角色详细信息

**请求参数**：路径参数 `char_id`（如 `lengxufan`、`huangjingyun`、`yeqingci`）

**成功响应**（200）：
```json
{
  "id": "lengxufan",
  "name": "冷旭帆",
  "persona": {
    "name": "冷旭帆",
    "code": "冰刃",
    "age": 17,
    "academy": "潜龙学院",
    "room": "307室",
    "trait": "沉默寡言，防御性强，但内心敏感"
  },
  "autobiographical": [
    "我叫冷旭帆，代号冰刃，是潜龙学院的学生。",
    "我住在307室，宿舍里有七个人。"
  ],
  "milestones": [
    { "trigger": "first_meet", "description": "初次见面", "threshold": 0, "emotion": 50 }
  ],
  "current_state": {
    "emotion": 65,
    "emotion_label": "稍好",
    "relationship_stage": "朋友"
  }
}
```

**注意**：`persona`、`autobiographical`、`milestones` 字段来自 `character.json` 的实际数据，`current_state` 来自引擎实时快照。

**错误响应**（404）：
```json
{
  "error": "角色不存在: unknown_char"
}
```

---

### 2.10 `GET /api/characters/<char_id>/memories` — 角色记忆列表

**请求参数**：路径参数 `char_id`

**成功响应**（200）：
```json
{
  "memories": [
    {
      "id": "ep_1234567890",
      "type": "episodic",
      "summary": "冷旭帆记得今天早上在食堂遇到了黄景云，他正在用粤语打电话。",
      "created_at": 1234567890.0
    }
  ]
}
```

**说明**：记忆数据来自引擎的 `memory.episodic` 列表。无记忆时返回空数组 `{"memories": []}`。

---

### 2.11 `GET /api/characters/<char_id>/debug-trust` — 调试信任值（开发者）

**请求参数**：路径参数 `char_id`

**成功响应**（200）：
```json
{
  "char_id": "lengxufan",
  "trust_level": 30,
  "derived_stage": "陌生人",
  "identity_state": {
    "wang_claim": false,
    "wang_belief": 0,
    "known_name": null,
    "trust_level": 30
  }
}
```

**错误响应**（200）：
```json
{
  "error": "no save found"
}
```

---

### 2.12 `POST /api/chat` — 单角色对话

**请求参数**（JSON body）：
```json
{
  "message": "你好",
  "char_id": "lengxufan",
  "group_context": ""
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `message` | 是 | 用户消息内容 |
| `char_id` | 否 | 角色 ID，默认 `lengxufan` |
| `group_context` | 否 | 群聊上下文（单聊时留空） |

**成功响应**（200）：
```json
{
  "reply": "（他抬起头看了你一眼，握刀的手放松了一些）\n……嗯。",
  "state": {
    "emotion": 65,
    "emotion_label": "稍好",
    "body": "身体状态",
    "mind": "心理状态",
    "relationship": "朋友",
    "wang_claim": false,
    "wang_trust": 0,
    "verified_evidence": [],
    "last_thought": "",
    "pending_question": null,
    "user_state": "用户状态",
    "world": {
      "day": 2,
      "time_of_day": "下午",
      "weather": "晴",
      "weather_desc": "天气描述"
    },
    "recent_events": [],
    "dorm_activities": {},
    "last_milestone": null
  }
}
```

**错误响应**（400）：
```json
{
  "reply": "……（他沉默着，没有回答）"
}
```

---

### 2.13 `POST /api/group_chat` — 群聊

**请求参数**（JSON body）：
```json
{
  "message": "大家今天都干什么了？"
}
```

**成功响应**（200）：
```json
{
  "replies": [
    {
      "char_id": "lengxufan",
      "name": "冷旭帆",
      "reply": "（他靠在窗边，没有抬头）\n没什么。",
      "type": "normal"
    },
    {
      "char_id": "huangjingyun",
      "name": "黄景云",
      "reply": "我刚刚在研究一种新的方言！",
      "type": "normal"
    },
    {
      "char_id": "yeqingci",
      "name": "叶清辞",
      "reply": "（发呆）",
      "type": "normal"
    },
    {
      "char_id": "huangjingyun",
      "name": "黄景云",
      "reply": "对了对了，阿辞你刚才说的那个……",
      "type": "interrupt"
    }
  ]
}
```

**说明**：
- `type: "normal"` 为正常回复，`type: "interrupt"` 为主动插话
- 插话基于 `interrupt_probability` 和 `GroupChatManager.select_interrupt_candidate()`

**错误响应**（400）：
```json
{
  "error": "消息不能为空"
}
```

---

### 2.14 `GET /api/conversations` — 对话历史

**请求参数**：无（依赖 session）

**成功响应**（200）：
```json
[
  {
    "id": 1,
    "role": "user",
    "content": "你好",
    "annotation": null,
    "state_snapshot": null,
    "created_at": "2026-09-02T12:00:00"
  },
  {
    "id": 2,
    "role": "lxf",
    "content": "（他抬起头看了你一眼）\n……嗯。",
    "annotation": null,
    "state_snapshot": {
      "emotion": 65,
      "emotion_label": "稍好"
    },
    "created_at": "2026-09-02T12:00:01"
  }
]
```

**说明**：`role` 取值：`user`（用户消息）、`lxf`（角色回复）。`state_snapshot` 在角色回复时附带。

**错误响应**（401）：
```json
{
  "error": "未登录"
}
```

---

### 2.15 `PUT /api/conversations/<id>/annotate` — 标注消息

**请求参数**（路径参数 `id` + JSON body）：
```json
{
  "annotation": "这条消息很有趣"
}
```

**成功响应**（200）：
```json
{
  "message": "标注已保存"
}
```

**错误响应**（404）：
```json
{
  "error": "消息不存在"
}
```

---

### 2.16 `GET /api/notifications` — 通知和活动

**请求参数**：无

**成功响应**（200）：
```json
{
  "system": [
    {
      "type": "system.weather_change",
      "data": {},
      "timestamp": ""
    }
  ],
  "activities": [
    {
      "name": "向云舟",
      "activity": "蹲在地上修一盏台灯，镊子尖正对着一颗松动的螺丝"
    },
    {
      "name": "冉昭然",
      "activity": "坐在他旁边，手里拿着一张对折了三次的纸条"
    },
    {
      "name": "黄景云",
      "activity": "趴在床上打电话，用粤语说了一句什么"
    },
    {
      "name": "叶清辞",
      "activity": "坐在书桌前发呆，手表摘下来放在桌面上，秒针一下一下地走"
    },
    {
      "name": "陆华望",
      "activity": "坐在窗台上，一条腿屈着，另一条腿垂下来"
    },
    {
      "name": "秦狐戏",
      "activity": "在上铺嚼口香糖，齿间碾了一下"
    },
    {
      "name": "陆华希",
      "activity": "靠在床头，书翻到一半"
    }
  ]
}
```

**说明**：
- `system`：从 `event_bus` 筛选的事件（类型以 `system.` 开头或包含 `system`）
- `activities`：从 `world_state.dorm_activities` 获取的室友活动 + 角色动作事件
- 无数据时 `system` 和 `activities` 返回空数组

---

### 2.17 `GET /api/achievements` — 成就列表

**请求参数**：无

**成功响应**（200）：
```json
{
  "achievements": []
}
```

**说明**：当前为 STUB，返回空列表。后续可扩展真实成就系统。

---

### 2.18 `GET /api/dev/stats` — 开发者统计

**请求参数**：无

**成功响应**（200）：
```json
{
  "model_router": {
    "current_model": "qwen-plus",
    "verified_model": "qwen-plus",
    "call_count": {
      "qwen-plus": 42,
      "glm-free": 0
    },
    "failover_log": []
  },
  "event_bus": {
    "recent_events": [
      {"type": "system.weather_change", "data": {}, "timestamp": ""}
    ]
  },
  "world": {
    "day": 2,
    "time_of_day": "下午",
    "weather": "晴"
  }
}
```

---

## 三、数据流向图

```
前端 (frontend/)
  │
  ├── GET  /api/state                  → 世界状态 + 角色快照
  ├── GET  /api/characters             → 角色列表
  ├── GET  /api/characters/status      → 角色状态摘要
  ├── GET  /api/characters/<char_id>   → 角色详情
  ├── GET  /api/characters/<char_id>/memories → 角色记忆
  ├── POST /api/chat                   → 单角色对话
  ├── POST /api/group_chat             → 群聊
  ├── POST /api/auth/register          → 注册
  ├── POST /api/auth/login             → 登录
  ├── POST /api/auth/guest             → 游客登录
  ├── POST /api/auth/logout            → 登出
  ├── GET  /api/auth/me                → 当前用户
  ├── GET  /api/conversations          → 对话历史
  ├── PUT  /api/conversations/<id>/annotate → 标注
  ├── GET  /api/notifications          → 通知和活动
  ├── GET  /api/achievements           → 成就（STUB）
  └── GET  /api/dev/stats              → 开发者调试
```

---

## 四、通用约定

### 4.1 认证方式
- 使用 Flask session 进行用户认证
- 登录/注册/游客成功后，`session` 中设置 `user_id` 和 `username`
- 需要登录的接口（`/api/conversations`、`/api/conversations/<id>/annotate`、`/api/auth/me`）返回 401

### 4.2 响应格式
- 成功：JSON 对象，具体结构见各接口
- 错误：`{"error": "错误消息"}` + 对应 HTTP 状态码

### 4.3 字符编码
- 所有响应使用 UTF-8 编码
- `JSON_AS_ASCII = False`，中文字符直接输出

### 4.4 CORS
- 已启用 `flask-cors`，支持跨域请求
- `supports_credentials=True`，允许携带 Cookie

---

## 五、修改 API 时必读

1. **新增路由**：在 `routes/` 下创建新文件，定义蓝图，在 `routes/__init__.py` 的 `register_routes()` 中注册
2. **修改参数**：更新本文档对应接口的请求参数说明
3. **修改响应**：更新本文档对应接口的响应示例
4. **前端同步**：修改 `frontend/js/api.js` 中的对应 API 调用函数
5. **前端文档**：参考 `frontend/FRONTEND_MAP.md` 了解前端页面与 API 的对应关系