# 如何添加一个新角色

## 1. 创建角色目录
在 `characters/` 下新建文件夹，例如 `characters/yeqingci/`，并在其中创建 `data/` 子目录。

## 2. 准备数据文件
复制现有角色（如 `characters/lengxufan/data/`）的所有 `.py` 文件到新角色 `data/`，然后逐个修改内容：
- `persona.py`：新角色的名字、性格、System Prompt
- `autobiographical.py`：背景故事
- `event_templates.py`：随机事件
- `fallback_actions.py`：动作库
- `feeling_translations.py`：情绪翻译
- `intent_templates.py`：主动意愿
- `memory_rules.py`：记忆规则
- `milestones.py`：关系里程碑
- `monologue_styles.py`：独白模板
- `relationship_stages.py`：关系阶段
- `scene_templates.py`：场景描写（可共用）
- `scheduled_memories.py`：定时解锁记忆
- `trust_rules.py`：信任规则（黄景云可留空）
- `context_patterns.py`：意图分类规则（可共用）

## 3. 创建角色包标识
在新角色目录下创建 `__init__.py`，内容为角色名注释。

## 4. 注册角色
打开 `characters/__init__.py`，确认 `CharacterRegistry.load_all()` 会自动扫描 `characters/` 下的目录。无需手动添加，只要目录结构正确即可。

## 5. 测试
重启 Flask，访问 `/api/characters` 查看新角色是否出现。  
或运行 CLI：`python run.py --cli`，用新角色 ID 进行对话。

## 6. 前端角色按钮
在 `frontend/index.html` 和 `demo.html` 的底部角色按钮区，复制现有按钮代码，将 `onclick="switchChar('新id')"` 和显示名称改为新角色。同时更新角色立绘占位符。

---

**注意**：  
- 数据文件只包含数据，不要写函数（除了已约定的纯辅助函数）。  
- 修改后需确保 `CharacterRegistry.load_all()` 能正确加载，如报错检查文件路径。