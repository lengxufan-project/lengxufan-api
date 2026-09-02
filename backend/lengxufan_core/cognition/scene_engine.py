"""场景感知与推导引擎 - 使用共享世界状态"""
from datetime import datetime
from typing import Optional
from infra.logger import debug
from world_state import world
from lengxufan_core.character_context import get_character_data


class SceneEngine:
    """管理时间、地点、场景氛围。输出五感描述。动态推导场景变化。"""

    def __init__(self):
        self.current_location = "307室"
        self.time_of_day = world.get_time_of_day()
        self.atmosphere = "安静"
        self.nearby_characters = []
        self._last_scene_input = None
        self._scene_changed = False

    def perceive(self, scene_input: Optional[dict] = None) -> dict:
        self._scene_changed = (scene_input != self._last_scene_input)
        self._last_scene_input = scene_input

        # 从共享世界状态获取时间
        new_time = world.get_time_of_day()
        if new_time != self.time_of_day:
            self._scene_changed = True
            self.time_of_day = new_time

        time_data = get_character_data("scene_templates", {}).get("time_atmosphere", {}).get(self.time_of_day, {})
        location_data = get_character_data("scene_templates", {}).get("location_features", {}).get(self.current_location, {})

        # 从共享世界状态获取室友活动
        characters = []
        if scene_input and "characters" in scene_input:
            characters = scene_input["characters"]
        else:
            dorm_activities = world.get_dorm_activities()
            for name, activity in dorm_activities.items():
                characters.append({"name": name, "activity": activity})

        self.nearby_characters = characters
        self.atmosphere = time_data.get("atmosphere", "安静")

        # 天气描述
        weather_desc = world.get_weather_description()

        result = {
            "visual": location_data.get("visual", "") + "。" + time_data.get("visual", ""),
            "audio": time_data.get("audio", "") + "。" + location_data.get("audio", ""),
            "tactile": time_data.get("tactile", "") + "。" + location_data.get("tactile", ""),
            "olfactory": time_data.get("olfactory", "") + "。" + location_data.get("olfactory", ""),
            "atmosphere": time_data.get("atmosphere", "安静"),
            "weather": weather_desc,
            "characters": characters,
        }

        for sense in ["visual", "audio", "tactile", "olfactory"]:
            result[sense] = result[sense].strip("。").strip()

        debug(f"[SceneEngine] 时间段={self.time_of_day}, 天气={world.get_weather()}, 地点={self.current_location}, 人物={len(characters)}人")
        return result

    def update(self, elapsed_seconds: float):
        new_time = world.get_time_of_day()
        if new_time != self.time_of_day:
            self.time_of_day = new_time
            self._scene_changed = True

    def get_prompt_context(self) -> str:
        if not self.nearby_characters:
            return f"你在{self.current_location}。{self.atmosphere}。"

        world_summary = world.get_world_summary()
        lines = [f"你靠在{self.current_location}靠门的床上。{world_summary}"]

        preferred_order = ["向云舟", "冉昭然", "黄景云", "叶清辞", "陆华望", "秦狐戏", "陆华希"]
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