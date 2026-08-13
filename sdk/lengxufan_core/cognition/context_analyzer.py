"""上下文分析引擎 - 分析用户输入意图、情感、话题"""
from infra.logger import debug
from lengxufan_core.character_data.context_patterns import (
    classify_intent,
    detect_emotion,
    extract_topic,
    FOLLOWUP_TRIGGERS,
)


class ContextAnalyzer:
    """
    分析用户输入：
    - 意图分类（质问/疑问/陈述/敷衍/追问/语气助词）
    - 是否在追问上一轮
    - 上下文关联程度
    - 情感检测
    - 话题提取
    """

    def __init__(self):
        self.last_topic = "一般对话"
        self.conversation_turns = 0
        self._last_user_input = ""

    def analyze(self, user_input: str, recent_context: str = "") -> dict:
        """
        分析用户输入，返回结构化分析结果。

        参数:
            user_input: 当前用户输入
            recent_context: 最近的对话上下文（来自WorkingMemory）

        返回值:
            {
                "intent": "质问",
                "is_followup": True,
                "is_emotional": True,
                "emotional_valence": "负面",
                "topic": "阿冷这个名字",
                "context_relevance": 0.9,
                "short_input": False
            }
        """
        text = user_input.strip()

        # 1. 意图分类
        intent = classify_intent(text)

        # 2. 追问检测
        is_followup = self._detect_followup(text, recent_context)

        # 3. 情感检测
        emotion_result = detect_emotion(text)

        # 4. 话题提取
        topic = extract_topic(text)
        if topic == "一般对话" and self.last_topic != "一般对话":
            # 如果当前没检测到话题但上一轮有，延续上一轮话题
            pass  # 暂不自动延续，等待更多上下文验证
        if topic != "一般对话":
            self.last_topic = topic

        # 5. 上下文关联度
        context_relevance = self._calculate_relevance(text, recent_context)

        # 6. 更新状态
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

        debug(f"[ContextAnalyzer] 意图={intent}, 追问={is_followup}, "
              f"情感={emotion_result['emotional_valence']}, 话题={topic}")

        return result

    def _detect_followup(self, text: str, recent_context: str = "") -> bool:
        """检测是否为追问"""
        # 1. 直接触发词
        for trigger in FOLLOWUP_TRIGGERS:
            if trigger in text:
                return True

        # 2. 短疑问句（如 "为什么？" "然后？" "所以？"）
        if len(text) <= 5 and any(kw in text for kw in ["为什么", "然后", "所以", "怎么", "什么"]):
            return True

        # 3. 如果上一轮有上下文且当前是疑问，可能是追问
        if recent_context and "?" in text or "？" in text:
            return True

        return False

    def _calculate_relevance(self, text: str, recent_context: str = "") -> float:
        """计算当前输入与上下文的关联度（简单词重叠法）"""
        if not recent_context:
            return 0.0

        # 提取上下文中的关键词（简单分词）
        context_words = set(recent_context.replace("。", " ").replace("，", " ").split())
        text_words = set(text.replace("。", " ").replace("，", " ").split())

        if not context_words:
            return 0.0

        # 计算词重叠率
        overlap = len(context_words & text_words)
        relevance = overlap / len(context_words) if context_words else 0.0

        return min(relevance, 1.0)

    def get_conversation_summary(self) -> str:
        """获取当前对话状态摘要"""
        return f"对话轮次: {self.conversation_turns}, 当前话题: {self.last_topic}"
