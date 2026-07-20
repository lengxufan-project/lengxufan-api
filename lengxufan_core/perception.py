"""感知模块"""
import random, time
from dataclasses import dataclass, field
from infra.time_utils import get_biorhythm_phase

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

    def advance_time(self):
        triggered = []
        now = time.time()
        elapsed = now - self.last_time
        self.last_time = now
        if elapsed < 10: return triggered
        ev = random.choice(["nothing","dream","pain","footsteps","silence","clean_knife","look_wristband","balcony","think_wang"])
        if ev == "dream":
            self.status["dream_streak"] += 1
            self.emotion = max(0, self.emotion - 15)
            if self.status["dream_streak"] >= 3:
                self.pending_events.append("（连续梦到妈妈，握着塑料刀很久没动。）")
                self.status["holding_knife"] = True
                self.emotion = max(0, self.emotion - 10)
            else: self.pending_events.append("（昨晚又梦到了妈妈。）")
            triggered.append(self.pending_events[-1])
        elif ev == "pain":
            self.status["shoulder_pain"] = True
            self.emotion = max(0, self.emotion - 5)
            self.pending_events.append("（左肩疼了一整夜。）")
            triggered.append(self.pending_events[-1])
        elif ev == "footsteps":
            self.status["miss_wang"] = True
            self.emotion = max(0, self.emotion - 3)
            self.pending_events.append("（凌晨听到脚步声，不是他。）")
            triggered.append(self.pending_events[-1])
        elif ev == "silence":
            if self.emotion < 50: self.emotion = min(85, self.emotion + 2)
            if self.status["shoulder_pain"] and random.random() < 0.3: self.status["shoulder_pain"] = False
            self.pending_events.append("（一个人坐了很长时间。）")
            triggered.append(self.pending_events[-1])
        elif ev == "clean_knife":
            self.emotion = max(0, self.emotion - 2)
            self.pending_events.append("（擦了很久的塑料刀。）")
            triggered.append(self.pending_events[-1])
        elif ev == "look_wristband":
            self.emotion = min(85, self.emotion + 3)
            self.pending_events.append("（手指在护腕上蹭了一下。）")
            triggered.append(self.pending_events[-1])
        elif ev == "balcony":
            self.emotion = max(0, self.emotion - 1)
            self.pending_events.append("（独自站在阳台上。）")
            triggered.append(self.pending_events[-1])
        elif ev == "think_wang":
            self.status["miss_wang"] = True
            self.emotion = min(85, self.emotion + 5)
            self.pending_events.append("（盯着陆华望的空床位。）")
            triggered.append(self.pending_events[-1])
        if elapsed > 30:
            if self.emotion > 50: self.emotion -= 1
            elif self.emotion < 50: self.emotion += 1
            diff = get_biorhythm() - self.emotion
            self.emotion += diff * 0.2
            if self.status["dream_streak"] > 0 and random.random() < 0.2: self.status["dream_streak"] -= 1
            if self.status["miss_wang"] and random.random() < 0.3: self.status["miss_wang"] = False
        self.emotion = max(0, min(100, self.emotion))
        return triggered

    def to_dict(self):
        return {"emotion":self.emotion,"status":self.status,"pending_events":self.pending_events,"last_time":self.last_time,"simulated_day":self.simulated_day}
    @classmethod
    def from_dict(cls, d):
        return cls(emotion=d.get("emotion",50),status=d.get("status",{"shoulder_pain":False,"dream_streak":0,"miss_wang":False,"holding_knife":False}),pending_events=d.get("pending_events",[]),last_time=d.get("last_time",time.time()),simulated_day=d.get("simulated_day",1))