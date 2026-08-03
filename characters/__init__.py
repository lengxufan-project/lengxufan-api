"""角色注册中心 - 管理所有可用的AI NPC角色"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class CharacterConfig:
    """单个角色的完整配置"""
    def __init__(self, char_id, name, data_dir):
        self.char_id = char_id
        self.name = name
        self.data_dir = data_dir
        self.persona = {}
        self.autobiographical = []
        self.milestones = []
        self.scheduled_memories = []
        self.fallback_actions = {}
        self.status_overlay_actions = {}
        self.feeling_translations = {}
        self.memory_rules = []
        self.identity_evidence_rules = []
        self.intent_templates = []
        self.event_templates = {}
        self.causal_chains = {}
        self.scene_templates = {}
        self.context_patterns = {}
        self.monologue_styles = {}
        self.trust_rules = {}
        self.relationship_stages = []
        self.default_emotion = 50.0

    def load(self):
        """从数据目录加载所有角色数据"""
        data_dir = self.data_dir

        # 加载 Persona
        persona_file = os.path.join(data_dir, 'persona.py')
        if os.path.exists(persona_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.persona',
                persona_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.persona = module.PERSONA
            # 用 Persona 中配置的名称覆盖文件夹名
            if 'name' in self.persona:
                self.name = self.persona['name']

        # 加载自传体记忆
        auto_file = os.path.join(data_dir, 'autobiographical.py')
        if os.path.exists(auto_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.autobiographical',
                auto_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.autobiographical = module.AUTOBIOGRAPHICAL_MEMORIES

        # 加载关系里程碑
        milestones_file = os.path.join(data_dir, 'milestones.py')
        if os.path.exists(milestones_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.milestones',
                milestones_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.milestones = module.RELATIONSHIP_MILESTONES

        # 加载定时解锁记忆
        scheduled_file = os.path.join(data_dir, 'scheduled_memories.py')
        if os.path.exists(scheduled_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.scheduled_memories',
                scheduled_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.scheduled_memories = module.SCHEDULED_MEMORIES

        # 加载兜底动作库
        actions_file = os.path.join(data_dir, 'fallback_actions.py')
        if os.path.exists(actions_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.fallback_actions',
                actions_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.fallback_actions = module.FALLBACK_ACTIONS
            self.status_overlay_actions = module.STATUS_OVERLAY_ACTIONS

        # 加载情感翻译层
        feeling_file = os.path.join(data_dir, 'feeling_translations.py')
        if os.path.exists(feeling_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.feeling_translations',
                feeling_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.feeling_translations = module.FEELING_TRANSLATIONS

        # 加载记忆规则
        mem_rules_file = os.path.join(data_dir, 'memory_rules.py')
        if os.path.exists(mem_rules_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.memory_rules',
                mem_rules_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.memory_rules = module.MEMORY_RULES
            self.identity_evidence_rules = module.IDENTITY_EVIDENCE_RULES

        # 加载意愿模板
        intent_file = os.path.join(data_dir, 'intent_templates.py')
        if os.path.exists(intent_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.intent_templates',
                intent_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.intent_templates = module.INTENT_TEMPLATES

        # 加载后台事件模板
        events_file = os.path.join(data_dir, 'event_templates.py')
        if os.path.exists(events_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.event_templates',
                events_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.event_templates = module.EVENT_TEMPLATES
            self.causal_chains = module.CAUSAL_CHAIN

        # 加载场景模板
        scene_file = os.path.join(data_dir, 'scene_templates.py')
        if os.path.exists(scene_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.scene_templates',
                scene_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.scene_templates = {
                'time_atmosphere': module.TIME_ATMOSPHERE,
                'location_features': module.LOCATION_FEATURES,
                'default_character_activities': module.DEFAULT_CHARACTER_ACTIVITIES
            }

        # 加载上下文模式
        ctx_file = os.path.join(data_dir, 'context_patterns.py')
        if os.path.exists(ctx_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.context_patterns',
                ctx_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.context_patterns = {
                'intent_patterns': module.INTENT_PATTERNS,
                'followup_triggers': module.FOLLOWUP_TRIGGERS,
                'emotional_words': module.EMOTIONAL_WORDS,
                'topic_keywords': module.TOPIC_KEYWORDS
            }

        # 加载独白模板
        mono_file = os.path.join(data_dir, 'monologue_styles.py')
        if os.path.exists(mono_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.monologue_styles',
                mono_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.monologue_styles = {
                'monologue_templates': module.MONOLOGUE_TEMPLATES,
                'body_monologue_parts': module.BODY_MONOLOGUE_PARTS,
                'default_body_parts': module.DEFAULT_BODY_PARTS,
                'scene_triggered_monologues': module.SCENE_TRIGGERED_MONOLOGUES
            }

        # 加载信任规则
        trust_file = os.path.join(data_dir, 'trust_rules.py')
        if os.path.exists(trust_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.trust_rules',
                trust_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.trust_rules = {
                'trust_stages': module.TRUST_STAGES,
                'suspicion_triggers': module.SUSPICION_TRIGGERS,
                'identity_evidence': module.IDENTITY_EVIDENCE,
                'question_templates': module.QUESTION_TEMPLATES
            }

        # 加载关系阶段
        rel_file = os.path.join(data_dir, 'relationship_stages.py')
        if os.path.exists(rel_file):
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                f'characters.{self.char_id}.data.relationship_stages',
                rel_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.relationship_stages = module.RELATIONSHIP_STAGES

        return self


class CharacterRegistry:
    """角色注册中心"""
    _characters = {}

    @classmethod
    def register(cls, char_id, name, data_dir):
        config = CharacterConfig(char_id, name, data_dir)
        cls._characters[char_id] = config
        return config

    @classmethod
    def get(cls, char_id):
        if char_id not in cls._characters:
            raise ValueError(f"未注册的角色: {char_id}")
        return cls._characters[char_id]

    @classmethod
    def list_characters(cls):
        return list(cls._characters.keys())

    @classmethod
    def load_all(cls):
        """启动时自动发现并加载所有角色"""
        chars_dir = os.path.dirname(os.path.abspath(__file__))
        for item in os.listdir(chars_dir):
            item_path = os.path.join(chars_dir, item)
            if os.path.isdir(item_path) and not item.startswith('__'):
                data_dir = os.path.join(item_path, 'data')
                init_file = os.path.join(data_dir, '__init__.py')
                if os.path.exists(init_file):
                    try:
                        config = cls.register(item, item, data_dir)
                        config.load()
                        print(f"[CharacterRegistry] 已加载角色: {config.name}")
                    except Exception as e:
                        print(f"[CharacterRegistry] 加载角色 {item} 失败: {e}")
