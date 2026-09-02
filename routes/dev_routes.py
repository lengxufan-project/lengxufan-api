from flask import Blueprint, jsonify, session
from api.router import router
from event_bus import bus
from world_state import world

dev_bp = Blueprint('dev', __name__)

@dev_bp.route('/dev/stats', methods=['GET'])
def dev_stats():
    """返回开发者统计信息：模型调用统计、事件总线状态、世界状态"""
    return jsonify({
        "model_router": router.get_status(),
        "event_bus": {
            "recent_events": bus.get_recent_events(10),
        },
        "world": {
            "day": world.get_simulated_time(),
            "time_of_day": world.get_time_of_day(),
            "weather": world.get_weather(),
        }
    })