"""上下文分析引擎 - 分析用户输入意图、情感、话题"""
from infra.logger import debug
from lengxufan_core.character_context import get_character_data


class ContextAnalyzer:
    def __init__(self):
        self.last_topic = "一般对话"
        self.conversation_turns = 0
        self._last_user_input = ""

    def analyze(self, user_input: str, recent_context: str = "") -> dict:
        text = user_input.strip()
        context_patterns = get_character_data("context_patterns", {})
        classify_intent = context_patterns.get("classify_intent")
        detect_emotion = context_patterns.get("detect_emotion")
        extract_topic = context_patterns.get("extract_topic")
        FOLLOWUP_TRIGGERS = context_patterns.get("followup_triggers", [])

        intent = classify_intent(text) if classify_intent else "陈述"
        is_followup = self._detect_followup(text, recent_context, FOLLOWUP_TRIGGERS)
        emotion_result = detect_emotion(text) if detect_emotion else {"is_emotional": False, "emotional_valence": "中性", "positive_count": 0, "negative_count": 0}
        topic = extract_topic(text) if extract_topic else "一般对话"

        if topic != "一般对话":
            self.last_topic = topic

        context_relevance = self._calculate_relevance(text, recent_context)
        self._last_user_input = text
        self.conversation_turns += 1

        result = {
            "intent": intent,
            "is_followup": is_followup,
            "is_emotional": emotion_result["is_emotional"],
            "emotional_valence": emotion_result["emotional_valence"],
            "topic": topic,
            "context_relevance": context_relevance,
            "short_input": len(text) <= 3,
        }
        debug(f"[ContextAnalyzer] 意图={intent}, 追问={is_followup}, 情感={emotion_result['emotional_valence']}, 话题={topic}")
        return result

    def _detect_followup(self, text: str, recent_context: str, triggers) -> bool:
        for trigger in triggers:
            if trigger in text:
                return True
        if len(text) <= 5 and any(kw in text for kw in ["为什么", "然后", "所以", "怎么", "什么"]):
            return True
        if recent_context and ("?" in text or "？" in text):
            return True
        return False

    def _calculate_relevance(self, text: str, recent_context: str = "") -> float:
        if not recent_context:
            return 0.0
        context_words = set(recent_context.replace("。", " ").replace("，", " ").split())
        text_words = set(text.replace("。", " ").replace("，", " ").split())
        if not context_words:
            return 0.0
        overlap = len(context_words & text_words)
        return min(overlap / len(context_words), 1.0)

    def get_conversation_summary(self) -> str:
        return f"对话轮次: {self.conversation_turns}, 当前话题: {self.last_topic}"