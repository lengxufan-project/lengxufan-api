"""共享世界状态 - 所有角色共享的时间、天气、地点、室友活动"""
import random
from datetime import datetime, timedelta

class WorldState:
    """单例模式：全局共享的世界状态"""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        # 模拟时间
        self.simulation_start = datetime(2026, 9, 1, 8, 0, 0)  # 开学第一天
        self.simulated_day = 1
        self.seconds_per_day = 3600  # 1现实小时 = 1模拟天

        # 天气
        self.weather = "晴"
        self.weather_duration = 0  # 当前天气还剩多少小时
        self._weather_pool = ["晴", "晴", "晴", "阴", "阴", "小雨", "风"]

        # 地点事件（公共广播）
        self.location_events = {
            "训练场": "",
            "食堂": "",
            "天台": "",
            "走廊": ""
        }

        # 室友活动
        self.dorm_activities = {
            "向云舟": "蹲在地上修一盏台灯，镊子尖正对着一颗松动的螺丝",
            "冉昭然": "坐在他旁边，手里拿着一张对折了三次的纸条",
            "黄景云": "趴在床上打电话，用粤语说了一句什么",
            "叶清辞": "坐在书桌前发呆，手表摘下来放在桌面上，秒针一下一下地走",
            "陆华望": "坐在窗台上，一条腿屈着，另一条腿垂下来",
            "秦狐戏": "在上铺嚼口香糖，齿间碾了一下",
            "陆华希": "靠在床头，书翻到一半"
        }

        # 初始天气
        self._change_weather()

    # ---- 时间 ----

    def get_simulated_time(self):
        """返回当前模拟时间"""
        elapsed_real = (datetime.now() - self.simulation_start).total_seconds()
        elapsed_sim = elapsed_real / self.seconds_per_day
        self.simulated_day = max(1, int(elapsed_sim) + 1)
        return self.simulated_day

    def get_time_of_day(self):
        """返回当前时段名称"""
        hour = datetime.now().hour
        if 0 <= hour < 5: return "深夜"
        elif 5 <= hour < 7: return "凌晨"
        elif 7 <= hour < 9: return "清晨"
        elif 9 <= hour < 12: return "上午"
        elif 12 <= hour < 14: return "中午"
        elif 14 <= hour < 17: return "下午"
        elif 17 <= hour < 19: return "傍晚"
        elif 19 <= hour < 23: return "夜晚"
        else: return "深夜"

    # ---- 天气 ----

    def get_weather(self):
        """返回当前天气，偶尔自动切换"""
        self.weather_duration -= 1
        if self.weather_duration <= 0:
            self._change_weather()
        return self.weather

    def _change_weather(self):
        """随机切换天气"""
        self.weather = random.choice(self._weather_pool)
        self.weather_duration = random.randint(3, 12)  # 持续3-12轮对话

    def get_weather_description(self):
        """返回天气的自然语言描述"""
        descriptions = {
            "晴": "阳光从训练场的铁丝网漏进来，在地上划出整齐的格子。",
            "阴": "天是灰的。训练场的探照灯提前亮了，蓝光打在阴云上。",
            "小雨": "窗外下着小雨。雨滴打在阳台栏杆上，声音很轻。",
            "风": "风很大。窗帘被吹得鼓起来，又落下。"
        }
        return descriptions.get(self.weather, "")

    # ---- 地点事件 ----

    def get_location_event(self, location):
        """返回某个地点的当前事件"""
        return self.location_events.get(location, "")

    def set_location_event(self, location, event):
        """设置某个地点的事件（公共广播）"""
        self.location_events[location] = event

    # ---- 室友活动 ----

    def get_dorm_activities(self):
        """返回所有室友的当前活动"""
        return self.dorm_activities.copy()

    def set_dorm_activity(self, name, activity):
        """更新某个室友的活动"""
        if name in self.dorm_activities:
            self.dorm_activities[name] = activity

    # ---- 综合描述 ----

    def get_world_summary(self):
        """返回世界状态的综合描述"""
        day = self.get_simulated_time()
        time_of_day = self.get_time_of_day()
        weather = self.get_weather()
        weather_desc = self.get_weather_description()
        return f"开学第{day}天。{time_of_day}。{weather}。{weather_desc}"


# 全局单例
world = WorldState()