"""场景感知与推导引擎 - 解析场景输入，生成五感描述和System Prompt注入文本"""
from datetime import datetime
from typing import Optional
from infra.logger import debug
from lengxufan_core.character_data.scene_templates import (
    TIME_ATMOSPHERE,
    LOCATION_FEATURES,
    DEFAULT_CHARACTER_ACTIVITIES,
    get_time_of_day,
)


class SceneEngine:
    """
    管理时间、地点、场景氛围。
    输出五感描述。
    动态推导场景变化。
    """

    def __init__(self):
        self.current_location = "307室"
        self.time_of_day = get_time_of_day()
        self.atmosphere = "安静"
        self.nearby_characters = []
        self._last_scene_input = None
        self._scene_changed = False

    def perceive(self, scene_input: Optional[dict] = None) -> dict:
        self._scene_changed = (scene_input != self._last_scene_input)
        self._last_scene_input = scene_input

        new_time = get_time_of_day()
        if new_time != self.time_of_day:
            self._scene_changed = True
            self.time_of_day = new_time

        time_data = TIME_ATMOSPHERE.get(self.time_of_day, TIME_ATMOSPHERE["夜晚"])
        location_data = LOCATION_FEATURES.get(
            self.current_location, LOCATION_FEATURES["307室"]
        )

        characters = []
        if scene_input and "characters" in scene_input:
            characters = scene_input["characters"]
        else:
            for name, activity in DEFAULT_CHARACTER_ACTIVITIES.items():
                characters.append({"name": name, "activity": activity})

        self.nearby_characters = characters
        self.atmosphere = time_data.get("atmosphere", "安静")

        result = {
            "visual": location_data.get("visual", "") + "。" + time_data.get("visual", ""),
            "audio": time_data.get("audio", "") + "。" + location_data.get("audio", ""),
            "tactile": time_data.get("tactile", "") + "。" + location_data.get("tactile", ""),
            "olfactory": time_data.get("olfactory", "") + "。" + location_data.get("olfactory", ""),
            "atmosphere": time_data.get("atmosphere", "安静"),
            "characters": characters,
        }

        for sense in ["visual", "audio", "tactile", "olfactory"]:
            result[sense] = result[sense].strip("。").strip()

        debug(f"[SceneEngine] 时间段={self.time_of_day}, 地点={self.current_location}, "
              f"人物={len(characters)}人, 场景变化={self._scene_changed}")

        return result

    def update(self, elapsed_seconds: float):
        new_time = get_time_of_day()
        if new_time != self.time_of_day:
            self.time_of_day = new_time
            self._scene_changed = True

    def get_prompt_context(self) -> str:
        if not self.nearby_characters:
            return f"你在{self.current_location}。{self.atmosphere}。"

        lines = [f"你靠在{self.current_location}靠门的床上。"
                 f"{self.time_of_day}的{TIME_ATMOSPHERE.get(self.time_of_day, {}).get('visual', '')}。"]

        preferred_order = ["向云舟", "冉昭然", "黄景云", "叶清辞",
                           "陆华望", "秦狐戏", "陆华希"]
        ordered = []
        for name in preferred_order:
            for char in self.nearby_characters:
                if char["name"] == name:
                    ordered.append(char)
                    break

        for char in ordered:
            lines.append(f"{char['name']}{char['activity']}。")

        return "\n".join(lines)

    def get_character_activity(self, name: str) -> Optional[str]:
        for char in self.nearby_characters:
            if char["name"] == name:
                return char["activity"]
        return None

    def is_nearby(self, name: str) -> bool:
        return any(c["name"] == name for c in self.nearby_characters)
