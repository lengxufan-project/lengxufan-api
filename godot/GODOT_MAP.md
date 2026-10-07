# GODOT_MAP — godot/ 客户端地图

> **这份文档是什么**：`godot/` 目录（Godot 4 客户端原型）的模块地图。说明场景里有什么节点、三个脚本各管什么、素材在哪、怎么连后端，以及「未验证」的现状。
> **谁该看**：要改 Godot 客户端场景/立绘/交互的人；想了解「除 Web 外还有没有别的客户端」的人。
> **看完能做什么**：知道改场景改哪个 `.tscn`、改逻辑改哪个 `.gd`、换素材放哪个目录；知道当前代码未在 Godot 里跑过，接手第一件事是验证。

> 核实日期：2026-10-07（基于当日实际文件清单；`.godot/` 为编辑器缓存，已忽略）

---

## 一、目录结构

```
godot/
├── project.godot              # Godot 项目配置（入口）
├── scenes/
│   ├── Room.tscn              # 唯一场景：307 夜晚房间 + 对话框
│   ├── Room.tscn.bak          # ⚠ 历史备份，勿引用
│   └── Room.tscn*.tmp         # ⚠ 编辑器临时文件，勿引用
├── scripts/
│   ├── room.gd                # 场景主控：发送消息、打字机显示、切换表情
│   ├── api_client.gd          # HTTP 请求：POST /api/chat
│   └── character.gd           # 立绘节点：情绪 → 眼睛/嘴巴图层切换
└── assets/
    ├── scenes/307_room_night.png    # 房间背景（307 室夜景）
    └── characters/lengxufan_01~06.jpg  # 冷旭帆立绘素材 6 张
```

---

## 二、场景结构：Room.tscn（唯一场景）

节点层级（27 个节点，节选关键部分）：

| 节点 | 类型 | 职责 |
|---|---|---|
| `Background` | TextureRect | 房间背景，贴 `307_room_night.png` 全屏拉伸 |
| `WatermarkCover` | ColorRect | 遮挡背景左上角水印 |
| `WallBack/WallLeft/WallRight/Floor/Bed/BedBlanket/Table/TableLeg` | ColorRect | **占位家具，当前 visible=false**（保留结构待细化） |
| `Character` | Control | 立绘容器，挂 [character.gd](../godot/scripts/character.gd) |
| `Character/Portrait` | TextureRect | 立绘图片（当前为 `lengxufan_01.jpg`） |
| `Character/Face` | ColorRect | 脸部占位 |
| `Character/Eyes{Happy,Normal,Sad,Angry}` | ColorRect ×4 | 眼睛表情图层（一次只显示一个） |
| `Character/Mouth{Smile,Normal,Frown}` | ColorRect ×3 | 嘴巴表情图层（一次只显示一个） |
| `ReplyPanel/RichTextLabel` | RichTextLabel | 角色回复显示区（打字机效果） |
| `InputBar/LineEdit` + `SendButton` | LineEdit + Button | 输入框与发送按钮 |
| `ApiClient` | HTTPRequest | 网络请求节点，挂 [api_client.gd](../godot/scripts/api_client.gd) |

> 立绘表情目前是 **ColorRect 占位图层**（非真实分层立绘）。要换成真图：把 ColorRect 替换为 TextureRect 并贴对应素材，脚本逻辑不用改（见下节）。

---

## 三、三个脚本的职责

| 脚本 | 职责 | 改动时注意 |
|---|---|---|
| [room.gd](../godot/scripts/room.gd) | 场景主控：连接按钮/回车 → 调 ApiClient；收到回复后用 `visible_ratio` 补间做打字机；按 `state.emotion_label`（优先）或 `state.emotion`（数值）驱动表情 | 打字机速度在 `_start_typewriter`（每字 0.05 秒，最短 1 秒） |
| [api_client.gd](../godot/scripts/api_client.gd) | `POST http://127.0.0.1:5000/api/chat`，body `{message, char_id}`（char_id 默认 `lengxufan`）；成功发 `reply_received` 信号，失败发 `request_failed`；请求中会取消上一个避免堆积 | 换服务器改 `BASE_URL` 常量 |
| [character.gd](../godot/scripts/character.gd) | `update_emotion()` 三态归一化：中文标签（高涨/稍好→happy，平静→neutral，低落→sad）/ 数值（≥70 happy、≥50 neutral、≥30 sad、否则 angry）/ 英文关键字；按 `EYE_LAYERS`/`MOUTH_LAYERS` 字典切换图层可见性 | 加表情：先加节点，再在两个字典里登记 |

**数据流**：LineEdit 输入 → room.gd → api_client.gd（HTTP）→ Flask `/api/chat` → 返回 `{reply, state:{emotion, emotion_label}}` → room.gd 打字机显示 + character.gd 切表情。

---

## 四、当前状态（重要）

1. **未验证**：三个脚本头部均自述「当前环境未安装 Godot，脚本为 Godot 4.2+ 语法，需人工在编辑器中运行确认」。首次接手请先用编辑器打开 `project.godot` 跑一遍 `Room.tscn`。
2. **仅支持单角色**：char_id 固定默认 `lengxufan`，立绘只有冷旭帆素材；多人/多角色切换未实现。
3. **后端必须先启动**：连的是本机 `http://127.0.0.1:5000`（`python backend/run.py`），失败时回复区显示连接失败提示。
4. **本机 Godot 路径**：见 [_LOCAL_TOOLS.md](../_LOCAL_TOOLS.md)。
5. **勿引用**：`Room.tscn.bak`、`Room.tscn*.tmp` 为编辑器产物；`.godot/` 整个目录是缓存（已被 git 忽略，不要在文档/代码中引用）。

---

## 五、扩展区（以后自己加内容时）

- [ ] 新场景：放 `godot/scenes/`，并在本文件「二、场景结构」登记
- [ ] 新立绘素材：放 `godot/assets/characters/`，命名建议 `<角色id>_<序号>.jpg`；新角色需同步加眼睛/嘴巴图层
- [ ] 若把占位 ColorRect 家具替换为真实美术资源，建议单独建 `assets/furniture/`
- [ ] 多角色支持（角色切换 UI、按 char_id 换立绘）——目前未实现，README 功能状态表中也未登记
- [ ] 若 Godot 客户端验证通过，记得回来把本文件「四、当前状态」的「未验证」改成验证日期与结论

---

## 相关文档

| 关系 | 文档 |
|---|---|
| 文档体系总图 | [DOCS_MAP.md](../DOCS_MAP.md) |
| 后端接口契约（/api/chat 参数与返回） | [docs/API_CONTRACT.md](../docs/API_CONTRACT.md) |
| Web 前端（对照参考） | [frontend/FRONTEND_MAP.md](../frontend/FRONTEND_MAP.md) · [frontend/FRONTEND_FILES.md](../frontend/FRONTEND_FILES.md) |
| 本机工具路径（Godot 可执行文件） | [_LOCAL_TOOLS.md](../_LOCAL_TOOLS.md) |
| 角色数据（人设/情绪字段来源） | [docs/ADD_NEW_CHARACTER.md](../docs/ADD_NEW_CHARACTER.md) |
| 改动影响地图（场景 8 涉及 Godot） | [PROJECT_MAP.md](../PROJECT_MAP.md) |