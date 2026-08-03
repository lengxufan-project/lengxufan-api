from flask import Blueprint, request, jsonify, session
from models import db
from models.conversation import Conversation
import json

chat_bp = Blueprint('chat', __name__)

# 延迟导入 engine_service 以避免循环依赖
def get_engine():
    from services.engine_service import EngineService
    if not hasattr(get_engine, '_engine'):
        get_engine._engine = EngineService()
    return get_engine._engine

@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get('message', '')
    if not user_input: return jsonify({"reply": "……（他沉默着，没有回答）"}), 400

    engine_svc = get_engine()
    user_id = session.get('user_id')
    if user_id:
        user_msg = Conversation(user_id=user_id, role='user', content=user_input)
        db.session.add(user_msg)

    reply_text = engine_svc.get_reply(user_input).strip()
    state = engine_svc.get_state_snapshot()

    if user_id:
        lxf_msg = Conversation(user_id=user_id, role='lxf', content=reply_text,
                               state_snapshot=json.dumps(state, ensure_ascii=False))
        db.session.add(lxf_msg)
        db.session.commit()

    return jsonify({"reply": reply_text, "state": state})
