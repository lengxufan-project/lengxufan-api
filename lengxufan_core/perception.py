"""感知模块"""
import random, time
from dataclasses import dataclass, field
from infra.time_utils import get_biorhythm_phase
from .character_data import EVENT_TEMPLATES, CAUSAL_CHAIN

def get_biorhythm():
    return 50.0 + get_biorhythm_phase() * 15.0

@dataclass
class EmotionalWeightDecay:
    base_weight: float
    event_year: int
    decay_rate: float = 0.9
    min_weight: float = 1.0
    current_year: int = 7
    @property
    def effective_weight(self):
        return max(self.base_weight * (self.decay_rate ** (self.current_year - self.event_year)), self.min_weight)
    def trigger_recall(self, multiplier=2.0):
        return min(self.base_weight, self.effective_weight * multiplier)

@dataclass
class Perception:
    emotion: float = 50.0
    status: dict = field(default_factory=lambda: {"shoulder_pain":False,"dream_streak":0,"miss_wang":False,"holding_knife":False})
    pending_events: list = field(default_factory=list)
    last_time: float = field(default_factory=time.time)
    simulated_day: int = 1
    _last_event: str = ""
    _pain_lingering: int = 0

    def advance_time(self):
        triggered = []
        now = time.time()
        elapsed = now - self.last_time
        self.last_time = now
        if elapsed < 10:
            return triggered

        ev = random.choice(list(EVENT_TEMPLATES.keys()))
        template = EVENT_TEMPLATES.get(ev)
        if template is None:
            return triggered

        # 1. 处理情绪变化
        if template.get("emotion_change"):
            self.emotion += template["emotion_change"]
            self.emotion = max(0, min(100, self.emotion))

        # 2. 处理状态变更
        for status_key, status_val in (template.get("status_set") or {}).items():
            if status_val == "increment":
                self.status[status_key] += 1
            else:
                self.status[status_key] = status_val

        # 3. 状态衰减
        for status_key, prob in (template.get("status_decay") or {}).items():
            if random.random() < prob:
                self.status[status_key] = False

        # 4. 额外触发条件
        extra = template.get("extra_trigger")
        if extra and self.status.get(extra["condition_field"], 0) >= extra["threshold"]:
            self.pending_events.append(extra["extra_description"])
            for k, v in (extra.get("extra_status") or {}).items():
                self.status[k] = v
            if extra.get("extra_emotion"):
                self.emotion += extra["extra_emotion"]
                self.emotion = max(0, min(100, self.emotion))
            triggered.append(extra["extra_description"])
        elif template.get("description"):
            self.pending_events.append(template["description"])
            triggered.append(template["description"])

        self._last_event = ev

        # 5. 自然衰减 + 节律靠拢
        if elapsed > 30:
            if self.emotion > 50: self.emotion -= 1
            elif self.emotion < 50: self.emotion += 1
            diff = get_biorhythm() - self.emotion
            self.emotion += diff * 0.2
            if self.status["dream_streak"] > 0 and random.random() < 0.2:
                self.status["dream_streak"] -= 1
            if self.status["miss_wang"] and random.random() < 0.3:
                self.status["miss_wang"] = False

        self.emotion = max(0, min(100, self.emotion))

        # 6. 因果链延续事件
        chain = CAUSAL_CHAIN.get(self._last_event, [])
        for link in chain:
            if link["condition"]:
                op, threshold = link["condition"]
                if op == "lt" and self.emotion >= threshold:
                    continue
                if op == "ge" and self.emotion < threshold:
                    continue
            if random.random() < link["probability"]:
                self.pending_events.append(link["description"])
                break

        # 7. 触痛后的低波动
        if self._pain_lingering > 0:
            self.emotion += random.uniform(-2, 2)
            self.emotion = max(0, min(100, self.emotion))
            self._pain_lingering -= 1

        return triggered

    def to_dict(self):
        return {"emotion":self.emotion,"status":self.status,"pending_events":self.pending_events,"last_time":self.last_time,"simulated_day":self.simulated_day}
    @classmethod
    def from_dict(cls, d):
        return cls(emotion=d.get("emotion",50),status=d.get("status",{"shoulder_pain":False,"dream_streak":0,"miss_wang":False,"holding_knife":False}),pending_events=d.get("pending_events",[]),last_time=d.get("last_time",time.time()),simulated_day=d.get("simulated_day",1))