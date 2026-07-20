"""时空校准 (P1预置)"""
from dataclasses import dataclass, field

@dataclass
class SpaceTimeContext:
    current_location: str = "307室"
    nearby_characters: list = field(default_factory=list)
    time_of_day_description: str = ""
    def update_location(self, loc): self.current_location = loc
    def get_prompt_context(self): return f"你所在的位置：{self.current_location}。" + (f" {self.time_of_day_description}" if self.time_of_day_description else "")

spacetime_context = SpaceTimeContext()