"""统一事件流接口 - GET /api/events?type=activity|system|memory"""
from flask import Blueprint, jsonify, request
from world_state import world
from event_bus import bus
from characters import CharacterRegistry
from services.engine_service import get_engine_memories, get_cached_engine

events_bp = Blueprint('events', __name__)


@events_bp.route('/events', methods=['GET'])
def get_events():
    event_type = request.args.get('type', 'activity')

    if event_type == 'activity':
        events = _collect_activities()
    elif event_type == 'system':
        events = _collect_system_events()
    elif event_type == 'memory':
        events = _collect_memories()
    else:
        return jsonify({"events": []}), 400

    return jsonify({"events": events})


def _collect_activities():
    """从 dorm_activities 和 event_bus 收集活动事件"""
    events = []
    seen = set()

    # 1. 从 world_state.dorm_activities 获取
    dorm = world.get_dorm_activities()
    for name, activity in dorm.items():
        eid = f"act_{name}_{activity[:20]}"
        seen.add(eid)
        events.append({
            "id": eid,
            "type": "activity",
            "character_id": name,
            "character_name": name,
            "content": activity,
            "emotion_label": None,
            "created_at": ""
        })

    # 2. 从 event_bus 补充角色动作事件
    recent = bus.get_recent_events(30)
    for ev in recent:
        ev_type = ev.get("type", "")
        if ".action" not in ev_type:
            continue
        char_name = ev_type.split(".")[0] if "." in ev_type else ""
        action = ev.get("data", {}).get("action", "")
        if not char_name or not action:
            continue
        eid = f"act_{char_name}_{action[:20]}"
        if eid in seen:
            continue
        seen.add(eid)
        events.append({
            "id": eid,
            "type": "activity",
            "character_id": char_name,
            "character_name": char_name,
            "content": action,
            "emotion_label": ev.get("data", {}).get("emotion_label"),
            "created_at": ""
        })

    # 3. 兜底占位数据
    if not events:
        events.append({
            "id": "stub_activity_1",
            "type": "activity",
            "character_id": "",
            "character_name": "",
            "content": "室内很安静",
            "emotion_label": None,
            "created_at": ""
        })

    return events


def _collect_system_events():
    """从 event_bus 收集系统事件"""
    events = []
    recent = bus.get_recent_events(30)
    for ev in recent:
        ev_type = ev.get("type", "")
        data = ev.get("data", {})
        # 系统类事件：以 system. 开头或含 system 关键词
        if ev_type.startswith("system.") or "system" in ev_type.lower():
            events.append({
                "id": f"sys_{ev_type}_{hash(str(data))}",
                "type": "system",
                "character_id": None,
                "character_name": None,
                "content": data.get("message", data.get("content", ev_type)),
                "emotion_label": None,
                "created_at": data.get("timestamp", "")
            })

    # 兜底占位
    if not events:
        events.append({
            "id": "stub_system_1",
            "type": "system",
            "character_id": None,
            "character_name": None,
            "content": "系统运行中，暂无新通知",
            "emotion_label": None,
            "created_at": ""
        })

    return events


def _collect_memories():
    """从所有已加载角色的引擎收集记忆碎片"""
    events = []
    seen = set()

    # 遍历所有已注册的角色
    CharacterRegistry.load_all()
    for char_id in CharacterRegistry.list_characters():
        engine = get_cached_engine(char_id)
        if not engine or not engine.memory:
            continue
        char_name = engine.char_config.name if engine.char_config else char_id
        for ep in engine.memory.episodic:
            ep_summary = ep.get("summary", "")
            ep_ts = ep.get("timestamp", 0)
            eid = f"mem_{char_id}_{int(ep_ts * 1000)}" if ep_ts else f"mem_{char_id}_{hash(ep_summary)}"
            if eid in seen:
                continue
            seen.add(eid)
            events.append({
                "id": eid,
                "type": "memory",
                "character_id": char_id,
                "character_name": char_name,
                "content": ep_summary,
                "emotion_label": None,
                "created_at": ep_ts
            })

    # 兜底占位
    if not events:
        events.append({
            "id": "stub_memory_1",
            "type": "memory",
            "character_id": None,
            "character_name": "系统",
            "content": "回忆碎片尚未生成，请与角色多对话以触发记忆记录",
            "emotion_label": None,
            "created_at": ""
        })

    return events