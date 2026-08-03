from flask import Blueprint, request, jsonify, session
from models import db
from models.conversation import Conversation
import json

chat_bp = Blueprint('chat', __name__)

def get_engine(char_id="lengxufan"):
    from services.engine_service import EngineService
    cache_key = f'_engine_{char_id}'
    if not hasattr(get_engine, cache_key):
        setattr(get_engine, cache_key, EngineService(char_id=char_id))
    return getattr(get_engine, cache_key)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get('message', '')
    char_id = data.get('char_id', 'lengxufan')

    if not user_input:
        return jsonify({"reply": "……（他沉默着，没有回答）"}), 400

    engine_svc = get_engine(char_id)
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
