"""引擎服务：负责冷旭帆引擎的初始化与状态收集（v5.5 - 角色注册中心版）"""
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

class EngineService:
    def __init__(self, char_id="lengxufan"):
        # 加载角色配置
        CharacterRegistry.load_all()
        self.char_config = CharacterRegistry.get(char_id)
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
            relationship_dynamics=self.relationship_dynamics
        )

    def get_reply(self, user_input):
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
            "user_state": self.us.get_state_summary()
        }
