"""角色思考链模块 - 模拟冷旭帆的思考过程：感知→分析→决策→输出"""

class ThoughtChain:
    def __init__(self):
        self.last_thought = None
        self.thought_log = []
    
    def think(self, perception, identity, memory, user_state, user_input, working_memory):
        perception_summary = self._perceive(perception, identity)
        user_analysis = self._analyze_user(user_input, user_state, working_memory, memory)
        decision = self._decide(perception, identity, user_analysis)
        thought_summary = self._summarize(perception_summary, user_analysis, decision)
        self.last_thought = thought_summary
        self.thought_log.append(thought_summary)
        if len(self.thought_log) > 50:
            self.thought_log = self.thought_log[-50:]
        return {
            "perception_summary": perception_summary,
            "user_analysis": user_analysis,
            "decision": decision,
            "thought_summary": thought_summary
        }
    
    def _perceive(self, perception, identity):
        e = perception.emotion
        if e < 30: mood = "低落"
        elif e < 50: mood = "平静"
        elif e < 70: mood = "稍好"
        else: mood = "高涨"
        body = []
        if perception.status.get("shoulder_pain"): body.append("左肩旧伤隐隐作痛")
        if perception.status.get("holding_knife"): body.append("握着塑料刀")
        if perception.status.get("miss_wang"): body.append("在想陆华望")
        trust = identity.wang_belief if identity.wang_claim else identity.trust_level
        return {"mood": mood, "emotion": e, "body": body, "trust": trust}
    
    def _analyze_user(self, user_input, user_state, working_memory, memory):
        analysis = {"intent": "未知", "mood": "未知", "is_question": False, "is_emotional": False, "context_hint": ""}
        if user_input.strip().endswith("?") or user_input.strip().endswith("？") or len(user_input.strip()) <= 3:
            analysis["is_question"] = True
        emotional_words = ["讨厌", "恨", "喜欢", "爱", "谢谢", "对不起", "烦", "气", "滚"]
        if any(w in user_input for w in emotional_words):
            analysis["is_emotional"] = True
        if working_memory:
            recent = working_memory.get_recent_context()
            if recent and recent != "刚才没人说话。":
                analysis["context_hint"] = recent
        if user_state:
            analysis["mood"] = user_state.mental.get("mood", "未知")
        if any(w in user_input for w in ["你好", "晚上好", "早上好", "嗨"]):
            analysis["intent"] = "问候"
        elif any(w in user_input for w in ["为什么", "怎么", "什么意思"]):
            analysis["intent"] = "追问"
        elif any(w in user_input for w in ["我喜欢", "我爱", "我想"]):
            analysis["intent"] = "表达喜好"
        elif any(w in user_input for w in ["讨厌", "恨", "烦"]):
            analysis["intent"] = "表达负面情绪"
        elif analysis["is_question"]:
            analysis["intent"] = "询问"
        else:
            analysis["intent"] = "陈述"
        return analysis
    
    def _decide(self, perception, identity, user_analysis):
        decision = {"strategy": "正常回应", "should_silence": False, "should_defend": False}
        e = perception.emotion
        if e < 20: decision["should_silence"] = True
        if user_analysis["intent"] == "表达负面情绪": decision["strategy"] = "保持距离"
        if user_analysis["intent"] == "追问" and e < 40: decision["should_silence"] = True
        return decision
    
    def _summarize(self, perception_summary, user_analysis, decision):
        parts = [f"情绪{perception_summary['mood']}({perception_summary['emotion']:.0f})"]
        if perception_summary["body"]:
            parts.append("身体：" + "、".join(perception_summary["body"]))
        parts.append(f"用户意图：{user_analysis['intent']}")
        if decision["should_silence"]: parts.append("倾向于沉默")
        return " | ".join(parts)