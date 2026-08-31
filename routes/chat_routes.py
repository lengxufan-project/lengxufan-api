from flask import Blueprint, request, jsonify, session
from models import db
from models import Conversation
import json
from infra.logger import info
from characters import CharacterRegistry
import time
from services.engine_service import get_engine

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get('message', '')
    char_id = data.get('char_id', 'lengxufan')
    group_context = data.get('group_context', '')

    if not user_input:
        return jsonify({"reply": "……（他沉默着，没有回答）"}), 400

    engine_svc = get_engine(char_id)
    user_id = session.get('user_id')
    if user_id:
        user_msg = Conversation(user_id=user_id, role='user', content=user_input)
        db.session.add(user_msg)

    start_time = time.time()
    reply_text = engine_svc.group_reply(user_input, group_context=group_context).strip()
    elapsed = time.time() - start_time
    model_used = engine_svc.engine.model_router.get_status().get("current_model", "unknown")
    info(f"[Chat] char={char_id} model={model_used} elapsed={elapsed:.2f}s")
    state = engine_svc.get_state_snapshot()

    if user_id:
        lxf_msg = Conversation(user_id=user_id, role='lxf', content=reply_text,
                               state_snapshot=json.dumps(state, ensure_ascii=False))
        db.session.add(lxf_msg)
        db.session.commit()

    return jsonify({"reply": reply_text, "state": state})

@chat_bp.route('/group_chat', methods=['POST'])
def group_chat():
    data = request.get_json()
    user_input = data.get('message', '')
    if not user_input:
        return jsonify({"error": "消息不能为空"}), 400

    from services.engine_service import group_chat_manager

    # 设置群聊参与者（默认包含所有已注册角色）
    CharacterRegistry.load_all()
    all_chars = CharacterRegistry.list_characters()
    group_chat_manager.set_members(all_chars)

    replies = []
    group_chat_manager.clear_context()

    for char_id in group_chat_manager.members:
        try:
            engine = get_engine(char_id)
            # 获取当前上下文
            ctx = group_chat_manager.get_context()
            reply = engine.group_reply(user_input, group_context=ctx)
            # 记录回复
            char_name = engine.char_config.name
            group_chat_manager.record_reply(char_name, reply)
            replies.append({"char_id": char_id, "name": char_name, "reply": reply})
        except Exception as e:
            replies.append({"char_id": char_id, "name": char_id, "reply": f"（出错：{e}）"})

    return jsonify({"replies": replies})