from flask import Blueprint, request, jsonify, session, Response, stream_with_context
from models import db, Conversation
from services.engine_service import get_engine, group_chat_manager
from characters import CharacterRegistry
import json
from infra.logger import info, error
import time

chat_bp = Blueprint('chat', __name__)


def _sse(payload):
    """格式化一条 SSE 事件。"""
    return "data: " + json.dumps(payload, ensure_ascii=False) + "\n\n"

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


@chat_bp.route('/chat/stream', methods=['POST'])
def chat_stream():
    """SSE 流式单角色对话。

    请求：{"message": "...", "char_id": "lengxufan"}
    响应（text/event-stream）：
        data: {"delta": "文本块"}\n\n
        ...
        data: {"done": true, "reply": "最终完整回复", "state": {...}}\n\n
    """
    data = request.get_json(silent=True) or {}
    user_input = (data.get('message') or '').strip()
    char_id = data.get('char_id', 'lengxufan')

    if not user_input:
        return jsonify({"error": "消息不能为空"}), 400

    engine_svc = get_engine(char_id)
    user_id = session.get('user_id')

    def generate():
        # 先持久化用户消息
        if user_id:
            db.session.add(Conversation(user_id=user_id, role='user', content=user_input))

        start_time = time.time()
        full_reply = ""
        stream = engine_svc.get_reply_stream(user_input)
        try:
            while True:
                try:
                    chunk = next(stream)
                except StopIteration as stop:
                    # 生成器返回值 = 最终完整回复（含动作描写/内心独白）
                    full_reply = stop.value or ""
                    break
                if chunk:
                    yield _sse({"delta": chunk})
        except Exception as e:
            error(f"[ChatStream] 流式生成异常: {e}")
            yield _sse({"error": "流式响应中断"})

        elapsed = time.time() - start_time
        model_used = engine_svc.engine.model_router.get_status().get("current_model", "unknown")
        info(f"[ChatStream] char={char_id} model={model_used} elapsed={elapsed:.2f}s")

        state = engine_svc.get_state_snapshot()
        reply_text = full_reply.strip()

        if user_id and reply_text:
            db.session.add(Conversation(
                user_id=user_id, role='lxf', content=reply_text,
                state_snapshot=json.dumps(state, ensure_ascii=False),
            ))
            db.session.commit()

        yield _sse({"done": True, "reply": reply_text, "state": state})

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
        },
    )


@chat_bp.route('/group_chat', methods=['POST'])
def group_chat():
    data = request.get_json()
    user_input = data.get('message', '')
    if not user_input:
        return jsonify({"error": "消息不能为空"}), 400

    CharacterRegistry.load_all()
    all_chars = CharacterRegistry.list_characters()
    group_chat_manager.set_members(all_chars)

    # 为每个成员设置插话概率和状态摘要
    for char_id in all_chars:
        try:
            engine = get_engine(char_id)
            prob = engine.char_config.persona.get("interrupt_probability", 0.2)
            group_chat_manager.set_interrupt_probability(char_id, prob)
            snapshot = engine.get_state_snapshot()
            group_chat_manager.set_member_state(char_id, {
                "name": engine.char_config.name,
                "emotion_label": snapshot.get("emotion_label", "平静"),
                "relationship": snapshot.get("relationship", "陌生人"),
            })
        except Exception:
            pass

    replies = []
    group_chat_manager.clear_context()
    status_context = group_chat_manager.get_status_context()

    for char_id in group_chat_manager.members:
        try:
            engine = get_engine(char_id)
            ctx = group_chat_manager.get_context()
            full_ctx = "其他成员当前状态：\n" + status_context + "\n\n群聊对话：\n" + ctx
            reply = engine.group_reply(user_input, group_context=full_ctx)
            char_name = engine.char_config.name
            group_chat_manager.record_reply(char_name, reply)
            replies.append({"char_id": char_id, "name": char_name, "reply": reply, "type": "normal"})
        except Exception as e:
            replies.append({"char_id": char_id, "name": char_id, "reply": "（出错：{}）".format(e), "type": "normal"})

    # 主动插话
    interrupt_candidate = group_chat_manager.select_interrupt_candidate()
    if interrupt_candidate:
        try:
            engine = get_engine(interrupt_candidate)
            full_ctx2 = "其他成员当前状态：\n" + status_context + "\n\n群聊对话：\n" + group_chat_manager.get_context()
            interrupt_reply = engine.group_reply("（你突然想插一句话。只简短回应群聊里最近的话题，不要重复你刚才已经说过的话，也不要用长句。）", group_context=full_ctx2)
            char_name2 = engine.char_config.name
            group_chat_manager.record_reply(char_name2, interrupt_reply)
            replies.append({"char_id": interrupt_candidate, "name": char_name2, "reply": interrupt_reply, "type": "interrupt"})
        except Exception:
            pass

    return jsonify({"replies": replies})