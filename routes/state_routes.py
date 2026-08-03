from flask import Blueprint, jsonify

state_bp = Blueprint('state', __name__)

def get_engine():
    from services.engine_service import EngineService
    if not hasattr(get_engine, '_engine'):
        get_engine._engine = EngineService()
    return get_engine._engine

@state_bp.route('/state', methods=['GET'])
def dev_state():
    return jsonify(get_engine().get_state_snapshot())
