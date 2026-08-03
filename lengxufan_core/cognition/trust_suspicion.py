"""信任怀疑状态机 v5.4 - 管理冷旭帆对"陆华望"身份的验证过程"""
import random
from infra.logger import debug
from lengxufan_core.character_data.trust_rules import (
    TRUST_STAGES,
    SUSPICION_TRIGGERS,
    IDENTITY_EVIDENCE,
    QUESTION_TEMPLATES,
    get_trust_stage,
    get_stage_index,
)


class TrustSuspicionEngine:
    def __init__(self):
        self.wang_claim = False
        self.trust_value = 10
        self.current_stage = "警惕"
        self.evidence_log = []
        self.pending_question = None
        self.last_suspicion_reason = ""
        self.verified_evidence = set()

    def process_turn(self, user_input: str, known_name: str = None, stage_name: str = None) -> dict:
        trust_before = self.trust_value
        stage_before = self.current_stage

        result = {
            "trust_change": 0,
            "trust_before": trust_before,
            "trust_after": trust_before,
            "stage_before": stage_before,
            "stage_after": stage_before,
            "stage_changed": False,
            "suspicion_triggered": False,
            "suspicion_reason": "",
            "question": None,
            "evidence_matched": None,
        }

        # 1. 主动检查用户输入是否匹配任何证据的答案
        for evidence in IDENTITY_EVIDENCE:
            if evidence["evidence_id"] in self.verified_evidence:
                continue
            matched = any(ans in user_input for ans in evidence["correct_answers"])
            if matched:
                self.trust_value = min(100, self.trust_value + evidence["correct_trust_delta"])
                self.verified_evidence.add(evidence["evidence_id"])
                self.evidence_log.append({
                    "evidence_id": evidence["evidence_id"],
                    "passed": True,
                    "timestamp": 0,
                })
                result["evidence_matched"] = {
                    "evidence_id": evidence["evidence_id"],
                    "passed": True,
                    "trust_delta": evidence["correct_trust_delta"],
                }
                debug(f"[TrustSuspicion] 自动检测到证据通过: {evidence['evidence_id']} → 信任+{evidence['correct_trust_delta']}")

        # 2. 如果之前有等待的问题，检查用户是否在回答
        if self.pending_question:
            evidence = self._check_evidence(user_input, self.pending_question)
            if evidence:
                result["evidence_matched"] = evidence
                if evidence["passed"]:
                    self.trust_value = min(100, self.trust_value + evidence["trust_delta"])
                    self.verified_evidence.add(evidence["evidence_id"])
                else:
                    self.trust_value = max(0, self.trust_value + evidence["trust_delta"])
                self.evidence_log.append({
                    "evidence_id": evidence["evidence_id"],
                    "passed": evidence["passed"],
                    "timestamp": 0,
                })
                self.pending_question = None

        # 3. 检查怀疑触发条件
        if self.wang_claim:
            for trigger in SUSPICION_TRIGGERS:
                patterns = trigger["pattern"]
                if isinstance(patterns, str):
                    patterns = [patterns]
                if any(p in user_input for p in patterns):
                    condition = trigger.get("condition", {})
                    if "stage_below" in condition:
                        current_idx = get_stage_index(self.current_stage)
                        threshold_idx = get_stage_index(condition["stage_below"])
                        if current_idx < threshold_idx:
                            self.trust_value = max(0, self.trust_value + trigger["trust_delta"])
                            result["suspicion_triggered"] = True
                            result["suspicion_reason"] = trigger["reason"]
                            self.last_suspicion_reason = trigger["reason"]

        # 4. 进入试探阶段时主动追问
        stage = get_trust_stage(self.trust_value)
        if stage["stage"] == "试探" and stage_before != "试探":
            question = self._generate_verification_question()
            if question:
                result["question"] = question
                self.pending_question = question

        # 5. 阶段切换
        if stage["stage"] != stage_before:
            result["stage_changed"] = True
            self.current_stage = stage["stage"]
            debug(f"[TrustSuspicion] 阶段切换: {stage_before} → {stage['stage']}")

        result["trust_after"] = self.trust_value
        result["trust_change"] = self.trust_value - trust_before
        result["stage_after"] = self.current_stage

        return result

    def handle_self_claim(self, name: str) -> dict:
        if name in ["陆华望", "华望", "望仔"]:
            self.wang_claim = True
            self.trust_value = 10
            self.current_stage = "警惕"
            return {"claimed": True, "initial_trust": self.trust_value,
                    "response": "……你说你是望仔。你证明给我看。"}
        return {"claimed": False}

    def _check_evidence(self, user_input: str, question: str) -> dict:
        for evidence in IDENTITY_EVIDENCE:
            if question == evidence["question"]:
                matched = any(ans in user_input for ans in evidence["correct_answers"])
                return {
                    "evidence_id": evidence["evidence_id"],
                    "passed": matched,
                    "trust_delta": evidence["correct_trust_delta"] if matched else evidence["wrong_trust_delta"],
                    "question": question,
                    "answer": user_input,
                }
        return None

    def _generate_verification_question(self) -> str:
        unverified = [e for e in IDENTITY_EVIDENCE if e["evidence_id"] not in self.verified_evidence]
        if not unverified:
            return None
        unverified.sort(key=lambda x: x["weight"], reverse=True)
        return unverified[0]["question"]

    def get_stage_description(self) -> str:
        stage = get_trust_stage(self.trust_value)
        return f"信任阶段: {stage['stage']}（{self.trust_value}/100）——{stage['behavior']}"

    def to_dict(self):
        return {
            "wang_claim": self.wang_claim,
            "trust_value": self.trust_value,
            "current_stage": self.current_stage,
            "verified_evidence": list(self.verified_evidence),
        }

    @classmethod
    def from_dict(cls, d):
        engine = cls()
        if d:
            engine.wang_claim = d.get("wang_claim", False)
            engine.trust_value = d.get("trust_value", 10)
            engine.current_stage = d.get("current_stage", "警惕")
            engine.verified_evidence = set(d.get("verified_evidence", []))
        return engine
