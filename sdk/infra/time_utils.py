"""时间工具"""
import time, math
from datetime import datetime, timedelta

SIMULATION_START = datetime(2026, 4, 1, 8, 0, 0)
SECONDS_PER_SIMULATED_DAY = 3600

def get_simulated_time():
    elapsed = time.time() - SIMULATION_START.timestamp()
    return SIMULATION_START + timedelta(seconds=(elapsed / SECONDS_PER_SIMULATED_DAY) * 86400)

def days_since(ts):
    if isinstance(ts, (int, float)): ts = datetime.fromtimestamp(ts)
    return (get_simulated_time() - ts).days

def relative_time(ts):
    d = days_since(ts)
    if d <= 0: return "今天"
    if d == 1: return "昨天"
    if d < 7: return f"{d}天前"
    if d < 30: return f"约{d//7}周前"
    if d < 365: return f"约{d//30}个月前"
    return f"约{d//365}年前"

def get_biorhythm_phase():
    return math.sin(((time.time() % 86400) - 14400) / 86400 * 2 * math.pi)