from flask import Blueprint, jsonify
from services.engine_service import get_engine

state_bp = Blueprint('state', __name__)

@state_bp.route('/state', methods=['GET'])
def dev_state():
    return jsonify(get_engine("lengxufan").get_state_snapshot())
