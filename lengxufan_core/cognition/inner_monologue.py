"""心理独白生成器 - 生成独立于台词的心理描写"""
import random
from infra.logger import debug
from lengxufan_core.character_data.monologue_styles import (
    MONOLOGUE_TEMPLATES,
    BODY_MONOLOGUE_PARTS,
    DEFAULT_BODY_PARTS,
    SCENE_TRIGGERED_MONOLOGUES,
    get_monologue_template,
)


class InnerMonologue:
    """
    生成独立于台词的心理描写。
    基于角色状态 + 场景 + 上下文。
    """

    def __init__(self):
        self.last_monologue = ""
        self._monologue_history = []  # 最近几条独白，避免重复

    def generate(
        self,
        emotion: float = 50.0,
        status: dict = None,
        scene: dict = None,
        context: dict = None,
        thought_summary: str = "",
    ) -> str:
        """
        生成心理独白文本。

        参数:
            emotion: 当前情绪值 (0-100)
            status: 身体状态字典 {"shoulder_pain": bool, "holding_knife": bool, ...}
            scene: 场景信息字典 {"time_of_day": "夜晚", "location": "307室", ...}
            context: 上下文分析结果 {"intent": "质问", "topic": "名字/称呼", ...}
            thought_summary: 思考链摘要

        返回值:
            "护腕硌得疼。那是寒松绣纹压在腕骨上的感觉。"
        """
        if status is None:
            status = {}
        if scene is None:
            scene = {}
        if context is None:
            context = {}

        # 1. 确定情绪风格
        mood_style = get_monologue_template(emotion)

        # 2. 生成身体感受片段
        body_detail = self._generate_body_detail(status)

        # 3. 检查场景触发
        time_of_day = scene.get("time_of_day", "")
        scene_monologue = None
        if time_of_day in SCENE_TRIGGERED_MONOLOGUES:
            scene_monologue = random.choice(SCENE_TRIGGERED_MONOLOGUES[time_of_day])

        # 4. 选择独白模板
        if scene_monologue and random.random() < 0.4:
            # 40% 概率使用场景触发独白
            template = scene_monologue
        else:
            # 使用情绪风格独白
            templates = MONOLOGUE_TEMPLATES.get(mood_style, MONOLOGUE_TEMPLATES["平静"])
            template = random.choice(templates)

        # 5. 填充模板
        monologue = template.format(body_detail=body_detail)

        # 6. 去重：避免与上一轮独白完全相同
        if monologue == self.last_monologue:
            # 尝试换一条
            if scene_monologue:
                templates = MONOLOGUE_TEMPLATES.get(mood_style, MONOLOGUE_TEMPLATES["平静"])
                monologue = random.choice(templates).format(body_detail=body_detail)
            if monologue == self.last_monologue:
                # 如果还是相同，加一点变化
                monologue = monologue.rstrip("。") + "。他没说出来。"

        self.last_monologue = monologue
        self._monologue_history.append(monologue)
        if len(self._monologue_history) > 20:
            self._monologue_history = self._monologue_history[-20:]

        debug(f"[InnerMonologue] 情绪风格={mood_style}, 独白长度={len(monologue)}字")

        return monologue

    def _generate_body_detail(self, status: dict) -> str:
        """根据身体状态生成独白中的身体感受片段"""
        parts = []

        # 检查各个身体状态
        if status.get("holding_knife"):
            parts.append(random.choice(BODY_MONOLOGUE_PARTS["holding_knife"]))
        if status.get("shoulder_pain"):
            parts.append(random.choice(BODY_MONOLOGUE_PARTS["shoulder_pain"]))
        if status.get("miss_wang"):
            parts.append(random.choice(BODY_MONOLOGUE_PARTS["miss_wang"]))
        if status.get("dream_streak", 0) > 0:
            parts.append(random.choice(BODY_MONOLOGUE_PARTS["dream_streak"]))
        if status.get("_pain_lingering", 0) > 0:
            if random.random() < 0.5:
                parts.append(random.choice(BODY_MONOLOGUE_PARTS["pain_lingering"]))

        # 如果没有特殊状态，使用通用身体描述
        if not parts:
            parts.append(random.choice(DEFAULT_BODY_PARTS))
        elif len(parts) > 2:
            # 最多取两个身体感受，避免独白太长
            parts = parts[:2]

        return "。".join(parts)

    def get_last_monologue(self) -> str:
        """获取最近一次生成的独白"""
        return self.last_monologue
