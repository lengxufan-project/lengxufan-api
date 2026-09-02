"""持久化"""
import json, os, sys, time

# 将项目根目录加入 sys.path，从 paths.py 导入路径
_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)
from paths import SAVE_DIR

DEFAULT_STATE = {
    "emotion": 50.0, "memory": [], "episodic_memory": [],
    "autobiographical_memory": [], "relationship_milestones": [],
    "scheduled_memories": [],
    "status": {"shoulder_pain": False, "dream_streak": 0, "miss_wang": False, "holding_knife": False},
    "identity_state": {"wang_claim": False, "wang_belief": 0, "known_name": None, "trust_level": 30},
    "context": {"last_topic": None, "conversation_turns": 0},
    "simulated_day": 1, "last_time": time.time(),
    "pending_events": [], "pending_intents": [],
}

def get_save_path(char_id):
    return os.path.join(SAVE_DIR, f"save_{char_id}.json")

def save_full_state(state, char_id=None):
    filepath = get_save_path(char_id) if char_id else os.path.join(SAVE_DIR, "save.json")
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)

def load_full_state(char_id=None):
    filepath = get_save_path(char_id) if char_id else os.path.join(SAVE_DIR, "save.json")
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            state = json.load(f)
        return {**DEFAULT_STATE, **state}
    except:
        return None

def state_exists(char_id=None):
    filepath = get_save_path(char_id) if char_id else os.path.join(SAVE_DIR, "save.json")
    return os.path.exists(filepath)

def delete_state(char_id=None):
    filepath = get_save_path(char_id) if char_id else os.path.join(SAVE_DIR, "save.json")
    if os.path.exists(filepath):
        os.remove(filepath)