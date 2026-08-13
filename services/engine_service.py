"""引擎服务：负责角色引擎的初始化与状态收集（v5.5 - 角色上下文版）"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from infra.logger import info
from api.router import router as model_router
from lengxufan_core import (
    Perception, Memory, IdentityState, BehaviorEngine,
    DialogueEngine, get_biorhythm
)
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
from characters import CharacterRegistry
from world_state import world
from event_bus import bus
from lengxufan_core.character_context import set_current_character

_engine_cache = {}

class EngineService:
    def __init__(self, char_id="lengxufan"):
        info(f"世界状态: {world.get_world_summary()}")

        CharacterRegistry.load_all()
        self.char_config = CharacterRegistry.get(char_id)
        self.char_id = char_id
        
        # ---- 关键：设置当前角色上下文 ----
        set_current_character(self.char_config)
        info(f"已加载角色: {self.char_config.name}")

        self.perception = Perception()
        self.memory = Memory()
        self.identity = IdentityState()
        self.behavior = BehaviorEngine()
        self.wm = WorkingMemory()
        self.sn = SocialNetwork()
        self.us = UserState()
        self.tc = ThoughtChain()
        self.scene_engine = SceneEngine()
        self.context_analyzer = ContextAnalyzer()
        self.inner_monologue = InnerMonologue()
        self.trust_suspicion = TrustSuspicionEngine()
        self.body_state = BodyState()
        self.mind_state = MindState()
        self.relationship_dynamics = RelationshipDynamics()

        from infra.persistence import load_full_state
        saved = load_full_state()
        if saved:
            self.perception = Perception.from_dict(saved)
            self.memory = Memory.from_dict(saved, saved.get("simulated_day", 1))
            self.identity = IdentityState.from_dict(saved.get("identity_state", {}))
        else:
            self.perception.emotion = get_biorhythm()

        self.engine = DialogueEngine(
            self.perception, self.memory, self.identity, self.behavior,
            model_router, self.wm, self.sn, self.us, self.tc,
            scene_engine=self.scene_engine,
            context_analyzer=self.context_analyzer,
            inner_monologue=self.inner_monologue,
            trust_suspicion=self.trust_suspicion,
            body_state=self.body_state,
            mind_state=self.mind_state,
            relationship_dynamics=self.relationship_dynamics,
            event_bus=bus,
            char_id=char_id
        )

        _engine_cache[char_id] = self
        self._register_cross_character_events()

    def _register_cross_character_events(self):
        char_name = self.char_config.name
        if self.char_id == "lengxufan":
            def on_huangjingyun_action(data):
                action = data.get("action", "")
                if "剥糖纸" in action:
                    self.perception.emotion = min(85, self.perception.emotion + 2)
                elif "方言" in action or "斯瓦希里" in action:
                    self.perception.emotion = min(85, self.perception.emotion + 1)
                elif "噩梦" in action or "审讯" in action:
                    self.perception.emotion = max(0, self.perception.emotion - 3)
            bus.subscribe("huangjingyun.action", on_huangjingyun_action)
        elif self.char_id == "huangjingyun":
            def on_lengxufan_action(data):
                action = data.get("action", "")
                if "护腕" in action or "擦刀" in action:
                    self.perception.emotion = min(85, self.perception.emotion + 2)
                elif "望仔" in action or "陆华望" in action:
                    self.perception.emotion = min(85, self.perception.emotion + 3)
                elif "不许叫" in action:
                    self.perception.emotion = max(0, self.perception.emotion - 2)
            bus.subscribe("lengxufan.action", on_lengxufan_action)

    def get_reply(self, user_input):
        # 每次对话前确保角色上下文正确
        set_current_character(self.char_config)
        return self.engine.process(user_input)

    def get_state_snapshot(self):
        emo = self.perception.emotion
        if emo < 30: el = "低落"
        elif emo < 50: el = "平静"
        elif emo < 70: el = "稍好"
        else: el = "高涨"
        return {
            "emotion": emo, "emotion_label": el,
            "body": self.body_state.get_status_summary(),
            "mind": self.mind_state.get_status_summary(),
            "relationship": self.relationship_dynamics.get_stage_summary(),
            "wang_claim": self.trust_suspicion.wang_claim,
            "wang_trust": self.trust_suspicion.trust_value if self.trust_suspicion.wang_claim else 0,
            "verified_evidence": list(self.trust_suspicion.verified_evidence) if self.trust_suspicion.wang_claim else [],
            "last_thought": self.tc.last_thought if self.tc else "",
            "pending_question": self.trust_suspicion.pending_question if self.trust_suspicion.wang_claim else None,
            "user_state": self.us.get_state_summary(),
            "world": {
                "day": world.get_simulated_time(),
                "time_of_day": world.get_time_of_day(),
                "weather": world.get_weather(),
                "weather_desc": world.get_weather_description()
            },
            "recent_events": [e.get("type", "") for e in bus.get_recent_events(5)]
        }

    @classmethod
    def get_engine(cls, char_id):
        if char_id not in _engine_cache:
            _engine_cache[char_id] = cls(char_id=char_id)
        return _engine_cache[char_id]
