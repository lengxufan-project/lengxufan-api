"""信任同步逻辑 - 独立于对话引擎，负责 identity 与 relationship_dynamics 的同步"""
from lengxufan_core.character_context import get_character_data


def sync_trust_systems(engine):
    """同步信任状态到身份和关系系统"""
    trust_suspicion = engine.trust_suspicion
    identity = engine.identity
    relationship_dynamics = engine.relationship_dynamics

    if not trust_suspicion:
        return

    # 同步到身份状态
    identity.wang_claim = trust_suspicion.wang_claim
    identity.wang_belief = trust_suspicion.trust_value

    # 同步到关系动态
    if relationship_dynamics:
        wang_trust = trust_suspicion.trust_value
        cap = min(wang_trust + 15, 100)
        if relationship_dynamics.trust_value > cap:
            relationship_dynamics.trust_value = cap

        stages = get_character_data("relationship_stages") or []
        stage = relationship_dynamics._get_relationship_stage(
            relationship_dynamics.trust_value, stages
        )
        relationship_dynamics.current_stage = stage