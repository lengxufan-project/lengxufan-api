"""持久化"""
import json, os, time

SAVE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
SAVE_FILE = os.path.join(SAVE_DIR, "save.json")
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

def save_full_state(state, filepath=SAVE_FILE):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f: json.dump(state, f, ensure_ascii=False, indent=2)

def load_full_state(filepath=SAVE_FILE):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            state = json.load(f)
        return {**DEFAULT_STATE, **state}
    except: return None

def state_exists(filepath=SAVE_FILE): return os.path.exists(filepath)
def delete_state(filepath=SAVE_FILE):
    if os.path.exists(filepath): os.remove(filepath)