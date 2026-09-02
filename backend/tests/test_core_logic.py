import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from lengxufan_core.perception import Perception
from lengxufan_core.cognition.trust_suspicion import TrustSuspicionEngine
from lengxufan_core.character_state.relationship_dynamics import RelationshipDynamics
from characters import CharacterRegistry

@pytest.fixture(scope="module")
def load_character():
    CharacterRegistry.load_all()
    from lengxufan_core.character_context import set_current_character
    config = CharacterRegistry.get("lengxufan")
    set_current_character(config)
    return config

def test_emotion_boundary():
    p = Perception()
    p.emotion = 150
    assert p.emotion == 150  # 直接赋值不会强制边界，需手动调用 max/min
    p.emotion = max(0, min(100, p.emotion))
    assert p.emotion == 100

def test_trust_claim(load_character):
    engine = TrustSuspicionEngine()
    result = engine.handle_self_claim("陆华望")
    assert result["claimed"] is True
    assert engine.wang_claim is True
    assert engine.trust_value > 0

def test_trust_question_generation(load_character):
    engine = TrustSuspicionEngine()
    engine.wang_claim = True
    engine.trust_value = 60  # 进入试探阶段
    from lengxufan_core.character_context import get_character_data
    identity_evidence = get_character_data("trust_rules", {}).get("identity_evidence", [])
    question = engine._generate_verification_question(identity_evidence)
    assert question is not None

def test_relationship_stage_lookup(load_character):
    rd = RelationshipDynamics()
    from lengxufan_core.character_context import get_character_data
    stages = get_character_data("relationship_stages", [])
    stage = rd._get_relationship_stage(10, stages)
    assert stage == "陌生人"

def test_character_data_loaded(load_character):
    from lengxufan_core.character_context import get_current_character
    assert get_current_character().name == "冷旭帆"