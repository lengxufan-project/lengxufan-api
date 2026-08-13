# 冷旭帆 AI NPC 引擎 SDK

> **版本**：v0.1.0 | **状态**：Alpha | **最后更新**：2026年8月13日

冷旭帆是"代码管里子、AI管面子"的混合架构AI NPC引擎。这个SDK让你可以用同样的架构，创建你自己的AI角色。

## 快速开始

```bash
pip install -e .
```

## 最小运行示例

```python
from lengxufan_core.character_context import set_current_character
from characters import CharacterRegistry
from lengxufan_core import Perception, Memory, IdentityState, BehaviorEngine, DialogueEngine, get_biorhythm
from lengxufan_core.working_memory import WorkingMemory
from lengxufan_core.social_network import SocialNetwork
from lengxufan_core.user_state import UserState
from lengxufan_core.cognition.thought_chain import ThoughtChain
from lengxufan_core.cognition.scene_engine import SceneEngine
from lengxufan_core.cognition.context_analyzer import ContextAnalyzer
from lengxufan_core.cognition.inner_monologue import InnerMonologue
from lengxufan_core.cognition.trust_suspicion import TrustSuspicionEngine
from lengxufan_core.character_state.body_state import BodyState
from lengxufan_core.character_state.mind_state import MindState
from lengxufan_core.character_state.relationship_dynamics import RelationshipDynamics
from api.router import router as model_router

# 1. 加载角色
CharacterRegistry.load_all()
char_config = CharacterRegistry.get("lengxufan")
set_current_character(char_config)

# 2. 初始化引擎
perception = Perception()
memory = Memory()
identity = IdentityState()
behavior = BehaviorEngine()
engine = DialogueEngine(
    perception, memory, identity, behavior, model_router,
    WorkingMemory(), SocialNetwork(), UserState(), ThoughtChain(),
    scene_engine=SceneEngine(),
    context_analyzer=ContextAnalyzer(),
    inner_monologue=InnerMonologue(),
    trust_suspicion=TrustSuspicionEngine(),
    body_state=BodyState(),
    mind_state=MindState(),
    relationship_dynamics=RelationshipDynamics(),
)

# 3. 对话
reply = engine.process("你好")
print(reply)
```

## 支持的角色

| 角色 | 代号 | 目录 |
|------|------|------|
| 冷旭帆 | 冰刃 | `characters/lengxufan/data/` |
| 黄景云 | 启明 | `characters/huangjingyun/data/` |

## 自定义角色

在 `characters/` 下新建目录，如 `characters/你的角色名/data/`，添加13个数据文件：
- `persona.py` - System Prompt
- `autobiographical.py` - 自传体记忆
- `milestones.py` - 关系里程碑
- `scheduled_memories.py` - 定时解锁记忆
- `fallback_actions.py` - 兜底动作库
- `feeling_translations.py` - 情感翻译层
- `memory_rules.py` - 记忆规则
- `intent_templates.py` - 意愿模板
- `event_templates.py` - 后台事件
- `scene_templates.py` - 场景模板
- `context_patterns.py` - 上下文模式
- `monologue_styles.py` - 独白风格
- `trust_rules.py` - 信任规则
- `relationship_stages.py` - 关系阶段

引擎会自动扫描加载。

## 架构

```
用户输入 → 场景感知 → 上下文分析 → 信任验证 → 思考链 → 生成输出
                ↑                              ↓
          五感描述库                    动作 + 台词 + 心理独白
```

## 许可证

开源，个人/非商业免费使用。商业授权联系作者。

## 作者

**陆银** · 独立建造者
