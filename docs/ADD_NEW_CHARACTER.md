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



# ==数据提取模板：==

# 角色：

## 一、先回答你的疑虑

**这个模板可以承载一个现实的人，但确实还不够全。**  
比如现实的人还有“教育背景”“经济状况”“社交账号”“决策模式”“信仰”等，这些在之前的模板里没有。现在补进去。

**注释一定要保留。** 这次每个字段后都加注释，方便你自己看。

**文件命名用角色名拼音。**  
比如冷旭帆 → `lengxufan`，黄景云 → `huangjingyun`。  
最终文件路径统一为：

```
data/source/characters/<角色拼音>/actor.json
```

这样以后找关联文件、分文件夹都很清楚。

---

## 二、角色面板提取指令（完整版，带注释，可直接复制）

```
你现在是我的叙事数据提取器。我会给你已经了解过的素材。你的任务是把素材中关于“角色”的全部信息提取出来，按下面的 JSON 模板输出。

【总原则】
1. 只输出 JSON，不要输出解释、分析、故事
2. 模板里每个字段都必须出现，即使素材里没有，也用 null 或空字符串/空数组占位
3. 不要自己编造素材里不存在的内容
4. 素材里同一个信息有多个版本时，在该字段后加 "_note" 说明差异
5. 所有动态数值字段，标清范围（如 0-100）

【角色提取维度（必须全部覆盖）】
基础信息、外貌、生理、心理、情感、社会、能力、所有物、语言、价值观、时间感、背景、教育、经济、信仰、决策模式、记忆、行为模式、关系

【JSON 模板】

{
  "id": "",                              # 角色唯一ID，英文小写，用角色名拼音，如 "lengxufan"
  "name": "",                            # 角色名，中文
  "code_name": "",                       # 代号，如"冰刃"，没有则 null
  "gender": "",                          # 性别：男/女/其他
  "age": null,                           # 年龄，数字
  "birthday": "",                        # 生日，格式如"2月20日"

  "appearance": {                        # 外貌特征
    "height": "",                        # 身高
    "hair": "",                          # 发型/发色
    "eyes": "",                          # 眼睛
    "face": "",                          # 面部特征（如眼尾红痣）
    "body": "",                          # 体型
    "dress": "",                         # 日常穿着
    "accessories": [],                   # 配饰（耳钉、眼镜、护腕等）
    "distinguishing_marks": []           # 身体印记：疤、痣、纹身等
  },

  "physiology": {                        # 生理维度
    "sleep_habit": "",                   # 作息习惯
    "pain_history": [],                  # 疼痛史
    "allergies": [],                     # 过敏
    "habitual_actions": [],              # 习惯性动作（摩挲护腕、转手腕等）
    "stamina_base": 0,                   # 基础体力 0-100
    "health_status": ""                  # 健康状态
  },

  "psychology": {                        # 心理维度
    "traits": [],                        # 核心性格标签
    "mbti": "",                          # MBTI，没有则 null
    "fears": [],                         # 恐惧/禁忌
    "desires": [],                       # 渴望/追求
    "contradictions": []                 # 性格矛盾
  },

  "emotion_system": {                    # 情感维度
    "triggers": [],                      # 情绪触发点
    "crash_threshold": "",               # 崩溃阈值
    "attachment_style": "",              # 依恋类型
    "emotional_expression": ""           # 情绪表达方式
  },

  "social": {                            # 社会维度
    "circle": [],                        # 社交圈层
    "group_position": "",                # 群体位置
    "network_strength": {},              # 关系网络强度，如 {"冷旭帆": 0.8}
    "social_accounts": []                # 社交账号/平台身份（如果角色有）
  },

  "abilities": {                         # 能力维度
    "skills": [],                        # 技能/特长
    "weaknesses": [],                    # 弱点
    "failure_modes": []                  # 失败模式
  },

  "possessions": {                       # 所有物维度
    "exclusive_items": [],               # 专属物品
    "meaningful_items": []               # 有意义的物品（记忆载体）
  },

  "language_system": {                   # 语言维度
    "catchphrases": [],                  # 口头禅
    "sentence_pattern": "",              # 句式特点
    "tone": "",                          # 语气
    "silence_habit": "",                 # 沉默习惯（如"常以'嗯'回应"）
    "laugh_style": "",                   # 笑声特点
    "scene_specific_language": {}        # 特定场景用语，如 {"训练场": "..."}
  },

  "values": {                            # 价值观维度
    "core_beliefs": [],                  # 核心信念
    "bottom_lines": [],                  # 底线
    "principle_conflicts": []            # 原则冲突
  },

  "time_sense": {                        # 时间感维度
    "attitude_to_time": "",              # 对时间的态度
    "punctuality": "",                   # 守时/迟到倾向
    "time_related_habits": []            # 与时间相关的习惯
  },

  "background": {                        # 背景经历
    "family": {                          # 家庭
      "parents": [],                     # 父母信息
      "siblings": [],                    # 兄弟姐妹
      "family_status": ""                # 家庭状态
    },
    "growth": [],                        # 成长经历，按时间
    "traumas": [],                       # 重大创伤
    "key_events": [],                    # 关键事件（带时间）
    "secrets": []                        # 秘密
  },

  "education": {                         # 教育背景
    "schools": [],                       # 就读学校/学院
    "majors": [],                        # 专业/方向
    "achievements": []                   # 学业成就/竞赛
  },

  "economy": {                           # 经济状况
    "income_source": "",                 # 收入来源
    "financial_status": "",              # 经济状况描述
    "money_attitude": ""                 # 对金钱的态度
  },

  "beliefs": {                           # 信仰/世界观
    "religion": "",                      # 宗教/信仰
    "life_philosophy": "",               # 人生哲学
    "political_stance": ""               # 政治倾向（若设定存在）
  },

  "decision_patterns": {                 # 决策模式
    "risk_preference": "",               # 风险偏好
    "decision_speed": "",                # 决策速度：快/慢
    "typical_choices": []                # 典型选择模式
  },

  "memories": {                          # 记忆库
    "factual": [],                       # 事实记忆，如["用户说过讨厌下雨"]
    "episodic": [],                      # 情景记忆，[{summary, timestamp, tags}]
    "autobiographical": [],              # 自传体记忆碎片
    "short_term": []                     # 短期记忆
  },

  "behavior_patterns": {                 # 行为模式
    "daily_routines": [],                # 日常活动偏好
    "reaction_rules": [],                # 对不同事件的反应
    "goals_priority": []                 # 目标优先级
  },

  "static_state": {                      # 静态初始值
    "trust": 0,                          # 信任值 0-100
    "affection": 0,                      # 好感度 0-100
    "body_base": "",                     # 基础身体状态
    "mind_base": ""                      # 基础心理状态
  },

  "dynamic_state": {                     # 动态实时值
    "current_mood": null,                # 当前情绪
    "mood_value": null,                  # 情绪数值 0-100
    "stamina": null,                     # 体力 0-100
    "health_status": null,               # 健康状态
    "location": null,                    # 当前所在位置
    "current_action": null,              # 当前动作
    "updated_at": null                   # 更新时间
  },

  "initial_relationships": [             # 初始关系（单向有向）
    {
      "to_id": "",                       # 对方ID
      "type": "",                        # 关系类型：母子/朋友/情敌/室友等
      "stage": "",                       # 阶段：陌生人/熟人/亲密/疏远
      "trust": 0,                        # 我对对方的信任值 0-100
      "affection": 0,                    # 我对对方的好感度 0-100
      "attitude": "",                    # 初始态度：喜欢/讨厌/无感
      "shared_memories": []              # 共同记忆
    }
  ],

  "activity_feed_examples": []           # 该角色可能发布的动态文案
}

【输出方式】
一次只处理一个角色。先输出一行标记：
角色_角色ID_角色名_基础信息

然后输出该角色的完整 JSON。

缺失字段用 null 或空数组，不要省略字段，不要删除注释。

确认后，回复“请提供第一个角色的素材”。
```

---

## 三、文件命名与文件夹规则

| 项       | 规则                                         |
| -------- | -------------------------------------------- |
| 角色 ID  | 角色名拼音小写，如冷旭帆 → `lengxufan`       |
| 文件名   | `actor.json`                                 |
| 保存路径 | `data/source/characters/<角色ID>/actor.json` |

例：

```
data/source/characters/lengxufan/actor.json
data/source/characters/huangjingyun/actor.json
data/source/characters/yeqingci/actor.json
```

这样以后找角色资料、加关联文件，都很清楚。

---

## 四、你现在该做什么

1. 复制上面的指令，发给那个完全了解你叙事的 AI
2. 让它先处理“冷旭帆”
3. 它输出 JSON 后，你检查注释是否保留、字段是否够全
4. 如果 OK，保存到 `data/source/characters/lengxufan/actor.json`

如果冷旭帆跑通，再继续黄景云、叶清辞，然后我们再来设计“场景模板”“关系模板”“事件模板”。