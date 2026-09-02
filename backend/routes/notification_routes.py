from flask import Blueprint, jsonify
from world_state import world
from event_bus import bus

notif_bp = Blueprint('notifications', __name__)


@notif_bp.route('/notifications', methods=['GET'])
def get_notifications():
    # system 通知：从 event_bus 中筛选系统类事件
    system_events = []
    recent = bus.get_recent_events(20)
    for ev in recent:
        ev_type = ev.get("type", "")
        # 系统事件特征：以 "system." 开头或包含 "system" 的事件类型
        if ev_type.startswith("system.") or "system" in ev_type.lower():
            system_events.append({
                "type": ev_type,
                "data": ev.get("data", {}),
                "timestamp": ev.get("timestamp", "")
            })

    # activities：从 world_state 的 dorm_activities 获取
    activities = []
    dorm = world.get_dorm_activities()
    for name, activity in dorm.items():
        activities.append({
            "name": name,
            "activity": activity
        })

    # 如果 event_bus 中有角色动作事件，也加入 activities
    for ev in recent:
        ev_type = ev.get("type", "")
        if ".action" in ev_type:
            char_name = ev_type.split(".")[0] if "." in ev_type else ""
            action = ev.get("data", {}).get("action", "")
            if char_name and action:
                # 避免重复
                if not any(a.get("name") == char_name and a.get("activity") == action for a in activities):
                    activities.append({
                        "name": char_name,
                        "activity": action
                    })

    return jsonify({
        "system": system_events,
        "activities": activities
    })