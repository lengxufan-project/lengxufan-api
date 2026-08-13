"""心理独白生成器 - 从当前角色上下文读取数据"""
import random
from infra.logger import debug
from lengxufan_core.character_context import get_character_data


class InnerMonologue:
    def __init__(self):
        self.last_monologue = ""
        self._monologue_history = []

    def generate(self, emotion=50.0, status=None, scene=None, context=None, thought_summary=""):
        if status is None: status = {}
        if scene is None: scene = {}
        if context is None: context = {}

        mono_templates = get_character_data("monologue_styles") or {}
        monologue_templates = mono_templates.get("monologue_templates", {})
        body_parts = mono_templates.get("body_monologue_parts", {})
        default_parts = mono_templates.get("default_body_parts", [])
        scene_triggered = mono_templates.get("scene_triggered_monologues", {})

        if emotion < 30: mood_style = "低落"
        elif emotion < 50: mood_style = "平静"
        elif emotion < 70: mood_style = "稍好"
        else: mood_style = "高涨"

        body_detail = self._generate_body_detail(status, body_parts, default_parts)

        time_of_day = scene.get("time_of_day", "")
        scene_monologue = None
        if time_of_day in scene_triggered:
            scene_monologue = random.choice(scene_triggered[time_of_day])

        if scene_monologue and random.random() < 0.4:
            template = scene_monologue
        else:
            templates = monologue_templates.get(mood_style, ["{body_detail}"])
            template = random.choice(templates)

        try:
            monologue = template.format(body_detail=body_detail)
        except KeyError:
            monologue = body_detail

        if monologue == self.last_monologue:
            monologue = monologue.rstrip("。") + "。他没说出来。"

        self.last_monologue = monologue
        self._monologue_history.append(monologue)
        if len(self._monologue_history) > 20:
            self._monologue_history = self._monologue_history[-20:]

        return monologue

    def _generate_body_detail(self, status, body_parts, default_parts):
        parts = []
        if status.get("holding_knife") and "holding_knife" in body_parts:
            parts.append(random.choice(body_parts["holding_knife"]))
        if status.get("shoulder_pain") and "shoulder_pain" in body_parts:
            parts.append(random.choice(body_parts["shoulder_pain"]))
        if status.get("miss_wang") and "miss_wang" in body_parts:
            parts.append(random.choice(body_parts["miss_wang"]))
        if status.get("dream_streak", 0) > 0 and "dream_streak" in body_parts:
            parts.append(random.choice(body_parts["dream_streak"]))
        if status.get("_pain_lingering", 0) > 0 and "pain_lingering" in body_parts:
            if random.random() < 0.5:
                parts.append(random.choice(body_parts["pain_lingering"]))

        if not parts:
            parts.append(random.choice(default_parts) if default_parts else "身体没有异常")
        elif len(parts) > 2:
            parts = parts[:2]

        return "。".join(parts)

    def get_last_monologue(self):
        return self.last_monologue
